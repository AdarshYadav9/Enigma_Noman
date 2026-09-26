import os
import re
import tempfile
from typing import Optional, Dict, Any, Tuple
from fastapi import UploadFile, HTTPException

from sarvamai import SarvamAI
from config import SARVAM_API_KEY, logger
from services.food_service import (
    normalize_food_name,
    resolve_food_alias,
    get_dishes_db,
    calculate_food_confidence
)

# Supported audio extensions
ALLOWED_AUDIO_EXTENSIONS = {".wav", ".mp3", ".m4a", ".ogg", ".webm", ".flac", ".aac"}
MAX_AUDIO_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

def extract_food_phrase(transcript: str) -> Tuple[Optional[str], float, Optional[str]]:
    """
    Extracts food item name and inferred food source from English speech transcript.
    Tailored specifically for English speech input with Sarvam AI.
    Returns (normalized_food_name, confidence, detected_source).
    """
    if not transcript or not transcript.strip():
        return None, 0.0, None

    text_lower = transcript.lower().strip()

    # Detect food source hints from transcript
    detected_source = None
    if any(w in text_lower for w in ["restaurant", "hotel", "cafe", "dhaba", "order", "takeout", "dined"]):
        detected_source = "restaurant"
    elif any(w in text_lower for w in ["home", "homemade", "cooked", "kitchen", "mom", "made"]):
        detected_source = "home"
    elif any(w in text_lower for w in ["packet", "packaged", "chips", "biscuit", "box", "bar", "can"]):
        detected_source = "packaged"

    dishes_db = get_dishes_db()

    # 1. First, search for exact multi-word canonical dish matches (e.g. "paneer butter masala", "dal makhani")
    sorted_dishes = sorted(dishes_db.keys(), key=lambda d: len(d), reverse=True)
    for dish_name in sorted_dishes:
        if re.search(r'\b' + re.escape(dish_name) + r'\b', text_lower):
            return dish_name, 0.95, detected_source

    # Check via food aliases (e.g. "samosas", "rotis", "butter paneer")
    from services.food_service import _food_aliases
    for canonical, aliases in _food_aliases.items():
        if canonical in dishes_db:
            for alias in aliases:
                if len(alias) >= 3 and re.search(r'\b' + re.escape(alias) + r'\b', text_lower):
                    return canonical, 0.95, detected_source

    # 2. Strip comprehensive English carrier phrases & prefixes
    cleaned = text_lower

    english_prefixes = [
        r"^(?:i\s+(?:am\s+|'m\s+)?(?:eating|having|drinking)\s+)",
        r"^(?:i\s+(?:just\s+)?(?:had|ate|drank|consumed|ordered|cooked|made|took)\s+)",
        r"^(?:i\s+(?:would\s+like|want)\s+to\s+(?:eat|have|drink|order)\s+)",
        r"^(?:can\s+i\s+(?:have|eat|get|take)\s+)",
        r"^(?:please\s+give\s+me\s+)",
        r"^(?:give\s+me\s+)",
        r"^(?:just\s+had\s+)",
        r"^(?:having\s+)",
        r"^(?:eating\s+)",
        r"^(?:drinking\s+)",
        r"^(?:ordered\s+)",
        r"^(?:today\s+(?:i\s+had|i\s+ate)\s+)",
        r"^(?:a\s+plate\s+of|a\s+bowl\s+of|a\s+cup\s+of|a\s+glass\s+of|a\s+portion\s+of|a\s+serving\s+of)\s+",
        r"^(?:one|two|three|four|five|1|2|3|4|5|a|an|some|a\s+couple\s+of)\s+",
        r"^(?:mujhe|humko|aaj|main|mera)\s+"
    ]

    english_suffixes = [
        r"\s+(?:for\s+(?:lunch|dinner|breakfast|snack|supper|brunch|me))$",
        r"\s+(?:today|tonight|this\s+morning|this\s+afternoon|this\s+evening)$",
        r"\s+(?:please|thanks|thank\s+you)$",
        r"\s+(?:with\s+(?:my\s+)?(?:family|friends|colleagues))$",
        r"\s+(?:at\s+(?:home|work|office|restaurant|hotel|the\s+dhaba))$",
        r"\s+(?:khana hai|chahiye)$"
    ]

    for _ in range(3):
        prev = cleaned
        for pat in english_prefixes:
            cleaned = re.sub(pat, '', cleaned).strip()
        for pat in english_suffixes:
            cleaned = re.sub(pat, '', cleaned).strip()
        if cleaned == prev:
            break

    candidate_food = normalize_food_name(cleaned)
    if candidate_food:
        # Check alias
        matched_dish, conf = resolve_food_alias(candidate_food)
        if matched_dish and conf >= 0.60:
            return matched_dish, max(conf, 0.90), detected_source
        
        # Check singular form if word ends in 's'
        if candidate_food.endswith('s') and len(candidate_food) > 3:
            singular = candidate_food[:-1]
            matched_singular, s_conf = resolve_food_alias(singular)
            if matched_singular and s_conf >= 0.60:
                return matched_singular, max(s_conf, 0.90), detected_source

        # Check direct lookup or partial confidence
        if candidate_food in dishes_db:
            return candidate_food, 0.95, detected_source
        elif conf >= 0.40:
            return candidate_food, conf, detected_source
        else:
            return candidate_food, 0.70, detected_source

    return None, 0.20, detected_source

async def transcribe_audio_sarvam(upload_file: UploadFile) -> Tuple[Optional[str], Optional[Dict[str, Any]]]:
    """
    Validates audio file and transcribes using Sarvam AI saaras:v3 model.
    Configured specifically for English speech input (language_code='en-IN').
    Cleans up temporary file immediately after transcription.
    Never stores audio permanently.
    Returns (transcript, error_dict).
    """
    if not SARVAM_API_KEY:
        logger.warning("SARVAM_API_KEY is not configured in backend environment.")
        return None, {
            "status": "external_api_error",
            "service": "sarvam",
            "message": "Voice transcription service key is not configured on this server."
        }

    # Validate filename extension
    filename = upload_file.filename or "audio.wav"
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_AUDIO_EXTENSIONS:
        return None, {
            "status": "validation_error",
            "service": "sarvam",
            "message": f"Unsupported audio file format '{ext}'. Allowed: {', '.join(ALLOWED_AUDIO_EXTENSIONS)}"
        }

    # Read audio bytes & validate size
    contents = await upload_file.read()
    if len(contents) > MAX_AUDIO_SIZE_BYTES:
        return None, {
            "status": "validation_error",
            "service": "sarvam",
            "message": f"Audio file too large ({len(contents)} bytes). Maximum allowed size is 10 MB."
        }
    if len(contents) == 0:
        return None, {
            "status": "validation_error",
            "service": "sarvam",
            "message": "Uploaded audio file is empty."
        }

    # Save to ephemeral temp file
    temp_file_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as temp_audio:
            temp_audio.write(contents)
            temp_file_path = temp_audio.name

        client = SarvamAI(api_subscription_key=SARVAM_API_KEY)
        
        with open(temp_file_path, "rb") as f:
            response = client.speech_to_text.transcribe(
                file=f,
                model="saaras:v3",
                mode="transcribe",
                language_code="en-IN"  # Enforce English transcription
            )

        transcript = response.transcript if hasattr(response, "transcript") else str(response)
        return transcript.strip(), None

    except Exception as e:
        logger.error(f"Sarvam AI transcription failure: {e}")
        return None, {
            "status": "external_api_error",
            "service": "sarvam",
            "message": "Voice transcription is temporarily unavailable."
        }
    finally:
        # Guarantee removal of raw audio recording
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
            except Exception as e:
                logger.warning(f"Failed to delete temp audio file {temp_file_path}: {e}")
