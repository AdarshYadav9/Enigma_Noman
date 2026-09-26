import base64
import re
import shutil
import platform
from io import BytesIO
from typing import List, Tuple, Dict, Any, Optional

import pkgutil
if not hasattr(pkgutil, 'find_loader'):
    import importlib.util
    pkgutil.find_loader = importlib.util.find_spec

import pytesseract
from PIL import Image, ImageOps, ImageEnhance

# Auto-detect tesseract binary path
if platform.system() == "Windows":
    pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
else:
    tesseract_path = shutil.which('tesseract') or '/opt/homebrew/bin/tesseract' or '/usr/bin/tesseract'
    if tesseract_path:
        pytesseract.pytesseract.tesseract_cmd = tesseract_path

def preprocess_image(image_base64: str) -> Image.Image:
    """
    Decodes base64 image data, corrects EXIF orientation, converts to RGB,
    and scales to an optimal resolution for OCR.
    """
    if "," in image_base64:
        image_base64 = image_base64.split(",")[1]
    
    # Strip any whitespace
    image_base64 = re.sub(r'\s+', '', image_base64)
    image_data = base64.b64decode(image_base64)
    image = Image.open(BytesIO(image_data))

    # Correct orientation from mobile camera EXIF metadata
    try:
        image = ImageOps.exif_transpose(image)
    except Exception:
        pass

    # Ensure standard RGB mode
    if image.mode != "RGB":
        image = image.convert("RGB")

    # Scale to optimal resolution for Tesseract (between 1200px and 2800px on the longest edge)
    w, h = image.size
    max_dim = max(w, h)
    if max_dim < 1000 and max_dim > 0:
        scale = 1400.0 / max_dim
        image = image.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)
    elif max_dim > 3000:
        scale = 2600.0 / max_dim
        image = image.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)

    return image

def parse_label_text(text: str) -> Tuple[Optional[str], List[str], Dict[str, float]]:
    """
    Parses OCR text to extract:
    1. Product Name (if detected in the header)
    2. List of ingredients
    3. Nutrition facts dictionary
    """
    text_clean = text.replace('\r\n', '\n').replace('\r', '\n')
    lines = [l.strip() for l in text_clean.split('\n') if l.strip()]

    # 1. Product / Label Name detection
    product_name = None
    for l in lines[:4]:
        # Look for short title lines before ingredients/nutrition headers
        if (
            3 < len(l) < 50 
            and not re.search(r'(ingredients|nutrition|mfg|manufactured|batch|net\s+wt|contains|best\s+before|fssai)', l, re.I)
        ):
            # Clean leading/trailing punctuation
            cleaned_title = re.sub(r'^[^\w]+|[^\w]+$', '', l).strip()
            if len(cleaned_title) > 3:
                product_name = cleaned_title
                break

    # 2. Extract Ingredients
    ingredients: List[str] = []
    
    # Search for an explicit ingredient heading block
    heading_match = re.search(
        r'(?:ingredients?|contains|composition|key\s+ingredients?|active\s+ingredients?)\s*[:\.\-—]?\s*(.*?)(?=(?:nutrition|nutritional\s+information|nutritional\s+facts|mfg|manufactured|best\s+before|use\s+by|net\s+wt|batch\s+no|pkg|fssai|marketed\s+by|customer\s+care|\Z))',
        text_clean,
        re.IGNORECASE | re.DOTALL
    )

    ing_text = ""
    if heading_match:
        ing_text = heading_match.group(1).strip()
    else:
        # Fallback: Find lines that contain comma-separated food words
        candidate_lines = []
        for l in lines:
            if ',' in l and not re.search(r'(mfg|licence|address|customer|tel|email|fax|road|floor|dist)', l, re.I):
                candidate_lines.append(l)
        ing_text = ' '.join(candidate_lines)

    if ing_text:
        # Split on comma or semicolon outside parentheses
        raw_items = re.split(r'[,;](?![^\(\[]*[\)\]])', ing_text)
        for item in raw_items:
            # Also handle newline splits if items were on separate lines
            sub_items = item.split('\n')
            for sub in sub_items:
                # Remove percentages like (44%) or (0.5%)
                c = re.sub(r'\s*\(\d+(?:\.\d+)?%\)', '', sub)
                # Trim leading/trailing punctuation
                c = re.sub(r'^[^\w\(\[]+|[^\w\)\]]+$', '', c).strip()
                # Strip leading prefixes like "and", "contains:", "contains"
                c = re.sub(r'^(and\s+|contains\s*[:\-]?\s*)', '', c, flags=re.I).strip()
                # Remove numbering like "1." or "2)"
                c = re.sub(r'^\d+[\.\)]\s*', '', c)
                
                # Check for minimum length and ignore common non-ingredient metadata
                if (
                    len(c) >= 2 
                    and not re.search(r'^(net\s+wt|mfg|batch|best\s+before|exp\s+date|store\s+in|keep\s+in|fssai|lic)', c, re.I)
                ):
                    if c not in ingredients:
                        ingredients.append(c)

    # 3. Nutrition Extraction
    nutrition: Dict[str, float] = {}

    m = re.search(r'sodium[\s\:\.\-]+(\d+(?:\.\d+)?)\s*(mg)?', text_clean, re.I)
    if m:
        nutrition['sodium_mg'] = float(m.group(1))

    m = re.search(r'(?:energy|calories?)[\s\:\.\-]+(\d+(?:\.\d+)?)\s*(kcal|cal)?', text_clean, re.I)
    if m:
        nutrition['calories'] = float(m.group(1))

    m = re.search(r'(?:carbohydrates?|carbs?)[\s\:\.\-]+(\d+(?:\.\d+)?)\s*g?', text_clean, re.I)
    if m:
        nutrition['carbs_g'] = float(m.group(1))

    m = re.search(r'(?:total\s+sugars?|sugars?)[\s\:\.\-]+(\d+(?:\.\d+)?)\s*g?', text_clean, re.I)
    if m:
        nutrition['sugar_g'] = float(m.group(1))

    m = re.search(r'(?:total\s+fat|fat)[\s\:\.\-]+(\d+(?:\.\d+)?)\s*g?', text_clean, re.I)
    if m:
        nutrition['fat_g'] = float(m.group(1))

    m = re.search(r'protein[\s\:\.\-]+(\d+(?:\.\d+)?)\s*g?', text_clean, re.I)
    if m:
        nutrition['protein_g'] = float(m.group(1))

    return product_name, ingredients, nutrition

def extract_ingredients_from_image(image_base64: str) -> Tuple[List[str], str]:
    """
    Main extraction function.
    Executes image preprocessing, multi-pass OCR, and returns (ingredients, raw_text).
    """
    try:
        image = preprocess_image(image_base64)
        
        # Pass 1: Standard OCR
        text = pytesseract.image_to_string(image, config='--oem 3 --psm 3')
        
        _, ingredients, _ = parse_label_text(text)

        # Pass 2: If no ingredients found or text is sparse, try contrast enhanced grayscale
        if not ingredients or len(text.strip()) < 15:
            gray = ImageOps.grayscale(image)
            enhanced = ImageEnhance.Contrast(gray).enhance(2.0)
            text_pass2 = pytesseract.image_to_string(enhanced, config='--oem 3 --psm 3')
            
            _, ingredients_pass2, _ = parse_label_text(text_pass2)
            if ingredients_pass2 or len(text_pass2) > len(text):
                text = text_pass2
                ingredients = ingredients_pass2

        return ingredients, text
    except Exception as e:
        # Fallback graceful return on corrupted or unreadable images
        return [], f"OCR extraction error: {str(e)}"

def extract_label_details(image_base64: str) -> Tuple[Optional[str], List[str], Dict[str, float], str]:
    """
    Comprehensive extraction returning: (product_name, ingredients, nutrition, raw_text)
    """
    try:
        image = preprocess_image(image_base64)
        text = pytesseract.image_to_string(image, config='--oem 3 --psm 3')
        product_name, ingredients, nutrition = parse_label_text(text)

        # Fallback pass if ingredients or nutrition were not detected
        if not ingredients and not nutrition:
            gray = ImageOps.grayscale(image)
            enhanced = ImageEnhance.Contrast(gray).enhance(2.0)
            text_pass2 = pytesseract.image_to_string(enhanced, config='--oem 3 --psm 3')
            p2, i2, n2 = parse_label_text(text_pass2)
            if i2 or n2:
                product_name = p2 or product_name
                ingredients = i2
                nutrition = n2
                text = text_pass2

        return product_name, ingredients, nutrition, text
    except Exception as e:
        return None, [], {}, f"OCR extraction error: {str(e)}"
