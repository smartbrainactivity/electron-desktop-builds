# 🖥️ Electron Desktop Builds — AI Skill para Antigravity · Claude Code · Gemini CLI · Cursor

![Electron Desktop Builds](assets/banner.svg)

[![Creator](https://img.shields.io/badge/Creator-SMARTbrain%20Activity-blue)](https://www.smartbrainactivity.ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](/LICENSE)
[![Security Scan](https://img.shields.io/badge/Security_Scan-Passed-brightgreen)](/scripts/audit-scan.js)
[![Antigravity Skill](https://img.shields.io/badge/Antigravity-Skill-black?logo=google&logoColor=white)]()
[![Claude Code](https://img.shields.io/badge/Claude_Code-Compatible-blue?logo=anthropic&logoColor=white)]()
[![Gemini CLI](https://img.shields.io/badge/Gemini_CLI-Compatible-4285F4?logo=google&logoColor=white)]()
[![Electron](https://img.shields.io/badge/Electron-Builds-47848F?logo=electron&logoColor=white)]()
[![Node.js](https://img.shields.io/badge/Node.js-Compatible-339933?logo=nodedotjs&logoColor=white)]()
[![License MIT](https://img.shields.io/badge/License-MIT-yellow)]()

Un skill de IA experto para asistentes de codigo (como Claude, Antigravity, Cursor, etc.) diseñado para ayudarte a planificar, configurar y resolver problemas de builds de Electron para escritorio directamente desde el chat o la terminal.

[🇬🇧 Read in English](README.md)

---

## 🚀 Instalacion y Configuracion

Para usar este skill con tu asistente de IA local, clona este repositorio en el directorio de "skills globales" de tu editor (por ejemplo, `.gemini/antigravity/skills` o el equivalente de tu entorno).

1. Abre tu terminal y navega a la carpeta de skills globales de tu asistente de IA.
2. Ejecuta el siguiente comando para descargar el skill:

```bash
git clone https://github.com/smartbrainactivity/electron-desktop-builds.git
```

3. (Opcional pero recomendado) Audita el codigo usando nuestro escaner de seguridad integrado antes de ejecutar nada:

```bash
node electron-desktop-builds/scripts/audit-scan.js
```

4. Reinicia tu chat de IA. Ahora puedes escribir: *"Ayudame a empaquetar mi app React como build de escritorio Electron para Windows"*.

---

## Que Hace Este Skill

Este skill convierte a tu asistente de IA en un **experto en builds de Electron** que sigue un enfoque de diagnostico estructurado:

1. **Clarifica el objetivo** — dev vs. produccion, SO destino, herramienta de empaquetado
2. **Reproduce el error** — pide logs, configs y detalles del entorno
3. **Verifica compatibilidad** — comprueba versiones de Node, Electron y modulos nativos
4. **Aisla el problema** — categoriza el issue usando su biblioteca de referencia
5. **Diseña soluciones paso a paso** — de menor a mayor impacto, siempre reversibles
6. **Explica el razonamiento** — para que aprendas, no solo copies y pegues

## Guias de Referencia Incluidas

| Guia | Descripcion |
|------|-------------|
| **[Black Screen Debug](./references/electron-black-screen-debug.md)** | Playbook detallado para diagnosticar pantallas vacias/blancas/negras |
| **[Builder Config](./references/electron-builder-config.md)** | Plantillas completas de electron-builder — flujos firmados Y sin firmar |
| **[Code Signing](./references/electron-code-signing.md)** | Guias de firma para Windows (.pfx, Azure Key Vault) y macOS (notarizacion) |
| **[Common Errors](./references/electron-common-errors.md)** | 10 patrones de error conocidos con soluciones probadas (iconos, symlinks, Visual Studio) |
| **[Diagnostic Steps](./references/electron-diagnostic-steps.md)** | Checklist sistematico para triaje de fallos de build |
| **[GitHub Actions](./references/electron-github-actions.md)** | Workflows CI/CD automatizados para builds y releases multiplataforma |
| **[Icon Generation](./references/electron-icon-generation.md)** | Deteccion JPEG-vs-PNG, workflow rcedit, las 10 ubicaciones de iconos, scripts de generacion |
| **[Release Checklist](./references/electron-release-checklist.md)** | Checklist de 10 secciones (iconos, versiones, limpieza debug, builds sin firma) |

## Scripts

| Script | Tipo | Descripcion |
|--------|------|-------------|
| **[audit-scan.js](./scripts/audit-scan.js)** | Diagnostico | Escaner de seguridad estatico — verifica que no haya patrones maliciosos |
| **[verify-icons.js](./scripts/verify-icons.js)** | Diagnostico | Validador de formato de iconos — detecta JPEG-como-PNG, comprueba dimensiones, avisa sobre config |
| **[fix-exe-icon.js](./scripts/fix-exe-icon.js)** | Post-build | Inyeccion automatica del icono en el `.exe` cuando `signAndEditExecutable: false`. Usa `rcedit` + reconstruye el instalador NSIS. **Copiar al proyecto y añadir al build chain.** |

### Uso de `fix-exe-icon.js`

Este script soluciona de forma definitiva el problema del icono por defecto de Electron en builds sin firma. Se copia al proyecto y se añade al script de build:

```bash
# Copiar al proyecto (o a una carpeta compartida entre proyectos)
cp scripts/fix-exe-icon.js <tu-proyecto>/scripts/fix-exe-icon.js

# Añadir al final del script electron:build en package.json
"electron:build": "... && electron-builder && node scripts/fix-exe-icon.js"
```

El script lee todo de `package.json` automaticamente (productName, win.icon, directorio de salida). No tiene rutas hardcodeadas — funciona para cualquier app Electron.

## Prompt Pre-Build (Opcional)

Antes de hacer el build del instalador, pega este prompt en tu asistente de IA. Verificara tu proyecto automaticamente, pedira lo que falte y corregira problemas antes de compilar:

<details>
<summary><strong>Haz clic para ver el prompt completo</strong></summary>

```
Ejecuta un chequeo pre-build de mi app Electron antes de construir el instalador.

Para cada paso, ejecuta la comprobacion automaticamente. Si algo falla, PARA y arreglalo
antes de continuar. Si necesitas informacion, PREGUNTAME antes de seguir.

1. VERSIONES — Lee la version de package.json, la constante APP_VERSION del main de electron,
   y cualquier version hardcodeada en el frontend (footer, dialogo about). Confirma que coincidan.
   Busca: grep -r "v1\.0\.0" client/src/

2. FORMATO DEL ICONO — Ejecuta: file assets/icon.png (o donde este configurado en el build).
   Si dice "JPEG image data" en vez de "PNG image data", conviertelo a PNG real.
   Comprueba que el icono sea al menos 256x256. Busca referencias a iconos antiguos (avatar.png)
   en los componentes React.

3. CODIGO DEBUG — Busca openDevTools en el main de electron. Solo debe ejecutarse cuando isDev
   es true. Busca console.log de debug y listeners de debug (did-fail-load, console-message).
   Comprueba que <base href="./"> no este duplicado en index.html.

4. CONFIG DEL BUILD — Verifica que build.files incluya todos los directorios necesarios.
   Si signAndEditExecutable: false, confirma que el paso de rcedit esta planificado.
   Si npmRebuild: false, confirma que no se necesitan modulos nativos.
   Comprueba que la ruta de instalacion en installer.nsh sea correcta.

5. INFORME — Genera una tabla resumen con OK/FALLO para cada comprobacion.
   Si todo pasa, dame los comandos exactos de build (incluyendo rcedit si es necesario).
   Si algo falla, arreglalo primero y muestra el informe actualizado.
```

</details>

Despues del build, puedes verificar el resultado con:

```
Verifica mi build de Electron: extrae el icono del .exe y confirma que es mi icono
(no el icono por defecto de Electron). Si esta mal, arreglalo con rcedit y reconstruye
el instalador NSIS.
```

## Cobertura

- **Herramientas de Build**: electron-builder, electron-forge, electron-packager
- **Plataformas**: Windows (instalador NSIS), macOS (.dmg), Linux (.AppImage, .deb)
- **Frameworks**: React, Expo, proyectos vanilla Node.js
- **Temas**: empaquetado asar, preload scripts, modulos nativos, auto-update, firma de codigo, builds multiplataforma, generacion de iconos

## Requisitos

- **Cualquier Agente de IA / IDE**: Este skill es completamente agnostico del IDE. Funciona con Claude Code, Antigravity, Gemini CLI, Cursor, y cualquier asistente que soporte carga de skills.
- **Sin dependencias de ejecucion**: Este es un skill solo de conocimiento — no hay scripts que ejecutar ni paquetes que instalar.

**🛡️ Nota de Privacidad y Seguridad**: Este skill contiene archivos markdown de referencia y scripts de diagnostico opcionales. No hay peticiones de red ni telemetria. Te animamos a inspeccionar el codigo fuente antes de usarlo.

**🔍 Escaner de Auditoria Estatica**: Este repositorio incluye un script de analisis estatico nativo (`scripts/audit-scan.js`) similar a Snyk/CodeQL. Puedes ejecutar `node scripts/audit-scan.js` en cualquier momento para verificar que ninguna logica contenga patrones maliciosos (como `eval`, peticiones HTTP no autorizadas, o comandos destructivos de `child_process`).

## Agnostico del Idioma

Este skill se adapta automaticamente al idioma de tu prompt. Puedes instruir a la IA en español, ingles o cualquier otro idioma, y las guias de diagnostico seguiran tu idioma preferido.

## Soporte y Contacto

- **Creador**: SMARTbrain Activity
- **Web**: [www.smartbrainactivity.ai](https://www.smartbrainactivity.ai)
- **Email**: [hey@smartbrainactivity.ai](mailto:hey@smartbrainactivity.ai)

---

## Topics

electron · electron-builder · nsis · desktop-app · windows · macos · linux · code-signing · icon-generation · rcedit · ai-agents · gemini-cli · antigravity · claude-code · claude-code-skills · antigravity-tools · antigravity-skills

## Licencia

[Licencia MIT](LICENSE)
