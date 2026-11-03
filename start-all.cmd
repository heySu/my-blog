@echo off
setlocal
set "ROOT=%~dp0"

echo ============================================
echo   个人博客 · 一键启动
echo ============================================
echo.

call "%ROOT%start-db.cmd"

echo.
echo 等待数据库就绪...
timeout /t 5 /nobreak >nul

echo 启动后端 http://localhost:3000 ...
start "blog-server" cmd /k "cd /d "%ROOT%server" && npm run dev"

timeout /t 2 /nobreak >nul

echo 启动前端 http://localhost:5173 ...
start "blog-web" cmd /k "cd /d "%ROOT%web" && npm run dev"

echo.
echo 全部启动完成，浏览器访问：http://localhost:5173
echo 后台地址：http://localhost:5173/admin   账号 admin / admin123
echo.
pause
