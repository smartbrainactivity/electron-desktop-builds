/**
 * fix-exe-icon.js — Smart Prompting Suite
 *
 * Post-build script that injects the correct icon into the .exe
 * when signAndEditExecutable is false (no code-signing certificate).
 *
 * Works for ANY Electron app in the Suite. Reads config from package.json.
 *
 * Usage (from any app root):
 *   node ../scripts/fix-exe-icon.js
 *   node ../../scripts/fix-exe-icon.js
 *   node "C:\Users\FL2024\mi-dashboard\Smart prompting Suite\scripts\fix-exe-icon.js"
 *
 * What it does:
 *   1. Reads package.json to find productName, win.icon, and release dir
 *   2. Finds rcedit-x64.exe in electron-builder cache
 *   3. Injects the .ico into the unpacked .exe
 *   4. Rebuilds ONLY the NSIS installer (repackages the patched exe)
 *
 * Requirements:
 *   - Must run AFTER electron-builder has completed
 *   - rcedit must be in electron-builder cache (auto-downloaded on first build)
 *   - Icon must be a valid .ico file (not PNG renamed to .ico)
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

function log(color, msg) {
    console.log(`${color}${msg}${RESET}`);
}

// --- 1. Read package.json ---
const projectDir = process.cwd();
const pkgPath = path.join(projectDir, 'package.json');

if (!fs.existsSync(pkgPath)) {
    log(RED, '[ERROR] package.json not found. Run this script from the app root.');
    process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const build = pkg.build || {};
const win = build.win || {};
const nsis = build.nsis || {};
const productName = build.productName || pkg.productName || pkg.name || 'App';
const outputDir = (build.directories && build.directories.output) || 'release';

// --- 2. Resolve icon path ---
// Priority: win.icon > build.icon > fallback search
let iconPath = win.icon || build.icon;

if (!iconPath) {
    // Try common locations
    const candidates = ['assets/icon.ico', 'assets/icon256x256.ico', 'build/icon.ico'];
    iconPath = candidates.find(c => fs.existsSync(path.join(projectDir, c)));
}

if (!iconPath || !fs.existsSync(path.join(projectDir, iconPath))) {
    log(RED, `[ERROR] Icon file not found: ${iconPath || '(none configured)'}`);
    log(YELLOW, '  Set "build.win.icon" in package.json to point to a valid .ico file.');
    process.exit(1);
}

const fullIconPath = path.join(projectDir, iconPath);

// If the icon is a .png, we need a .ico — check if one exists alongside
let icoPath = fullIconPath;
if (fullIconPath.endsWith('.png')) {
    const icoCandidate = fullIconPath.replace(/\.png$/i, '.ico');
    if (fs.existsSync(icoCandidate)) {
        icoPath = icoCandidate;
        log(YELLOW, `[INFO] Source is .png, using .ico at: ${path.basename(icoCandidate)}`);
    } else {
        // electron-builder may have generated one in release/.icon-ico/
        const generatedIco = path.join(projectDir, outputDir, '.icon-ico', 'icon.ico');
        if (fs.existsSync(generatedIco)) {
            icoPath = generatedIco;
            log(YELLOW, `[INFO] Using electron-builder generated .ico`);
        } else {
            log(RED, `[ERROR] Need a .ico file. Source is .png and no .ico found.`);
            log(YELLOW, '  Convert with: magick convert icon.png icon.ico');
            log(YELLOW, '  Or use an online converter (convertico.com)');
            process.exit(1);
        }
    }
}

log(GREEN, `[OK] Icon: ${path.relative(projectDir, icoPath)}`);

// --- 3. Find the unpacked .exe ---
const unpackedDir = path.join(projectDir, outputDir, 'win-unpacked');
if (!fs.existsSync(unpackedDir)) {
    log(RED, `[ERROR] Unpacked directory not found: ${unpackedDir}`);
    log(YELLOW, '  Run electron-builder first, then run this script.');
    process.exit(1);
}

const exeName = `${productName}.exe`;
const exePath = path.join(unpackedDir, exeName);

if (!fs.existsSync(exePath)) {
    log(RED, `[ERROR] Executable not found: ${exePath}`);
    // Try to find any .exe in the dir
    const exes = fs.readdirSync(unpackedDir).filter(f => f.endsWith('.exe'));
    if (exes.length > 0) {
        log(YELLOW, `  Found: ${exes.join(', ')}`);
    }
    process.exit(1);
}

log(GREEN, `[OK] Exe: ${exeName}`);

// --- 4. Find rcedit ---
const cacheBase = path.join(process.env.LOCALAPPDATA || '', 'electron-builder', 'Cache', 'winCodeSign');
let rceditPath = null;

function findRcedit(dir) {
    if (!fs.existsSync(dir)) return null;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            const found = findRcedit(full);
            if (found) return found;
        } else if (entry.name === 'rcedit-x64.exe') {
            return full;
        }
    }
    return null;
}

rceditPath = findRcedit(cacheBase);

if (!rceditPath) {
    log(RED, '[ERROR] rcedit-x64.exe not found in electron-builder cache.');
    log(YELLOW, `  Expected in: ${cacheBase}`);
    log(YELLOW, '  Run a build first so electron-builder downloads it.');
    process.exit(1);
}

log(GREEN, `[OK] rcedit: ${path.basename(path.dirname(rceditPath))}/${path.basename(rceditPath)}`);

// --- 5. Inject icon with rcedit ---
log(CYAN, '\n--- Injecting icon into .exe ---\n');

try {
    const cmd = `"${rceditPath}" "${exePath}" --set-icon "${icoPath}"`;
    execSync(cmd, { stdio: 'inherit' });
    log(GREEN, `[OK] Icon injected into ${exeName}`);
} catch (e) {
    log(RED, `[ERROR] rcedit failed: ${e.message}`);
    process.exit(1);
}

// --- 6. Rebuild NSIS installer with patched exe ---
log(CYAN, '\n--- Rebuilding NSIS installer ---\n');

try {
    const cmd = `npx electron-builder --win nsis --prepackaged "${path.join(outputDir, 'win-unpacked')}"`;
    execSync(cmd, { cwd: projectDir, stdio: 'inherit' });
    log(GREEN, '\n[OK] Installer rebuilt with correct icon.');
} catch (e) {
    log(RED, `[ERROR] Installer rebuild failed: ${e.message}`);
    process.exit(1);
}

// --- Done ---
log(CYAN, `\n=== Icon fix complete for ${productName} ===\n`);
