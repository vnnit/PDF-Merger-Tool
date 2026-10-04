@echo off
title Build PDFMergerPro Standalone EXE
echo Dang cai dat thu vien can thiet...
pip install pyinstaller

echo.
echo Dang dong goi PDFMergerPro.exe...
pyinstaller --onefile --noconsole --name "PDFMergerPro" --add-data "index.html;." --add-data "app.js;." --add-data "pdf-lib.min.js;." --add-data "sortable.min.js;." --add-data "pdf.min.js;." --add-data "pdf.worker.min.js;." main_desktop.py

if exist dist\PDFMergerPro.exe (
    copy dist\PDFMergerPro.exe PDFMergerPro.exe /Y
    echo.
    echo ========================================================
    echo  BUILD THANH CONG! File duoc luu tai: PDFMergerPro.exe
    echo ========================================================
) else (
    echo.
    echo ========================================================
    echo  CO LOI XAY RA TRONG QUA TRINH BUILD!
    echo ========================================================
)
pause
