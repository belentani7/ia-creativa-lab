"""CLI interface for pbr-validator."""

from __future__ import annotations

import sys
from pathlib import Path

import click

from validator import (
    load_texture,
    load_pbr_set,
    check_normal_map_format,
    check_roughness_range,
    check_metallic_range,
    check_ao_range,
    check_albedo_not_overexposed,
    validate_unreal,
    validate_unity,
    validate_godot,
    get_recommended_settings,
)
from validator.checks import check_resolution, check_color_space
from validator.report import generate_report, ValidationReport


@click.group()
@click.version_option(package_name="pbr-validator")
def cli():
    """PBR texture validator for game engines."""
    pass


@cli.command()
@click.argument("albedo", type=click.Path(exists=True))
@click.argument("normal", type=click.Path(exists=True))
@click.argument("roughness", type=click.Path(exists=True))
@click.argument("metallic", type=click.Path(exists=True))
@click.argument("ao", type=click.Path(exists=True))
@click.option("--engine", type=click.Choice(["unreal", "unity", "godot"]), default=None)
@click.option("--json", "output_json", is_flag=True, help="Output as JSON")
@click.option("--markdown", "output_md", is_flag=True, help="Output as Markdown")
def validate(albedo, normal, roughness, metallic, ao, engine, output_json, output_md):
    """Validate a complete PBR texture set.

    ALBEDO, NORMAL, ROUGHNESS, METALLIC, AO are paths to texture files.
    """
    try:
        pbr = load_pbr_set(albedo, normal, roughness, metallic, ao)
    except FileNotFoundError as e:
        click.echo(f"Error: {e}", err=True)
        sys.exit(1)

    engine_issues: dict[str, list[str]] = {}
    if engine:
        validators = {
            "unreal": validate_unreal,
            "unity": validate_unity,
            "godot": validate_godot,
        }
        engine_issues[engine] = validators[engine](pbr)

    report = generate_report(pbr, engine_issues)

    if output_json:
        click.echo(report.to_json())
    elif output_md:
        click.echo(report.to_markdown())
    else:
        score = report.overall_score()
        if score >= 0.8:
            click.echo(f"PASS ({score:.1%})")
        elif score >= 0.5:
            click.echo(f"WARNING ({score:.1%})")
        else:
            click.echo(f"FAIL ({score:.1%})")

        # Show issues
        if report.resolution_issues:
            click.echo("\nResolution Issues:")
            for issue in report.resolution_issues:
                click.echo(f"  - {issue}")

        for eng, issues in report.engine_issues.items():
            if issues:
                click.echo(f"\n{eng.title()} Issues:")
                for issue in issues:
                    click.echo(f"  - {issue}")

        if report.warnings:
            click.echo("\nWarnings:")
            for w in report.warnings:
                click.echo(f"  - {w}")


@cli.command()
@click.argument("texture", type=click.Path(exists=True))
@click.option(
    "--type",
    "tex_type",
    type=click.Choice(["albedo", "normal", "roughness", "metallic", "ao"]),
    required=True,
    help="Texture type to check.",
)
def check(texture, tex_type):
    """Check a single texture file."""
    try:
        data = load_texture(texture)
    except FileNotFoundError as e:
        click.echo(f"Error: {e}", err=True)
        sys.exit(1)

    click.echo(f"Texture: {texture}")
    click.echo(f"Type: {tex_type}")
    click.echo(f"Resolution: {data.shape[1]}x{data.shape[0]}")
    click.echo(f"Value range: [{data.min():.4f}, {data.max():.4f}]")
    click.echo(f"Mean: {data.mean():.4f}")

    if tex_type == "normal":
        fmt = check_normal_map_format(data)
        click.echo(f"Format: {fmt}")

    if tex_type == "roughness":
        issues = check_roughness_range(data)
        if issues:
            click.echo("Issues:")
            for i in issues:
                click.echo(f"  - {i}")
        else:
            click.echo("Roughness range: OK")

    if tex_type == "metallic":
        issues = check_metallic_range(data)
        if issues:
            click.echo("Issues:")
            for i in issues:
                click.echo(f"  - {i}")
        else:
            click.echo("Metallic range: OK")

    if tex_type == "ao":
        issues = check_ao_range(data)
        if issues:
            click.echo("Issues:")
            for i in issues:
                click.echo(f"  - {i}")
        else:
            click.echo("AO range: OK")

    if tex_type == "albedo":
        if check_albedo_not_overexposed(data):
            click.echo("Warning: Albedo appears overexposed")
        else:
            click.echo("Albedo exposure: OK")


if __name__ == "__main__":
    cli()
