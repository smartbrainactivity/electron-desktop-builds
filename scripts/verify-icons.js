/**
 * Icon Verification Script for Electron Projects
 *
 * Checks that icon files are in the correct format and ready for electron-builder.
 * Run: node scripts/verify-icons.js [path-to-icon.png]
 *
 * Checks performed:
 * 1. File exists
 * 2. File is a real PNG (not JPEG renamed to .png)
 * 3. File is at least 256x256 pixels
 * 4. Warns about signAndEditExecutable configuration
 *
 * @author SMARTbrain Activity
 * @license MIT
 */

const fs = require('fs');
const path = require('path');

const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

function log(color, symbol, msg) {
    console.log(`${color}${symbol}${RESET} ${msg}`);
}

function readPngDimensions(buffer) {
    // PNG header: 89 50 4E 47 0D 0A 1A 0A
    // IHDR chunk starts at byte 8, width at 16, height at 20 (4 bytes each, big-endian)
    if (buffer.length < 24) return null;
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    return { width, height };
}

function isPNG(buffer) {
    // PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
    const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    return buffer.length >= 8 && buffer.subarray(0, 8).equals(PNG_MAGIC);
}

function isJPEG(buffer) {
    // JPEG magic bytes: FF D8 FF
    return buffer.length >= 3 && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
}

function checkPackageJson(projectDir) {
    const pkgPath = path.join(projectDir, 'package.json');
    if (!fs.existsSync(pkgPath)) return null;

    try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        const build = pkg.build || {};
        const win = build.win || {};
        return {
            signAndEditExecutable: win.signAndEditExecutable,
            npmRebuild: build.npmRebuild,
            winIcon: win.icon,
            version: pkg.version
        };
    } catch {
        return null;
    }
}

// --- Main ---

console.log(`\n${CYAN}=== Electron Icon Verification ===${RESET}\n`);

const iconPath = process.argv[2] || 'assets/icon.png';
const projectDir = process.cwd();
let issues = 0;
let warnings = 0;

// 1. Check file exists
if (!fs.existsSync(iconPath)) {
    log(RED, '[FAIL]', `Icon file not found: ${iconPath}`);
    console.log(`\n  Try: node verify-icons.js path/to/your/icon.png\n`);
    process.exit(1);
}
log(GREEN, '[OK]', `File found: ${iconPath}`);

// 2. Read and check format
const buffer = fs.readFileSync(iconPath);
const fileSize = buffer.length;
log(GREEN, '[OK]', `File size: ${(fileSize / 1024).toFixed(1)} KB`);

if (isJPEG(buffer)) {
    issues++;
    log(RED, '[FAIL]', `File is JPEG, not PNG! (JPEG magic bytes detected)`);
    log(RED, '      ', `electron-builder needs a REAL PNG file.`);
    log(YELLOW, '[FIX]', `PowerShell: [System.Drawing.Bitmap]::new('${iconPath}').Save('icon_fixed.png', [System.Drawing.Imaging.ImageFormat]::Png)`);
    log(YELLOW, '[FIX]', `ImageMagick: magick convert "${iconPath}" PNG:"icon_fixed.png"`);
} else if (isPNG(buffer)) {
    log(GREEN, '[OK]', `Format: Real PNG file`);

    // 3. Check dimensions
    const dims = readPngDimensions(buffer);
    if (dims) {
        log(GREEN, '[OK]', `Dimensions: ${dims.width}x${dims.height}`);
        if (dims.width < 256 || dims.height < 256) {
            warnings++;
            log(YELLOW, '[WARN]', `Icon should be at least 256x256 (1024x1024 recommended)`);
        }
        if (dims.width !== dims.height) {
            warnings++;
            log(YELLOW, '[WARN]', `Icon is not square (${dims.width}x${dims.height})`);
        }
    }
} else {
    issues++;
    log(RED, '[FAIL]', `Unknown file format (not PNG, not JPEG)`);
}

// 4. Check package.json config
const config = checkPackageJson(projectDir);
if (config) {
    console.log(`\n${CYAN}--- Build Config (package.json) ---${RESET}\n`);
    log(GREEN, '[OK]', `Version: ${config.version || 'not set'}`);

    if (config.winIcon) {
        log(GREEN, '[OK]', `win.icon: ${config.winIcon}`);
    }

    if (config.signAndEditExecutable === false) {
        warnings++;
        log(YELLOW, '[WARN]', `signAndEditExecutable: false — .exe will show default Electron icon`);
        log(YELLOW, '      ', `After build, inject icon with rcedit:`);
        log(YELLOW, '      ', `  rcedit-x64.exe "release/win-unpacked/App.exe" --set-icon "icon.ico"`);
        log(YELLOW, '      ', `  npx electron-builder --win nsis --prepackaged release/win-unpacked`);
    } else {
        log(GREEN, '[OK]', `signAndEditExecutable: true (icon will be embedded in .exe)`);
    }

    if (config.npmRebuild === false) {
        log(GREEN, '[OK]', `npmRebuild: false (no Visual Studio Build Tools required)`);
    }
}

// 5. Check for cached ICO
const cachedIco = path.join(projectDir, 'release', '.icon-ico', 'icon.ico');
if (fs.existsSync(cachedIco)) {
    const icoSize = fs.statSync(cachedIco).size;
    if (icoSize < 1000) {
        warnings++;
        log(YELLOW, '[WARN]', `Cached ICO is suspiciously small (${icoSize} bytes) — delete and rebuild`);
    } else {
        log(GREEN, '[OK]', `Cached ICO exists: ${(icoSize / 1024).toFixed(1)} KB`);
    }
}

// Summary
console.log(`\n${CYAN}--- Summary ---${RESET}\n`);
if (issues === 0 && warnings === 0) {
    log(GREEN, '[PASS]', `All checks passed. Icon is ready for electron-builder.`);
} else if (issues === 0) {
    log(YELLOW, '[PASS]', `${warnings} warning(s), but no critical issues.`);
} else {
    log(RED, '[FAIL]', `${issues} issue(s) found. Fix before building.`);
    process.exit(1);
}

console.log('');
