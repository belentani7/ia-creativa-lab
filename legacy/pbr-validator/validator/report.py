"""Validation report generation for PBR texture sets."""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from typing import Any, Optional

import numpy as np

from validator.checks import (
    check_resolution,
    check_seamlessness,
)
from validator.consistency import (
    normal_roughness_consistency,
    albedo_metallic_consistency,
    ao_geometry_consistency,
)
from validator.textures import PBRSet


@dataclass
class ValidationReport:
    """Comprehensive validation report for a PBR texture set."""

    textures: dict[str, Any]
    engine_issues: dict[str, list[str]] = field(default_factory=dict)
    resolution_issues: list[str] = field(default_factory=list)
    seamlessness_scores: dict[str, float] = field(default_factory=dict)
    consistency_scores: dict[str, float] = field(default_factory=dict)
    color_space_checks: dict[str, str] = field(default_factory=dict)
    warnings: list[str] = field(default_factory=list)

    def overall_score(self) -> float:
        """Compute an overall quality score from 0.0 (worst) to 1.0 (best).

        Score is based on:
        - Number of critical issues (penalty)
        - Seamlessness scores (bonus)
        - Consistency scores (bonus)
        """
        # Count critical issues
        total_issues = 0
        total_issues += len(self.resolution_issues)
        for issues in self.engine_issues.values():
            total_issues += len(issues)
        for check in self.color_space_checks.values():
            if check != "ok":
                total_issues += 1

        # Base score penalized by issues (max -0.5 penalty)
        issue_penalty = min(0.5, total_issues * 0.05)
        base = 1.0 - issue_penalty

        # Seamlessness bonus (average, lower is better)
        if self.seamlessness_scores:
            seam_avg = np.mean(list(self.seamlessness_scores.values()))
            # seamlessness: 0 is best, 1 is worst; invert for score
            base += (1.0 - seam_avg) * 0.15

        # Consistency bonus
        if self.consistency_scores:
            cons_avg = np.mean(list(self.consistency_scores.values()))
            base += cons_avg * 0.15

        return max(0.0, min(1.0, base))

    def to_json(self) -> str:
        """Serialize the report to JSON."""
        data = {
            "resolution_issues": self.resolution_issues,
            "engine_issues": self.engine_issues,
            "seamlessness_scores": self.seamlessness_scores,
            "consistency_scores": self.consistency_scores,
            "color_space_checks": self.color_space_checks,
            "warnings": self.warnings,
            "overall_score": round(self.overall_score(), 3),
        }
        return json.dumps(data, indent=2)

    def to_markdown(self) -> str:
        """Generate a Markdown-formatted report."""
        lines: list[str] = []
        score = self.overall_score()

        # Header
        if score >= 0.8:
            status = "PASS"
        elif score >= 0.5:
            status = "WARNING"
        else:
            status = "FAIL"

        lines.append(f"# PBR Validation Report — {status} ({score:.1%})")
        lines.append("")

        # Resolution
        if self.resolution_issues:
            lines.append("## Resolution Issues")
            for issue in self.resolution_issues:
                lines.append(f"- {issue}")
            lines.append("")

        # Engine Issues
        for engine, issues in self.engine_issues.items():
            if issues:
                lines.append(f"## {engine.title()} Compatibility")
                for issue in issues:
                    lines.append(f"- {issue}")
                lines.append("")

        # Color Space
        if self.color_space_checks:
            lines.append("## Color Space Checks")
            for tex, status in self.color_space_checks.items():
                marker = "OK" if status == "ok" else "WARN"
                lines.append(f"- **{tex}**: [{marker}] {status}")
            lines.append("")

        # Seamlessness
        if self.seamlessness_scores:
            lines.append("## Seamlessness Scores")
            for tex, score in self.seamlessness_scores.items():
                quality = "Good" if score < 0.1 else "Fair" if score < 0.3 else "Poor"
                lines.append(f"- **{tex}**: {score:.3f} ({quality})")
            lines.append("")

        # Consistency
        if self.consistency_scores:
            lines.append("## Consistency Scores")
            for check, score in self.consistency_scores.items():
                quality = "Good" if score > 0.7 else "Fair" if score > 0.4 else "Poor"
                lines.append(f"- **{check}**: {score:.3f} ({quality})")
            lines.append("")

        # Warnings
        if self.warnings:
            lines.append("## Warnings")
            for w in self.warnings:
                lines.append(f"- {w}")
            lines.append("")

        return "\n".join(lines)


def generate_report(
    pbr: PBRSet,
    engine_issues: Optional[dict[str, list[str]]] = None,
) -> ValidationReport:
    """Generate a comprehensive validation report for a PBR set.

    Args:
        pbr: The loaded PBR texture set.
        engine_issues: Pre-computed engine compatibility issues, keyed by engine name.

    Returns:
        ValidationReport with all checks performed.
    """
    textures = {
        "albedo": pbr.albedo,
        "normal": pbr.normal,
        "roughness": pbr.roughness,
        "metallic": pbr.metallic,
        "ao": pbr.ao,
    }

    report = ValidationReport(
        textures=pbr.paths,
        engine_issues=engine_issues or {},
    )

    # Resolution check
    report.resolution_issues = check_resolution(textures)

    # Seamlessness
    for name, tex in textures.items():
        report.seamlessness_scores[name] = check_seamlessness(tex)

    # Consistency checks
    report.consistency_scores["normal_roughness"] = normal_roughness_consistency(
        pbr.normal, pbr.roughness
    )
    report.consistency_scores["albedo_metallic"] = albedo_metallic_consistency(
        pbr.albedo, pbr.metallic
    )
    report.consistency_scores["ao_geometry"] = ao_geometry_consistency(
        pbr.ao, pbr.normal
    )

    return report
