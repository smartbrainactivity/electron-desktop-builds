const fs = require('fs');
const path = require('path');

console.log("==================================================");
console.log("🛡️ SMARTbrain Activity - Security & Audit Scan");
console.log("==================================================\n");

const baseDir = path.resolve(__dirname, '..');

const targetDirs = [
    path.join(baseDir, 'scripts'),
    path.join(baseDir, 'references')
];

let vulnerabilities = 0;
let filesScanned = 0;

const blacklistedPatterns = [
    { regex: /eval\s*\(/g, name: "Uso de eval() detectado (Arbitrary Code Execution)" },
    { regex: /setTimeout\s*\(\s*['"]/g, name: "setTimeout con Strings (Equivalente a eval)" },
    { regex: /setInterval\s*\(\s*['"]/g, name: "setInterval con Strings (Equivalente a eval)" },
    { regex: /require\s*\(\s*['"](?:http|https)/g, name: "Requisición HTTP directa detectada (Riesgo de descarga externa)" },
    { regex: /child_process.*(rm\s+-rf|del\s+\/f|format)/gi, name: "Comandos destructivos en shell detectados (rm -rf, format, del)" }
];

function scanFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    if (path.basename(filePath) === 'audit-scan.js') return;

    filesScanned++;
    const content = fs.readFileSync(filePath, 'utf8');
    let fileIsClean = true;

    blacklistedPatterns.forEach(pattern => {
        pattern.regex.lastIndex = 0;
        if (pattern.regex.test(content)) {
            vulnerabilities++;
            fileIsClean = false;
            console.error(`[🚨 WARNING] ${path.basename(filePath)} -> ${pattern.name}`);
        }
    });

    if (fileIsClean) {
        console.log(`[PASS] ${path.basename(filePath)} verificado: Limpio.`);
    }
}

console.log("Iniciando escaneo estático de archivos (Snyk/Audit Style)...\n");

targetDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
            if (file.endsWith('.js') || file.endsWith('.md')) {
                scanFile(path.join(dir, file));
            }
        });
    }
});

console.log("\n==================================================");
if (vulnerabilities === 0) {
    console.log(`✅ AUDITORÍA APROBADA: 0 vulnerabilidades críticas encontradas en ${filesScanned} archivos.`);
    console.log("Este repositorio es considerado SEGURO para su ejecución local.");
    process.exit(0);
} else {
    console.error(`❌ AUDITORÍA FALLIDA: ${vulnerabilities} vulnerabilidades críticas detectadas.`);
    process.exit(1);
}
