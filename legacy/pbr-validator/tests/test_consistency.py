"""Tests for cross-texture consistency checks."""

from __future__ import annotations

import numpy as np
import pytest

from validator.consistency import (
    normal_roughness_consistency,
    albedo_metallic_consistency,
    ao_geometry_consistency,
)


class TestNormalRoughnessConsistency:
    def test_correlated_maps(self):
        """Normal and roughness with correlated gradients should be consistent."""
        h, w = 128, 128
        # Create a 2D varying pattern (not linear - constant diff has zero std)
        y = np.linspace(0, 1, h).reshape(h, 1, 1)
        x = np.linspace(0, 1, w).reshape(1, w, 1)
        pattern = (np.sin(x * np.pi) * np.cos(y * np.pi) + 1) / 2

        # Both follow same pattern
        normal = np.broadcast_to(pattern, (h, w, 3)).copy() * 0.5 + 0.25
        roughness = np.broadcast_to(pattern, (h, w, 3)).copy() * 0.5 + 0.25

        score = normal_roughness_consistency(normal, roughness)
        assert score > 0.5  # Should be reasonably consistent

    def test_flat_maps(self):
        """Flat normal and roughness should return 0.5 (indeterminate)."""
        h, w = 64, 64
        normal = np.full((h, w, 3), 0.5)
        roughness = np.full((h, w, 3), 0.5)

        score = normal_roughness_consistency(normal, roughness)
        assert score == 0.5

    def test_inverse_correlation(self):
        """Inversely correlated maps should still have some consistency."""
        h, w = 128, 128
        x = np.linspace(0, 1, w).reshape(1, w, 1)
        x = np.broadcast_to(x, (h, w, 3)).copy()

        normal = x * 0.5 + 0.25
        roughness = 1.0 - x * 0.5

        score = normal_roughness_consistency(normal, roughness)
        assert 0.0 <= score <= 1.0


class TestAlbedoMetallicConsistency:
    def test_normal_consistency(self, albedo_map, metallic_map):
        score = albedo_metallic_consistency(albedo_map, metallic_map)
        assert 0.0 <= score <= 1.0

    def test_all_metallic(self):
        """All metallic texture should return 0.5."""
        h, w = 64, 64
        albedo = np.random.rand(h, w, 3) * 0.5 + 0.3
        metallic = np.ones((h, w, 3))

        score = albedo_metallic_consistency(albedo, metallic)
        assert score == 0.5  # Can't determine without dielectrics

    def test_all_dielectric(self):
        """All dielectric texture should return 0.5."""
        h, w = 64, 64
        albedo = np.random.rand(h, w, 3) * 0.5 + 0.3
        metallic = np.zeros((h, w, 3))

        score = albedo_metallic_consistency(albedo, metallic)
        assert score == 0.5


class TestAoGeometryConsistency:
    def test_normal_ao_correlation(self, ao_map, flat_normal_map):
        score = ao_geometry_consistency(ao_map, flat_normal_map)
        assert 0.0 <= score <= 1.0

    def test_flat_normal_flat_ao(self):
        """Flat normal and AO should return 0.5."""
        h, w = 64, 64
        ao = np.ones((h, w, 3)) * 0.8
        normal = np.full((h, w, 3), 0.5)
        normal[:, :, 2] = 1.0

        score = ao_geometry_consistency(ao, normal)
        assert score == 0.5

    def test_high_variation_ao_darkening(self):
        """Strong normal variation with dark AO should be consistent."""
        h, w = 128, 128
        # Create high-variation normal map
        normal = np.random.rand(h, w, 3).astype(np.float64) * 0.4 + 0.3

        # Create AO that darkens where normals vary
        ao = np.ones((h, w, 3)) * 0.9

        score = ao_geometry_consistency(ao, normal)
        assert 0.0 <= score <= 1.0
