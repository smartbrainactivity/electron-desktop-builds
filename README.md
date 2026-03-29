# 🖥️ Electron Desktop Builds — AI Skill for Antigravity · Claude Code · Gemini CLI · Cursor

![Electron Desktop Builds](assets/banner.svg)

[![Creator](https://img.shields.io/badge/Creator-SMARTbrain%20Activity-blue)](https://www.smartbrainactivity.ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](/LICENSE)
[![Security Scan](https://img.shields.io/badge/Security_Scan-Passed-brightgreen)](/scripts/audit-scan.js)
[![Antigravity Skill](https://img.shields.io/badge/Antigravity-Skill-black?logo=google&logoColor=white)]()
[![Claude Code](https://img.shields.io/badge/Claude_Code-Compatible-blue?logo=anthropic&logoColor=white)]()
[![Gemini CLI](https://img.shields.io/badge/Gemini_CLI-Compatible-4285F4?logo=google&logoColor=white)]()
[![Electron](https://img.shields.io/badge/Electron-Builds-47848F?logo=electron&logoColor=white)]()
[![Node.js](https://img.shields.io/badge/Node.js-Compatible-339933?logo=nodedotjs&logoColor=white)]()
[![License MIT](https://img.shields.io/badge/License-MIT-yellow)]()

An expert AI skill for AI coding assistants (like Claude, Antigravity, Cursor, etc.) designed to help you plan, configure, and troubleshoot Electron desktop builds right from the chat or terminal.

[🇪🇸 Leer en Español](README.es.md)

---

## 🚀 Installation & Setup

To use this skill with your local AI coding assistant, clone this repository into your editor's "global skills" directory (e.g., `.gemini/antigravity/skills` or your environment's equivalent).

1. Open your terminal and navigate to your AI assistant's global skills folder.
2. Run the following command to download the skill:

```bash
git clone https://github.com/smartbrainactivity/electron-desktop-builds.git
```

3. (Optional but recommended) Audit the code using our embedded security scanner before running anything:

```bash
node electron-desktop-builds/scripts/audit-scan.js
```

4. Restart your AI chat. Now you can prompt: *"Help me package my React app as an Electron desktop build for Windows"*.

---

## What This Skill Does

This skill turns your AI assistant into an **Electron build expert** that follows a structured diagnostic approach:

1. **Clarifies the goal** — dev vs. production, target OS, packaging tool
2. **Reproduces the error** — asks for logs, configs, and environment details
3. **Checks compatibility** — verifies Node, Electron, and native module versions
4. **Isolates the problem** — categorizes the issue using its reference library
5. **Designs step-by-step fixes** — least invasive first, always reversible
6. **Explains reasoning** — so you learn, not just copy-paste

## Included Reference Guides

| Guide | Description |
|-------|-------------|
| **[Black Screen Debug](./references/electron-black-screen-debug.md)** | Detailed playbook for diagnosing empty/white/black screen issues |
| **[Builder Config](./references/electron-builder-config.md)** | Complete electron-builder templates — signed AND unsigned workflows |
| **[Code Signing](./references/electron-code-signing.md)** | Windows (.pfx, Azure Key Vault) and macOS (notarization) signing guides |
| **[Common Errors](./references/electron-common-errors.md)** | 10 known error patterns with proven solutions (including icon, symlink, Visual Studio) |
| **[Diagnostic Steps](./references/electron-diagnostic-steps.md)** | Systematic checklist for build failure triage |
| **[GitHub Actions](./references/electron-github-actions.md)** | Automated CI/CD workflows for multi-platform builds and releases |
| **[Icon Generation](./references/electron-icon-generation.md)** | JPEG-vs-PNG detection, rcedit workflow, all 10 icon locations, generation scripts |
| **[Release Checklist](./references/electron-release-checklist.md)** | 10-section pre-distribution checklist (icons, versions, debug cleanup, unsigned builds) |

## Scripts

| Script | Description |
|--------|-------------|
| **[audit-scan.js](./scripts/audit-scan.js)** | Static security scanner — verifies no malicious patterns |
| **[verify-icons.js](./scripts/verify-icons.js)** | Icon format validator — detects JPEG-as-PNG, checks dimensions, warns about config |

## Coverage

- **Build Tools**: electron-builder, electron-forge, electron-packager
- **Platforms**: Windows (NSIS installer), macOS (.dmg), Linux (.AppImage, .deb)
- **Frameworks**: React, Expo, vanilla Node.js projects
- **Topics**: asar packaging, preload scripts, native modules, auto-update, code signing, cross-platform builds, icon generation

## Requirements

- **Any AI Agent / IDE**: This skill is fully IDE-agnostic. It works with Claude Code, Antigravity, Gemini CLI, Cursor, and any assistant that supports skill loading.
- **No runtime dependencies**: This is a knowledge-only skill — no scripts to execute, no packages to install.

**🛡️ Privacy & Security Note**: This skill contains only markdown reference files and optional diagnostic scripts. There are no network requests and no telemetry. We strongly encourage you to inspect the source code before use.

**🔍 Static Audit Scanner**: This repository includes a native static analysis script (`scripts/audit-scan.js`) similar to Snyk/CodeQL. You can run `node scripts/audit-scan.js` at any time to verify that none of the executable logic contains malicious patterns (like `eval`, unauthorized HTTP requests, or destructive `child_process` commands).

## Language Agnostic

This skill adapts to your prompt's language automatically. You can instruct the AI in English, Spanish, or any other language, and the diagnostic guidance will follow your preferred language.

## Support & Contact

- **Creator**: SMARTbrain Activity
- **Website**: [www.smartbrainactivity.ai](https://www.smartbrainactivity.ai)
- **Email**: [hey@smartbrainactivity.ai](mailto:hey@smartbrainactivity.ai)

---

## Topics

electron · electron-builder · nsis · desktop-app · windows · macos · linux · code-signing · icon-generation · rcedit · ai-agents · gemini-cli · antigravity · claude-code · claude-code-skills · antigravity-tools · antigravity-skills

## License

[MIT License](LICENSE)
