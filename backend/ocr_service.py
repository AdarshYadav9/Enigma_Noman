import base64
from io import BytesIO
from PIL import Image
import pkgutil
if not hasattr(pkgutil, 'find_loader'):
    import importlib.util
    pkgutil.find_loader = importlib.util.find_spec
import pytesseract
import re

def extract_ingredients_from_image(image_base64: str) -> list:
    if "," in image_base64:
        image_base64 = image_base64.split(",")[1]
        
    image_data = base64.b64decode(image_base64)
    image = Image.open(BytesIO(image_data))
    
    text = pytesseract.image_to_string(image)
    
    # Find text after "ingredients:" keyword (case insensitive)
    match = re.search(r'ingredients?\s*[:\-]?\s*(.*)', text, re.IGNORECASE | re.DOTALL)
    if not match:
        return []
    
    ingredients_text = match.group(1).strip()
    
    # Often ingredients are separated by commas or periods
    # Take the first paragraph or up to a new line that seems unrelated
    lines = ingredients_text.split('\n')
    filtered_lines = []
    for line in lines:
        if line.strip() == "":
            break
        filtered_lines.append(line)
        
    cleaned_text = " ".join(filtered_lines)
    
    # Split by comma
    raw_ingredients = [i.strip() for i in cleaned_text.split(',')]
    
    # Clean up non-alphabet chars, etc (basic cleaning)
    ingredients = []
    for ing in raw_ingredients:
        cleaned = re.sub(r'[^a-zA-Z\s]', '', ing).strip()
        if cleaned and len(cleaned) > 2:
            ingredients.append(cleaned)
            
    return ingredients
