# GitHub Actions for Electron Builds

Automated build and release workflow for Windows, macOS, and Linux.

---

## Overview

This workflow:
1. Triggers on version tags (`v*`)
2. Builds for all 3 platforms in parallel
3. Signs the binaries (if certificates configured)
4. Uploads to GitHub Releases

```
┌─────────────────┐
│   Push tag v*   │
└────────┬────────┘
         │
   ┌─────┴─────┐
   │  Matrix   │
   ├───────────┤
   │ • macOS   │──► .dmg + .zip  ──► GitHub Release
   │ • Windows │──► .exe (NSIS)  ──► GitHub Release
   │ • Linux   │──► .AppImage    ──► GitHub Release
   └───────────┘
```

---

## Required Secrets

### Windows Code Signing
| Secret | Description |
|--------|-------------|
| `WIN_CERT_FILE` | Base64-encoded .pfx certificate |
| `WIN_CERT_PASSWORD` | Certificate password |

### macOS Code Signing + Notarization
| Secret | Description |
|--------|-------------|
| `APPLE_ID` | Apple Developer email |
| `APPLE_ID_PASSWORD` | App-specific password |
| `APPLE_TEAM_ID` | Team ID (10 characters) |
| `MAC_CERTS` | Base64-encoded .p12 certificate |
| `MAC_CERTS_PASSWORD` | Certificate password |

### General
| Secret | Description |
|--------|-------------|
| `GH_TOKEN` | Auto-provided as `GITHUB_TOKEN` |

---

## Complete Workflow

Create `.github/workflows/build-release.yml`:

```yaml
name: Build & Release

on:
  push:
    tags:
      - "v*"

# Cancel in-progress runs for the same tag
concurrency:
  group: release-${{ github.ref }}
  cancel-in-progress: true

jobs:
  # ═══════════════════════════════════════════════════════════════
  # BUILD WINDOWS
  # ═══════════════════════════════════════════════════════════════
  build-windows:
    runs-on: windows-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build

      - name: Package for Windows
        env:
          WIN_CSC_LINK: ${{ secrets.WIN_CERT_FILE }}
          WIN_CSC_KEY_PASSWORD: ${{ secrets.WIN_CERT_PASSWORD }}
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: npm run package:win -- --publish always

  # ═══════════════════════════════════════════════════════════════
  # BUILD macOS
  # ═══════════════════════════════════════════════════════════════
  build-macos:
    runs-on: macos-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build

      - name: Package for macOS
        env:
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_ID_PASSWORD: ${{ secrets.APPLE_ID_PASSWORD }}
          APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
          CSC_LINK: ${{ secrets.MAC_CERTS }}
          CSC_KEY_PASSWORD: ${{ secrets.MAC_CERTS_PASSWORD }}
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: npm run package:mac -- --publish always

  # ═══════════════════════════════════════════════════════════════
  # BUILD LINUX
  # ═══════════════════════════════════════════════════════════════
  build-linux:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build

      - name: Package for Linux
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: npm run package:linux -- --publish always
```

---

## Required package.json Scripts

```json
{
  "scripts": {
    "build": "vite build && tsc -p tsconfig.electron.json",
    "package": "electron-builder --publish never",
    "package:win": "electron-builder --win",
    "package:mac": "electron-builder --mac",
    "package:linux": "electron-builder --linux"
  }
}
```

---

## Setting Up Secrets

### Step 1: Convert Certificate to Base64

**Windows (.pfx):**
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("certificate.pfx")) | Out-File cert-win.b64
```

**macOS (.p12):**
```bash
base64 -i certificate.p12 -o cert-mac.b64
```

### Step 2: Add Secrets in GitHub

1. Go to Repository → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add each secret with its value

### Step 3: Generate App-Specific Password (macOS)

1. Visit [appleid.apple.com](https://appleid.apple.com)
2. Sign in → Security → App-Specific Passwords
3. Generate password labeled "GitHub Actions"
4. Save as `APPLE_ID_PASSWORD` secret

---

## Release Output

After the workflow runs, GitHub Releases will contain:

```
v1.0.0
├── MyApp-1.0.0-win-x64.exe         # Windows installer
├── MyApp-1.0.0-win-x64-portable.exe # Windows portable
├── MyApp-1.0.0-mac-arm64.dmg       # macOS Apple Silicon
├── MyApp-1.0.0-mac-x64.dmg         # macOS Intel
├── MyApp-1.0.0-mac-arm64.zip       # macOS zip (Apple Silicon)
├── MyApp-1.0.0-mac-x64.zip         # macOS zip (Intel)
├── MyApp-1.0.0-linux-x64.AppImage  # Linux AppImage
├── latest.yml                       # Windows auto-update manifest
├── latest-mac.yml                   # macOS auto-update manifest
└── latest-linux.yml                 # Linux auto-update manifest
```

---

## Triggering a Release

```bash
# Create and push a version tag
git tag v1.0.0
git push origin v1.0.0
```

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| `CSC_LINK not found` | Secret not configured | Verify secret name in GitHub |
| `Notarization failed` | Invalid credentials | Regenerate app-specific password |
| `NSIS error: path too long` | Windows path limit | Use shorter repo name |
| `npm ci failed` | Node version mismatch | Check `node-version` in workflow |
| `No artifacts uploaded` | Build failed silently | Check build logs |

---

## Optional: Draft Releases

To create draft releases for review before publishing:

```yaml
# In electron-builder.yml
publish:
  provider: github
  releaseType: draft
```

Then manually publish from GitHub Releases UI.

---

## Optional: Slack/Discord Notifications

Add at the end of each job:

```yaml
      - name: Notify on failure
        if: failure()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```
