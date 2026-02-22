import time
import requests
from config import QF_CLIENT_ID, QF_CLIENT_SECRET, QF_AUTH_URL, TOKEN_SCOPE, TOKEN_EXPIRY_FALLBACK

_cached_token = None
_cached_expiry = 0


def get_qf_token():
    global _cached_token, _cached_expiry

    now = time.time()
    if _cached_token and now < _cached_expiry - 30:
        return _cached_token

    payload = {
        "grant_type": "client_credentials",
        "client_id": QF_CLIENT_ID,
        "client_secret": QF_CLIENT_SECRET,
        "scope": TOKEN_SCOPE,
    }

    headers = {
        "Content-Type": "application/x-www-form-urlencoded"
    }

    r = requests.post(QF_AUTH_URL, data=payload, headers=headers)
    r.raise_for_status()
    data = r.json()

    access_token = data.get("access_token")
    expires_in = data.get("expires_in", TOKEN_EXPIRY_FALLBACK)

    _cached_token = access_token
    _cached_expiry = now + expires_in

    return _cached_token


def qf_get(url):
    token = get_qf_token()

    headers = {
        "x-auth-token": token,
        "x-client-id": QF_CLIENT_ID,
    }

    r = requests.get(url, headers=headers)
    r.raise_for_status()
    return r.json()