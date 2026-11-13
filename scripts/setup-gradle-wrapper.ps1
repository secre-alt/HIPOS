$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$jar = Join-Path $root "gradle/wrapper/gradle-wrapper.jar"
$source = "https://raw.githubusercontent.com/gradle/gradle/v8.13.0/gradle/wrapper/gradle-wrapper.jar"
$checksumSource = "https://services.gradle.org/distributions/gradle-8.13-wrapper.jar.sha256"
Write-Host "Fetching official Gradle 8.13 wrapper and SHA-256 checksum..."
$checksumContent = (Invoke-WebRequest -Uri $checksumSource -UseBasicParsing).Content
if ($checksumContent -is [byte[]]) { $checksumContent = [System.Text.Encoding]::UTF8.GetString($checksumContent) }
$expected = ($checksumContent.Trim().Split(' ')[0]).ToLower()
if (-not (Test-Path $jar)) {
  Invoke-WebRequest -Uri $source -OutFile $jar -UseBasicParsing
}
$actual = (Get-FileHash -Path $jar -Algorithm SHA256).Hash.ToLower()
if ($actual -ne $expected) { Remove-Item $jar -ErrorAction SilentlyContinue; throw "Wrapper checksum mismatch. Wrapper removed." }
Write-Host "Verified Gradle wrapper JAR. Now run .\gradlew.bat :app:assembleStudentDebug :app:assembleStaffDebug"
