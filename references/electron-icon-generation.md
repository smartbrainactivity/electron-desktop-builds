# Electron Icon Generation

Scripts and requirements for generating icons for all platforms.

---

## Required Icon Sizes

```
build/
├── icon.icns           # macOS (auto-generated from 1024x1024)
├── icon.ico            # Windows (multi-resolution, 256x256 max)
├── icon.png            # Linux fallback
└── icons/
    ├── 16x16.png
    ├── 32x32.png
    ├── 48x48.png
    ├── 64x64.png
    ├── 128x128.png
    ├── 256x256.png
    ├── 512x512.png
    └── 1024x1024.png   # macOS Retina, source for all others
```

---

## Source Image Requirements

- **Size:** 1024x1024 pixels minimum
- **Format:** PNG with transparency
- **Shape:** Square (will be masked on macOS)
- **Background:** Transparent recommended

---

## CRITICAL: JPEG vs PNG — Verify Your Source File

> **This is the #1 cause of broken icons in Electron builds.**

Many image editors, AI image generators, and online tools save files as **JPEG even when the file extension is `.png`**. The file is named `icon.png` but internally it is a JPEG. This causes silent failures:

- `electron-builder` accepts the file without errors
- The generated `.ico` may be corrupt or empty
- The icon will **not** embed in the `.exe`
- You get the default Electron icon with no warning

### How to verify

```bash
# Linux / macOS / Git Bash on Windows
file icon.png
```

- **Correct output:** `icon.png: PNG image data, 1024 x 1024, 8-bit/color RGBA, non-interlaced`
- **Wrong output:** `icon.png: JPEG image data, JFIF standard 1.01, ...`

If it says "JPEG image data", your file is **not a real PNG** regardless of its extension.

### How to fix

**Option A — PowerShell (no extra tools needed):**
```powershell
Add-Type -AssemblyName System.Drawing
[System.Drawing.Bitmap]::new('icon.png').Save('icon_real.png', [System.Drawing.Imaging.ImageFormat]::Png)
```

**Option B — ImageMagick:**
```bash
magick convert icon.png PNG:icon_fixed.png
```

The `PNG:` prefix forces ImageMagick to write real PNG format regardless of input.

### npm verification script

Add to `package.json` to catch this before every build:

```json
{
  "scripts": {
    "verify-icon": "file assets/icon.png | grep -q 'PNG image' && echo 'OK: Real PNG' || echo 'ERROR: Not a real PNG file'"
  }
}
```

---

## Where Icons Appear

All the locations where icons show in an Electron app and what controls each one:

| Location | Source | Notes |
|----------|--------|-------|
| `.exe` file icon | electron-builder `win.icon` + `signAndEditExecutable` | Must be ICO, embedded via rcedit if signing disabled |
| Window title bar | `BrowserWindow({ icon })` in `main.ts` | PNG path, shown at runtime |
| System tray | `Tray(nativeImage)` in `main.ts` | 16x16 recommended |
| Taskbar | Same as `.exe` icon | Windows caches this aggressively |
| Browser tab favicon | `<link rel="icon">` in `index.html` | Inside the webview, standard web favicon |
| Installer wizard | `nsis.installerIcon` | ICO format |
| Uninstaller | `nsis.uninstallerIcon` | ICO format |
| Desktop shortcut | `.exe` icon | Created by NSIS |
| Start menu | `.exe` icon | Created by NSIS |
| In-app header/logo | `<img src>` in React components | Standard web image, use the same source PNG |

---

## signAndEditExecutable and rcedit

### The problem

Setting `signAndEditExecutable: false` in electron-builder config is common when you don't have a code-signing certificate. It prevents signing errors, but it also **prevents the icon from being embedded in the `.exe`**. The resulting executable shows the default Electron icon.

```json
// electron-builder config — this disables icon embedding too
"win": {
  "signAndEditExecutable": false
}
```

### The solution: rcedit

Use `rcedit` after the build to manually inject the icon into the executable.

**Step 1 — Build normally:**
```bash
npx electron-builder --win
```

**Step 2 — Inject icon with rcedit:**
```bash
rcedit-x64.exe "release/win-unpacked/MyApp.exe" --set-icon "path/to/icon.ico"
```

**Step 3 — Rebuild ONLY the NSIS installer** (repackages the patched exe):
```bash
npx electron-builder --win nsis --prepackaged release/win-unpacked
```

### Where to find rcedit

electron-builder downloads rcedit automatically. Find it at:

```
%LOCALAPPDATA%\electron-builder\Cache\winCodeSign\{hash}\rcedit-x64.exe
```

To locate the exact path:
```powershell
Get-ChildItem "$env:LOCALAPPDATA\electron-builder\Cache\winCodeSign" -Recurse -Filter "rcedit-x64.exe"
```

### Complete workflow for Windows builds WITHOUT code signing

```bash
# 1. Verify source icon is real PNG
file assets/icon.png

# 2. Build (icon won't embed in exe due to signAndEditExecutable: false)
npx electron-builder --win

# 3. Patch the exe with the correct icon
rcedit-x64.exe "release/win-unpacked/MyApp.exe" --set-icon "build/icon.ico"

# 4. Rebuild installer only, using the patched exe
npx electron-builder --win nsis --prepackaged release/win-unpacked
```

---

## PowerShell Script (Windows)

Create `scripts/generate-icons.ps1`:

```powershell
# Requires ImageMagick: winget install ImageMagick.ImageMagick
# Usage: .\scripts\generate-icons.ps1

$source = "build\icon-source.png"  # 1024x1024 source
$outDir = "build\icons"

# Create output directory
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

# Generate PNG sizes
$sizes = @(16, 32, 48, 64, 128, 256, 512, 1024)
foreach ($size in $sizes) {
    $output = "$outDir\${size}x${size}.png"
    magick $source -resize "${size}x${size}" $output
    Write-Host "Created $output"
}

# Generate Windows .ico (multi-resolution)
$icoSizes = @(16, 32, 48, 64, 128, 256)
$icoInputs = $icoSizes | ForEach-Object { "$outDir\${_}x${_}.png" }
magick $icoInputs "build\icon.ico"
Write-Host "Created build\icon.ico"

# Copy largest as fallback
Copy-Item "$outDir\256x256.png" "build\icon.png"
Write-Host "Created build\icon.png"

Write-Host "`nIcon generation complete!"
Write-Host "Note: For macOS .icns, build on macOS or use online converter"
```

---

## PowerShell ICO Generation (No ImageMagick)

If you don't have ImageMagick installed, your options are limited with PowerShell alone:

- **PowerShell's `GetHicon()`** only generates a single 32x32 icon — this is **insufficient** for Electron. Windows needs at least 16, 32, 48, and 256 pixel sizes in the ICO.
- **Recommended approach:** Provide a real 1024x1024 PNG and let `electron-builder` auto-generate the ICO during the build process. This works reliably as long as the source is a **real PNG** (see the JPEG vs PNG section above).
- **Online tools** if you need a manual ICO:

| Tool | URL | Notes |
|------|-----|-------|
| **CloudConvert** | [cloudconvert.com](https://cloudconvert.com) | PNG to ICO with multi-resolution support |
| **RealFaviconGenerator** | [realfavicongenerator.net](https://realfavicongenerator.net) | Generates all favicon sizes + ICO |
| **ConvertICO** | [convertico.com](https://convertico.com) | Simple PNG to ICO |

---

## Bash Script (macOS/Linux)

Create `scripts/generate-icons.sh`:

```bash
#!/bin/bash
# Usage: ./scripts/generate-icons.sh

SOURCE="build/icon-source.png"  # 1024x1024 source
OUT_DIR="build/icons"

# Create output directory
mkdir -p "$OUT_DIR"

# Generate PNG sizes using sips (macOS) or ImageMagick (Linux)
for size in 16 32 48 64 128 256 512 1024; do
    if command -v sips &> /dev/null; then
        # macOS
        sips -z $size $size "$SOURCE" --out "$OUT_DIR/${size}x${size}.png" 2>/dev/null
    else
        # Linux (requires ImageMagick)
        convert "$SOURCE" -resize "${size}x${size}" "$OUT_DIR/${size}x${size}.png"
    fi
    echo "Created ${size}x${size}.png"
done

# Generate macOS .icns (macOS only)
if command -v iconutil &> /dev/null; then
    mkdir -p build/icon.iconset

    for size in 16 32 64 128 256 512; do
        cp "$OUT_DIR/${size}x${size}.png" "build/icon.iconset/icon_${size}x${size}.png"

        # Retina versions (@2x)
        if [ $size -le 512 ]; then
            double=$((size * 2))
            cp "$OUT_DIR/${double}x${double}.png" "build/icon.iconset/icon_${size}x${size}@2x.png" 2>/dev/null
        fi
    done

    iconutil -c icns build/icon.iconset -o build/icon.icns
    rm -rf build/icon.iconset
    echo "Created icon.icns"
fi

# Generate Windows .ico (requires ImageMagick)
if command -v convert &> /dev/null; then
    convert \
        "$OUT_DIR/256x256.png" \
        "$OUT_DIR/128x128.png" \
        "$OUT_DIR/64x64.png" \
        "$OUT_DIR/48x48.png" \
        "$OUT_DIR/32x32.png" \
        "$OUT_DIR/16x16.png" \
        build/icon.ico
    echo "Created icon.ico"
fi

# Copy fallback
cp "$OUT_DIR/256x256.png" build/icon.png
echo "Created icon.png"

echo ""
echo "Icon generation complete!"
```

Make executable:
```bash
chmod +x scripts/generate-icons.sh
```

---

## npm Script Integration

Add to `package.json`:

```json
{
  "scripts": {
    "icons": "pwsh scripts/generate-icons.ps1",
    "icons:bash": "bash scripts/generate-icons.sh",
    "verify-icon": "file assets/icon.png | grep -q 'PNG image' && echo 'OK: Real PNG' || echo 'ERROR: Not a real PNG file'"
  }
}
```

---

## Online Alternatives

If you don't have ImageMagick:

| Tool | URL | Features |
|------|-----|----------|
| **IconKitchen** | [icon.kitchen](https://icon.kitchen) | All platforms, free |
| **MakeAppIcon** | [makeappicon.com](https://makeappicon.com) | iOS/macOS/Windows |
| **CloudConvert** | [cloudconvert.com](https://cloudconvert.com) | PNG to ICO, ICNS |

---

## Platform-Specific Notes

### Windows (.ico)

- Must include 256x256 for high-DPI displays
- Can include multiple resolutions in one file
- 16, 32, 48, 256 are the most important

### macOS (.icns)

- Requires 1024x1024 for Retina displays
- Must be generated on macOS using `iconutil`
- Or use online converters if building on Windows

### Linux

- Uses individual PNG files in `build/icons/`
- 256x256 or 512x512 recommended as primary
- electron-builder auto-detects the folder

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Blurry icons | Source too small | Use 1024x1024 minimum |
| Missing tray icon | Wrong size | Tray needs 16x16 or 32x32 |
| Windows icon not showing | Missing sizes | Include 16, 32, 48, 256 |
| macOS icon pixelated | No @2x versions | Generate Retina sizes |
| `.exe` shows Electron default icon | `signAndEditExecutable: false` | Use rcedit to inject ICO after build |
| Icon looks correct in file but wrong in app | JPEG file with `.png` extension | Verify with `file` command, convert to real PNG |
| Icon doesn't update after rebuild | Windows icon cache | Run `ie4uinit.exe -show` or restart `explorer.exe` |
| Installer icon correct but exe icon wrong | `signAndEditExecutable` disabled | Use rcedit + `--prepackaged` rebuild flow |
