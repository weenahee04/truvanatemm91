# Quick Firebase Setup Script

Write-Host "`n🔥 Firebase Service Account Setup" -ForegroundColor Cyan
Write-Host "==================================`n" -ForegroundColor Cyan

# Check if file already exists
if (Test-Path ".\backend\serviceAccountKey.json") {
    Write-Host "✅ serviceAccountKey.json already exists!" -ForegroundColor Green
    Write-Host "`nFile location: .\backend\serviceAccountKey.json" -ForegroundColor White
    
    $overwrite = Read-Host "`nDo you want to replace it? (y/N)"
    if ($overwrite -ne "y" -and $overwrite -ne "Y") {
        Write-Host "`nKeeping existing file. Exiting..." -ForegroundColor Yellow
        exit 0
    }
}

# Check if file exists in Downloads
$downloadPath = "$env:USERPROFILE\Downloads\truvamate-e3b97-*.json"
$files = Get-ChildItem -Path "$env:USERPROFILE\Downloads" -Filter "truvamate-e3b97-*.json" -ErrorAction SilentlyContinue

if ($files.Count -eq 0) {
    Write-Host "❌ No Firebase key found in Downloads folder" -ForegroundColor Red
    Write-Host "`nPlease download it first:" -ForegroundColor Yellow
    Write-Host "1. Opening Firebase Console..." -ForegroundColor White
    
    Start-Process "https://console.firebase.google.com/project/truvamate-e3b97/settings/serviceaccounts/adminsdk"
    
    Write-Host "`n2. Click 'Generate new private key'" -ForegroundColor White
    Write-Host "3. Confirm by clicking 'Generate key'" -ForegroundColor White
    Write-Host "4. File will download automatically" -ForegroundColor White
    Write-Host "`n5. After download, run this script again" -ForegroundColor Yellow
    
    exit 1
}

if ($files.Count -gt 1) {
    Write-Host "⚠️  Multiple Firebase key files found:" -ForegroundColor Yellow
    $files | ForEach-Object { Write-Host "   - $($_.Name)" -ForegroundColor White }
    Write-Host "`nUsing the most recent one..." -ForegroundColor Yellow
    $file = $files | Sort-Object LastWriteTime -Descending | Select-Object -First 1
} else {
    $file = $files[0]
}

Write-Host "`n📄 Found: $($file.Name)" -ForegroundColor Green

# Move file
try {
    Move-Item -Path $file.FullName -Destination ".\backend\serviceAccountKey.json" -Force
    Write-Host "✅ File moved successfully!" -ForegroundColor Green
    Write-Host "`nLocation: .\backend\serviceAccountKey.json" -ForegroundColor White
    
    # Verify it's a valid JSON
    $json = Get-Content ".\backend\serviceAccountKey.json" -Raw | ConvertFrom-Json
    
    if ($json.project_id -eq "truvamate-e3b97") {
        Write-Host "✅ Valid Firebase key for project: truvamate-e3b97" -ForegroundColor Green
        
        Write-Host "`n🎉 Setup complete!" -ForegroundColor Green
        Write-Host "`nNext steps:" -ForegroundColor Yellow
        Write-Host "1. Install Vercel CLI:  npm install -g vercel" -ForegroundColor White
        Write-Host "2. Login to Vercel:     vercel login" -ForegroundColor White
        Write-Host "3. Deploy:              .\deploy.ps1" -ForegroundColor White
    } else {
        Write-Host "⚠️  Warning: Project ID doesn't match" -ForegroundColor Yellow
        Write-Host "Expected: truvamate-e3b97" -ForegroundColor White
        Write-Host "Got: $($json.project_id)" -ForegroundColor White
    }
    
} catch {
    Write-Host "❌ Error moving file: $_" -ForegroundColor Red
    exit 1
}
