print(">>> USING SURAH.PY FROM:", __file__)

from flask import Blueprint, request, jsonify
from config import DEFAULT_RECITER_ID
from services.qf_content import get_surah_verses
from utils.formatting import clean_translation

surah_bp = Blueprint("surah", __name__)


@surah_bp.route("/get_surah", methods=["POST"])
def get_surah():
    data = request.json or {}

    surah_index = int(data.get("surah", 0))
    surah_number = surah_index + 1

    # Ensure reciter_id is always numeric
    try:
        reciter_id = int(data.get("reciter_id", DEFAULT_RECITER_ID))
    except:
        reciter_id = DEFAULT_RECITER_ID

    verses_data = get_surah_verses(surah_number, reciter_id)
    if not verses_data:
        return jsonify({"error": "Failed to fetch verses"}), 500

    verses = verses_data.get("verses", [])

    ayahs = []
    for v in verses:

        # Quran.com v4 audio is always inside v["audio"]["url"]
        audio_obj = v.get("audio")
        if isinstance(audio_obj, dict):
            ayah_audio = audio_obj.get("url", "")
        else:
            ayah_audio = ""

        translations = v.get("translations", [])
        english_text = translations[0]["text"] if translations else ""

        words_out = []
        for w in v.get("words", []):
            words_out.append({
                "position": w.get("position"),
                "text": w.get("text_uthmani", ""),
                "start_time": 0,
                "end_time": 0,
                "timing_audio": ""
            })

        ayahs.append({
            "id": v.get("id"),
            "number": v.get("verse_number"),
            "key": v.get("verse_key"),
            "arabic": v.get("text_uthmani", ""),
            "english": clean_translation(english_text),
            "tajweed": "",
            "words": words_out,
            "audio": ayah_audio
        })

    bismillah_text = "﷽" if surah_number != 9 else ""

    return jsonify({
        "surah": ayahs,
        "bismillah": bismillah_text,
        "reciter_id": reciter_id
    })