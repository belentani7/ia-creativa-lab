# pbr-validator

Validates PBR texture sets for correctness and compatibility with game engines (Unreal Engine, Unity, Godot).

## Features

- **Texture Validation**: Resolution checks, color space verification, range validation
- **Consistency Checks**: Cross-texture consistency (normal/roughness, albedo/metallic, AO/geometry)
- **Engine Compatibility**: Unreal Engine, Unity, and Godot validation with recommended settings
- **Reporting**: JSON and Markdown reports with overall quality scores
- **CLI**: Command-line interface for quick validation

## Supported Texture Types

| Texture | Purpose |
|---------|---------|
| Albedo | Base color (no lighting) |
| Normal | Surface normal perturbation |
| Roughness | Micro-surface roughness |
| Metallic | Metallic/insulator mask |
| AO | Ambient occlusion |

## Installation

```bash
pip install pbr-validator
```

Or from source:

```bash
git clone https://github.com/belentani7/pbr-validator.git
cd pbr-validator
pip install -e .
```

## CLI Usage

### Validate a full PBR set

```bash
pbrv validate albedo.png normal.png roughness.png metallic.png ao.png --engine unreal
```

### Check a single texture

```bash
pbrv check normal.png --type normal
pbrv check roughness.png --type roughness
```

### Engine-specific validation

```bash
pbrv validate albedo.png normal.png roughness.png metallic.png ao.png --engine unity
pbrv validate albedo.png normal.png roughness.png metallic.png ao.png --engine godot
```

## Python API

```python
from validator import load_pbr_set, validate_unreal
from validator.report import ValidationReport

pbr = load_pbr_set(
    albedo="albedo.png",
    normal="normal.png",
    roughness="roughness.png",
    metallic="metallic.png",
    ao="ao.png",
)

issues = validate_unreal(pbr)
for issue in issues:
    print(issue)
```

## Development

```bash
pip install -e ".[dev]"
pytest
```

## License

MIT
