@echo off
:: FindMyJobs v13 — Deploy Script for Windows
:: Run this from inside your C:\Users\User\Desktop\FindMyJobs.store folder

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║   FindMyJobs v13 — Deploying World Map   ║
echo  ╚══════════════════════════════════════════╝
echo.

:: Step 1 — Copy files to correct destinations
echo [1/4] Copying App.jsx...
copy /Y "fmj_patch\src\App.jsx" "src\App.jsx"
if errorlevel 1 ( echo ERROR: App.jsx copy failed & pause & exit /b 1 )
echo       Done.

echo [2/4] Copying WorldMap.jsx...
copy /Y "fmj_patch\src\WorldMap.jsx" "src\WorldMap.jsx"
if errorlevel 1 ( echo ERROR: WorldMap.jsx copy failed & pause & exit /b 1 )
echo       Done.

:: Step 2 — Git add both files
echo [3/4] Staging files in git...
git add src/App.jsx src/WorldMap.jsx
if errorlevel 1 ( echo ERROR: git add failed & pause & exit /b 1 )
echo       Done.

:: Step 3 — Commit
echo [4/4] Committing...
git commit -m "feat: World Map tab - live global job map v13"
if errorlevel 1 ( echo ERROR: git commit failed & pause & exit /b 1 )

:: Step 4 — Push
echo.
echo  Pushing to GitHub...
git push origin main
if errorlevel 1 ( echo ERROR: git push failed & pause & exit /b 1 )

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║  Done! findmyjobs.store deploying now    ║
echo  ║  Check GitHub Actions for build status   ║
echo  ╚══════════════════════════════════════════╝
echo.
pause
