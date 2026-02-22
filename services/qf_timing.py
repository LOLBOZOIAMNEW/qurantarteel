from config import QF_API_BASE
from services.qf_auth import qf_get


def get_surah_timestamps(chapter_number: int, reciter_id: int):
    url = (
        f"{QF_API_BASE}/audio/reciters/{reciter_id}/timestamp"
        f"?chapter={chapter_number}"
    )
    data = qf_get(url)
    return data.get("timestamps", [])