# Electron Diagnostic Steps

Use this guide when an Electron build fails or produces unexpected errors.

## 1. Verify Versions

- [ ] Note Node.js version: `node -v`
- [ ] Note Electron version from `package.json`
- [ ] Check for known incompatibilities between Node and Electron versions
- [ ] Confirm target OS (Windows, macOS, Linux)

## 2. Clean and Reinstall Dependencies

- [ ] Delete `node_modules` folder
- [ ] Delete lock file (`package-lock.json` or `yarn.lock`)
- [ ] Reinstall: `npm ci` or `yarn install --frozen-lockfile`
- [ ] Check for duplicate/conflicting versions: `npm ls` or `yarn why <package>`

## 3. Identify Build Tool

- [ ] Determine which tool is used:
  - `electron-builder` → config in `electron-builder.yml` or `package.json` (`build` key)
  - `electron-forge` → config in `forge.config.js` or `package.json` (`config.forge`)
  - Custom scripts → check `package.json` scripts
- [ ] Locate and review the configuration file

## 4. Run Minimal Build Command

- [ ] Execute the simplest build command (e.g., `npm run build:electron`)
- [ ] Capture the **full error message** and stack trace
- [ ] Identify which tool is failing (npm, Electron CLI, builder, forge)

## 5. Check Native Modules

- [ ] List native modules in use (e.g., `better-sqlite3`, `serialport`, `node-pty`)
- [ ] Rebuild for Electron: `npx electron-rebuild`
- [ ] Confirm architecture matches target (x64, arm64)

---

> This file will be expanded with specific error patterns from real projects.
