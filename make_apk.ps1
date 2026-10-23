$ErrorActionPreference = "Stop"

Write-Host "=== Step 1: Prepare Build WWW Assets ==="
$buildDir = "build_www"
if (Test-Path $buildDir) { Remove-Item -Recurse -Force $buildDir }
New-Item -ItemType Directory -Force -Path $buildDir | Out-Null

Copy-Item "index.html" "$buildDir\index.html"
Copy-Item "style.css" "$buildDir\style.css"
Copy-Item "app.js" "$buildDir\app.js"

Write-Host "=== Step 2: Copy Base APK ==="
$rawApk = "temp_unsigned.apk"
Copy-Item "base (1).apk" $rawApk -Force

Write-Host "=== Step 3: Update APK Zip Entries via .NET ZipArchive ==="
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

# 3b. Update index.html
$indexEntry = $archive.GetEntry("assets/www/index.html")
if ($indexEntry) { $indexEntry.Delete() }
[System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, "$buildDir\index.html", "assets/www/index.html", [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
Write-Host "Updated assets/www/index.html"

# 3c. Add style.css
$styleEntry = $archive.GetEntry("assets/www/style.css")
if ($styleEntry) { $styleEntry.Delete() }
[System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, "$buildDir\style.css", "assets/www/style.css", [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
Write-Host "Added assets/www/style.css"

# 3d. Add app.js
$appEntry = $archive.GetEntry("assets/www/app.js")
if ($appEntry) { $appEntry.Delete() }
[System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, "$buildDir\app.js", "assets/www/app.js", [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
Write-Host "Added assets/www/app.js"

$archive.Dispose()
Write-Host "Zip update complete."

Write-Host "=== Step 4: Setup Environment for Android Build Tools ==="
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:PATH = "$env:JAVA_HOME\bin;" + $env:PATH
$buildTools = "$env:LOCALAPPDATA\Android\Sdk\build-tools\36.0.0"
$zipalign = "$buildTools\zipalign.exe"
$apksigner = "$buildTools\apksigner.bat"

Write-Host "=== Step 5: Run Zipalign ==="
$alignedApk = "temp_aligned.apk"
if (Test-Path $alignedApk) { Remove-Item -Force $alignedApk }
& $zipalign -f -p 4 $rawApk $alignedApk
Write-Host "Zipalign finished."

Write-Host "=== Step 6: Create / Verify Signing Keystore ==="
$keystore = "naganathan_debug.keystore"
if (-not (Test-Path $keystore)) {
    Write-Host "Generating release/debug keystore..."
    & keytool -genkey -v -keystore $keystore -alias naganathan -keyalg RSA -keysize 2048 -validity 10000 -storepass "android123" -keypass "android123" -dname "CN=Naganathan, OU=Weaving, O=Naganathan Weaving Mills, L=Erode, ST=Tamil Nadu, C=IN"
}

Write-Host "=== Step 7: Sign APK with Apksigner (v1, v2, v3) ==="
$finalApk = "Naganathan_Weaving_Analyzer.apk"
if (Test-Path $finalApk) { Remove-Item -Force $finalApk }

& $apksigner sign --ks $keystore --ks-pass "pass:android123" --key-pass "pass:android123" --ks-key-alias naganathan --v1-signing-enabled true --v2-signing-enabled true --v3-signing-enabled true --out $finalApk $alignedApk

Write-Host "=== Step 8: Verify Signed APK ==="
& $apksigner verify -v $finalApk

Write-Host "=== SUCCESS: $finalApk is built and verified! ==="
$item = Get-Item $finalApk
Write-Host "Output File: $($item.FullName) ($([Math]::Round($item.Length / 1MB, 2)) MB)"

# Clean temporary files
Remove-Item -Force $rawApk, $alignedApk -ErrorAction SilentlyContinue
