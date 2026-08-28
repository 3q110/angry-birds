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
import { soundManager } from './sound.js'
import { Effects } from './effects.js'

const canvas = wx.createCanvas()
const ctx = canvas.getContext('2d')
const systemInfo = wx.getSystemInfoSync()
const screenWidth = systemInfo.screenWidth
const screenHeight = systemInfo.screenHeight

canvas.width = screenWidth
canvas.height = screenHeight

// 满拉距离 80（与 update 中的 maxPull 一致），用于满攻伤害归一化
CollisionDetection.init(screenWidth, 80)

const physics = new Physics(screenWidth, screenHeight)
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
let flightFrames = 0
// 飞行超过该帧数后强制进入沉降，防止软锁（约 8 秒兜底）
const maxFlightFrames = 480
// 小鸟落地静置计数器：发射出去的小鸟用完即"消失"——
// 连续低速 N 帧后立刻快速淡出（约 0.3 秒判定 + 0.12 秒淡出），尽快解锁下一发
let birdRestFrames = 0
const birdRestLimit = 18
let settleFrames = 0
// 沉降超过该帧数后强制进入结算，防止物理振荡导致永久卡在沉降阶段
const maxSettleFrames = 300
// 特效实例：粒子 + 屏幕震动
const effects = new Effects()
// 事件轮询快照：用于检测"本帧新发生的破坏"（方块碎裂/受击、猪死亡/受击）
let lastBlockHp = []
let lastPigAlive = []
let lastPigHp = []
let sparkCooldown = 0

const groundY = screenHeight - 60

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

  // 场景主题跟随关卡：清晨/正午/黄昏/夜晚/风暴
  sceneManager = new Scenes(screenWidth, screenHeight, levelIndex)
  physics.reset()
  effects.clear()

  score = 0
  lastScoredPigs = 0
  lastScoredBlocks = 0
  canDrag = false
  flightFrames = 0
  settleFrames = 0
  birdRestFrames = 0
  lastBlockHp = blocks.map(b => b.hp)
  lastPigAlive = pigs.map(p => p.alive)
  lastPigHp = pigs.map(p => p.hp)
  sparkCooldown = 0
  if (winLoseTimeout) { clearTimeout(winLoseTimeout); winLoseTimeout = null }
}

// 轮询实体状态变化，触发粒子特效与震屏（flying 与 settling 阶段各调用一次）
function pollEffects() {
  const birdSpeed = currentBird ? Math.sqrt(currentBird.vx * currentBird.vx + currentBird.vy * currentBird.vy) : 0
  blocks.forEach((b, i) => {
    const prev = lastBlockHp[i] || 0
    if (b.hp <= 0 && prev > 0) {
      // 方块碎裂：碎片 + 震屏
      effects.spawnDebris(b.x + b.w / 2, b.y + b.h / 2, b.type, 14)
      effects.shake(7)
    } else if (b.hp > 0 && prev - b.hp >= 2) {
      // 方块受击：少量碎片 + 轻震
      effects.spawnDebris(b.x + b.w / 2, b.y + b.h / 2, b.type, 5)
      if (birdSpeed > 3) effects.shake(3)
    }
  })
  pigs.forEach((p, i) => {
    const prevAlive = lastPigAlive[i]
    const prevHp = lastPigHp[i] || 0
    if (p.alive && prevAlive && prevHp - p.hp >= 2) {
      // 猪受击：火花 + 轻震
      effects.spawnSparks(p.x, p.y - p.radius * 0.5, 6)
      if (birdSpeed > 3) effects.shake(4)
    }
    if (!p.alive && prevAlive) {
      // 猪死亡：烟圈 + 震屏
      effects.spawnPoof(p.x, p.y, p.radius)
      effects.shake(8)
    }
  })
  lastBlockHp = blocks.map(b => b.hp)
  lastPigAlive = pigs.map(p => p.alive)
  lastPigHp = pigs.map(p => p.hp)
}

function update() {
  // 特效粒子推进（拖尾由小鸟自己维护）
  effects.update()
  if (sparkCooldown > 0) sparkCooldown--

  if (gameState === 'aiming') {
    const touch = inputManager.getTouch()

    if (touch.active && !currentBird.pulling && !canDrag) {
      // 检测是否点击到了小鸟
      const dx = touch.x - currentBird.x
      const dy = touch.y - currentBird.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < currentBird.radius * 3) {
        canDrag = true
        soundManager.playSlingshot()
      }
    }

    if (touch.active && canDrag) {
      const dx = touch.x - slingshot.x
      const dy = touch.y - slingshot.y
      const maxPull = 80

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

  // 小鸟消失动画：无论当前状态，正在淡出的小鸟持续推进
  if (currentBird && currentBird.disappearing) {
    currentBird.updateFade()
  }

  if (gameState === 'flying' && launched) {
      // 小鸟飞出屏幕边界：淡出并进入沉降阶段
      if (currentBird.x > screenWidth + 100 || currentBird.x < -100 ||
          currentBird.y > screenHeight + 100) {
        currentBird.disappearing = true
        settleFrames = 0
        gameState = 'settling'
      } else {
        flightFrames++
        // 飞行过久兜底：小鸟强制淡出，防止残鸟卡住下一发
        if (flightFrames > maxFlightFrames) {
          currentBird.disappearing = true
          settleFrames = 0
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

          currentBird.updateTrail()
          pollEffects()

          // 小鸟落地静置检测：发射出去的小鸟用完即判为消失——
          // 连续低速（停在地面或方块堆上）约 0.3 秒后快速淡出，尽快解锁下一发
          const bSpeed = Math.sqrt(currentBird.vx * currentBird.vx + currentBird.vy * currentBird.vy)
          if (bSpeed < 1.2) birdRestFrames++
          else birdRestFrames = 0
          if (birdRestFrames > birdRestLimit) {
            currentBird.disappearing = true
            settleFrames = 0
            gameState = 'settling'
          } else if (physics.isSettled(currentBird, blocks, pigs, groundY)) {
            // 小鸟已静止：同样启动淡出（与 main-browser.js 保持一致）
            currentBird.disappearing = true
            settleFrames = 0
            gameState = 'settling'
          }
        }
      }
    }

  if (gameState === 'settling') {
      settleFrames++
      physics.settleUpdate(blocks, pigs, groundY)

      CollisionDetection.checkBlocksWithGround(blocks, groundY)
      CollisionDetection.checkPigsWithGround(pigs, groundY)
      CollisionDetection.checkBlocksWithBlocks(blocks)
      CollisionDetection.checkPigsWithBlocks(pigs, blocks)
      CollisionDetection.checkPigsWithPigs(pigs)

      currentBird.updateTrail()
      pollEffects()

      const settled = physics.allSettled(blocks, pigs)
      // 兜底：沉降超时强制进入结算，杜绝软锁
      if (settled || settleFrames > maxSettleFrames) {
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
      soundManager.playWin()
      gameState = 'win'
      winLoseTimeout = setTimeout(() => {
        levelIndex++
        if (levelIndex >= LevelManager.getTotalLevels()) {
          levelIndex = 0
        }
        init()
      }, 2000)
    } else if (noBirdsLeft) {
      soundManager.playLose()
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
  soundManager.playLaunch()
  const dx = currentBird.x - slingshot.x
  const dy = currentBird.y - slingshot.y
  // 重力增强后相应提高功率系数，保持射程与冲击力
  const power = Math.sqrt(dx * dx + dy * dy) * 0.35

  physics.launch(currentBird, dx, dy, power)
  currentBird.used = true
  launched = true
  gameState = 'flying'
  currentBird.pulling = false
  currentBird.trail = []
  flightFrames = 0
  settleFrames = 0
  birdRestFrames = 0
  currentBird.fadeAlpha = 1
  currentBird.disappearing = false
  currentBird.gone = false
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
    soundManager.playLose()
    gameState = 'lose'
    winLoseTimeout = setTimeout(() => init(), 2000)
  }
}

function render() {
  ctx.clearRect(0, 0, screenWidth, screenHeight)

  // 屏幕震动：整体世界偏移，UI 保持稳定
  const shake = effects.getShakeOffset()
  if (shake.x !== 0 || shake.y !== 0) {
    ctx.save()
    ctx.translate(shake.x, shake.y)
  }

  sceneManager.drawBackground(ctx)

  slingshot.render(ctx, currentBird, gameState === 'aiming')

  blocks.forEach(b => b.render(ctx))
  pigs.forEach(p => p.render(ctx))
  birds.forEach(b => b.render(ctx))

  sceneManager.drawGround(ctx, groundY)

  effects.render(ctx)

  if (shake.x !== 0 || shake.y !== 0) {
    ctx.restore()
  }

  UI.render(ctx, screenWidth, screenHeight, score, levelIndex, gameState, birds)
}

function gameLoop() {
  update()
  render()
  requestAnimationFrame(gameLoop)
}

init()
gameLoop()
