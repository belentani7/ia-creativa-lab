#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════════╗
# ║  NEON/NULL — Glitch Effect Processor                        ║
# ║  "Corruption is just another word for transformation."      ║
# ║                  — NULL Technical Reference, Section 0x2A    ║
# ╚══════════════════════════════════════════════════════════════╝
#
# Usage:
#   echo "text" | glitch.sh [intensity]     — pipe mode
#   glitch.sh [intensity] "text"            — argument mode
#   glitch.sh --file FILE [intensity]       — file mode
#
# Intensity: 0.01 (barely noticeable) to 0.5 (unrecognizable chaos)
# Default: 0.05

set -uo pipefail

# ── Configuration ─────────────────────────────────────────────
INTENSITY="${1:-0.05}"
INPUT_MODE="stdin"  # stdin, args, file
INPUT_FILE=""

# ── Parse Arguments ───────────────────────────────────────────
if [[ "${1:-}" == "--file" ]]; then
    INPUT_MODE="file"
    INPUT_FILE="${2:-}"
    INTENSITY="${3:-0.05}"
elif [[ $# -gt 0 ]] && ! [[ -p /dev/stdin ]]; then
    # First arg might be intensity or text
    if [[ "$1" =~ ^0\.[0-9]+$ ]] || [[ "$1" =~ ^[0-9]+$ ]]; then
        INTENSITY="$1"
        shift
        if [[ $# -gt 0 ]]; then
            INPUT_MODE="args"
        fi
    else
        INPUT_MODE="args"
    fi
fi

# ── Glitch Character Sets ─────────────────────────────────────
# Combining diacritical marks — these overlay on existing characters
COMBINING_CHARS=(
    '̴' '̵' '̶' '̷' '̸' '̡' '̢' '̧' '̨' '̛'
    '̖' '̗' '̘' '̙' '̜' '̝' '̞' '̟' '̠' '̤'
    '̥' '̦' '̩' '̪' '̫' '̬' '̭' '̮' '̯' '̰'
    '̱' '̲' '̳' '̹' '̺' '̻' '̼'
)

# Full replacement glitch characters — used for heavier corruption
REPLACE_CHARS=(
    '█' '▓' '▒' '░' '▀' '▄' '▌' '▐'
    '■' '□' '▪' '▫' '◆' '◇' '◈' '○'
    '●' '◌' '◍' '◎' '⊕' '⊗' '⊘' '⊙'
    '⌀' '⌁' '⌂' '⌘' '⎔' '⏣' '⏢' '⏥'
)

# ── Intensity to Percentage ───────────────────────────────────
# Convert 0.05 -> 5 (percent chance per character)
get_intensity_pct() {
    local val="$1"
    # Handle decimal multiplication without bc
    if command -v bc &>/dev/null; then
        echo "scale=0; $val * 100" | bc
    else
        # Fallback: multiply by 100 using bash
        local int_part="${val%%.*}"
        local dec_part="${val#*.}"
        # Pad decimal to 2 digits
        dec_part="${dec_part}00"
        dec_part="${dec_part:0:2}"
        echo $(( ${int_part:-0} * 100 + ${dec_part#0} ))
    fi
}

INTENSITY_PCT=$(get_intensity_pct "$INTENSITY")
(( INTENSITY_PCT < 1 )) && INTENSITY_PCT=1
(( INTENSITY_PCT > 100 )) && INTENSITY_PCT=100

# ── Glitch Processor ──────────────────────────────────────────
glitch_line() {
    local line="$1"
    local output=""
    local i

    for (( i=0; i<${#line}; i++ )); do
        local char="${line:$i:1}"
        output+="$char"

        # Chance to add combining character (stacking glitch)
        if (( RANDOM % 100 < INTENSITY_PCT )); then
            local idx=$(( RANDOM % ${#COMBINING_CHARS[@]} ))
            output+="${COMBINING_CHARS[$idx]}"
        fi

        # Chance to add a second combining character (heavier at higher intensity)
        if (( RANDOM % 200 < INTENSITY_PCT )); then
            local idx=$(( RANDOM % ${#COMBINING_CHARS[@]} ))
            output+="${COMBINING_CHARS[$idx]}"
        fi

        # At very high intensity, chance to replace char entirely
        if (( INTENSITY_PCT > 20 && RANDOM % 100 < (INTENSITY_PCT / 4) )); then
            local idx=$(( RANDOM % ${#REPLACE_CHARS[@]} ))
            # Remove the original char we just added and replace
            output="${output%?}"
            output+="${REPLACE_CHARS[$idx]}"
        fi
    done

    printf '%s\n' "$output"
}

# ── Glitch Stream ─────────────────────────────────────────────
glitch_stream() {
    while IFS= read -r line; do
        glitch_line "$line"
    done
}

# ── Main ──────────────────────────────────────────────────────
case "$INPUT_MODE" in
    stdin)
        if [[ -p /dev/stdin ]]; then
            glitch_stream
        else
            echo "Usage: echo 'text' | glitch.sh [intensity]"
            echo "       glitch.sh [intensity] 'text'"
            echo "       glitch.sh --file FILE [intensity]"
            exit 1
        fi
        ;;
    args)
        glitch_line "$*"
        ;;
    file)
        if [[ -f "$INPUT_FILE" ]]; then
            glitch_stream < "$INPUT_FILE"
        else
            echo "Error: file not found: $INPUT_FILE" >&2
            exit 1
        fi
        ;;
esac
