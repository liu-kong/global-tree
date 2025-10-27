@echo off
echo 🚀 Global Tree 多图形库知识图谱系统
echo =====================================
echo.

echo 检查 Node.js 环境...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未找到 Node.js，请先安装 Node.js >= 16.0.0
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js 已安装
echo.

echo 检查依赖是否已安装...
if not exist "node_modules" (
    echo 📦 正在安装依赖...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ 依赖安装失败，请检查网络连接或使用 pnpm install
        pause
        exit /b 1
    )
    echo ✅ 依赖安装完成
) else (
    echo ✅ 依赖已安装
)

echo.
echo 🌟 启动开发服务器...
echo 访问地址: http://localhost:5173
echo 按 Ctrl+C 停止服务器
echo.

npm run dev

pause
