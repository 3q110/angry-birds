// 临时验证脚本：node test-physics.mjs（验证完可删除）
import { Physics } from './js/physics.js'
import { CollisionDetection } from './js/collision.js'
import { Pig } from './js/pig.js'
import { Block } from './js/block.js'

const physics = new Physics(900, 600)
const groundY = 600 - 60
// 满攻归一化参照（浏览器版满拉 150）：冲击 ≥ 39.4px/帧 = 一次满攻（10 点伤害）
CollisionDetection.init(900, 150)
let pass = 0, fail = 0
function check(name, cond) {
  if (cond) { pass++; console.log('  PASS', name) }
  else { fail++; console.log('  FAIL', name) }
}

// --- 1. 自由落体：猪从 300px 高空摔下应摔死（40 血）
console.log('场景1: 猪自由落体摔死')
{
  const pig = new Pig(500, groundY - 300 - 18, 18)
  let frames = 0
  while (pig.y + pig.radius < groundY && frames < 300) {
    pig.vy += physics.gravity
    pig.y += pig.vy
    frames++
  }
  const fallFrames = frames
  CollisionDetection.checkPigsWithGround([pig], groundY)
  check(`300px 坠落约 ${fallFrames} 帧落地（重力0.5 应 < 40 帧，旧值0.15 需约 63 帧）`, fallFrames < 40)
  check('300px 坠落摔死小猪', !pig.alive)
}
{
  const pig = new Pig(500, groundY - 60, 18)
  for (let i = 0; i < 20; i++) { pig.vy += physics.gravity; pig.y += pig.vy }
  CollisionDetection.checkPigsWithGround([pig], groundY)
  check('60px 短距离下落只受伤不死', pig.alive && pig.hp < 40)
}

// --- 2. 小鸟抛物线：满弓 45° 向上发射，验证射程与落地时间
console.log('场景2: 小鸟抛物线')
{
  const bird = { x: 150, y: groundY - 90, radius: 22, vx: 0, vy: 0, used: true }
  // 拉弓方向 = 向左下 (dx<0, dy>0)，发射后向右上飞
  physics.launch(bird, -80, 80, 80 * 0.35)
  const v0 = Math.hypot(bird.vx, bird.vy)
  let frames = 0, maxX = bird.x
  while (bird.y < groundY - bird.radius && frames < 600) {
    bird.vy += physics.gravity
    bird.x += bird.vx; bird.y += bird.vy
    maxX = Math.max(maxX, bird.x)
    frames++
  }
  check(`初速 ${v0.toFixed(1)} px/帧（约 ${v0 * 60 / 100} m/s 手感）`, Math.abs(v0 - 28.28) < 0.5)
  check(`45° 满弓飞行约 ${frames} 帧落地（60fps 下约 ${(frames / 60).toFixed(1)}s）`, frames < 300)
  check(`满弓射程约 ${Math.round(maxX - 150)}px（应 > 400px，够到右侧目标）`, maxX - 150 > 400)
}

// --- 3. 满攻模型：一次满攻（45px/帧 平射）→ 玻璃碎、板材/石头各掉 10
console.log('场景3: 满攻归一化伤害')
for (const type of ['glass', 'board', 'stone']) {
  const bird = { x: 0, y: 0, radius: 22, vx: 45, vy: 0, used: true }
  const block = new Block(bird.x + 10, bird.y - 20, 40, 40, type)
  CollisionDetection.checkBirdWithBlocks(bird, [block])
  console.log(`  ${type}: 原血 ${block.maxHp} → 满攻后 ${block.hp.toFixed(1)}（${block.hp <= 0 ? '碎裂' : '存活'}）`)
}
{
  const glass = new Block(10, -20, 40, 40, 'glass')
  CollisionDetection.checkBirdWithBlocks(
    { x: 0, y: 0, radius: 22, vx: 45, vy: 0, used: true }, [glass])
  check('一次满攻击碎玻璃（hp=10）', glass.hp <= 0)

  const board = new Block(10, -20, 40, 40, 'board')
  CollisionDetection.checkBirdWithBlocks(
    { x: 0, y: 0, radius: 22, vx: 45, vy: 0, used: true }, [board])
  check('板材满攻掉 10/15，一次打不碎', board.hp > 0 && Math.abs(board.hp - 5) < 0.01)
  CollisionDetection.checkBirdWithBlocks(
    { x: 0, y: 0, radius: 22, vx: 45, vy: 0, used: true }, [board])
  check('板材第二次满攻击碎（共 1.5 次满攻容量）', board.hp <= 0)

  const stone = new Block(10, -20, 40, 40, 'stone')
  CollisionDetection.checkBirdWithBlocks(
    { x: 0, y: 0, radius: 22, vx: 45, vy: 0, used: true }, [stone])
  check('石头满攻掉 10/20，一次打不碎', stone.hp > 0 && Math.abs(stone.hp - 10) < 0.01)
  CollisionDetection.checkBirdWithBlocks(
    { x: 0, y: 0, radius: 22, vx: 45, vy: 0, used: true }, [stone])
  check('石头第二次满攻击碎（共 2 次满攻容量）', stone.hp <= 0)

  const weakBird = { x: 0, y: 0, radius: 22, vx: 15, vy: 0, used: true }
  const glass2 = new Block(10, -20, 40, 40, 'glass')
  CollisionDetection.checkBirdWithBlocks(weakBird, [glass2])
  check('弱击（15px/帧）只按成比例伤害（约 3.8/10）', glass2.hp > 0 && glass2.hp < 10)

  // 砸落加成：垂直俯冲（vy=15）砸中石头顶面 → 自由落体加成让一次俯冲碎石头
  const dive = { x: 0, y: 0, radius: 22, vx: 0, vy: 15, used: true }
  const stone2 = new Block(-20, 10, 40, 40, 'stone')
  CollisionDetection.checkBirdWithBlocks(dive, [stone2])
  check('俯冲砸落（冲击15+加成22.5）可一次砸碎石头', stone2.hp <= 0)
  const diveFlat = { x: 0, y: 0, radius: 22, vx: 45, vy: 0, used: true }
  const stone3 = new Block(10, -20, 40, 40, 'stone')
  CollisionDetection.checkBirdWithBlocks(diveFlat, [stone3])
  check('平射满攻无俯冲成分，石头只掉一次满攻的伤害（10/20）', stone3.hp > 0 && Math.abs(stone3.hp - 10) < 0.01)

  // 贴靠（静置）接触不产生伤害：小鸟以极低速度压在玻璃上
  const resting = { x: 0, y: 0, radius: 22, vx: 0, vy: 0.5, used: true }
  const glass3 = new Block(10, -20, 40, 40, 'glass')
  for (let i = 0; i < 60; i++) CollisionDetection.checkBirdWithBlocks(resting, [glass3])
  check('静置贴靠 60 帧不磨碎玻璃', glass3.hp > 0)
}

// --- 4. 小鸟撞击小猪：一击致命 + 猪被撞飞
console.log('场景4: 撞击小猪')
{
  const bird = { x: 0, y: 0, radius: 22, vx: 12, vy: 0, used: true }
  const pig = new Pig(30, 0, 18)
  CollisionDetection.checkBirdWithPigs(bird, [pig])
  check('12px/帧 命中直接击杀（伤害72 > 40）', !pig.alive)
  check('猪沿小鸟运动方向被撞飞（vx > 5）', pig.vx > 5)
  check('正撞后小鸟法向速度大幅衰减（回弹/停住，vx < 6）', bird.vx < 6)
}

// --- 5. 落地冲击：反弹前速度结算，玻璃摔地碎、石头耐摔
console.log('场景5: 方块落地冲击')
{
  const glass = new Block(100, groundY - 30, 30, 30, 'glass')
  glass.vy = 14
  CollisionDetection.checkBlocksWithGround([glass], groundY)
  check('玻璃 14px/帧 落地直接摔碎（14x1.0 > 10）', glass.hp <= 0)
  const board = new Block(100, groundY - 30, 30, 30, 'board')
  board.vy = 14
  CollisionDetection.checkBlocksWithGround([board], groundY)
  check('板材同速落地只掉部分血（14x0.7=9.8 < 15）', board.hp > 0 && board.hp < board.maxHp)
  const stone = new Block(100, groundY - 30, 30, 30, 'stone')
  stone.vy = 14
  CollisionDetection.checkBlocksWithGround([stone], groundY)
  check('石头同速落地只掉少量血（14x0.35=4.9）', stone.hp > 0 && stone.hp < stone.maxHp)
}

// --- 6. 猪失去支撑自由落地判死
console.log('场景6: 失去支撑的猪落地判死')
{
  // 猪从方块上被震落：onBlock=true，从 60px 自由落到地面 → 判死
  const pig = new Pig(500, groundY - 60, 18)
  pig.onBlock = true
  for (let i = 0; i < 20; i++) { pig.vy += physics.gravity; pig.y += pig.vy }
  CollisionDetection.checkPigsWithGround([pig], groundY)
  check('方块支撑的猪短距自由落地即判死', !pig.alive)

  // 原本在地面的猪：60px 下落只受伤不死（走摔落伤害路径）
  const pig2 = new Pig(500, groundY - 60, 18)
  for (let i = 0; i < 20; i++) { pig2.vy += physics.gravity; pig2.y += pig2.vy }
  CollisionDetection.checkPigsWithGround([pig2], groundY)
  check('非支撑猪短距下落只受伤不死', pig2.alive && pig2.hp < 40)
}

// --- 7. 真实循环回归：用 physics.update 积分（场景1-6 是手写纯重力积分，
// 曾因此漏掉 update 里 0.7 空气衰减导致落地冲击永远 <2 的线上 bug）
console.log('场景7: physics.update 真实积分坠落')
{
  const pig = new Pig(500, groundY - 300 - 18, 18)
  let frames = 0
  while (pig.y + pig.radius < groundY && frames < 400) {
    physics.update(null, [], [pig], groundY)
    frames++
  }
  CollisionDetection.checkPigsWithGround([pig], groundY)
  check(`300px 真实积分约 ${frames} 帧落地（<60 帧；若空中带 0.7 衰减会拖到 250+ 帧）`, frames < 60)
  check('真实循环下 300px 坠落的猪落地判死', !pig.alive)

  const pig2 = new Pig(500, groundY - 60, 18)
  pig2.onBlock = true
  let frames2 = 0
  while (pig2.y + pig2.radius < groundY && frames2 < 400) {
    physics.update(null, [], [pig2], groundY)
    frames2++
  }
  CollisionDetection.checkPigsWithGround([pig2], groundY)
  check('真实循环下失去支撑的猪短距落地也判死', !pig2.alive)
}

console.log(`\n结果: ${pass} 通过 / ${fail} 失败`)
process.exit(fail > 0 ? 1 : 0)
