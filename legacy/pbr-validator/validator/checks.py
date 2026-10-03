"""Validation checks for individual PBR textures."""

from __future__ import annotations

from typing import Optional

import numpy as np


def check_resolution(textures: dict[str, np.ndarray]) -> list[str]:
    """Check that all textures in a set share the same resolution.

    Args:
        textures: dict mapping texture name to its numpy array.

    Returns:
        List of issue strings. Empty if all resolutions match.
    """
    issues: list[str] = []
    if not textures:
        return ["No textures provided"]

    shapes = {name: tex.shape[:2] for name, tex in textures.items()}
    first_name = next(iter(shapes))
    ref_h, ref_w = shapes[first_name]

    for name, (h, w) in shapes.items():
        if (h, w) != (ref_h, ref_w):
            issues.append(
                f"Resolution mismatch: {name} is {w}x{h}, expected {ref_w}x{ref_h}"
            )

    # Check power-of-two dimensions
    for name, (h, w) in shapes.items():
        if not _is_power_of_two(h):
            issues.append(f"{name} height {h} is not a power of two")
        if not _is_power_of_two(w):
            issues.append(f"{name} width {w} is not a power of two")

    return issues


def check_color_space(texture: np.ndarray, expected: str = "sRGB") -> str:
    """Check color space validity for a texture.

    This is a heuristic check based on value distribution.
    Exact color space detection requires metadata (e.g., ICC profiles).

    Args:
        texture: numpy array of the texture.
        expected: expected color space ("sRGB" or "linear").

    Returns:
        Status message. "ok" if likely correct.
    """
    if expected == "linear":
        # Linear textures (roughness, metallic, AO) should not have
        # sRGB gamma curve characteristics
        flat = texture.ravel()
        # In sRGB, dark values are lifted. A linear texture will have
        # more concentration near 0 and 1.
        p50 = np.percentile(flat, 50)
        if p50 > 0.7:
            return "warning: texture may be sRGB-encoded but expected linear"

    return "ok"


def check_normal_map_format(normal: np.ndarray) -> str:
    """Detect whether a normal map uses OpenGL or DirectX format.

    OpenGL:  Y points up (green channel > 0.5 in flat areas).
    DirectX: Y points down (green channel < 0.5 in flat areas).

    Args:
        normal: numpy array of the normal map.

    Returns:
        "OpenGL" or "DirectX".
    """
    # Flat normals are (0.5, 0.5, 1.0) in [0,1] space
    # Green channel > 0.5 means Y-up (OpenGL)
    # Green channel < 0.5 means Y-down (DirectX)
    green_mean = normal[:, :, 1].mean()
    if green_mean >= 0.5:
        return "OpenGL"
    return "DirectX"


def check_roughness_range(roughness: np.ndarray) -> list[str]:
    """Validate roughness map values are within [0, 1].

    Returns:
        List of issues. Empty if valid.
    """
    issues: list[str] = []
    flat = roughness.ravel()

    min_val = flat.min()
    max_val = flat.max()

    if min_val < 0.0:
        issues.append(f"Roughness has negative values (min={min_val:.4f})")
    if max_val > 1.0:
        issues.append(f"Roughness has values above 1.0 (max={max_val:.4f})")

    # Check if mostly uniform (might be wrong texture)
    std = flat.std()
    if std < 0.01:
        issues.append(
            f"Roughness is nearly uniform (std={std:.4f}); verify this is the correct texture"
        )

    return issues


def check_metallic_range(metallic: np.ndarray) -> list[str]:
    """Validate metallic map values.

    Metallic maps are typically binary (0 or 1) or narrow 0-1 range.

    Returns:
        List of issues. Empty if valid.
    """
    issues: list[str] = []
    flat = metallic.ravel()

    min_val = flat.min()
    max_val = flat.max()

    if min_val < 0.0:
        issues.append(f"Metallic has negative values (min={min_val:.4f})")
    if max_val > 1.0:
        issues.append(f"Metallic has values above 1.0 (max={max_val:.4f})")

    # Check if truly binary
    close_to_zero = np.sum(np.abs(flat) < 0.05) / flat.size
    close_to_one = np.sum(np.abs(flat - 1.0) < 0.05) / flat.size
    ratio = close_to_zero + close_to_one

    if ratio < 0.9:
        # Not binary, check for gradual transitions
        issues.append(
            f"Metallic map is not binary ({ratio:.0%} of pixels are near 0 or 1); "
            "consider using a binary mask for cleaner metallic/insulator separation"
        )

    return issues


def check_ao_range(ao: np.ndarray) -> list[str]:
    """Validate ambient occlusion map values within [0, 1].

    Returns:
        List of issues. Empty if valid.
    """
    issues: list[str] = []
    flat = ao.ravel()

    min_val = flat.min()
    max_val = flat.max()

    if min_val < 0.0:
        issues.append(f"AO has negative values (min={min_val:.4f})")
    if max_val > 1.0:
        issues.append(f"AO has values above 1.0 (max={max_val:.4f})")

    return issues


def check_albedo_not_overexposed(albedo: np.ndarray) -> bool:
    """Check that albedo is not overexposed.

    Overexposure means many pixels are at maximum brightness with
    clipped highlights.

    Args:
        albedo: numpy array of the albedo texture.

    Returns:
        True if overexposed, False otherwise.
    """
    flat = albedo.ravel()
    # Over 5% of pixels at max value across all channels
    max_pixels = np.sum(flat >= 0.99) / flat.size
    return max_pixels > 0.05


def check_seamlessness(texture: np.ndarray) -> float:
    """Estimate seamlessness of a texture.

    Compares left-right and top-bottom edges. Lower score = more seamless.
    Score of 0.0 means perfectly seamless; 1.0 means very different edges.

    Args:
        texture: numpy array of the texture.

    Returns:
        Seamlessness score from 0.0 (seamless) to 1.0 (not seamless).
    """
    h, w = texture.shape[:2]
    edge_width = max(2, min(h, w) // 16)

    # Compare left and right edges
    left = texture[:, :edge_width, :].mean(axis=1)
    right = texture[:, -edge_width:, :].mean(axis=1)
    lr_diff = np.mean(np.abs(left - right))

    # Compare top and bottom edges
    top = texture[:edge_width, :, :].mean(axis=0)
    bottom = texture[-edge_width:, :, :].mean(axis=0)
    tb_diff = np.mean(np.abs(top - bottom))

    return float((lr_diff + tb_diff) / 2.0)


def _is_power_of_two(n: int) -> bool:
    """Check if n is a power of two."""
    return n > 0 and (n & (n - 1)) == 0
