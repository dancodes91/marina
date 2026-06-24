import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt

from marina_service.config import get_settings


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def create_access_token(
    subject_id: uuid.UUID,
    subject_type: str,
    role: str | None = None,
    email: str | None = None,
) -> str:
    settings = get_settings()
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(subject_id),
        "typ": subject_type,
        "role": role or "",
        "iat": now,
        "exp": now + timedelta(minutes=settings.access_token_expire_minutes),
        "type": "access",
    }
    if email:
        payload["email"] = email.strip().lower()
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def create_refresh_token_value() -> str:
    return secrets.token_urlsafe(48)


def decode_token(token: str) -> dict:
    settings = get_settings()
    return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])


def decode_access_token(token: str) -> dict:
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            raise JWTError("not access token")
        return payload
    except JWTError as e:
        raise ValueError("Invalid token") from e


def hash_refresh_token(token: str) -> str:
    return _hash_token(token)
