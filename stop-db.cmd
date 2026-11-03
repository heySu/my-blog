@echo off
setlocal
set "ROOT=%~dp0"
set "MYSQLADMIN=%ROOT%database\mysql\bin\mysqladmin.exe"

if not exist "%MYSQLADMIN%" (
  echo [x] 未找到 mysqladmin.exe
  pause
  exit /b 1
)

echo 正在关闭 MySQL...
"%MYSQLADMIN%" -u root -p123456 -h 127.0.0.1 -P 3306 shutdown
if errorlevel 1 (
  echo [!] 正常关闭失败，尝试结束进程...
  taskkill /F /IM mysqld.exe >nul 2>&1
)

echo 已关闭。
