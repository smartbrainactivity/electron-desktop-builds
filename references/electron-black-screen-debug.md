# Electron Black Screen Debug

**Symptom:** Electron app shows a black/empty window instead of the expected UI.

**Stack:** Electron + Vite + React (may include TailwindCSS)

---

## Quick Diagnosis

1. Open DevTools (F12)
2. Check Console for errors, especially:
   ```
   Not allowed to load local resource: file:///.../app.asar/...index.html
   ```
   → File missing from ASAR or incorrect path in `loadFile()`

---

## Root Causes and Fixes

### 1. Wrong path in loadFile/loadURL

**Symptom:** `Not allowed to load local resource` error.

**Check:** Compare the path in `electron/main.ts` with Vite's actual output.

```typescript
// ❌ Wrong: assumes dist/public/
const indexPath = path.join(appPath, "dist", "public", "index.html");

// ✅ Correct: matches Vite's build.outDir
const indexPath = path.join(appPath, "client", "dist", "index.html");
```

**Verify:** Check `vite.config.ts` for `root` and `build.outDir`.

---

### 2. Build folder missing from ASAR

**Symptom:** Works in dev, black screen after packaging.

**Check:** `package.json` → `build.files` array.

```json
// ❌ Incomplete
"files": ["dist/**/*", "electron/**/*.js"]

// ✅ Complete: includes actual build folder
"files": ["dist/**/*", "client/dist/**/*", "electron/**/*.js"]
```

**Verify:** Extract `.asar` and confirm `index.html` exists at expected path.

---

### 3. TailwindCSS purged all styles

**Symptom:** UI renders but appears invisible/unstyled.

**Check:** `tailwind.config.ts` → `content` array.

```typescript
// ❌ Incomplete paths
content: ["./client/index.html"]

// ✅ Complete paths
content: [
  "./client/index.html",
  "./client/src/**/*.{js,jsx,ts,tsx}",
  "./src/**/*.{js,jsx,ts,tsx}"
]
```

**Verify:** Inspect elements in DevTools – if classes exist but no styles, Tailwind purged them.

---

### 4. Post-build script uses wrong path

**Symptom:** Script runs without error but app still broken.

**Check:** Any `fix-paths.mjs` or similar scripts.

```javascript
// ❌ Wrong path
let indexPath = path.join(__dirname, "dist", "public", "index.html");

// ✅ Correct path
let indexPath = path.join(__dirname, "client", "dist", "index.html");
```

---

### 5. localStorage crash on init

**Symptom:** No errors visible, app just doesn't render.

**Check:** Any `JSON.parse(localStorage.getItem(...))` without try/catch.

```typescript
// ❌ Unsafe
const data = JSON.parse(localStorage.getItem("key") as string);

// ✅ Safe
let data = null;
try {
  const raw = localStorage.getItem("key");
  data = raw ? JSON.parse(raw) : null;
} catch (e) {
  console.error("Corrupted localStorage, resetting.");
  localStorage.removeItem("key");
}
```

---

## Debug Checklist

When facing a black screen, verify in order:

1. [ ] DevTools Console – any `Not allowed to load` errors?
2. [ ] `electron/main.ts` – does `loadFile()` path match Vite output?
3. [ ] `package.json` – does `build.files` include the build folder?
4. [ ] `tailwind.config.ts` – does `content` cover all source files?
5. [ ] Post-build scripts – do paths match actual build output?
6. [ ] localStorage access – is it wrapped in try/catch?

---

> Reference project: Smart API Manager BETA - BETA.13 (working correctly)
> Last updated: 2026-01-02
