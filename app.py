from flask import Flask, render_template, request, jsonify, make_response
from faster_whisper import WhisperModel
import requests
import datetime
import json
import os
import uuid

from routes.surah import surah_bp
from routes.reciters import reciters_bp
from config import DEFAULT_RECITER_ID

app = Flask(__name__)
app.register_blueprint(surah_bp)
app.register_blueprint(reciters_bp)

SETTINGS_FILE = "user_settings.json"

RECITERS = [
    {"id": 7, "name": "Al-Afasy (v4 Ayah Audio)"},   # FULL ayah audio
    {"id": 2, "name": "Al-Minshawi (WBW only)"},     # word-by-word only
    {"id": 1, "name": "Al-Husary (WBW only)"},       # word-by-word only
]

model = WhisperModel("small", device="cpu")

DAILY_AYAHS = [
    {
        "arabic": "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ",
        "english": "Allah! There is no deity except Him, the Ever-Living, the Sustainer of all existence.",
        "reference": "Al-Baqarah 2:255"
    },
    {
        "arabic": "قُلْ هُوَ اللَّهُ أَحَدٌ",
        "english": "Say, He is Allah, One.",
        "reference": "Al-Ikhlas 112:1"
    },
    {
        "arabic": "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا",
        "english": "Indeed, with hardship comes ease.",
        "reference": "Ash-Sharh 94:6"
    },
    {
        "arabic": "وَقُل رَّبِّ زِدْنِي عِلْمًا",
        "english": "And say: My Lord, increase me in knowledge.",
        "reference": "Taha 20:114"
    },
    {
        "arabic": "وَهُوَ مَعَكُمْ أَيْنَ مَا كُنتُمْ",
        "english": "And He is with you wherever you are.",
        "reference": "Al-Hadid 57:4"
    }
]

DAILY_SUNNAH = [
    "Smile — it is charity.",
    "Say Salam to everyone.",
    "Remove harm from the road.",
    "Eat with your right hand.",
    "Do not get angry.",
]

DAILY_DUAS = [
    "Rabbana atina fid-dunya hasanah...",
    "Allahumma inni as’aluka al-huda...",
    "Ya Muqallibal quloob thabbit qalbi...",
    "Hasbunallahu wa ni'mal wakeel.",
    "Allahumma inni a'udhu bika min sharri nafsi...",
]


def get_daily_items():
    today = datetime.date.today().toordinal()
    return (
        DAILY_AYAHS[today % len(DAILY_AYAHS)],
        DAILY_SUNNAH[today % len(DAILY_SUNNAH)],
        DAILY_DUAS[today % len(DAILY_DUAS)]
    )


def load_all_settings():
    if not os.path.exists(SETTINGS_FILE):
        return {}
    try:
        with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except:
        return {}


def save_all_settings(data):
    with open(SETTINGS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)


def get_user_settings(user_id):
    all_settings = load_all_settings()
    return all_settings.get(user_id, {
        "theme": "dark",
        "reciter": DEFAULT_RECITER_ID,
        "font_size": "normal",
        "word_by_word": True,
        "translation": True
    })


def save_user_settings(user_id, settings):
    all_settings = load_all_settings()
    all_settings[user_id] = settings
    save_all_settings(all_settings)


@app.route("/")
def home():
    user_id = request.cookies.get("user_id")
    if not user_id:
        user_id = "u_" + uuid.uuid4().hex

    daily_ayah, daily_sunnah, daily_dua = get_daily_items()

    resp = make_response(render_template(
        "home.html",
        title="Quran Tutor – Home",
        daily_ayah=daily_ayah,
        daily_sunnah=daily_sunnah,
        daily_dua=daily_dua
    ))
    resp.set_cookie("user_id", user_id, max_age=60*60*24*365)
    return resp


@app.route("/quran")
def quran_page():
    chapters = requests.get(
        "https://api.quran.com/api/v4/chapters"
    ).json()["chapters"]

    return render_template(
        "quran.html",
        title="Quran Tutor – Quran",
        surahs=chapters,
        reciters=RECITERS
    )


@app.route("/settings")
def settings_page():
    user_id = request.cookies.get("user_id")
    user_settings = get_user_settings(user_id)

    return render_template(
        "settings.html",
        reciters=RECITERS,
        title="Settings",
        settings=user_settings
    )


@app.route("/practice")
def practice_page():
    chapters = requests.get(
        "https://api.quran.com/api/v4/chapters"
    ).json()["chapters"]

    return render_template(
        "practice.html",
        title="Recitation Practice",
        surahs=chapters,
        reciters=RECITERS
    )


@app.route("/search")
def search_page():
    return "<h1>Search Coming Soon</h1>"


@app.route("/whisper_transcribe", methods=["POST"])
def whisper_transcribe():
    if "audio" not in request.files:
        return jsonify({"text": ""})

    audio_file = request.files["audio"]
    path = "temp_audio.webm"
    audio_file.save(path)

    try:
        segments, info = model.transcribe(path, language="ar")
        text = " ".join([seg.text for seg in segments])
        return jsonify({"text": text})
    except:
        return jsonify({"text": ""})


@app.route("/whisper_fallback", methods=["POST"])
def whisper_fallback():
    if "audio" not in request.files:
        return jsonify({"text": ""})

    audio_file = request.files["audio"]
    temp_path = "temp_recitation.webm"
    audio_file.save(temp_path)

    try:
        model2 = WhisperModel("medium", device="cpu", compute_type="float32")
        segments, info = model2.transcribe(temp_path, language="ar")
        text = " ".join([seg.text for seg in segments]).strip()
    except:
        text = ""

    return jsonify({"text": text})


@app.route("/get_settings")
def get_settings():
    user_id = request.cookies.get("user_id")
    return jsonify(get_user_settings(user_id))


@app.route("/save_settings", methods=["POST"])
def save_settings():
    user_id = request.cookies.get("user_id")
    data = request.json
    save_user_settings(user_id, data)
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(debug=True)