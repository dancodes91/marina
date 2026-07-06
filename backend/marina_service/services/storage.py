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


def _cors_origins() -> list[str]:
    settings = get_settings()
    origins = list(settings.cors_origin_list)
    for origin in (
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        settings.public_app_url.rstrip("/"),
    ):
        if origin and origin not in origins:
            origins.append(origin)
    return origins


def ensure_bucket_cors() -> None:
    """Allow browser PUT/GET to MinIO from the frontend origin."""
    s = get_settings()
    c = _client()
    try:
        c.put_bucket_cors(
            Bucket=s.s3_bucket,
            CORSConfiguration={
                "CORSRules": [
                    {
                        "AllowedHeaders": ["*"],
                        "AllowedMethods": ["GET", "PUT", "POST", "HEAD", "DELETE"],
                        "AllowedOrigins": _cors_origins(),
                        "ExposeHeaders": ["ETag", "Content-Length", "Content-Type"],
                        "MaxAgeSeconds": 3600,
                    }
                ]
            },
        )
    except Exception:
        # Bucket may not exist yet; ensure_bucket_exists will create it first.
        pass


def ensure_bucket_exists() -> None:
    s = get_settings()
    c = _client()
    try:
        c.head_bucket(Bucket=s.s3_bucket)
    except Exception:
        c.create_bucket(Bucket=s.s3_bucket)
    ensure_bucket_cors()


def put_object(key: str, body: bytes, content_type: str) -> None:
    s = get_settings()
    ensure_bucket_exists()
    _client().put_object(
        Bucket=s.s3_bucket,
        Key=key,
        Body=body,
        ContentType=content_type,
    )


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
