"""Cross-texture consistency checks for PBR sets."""

from __future__ import annotations

import numpy as np


def normal_roughness_consistency(normal: np.ndarray, roughness: np.ndarray) -> float:
    """Check consistency between normal map and roughness.

    High-frequency normal detail should correlate with roughness variation.
    Areas with strong normals (high contrast) typically have roughness changes.

    Returns:
        Consistency score from 0.0 (inconsistent) to 1.0 (consistent).
    """
    # Compute local contrast of normal map (magnitude of gradient)
    gx = np.diff(normal, axis=1)
    gy = np.diff(normal, axis=0)
    # Pad to restore original size
    gx = np.pad(gx, ((0, 0), (0, 1), (0, 0)), mode="edge")
    gy = np.pad(gy, ((0, 1), (0, 0), (0, 0)), mode="edge")
    normal_contrast = np.sqrt(np.sum(gx**2 + gy**2, axis=2))

    # Roughness gradient
    rgx = np.diff(roughness, axis=1)
    rgy = np.diff(roughness, axis=0)
    rgx = np.pad(rgx, ((0, 0), (0, 1), (0, 0)), mode="edge")
    rgy = np.pad(rgy, ((0, 1), (0, 0), (0, 0)), mode="edge")
    roughness_contrast = np.sqrt(np.sum(rgx**2 + rgy**2, axis=2))

    # Normalize
    nc_flat = normal_contrast.ravel()
    rc_flat = roughness_contrast.ravel()

    nc_std = nc_flat.std()
    rc_std = rc_flat.std()

    if nc_std < 1e-6 or rc_std < 1e-6:
        return 0.5  # One is flat, can't determine consistency

    nc_norm = (nc_flat - nc_flat.mean()) / nc_std
    rc_norm = (rc_flat - rc_flat.mean()) / rc_std

    # Correlation coefficient
    correlation = float(np.mean(nc_norm * rc_norm))
    # Map from [-1, 1] to [0, 1]
    return (correlation + 1.0) / 2.0


def albedo_metallic_consistency(albedo: np.ndarray, metallic: np.ndarray) -> float:
    """Check consistency between albedo and metallic maps.

    Metallic areas should have specific albedo characteristics:
    - Metals: albedo represents reflectance (typically brighter)
    - Dielectrics: albedo represents base color

    Returns:
        Consistency score from 0.0 (inconsistent) to 1.0 (consistent).
    """
    # Convert to grayscale luminance
    weights = np.array([0.2126, 0.7152, 0.0722])
    albedo_gray = np.sum(albedo * weights, axis=2) if albedo.ndim == 3 else albedo
    metallic_gray = np.mean(metallic, axis=2) if metallic.ndim == 3 else metallic

    # Metallic regions
    metal_mask = metallic_gray > 0.5
    dielectric_mask = ~metal_mask

    if metal_mask.sum() == 0 or dielectric_mask.sum() == 0:
        return 0.5  # All one type

    metal_albedo_mean = albedo_gray[metal_mask].mean()
    dielectric_albedo_mean = albedo_gray[dielectric_mask].mean()

    # Metals tend to have higher albedo values (reflectance)
    # This is a soft check - the ratio should be reasonable
    if dielectric_albedo_mean < 1e-6:
        return 0.5

    ratio = metal_albedo_mean / dielectric_albedo_mean

    # Score: ideal ratio around 1.0-2.0, penalize extremes
    if 0.5 < ratio < 3.0:
        score = 1.0
    elif 0.2 < ratio < 5.0:
        score = 0.7
    else:
        score = 0.3

    return score


def ao_geometry_consistency(ao: np.ndarray, normal: np.ndarray) -> float:
    """Check consistency between AO and normal maps.

    Areas with strong concavity (high normal variation) should show
    more occlusion. Flat areas should have minimal occlusion.

    Returns:
        Consistency score from 0.0 (inconsistent) to 1.0 (consistent).
    """
    # AO in grayscale
    ao_gray = np.mean(ao, axis=2) if ao.ndim == 3 else ao

    # Normal variation (magnitude of gradient)
    gx = np.diff(normal, axis=1)
    gy = np.diff(normal, axis=0)
    gx = np.pad(gx, ((0, 0), (0, 1), (0, 0)), mode="edge")
    gy = np.pad(gy, ((0, 1), (0, 0), (0, 0)), mode="edge")
    normal_variation = np.sqrt(np.sum(gx**2 + gy**2, axis=2))

    # Downsample to reduce noise
    step = max(1, ao_gray.shape[0] // 64)
    ao_small = ao_gray[::step, ::step].ravel()
    nv_small = normal_variation[::step, ::step].ravel()

    # Check: high normal variation should correlate with low AO
    ao_std = ao_small.std()
    nv_std = nv_small.std()

    if ao_std < 1e-6 or nv_std < 1e-6:
        return 0.5

    ao_norm = (ao_small - ao_small.mean()) / ao_std
    nv_norm = (nv_small - nv_small.mean()) / nv_std

    # Negative correlation is expected (high variation = more occlusion = lower AO)
    correlation = float(np.mean(ao_norm * nv_norm))
    # Map: correlation around -0.3 to -0.8 is good
    # correlation of -1 is perfect consistency, +1 is worst
    score = max(0.0, min(1.0, (1.0 - correlation) / 2.0))

    return score
