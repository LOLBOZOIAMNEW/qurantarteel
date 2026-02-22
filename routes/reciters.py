from flask import Blueprint, jsonify

reciters_bp = Blueprint("reciters", __name__)


@reciters_bp.route("/reciters", methods=["GET"])
def list_reciters():
    reciters = [
        {"id": 7, "name": "Mishary Al-Afasy"},
        {"id": 5, "name": "Al-Husary"},
        {"id": 3, "name": "Minshawi"},
        {"id": 1, "name": "Abdul Basit"},
    ]
    return jsonify({"reciters": reciters})