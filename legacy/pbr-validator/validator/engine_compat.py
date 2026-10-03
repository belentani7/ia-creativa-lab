"""Engine-specific validation for PBR texture sets."""

from __future__ import annotations

from typing import Any

import numpy as np

from validator.checks import (
    check_normal_map_format,
    check_roughness_range,
    check_metallic_range,
    check_ao_range,
    check_albedo_not_overexposed,
)
from validator.textures import PBRSet


def validate_unreal(pbr: PBRSet) -> list[str]:
    """Validate PBR set against Unreal Engine conventions.

    Unreal Engine 4/5 uses:
    - Normal map in DirectX format (Y-down)
    - sRGB for albedo, linear for all others
    - Roughness in [0, 1], metallic is binary-like
    - ORM packed texture (optional): AO, Roughness, Metallic in one texture

    Returns:
        List of issues/warnings.
    """
    issues: list[str] = []

    # Normal map format
    fmt = check_normal_map_format(pbr.normal)
    if fmt != "DirectX":
        issues.append(
            f"[Unreal] Normal map is {fmt}, expected DirectX (Y-down). "
            "Unreal requires DirectX-format normal maps."
        )

    # Roughness
    r_issues = check_roughness_range(pbr.roughness)
    issues.extend(f"[Unreal] {i}" for i in r_issues)

    # Metallic
    m_issues = check_metallic_range(pbr.metallic)
    issues.extend(f"[Unreal] {i}" for i in m_issues)

    # AO
    ao_issues = check_ao_range(pbr.ao)
    issues.extend(f"[Unreal] {i}" for i in ao_issues)

    # Albedo overexposure
    if check_albedo_not_overexposed(pbr.albedo):
        issues.append(
            "[Unreal] Albedo appears overexposed. "
            "PBR albedo values should typically be below 240 sRGB."
        )

    # Resolution check
    h, w = pbr.albedo.shape[:2]
    if not _is_power_of_two(h) or not _is_power_of_two(w):
        issues.append(
            f"[Unreal] Resolution {w}x{h} is not power-of-two. "
            "Unreal performs best with power-of-two textures."
        )

    return issues


def validate_unity(pbr: PBRSet) -> list[str]:
    """Validate PBR set against Unity conventions.

    Unity HDRP/URP uses:
    - Normal map in OpenGL format (Y-up)
    - Standard/Roughness workflow
    - sRGB for albedo, linear for others
    - Metallic workflow (single channel)

    Returns:
        List of issues/warnings.
    """
    issues: list[str] = []

    # Normal map format
    fmt = check_normal_map_format(pbr.normal)
    if fmt != "OpenGL":
        issues.append(
            f"[Unity] Normal map is {fmt}, expected OpenGL (Y-up). "
            "Unity requires OpenGL-format normal maps."
        )

    # Roughness
    r_issues = check_roughness_range(pbr.roughness)
    issues.extend(f"[Unity] {i}" for i in r_issues)

    # Metallic
    m_issues = check_metallic_range(pbr.metallic)
    issues.extend(f"[Unity] {i}" for i in m_issues)

    # AO
    ao_issues = check_ao_range(pbr.ao)
    issues.extend(f"[Unity] {i}" for i in ao_issues)

    # Albedo overexposure
    if check_albedo_not_overexposed(pbr.albedo):
        issues.append(
            "[Unity] Albedo appears overexposed. "
            "HDRP albedo values should be below 240 sRGB."
        )

    # Resolution
    h, w = pbr.albedo.shape[:2]
    if not _is_power_of_two(h) or not _is_power_of_two(w):
        issues.append(
            f"[Unity] Resolution {w}x{h} is not power-of-two. "
            "Unity atlases work best with power-of-two textures."
        )

    # Metallic range check
    metal_flat = pbr.metallic.ravel()
    metal_range = metal_flat.max() - metal_flat.min()
    if metal_range > 0 and metal_range < 0.3:
        issues.append(
            "[Unity] Metallic map has narrow range. "
            "Unity metallic workflow expects clear 0/1 separation."
        )

    return issues


def validate_godot(pbr: PBRSet) -> list[str]:
    """Validate PBR set against Godot Engine conventions.

    Godot uses:
    - Normal map in OpenGL format (Y-up)
    - sRGB for albedo, linear for others
    - Roughness/Metallic workflow

    Returns:
        List of issues/warnings.
    """
    issues: list[str] = []

    # Normal map format
    fmt = check_normal_map_format(pbr.normal)
    if fmt != "OpenGL":
        issues.append(
            f"[Godot] Normal map is {fmt}, expected OpenGL (Y-up). "
            "Godot requires OpenGL-format normal maps."
        )

    # Roughness
    r_issues = check_roughness_range(pbr.roughness)
    issues.extend(f"[Godot] {i}" for i in r_issues)

    # Metallic
    m_issues = check_metallic_range(pbr.metallic)
    issues.extend(f"[Godot] {i}" for i in m_issues)

    # AO
    ao_issues = check_ao_range(pbr.ao)
    issues.extend(f"[Godot] {i}" for i in ao_issues)

    # Albedo overexposure
    if check_albedo_not_overexposed(pbr.albedo):
        issues.append(
            "[Godot] Albedo appears overexposed. "
            "Godot PBR expects albedo in 0-1 sRGB range."
        )

    # Resolution
    h, w = pbr.albedo.shape[:2]
    if not _is_power_of_two(h) or not _is_power_of_two(w):
        issues.append(
            f"[Godot] Resolution {w}x{h} is not power-of-two. "
            "Godot streaming works best with power-of-two textures."
        )

    return issues


def get_recommended_settings(engine: str) -> dict[str, Any]:
    """Get recommended import/rendering settings for a target engine.

    Args:
        engine: One of "unreal", "unity", "godot".

    Returns:
        Dict of setting names to values.
    """
    settings: dict[str, Any] = {
        "unreal": {
            "normal_format": "DirectX",
            "normal_map_import": "Tangent Space",
            "albedo_color_space": "sRGB",
            "roughness_color_space": "Linear",
            "metallic_color_space": "Linear",
            "ao_color_space": "Linear",
            "compression": "BC7 (PC) / ASTC (Mobile)",
            "srgb": {
                "albedo": True,
                "normal": False,
                "roughness": False,
                "metallic": False,
                "ao": False,
            },
            "lod_bias": 0,
            "texture_group": "World",
        },
        "unity": {
            "normal_format": "OpenGL",
            "normal_map_import": "Tangent Space",
            "albedo_color_space": "sRGB",
            "roughness_color_space": "Linear",
            "metallic_color_space": "Linear",
            "ao_color_space": "Linear",
            "compression": "BC7 (Desktop) / ASTC (Mobile)",
            "srgb": {
                "albedo": True,
                "normal": False,
                "roughness": False,
                "metallic": False,
                "ao": False,
            },
            "mipmap_enabled": True,
            "streaming_mipmaps": True,
        },
        "godot": {
            "normal_format": "OpenGL",
            "albedo_color_space": "sRGB",
            "roughness_color_space": "Linear",
            "metallic_color_space": "Linear",
            "ao_color_space": "Linear",
            "compression": "VRAM Compressed",
            "srgb": {
                "albedo": True,
                "normal": False,
                "roughness": False,
                "metallic": False,
                "ao": False,
            },
            "mipmap_generate": True,
        },
    }

    engine = engine.lower().strip()
    if engine not in settings:
        raise ValueError(
            f"Unknown engine '{engine}'. Supported: unreal, unity, godot"
        )

    return settings[engine]


def _is_power_of_two(n: int) -> bool:
    return n > 0 and (n & (n - 1)) == 0
