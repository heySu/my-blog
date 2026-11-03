@echo off
setlocal
set "ROOT=%~dp0"
set "MYSQLD=%ROOT%database\mysql\bin\mysqld.exe"
set "MYSQLADMIN=%ROOT%database\mysql\bin\mysqladmin.exe"
set "DATA=%ROOT%database\data"
set "TMPDIR=%ROOT%database\tmp"
set "TMP=%ROOT%database\tmp"
set "TEMP=%ROOT%database\tmp"

if not exist "%MYSQLD%" (
  echo [x] 未找到 MySQL，请确认 database\mysql\bin\mysqld.exe 存在。
  pause
  exit /b 1
)
if not exist "%TMPDIR%" mkdir "%TMPDIR%"

netstat -ano | findstr /R /C:"TCP.*:3306 .*LISTENING" >nul
if not errorlevel 1 (
  echo [i] MySQL 已经在运行（3306 端口被占用）
  exit /b 0
)

if not exist "%DATA%\mysql" (
  echo [1/3] 首次启动，正在初始化数据目录...
  "%MYSQLD%" --initialize-insecure --basedir="%ROOT%database\mysql" --datadir="%DATA%" --tmpdir="%TMPDIR%" --default-authentication-plugin=mysql_native_password --log-error="%ROOT%database\mysql-error.log"
  if errorlevel 1 (
    echo [x] 初始化失败，请查看 database\mysql-error.log
    pause
    exit /b 1
  )
  set "FIRST_RUN=1"
  echo [1/3] 数据目录初始化完成
)

echo [2/3] 正在启动 MySQL ^(端口 3306^)...
start "blog-mysql" /min "%MYSQLD%" --basedir="%ROOT%database\mysql" --datadir="%DATA%" --port=3306 --tmpdir="%TMPDIR%" --character-set-server=utf8mb4 --collation-server=utf8mb4_general_ci --default-authentication-plugin=mysql_native_password --log-error="%ROOT%database\mysql-error.log"

echo 等待数据库就绪...
timeout /t 8 /nobreak >nul

if defined FIRST_RUN (
  echo [3/3] 首次运行，正在设置密码并初始化博客数据库...
  "%MYSQLADMIN%" -u root --skip-password -h 127.0.0.1 -P 3306 password 123456
  pushd "%ROOT%server"
  call npm run init:db
  popd
)

echo.
echo MySQL 已启动：127.0.0.1:3306  root / 123456  数据库 my_blog
echo 关闭请运行 stop-db.cmd
