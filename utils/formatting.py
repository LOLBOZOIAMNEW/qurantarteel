import re

def clean_translation(text):
    if not text:
        return ""
    text = re.sub(r"<sup[^>]*>.*?</sup>", "", text)
    text = re.sub(r"<[^>]+>", "", text)
    return text.strip()