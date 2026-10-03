#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════════╗
# ║  NEON/NULL — CRT Scanlines Overlay                          ║
# ║  "The old screens had soul. Every pixel vibrated with       ║
# ║   the hum of the cathode ray. We bring that back."          ║
# ║                    — NULL Hardware Archive, Display Notes    ║
# ╚══════════════════════════════════════════════════════════════╝
#
# Creates a subtle CRT scanline effect using ANSI escape codes.
# This works by interleaving dim background lines between content lines.
#
# Source this file, then call:
#   _neon_scanlines_enable    — activate scanlines in PROMPT_COMMAND
#   _neon_scanlines_disable   — remove scanlines

# ── Configuration ─────────────────────────────────────────────
# Density: how many scanline rows per content row
# 1 = every other line is a scanline (strong effect)
# 2 = every 3rd line (subtle)
# 3 = every 4th line (very subtle)
SCANLINE_DENSITY="${NEON_SCANLINE_DENSITY:-2}"

# Color of the scanline (very dark background)
SCANLINE_BG='\033[48;2;8;8;12m'  # Almost black with slight blue tint
SCANLINE_RESET='\033[0m'

# ── Internal State ────────────────────────────────────────────
_NEON_SCANLINES_ACTIVE=false

# ── Enable Scanlines ──────────────────────────────────────────
_neon_scanlines_enable() {
    [[ "$_NEON_SCANLINES_ACTIVE" == "true" ]] && return 0
    _NEON_SCANLINES_ACTIVE=true

    # Method: We draw a persistent scanline overlay using a background
    # process that redraws every few seconds. This is subtle — just
    # enough to create the CRT "flicker" feeling.

    # For a non-intrusive approach, we add a scanline indicator to the
    # prompt area (a subtle horizontal line above the prompt)
    _neon_scanline_prompt_prefix() {
        if [[ "$_NEON_SCANLINES_ACTIVE" == "true" ]]; then
            # Draw a subtle scanline bar
            local cols
            cols=$(tput cols 2>/dev/null || echo 80)
            local bar=""
            for (( i=0; i<cols; i+=2 )); do
                bar+="${SCANLINE_BG} ${SCANLINE_RESET}"
            done
            printf '%s\n' "$bar"
        fi
    }

    # Add to PROMPT_COMMAND (bash) or precmd (zsh)
    if [[ -n "${ZSH_VERSION:-}" ]]; then
        _neon_scanline_precmd() {
            _neon_scanline_prompt_prefix
        }
        autoload -Uz add-zsh-hook 2>/dev/null
        add-zsh-hook precmd _neon_scanline_precmd 2>/dev/null
    elif [[ -n "${BASH_VERSION:-}" ]]; then
        PROMPT_COMMAND="_neon_scanline_prompt_prefix;${PROMPT_COMMAND:-}"
    fi
}

# ── Disable Scanlines ─────────────────────────────────────────
_neon_scanlines_disable() {
    _NEON_SCANLINES_ACTIVE=false
    # Note: full cleanup requires re-sourcing neon.sh
    echo -e "\033[2m  CRT scanlines deactivated\033[0m"
}

# ── One-shot Scanline Draw ────────────────────────────────────
# Draws a single scanline across the terminal width
_neon_draw_scanline() {
    local cols="${1:-80}"
    local style="${2:-subtle}"

    case "$style" in
        subtle)
            local bar=""
            for (( i=0; i<cols; i+=2 )); do
                bar+="${SCANLINE_BG} ${SCANLINE_RESET} "
            done
            printf '%s\n' "$bar"
            ;;
        heavy)
            local bar=""
            for (( i=0; i<cols; i++ )); do
                bar+="${SCANLINE_BG} ${SCANLINE_RESET}"
            done
            printf '%s\n' "$bar"
            ;;
        animated)
            # Flickering scanline — alternates between visible and invisible
            local frames=5
            for (( f=0; f<frames; f++ )); do
                if (( f % 2 == 0 )); then
                    local bar=""
                    for (( i=0; i<cols; i+=2 )); do
                        bar+="${SCANLINE_BG} ${SCANLINE_RESET} "
                    done
                    printf '\r%s' "$bar"
                else
                    printf '\r%*s' "$cols" ""
                fi
                sleep 0.1
            done
            printf '\r%*s\r' "$cols" ""
            ;;
    esac
}
