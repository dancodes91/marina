"""Tests for marina context seed data."""

from marina_service.services.marina_context import DEFAULT_SLIPS, DEFAULT_STORAGE


def test_default_slips_structure():
    assert len(DEFAULT_SLIPS) >= 3
    assert "size" in DEFAULT_SLIPS[0]
    assert "available" in DEFAULT_SLIPS[0]


def test_default_storage_types():
    types = {s["type"] for s in DEFAULT_STORAGE}
    assert "DRY_RACK" in types
    assert "INDOOR_STORAGE" in types
