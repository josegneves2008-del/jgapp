@echo off
echo A abrir DailyMed com servidor local...
echo.
echo Quando o servidor iniciar, abra no browser o URL mostrado (ex: http://localhost:3000)
echo Para sair, feche esta janela ou prima Ctrl+C.
echo.
npx --yes serve . -l 3000
pause
