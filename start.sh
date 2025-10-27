#!/bin/bash

echo "🚀 Global Tree 多图形库知识图谱系统"
echo "====================================="
echo

# 检查 Node.js 环境
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到 Node.js，请先安装 Node.js >= 16.0.0"
    echo "下载地址: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js 已安装: $(node --version)"
echo

# 检查依赖是否已安装
if [ ! -d "node_modules" ]; then
    echo "📦 正在安装依赖..."
    if command -v pnpm &> /dev/null; then
        pnpm install
    else
        npm install
    fi
    
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败，请检查网络连接"
        exit 1
    fi
    echo "✅ 依赖安装完成"
else
    echo "✅ 依赖已安装"
fi

echo
echo "🌟 启动开发服务器..."
echo "访问地址: http://localhost:5173"
echo "按 Ctrl+C 停止服务器"
echo

# 启动开发服务器
if command -v pnpm &> /dev/null; then
    pnpm dev
else
    npm run dev
fi
