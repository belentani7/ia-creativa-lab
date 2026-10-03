#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════════╗
# ║  NEON/NULL — Post-Command Hook                              ║
# ║  "Every command leaves a trace. We make the traces glow."   ║
# ║                   — NULL Forensics Division, Case Study 9    ║
# ╚══════════════════════════════════════════════════════════════╝
#
# Runs after each command execution.
# Shows timing, exit codes, and applies glitch on errors.
#
# Source this file. Call _neon_post_command EXIT_CODE START_TIME_NS

# ── Colors ────────────────────────────────────────────────────
_PC_RED='\033[38;2;255;0;60m'
_PC_GREEN='\033[38;2;0;255;65m'
_PC_CYAN='\033[38;2;0;240;255m'
_PC_PINK='\033[38;2;255;45;107m'
_PC_DIM='\033[2m'
_PC_BOLD='\033[1m'
_PC_RESET='\033[0m'

# ── Configuration ─────────────────────────────────────────────
# Minimum execution time (in seconds) to show timing
# Commands faster than this are silent
_PC_MIN_DISPLAY_TIME="${NEON_POSTCMD_MIN_TIME:-1}"

# Show exit code always, or only on error
_PC_SHOW_EXIT_ALWAYS="${NEON_POSTCMD_EXIT_ALWAYS:-false}"

# Glitch on error
_PC_GLITCH_ON_ERROR="${NEON_POSTCMD_GLITCH_ERROR:-true}"

# ── Post-Command Function ─────────────────────────────────────
_neon_post_command() {
    local exit_code="${1:-0}"
    local start_time="${2:-}"

    # Skip if no start time or if this is a prompt refresh (empty command)
    [[ -z "$start_time" ]] && return 0

    # Calculate duration
    local end_time
    end_time=$(date +%s%N 2>/dev/null || date +%s)
    local duration_ns=$(( end_time - start_time ))
    local duration_s=0

    # Handle nanosecond vs second precision
    if (( duration_ns > 1000000000 )); then
        # Nanosecond precision
        duration_s=$(( duration_ns / 1000000000 ))
    elif (( duration_ns > 0 )); then
        duration_s="$duration_ns"
    fi

    # Skip if too fast (and not an error)
    if (( duration_s < _PC_MIN_DISPLAY_TIME )) && (( exit_code == 0 )); then
        return 0
    fi

    # Format duration
    local dur_str=""
    if (( duration_s >= 3600 )); then
        dur_str="$(( duration_s / 3600 ))h $(( (duration_s % 3600) / 60 ))m $(( duration_s % 60 ))s"
    elif (( duration_s >= 60 )); then
        dur_str="$(( duration_s / 60 ))m $(( duration_s % 60 ))s"
    elif (( duration_s > 0 )); then
        dur_str="${duration_s}s"
    else
        dur_str="<1s"
    fi

    # Build status line
    local status_line="  "

    # Exit code indicator
    if (( exit_code == 0 )); then
        status_line+="${_PC_GREEN}✓${_PC_RESET}"
    else
        status_line+="${_PC_RED}${_PC_BOLD}✗ ${exit_code}${_PC_RESET}"
    fi

    # Duration
    if [[ -n "$dur_str" ]]; then
        status_line+=" ${_PC_DIM}${dur_str}${_PC_RESET}"
    fi

    # Network status decoration (lore: NEON/NULL relay)
    status_line+=" ${_PC_DIM}⌁${_PC_RESET}"

    # Print the status line
    echo -e "$status_line"

    # Glitch effect on error
    if (( exit_code != 0 )) && [[ "$_PC_GLITCH_ON_ERROR" == "true" ]]; then
        _neon_error_glitch "$exit_code"
    fi
}

# ── Error Glitch ──────────────────────────────────────────────
# Shows a brief glitch animation on command failure
_neon_error_glitch() {
    local code="$1"
    local glitch_text="ERR:${code}//NEON/NULL::SIGNAL_LOST"

    # Only show ~30% of the time to avoid being annoying
    if (( RANDOM % 100 < 30 )); then
        # Quick glitch flash
        local glitch_chars=('█' '▓' '▒' '░' '╳' '╱' '╲' '┃' '┫' '┣')
        local glitch_line=""
        local cols
        cols=$(tput cols 2>/dev/null || echo 80)

        for (( i=0; i<cols/2; i++ )); do
            local idx=$(( RANDOM % ${#glitch_chars[@]} ))
            glitch_line+="${glitch_chars[$idx]}"
        done

        # Flash the glitch line briefly
        printf '\r\033[38;2;255;0;60m\033[2m%s\033[0m' "$glitch_line"
        sleep 0.08
        printf '\r%*s\r' "$cols" ""
    fi
}

# ── Pre-Command Timer ────────────────────────────────────────
# Call this in preexec/DEBUG trap to start the timer
_neon_preexec_timer() {
    _NEON_CMD_START_NS=$(date +%s%N 2>/dev/null || date +%s)
}
