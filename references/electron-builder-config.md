# Electron Builder Configuration

Complete `electron-builder.yml` templates for Windows, macOS, and Linux.

---

## Basic Configuration

```yaml
# electron-builder.yml
appId: com.company.appname
productName: My Electron App
copyright: Copyright © 2024 Company

# Directories
directories:
  output: dist
  buildResources: build

# Files to include
files:
  - "dist/**/*"
  - "package.json"
  - "!**/*.{ts,tsx,map}"
  - "!**/node_modules/*/{CHANGELOG.md,README.md}"
  - "!**/node_modules/.bin"

# Icon (auto-detects format per platform)
icon: build/icon

# ASAR packaging
asar: true
asarUnpack:
  - "**/*.node"
  - "**/node_modules/sharp/**"

# Native module rebuild
npmRebuild: true
nodeGypRebuild: false
```

---

## Windows Configuration (NSIS)

### With Code Signing

```yaml
# electron-builder.yml (Windows section — signed)
win:
  target:
    - target: nsis
      arch:
        - x64
        - ia32
    - target: portable
      arch:
        - x64

  # Code signing (see electron-code-signing.md)
  sign: ./scripts/sign.js
  certificateFile: ${env.WIN_CERT_FILE}
  certificatePassword: ${env.WIN_CERT_PASSWORD}

  # Icon (256x256 minimum, MUST be real PNG — see electron-icon-generation.md)
  icon: build/icon.ico

  # File associations (optional)
  fileAssociations:
    - ext: myext
      name: My File Type
      description: My Application File
      icon: build/file-icon.ico

nsis:
  oneClick: false
  perMachine: false
  allowToChangeInstallationDirectory: true
  installerIcon: build/installer-icon.ico
  uninstallerIcon: build/uninstaller-icon.ico
  installerHeader: build/installer-header.bmp
  installerSidebar: build/installer-sidebar.bmp
  license: LICENSE.txt
  createDesktopShortcut: true
  createStartMenuShortcut: true
  shortcutName: My Electron App
```

### Without Code Signing (most common for indie/beta apps)

```yaml
# electron-builder.yml (Windows section — unsigned)
win:
  target:
    - target: nsis
      arch:
        - x64

  # MUST be real PNG file (verify: file assets/icon.png → "PNG image data")
  icon: assets/icon.png

  # IMPORTANT: This prevents icon embedding in .exe
  # Use rcedit after build to inject icon manually
  signAndEditExecutable: false

# Skip native module rebuild (avoids Visual Studio Build Tools requirement)
npmRebuild: false

nsis:
  oneClick: false
  perMachine: true
  allowToChangeInstallationDirectory: true
  createDesktopShortcut: true
  createStartMenuShortcut: true
  shortcutName: My App
  include: installer.nsh  # Custom install path (optional)
```

**Post-build icon injection** (required when `signAndEditExecutable: false`):
```bash
# 1. Find rcedit in electron-builder cache
# Location: %LOCALAPPDATA%\electron-builder\Cache\winCodeSign\{hash}\rcedit-x64.exe

# 2. Inject icon into the .exe
rcedit-x64.exe "release/win-unpacked/MyApp.exe" --set-icon "release/.icon-ico/icon.ico"

# 3. Rebuild ONLY the NSIS installer (uses the patched exe)
npx electron-builder --win nsis --prepackaged release/win-unpacked
```

---

## macOS Configuration

```yaml
# electron-builder.yml (macOS section)
mac:
  target:
    - target: dmg
      arch:
        - x64
        - arm64
    - target: zip
      arch:
        - x64
        - arm64
  
  category: public.app-category.developer-tools
  darkModeSupport: true
  hardenedRuntime: true
  gatekeeperAssess: false
  
  # Entitlements (required for notarization)
  entitlements: build/entitlements.mac.plist
  entitlementsInherit: build/entitlements.mac.plist
  
  # Code signing identity
  identity: "Developer ID Application: Company Name (TEAM_ID)"
  
  # Privacy descriptions (required for App Store)
  extendInfo:
    NSDocumentsFolderUsageDescription: "Access to documents is required"
    NSDownloadsFolderUsageDescription: "Access to downloads is required"
    NSMicrophoneUsageDescription: "Microphone access for audio recording"

dmg:
  sign: false
  contents:
    - x: 130
      y: 220
    - x: 410
      y: 220
      type: link
      path: /Applications
  background: build/dmg-background.png
  window:
    width: 540
    height: 380
```

---

## Linux Configuration

```yaml
# electron-builder.yml (Linux section)
linux:
  target:
    - target: AppImage
      arch:
        - x64
    - target: deb
      arch:
        - x64
    - target: rpm
      arch:
        - x64
  
  category: Development
  maintainer: developer@company.com
  vendor: Company Name
  
  # Icons (multiple sizes)
  icon: build/icons
  
  # Desktop entry
  desktop:
    Name: My Electron App
    Comment: A desktop application
    Categories: Development;Utility;

appImage:
  systemIntegration: ask
  license: LICENSE.txt

deb:
  depends:
    - libnotify4
    - libappindicator3-1
  afterInstall: build/scripts/postinst.sh
  afterRemove: build/scripts/postrm.sh

snap:
  grade: stable
  confinement: classic
```

---

## Build Size Optimization

```yaml
# electron-builder.yml (optimization)
asar: true
asarUnpack:
  - "**/*.node"

# Exclude unnecessary files
files:
  - "!**/*.{ts,tsx,map}"
  - "!**/*.d.ts"
  - "!**/node_modules/*/{test,__tests__,tests,powered-test,example,examples}/**"
  - "!**/node_modules/.bin"
  - "!**/*.md"
  - "!**/LICENSE*"
  - "!**/.eslintrc*"
  - "!**/.prettier*"
```

---

## Native Modules (node-pty, sharp, etc.)

```yaml
# electron-builder.yml
npmRebuild: true
nodeGypRebuild: false
nativeRebuilder: parallel

# For node-pty specifically
extraResources:
  - from: "node_modules/node-pty/build/Release/"
    to: "node-pty/"
    filter:
      - "*.node"
```

```json
// package.json
{
  "optionalDependencies": {
    "fsevents": "^2.3.3"
  }
}
```

---

## Auto-Update Configuration

```yaml
# electron-builder.yml
publish:
  provider: github
  owner: your-username
  repo: your-repo
  releaseType: release
```

```typescript
// In main process
import { autoUpdater } from 'electron-updater';

autoUpdater.checkForUpdatesAndNotify();

autoUpdater.on('update-available', () => {
  console.log('Update available');
});

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall();
});
```

---

## package.json Scripts

```json
{
  "scripts": {
    "build": "vite build && tsc -p tsconfig.electron.json",
    "package": "electron-builder --publish never",
    "package:win": "electron-builder --win --publish never",
    "package:mac": "electron-builder --mac --publish never",
    "package:linux": "electron-builder --linux --publish never",
    "publish": "electron-builder --publish always",
    "publish:win": "electron-builder --win --publish always",
    "publish:mac": "electron-builder --mac --publish always"
  }
}
```

---

## Related Files

- [electron-code-signing.md](electron-code-signing.md) - Code signing setup
- [electron-github-actions.md](electron-github-actions.md) - CI/CD workflow
- [electron-icon-generation.md](electron-icon-generation.md) - Icon generation
