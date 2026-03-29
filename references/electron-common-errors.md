# Electron Common Errors

> This file will be expanded with real cases from projects.

---

## 0. Black Screen / Empty Window

**Context:** App window opens but shows nothing – black or white screen.

**Typical causes:** Wrong `loadFile()` path, build folder missing from ASAR, TailwindCSS purged styles, corrupted localStorage.

**See:** [electron-black-screen-debug.md](electron-black-screen-debug.md) for full diagnostic playbook.

---

## 1. Error: "node-gyp rebuild failed"

**Context:** Native module fails to compile during install or build.

**Typical causes:**
- Missing build tools on the system (Python, Visual Studio Build Tools on Windows).
- Node.js version incompatible with the native module version.
- Electron version mismatch (module compiled for wrong Node ABI).

**Solution approach:**
1. Verify build tools are installed:
   - Windows: `npm install --global windows-build-tools`
   - macOS: `xcode-select --install`
2. Check Node.js version compatibility with the module.
3. Rebuild for Electron: `npx electron-rebuild`

---

## 2. Error: "Cannot find module" at runtime

**Context:** App runs in dev but fails after packaging.

**Typical causes:**
- Module listed in `devDependencies` instead of `dependencies`.
- Dynamic `require()` path not resolved by bundler.
- File excluded from asar or build configuration.

**Solution approach:**
1. Move the module to `dependencies` in `package.json`.
2. Check `files` or `extraResources` in electron-builder config.
3. If dynamic import, use `__dirname` correctly with asar paths.

---

## 3. Error: "Icon is not a valid resource"

**Context:** Build fails when processing the app icon.

**Typical causes:**
- `.ico` file missing required layers (256x256, 48x48, 32x32, 16x16).
- Corrupted or incorrectly formatted icon file.
- Wrong file extension or path in config.

**Solution approach:**
1. Regenerate icon with all required sizes (use tools like RealFaviconGenerator or GIMP).
2. Verify icon path in `electron-builder.yml` or `package.json`.
3. Test with a known-good `.ico` file.

---

## 4. Error: "Path too long" (Windows)

**Context:** Build or install fails on Windows due to path length.

**Typical causes:**
- Deep `node_modules` nesting exceeds 260 character limit.
- Project located in a deeply nested folder.

**Solution approach:**
1. Move project to a shorter path (e.g., `C:\dev\app`).
2. Enable long paths in Windows (requires registry edit or Group Policy).
3. Use `npm dedupe` to flatten dependency tree.

---

## 5. Error: "Code signing failed"

**Context:** Build process cannot sign the executable.

**Typical causes:**
- Certificate file (`.pfx`) not found or wrong path.
- Certificate password missing or incorrect.
- Certificate expired or not trusted.

**Solution approach:**
1. Verify `CSC_LINK` and `CSC_KEY_PASSWORD` environment variables.
2. Check certificate expiration date.
3. Test signing manually with `signtool` (Windows) before automated build.

---

## 6. Error: "Cannot create symbolic link" during build (winCodeSign)

**Context:** `electron-builder` fails with `Cannot create symbolic link : El cliente no dispone de un privilegio requerido` when extracting winCodeSign.

**Typical causes:**
- `signAndEditExecutable` is `true` (default) but Windows user doesn't have symlink privileges
- winCodeSign 7z archive contains macOS symlinks that can't be created on Windows

**Solution approach:**
1. Set `"signAndEditExecutable": false` in `win` config — this skips the sign+edit step entirely
2. Use `rcedit` manually to inject the icon into the .exe after build:
   ```bash
   rcedit-x64.exe "release/win-unpacked/MyApp.exe" --set-icon "path/to/icon.ico"
   ```
3. Rebuild ONLY the NSIS installer from the patched exe:
   ```bash
   npx electron-builder --win nsis --prepackaged release/win-unpacked
   ```

---

## 7. Error: "Could not find any Visual Studio installation" (npmRebuild)

**Context:** Build fails because `@electron/rebuild` tries to compile native modules but no C++ Build Tools are installed.

**Typical causes:**
- `npmRebuild: true` (default) triggers native module rebuild
- Project has native optional dependencies like `bufferutil`, `utf-8-validate`
- No Visual Studio Build Tools or C++ workload installed

**Solution approach:**
1. If no native modules are needed: set `"npmRebuild": false` in build config
2. Move native modules to `optionalDependencies` so they don't block the build
3. If native modules ARE needed: install Visual Studio Build Tools with C++ workload

---

## 8. .exe shows default Electron icon instead of custom icon

**Context:** The built .exe shows the default Electron atom icon instead of the app's custom icon.

**Typical causes:**
- `signAndEditExecutable: false` prevents electron-builder from editing the .exe to embed the icon
- Source `icon.png` is actually a JPEG file renamed to .png (electron-builder silently fails)
- Cached `.icon-ico` directory in `release/` contains stale icon data

**Solution approach:**
1. Verify icon format: `file assets/icon.png` — must say "PNG image data", NOT "JPEG image data"
2. If JPEG: convert to real PNG using PowerShell:
   ```powershell
   [System.Drawing.Bitmap]::new('icon.png').Save('icon_real.png', [System.Drawing.Imaging.ImageFormat]::Png)
   ```
3. Delete cached icon: `rm -rf release/.icon-ico`
4. If `signAndEditExecutable: false`: use rcedit to inject icon manually (see Error #6)

---

## 9. DevTools opens automatically in production build

**Context:** Packaged app opens DevTools on launch — debug code left in production.

**Typical causes:**
- `mainWindow.webContents.openDevTools()` guarded by wrong condition (e.g., `if (!isDev)` instead of `if (isDev)`)
- Debug code added temporarily and never removed

**Solution approach:**
1. Search for `openDevTools` in `electron/main.ts` — ensure it's only called when `isDev` is true
2. Remove or guard all `console.log` debug statements in the main process
3. Add to release checklist: verify no debug code in main.ts

---

## 10. Version mismatch between title bar and footer

**Context:** The Electron window title shows one version but the app UI shows another.

**Typical causes:**
- `APP_VERSION` constant in `electron/main.ts` is hardcoded and not updated
- Version in React components (footer, about dialog) is hardcoded separately
- `package.json` version updated but hardcoded strings weren't

**Solution approach:**
1. Use a single source of truth: read version from `package.json` or use `app.getVersion()` in Electron
2. Pass version to renderer via IPC or preload script
3. Search for all hardcoded version strings: `grep -r "v1\\.0\\.0" client/src/`

---

> More cases will be added as they appear in real projects.
