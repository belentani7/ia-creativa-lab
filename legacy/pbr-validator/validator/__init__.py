"""PBR texture set validator for game engines."""

from validator.textures import load_texture, load_pbr_set, PBRSet
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
from validator.consistency import (
    normal_roughness_consistency,
    albedo_metallic_consistency,
    ao_geometry_consistency,
)
from validator.engine_compat import (
    validate_unreal,
    validate_unity,
    validate_godot,
    get_recommended_settings,
)
from validator.report import ValidationReport

__version__ = "0.1.0"

__all__ = [
    "load_texture",
    "load_pbr_set",
    "PBRSet",
    "check_resolution",
    "check_color_space",
    "check_normal_map_format",
    "check_roughness_range",
    "check_metallic_range",
    "check_ao_range",
    "check_albedo_not_overexposed",
    "check_seamlessness",
    "normal_roughness_consistency",
    "albedo_metallic_consistency",
    "ao_geometry_consistency",
    "validate_unreal",
    "validate_unity",
    "validate_godot",
    "get_recommended_settings",
    "ValidationReport",
]
