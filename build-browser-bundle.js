// build-browser-bundle.js
// 将 js/ 下的 ES 模块按依赖顺序拼接，去掉 import/export，
// 生成单个非模块 bundle（js/browser-bundle.js），使 index.html
// 在 file:// 协议（直接双击打开）下也能运行。
//
// 用法：node build-browser-bundle.js
//
// 注意：
// - 微信小游戏版（game.js -> js/main.js）不受影响，仍使用原始 ES 模块。
// - 修改了 js/ 下任何模块后，请重新运行本脚本，否则浏览器版行为会不同步。
const fs = require('fs')
const path = require('path')

// 依赖顺序（collision 依赖 sound；main-browser 依赖其余全部）
const DEPS = [
  'physics.js',
  'slingshot.js',
  'bird.js',
  'level.js',
  'block.js',
  'pig.js',
  'effects.js',
  'ui.js',
  'scenes.js',
  'input.js',
  'sound.js',
  'collision.js',
  'main-browser.js'
]

// 去掉模块语法：
// - 整行的 import ... from '...'  -> 删除
// - 整行的 export { X, Y }        -> 删除（声明本身已保留在文件中）
// - export const/class/function   -> 保留声明，仅去掉 export
function stripModuleSyntax(src) {
  return src
    .split('\n')
    .map((line) => {
      if (/^import\b/.test(line)) return null
      if (/^export\s*\{/.test(line)) return null
      if (/^export\s+(const|let|var|class|function)\b/.test(line)) {
        return line.replace(/^export\s+/, '')
      }
      return line
    })
    .filter((line) => line !== null)
    .join('\n')
}

const dir = path.join(__dirname, 'js')
const parts = DEPS.map((name) => {
  const file = path.join(dir, name)
  if (!fs.existsSync(file)) {
    console.error(`缺少模块文件: ${file}`)
    process.exit(1)
  }
  const src = fs.readFileSync(file, 'utf8')
  return `// ===== ${name} =====\n${stripModuleSyntax(src)}`
})

const bundle =
  '/* 本文件由 build-browser-bundle.js 自动生成，请勿手动编辑。' +
  ' 修改 js/ 下模块后请运行: node build-browser-bundle.js */\n' +
  '(function () {\n"use strict";\n\n' +
  parts.join('\n\n') +
  '\n\n})()\n'

const outFile = path.join(dir, 'browser-bundle.js')
fs.writeFileSync(outFile, bundle, 'utf8')
console.log(`已生成 js/browser-bundle.js（拼接 ${DEPS.length} 个模块，共 ${bundle.length} 字节）`)
