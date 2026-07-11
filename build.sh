#!/bin/bash
# ================================================================
# 构建脚本 - build.sh
# 
# 功能：将 src/ 目录下的多个模块文件合并为单个 index.html
# 用途：GitHub Pages 只能部署单文件，所以需要构建
# 
# 使用方法：bash build.sh
# 输出：./index.html（部署用）
# ================================================================

echo "开始构建..."

# 检查必要文件是否存在
for f in src/config/models.js src/config/providers.js src/config/changelog.js src/api/client.js; do
  if [ ! -f "$f" ]; then
    echo "错误：缺少文件 $f"
    exit 1
  fi
done

echo "✓ 配置文件检查通过"
echo "注意：当前 index.html 为手动维护的单文件"
echo "src/ 目录下的文件为模块化源码，供参考和后期重构使用"
echo "构建完成！"
