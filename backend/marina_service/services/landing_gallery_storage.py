"""Filesystem storage for marina landing carousel images (no database)."""

from __future__ import annotations

import hashlib
import json
import re
from dataclasses import dataclass
from pathlib import Path
from fastapi import HTTPException

from marina_service.config import get_settings

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
ORDER_FILE = "gallery-order.json"
DEFAULT_SUBDIR = "_default"
SAFE_NAME = re.compile(r"[^a-zA-Z0-9._-]+")


@dataclass
class GalleryFile:
    filename: str
    sort_order: int
    alt_text: str | None


def _backend_root() -> Path:
    return Path(__file__).resolve().parents[2]


def gallery_root() -> Path:
    settings = get_settings()
    root = Path(settings.landing_gallery_dir)
    if not root.is_absolute():
        root = _backend_root() / root
    root.mkdir(parents=True, exist_ok=True)
    return root


def marina_gallery_dir(marina_slug: str) -> Path:
    safe_slug = SAFE_NAME.sub("_", marina_slug.strip().lower()) or "marina"
    path = gallery_root() / safe_slug
    path.mkdir(parents=True, exist_ok=True)
    return path


def default_image_path() -> Path:
    default_dir = gallery_root() / DEFAULT_SUBDIR
    default_dir.mkdir(parents=True, exist_ok=True)
    target = default_dir / "landing-default.webp"
    if not target.exists():
        repo_default = _backend_root().parent / "frontend" / "public" / "landing-default.webp"
        if repo_default.exists():
            target.write_bytes(repo_default.read_bytes())
    return target


def public_file_url(marina_slug: str, filename: str) -> str:
    safe_slug = SAFE_NAME.sub("_", marina_slug.strip().lower()) or "marina"
    return f"/api/v1/landing-gallery/files/{safe_slug}/{filename}"


def default_public_url() -> str:
    return "/api/v1/landing-gallery/default"


def _order_path(marina_slug: str) -> Path:
    return marina_gallery_dir(marina_slug) / ORDER_FILE


def _read_order(marina_slug: str) -> list[str]:
    path = _order_path(marina_slug)
    if not path.exists():
        return []
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        if isinstance(data, list):
            return [str(item) for item in data]
    except (json.JSONDecodeError, OSError):
        pass
    return []


def _write_order(marina_slug: str, filenames: list[str]) -> None:
    _order_path(marina_slug).write_text(json.dumps(filenames, indent=2), encoding="utf-8")


def _discover_files(marina_slug: str) -> list[str]:
    directory = marina_gallery_dir(marina_slug)
    return sorted(
        p.name
        for p in directory.iterdir()
        if p.is_file() and p.suffix.lower() in ALLOWED_EXTENSIONS
    )


def _sync_order(marina_slug: str) -> list[str]:
    on_disk = set(_discover_files(marina_slug))
    seen: set[str] = set()
    order: list[str] = []
    for name in _read_order(marina_slug):
        if name in on_disk and name not in seen:
            order.append(name)
            seen.add(name)
    for name in sorted(on_disk):
        if name not in seen:
            order.append(name)
            seen.add(name)
    _write_order(marina_slug, order)
    return order


def list_gallery_files(marina_slug: str) -> list[GalleryFile]:
    order = _sync_order(marina_slug)
    return [
        GalleryFile(
            filename=name,
            sort_order=index,
            alt_text=name.rsplit(".", 1)[0].replace("-", " ").replace("_", " "),
        )
        for index, name in enumerate(order)
    ]


def resolve_file_path(marina_slug: str, filename: str) -> Path:
    if filename != Path(filename).name or ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    path = marina_gallery_dir(marina_slug) / filename
    if not path.exists() or not path.is_file():
        raise HTTPException(status_code=404, detail="File not found")
    return path


def save_gallery_file(marina_slug: str, original_filename: str, content: bytes) -> GalleryFile:
    ext = Path(original_filename or "photo.jpg").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Unsupported image type")

    directory = marina_gallery_dir(marina_slug)
    for existing in _discover_files(marina_slug):
        path = directory / existing
        try:
            if path.read_bytes() == content:
                order = _sync_order(marina_slug)
                stem = SAFE_NAME.sub("_", Path(existing).stem)[:80] or "image"
                return GalleryFile(
                    filename=existing,
                    sort_order=order.index(existing),
                    alt_text=stem.replace("_", " "),
                )
        except OSError:
            continue

    stem = SAFE_NAME.sub("_", Path(original_filename).stem)[:80] or "image"
    digest = hashlib.sha256(content).hexdigest()[:12]
    filename = f"{digest}_{stem}{ext}"
    target = directory / filename
    if not target.exists():
        target.write_bytes(content)

    order = _sync_order(marina_slug)
    return GalleryFile(
        filename=filename,
        sort_order=order.index(filename),
        alt_text=stem.replace("_", " "),
    )

def delete_gallery_file(marina_slug: str, filename: str) -> None:
    path = resolve_file_path(marina_slug, filename)
    path.unlink(missing_ok=True)
    order = [name for name in _sync_order(marina_slug) if name != filename]
    _write_order(marina_slug, order)


def reorder_gallery_files(marina_slug: str, filenames: list[str]) -> list[GalleryFile]:
    on_disk = set(_discover_files(marina_slug))
    if set(filenames) != on_disk or len(filenames) != len(on_disk):
        raise HTTPException(status_code=400, detail="Reorder must include every gallery file exactly once")
    _write_order(marina_slug, filenames)
    return list_gallery_files(marina_slug)
