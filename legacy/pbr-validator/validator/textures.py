"""Texture loading and processing for PBR validation."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Optional, Union

import numpy as np
from PIL import Image


@dataclass
class PBRSet:
    """A complete PBR texture set with loaded image data."""

    albedo: np.ndarray
    normal: np.ndarray
    roughness: np.ndarray
    metallic: np.ndarray
    ao: np.ndarray
    paths: dict[str, str]


def load_texture(path: Union[str, Path]) -> np.ndarray:
    """Load a texture file as a numpy array.

    Returns:
        numpy array with shape (H, W, C) where C is number of channels.
        Grayscale images have C=1, RGB have C=3, RGBA have C=4.
        Values are normalized to [0.0, 1.0] float range.
    """
    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(f"Texture file not found: {path}")

    img = Image.open(path)
    img = img.convert("RGB")  # Normalize to RGB for consistency
    return np.asarray(img, dtype=np.float64) / 255.0


def load_pbr_set(
    albedo: Union[str, Path],
    normal: Union[str, Path],
    roughness: Union[str, Path],
    metallic: Union[str, Path],
    ao: Union[str, Path],
) -> PBRSet:
    """Load a complete PBR texture set.

    All textures are loaded as RGB float arrays normalized to [0.0, 1.0].
    """
    return PBRSet(
        albedo=load_texture(albedo),
        normal=load_texture(normal),
        roughness=load_texture(roughness),
        metallic=load_texture(metallic),
        ao=load_texture(ao),
        paths={
            "albedo": str(albedo),
            "normal": str(normal),
            "roughness": str(roughness),
            "metallic": str(metallic),
            "ao": str(ao),
        },
    )
