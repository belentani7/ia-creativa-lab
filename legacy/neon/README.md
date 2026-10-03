<p align="center">
<pre>
  ███╗   ██╗███████╗ ██████╗ ███╗   ██╗
  ████╗  ██║██╔════╝██╔═══██╗████╗  ██║
  ██╔██╗ ██║█████╗  ██║   ██║██╔██╗ ██║
  ██║╚██╗██║██╔══╝  ██║   ██║██║╚██╗██║
  ██║ ╚████║███████╗╚██████╔╝██║ ╚████║
  ╚═╝  ╚═══╝╚══════╝ ╚═════╝ ╚═╝  ╚═══╝
        N U L L  C O L L E C T I V E
</pre>
</p>

<p align="center">
  <strong>Cyberpunk terminal skin for AI coding CLIs</strong><br>
  <em>CRT scanlines · Matrix rain · Glitch effects · Neon glow</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/shell-bash%204%2B%20%7C%20zsh%205%2B%20%7C%20fish%203%2B-red?style=flat-square" alt="shell">
  <img src="https://img.shields.io/badge/license-MIT-ff003c?style=flat-square" alt="license">
  <img src="https://img.shields.io/badge/version-1.0.0-00f0ff?style=flat-square" alt="version">
  <img src="https://img.shields.io/badge/deps-zero-ff2d6b?style=flat-square" alt="deps">
</p>

---

## What is NEON?

NEON is a **terminal overlay** that wraps any AI coding CLI in a cinematic cyberpunk UI. Think "Mr. Robot meets Blade Runner" — scanlines, glitch effects, matrix code rain, and neon glow on top of your existing terminal.

It works with **Claude Code**, **Aider**, **Codex**, **Qwen**, **OpenCode**, and any other terminal-based AI tool.

```
[23:47:02] ⟨user⟩┤ neon-project ⎇ main ◈ AI ⌁NULL
λ _
```

> *"The net is vast and infinite."* — NEON/NULL Collective

---

## Quick Install

```bash
curl -fsSL https://raw.githubusercontent.com/neon-null/neon/main/install.sh | bash
```

Or clone and install manually:

```bash
git clone https://github.com/neon-null/neon.git ~/.neon-src
bash ~/.neon-src/install.sh
```

Then restart your terminal or run:

```bash
source ~/.neon/neon.sh
neon on
```

---

## Screenshots

> Screenshots coming soon. The effects need to be *seen* — a static image doesn't capture the scanlines pulsing or the matrix rain cascading while your AI writes code.

<!-- TODO: Add terminal recordings -->

---

## Features

| Effect | Description | Configurable |
|---|---|---|
| **Neon Prompt** | Custom PS1 with timestamp, user, git branch, AI indicator | ✅ |
| **CRT Scanlines** | Subtle line overlay using ANSI backgrounds | ✅ density |
| **Matrix Rain** | Code rain during AI processing (auto-starts) | ✅ speed, color, density |
| **Glitch Text** | Unicode zalgo corruption on output | ✅ intensity 0.01–0.5 |
| **Neon Border** | Terminal border with glow effect | ✅ style: single/double/rounded/glow |
| **AI Detection** | Auto-enables effects when running AI CLIs | ✅ command list |
| **Post-Command** | Shows execution time + exit code with neon styling | ✅ |
| **Themes** | Swap the entire color palette with one command | ✅ |

---

## Usage

### Basic

```bash
neon on          # Activate effects
neon off         # Deactivate, restore normal prompt
neon status      # Show system status
neon help        # Show all commands
```

### Themes

```bash
neon theme default        # Red/pink neon (original)
neon theme cyber-night    # Blue/ice cyberpunk
neon theme void           # Minimal dark
```

### Effects

```bash
neon rain start           # Start matrix rain
neon rain stop            # Stop matrix rain
neon border               # Draw terminal border
neon glitch "hello world" # Glitch some text
neon logo                 # Show ASCII logo
```

### AI Auto-Detection

When you run any recognized AI CLI, NEON automatically:
- Shows the `◈ AI` indicator in your prompt
- Starts matrix rain animation
- Tracks session duration

Recognized commands: `claude`, `aider`, `codex`, `qwen`, `opencode`, `bl`, `cursor`, `continue`

---

## Customization

Edit `~/.neon/config` to customize everything:

```bash
# Colors
NEON_PRIMARY="#ff003c"
NEON_SECONDARY="#ff2d6b"
NEON_ACCENT="#00f0ff"

# Effects
NEON_GLITCH_INTENSITY=0.05    # 0.01 to 0.5
NEON_ENABLE_RAIN=true
NEON_ENABLE_SCANLINES=true
NEON_ENABLE_BORDER=true
NEON_ENABLE_SOUND=false       # requires Node.js companion

# Rain
NEON_RAIN_SPEED=50            # ms between frames
NEON_RAIN_DENSITY=15          # columns of rain
NEON_RAIN_COLOR=red           # red, green, cyan

# Border
NEON_BORDER_STYLE=double      # single, double, rounded, glow

# Prompt
NEON_TIMESTAMP_FMT="%H:%M:%S"
```

---

## Compatibility

| Platform | Shell | Status |
|---|---|---|
| Linux | bash 4+ | ✅ Full |
| Linux | zsh 5+ | ✅ Full |
| macOS | bash (Homebrew) | ✅ Full |
| macOS | zsh (default) | ✅ Full |
| WSL2 | bash/zsh | ✅ Full |
| Windows (Git Bash) | bash | ⚠️ Partial |
| FreeBSD | bash/zsh | ✅ Full |

**Terminal emulators tested:** Alacritty, Kitty, WezTerm, iTerm2, GNOME Terminal, Windows Terminal, Hyper.

---

## How It Works

NEON is pure shell — no external dependencies for the core experience:

- **ANSI escape codes** for all colors and effects (24-bit truecolor)
- **tput** for terminal size detection and cursor control
- **Unicode combining characters** for glitch effects (zalgo text)
- **Background processes** for matrix rain (auto-cleaned on exit)
- **Shell hooks** (PROMPT_COMMAND / preexec / precmd) for command detection

---

## Node.js Companion (Optional)

For advanced effects like typewriter sounds and smoother animations:

```bash
npm install -g neon-terminal
neon --with-sound
```

This is entirely optional. The shell version works without Node.js.

---

## Architecture

```
~/.neon/
├── neon.sh              # Main script (sourced by shell rc)
├── config               # User configuration
├── themes/              # Color themes
│   ├── default.theme
│   ├── cyber-night.theme
│   └── void.theme
├── ascii/               # ASCII art assets
│   ├── logo.txt
│   └── border-frames.sh
├── effects/             # Visual effect scripts
│   ├── rain.sh
│   ├── glitch.sh
│   └── scanlines.sh
└── hooks/               # Shell integration hooks
    ├── ai-detect.sh
    └── post-command.sh
```

---

## Contributing

PRs welcome. Keep it cyberpunk.

```bash
git clone https://github.com/neon-null/neon.git
cd neon
# hack away
```

---

## Credits

Built by the **NEON/NULL Collective**.

> *"Information wants to be free. Terminals want to glow."*
> — NEON/NULL Manifesto, Article 7

---

## License

MIT — see [LICENSE](LICENSE)

```
Copyright (c) 2024 NEON/NULL Collective

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

<p align="center"><sub>⌁ NEON/NULL relay active — signal integrity: nominal</sub></p>
