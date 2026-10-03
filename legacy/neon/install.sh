#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════════╗
# ║  NEON/NULL — Installation Protocol v1.0.0                   ║
# ║  Classification: PUBLIC // Execute at will                  ║
# ╚══════════════════════════════════════════════════════════════╝

set -euo pipefail

# ── Colors ────────────────────────────────────────────────────
RED='\033[38;2;255;0;60m'
CYAN='\033[38;2;0;240;255m'
PINK='\033[38;2;255;45;107m'
DIM='\033[2m'
BOLD='\033[1m'
RESET='\033[0m'

NEON_HOME="$HOME/.neon"
NEON_REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── Helpers ───────────────────────────────────────────────────
info()  { echo -e "${CYAN}[neon]${RESET} $*"; }
warn()  { echo -e "${PINK}[neon]${RESET} $*"; }
fail()  { echo -e "${RED}[neon]${RESET} $*"; exit 1; }

# ── Pre-flight checks ────────────────────────────────────────
check_requirements() {
    info "Running pre-flight checks..."

    # Bash version
    if [[ -n "${BASH_VERSION:-}" ]]; then
        local major="${BASH_VERSION%%.*}"
        if (( major < 4 )); then
            warn "Bash 4+ recommended (you have ${BASH_VERSION}). Some effects may not work."
        fi
    fi

    # Terminal color support
    if [[ -t 1 ]] && command -v tput &>/dev/null; then
        local colors
        colors=$(tput colors 2>/dev/null || echo 8)
        if (( colors < 256 )); then
            warn "Terminal supports only ${colors} colors. 256+ recommended for full effect."
        fi
    fi

    # bc for glitch math (optional)
    if ! command -v bc &>/dev/null; then
        warn "'bc' not found — glitch intensity will use fallback math"
    fi
}

# ── Detect Shell ──────────────────────────────────────────────
detect_shell() {
    local shell_name
    shell_name=$(basename "${SHELL:-/bin/bash}")

    case "$shell_name" in
        bash)
            SHELL_RC="$HOME/.bashrc"
            SHELL_TYPE="bash"
            ;;
        zsh)
            SHELL_RC="$HOME/.zshrc"
            SHELL_TYPE="zsh"
            ;;
        fish)
            SHELL_RC="$HOME/.config/fish/config.fish"
            SHELL_TYPE="fish"
            ;;
        *)
            warn "Unknown shell: $shell_name — defaulting to .bashrc"
            SHELL_RC="$HOME/.bashrc"
            SHELL_TYPE="bash"
            ;;
    esac

    info "Detected shell: ${BOLD}${SHELL_TYPE}${RESET} (rc: ${SHELL_RC})"
}

# ── Install Files ─────────────────────────────────────────────
install_files() {
    info "Installing NEON/NULL to ${NEON_HOME}..."

    # Create directory structure
    mkdir -p "$NEON_HOME"/{themes,ascii,effects,hooks,config}

    # Copy core
    cp -f "${NEON_REPO}/neon.sh" "$NEON_HOME/neon.sh"
    chmod +x "$NEON_HOME/neon.sh"

    # Copy themes
    for theme in "${NEON_REPO}"/themes/*.theme; do
        [[ -f "$theme" ]] && cp -f "$theme" "$NEON_HOME/themes/"
    done

    # Copy ascii
    for ascii_file in "${NEON_REPO}"/ascii/*; do
        [[ -f "$ascii_file" ]] && cp -f "$ascii_file" "$NEON_HOME/ascii/"
    done
    chmod +x "$NEON_HOME/ascii/border-frames.sh" 2>/dev/null

    # Copy effects
    for effect in "${NEON_REPO}"/effects/*.sh; do
        [[ -f "$effect" ]] && cp -f "$effect" "$NEON_HOME/effects/"
    done
    chmod +x "$NEON_HOME/effects/"*.sh 2>/dev/null

    # Copy hooks
    for hook in "${NEON_REPO}"/hooks/*.sh; do
        [[ -f "$hook" ]] && cp -f "$hook" "$NEON_HOME/hooks/"
    done
    chmod +x "$NEON_HOME/hooks/"*.sh 2>/dev/null

    # Install bin
    if [[ -f "${NEON_REPO}/bin/neon" ]]; then
        mkdir -p "$NEON_HOME/bin"
        cp -f "${NEON_REPO}/bin/neon" "$NEON_HOME/bin/neon"
        chmod +x "$NEON_HOME/bin/neon"
    fi

    info "Files installed ✓"
}

# ── Create Default Config ─────────────────────────────────────
create_config() {
    local config_file="$NEON_HOME/config"

    if [[ -f "$config_file" ]]; then
        info "Config already exists — preserving user settings"
        return 0
    fi

    info "Creating default configuration..."

    if [[ -f "${NEON_REPO}/config/example.config" ]]; then
        cp "${NEON_REPO}/config/example.config" "$config_file"
    else
        cat > "$config_file" << 'CONFIGEOF'
# ╔══════════════════════════════════════════════════════════════╗
# ║  NEON/NULL — User Configuration                             ║
# ║  "Customize the signal. Own the frequency."                 ║
# ╚══════════════════════════════════════════════════════════════╝

# Active theme (default, cyber-night, void)
NEON_ACTIVE_THEME="default"

# ── Colors ────────────────────────────────────────────────────
NEON_PRIMARY="#ff003c"
NEON_SECONDARY="#ff2d6b"
NEON_ACCENT="#00f0ff"

# ── Effects ───────────────────────────────────────────────────
NEON_GLITCH_INTENSITY=0.05     # 0.01 (subtle) to 0.5 (chaos)
NEON_ENABLE_RAIN=true          # Matrix rain during AI processing
NEON_ENABLE_SCANLINES=true     # CRT scanline overlay
NEON_ENABLE_BORDER=true        # Terminal border
NEON_ENABLE_SOUND=false        # Typewriter sounds (needs Node.js)
NEON_ENABLE_GLOW=true          # Text glow effects

# ── Rain ──────────────────────────────────────────────────────
NEON_RAIN_SPEED=50             # ms between frames (lower = faster)
NEON_RAIN_DENSITY=15           # Number of rain columns
NEON_RAIN_COLOR=red            # red, green, cyan

# ── Border ────────────────────────────────────────────────────
NEON_BORDER_STYLE=double       # single, double, rounded, glow

# ── Prompt ────────────────────────────────────────────────────
NEON_TIMESTAMP_FMT="%H:%M:%S"

# ── AI Detection ──────────────────────────────────────────────
NEON_AI_INDICATOR=true         # Show AI mode indicator
NEON_SESSION_TRACKER=true      # Track AI session duration
CONFIGEOF
    fi

    info "Config created at ${config_file}"
}

# ── Shell Integration ────────────────────────────────────────
setup_shell_integration() {
    local source_line
    local marker="# >>> NEON/NULL >>>"
    local marker_end="# <<< NEON/NULL <<<"

    info "Setting up shell integration..."

    # Check if already installed
    if [[ -f "$SHELL_RC" ]] && grep -q "NEON/NULL" "$SHELL_RC" 2>/dev/null; then
        info "Shell integration already present — skipping"
        return 0
    fi

    # Ensure rc file exists
    touch "$SHELL_RC"

    if [[ "$SHELL_TYPE" == "fish" ]]; then
        source_line="source $NEON_HOME/neon.sh"
        # Fish needs different syntax
        cat >> "$SHELL_RC" << FISHEOF

${marker}
if test -f $NEON_HOME/neon.sh
    # NEON uses bash — wrap via bash subshell for fish compatibility
    # Or source the fish-compatible wrapper if available
    echo -e "\\033[2m  ⌁ NEON/NULL: use 'bash' for full effects\\033[0m"
end
${marker_end}
FISHEOF
    else
        source_line="source $NEON_HOME/neon.sh"
        cat >> "$SHELL_RC" << RCEOF

${marker}
# NEON/NULL cyberpunk terminal skin
# "The net is vast and infinite." — NEON/NULL Collective
[[ -f "$NEON_HOME/neon.sh" ]] && ${source_line}
${marker_end}
RCEOF
    fi

    info "Added source line to ${SHELL_RC}"
}

# ── Success Display ───────────────────────────────────────────
show_success() {
    echo ""
    echo -e "${RED}${BOLD}"
    echo '  ███╗   ██╗███████╗ ██████╗ ███╗   ██╗'
    echo '  ████╗  ██║██╔════╝██╔═══██╗████╗  ██║'
    echo '  ██╔██╗ ██║█████╗  ██║   ██║██╔██╗ ██║'
    echo '  ██║╚██╗██║██╔══╝  ██║   ██║██║╚██╗██║'
    echo '  ██║ ╚████║███████╗╚██████╔╝██║ ╚████║'
    echo '  ╚═╝  ╚═══╝╚══════╝ ╚═════╝ ╚═╝  ╚═══╝'
    echo -e "${RESET}"
    echo -e "  ${DIM}N U L L  C O L L E C T I V E${RESET}"
    echo ""
    echo -e "  ${CYAN}✓${RESET} Installed to ${NEON_HOME}"
    echo -e "  ${CYAN}✓${RESET} Shell integration: ${SHELL_TYPE} (${SHELL_RC})"
    echo -e "  ${CYAN}✓${RESET} Theme: default (red/pink neon)"
    echo ""
    echo -e "  ${BOLD}Get started:${RESET}"
    echo -e "    ${DIM}1.${RESET} Restart your terminal, or:  ${CYAN}source ${SHELL_RC}${RESET}"
    echo -e "    ${DIM}2.${RESET} Run: ${CYAN}neon on${RESET}"
    echo -e "    ${DIM}3.${RESET} Try: ${CYAN}claude${RESET} or ${CYAN}aider${RESET} — effects activate automatically"
    echo ""
    echo -e "  ${DIM}Themes: ${CYAN}neon theme cyber-night${RESET}"
    echo -e "  ${DIM}Config: ${DIM}${NEON_HOME}/config${RESET}"
    echo -e "  ${DIM}Help:   ${CYAN}neon help${RESET}"
    echo ""
    echo -e "  ${DIM}⌁ NEON/NULL relay established. Welcome to the collective.${RESET}"
    echo ""
}

# ── Main ──────────────────────────────────────────────────────
main() {
    echo ""
    echo -e "${RED}${BOLD}  NEON/NULL Installation Protocol${RESET}"
    echo -e "  ${DIM}─────────────────────────────────${RESET}"
    echo ""

    check_requirements
    detect_shell
    install_files
    create_config
    setup_shell_integration
    show_success
}

main "$@"
