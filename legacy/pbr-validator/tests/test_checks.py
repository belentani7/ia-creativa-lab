"""Tests for validation checks."""

from __future__ import annotations

import numpy as np
import pytest

from validator.checks import (
    check_resolution,
    check_color_space,
    check_normal_map_format,
    check_roughness_range,
    check_metallic_range,
    check_ao_range,
    check_albedo_not_overexposed,
    check_seamlessness,
)


class TestCheckResolution:
    def test_matching_resolutions(self, sample_pbr_set):
        issues = check_resolution(sample_pbr_set)
        assert issues == []

    def test_mismatched_resolutions(self, resolution_mismatch_set):
        issues = check_resolution(resolution_mismatch_set)
        assert len(issues) > 0
        assert any("mismatch" in i.lower() for i in issues)

    def test_empty_dict(self):
        issues = check_resolution({})
        assert len(issues) > 0


class TestCheckColorSpace:
    def test_linear_texture(self, roughness_map):
        result = check_color_space(roughness_map, expected="linear")
        assert result == "ok"

    def test_srgb_texture(self, sample_pbr_set):
        result = check_color_space(sample_pbr_set["albedo"], expected="sRGB")
        assert result == "ok"


class TestCheckNormalMapFormat:
    def test_opengl_format(self, flat_normal_map):
        assert check_normal_map_format(flat_normal_map) == "OpenGL"

    def test_directx_format(self, directx_normal_map):
        assert check_normal_map_format(directx_normal_map) == "DirectX"


class TestCheckRoughnessRange:
    def test_valid_range(self, roughness_map):
        issues = check_roughness_range(roughness_map)
        assert issues == []

    def test_out_of_range(self, out_of_range_roughness):
        issues = check_roughness_range(out_of_range_roughness)
        assert len(issues) > 0
        assert any("negative" in i.lower() or "above 1" in i.lower() for i in issues)

    def test_uniform_roughness(self):
        uniform = np.ones((64, 64, 3)) * 0.5
        issues = check_roughness_range(uniform)
        assert len(issues) > 0
        assert any("uniform" in i.lower() for i in issues)


class TestCheckMetallicRange:
    def test_binary_metallic(self, metallic_map):
        issues = check_metallic_range(metallic_map)
        assert issues == []

    def test_non_binary(self, non_binary_metallic):
        issues = check_metallic_range(non_binary_metallic)
        assert len(issues) > 0
        assert any("binary" in i.lower() for i in issues)

    def test_out_of_range_metallic(self):
        m = np.zeros((64, 64, 3))
        m[0, 0, 0] = -0.1
        m[1, 1, 1] = 1.5
        issues = check_metallic_range(m)
        assert any("negative" in i.lower() for i in issues)
        assert any("above 1" in i.lower() for i in issues)


class TestCheckAoRange:
    def test_valid_ao(self, ao_map):
        issues = check_ao_range(ao_map)
        assert issues == []

    def test_ao_with_negative(self):
        ao = np.ones((64, 64, 3)) * 0.8
        ao[0, 0, 0] = -0.1
        issues = check_ao_range(ao)
        assert any("negative" in i.lower() for i in issues)


class TestCheckAlbedoNotOverexposed:
    def test_normal_albedo(self, albedo_map):
        assert not check_albedo_not_overexposed(albedo_map)

    def test_overexposed(self, overexposed_albedo):
        assert check_albedo_not_overexposed(overexposed_albedo)


class TestCheckSeamlessness:
    def test_uniform_texture(self):
        tex = np.ones((64, 64, 3)) * 0.5
        score = check_seamlessness(tex)
        assert score == 0.0

    def test_random_texture(self):
        tex = np.random.rand(64, 64, 3)
        score = check_seamlessness(tex)
        assert 0.0 <= score <= 1.0
