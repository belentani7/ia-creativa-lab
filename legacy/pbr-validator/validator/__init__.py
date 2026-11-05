"""PBR texture set validator for game engines."""

from validator.checks import (
    check_albedo_not_overexposed,
    check_ao_range,
    check_color_space,
    check_metallic_range,
    check_normal_map_format,
    check_resolution,
    check_roughness_range,
    check_seamlessness,
)
from validator.consistency import (
    albedo_metallic_consistency,
    ao_geometry_consistency,
    normal_roughness_consistency,
)
from validator.engine_compat import (
    get_recommended_settings,
    validate_godot,
    validate_unity,
    validate_unreal,
)
from validator.report import ValidationReport
from validator.textures import PBRSet, load_pbr_set, load_texture

__version__ = "0.1.0"

__all__ = [
    "PBRSet",
    "ValidationReport",
    "albedo_metallic_consistency",
    "ao_geometry_consistency",
    "check_albedo_not_overexposed",
    "check_ao_range",
    "check_color_space",
    "check_metallic_range",
    "check_normal_map_format",
    "check_resolution",
    "check_roughness_range",
    "check_seamlessness",
    "get_recommended_settings",
    "load_pbr_set",
    "load_texture",
    "normal_roughness_consistency",
    "validate_godot",
    "validate_unity",
    "validate_unreal",
]
