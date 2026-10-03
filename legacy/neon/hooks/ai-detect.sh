#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════════╗
# ║  NEON/NULL — AI CLI Detection Hook                          ║
# ║  "When the machine speaks, the terminal should listen."     ║
# ║              — NULL Operational Doctrine, Directive 12       ║
# ╚══════════════════════════════════════════════════════════════╝
#
# Detects when the user invokes a known AI coding CLI and
# activates NEON/NULL effects automatically.
#
# Source this file in neon.sh or shell rc.

# ── Known AI CLIs ─────────────────────────────────────────────
# Add your own by setting NEON_AI_COMMANDS="cmd1 cmd2 cmd3"
_NEON_AI_CLIS=(
    "claude"          # Claude Code (Anthropic)
    "aider"           # Aider (Paul Gauthier)
    "codex"           # OpenAI Codex CLI
    "qwen"            # Qwen Code (Alibaba)
    "opencode"        # OpenCode
    "bl"              # Bailian CLI (Alibaba Cloud)
    "cursor"          # Cursor (terminal mode)
    "continue"        # Continue.dev CLI
    "cline"           # Cline
    "windsurf"        # Windsurf CLI
)

# ── State ─────────────────────────────────────────────────────
_NEON_AI_SESSION_START=""
_NEON_AI_SESSION_CMD=""
_NEON_AI_SESSION_COUNT=0

# ── Detection Function ────────────────────────────────────────
_neon_ai_detect() {
    local cmd="$1"
    local base_cmd

    # Extract the base command (handle paths like /usr/local/bin/claude)
    base_cmd=$(basename "$cmd" 2>/dev/null || echo "$cmd")

    # Check against known AI CLIs
    for ai_cmd in "${_NEON_AI_CLIS[@]}"; do
        if [[ "$base_cmd" == "$ai_cmd" ]]; then
            _neon_ai_activate "$base_cmd"
            return 0
        fi
    done

    # Also check for common patterns: npx @anthropic-ai/claude-code, etc.
    if [[ "$cmd" == *"claude"* ]] || [[ "$cmd" == *"aider"* ]] || [[ "$cmd" == *"codex"* ]]; then
        _neon_ai_activate "$base_cmd"
        return 0
    fi

    return 1
}

# ── Activation ────────────────────────────────────────────────
_neon_ai_activate() {
    local cmd="$1"

    _NEON_AI_ACTIVE="true"
    _NEON_AI_SESSION_START=$(date +%s)
    _NEON_AI_SESSION_CMD="$cmd"
    _NEON_AI_SESSION_COUNT=$(( _NEON_AI_SESSION_COUNT + 1 ))

    # Show activation banner
    local cols
    cols=$(tput cols 2>/dev/null || echo 80)
    local banner_width=44
    local pad=$(( (cols - banner_width) / 2 ))
    local padding
    padding=$(printf '%*s' "$pad" '')

    echo -e "\n${padding}\033[38;2;255;0;60m\033[1m╔══════════════════════════════════════════╗\033[0m"
    echo -e "${padding}\033[38;2;255;0;60m\033[1m║\033[0m  \033[38;2;0;240;255m◈ AI MODE ACTIVATED\033[0m                    \033[38;2;255;0;60m\033[1m║\033[0m"
    echo -e "${padding}\033[38;2;255;0;60m\033[1m║\033[0m  \033[2mCLI: ${cmd}\033[0m                              \033[38;2;255;0;60m\033[1m║\033[0m"
    echo -e "${padding}\033[38;2;255;0;60m\033[1m║\033[0m  \033[2mSession #${_NEON_AI_SESSION_COUNT} — NEON/NULL monitoring\033[0m    \033[38;2;255;0;60m\033[1m║\033[0m"
    echo -e "${padding}\033[38;2;255;0;60m\033[1m╚══════════════════════════════════════════╝\033[0m\n"

    # Start rain if enabled
    if [[ "${NEON_ENABLE_RAIN:-true}" == "true" ]] && type neon_rain &>/dev/null; then
        neon_rain start
    fi

    # Refresh prompt with AI indicator
    if type neon_prompt &>/dev/null; then
        neon_prompt
    fi
}

# ── Deactivation ──────────────────────────────────────────────
_neon_ai_deactivate() {
    if [[ "$_NEON_AI_ACTIVE" != "true" ]]; then
        return 0
    fi

    local duration=0
    if [[ -n "$_NEON_AI_SESSION_START" ]]; then
        local end_time
        end_time=$(date +%s)
        duration=$(( end_time - _NEON_AI_SESSION_START ))
    fi

    # Format duration
    local dur_str=""
    if (( duration >= 3600 )); then
        dur_str="$(( duration / 3600 ))h$(( (duration % 3600) / 60 ))m"
    elif (( duration >= 60 )); then
        dur_str="$(( duration / 60 ))m$(( duration % 60 ))s"
    else
        dur_str="${duration}s"
    fi

    # Show deactivation banner
    echo -e "\n\033[2m  ⌁ AI session ended — ${_NEON_AI_SESSION_CMD} — duration: ${dur_str}\033[0m"

    _NEON_AI_ACTIVE="false"
    _NEON_AI_SESSION_START=""
    _NEON_AI_SESSION_CMD=""

    # Stop rain
    if type neon_rain &>/dev/null; then
        neon_rain stop
    fi

    # Refresh prompt without AI indicator
    if type neon_prompt &>/dev/null; then
        neon_prompt
    fi
}

# ── Status Query ──────────────────────────────────────────────
_neon_ai_status() {
    if [[ "$_NEON_AI_ACTIVE" == "true" ]]; then
        local elapsed=0
        if [[ -n "$_NEON_AI_SESSION_START" ]]; then
            elapsed=$(( $(date +%s) - _NEON_AI_SESSION_START ))
        fi
        echo -e "\033[38;2;255;0;60m◈ AI ACTIVE\033[0m — ${_NEON_AI_SESSION_CMD} (${elapsed}s elapsed)"
    else
        echo -e "\033[2m⌁ AI idle — ${_NEON_AI_SESSION_COUNT} sessions this terminal\033[0m"
    fi
}
