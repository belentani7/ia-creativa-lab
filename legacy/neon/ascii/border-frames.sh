#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════════╗
# ║  NEON/NULL — Border Frame Library                           ║
# ║  Functions for drawing terminal borders in various styles.  ║
# ║  "Frame the data. Control the narrative."                   ║
# ║                            — NULL Field Manual, Chapter 4   ║
# ╚══════════════════════════════════════════════════════════════╝

# ── ANSI for borders ──────────────────────────────────────────
_BF_RED='\033[38;2;255;0;60m'
_BF_PINK='\033[38;2;255;45;107m'
_BF_CYAN='\033[38;2;0;240;255m'
_BF_DIM='\033[2m'
_BF_BOLD='\033[1m'
_BF_RESET='\033[0m'

# ── Single Line Border ────────────────────────────────────────
_neon_border_single() {
    local cols="${1:-80}"
    local rows="${2:-24}"

    # Characters
    local TL="┌" TR="┐" BL="└" BR="┘" H="─" V="│"

    local hline
    hline=$(printf '%*s' "$((cols - 2))" '' | tr ' ' "$H")

    printf "${_BF_RED}"
    printf "${TL}${hline}${TR}\n"
    for (( i=0; i<rows-2; i++ )); do
        printf "${V}%*s${V}\n" "$((cols - 2))" ""
    done
    printf "${BL}${hline}${BR}\n"
    printf "${_BF_RESET}"
}

# ── Double Line Border ────────────────────────────────────────
_neon_border_double() {
    local cols="${1:-80}"
    local rows="${2:-24}"

    local TL="╔" TR="╗" BL="╚" BR="╝" H="═" V="║"

    local hline
    hline=$(printf '%*s' "$((cols - 2))" '' | tr ' ' "$H")

    printf "${_BF_RED}${_BF_BOLD}"
    printf "${TL}${hline}${TR}\n"
    for (( i=0; i<rows-2; i++ )); do
        printf "${V}%*s${V}\n" "$((cols - 2))" ""
    done
    printf "${BL}${hline}${BR}\n"
    printf "${_BF_RESET}"
}

# ── Rounded Border ────────────────────────────────────────────
_neon_border_rounded() {
    local cols="${1:-80}"
    local rows="${2:-24}"

    local TL="╭" TR="╮" BL="╰" BR="╯" H="─" V="│"

    local hline
    hline=$(printf '%*s' "$((cols - 2))" '' | tr ' ' "$H")

    printf "${_BF_PINK}"
    printf "${TL}${hline}${TR}\n"
    for (( i=0; i<rows-2; i++ )); do
        printf "${V}%*s${V}\n" "$((cols - 2))" ""
    done
    printf "${BL}${hline}${BR}\n"
    printf "${_BF_RESET}"
}

# ── Neon Glow Border ─────────────────────────────────────────
# Uses alternating colors for a "pulsing" effect
_neon_border_glow() {
    local cols="${1:-80}"
    local rows="${2:-24}"

    local TL="╔" TR="╗" BL="╚" BR="╝" H="═" V="║"

    # Build a color-cycling horizontal line
    local hline=""
    for (( c=0; c<cols-2; c++ )); do
        if (( c % 4 < 2 )); then
            hline+="${_BF_RED}${_BF_BOLD}${H}${_BF_RESET}"
        else
            hline+="${_BF_PINK}${H}${_BF_RESET}"
        fi
    done

    # Top with neon label
    printf "${_BF_CYAN}${TL}${_BF_RESET}${hline}${_BF_CYAN}${TR}${_BF_RESET}\n"

    # Sides with alternating glow
    for (( i=0; i<rows-2; i++ )); do
        if (( i % 3 == 0 )); then
            printf "${_BF_RED}${_BF_BOLD}${V}${_BF_RESET}%*s${_BF_RED}${_BF_BOLD}${V}${_BF_RESET}\n" "$((cols - 2))" ""
        else
            printf "${_BF_PINK}${V}${_BF_RESET}%*s${_BF_PINK}${V}${_BF_RESET}\n" "$((cols - 2))" ""
        fi
    done

    # Bottom with label
    printf "${_BF_CYAN}${BL}${_BF_RESET}${hline}${_BF_CYAN}${BR}${_BF_RESET}\n"
}

# ── Status Bar ────────────────────────────────────────────────
# Draws a neon status bar at the bottom of the terminal
_neon_status_bar() {
    local cols="${1:-80}"

    local left=" ⌁ NEON/NULL "
    local center="v1.0.0"
    local right=" $(date +%H:%M:%S) "

    local pad_len=$(( cols - ${#left} - ${#center} - ${#right} ))
    (( pad_len < 0 )) && pad_len=0
    local padding
    padding=$(printf '%*s' "$pad_len" '' | tr ' ' ' ')

    printf "${_BF_RED}${_BF_BOLD}"
    printf "%s" "$left"
    printf "${_BF_RESET}${_BF_DIM}"
    printf "%s" "$padding"
    printf "${_BF_RESET}${_BF_CYAN}"
    printf "%s" "$center"
    printf "${_BF_RESET}${_BF_DIM}"
    printf "%s" "$right"
    printf "${_BF_RESET}\n"
}
