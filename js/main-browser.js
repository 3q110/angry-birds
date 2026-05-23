import { Physics } from './physics.js'
import { Slingshot } from './slingshot.js'
import { Bird } from './bird.js'
import { LevelManager } from './level.js'
import { Block } from './block.js'
import { Pig } from './pig.js'
import { UI } from './ui.js'
import { InputManager } from './input.js'
import { Scenes } from './scenes.js'
import { CollisionDetection } from './collision.js'

const canvas = document.getElementById('gameCanvas')
const ctx = canvas.getContext('2d')
const screenWidth = 900
const screenHeight = 600

canvas.width = screenWidth
canvas.height = screenHeight

// 屏幕适配：自动缩放 Canvas 以适配各种屏幕尺寸
function resizeCanvas() {
  const container = document.getElementById('gameContainer')
  const targetRatio = screenWidth / screenHeight
  const windowRatio = window.innerWidth / window.innerHeight

  let displayWidth, displayHeight

  if (windowRatio > targetRatio) {
    // 窗口比游戏更宽，以高度为准
    displayHeight = window.innerHeight
    displayWidth = displayHeight * targetRatio
  } else {
    // 窗口比游戏更窄，以宽度为准
    displayWidth = window.innerWidth
    displayHeight = displayWidth / targetRatio
  }

  // 留一点边距
  const margin = 4
  displayWidth = Math.min(displayWidth, window.innerWidth - margin)
  displayHeight = Math.min(displayHeight, window.innerHeight - margin)

  canvas.style.width = displayWidth + 'px'
  canvas.style.height = displayHeight + 'px'
  container.style.width = displayWidth + 'px'
  container.style.height = displayHeight + 'px'
}

// 初始缩放 + 监听窗口变化
resizeCanvas()
window.addEventListener('resize', resizeCanvas)

const inputManager = new InputManager(canvas, screenWidth, screenHeight)

let slingshot
let birds = []
let blocks = []
let pigs = []
let currentBird = null
let launched = false
let gameState = 'aiming'
let score = 0
let levelIndex = 0
let sceneManager
let canDrag = false
let lastScoredPigs = 0
let lastScoredBlocks = 0
let winLoseTimeout = null

const physics = new Physics(screenWidth, screenHeight)
const groundY = screenHeight - 60
CollisionDetection.init(screenWidth)

// 按钮事件监听
const restartBtn = document.getElementById('restartBtn')
const prevBtn = document.getElementById('prevBtn')
const nextBtn = document.getElementById('nextBtn')

restartBtn.addEventListener('click', () => {
  if (winLoseTimeout) { clearTimeout(winLoseTimeout); winLoseTimeout = null }
  init()
})

prevBtn.addEventListener('click', () => {
  if (winLoseTimeout) { clearTimeout(winLoseTimeout); winLoseTimeout = null }
  levelIndex--
  if (levelIndex < 0) {
    levelIndex = LevelManager.getTotalLevels() - 1
  }
  init()
})

nextBtn.addEventListener('click', () => {
  if (winLoseTimeout) { clearTimeout(winLoseTimeout); winLoseTimeout = null }
  levelIndex++
  if (levelIndex >= LevelManager.getTotalLevels()) {
    levelIndex = 0
  }
  init()
})

function init() {
  const levelData = LevelManager.getLevel(levelIndex)

  slingshot = new Slingshot(150, groundY - 80, screenWidth, screenHeight)

  birds = levelData.birds.map((pos, i) =>
    new Bird(pos.x || 120, pos.y || groundY - 45, 22, i)
  )

  blocks = levelData.blocks.map(b =>
    new Block(b.x, b.y, b.w, b.h, b.type)
  )

  pigs = levelData.pigs.map(p =>
    new Pig(p.x, p.y, p.radius || 18)
  )

  currentBird = birds[0]
  birds[0].active = true
  launched = false
  gameState = 'aiming'

  sceneManager = new Scenes(screenWidth, screenHeight)
  physics.reset()

  score = 0
  lastScoredPigs = 0
  lastScoredBlocks = 0
  canDrag = false
  if (winLoseTimeout) { clearTimeout(winLoseTimeout); winLoseTimeout = null }
}

function update() {
  if (gameState === 'aiming') {
    const touch = inputManager.getTouch()
    
    if (touch.active && !currentBird.pulling && !canDrag) {
      // 检测是否点击到了小鸟
      const dx = touch.x - currentBird.x
      const dy = touch.y - currentBird.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < currentBird.radius * 3) {
        canDrag = true
      }
    }
    
    if (touch.active && canDrag) {
      const dx = touch.x - slingshot.x
      const dy = touch.y - slingshot.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      const maxPull = 100
      
      let targetX = touch.x
      let targetY = touch.y
      
      // 允许向后拉，但限制小鸟不能拉到弹弓右侧太远
      if (targetX > slingshot.x + 30) {
        targetX = slingshot.x + 30
      }
      
      const finalDx = targetX - slingshot.x
      const finalDy = targetY - slingshot.y
      const finalDist = Math.sqrt(finalDx * finalDx + finalDy * finalDy)
      
      if (finalDist > maxPull) {
        const angle = Math.atan2(finalDy, finalDx)
        targetX = slingshot.x + Math.cos(angle) * maxPull
        targetY = slingshot.y + Math.sin(angle) * maxPull
      }
      
      currentBird.x = targetX
      currentBird.y = targetY
      currentBird.pulling = true
    } else if (!touch.active && canDrag) {
      // 松手：发射小鸟
      launchBird()
      canDrag = false
      currentBird.pulling = false
    }
  }

  if (gameState === 'flying' && launched) {
      // 小鸟飞出屏幕边界，直接进入沉降阶段
      if (currentBird.x > screenWidth + 100 || currentBird.x < -100 ||
          currentBird.y > screenHeight + 100) {
        gameState = 'settling'
      } else {
        physics.update(currentBird, blocks, pigs, groundY)

        CollisionDetection.checkBirdWithGround(currentBird, groundY)
        CollisionDetection.checkBirdWithBlocks(currentBird, blocks)
        CollisionDetection.checkBirdWithPigs(currentBird, pigs)
        CollisionDetection.checkBlocksWithGround(blocks, groundY)
        CollisionDetection.checkPigsWithGround(pigs, groundY)
        CollisionDetection.checkBlocksWithBlocks(blocks)
        CollisionDetection.checkPigsWithBlocks(pigs, blocks)
        CollisionDetection.checkPigsWithPigs(pigs)

        if (physics.isSettled(currentBird, blocks, pigs, groundY)) {
          gameState = 'settling'
        }
      }
    }

  if (gameState === 'settling') {
      physics.settleUpdate(blocks, pigs, groundY)

      CollisionDetection.checkBlocksWithGround(blocks, groundY)
      CollisionDetection.checkPigsWithGround(pigs, groundY)
      CollisionDetection.checkBlocksWithBlocks(blocks)
      CollisionDetection.checkPigsWithBlocks(pigs, blocks)
      CollisionDetection.checkPigsWithPigs(pigs)

      const settled = physics.allSettled(blocks, pigs)
      if (settled) {
        gameState = 'evaluating'
      }
    }

  if (gameState === 'evaluating') {
    // 只计算本轮新增的破坏，防止重复计分
    const currentDestroyedPigs = pigs.filter(p => !p.alive).length
    const currentDestroyedBlocks = blocks.filter(b => b.hp <= 0).length
    const newPigs = currentDestroyedPigs - lastScoredPigs
    const newBlocks = currentDestroyedBlocks - lastScoredBlocks
    score += newPigs * 100 + newBlocks * 10
    lastScoredPigs = currentDestroyedPigs
    lastScoredBlocks = currentDestroyedBlocks

    const allPigsDead = pigs.every(p => !p.alive)
    const noBirdsLeft = birds.every(b => b.used)

    if (allPigsDead) {
      gameState = 'win'
      winLoseTimeout = setTimeout(() => {
        levelIndex++
        if (levelIndex >= LevelManager.getTotalLevels()) {
          levelIndex = 0
        }
        init()
      }, 2000)
    } else if (noBirdsLeft) {
      gameState = 'lose'
      winLoseTimeout = setTimeout(() => {
        init()
      }, 2000)
    } else {
      nextBird()
    }
  }
}

function launchBird() {
  const dx = currentBird.x - slingshot.x
  const dy = currentBird.y - slingshot.y
  const power = Math.sqrt(dx * dx + dy * dy) * 0.15

  physics.launch(currentBird, dx, dy, power)
  currentBird.used = true
  launched = true
  gameState = 'flying'
  currentBird.pulling = false
  lastScoredPigs = pigs.filter(p => !p.alive).length
  lastScoredBlocks = blocks.filter(b => b.hp <= 0).length
}

function nextBird() {
  const next = birds.find(b => !b.used)
  if (next) {
    currentBird = next
    currentBird.active = true
    // 所有待用小鸟都放在弹弓上
    currentBird.x = slingshot.x
    currentBird.y = slingshot.y + 10
    currentBird.vx = 0
    currentBird.vy = 0
    currentBird.pulling = false
    launched = false
    gameState = 'aiming'
  } else {
    gameState = 'lose'
    winLoseTimeout = setTimeout(() => init(), 2000)
  }
}

function render() {
  ctx.clearRect(0, 0, screenWidth, screenHeight)

  sceneManager.drawBackground(ctx)

  slingshot.render(ctx, currentBird, gameState === 'aiming')

  blocks.forEach(b => b.render(ctx))
  pigs.forEach(p => p.render(ctx))
  birds.forEach(b => b.render(ctx))

  ctx.fillStyle = '#5D8A3C'
  ctx.fillRect(0, groundY, screenWidth, screenHeight - groundY)

  ctx.fillStyle = '#7EC850'
  ctx.fillRect(0, groundY, screenWidth, 8)

  UI.render(ctx, screenWidth, screenHeight, score, levelIndex, gameState, birds)
}

function gameLoop() {
  update()
  render()
  requestAnimationFrame(gameLoop)
}

init()
gameLoop()
