const canvas = wx.createCanvas()
const ctx = canvas.getContext('2d')
const systemInfo = wx.getSystemInfoSync()
const screenWidth = systemInfo.screenWidth
const screenHeight = systemInfo.screenHeight

import { Physics } from './physics'
import { Slingshot } from './slingshot'
import { Bird } from './bird'
import { LevelManager } from './level'
import { Block } from './block'
import { Pig } from './pig'
import { UI } from './ui'
import { InputManager } from './input'
import { Scenes } from './scenes'
import { CollisionDetection } from './collision'

canvas.width = screenWidth
canvas.height = screenHeight

CollisionDetection.init(screenWidth)

const physics = new Physics(screenWidth, screenHeight)
const inputManager = new InputManager(canvas)

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

  sceneManager = new Scenes(screenWidth, screenHeight)
  physics.reset()

  score = 0
}

function update() {
  if (gameState === 'aiming') {
    const touch = inputManager.getTouch()
    if (touch.active) {
      const dx = touch.x - slingshot.x
      const dy = touch.y - slingshot.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      const maxPull = 80

      if (dist < maxPull) {
        currentBird.x = touch.x
        currentBird.y = touch.y
      } else {
        const angle = Math.atan2(dy, dx)
        currentBird.x = slingshot.x + Math.cos(angle) * maxPull
        currentBird.y = slingshot.y + Math.sin(angle) * maxPull
      }
      currentBird.pulling = true
    } else if (currentBird.pulling) {
      launchBird()
    }
  }

  if (gameState === 'flying' && launched) {
    physics.update(currentBird, blocks, pigs, groundY)

    CollisionDetection.checkBirdWithGround(currentBird, groundY)
    CollisionDetection.checkBirdWithBlocks(currentBird, blocks)
    CollisionDetection.checkBirdWithPigs(currentBird, pigs)
    CollisionDetection.checkBlocksWithGround(blocks, groundY)
    CollisionDetection.checkPigsWithGround(pigs, groundY)

    if (physics.isSettled(currentBird, blocks, pigs)) {
      gameState = 'settling'
    }
  }

  if (gameState === 'settling') {
    physics.settleUpdate(blocks, pigs, groundY)

    const settled = physics.allSettled(blocks, pigs)
    if (settled) {
      gameState = 'evaluating'
    }
  }

  if (gameState === 'evaluating') {
    const destroyedPigs = pigs.filter(p => !p.alive).length
    const destroyedBlocks = blocks.filter(b => b.hp <= 0).length
    score += destroyedPigs * 100 + destroyedBlocks * 10

    const allPigsDead = pigs.every(p => !p.alive)
    const noBirdsLeft = birds.every(b => b.used)

    if (allPigsDead) {
      gameState = 'win'
      setTimeout(() => {
        levelIndex++
        if (levelIndex >= LevelManager.getTotalLevels()) {
          levelIndex = 0
        }
        init()
      }, 2000)
    } else if (noBirdsLeft) {
      gameState = 'lose'
      setTimeout(() => {
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
}

function nextBird() {
  const next = birds.find(b => !b.used)
  if (next) {
    currentBird = next
    currentBird.active = true
    currentBird.x = 120
    currentBird.y = groundY - 45
    currentBird.vx = 0
    currentBird.vy = 0
    launched = false
    gameState = 'aiming'
  } else {
    gameState = 'lose'
    setTimeout(() => init(), 2000)
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