@echo off
echo ========================================
echo   愤怒的小鸟 - 浏览器版
echo ========================================
echo.
echo 正在重新打包浏览器版 bundle...
node build-browser-bundle.js
if errorlevel 1 (
  echo.
  echo [错误] 打包失败，请确认已安装 Node.js（node -v 检查）。
  echo 提示：也可以直接双击 index.html 打开游戏（需已有 js/browser-bundle.js）。
  exit /b 1
)
echo.
echo 正在启动本地服务器...
echo.
echo 请在浏览器中打开: http://localhost:8080
echo （也可以直接双击 index.html 玩，无需服务器）
echo.
echo 按 Ctrl+C 停止服务器
echo ========================================
echo.
python -m http.server 8080
