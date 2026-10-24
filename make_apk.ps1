$ErrorActionPreference = "Stop"

Write-Host "=========================================================="
Write-Host "TEXTILE WEAVING ANALYZER - ANDROID APK BUILD & SIGNING"
Write-Host "Smart Costing. Accurate Weaving."
Write-Host "=========================================================="

Write-Host "`n=== Step 1: Prepare Build WWW Assets ==="
$buildDir = "build_www"
if (Test-Path $buildDir) { Remove-Item -Recurse -Force $buildDir }
New-Item -ItemType Directory -Force -Path $buildDir | Out-Null
New-Item -ItemType Directory -Force -Path "$buildDir\engine" | Out-Null

Copy-Item "index.html" "$buildDir\index.html"
Copy-Item "style.css" "$buildDir\style.css"
Copy-Item "app.js" "$buildDir\app.js"
Copy-Item "logo.svg" "$buildDir\logo.svg"
Copy-Item "logo-full.svg" "$buildDir\logo-full.svg"
Copy-Item "manifest.json" "$buildDir\manifest.json"
Copy-Item "sw.js" "$buildDir\sw.js"
Copy-Item "engine\weavingCalc.js" "$buildDir\engine\weavingCalc.js"
Copy-Item "engine\gstEngine.js" "$buildDir\engine\gstEngine.js"
Copy-Item "engine\storage.js" "$buildDir\engine\storage.js"

Write-Host "WWW assets staged in $buildDir"

Write-Host "`n=== Step 2: Copy Base APK ==="
$rawApk = "temp_unsigned.apk"
Copy-Item "base (1).apk" $rawApk -Force

Write-Host "`n=== Step 3: Update APK Zip Entries via .NET ZipArchive ==="
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$archive = [System.IO.Compression.ZipFile]::Open((Resolve-Path $rawApk).Path, [System.IO.Compression.ZipArchiveMode]::Update)

# 3a. Remove old signature files in META-INF
$toRemove = @()
foreach ($entry in $archive.Entries) {
    if ($entry.FullName -match '^META-INF/.*\.(SF|RSA|DSA|EC|MF)$') {
        $toRemove += $entry
    }
}
foreach ($e in $toRemove) {
    Write-Host "Removing signature file: $($e.FullName)"
    $e.Delete()
}

# 3b. Helper function to put entry into APK
function Add-Or-Replace-Entry($zipArch, $sourceFile, $entryName) {
    $existing = $zipArch.GetEntry($entryName)
    if ($existing) {
        $existing.Delete()
    }
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zipArch, $sourceFile, $entryName, [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
    Write-Host "Added / Updated: $entryName"
}

# Copy all files from build_www into assets/www/
$allFiles = Get-ChildItem -Path $buildDir -Recurse -File
foreach ($file in $allFiles) {
    $relPath = $file.FullName.Substring((Resolve-Path $buildDir).Path.Length + 1).Replace('\', '/')
    $targetEntryName = "assets/www/" + $relPath
    Add-Or-Replace-Entry $archive $file.FullName $targetEntryName
}

$archive.Dispose()
Write-Host "Zip update complete."

Write-Host "`n=== Step 4: Setup Environment for Android Build Tools ==="
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:PATH = "$env:JAVA_HOME\bin;" + $env:PATH
$buildTools = "$env:LOCALAPPDATA\Android\Sdk\build-tools\36.0.0"
$zipalign = "$buildTools\zipalign.exe"
$apksigner = "$buildTools\apksigner.bat"

Write-Host "`n=== Step 5: Run Zipalign (4-byte alignment) ==="
$alignedApk = "temp_aligned.apk"
if (Test-Path $alignedApk) { Remove-Item -Force $alignedApk }
& $zipalign -f -p 4 $rawApk $alignedApk
Write-Host "Zipalign finished."

Write-Host "`n=== Step 6: Create / Verify Signing Keystore ==="
$keystore = "naganathan_debug.keystore"
if (-not (Test-Path $keystore)) {
    Write-Host "Generating release/debug keystore..."
    & keytool -genkey -v -keystore $keystore -alias naganathan -keyalg RSA -keysize 2048 -validity 10000 -storepass "android123" -keypass "android123" -dname "CN=Textile Weaving Analyzer, OU=Weaving, O=Textile Weaving Analyzer, L=Erode, ST=Tamil Nadu, C=IN"
}

Write-Host "`n=== Step 7: Sign APK with Apksigner (v1, v2, v3) ==="
$finalApk = "Textile_Weaving_Analyzer.apk"
if (Test-Path $finalApk) { Remove-Item -Force $finalApk }

& $apksigner sign --ks $keystore --ks-pass "pass:android123" --key-pass "pass:android123" --ks-key-alias naganathan --v1-signing-enabled true --v2-signing-enabled true --v3-signing-enabled true --out $finalApk $alignedApk

Write-Host "`n=== Step 8: Verify Signed APK ==="
& $apksigner verify -v $finalApk

# Clean temporary build artifacts & signature cache
Remove-Item -Force $rawApk, $alignedApk -ErrorAction SilentlyContinue
Get-ChildItem -Path . -Filter "*.idsig" | Remove-Item -Force -ErrorAction SilentlyContinue
if (Test-Path $buildDir) { Remove-Item -Recurse -Force $buildDir -ErrorAction SilentlyContinue }

Write-Host "`n=========================================================="
Write-Host "SUCCESS: Android APK built and verified successfully!"
$item = Get-Item $finalApk
Write-Host "Release APK:   $($item.FullName) ($([Math]::Round($item.Length / 1MB, 2)) MB)"
Write-Host "=========================================================="
