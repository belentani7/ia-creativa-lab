"""Tests for texture loading and processing."""

from __future__ import annotations

import tempfile
from pathlib import Path

import numpy as np
import pytest
from PIL import Image

from validator.textures import load_texture, load_pbr_set, PBRSet


@pytest.fixture
def temp_texture_dir(tmp_path):
    """Create temporary texture files for testing."""
    h, w = 64, 64

    def save(name, data):
        path = tmp_path / name
        img = Image.fromarray((data * 255).astype(np.uint8))
        img.save(str(path))
        return str(path)

    albedo = save("albedo.png", np.random.rand(h, w, 3).astype(np.float64))
    normal = save("normal.png", np.full((h, w, 3), 0.5))
    roughness = save("roughness.png", np.random.rand(h, w, 3).astype(np.float64))
    metallic = save("metallic.png", np.zeros((h, w, 3)))
    ao = save("ao.png", np.ones((h, w, 3)) * 0.9)

    return {
        "albedo": albedo,
        "normal": normal,
        "roughness": roughness,
        "metallic": metallic,
        "ao": ao,
    }


class TestLoadTexture:
    def test_loads_png(self, temp_texture_dir):
        tex = load_texture(temp_texture_dir["albedo"])
        assert isinstance(tex, np.ndarray)
        assert tex.dtype == np.float64
        assert tex.shape == (64, 64, 3)
        assert tex.min() >= 0.0
        assert tex.max() <= 1.0

    def test_nonexistent_file(self):
        with pytest.raises(FileNotFoundError):
            load_texture("nonexistent.png")

    def test_normalizes_to_rgb(self, tmp_path):
        # Create grayscale image
        gray = np.random.randint(0, 255, (32, 32), dtype=np.uint8)
        path = tmp_path / "gray.png"
        Image.fromarray(gray, mode="L").save(str(path))

        tex = load_texture(str(path))
        assert tex.ndim == 3
        assert tex.shape[2] == 3  # Converted to RGB


class TestLoadPBRSet:
    def test_loads_complete_set(self, temp_texture_dir):
        pbr = load_pbr_set(
            temp_texture_dir["albedo"],
            temp_texture_dir["normal"],
            temp_texture_dir["roughness"],
            temp_texture_dir["metallic"],
            temp_texture_dir["ao"],
        )

        assert isinstance(pbr, PBRSet)
        assert pbr.albedo.shape == (64, 64, 3)
        assert pbr.normal.shape == (64, 64, 3)
        assert pbr.roughness.shape == (64, 64, 3)
        assert pbr.metallic.shape == (64, 64, 3)
        assert pbr.ao.shape == (64, 64, 3)

    def test_stores_paths(self, temp_texture_dir):
        pbr = load_pbr_set(
            temp_texture_dir["albedo"],
            temp_texture_dir["normal"],
            temp_texture_dir["roughness"],
            temp_texture_dir["metallic"],
            temp_texture_dir["ao"],
        )

        assert "albedo" in pbr.paths
        assert "normal" in pbr.paths
        assert pbr.paths["albedo"] == temp_texture_dir["albedo"]

    def test_missing_texture_raises(self, tmp_path):
        with pytest.raises(FileNotFoundError):
            load_pbr_set(
                str(tmp_path / "albedo.png"),
                str(tmp_path / "normal.png"),
                str(tmp_path / "roughness.png"),
                str(tmp_path / "metallic.png"),
                str(tmp_path / "ao.png"),
            )
