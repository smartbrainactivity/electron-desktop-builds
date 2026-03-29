# Electron Code Signing Guide

How to sign your Electron app for Windows and macOS distribution.

---

## Why Code Signing?

| Platform | Without Signing | With Signing |
|----------|-----------------|--------------|
| **Windows** | SmartScreen warning, "Unknown publisher" | Trusted, no warnings |
| **macOS** | "App is damaged" or won't open | Opens normally |

---

## macOS Code Signing

### Prerequisites

1. Apple Developer account ($99/year)
2. "Developer ID Application" certificate
3. App-specific password for notarization

### Environment Variables

```bash
# Required for electron-builder
export APPLE_ID="developer@company.com"
export APPLE_ID_PASSWORD="xxxx-xxxx-xxxx-xxxx"  # App-specific password
export APPLE_TEAM_ID="XXXXXXXXXX"               # 10-character Team ID
export CSC_LINK="path/to/certificate.p12"
export CSC_KEY_PASSWORD="certificate-password"
```

### Entitlements File

Create `build/entitlements.mac.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- Required for Electron -->
    <key>com.apple.security.cs.allow-jit</key>
    <true/>
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
    <true/>
    <key>com.apple.security.cs.disable-library-validation</key>
    <true/>
    
    <!-- Optional: Apple Events (for automation) -->
    <key>com.apple.security.automation.apple-events</key>
    <true/>
    
    <!-- Optional: Network access -->
    <key>com.apple.security.network.client</key>
    <true/>
    
    <!-- Optional: Microphone (if needed) -->
    <key>com.apple.security.device.audio-input</key>
    <true/>
</dict>
</plist>
```

### electron-builder.yml Configuration

```yaml
mac:
  hardenedRuntime: true
  gatekeeperAssess: false
  entitlements: build/entitlements.mac.plist
  entitlementsInherit: build/entitlements.mac.plist
  identity: "Developer ID Application: Company Name (TEAM_ID)"
```

### Notarization

electron-builder handles notarization automatically when:
- `APPLE_ID`, `APPLE_ID_PASSWORD`, and `APPLE_TEAM_ID` are set
- `hardenedRuntime: true` is configured

Manual notarization (if needed):

```bash
# Submit for notarization
xcrun notarytool submit MyApp.dmg \
  --apple-id "$APPLE_ID" \
  --password "$APPLE_ID_PASSWORD" \
  --team-id "$APPLE_TEAM_ID" \
  --wait

# Staple the ticket
xcrun stapler staple MyApp.dmg
```

### Getting App-Specific Password

1. Go to [appleid.apple.com](https://appleid.apple.com)
2. Sign in → Security → App-Specific Passwords
3. Generate new password labeled "Electron Notarization"
4. Use this as `APPLE_ID_PASSWORD`

---

## Windows Code Signing

### Option 1: Local Certificate (.pfx)

```yaml
# electron-builder.yml
win:
  certificateFile: ${env.WIN_CERT_FILE}
  certificatePassword: ${env.WIN_CERT_PASSWORD}
```

```powershell
# Environment variables
$env:WIN_CERT_FILE = "C:\path\to\certificate.pfx"
$env:WIN_CERT_PASSWORD = "your-password"
```

### Option 2: Azure Key Vault (Recommended for CI/CD)

Create `scripts/sign.js`:

```javascript
exports.default = async function (configuration) {
  const signTool = require("electron-builder-lib/out/codeSign/windowsCodeSign");
  
  if (process.env.AZURE_KEY_VAULT_URI) {
    await signTool.sign({
      path: configuration.path,
      name: "My Electron App",
      site: "https://myapp.com",
      signToolArgs: [
        "sign",
        "/fd", "SHA256",
        "/tr", "http://timestamp.digicert.com",
        "/td", "SHA256",
        "/kvu", process.env.AZURE_KEY_VAULT_URI,
        "/kvc", process.env.AZURE_KEY_VAULT_CERT_NAME,
        "/kvi", process.env.AZURE_CLIENT_ID,
        "/kvs", process.env.AZURE_CLIENT_SECRET,
        "/kvt", process.env.AZURE_TENANT_ID,
      ],
    });
  }
};
```

```yaml
# electron-builder.yml
win:
  sign: ./scripts/sign.js
```

### Creating a Self-Signed Certificate (Development Only)

```powershell
# Generate certificate
$cert = New-SelfSignedCertificate `
  -Subject "CN=My App Dev" `
  -Type CodeSigning `
  -CertStoreLocation Cert:\CurrentUser\My

# Export to .pfx
$password = ConvertTo-SecureString -String "dev-password" -AsPlainText -Force
Export-PfxCertificate -Cert $cert -FilePath "dev-cert.pfx" -Password $password

# Convert to base64 (for GitHub Secrets)
[Convert]::ToBase64String([IO.File]::ReadAllBytes("dev-cert.pfx")) | Out-File cert.b64
```

> ⚠️ **Warning:** Self-signed certificates will still trigger SmartScreen warnings. For production, purchase a certificate from DigiCert, Sectigo, or similar.

---

## Purchasing Certificates

### Windows (EV or OV Code Signing)

| Provider | Type | Price/year | SmartScreen Trust |
|----------|------|------------|-------------------|
| DigiCert | EV | ~$400 | Immediate |
| Sectigo | OV | ~$200 | After reputation builds |
| SSL.com | OV | ~$150 | After reputation builds |

### macOS

Only available through Apple Developer Program ($99/year).

---

## Troubleshooting

| Error | Cause | Solution |
|-------|-------|----------|
| `The signature is invalid` | Certificate expired | Renew certificate |
| `CSC_LINK not found` | Env var not set | Check environment variables |
| `Notarization failed` | Invalid credentials | Regenerate app-specific password |
| `No identity found` | Certificate not installed | Import .p12 to Keychain |
| `SmartScreen blocked` | Unsigned or no reputation | Use EV certificate |
| `hardened runtime error` | Missing entitlement | Check entitlements.plist |

---

## CI/CD Secrets Setup

For GitHub Actions, add these secrets:

### macOS
- `APPLE_ID` - Your Apple ID email
- `APPLE_ID_PASSWORD` - App-specific password
- `APPLE_TEAM_ID` - Team ID (10 chars)
- `MAC_CERTS` - Base64-encoded .p12 file
- `MAC_CERTS_PASSWORD` - Certificate password

### Windows
- `WIN_CERT_FILE` - Base64-encoded .pfx file
- `WIN_CERT_PASSWORD` - Certificate password

See [electron-github-actions.md](electron-github-actions.md) for complete workflow.
