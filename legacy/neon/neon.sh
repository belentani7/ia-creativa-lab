#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════════╗
# ║  NEON/NULL — Cyberpunk Terminal Skin v1.0.0                  ║
# ║  "The net is vast and infinite." — NEON/NULL Collective     ║
# ║  Classified: TIER-0 // Distribution: OPEN                   ║
# ╚══════════════════════════════════════════════════════════════╝
#
# Main entry point. Source this in your .bashrc/.zshrc to activate.
# Detected AI CLIs are automatically wrapped in cinematic effects.

# ── Guard: prevent double-source ──────────────────────────────
[[ -n "$_NEON_LOADED" ]] && return 0
_NEON_LOADED=1

# ── Resolve NEON home ────────────────────────────────────────
NEON_HOME="${NEON_HOME:-$HOME/.neon}"
NEON_VERSION="1.0.0"

# ── ANSI Palette ──────────────────────────────────────────────
# Neon/NULL standard issue — do not redistribute without attribution
if [[ -t 1 ]]; then
    _N_RED='\033[38;2;255;0;60m'        # primary — blood neon
    _N_PINK='\033[38;2;255;45;107m'     # secondary — hot wire
    _N_CYAN='\033[38;2;0;240;255m'      # accent — ice data
    _N_GREEN='\033[38;2;0;255;65m'      # matrix green
    _N_YELLOW='\033[38;2;255;230;0m'    # warning amber
    _N_DIM='\033[2m'
    _N_BOLD='\033[1m'
    _N_BLINK='\033[5m'
    _N_REV='\033[7m'
    _N_RESET='\033[0m'
    _N_FAINT='\033[2m'
    _N_ITALIC='\033[3m'
    _N_STRIKE='\033[9m'
    _N_UNDERLINE='\033[4m'
    # Background variants
    _N_BG_RED='\033[48;2;255;0;60m'
    _N_BG_CYAN='\033[48;2;0;240;255m'
    _N_BG_DARK='\033[48;2;10;10;15m'
fi

# ── Config Loader ─────────────────────────────────────────────
_neon_load_config() {
    local config_file="${NEON_HOME}/config"
    local theme_file

    # Defaults (NEON/NULL standard config — see docs/null-manifesto.md)
    NEON_PRIMARY="${NEON_PRIMARY:-#ff003c}"
    NEON_SECONDARY="${NEON_SECONDARY:-#ff2d6b}"
    NEON_ACCENT="${NEON_ACCENT:-#00f0ff}"
    NEON_GLITCH_INTENSITY="${NEON_GLITCH_INTENSITY:-0.05}"
    NEON_BORDER_STYLE="${NEON_BORDER_STYLE:-double}"
    NEON_ENABLE_RAIN="${NEON_ENABLE_RAIN:-true}"
    NEON_ENABLE_SOUND="${NEON_ENABLE_SOUND:-false}"
    NEON_ENABLE_SCANLINES="${NEON_ENABLE_SCANLINES:-true}"
    NEON_ENABLE_BORDER="${NEON_ENABLE_BORDER:-true}"
    NEON_ENABLE_GLOW="${NEON_ENABLE_GLOW:-true}"
    NEON_TIMESTAMP_FMT="${NEON_TIMESTAMP_FMT:-%H:%M:%S}"
    NEON_RAIN_SPEED="${NEON_RAIN_SPEED:-50}"
    NEON_RAIN_DENSITY="${NEON_RAIN_DENSITY:-15}"
    NEON_RAIN_COLOR="${NEON_RAIN_COLOR:-red}"
    NEON_AI_INDICATOR="${NEON_AI_INDICATOR:-true}"
    NEON_SESSION_TRACKER="${NEON_SESSION_TRACKER:-true}"

    [[ -f "$config_file" ]] && source "$config_file" 2>/dev/null

    # Load active theme
    theme_file="${NEON_HOME}/themes/${NEON_ACTIVE_THEME:-default}.theme"
    [[ -f "$theme_file" ]] && source "$theme_file" 2>/dev/null
}

# ── Terminal Detection ────────────────────────────────────────
_neon_detect_env() {
    NEON_IN_TMUX=false
    NEON_IN_SCREEN=false
    NEON_TERM_COLS=80
    NEON_TERM_ROWS=24

    [[ -n "$TMUX" ]] && NEON_IN_TMUX=true
    [[ "$TERM" == screen* ]] && NEON_IN_SCREEN=true

    if command -v tput &>/dev/null; then
        NEON_TERM_COLS=$(tput cols 2>/dev/null || echo 80)
        NEON_TERM_ROWS=$(tput lines 2>/dev/null || echo 24)
    fi
}

# ── Neon Prompt ───────────────────────────────────────────────
# Replaces PS1 with NEON/NULL branded prompt
neon_prompt() {
    local ts
    ts=$(date +"${NEON_TIMESTAMP_FMT}")

    # Build segments
    local time_seg="${_N_DIM}${_N_CYAN}[${ts}]${_N_RESET}"
    local user_seg="${_N_RED}⟨$(whoami)⟩${_N_RESET}"
    local dir_seg="${_N_PINK}$(basename "$PWD")${_N_RESET}"
    local git_seg=""

    # Git branch detection
    if command -v git &>/dev/null; then
        local branch
        branch=$(git branch --show-current 2>/dev/null)
        if [[ -n "$branch" ]]; then
            git_seg=" ${_N_DIM}${_N_ACCENT}⎇ ${branch}${_N_RESET}"
        fi
    fi

    # AI mode indicator
    local ai_seg=""
    if [[ "$_NEON_AI_ACTIVE" == "true" ]]; then
        ai_seg=" ${_N_BLINK}${_N_RED}◈ AI${_N_RESET}"
    fi

    # Network status (lore: NEON/NULL network)
    local net_seg="${_N_DIM}${_N_FAINT} ⌁NULL${_N_RESET}"

    # Assemble — the prompt arrow is a lambda (λ), a nod to the hackers
    PS1="\n${time_seg} ${user_seg}${_N_DIM}┤${_N_RESET} ${dir_seg}${git_seg}${ai_seg}${net_seg}\n${_N_RED}λ${_N_RESET} "
}

# ── Neon Border ───────────────────────────────────────────────
# Draws a glowing border around the terminal viewport
neon_border() {
    [[ "$NEON_ENABLE_BORDER" != "true" ]] && return 0
    [[ "$NEON_IN_TMUX" == "true" ]] && return 0  # tmux handles its own borders

    local style="${1:-$NEON_BORDER_STYLE}"
    _neon_detect_env

    # Source border frame functions
    local border_lib="${NEON_HOME}/ascii/border-frames.sh"
    [[ -f "$border_lib" ]] && source "$border_lib"

    case "$style" in
        single)  _neon_border_single "$NEON_TERM_COLS" "$NEON_TERM_ROWS" ;;
        double)  _neon_border_double "$NEON_TERM_COLS" "$NEON_TERM_ROWS" ;;
        rounded) _neon_border_rounded "$NEON_TERM_COLS" "$NEON_TERM_ROWS" ;;
        glow)    _neon_border_glow "$NEON_TERM_COLS" "$NEON_TERM_ROWS" ;;
        *)       _neon_border_double "$NEON_TERM_COLS" "$NEON_TERM_ROWS" ;;
    esac
}

# ── Glitch Effect ─────────────────────────────────────────────
# Corrupts text output with unicode zalgo/glitch characters
# Usage: echo "text" | neon_glitch [intensity]
neon_glitch() {
    local intensity="${1:-$NEON_GLITCH_INTENSITY}"

    # Glitch character pool — sourced from NEON/NULL signal interference table
    local glitch_chars=(
        '̴' '̵' '̶' '̷' '̸' '̡' '̢' '̧' '̨' '̛'
        '̖' '̗' '̘' '̙' '̜' '̝' '̞' '̟' '̠' '̤'
        '̥' '̦' '̩' '̪' '̫' '̬' '̭' '̮' '̯' '̰'
        '̱' '̲' '̳' '̹' '̺' '̻' '̼' '͂' '̓' '̈́'
    )

    if [[ -p /dev/stdin ]]; then
        # Pipe mode — process stdin
        while IFS= read -r line; do
            local output=""
            local i
            for (( i=0; i<${#line}; i++ )); do
                local char="${line:$i:1}"
                output+="$char"
                # Random chance to add glitch
                if (( RANDOM % 100 < $(echo "$intensity * 100" | bc 2>/dev/null || echo 5) )); then
                    local idx=$(( RANDOM % ${#glitch_chars[@]} ))
                    output+="${glitch_chars[$idx]}"
                fi
            done
            printf '%s\n' "$output"
        done
    else
        # Argument mode
        local text="$*"
        local output=""
        local i
        for (( i=0; i<${#text}; i++ )); do
            local char="${text:$i:1}"
            output+="$char"
            if (( RANDOM % 100 < $(echo "$intensity * 100" | bc 2>/dev/null || echo 5) )); then
                local idx=$(( RANDOM % ${#glitch_chars[@]} ))
                output+="${glitch_chars[$idx]}"
            fi
        done
        printf '%s\n' "$output"
    fi
}

# ── Matrix Rain ───────────────────────────────────────────────
# Launches matrix-style code rain in the background
# Usage: neon_rain [start|stop]
neon_rain() {
    local action="${1:-start}"

    case "$action" in
        start)
            [[ "$NEON_ENABLE_RAIN" != "true" ]] && return 0
            [[ -n "$_NEON_RAIN_PID" ]] && return 0  # already running

            local rain_script="${NEON_HOME}/effects/rain.sh"
            if [[ -f "$rain_script" ]]; then
                bash "$rain_script" \
                    --speed "${NEON_RAIN_SPEED}" \
                    --density "${NEON_RAIN_DENSITY}" \
                    --color "${NEON_RAIN_COLOR}" &
                _NEON_RAIN_PID=$!
                disown "$_NEON_RAIN_PID" 2>/dev/null
            fi
            ;;
        stop)
            if [[ -n "$_NEON_RAIN_PID" ]]; then
                kill "$_NEON_RAIN_PID" 2>/dev/null
                wait "$_NEON_RAIN_PID" 2>/dev/null
                unset _NEON_RAIN_PID
            fi
            # Kill any orphaned rain processes
            pkill -f "neon.*rain.sh" 2>/dev/null
            ;;
        *)
            echo "Usage: neon_rain [start|stop]"
            ;;
    esac
}

# ── Scanlines Overlay ────────────────────────────────────────
neon_scanlines() {
    [[ "$NEON_ENABLE_SCANLINES" != "true" ]] && return 0
    local scanline_script="${NEON_HOME}/effects/scanlines.sh"
    [[ -f "$scanline_script" ]] && source "$scanline_script"
    _neon_scanlines_enable 2>/dev/null
}

# ── AI CLI Detection ─────────────────────────────────────────
# Wraps known AI CLI commands with neon effects
_neon_ai_commands=("claude" "aider" "codex" "qwen" "opencode" "bl" "cursor" "continue")

_neon_is_ai_command() {
    local cmd="$1"
    local base_cmd
    base_cmd=$(basename "$cmd" 2>/dev/null || echo "$cmd")
    for ai_cmd in "${_neon_ai_commands[@]}"; do
        [[ "$base_cmd" == "$ai_cmd" ]] && return 0
    done
    return 1
}

# ── Command Hooks ─────────────────────────────────────────────
_NEON_CMD_START=""
_NEON_AI_ACTIVE="false"

_neon_preexec() {
    _NEON_CMD_START=$(date +%s%N 2>/dev/null || date +%s)

    # Detect AI commands and activate mode
    if _neon_is_ai_command "$1"; then
        _NEON_AI_ACTIVE="true"
        neon_prompt  # refresh prompt with AI indicator
        [[ "$NEON_ENABLE_RAIN" == "true" ]] && neon_rain start
    fi
}

_neon_precmd() {
    local exit_code=$?

    # Source post-command hook if available
    local hook="${NEON_HOME}/hooks/post-command.sh"
    [[ -f "$hook" ]] && source "$hook"
    _neon_post_command "$exit_code" "$_NEON_CMD_START" 2>/dev/null

    # Deactivate AI mode when AI command exits
    if [[ "$_NEON_AI_ACTIVE" == "true" ]]; then
        _NEON_AI_ACTIVE="false"
        neon_rain stop
        neon_prompt  # refresh prompt without AI indicator
    fi
}

# ── Shell Integration ────────────────────────────────────────
_neon_setup_hooks() {
    if [[ -n "$ZSH_VERSION" ]]; then
        # Zsh hooks
        autoload -Uz add-zsh-hook 2>/dev/null
        add-zsh-hook preexec _neon_preexec 2>/dev/null
        add-zsh-hook precmd _neon_precmd 2>/dev/null
    elif [[ -n "$BASH_VERSION" ]]; then
        # Bash hooks via DEBUG trap and PROMPT_COMMAND
        trap '_neon_preexec "$BASH_COMMAND"' DEBUG
        PROMPT_COMMAND="_neon_precmd;${PROMPT_COMMAND:-}"
    elif [[ -n "$FISH_VERSION" ]]; then
        # Fish: user must install via install.sh which handles fish separately
        :
    fi
}

# ── Public API ────────────────────────────────────────────────
# These are the commands users can type directly

neon() {
    case "$1" in
        on)
            _neon_activate
            ;;
        off)
            _neon_deactivate
            ;;
        status)
            _neon_status
            ;;
        theme)
            _neon_set_theme "${2:-default}"
            ;;
        border)
            neon_border "${2:-$NEON_BORDER_STYLE}"
            ;;
        rain)
            neon_rain "${2:-start}"
            ;;
        glitch)
            shift
            neon_glitch "${NEON_GLITCH_INTENSITY}" "$@"
            ;;
        logo)
            cat "${NEON_HOME}/ascii/logo.txt" 2>/dev/null
            ;;
        version)
            echo -e "${_N_RED}NEON/NULL${_N_RESET} ${_N_DIM}v${NEON_VERSION}${_N_RESET}"
            echo -e "${_N_DIM}  'There is no spoon. There is only the terminal.'${_N_RESET}"
            ;;
        help|"")
            _neon_help
            ;;
        *)
            echo -e "${_N_RED}neon:${_N_RESET} unknown command '$1'"
            echo -e "  run ${_N_CYAN}neon help${_N_RESET} for usage"
            ;;
    esac
}

_neon_activate() {
    _neon_load_config
    _neon_detect_env
    neon_prompt
    [[ "$NEON_ENABLE_BORDER" == "true" ]] && neon_border
    neon_scanlines
    _neon_setup_hooks

    echo -e "${_N_RED}${_N_BOLD}╔══════════════════════════════════════════╗${_N_RESET}"
    echo -e "${_N_RED}${_N_BOLD}║${_N_RESET}  ${_N_CYAN}NEON/NULL${_N_RESET} terminal skin ${_N_DIM}v${NEON_VERSION}${_N_RESET}        ${_N_RED}${_N_BOLD}║${_N_RESET}"
    echo -e "${_N_RED}${_N_BOLD}║${_N_RESET}  ${_N_DIM}The net is vast and infinite.${_N_RESET}          ${_N_RED}${_N_BOLD}║${_N_RESET}"
    echo -e "${_N_RED}${_N_BOLD}╚══════════════════════════════════════════╝${_N_RESET}"
}

_neon_deactivate() {
    neon_rain stop
    PS1='\u@\h:\w\$ '
    _NEON_LOADED=""
    echo -e "${_N_DIM}NEON/NULL disconnected.${_N_RESET}"
}

_neon_status() {
    echo -e "${_N_CYAN}┌─ NEON/NULL System Status ─────────────────${_N_RESET}"
    echo -e "${_N_CYAN}│${_N_RESET} Version:  ${_N_BOLD}${NEON_VERSION}${_N_RESET}"
    echo -e "${_N_CYAN}│${_N_RESET} Theme:    ${NEON_ACTIVE_THEME:-default}"
    echo -e "${_N_CYAN}│${_N_RESET} Shell:    ${SHELL:-unknown}"
    echo -e "${_N_CYAN}│${_N_RESET} Terminal: ${NEON_TERM_COLS}x${NEON_TERM_ROWS}"
    echo -e "${_N_CYAN}│${_N_RESET} TMUX:     ${NEON_IN_TMUX}"
    echo -e "${_N_CYAN}│${_N_RESET} AI Mode:  ${_NEON_AI_ACTIVE}"
    echo -e "${_N_CYAN}│${_N_RESET} Rain:     ${NEON_ENABLE_RAIN}"
    echo -e "${_N_CYAN}│${_N_RESET} Border:   ${NEON_ENABLE_BORDER} (${NEON_BORDER_STYLE})"
    echo -e "${_N_CYAN}│${_N_RESET} Glitch:   ${NEON_GLITCH_INTENSITY}"
    echo -e "${_N_CYAN}│${_N_RESET} Network:  ${_N_GREEN}● CONNECTED${_N_RESET} ${_N_DIM}(NEON/NULL relay)${_N_RESET}"
    echo -e "${_N_CYAN}└───────────────────────────────────────────${_N_RESET}"
}

_neon_set_theme() {
    local theme="$1"
    local theme_file="${NEON_HOME}/themes/${theme}.theme"
    if [[ -f "$theme_file" ]]; then
        sed -i.bak "s/^NEON_ACTIVE_THEME=.*/NEON_ACTIVE_THEME=\"${theme}\"/" \
            "${NEON_HOME}/config" 2>/dev/null
        source "$theme_file"
        neon_prompt
        echo -e "${_N_CYAN}Theme switched to:${_N_RESET} ${_N_BOLD}${theme}${_N_RESET}"
    else
        echo -e "${_N_RED}Theme not found:${_N_RESET} ${theme}"
        echo -e "  Available: $(ls "${NEON_HOME}/themes/"*.theme 2>/dev/null | xargs -I{} basename {} .theme | tr '\n' ', ')"
    fi
}

_neon_help() {
    echo -e "${_N_RED}${_N_BOLD}NEON/NULL${_N_RESET} ${_N_DIM}v${NEON_VERSION} — Cyberpunk Terminal Skin${_N_RESET}"
    echo ""
    echo -e "  ${_N_CYAN}neon on${_N_RESET}        Activate neon effects"
    echo -e "  ${_N_CYAN}neon off${_N_RESET}       Deactivate and restore default prompt"
    echo -e "  ${_N_CYAN}neon status${_N_RESET}    Show system status"
    echo -e "  ${_N_CYAN}neon theme NAME${_N_RESET}  Switch theme (default/cyber-night/void)"
    echo -e "  ${_N_CYAN}neon border${_N_RESET}    Draw terminal border"
    echo -e "  ${_N_CYAN}neon rain${_N_RESET}      Toggle matrix rain"
    echo -e "  ${_N_CYAN}neon glitch TEXT${_N_RESET}  Glitch some text"
    echo -e "  ${_N_CYAN}neon logo${_N_RESET}      Show ASCII logo"
    echo -e "  ${_N_CYAN}neon version${_N_RESET}   Show version"
    echo ""
    echo -e "  ${_N_DIM}Config: ~/.neon/config${_N_RESET}"
    echo -e "  ${_N_DIM}Themes: ~/.neon/themes/${_N_RESET}"
    echo -e "  ${_N_DIM}Repo:   https://github.com/neon-null/neon${_N_RESET}"
}

# ── Cleanup ───────────────────────────────────────────────────
_neon_cleanup() {
    neon_rain stop
    # Restore cursor
    tput cnorm 2>/dev/null
    # Clear any lingering ANSI state
    printf '\033[0m'
}

trap _neon_cleanup EXIT INT TERM

# ── Auto-activate on source ───────────────────────────────────
_neon_load_config
_neon_detect_env
neon_prompt
_neon_setup_hooks

# Display subtle startup indicator
echo -e "${_N_DIM}${_N_FAINT}  ⌁ NEON/NULL v${NEON_VERSION} connected${_N_RESET}"
