@echo off
echo Uruchamianie Systemu Lotos SPA...

echo 1. Startowanie Backendu (Port 3000)...
start "Lotos Backend" /D "backend" npm run dev

echo Czekanie 5 sekund na start backendu...
timeout /t 5 /nobreak >nul

echo 2. Startowanie Frontendu (Port 3001)...
start "Lotos Frontend" /D "gemini uiux" npm run dev

echo.
echo ========================================================
echo Aplikacja uruchomiona!
echo Frontend dostepny pod adresem: http://localhost:3001
echo Backend dostepny pod adresem: http://localhost:3000
echo ========================================================
echo.
echo Aby zatrzymac, zamknij otwarte okna terminali.
pause
