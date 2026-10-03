#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════════╗
# ║  NEON/NULL — Matrix Rain Effect                             ║
# ║  "Watch the data fall. Each character is a whisper          ║
# ║   from the network — decode it if you can."                 ║
# ║                   — NULL Signal Analysis, Appendix F         ║
# ╚══════════════════════════════════════════════════════════════╝
#
# Usage: rain.sh [--speed MS] [--density N] [--color red|green|cyan]
#
# Hidden: The character pool is constructed so that, when decoded
# via ASCII values mod 26, the letters spell out:
#   F-R-E-E-D-O-M  O-F  I-N-F-O-R-M-A-T-I-O-N
# The NEON/NULL collective embeds messages in everything.

set -uo pipefail

# ── Defaults ──────────────────────────────────────────────────
SPEED=50
DENSITY=15
COLOR="red"

# ── Parse Arguments ───────────────────────────────────────────
while [[ $# -gt 0 ]]; do
    case "$1" in
        --speed)    SPEED="$2"; shift 2 ;;
        --density)  DENSITY="$2"; shift 2 ;;
        --color)    COLOR="$2"; shift 2 ;;
        *) shift ;;
    esac
done

# ── Colors ────────────────────────────────────────────────────
case "$COLOR" in
    red)
        RAIN_COLOR='\033[38;2;255;0;60m'
        RAIN_DIM='\033[38;2;128;0;30m'
        ;;
    green)
        RAIN_COLOR='\033[38;2;0;255;65m'
        RAIN_DIM='\033[38;2;0;128;32m'
        ;;
    cyan)
        RAIN_COLOR='\033[38;2;0;240;255m'
        RAIN_DIM='\033[38;2;0;120;128m'
        ;;
    *)
        RAIN_COLOR='\033[38;2;255;0;60m'
        RAIN_DIM='\033[38;2;128;0;30m'
        ;;
esac

RESET='\033[0m'
DIM='\033[2m'

# ── Character Pool ────────────────────────────────────────────
# Mix of katakana, latin, numbers, and symbols
# Selected characters encode NEON/NULL messages when analyzed
RAIN_CHARS='ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎ0123456789ABCDEF<>{}[]|/\\*#@&%=+-~^'

# ── Terminal Size ─────────────────────────────────────────────
if command -v tput &>/dev/null; then
    COLS=$(tput cols 2>/dev/null || echo 80)
    ROWS=$(tput lines 2>/dev/null || echo 24)
else
    COLS=80
    ROWS=24
fi

# ── State Arrays ──────────────────────────────────────────────
declare -a DROPS
declare -a SPEEDS
declare -a LENGTHS

for (( i=0; i<COLS; i++ )); do
    DROPS[$i]=$(( RANDOM % ROWS ))
    SPEEDS[$i]=$(( RANDOM % 3 + 1 ))
    LENGTHS[$i]=$(( RANDOM % 10 + 5 ))
done

# ── Random Char Function ─────────────────────────────────────
random_char() {
    local pool_len=${#RAIN_CHARS}
    # Use byte offset for multi-byte chars (katakana = 3 bytes each in UTF-8)
    local idx=$(( RANDOM % (pool_len / 3) * 3 ))
    printf '%s' "${RAIN_CHARS:$idx:3}"
}

# ── Cleanup ───────────────────────────────────────────────────
cleanup() {
    tput cnorm 2>/dev/null   # Show cursor
    printf '\033[0m'         # Reset colors
    tput sgr0 2>/dev/null
    # Move cursor to bottom
    tput cup "$((ROWS - 1))" 0 2>/dev/null
    exit 0
}

trap cleanup EXIT INT TERM

# ── Hide Cursor ───────────────────────────────────────────────
tput civis 2>/dev/null

# ── Main Loop ─────────────────────────────────────────────────
while true; do
    for (( col=0; col<COLS; col++ )); do
        # Only update this column if it's "active" (density check)
        if (( col % (COLS / DENSITY + 1) != 0 )); then
            continue
        fi

        local_row=${DROPS[$col]}
        speed=${SPEEDS[$col]}
        length=${LENGTHS[$col]}

        # Draw head character (bright)
        if (( local_row >= 0 && local_row < ROWS )); then
            char=$(random_char)
            printf '\033[%d;%dH' "$((local_row + 1))" "$((col + 1))"
            printf "${RAIN_COLOR}${char}${RESET}"
        fi

        # Draw tail (dimmer, fading)
        for (( t=1; t<length; t++ )); do
            tail_row=$(( local_row - t ))
            if (( tail_row >= 0 && tail_row < ROWS )); then
                char=$(random_char)
                if (( t < length / 2 )); then
                    printf '\033[%d;%dH' "$((tail_row + 1))" "$((col + 1))"
                    printf "${RAIN_DIM}${char}${RESET}"
                else
                    printf '\033[%d;%dH' "$((tail_row + 1))" "$((col + 1))"
                    printf "${DIM}${char}${RESET}"
                fi
            fi
        done

        # Erase character above the tail (cleanup)
        erase_row=$(( local_row - length ))
        if (( erase_row >= 0 && erase_row < ROWS )); then
            printf '\033[%d;%dH ' "$((erase_row + 1))" "$((col + 1))"
        fi

        # Advance drop
        if (( local_row % speed == 0 )); then
            DROPS[$col]=$(( (local_row + 1) % (ROWS + length) ))
        else
            DROPS[$col]=$(( local_row + 1 ))
        fi

        # Reset drop when it falls off screen
        if (( DROPS[$col] > ROWS + length )); then
            DROPS[$col]=0
            SPEEDS[$col]=$(( RANDOM % 3 + 1 ))
            LENGTHS[$col]=$(( RANDOM % 10 + 5 ))
        fi
    done

    # Frame delay
    sleep "$(echo "scale=3; $SPEED / 1000" | bc 2>/dev/null || echo "0.05")"
done
