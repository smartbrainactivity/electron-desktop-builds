# Electron Release Checklist

Use this checklist when preparing an Electron app for distribution.

## 1. App Identity

- [ ] `appId` is correct and consistent (e.g., `com.company.appname`)
- [ ] `productName` is defined
- [ ] Author/company name is configured

## 2. Assets and Icons

- [ ] Icon file exists in correct format:
  - Windows: `.ico` (minimum 256x256, with 48x48, 32x32, 16x16 layers)
  - macOS: `.icns`
  - Linux: `.png`
- [ ] Assets are in the designated folder (`build/`, `resources/`)
- [ ] `asar` is enabled (`true`) for security and performance

## 3. Dependencies

- [ ] All native modules compiled for target architecture
- [ ] No `devDependencies` included in production bundle
- [ ] Unused dependencies removed

## 4. Installer Configuration (NSIS/Windows)

- [ ] `oneClick`: `true` = silent install, `false` = wizard
- [ ] `perMachine`: `true` = system-wide, `false` = per-user
- [ ] Desktop shortcut configured
- [ ] Start Menu shortcut configured
- [ ] Uninstaller registered correctly

## 5. Code Signing

- [ ] Certificate accessible (`.pfx` for Windows, Keychain for macOS)
- [ ] Password stored as environment variable (not hardcoded)
- [ ] Timestamp server configured (e.g., `http://timestamp.digicert.com`)
- [ ] Test signing locally before CI/CD

## 6. Icon Verification (CRITICAL)

- [ ] Source icon is **real PNG** format (not JPEG renamed to .png)
  - Verify: `file assets/icon.png` must output "PNG image data"
  - Fix: `[System.Drawing.Bitmap]::new('icon.png').Save('icon_real.png', [System.Drawing.Imaging.ImageFormat]::Png)`
- [ ] Icon is at least 256x256 (1024x1024 recommended)
- [ ] Icon appears in ALL locations:
  - [ ] .exe file icon (via electron-builder or rcedit)
  - [ ] Window title bar (BrowserWindow `icon` option)
  - [ ] System tray icon (Tray constructor)
  - [ ] Browser tab favicon (`<link rel="icon">` in index.html)
  - [ ] In-app header/logo (`<img>` in React components)
  - [ ] NSIS installer wizard icon
- [ ] Delete `release/.icon-ico` cache before rebuild if icon changed
- [ ] If `signAndEditExecutable: false`: plan rcedit step after build

## 7. Version Consistency

- [ ] `package.json` version matches intended release
- [ ] `APP_VERSION` constant in `electron/main.ts` matches
- [ ] Footer version in React components matches
- [ ] About dialog version matches
- [ ] No hardcoded old version strings: `grep -r "v1\.0\.0" client/src/`

## 8. Debug Code Removal

- [ ] No `openDevTools()` in production path
- [ ] No excessive `console.log` in main process
- [ ] No debug listeners (e.g., `did-fail-load`, `console-message`) unless intentionally kept
- [ ] `<base href="./">` not duplicated in index.html

## 9. Installation Path (NSIS)

- [ ] `installer.nsh` sets correct default install directory
- [ ] Install path matches the ecosystem convention (e.g., `C:\Smart Prompting Suite\AppName`)
- [ ] Previous version can be cleanly uninstalled before installing new version
- [ ] `perMachine: true` if installing to system directories

## 10. Build Workflow (No Code Signing)

When building WITHOUT a code signing certificate:

1. [ ] Set `signAndEditExecutable: false` in `win` config
2. [ ] Set `npmRebuild: false` if no native modules needed
3. [ ] Build: `npm run build:client && npx tsc -p electron/tsconfig.json && npx electron-builder --win`
4. [ ] Inject icon: `rcedit-x64.exe "release/win-unpacked/App.exe" --set-icon "release/.icon-ico/icon.ico"`
5. [ ] Rebuild installer: `npx electron-builder --win nsis --prepackaged release/win-unpacked`
6. [ ] Uninstall old version before testing new installer
7. [ ] Verify: extract icon from installed exe and compare

---

> This file will be expanded with platform-specific notes from real projects.
