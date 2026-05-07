import uuid

import boto3
from botocore.client import Config

from marina_service.config import get_settings


def _client():
    s = get_settings()
    return boto3.client(
        "s3",
        endpoint_url=s.s3_endpoint_url,
        aws_access_key_id=s.s3_access_key,
        aws_secret_access_key=s.s3_secret_key,
        region_name=s.s3_region,
        config=Config(signature_version="s3v4"),
        use_ssl=s.s3_use_ssl,
    )


def ensure_bucket_exists() -> None:
    s = get_settings()
    c = _client()
    try:
        c.head_bucket(Bucket=s.s3_bucket)
    except Exception:
        c.create_bucket(Bucket=s.s3_bucket)


def presigned_put_url(key: str, content_type: str, expires_in: int = 3600) -> str:
    s = get_settings()
    ensure_bucket_exists()
    return _client().generate_presigned_url(
        "put_object",
        Params={"Bucket": s.s3_bucket, "Key": key, "ContentType": content_type},
        ExpiresIn=expires_in,
    )


def public_object_url(key: str) -> str:
    s = get_settings()
    # For MinIO path-style URL
    base = s.s3_endpoint_url.rstrip("/")
    return f"{base}/{s.s3_bucket}/{key}"


def new_attachment_key(prefix: str, filename: str) -> str:
    safe = filename.replace("/", "_")[:200]
    return f"{prefix}/{uuid.uuid4().hex}_{safe}"
