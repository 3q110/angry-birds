@echo off
echo ========================================
echo   愤怒的小鸟 - 浏览器版
echo ========================================
echo.
echo 正在启动本地服务器...
echo.
echo 请在浏览器中打开: http://localhost:8080
echo.
echo 按 Ctrl+C 停止服务器
echo ========================================
echo.
python -m http.server 8080
