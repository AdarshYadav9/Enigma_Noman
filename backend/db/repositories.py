import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from db.supabase_client import get_supabase_client
from config import logger

# In-memory fallback stores for offline testing / graceful fallback
_in_memory_profiles: Dict[str, Dict[str, Any]] = {}
_in_memory_history: Dict[str, List[Dict[str, Any]]] = {}

def get_profile_by_firebase_uid(firebase_uid: str) -> Optional[Dict[str, Any]]:
    """Retrieve user health profile by Firebase UID."""
    client = get_supabase_client()
    if client:
        try:
            res = client.table("user_health_profiles").select("*").eq("firebase_uid", firebase_uid).execute()
            if res.data and len(res.data) > 0:
                return res.data[0]
        except Exception as e:
            logger.warning(f"Supabase query failed, falling back to local cache: {e}")

    return _in_memory_profiles.get(firebase_uid)

def create_or_update_profile(firebase_uid: str, profile_dict: Dict[str, Any]) -> Dict[str, Any]:
    """Create or update a health profile for the given Firebase UID."""
    now_iso = datetime.now(timezone.utc).isoformat()
    clean_data = {
        "firebase_uid": firebase_uid,
        "age": profile_dict.get("age"),
        "height_cm": profile_dict.get("height_cm"),
        "allergies": profile_dict.get("allergies", []),
        "conditions": profile_dict.get("conditions", []),
        "diseases": profile_dict.get("diseases", []),
        "health_issues": profile_dict.get("health_issues", []),
        "dietary_restrictions": profile_dict.get("dietary_restrictions", []),
        "health_restrictions": profile_dict.get("health_restrictions", []),
        "doctor_advised_restrictions": profile_dict.get("doctor_advised_restrictions", []),
        "updated_at": now_iso
    }

    client = get_supabase_client()
    if client:
        try:
            # Check existing
            existing = client.table("user_health_profiles").select("id").eq("firebase_uid", firebase_uid).execute()
            if existing.data and len(existing.data) > 0:
                res = client.table("user_health_profiles").update(clean_data).eq("firebase_uid", firebase_uid).execute()
                if res.data:
                    return res.data[0]
            else:
                clean_data["created_at"] = now_iso
                clean_data["id"] = str(uuid.uuid4())
                res = client.table("user_health_profiles").insert(clean_data).execute()
                if res.data:
                    return res.data[0]
        except Exception as e:
            logger.warning(f"Supabase write failed, falling back to local cache: {e}")

    # Fallback to in-memory store
    if firebase_uid in _in_memory_profiles:
        _in_memory_profiles[firebase_uid].update(clean_data)
    else:
        clean_data["id"] = str(uuid.uuid4())
        clean_data["created_at"] = now_iso
        _in_memory_profiles[firebase_uid] = clean_data

    return _in_memory_profiles[firebase_uid]

def delete_profile(firebase_uid: str) -> bool:
    """Delete a user health profile."""
    client = get_supabase_client()
    deleted = False
    if client:
        try:
            res = client.table("user_health_profiles").delete().eq("firebase_uid", firebase_uid).execute()
            deleted = True
        except Exception as e:
            logger.warning(f"Supabase delete failed: {e}")

    if firebase_uid in _in_memory_profiles:
        del _in_memory_profiles[firebase_uid]
        deleted = True

    return deleted

def save_food_history(
    firebase_uid: str,
    input_mode: str,
    food_source: str,
    food_name: Optional[str],
    normalized_food_name: Optional[str],
    confidence: float,
    risk_level: str,
    risk_score: Optional[int],
    result_json: Dict[str, Any],
    source_image_path: Optional[str] = None
) -> Dict[str, Any]:
    """Persist food analysis into food_analysis_history."""
    record_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()
    record = {
        "id": record_id,
        "firebase_uid": firebase_uid,
        "input_mode": input_mode,
        "food_source": food_source,
        "food_name": food_name,
        "normalized_food_name": normalized_food_name,
        "confidence": confidence,
        "risk_level": risk_level,
        "risk_score": risk_score,
        "result_json": result_json,
        "source_image_path": source_image_path,
        "created_at": now_iso
    }

    client = get_supabase_client()
    if client:
        try:
            res = client.table("food_analysis_history").insert(record).execute()
            if res.data:
                return res.data[0]
        except Exception as e:
            logger.warning(f"Supabase history insert failed: {e}")

    if firebase_uid not in _in_memory_history:
        _in_memory_history[firebase_uid] = []
    _in_memory_history[firebase_uid].insert(0, record)
    return record

def get_food_history(firebase_uid: str, limit: int = 20, offset: int = 0) -> List[Dict[str, Any]]:
    """Retrieve food analysis history for a user, sorted descending by created_at."""
    client = get_supabase_client()
    if client:
        try:
            res = (
                client.table("food_analysis_history")
                .select("*")
                .eq("firebase_uid", firebase_uid)
                .order("created_at", desc=True)
                .range(offset, offset + limit - 1)
                .execute()
            )
            if res.data:
                return res.data
        except Exception as e:
            logger.warning(f"Supabase history fetch failed: {e}")

    user_hist = _in_memory_history.get(firebase_uid, [])
    return user_hist[offset : offset + limit]

def get_food_history_item(firebase_uid: str, analysis_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve a specific history record by analysis_id belonging to the user."""
    client = get_supabase_client()
    if client:
        try:
            res = (
                client.table("food_analysis_history")
                .select("*")
                .eq("firebase_uid", firebase_uid)
                .eq("id", analysis_id)
                .execute()
            )
            if res.data and len(res.data) > 0:
                return res.data[0]
        except Exception as e:
            logger.warning(f"Supabase history item fetch failed: {e}")

    user_hist = _in_memory_history.get(firebase_uid, [])
    for item in user_hist:
        if item.get("id") == analysis_id:
            return item
    return None
