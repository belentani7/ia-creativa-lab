"""Shared test fixtures for pbr-validator."""

from __future__ import annotations

import numpy as np
import pytest


@pytest.fixture
def sample_pbr_set():
    """Create a synthetic PBR texture set for testing."""
    h, w = 256, 256
    return {
        "albedo": np.random.rand(h, w, 3).astype(np.float64) * 0.8,
        "normal": np.full((h, w, 3), 0.5),  # Flat normal map
        "roughness": np.random.rand(h, w, 3).astype(np.float64) * 0.5 + 0.25,
        "metallic": np.zeros((h, w, 3)),  # Non-metallic
        "ao": np.ones((h, w, 3)) * 0.9,  # Slight occlusion
    }


@pytest.fixture
def flat_normal_map():
    """A perfectly flat normal map (OpenGL format, Y-up)."""
    h, w = 128, 128
    normal = np.full((h, w, 3), 0.5)
    normal[:, :, 2] = 1.0  # Z = 1 (pointing straight out)
    return normal


@pytest.fixture
def directx_normal_map():
    """A normal map in DirectX format (Y-down)."""
    h, w = 128, 128
    normal = np.full((h, w, 3), 0.5)
    normal[:, :, 1] = 0.3  # Y < 0.5 indicates DirectX
    normal[:, :, 2] = 1.0
    return normal


@pytest.fixture
def roughness_map():
    """A valid roughness map with varied values."""
    return np.random.rand(256, 256, 3).astype(np.float64)


@pytest.fixture
def metallic_map():
    """A binary metallic map."""
    h, w = 256, 256
    metallic = np.zeros((h, w, 3))
    metallic[:128, :, :] = 1.0  # Top half is metallic
    return metallic


@pytest.fixture
def ao_map():
    """A valid AO map."""
    h, w = 256, 256
    ao = np.ones((h, w, 3)) * 0.85
    # Add some darkening in corners
    ao[0:32, 0:32, :] = 0.3
    ao[0:32, -32:, :] = 0.3
    ao[-32:, 0:32, :] = 0.3
    ao[-32:, -32:, :] = 0.3
    return ao


@pytest.fixture
def albedo_map():
    """A valid albedo map."""
    return np.random.rand(256, 256, 3).astype(np.float64) * 0.7 + 0.1


@pytest.fixture
def overexposed_albedo():
    """An overexposed albedo map."""
    h, w = 256, 256
    albedo = np.ones((h, w, 3)) * 0.99
    return albedo


@pytest.fixture
def resolution_mismatch_set():
    """A PBR set with mismatched resolutions."""
    return {
        "albedo": np.random.rand(256, 256, 3),
        "normal": np.random.rand(512, 512, 3),
        "roughness": np.random.rand(256, 256, 3),
        "metallic": np.random.rand(256, 256, 3),
        "ao": np.random.rand(256, 256, 3),
    }


@pytest.fixture
def out_of_range_roughness():
    """A roughness map with values outside [0, 1]."""
    r = np.random.rand(256, 256, 3).astype(np.float64)
    r[0, 0, 0] = -0.1  # Negative
    r[1, 1, 1] = 1.5  # Above 1
    return r


@pytest.fixture
def non_binary_metallic():
    """A metallic map with gradual transitions."""
    return np.random.rand(256, 256, 3).astype(np.float64) * 0.6 + 0.2
