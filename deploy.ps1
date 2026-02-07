# 🚀 Quick Deploy Script

Write-Host "🚀 Truvamate Deployment Script" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Check if Vercel CLI is installed
Write-Host "📦 Checking Vercel CLI..." -ForegroundColor Yellow
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Vercel CLI not found. Installing..." -ForegroundColor Red
    npm install -g vercel
    Write-Host "✅ Vercel CLI installed`n" -ForegroundColor Green
} else {
    Write-Host "✅ Vercel CLI found`n" -ForegroundColor Green
}

# Ask what to deploy
Write-Host "What would you like to deploy?" -ForegroundColor Cyan
Write-Host "1. Backend only" -ForegroundColor White
Write-Host "2. Frontend only" -ForegroundColor White
Write-Host "3. Both (Backend first, then Frontend)" -ForegroundColor White
Write-Host "4. Exit" -ForegroundColor White
$choice = Read-Host "`nEnter choice (1-4)"

switch ($choice) {
    "1" {
        Write-Host "`n🔨 Deploying Backend..." -ForegroundColor Cyan
        
        # Build backend
        Write-Host "`n📦 Building backend..." -ForegroundColor Yellow
        cd backend
        npm run build
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Backend build successful`n" -ForegroundColor Green
            
            # Deploy to Vercel
            Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Yellow
            vercel --prod
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "`n✅ Backend deployed successfully!" -ForegroundColor Green
                Write-Host "`n⚠️  Don't forget to:" -ForegroundColor Yellow
                Write-Host "  1. Set environment variables in Vercel Dashboard" -ForegroundColor White
                Write-Host "  2. Update FRONTEND_URL with your frontend URL" -ForegroundColor White
                Write-Host "  3. Download Firebase Service Account Key" -ForegroundColor White
            } else {
                Write-Host "`n❌ Deployment failed" -ForegroundColor Red
            }
        } else {
            Write-Host "❌ Build failed" -ForegroundColor Red
        }
        cd ..
    }
    
    "2" {
        Write-Host "`n🔨 Deploying Frontend..." -ForegroundColor Cyan
        
        # Build frontend
        Write-Host "`n📦 Building frontend..." -ForegroundColor Yellow
        npm run build
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Frontend build successful`n" -ForegroundColor Green
            
            # Deploy to Vercel
            Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Yellow
            vercel --prod
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "`n✅ Frontend deployed successfully!" -ForegroundColor Green
                Write-Host "`n⚠️  Don't forget to:" -ForegroundColor Yellow
                Write-Host "  1. Set VITE_API_URL in Vercel Dashboard" -ForegroundColor White
                Write-Host "  2. Set Firebase config variables" -ForegroundColor White
            } else {
                Write-Host "`n❌ Deployment failed" -ForegroundColor Red
            }
        } else {
            Write-Host "❌ Build failed" -ForegroundColor Red
        }
    }
    
    "3" {
        Write-Host "`n🔨 Deploying Both (Backend → Frontend)..." -ForegroundColor Cyan
        
        # Deploy Backend
        Write-Host "`n📦 Step 1/2: Building Backend..." -ForegroundColor Yellow
        cd backend
        npm run build
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Backend build successful" -ForegroundColor Green
            Write-Host "🚀 Deploying backend..." -ForegroundColor Yellow
            vercel --prod
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Backend deployed!`n" -ForegroundColor Green
                cd ..
                
                # Deploy Frontend
                Write-Host "📦 Step 2/2: Building Frontend..." -ForegroundColor Yellow
                npm run build
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "✅ Frontend build successful" -ForegroundColor Green
                    Write-Host "🚀 Deploying frontend..." -ForegroundColor Yellow
                    vercel --prod
                    
                    if ($LASTEXITCODE -eq 0) {
                        Write-Host "`n🎉 Both deployed successfully!" -ForegroundColor Green
                        Write-Host "`n⚠️  Next steps:" -ForegroundColor Yellow
                        Write-Host "  1. Set environment variables for both projects" -ForegroundColor White
                        Write-Host "  2. Update API URLs in Vercel Dashboard" -ForegroundColor White
                        Write-Host "  3. Test production endpoints" -ForegroundColor White
                    } else {
                        Write-Host "`n❌ Frontend deployment failed" -ForegroundColor Red
                    }
                } else {
                    Write-Host "❌ Frontend build failed" -ForegroundColor Red
                }
            } else {
                Write-Host "`n❌ Backend deployment failed" -ForegroundColor Red
                cd ..
            }
        } else {
            Write-Host "❌ Backend build failed" -ForegroundColor Red
            cd ..
        }
    }
    
    "4" {
        Write-Host "`nExiting..." -ForegroundColor Yellow
        exit 0
    }
    
    default {
        Write-Host "`n❌ Invalid choice" -ForegroundColor Red
    }
}

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "📚 For detailed guide, see DEPLOYMENT_GUIDE.md" -ForegroundColor Cyan
