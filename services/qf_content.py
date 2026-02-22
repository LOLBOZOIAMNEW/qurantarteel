print(">>> LOADED qf_content.py FROM:", __file__)
import requests
from config import TRANSLATION_ID
from config import QF_API_BASE
from services.qf_auth import qf_get

BASE_URL = "https://api.quran.com/api/v4"

USE_QF = False  # flip to True when your LIVE client ID is working


def get_surah_verses_public(surah_number: int, reciter_id: int):
    try:
        reciter_id = int(reciter_id)
    except:
        reciter_id = 2

    url = (
        f"{BASE_URL}/verses/by_chapter/{surah_number}"
        f"?language=en&words=true&word_fields=text_uthmani"
        f"&translations={TRANSLATION_ID}&audio={reciter_id}"
    )

    print(">>> PUBLIC API CALLED")
    print(">>> URL =", url)

    try:
        r = requests.get(url)
        print(">>> STATUS =", r.status_code)
        print(">>> RESPONSE =", r.text[:300])
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print(">>> ERROR IN PUBLIC API:", e)
        return None


def get_surah_verses_qf(surah_number: int):
    url = (
        f"{QF_API_BASE}/content/verses"
        f"?chapter={surah_number}&words=true&translations={TRANSLATION_ID}"
    )
    return qf_get(url)


def get_surah_verses(surah_number: int, reciter_id: int):
    if USE_QF:
        return get_surah_verses_qf(surah_number)
    else:
        return get_surah_verses_public(surah_number, reciter_id)