/* 本文件由 build-browser-bundle.js 自动生成，请勿手动编辑。 修改 js/ 下模块后请运行: node build-browser-bundle.js */
(function () {
"use strict";

// ===== physics.js =====
class Physics {
  constructor(screenWidth, screenHeight) {
    // 加强重力：0.15 时抛物线明显"飘"，不符合自由落体手感；
    // 0.5 px/帧² 让下落更快、撞击更有力
    this.gravity = 0.5
    this.settleThreshold = 0.2
  }

  reset() {}

  launch(bird, dx, dy, power) {
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist === 0) return
    const nx = dx / dist
    const ny = dy / dist
    bird.vx = -nx * power
    bird.vy = -ny * power
  }

  update(bird, blocks, pigs, groundY) {
    if (bird && bird.used) {
      // 自由落体规则：空中只受恒定重力加速，不加空气阻力，
      // 能量只在与地面/方块/猪的真实碰撞中消耗
      bird.vy += this.gravity
      bird.x += bird.vx
      bird.y += bird.vy
    }

    blocks.forEach(b => {
      if (b.hp <= 0) return
      // 自由落体：空中不加每帧速度衰减。
      // 旧代码每帧 *0.7 使终端速度只有 ~1.17px/帧，方块像羽毛一样飘落，
      // 落地冲击永远达不到 checkBlocksWithGround 的 fallSpeed>2 阈值，摔落伤害从不生效
      b.vy += this.gravity
      b.x += b.vx
      b.y += b.vy
    })

    pigs.forEach(p => {
      if (!p.alive) return
      // 同上：猪必须按真实自由落体速度下坠，
      // checkPigsWithGround 的"失去支撑落地判死/高空摔死"才能拿到足够的 fallSpeed
      p.vy += this.gravity
      p.x += p.vx
      p.y += p.vy
    })
  }

  isSettled(bird, blocks, pigs, groundY) {
    // 小鸟必须已经落地（速度很低且接近地面）才能进入沉降阶段
    // 防止小鸟在抛物线顶点（速度接近0）时被误判为已沉降
    if (bird && bird.used) {
      const speed = Math.sqrt(bird.vx * bird.vx + bird.vy * bird.vy)
      // 小鸟速度仍然较大，或仍在空中较高位置（离地面超过80像素）
      if (speed > this.settleThreshold * 3) return false
      const heightAboveGround = groundY - bird.y
      if (heightAboveGround > 80) return false
    }
    for (let b of blocks) {
      if (b.hp > 0 && (Math.abs(b.vx) > this.settleThreshold ||
          Math.abs(b.vy) > this.settleThreshold)) return false
    }
    for (let p of pigs) {
      if (p.alive && (Math.abs(p.vx) > this.settleThreshold ||
          Math.abs(p.vy) > this.settleThreshold)) return false
    }
    return true
  }

  settleUpdate(blocks, pigs, groundY) {
    // 沉降阶段：空中物体保持自然下落速度（不再每帧 50% 衰减，
    // 否则终端速度只有 0.15px/帧，高空物体永远落不下来），
    // 靠地面碰撞 + 碰撞模块的贴靠衰减快速静止
    blocks.forEach(b => {
      if (b.hp <= 0) return
      b.vy += this.gravity
      b.x += b.vx
      b.y += b.vy
      // 地面碰撞：防止方块在沉降阶段穿地
      if (b.y + b.h >= groundY) {
        b.y = groundY - b.h
        b.vy *= -0.2
        if (Math.abs(b.vy) < 0.5) b.vy = 0
        b.vx *= 0.4
      }
      b.vx *= 0.98
    })
    pigs.forEach(p => {
      if (!p.alive) return
      p.vy += this.gravity
      p.x += p.vx
      p.y += p.vy
      // 地面碰撞：防止小猪在沉降阶段穿地
      if (p.y + p.radius >= groundY) {
        p.y = groundY - p.radius
        p.vy *= -0.2
        if (Math.abs(p.vy) < 0.5) p.vy = 0
        p.vx *= 0.4
      }
      p.vx *= 0.98
    })
  }

  allSettled(blocks, pigs) {
    // 注意用 <= 而非 <：微振荡衰减后速度可能恰好停在阈值上
    const stopped = (obj) => Math.abs(obj.vx) <= 0.05 && Math.abs(obj.vy) <= 0.05
    return blocks.every(b => b.hp <= 0 || stopped(b)) &&
           pigs.every(p => !p.alive || stopped(p))
  }
}


// ===== slingshot.js =====
class Slingshot {
  constructor(x, y, screenWidth, screenHeight) {
    this.x = x
    this.y = y
    this.forkLeft = { x: x - 18, y: y - 50 }
    this.forkRight = { x: x + 18, y: y - 50 }
    this.baseY = y
  }
  
  drawRoundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + width - radius, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    ctx.lineTo(x + width, y + height - radius)
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    ctx.lineTo(x + radius, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
  }

  render(ctx, bird, isAiming) {
    ctx.save()

    ctx.fillStyle = '#654321'
    ctx.beginPath()
    ctx.moveTo(this.x - 12, this.baseY + 60)
    ctx.lineTo(this.x + 12, this.baseY + 60)
    ctx.lineTo(this.x + 8, this.baseY - 10)
    ctx.lineTo(this.x - 8, this.baseY - 10)
    ctx.closePath()
    ctx.fill()
    
    ctx.strokeStyle = '#4A3019'
    ctx.lineWidth = 2
    ctx.stroke()

    this.drawWoodenArm(ctx, this.x, this.baseY - 10, this.forkLeft.x, this.forkLeft.y)
    this.drawWoodenArm(ctx, this.x, this.baseY - 10, this.forkRight.x, this.forkRight.y)

    ctx.fillStyle = '#5D4037'
    ctx.beginPath()
    ctx.arc(this.forkLeft.x, this.forkLeft.y, 8, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(this.forkRight.x, this.forkRight.y, 8, 0, Math.PI * 2)
    ctx.fill()

    if (bird && isAiming) {
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      
      ctx.strokeStyle = '#2C1810'
      ctx.lineWidth = 10
      ctx.beginPath()
      ctx.moveTo(this.forkLeft.x, this.forkLeft.y)
      ctx.lineTo(bird.x, bird.y)
      ctx.lineTo(this.forkRight.x, this.forkRight.y)
      ctx.stroke()
      
      ctx.strokeStyle = '#8B4513'
      ctx.lineWidth = 6
      ctx.beginPath()
      ctx.moveTo(this.forkLeft.x, this.forkLeft.y)
      ctx.lineTo(bird.x, bird.y)
      ctx.lineTo(this.forkRight.x, this.forkRight.y)
      ctx.stroke()
      
      ctx.strokeStyle = '#A0522D'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(this.forkLeft.x, this.forkLeft.y)
      ctx.lineTo(bird.x, bird.y)
      ctx.lineTo(this.forkRight.x, this.forkRight.y)
      ctx.stroke()
      
      if (bird.pulling) {
        this.drawTrajectory(ctx, bird)
      }
    } else if (bird && !bird.active) {
      ctx.strokeStyle = '#8B4513'
      ctx.lineWidth = 4
      ctx.lineCap = 'round'

      ctx.beginPath()
      ctx.moveTo(this.forkLeft.x, this.forkLeft.y)
      ctx.lineTo(this.forkLeft.x + 8, this.forkLeft.y + 8)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(this.forkRight.x, this.forkRight.y)
      ctx.lineTo(this.forkRight.x - 8, this.forkRight.y + 8)
      ctx.stroke()
    }

    ctx.restore()
  }
  
  drawWoodenArm(ctx, x1, y1, x2, y2) {
    const angle = Math.atan2(y2 - y1, x2 - x1)
    const width = 10
    
    ctx.save()
    ctx.translate((x1 + x2) / 2, (y1 + y2) / 2)
    ctx.rotate(angle)
    
    const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
    
    const gradient = ctx.createLinearGradient(-length/2, -width/2, -length/2, width/2)
    gradient.addColorStop(0, '#8B5A2B')
    gradient.addColorStop(0.3, '#A0522D')
    gradient.addColorStop(0.7, '#8B4513')
    gradient.addColorStop(1, '#654321')
    
    ctx.fillStyle = gradient
    this.drawRoundRect(ctx, -length/2, -width/2, length, width, 3)
    ctx.fill()
    
    ctx.strokeStyle = '#5D3A1A'
    ctx.lineWidth = 1
    ctx.stroke()
    
    ctx.strokeStyle = 'rgba(0,0,0,0.1)'
    ctx.lineWidth = 1
    for (let i = 0; i < 3; i++) {
      ctx.beginPath()
      ctx.moveTo(-length/2 + 10 + i * (length/3), -width/2 + 2)
      ctx.lineTo(-length/2 + 10 + i * (length/3), width/2 - 2)
      ctx.stroke()
    }
    
    ctx.restore()
  }
  
  drawTrajectory(ctx, bird) {
    const dx = bird.x - this.x
    const dy = bird.y - this.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist === 0) return
    
    // 使用与实际发射完全相同的物理参数和计算方式：
    // 功率系数 0.35（与 main-browser 的 launchBird 一致）、
    // 重力 0.5（与 physics.gravity 一致）、空中无空气阻力（与 physics.update 一致）。
    // 旧值 0.25/0.15/0.998 会让预测弹道又远又平，照虚线瞄准必然砸不中
    const power = dist * 0.35
    const nx = dx / dist
    const ny = dy / dist
    let vx = -nx * power
    let vy = -ny * power

    // 轨迹起点：从小鸟当前位置开始预测
    let px = bird.x
    let py = bird.y

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.lineWidth = 3
    ctx.setLineDash([8, 4])
    ctx.beginPath()
    ctx.moveTo(px, py)

    // 与实际物理同步的预测参数（修改 physics.js 或 launchBird 时必须同步这里）
    const gravity = 0.5
    const groundY = 540

    // 模拟飞行轨迹（与 physics.update 的自由落体积分一致）
    for (let i = 0; i < 300; i++) {
      // 应用重力
      vy += gravity
      // 更新位置
      px += vx
      py += vy

      // 地面碰撞检测
      if (py + bird.radius > groundY) break
      
      // 飞出屏幕右侧停止预测
      if (px > 950) break

      // 每隔几帧画一个点
      if (i % 2 === 0) {
        ctx.lineTo(px, py)
      }
    }
    ctx.stroke()
    ctx.setLineDash([])
    
    // 绘制终点指示器（小圆圈）
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.beginPath()
    ctx.arc(px, py, 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255, 200, 100, 0.8)'
    ctx.lineWidth = 2
    ctx.stroke()
  }
}


// ===== bird.js =====
class Bird {
  constructor(x, y, radius, index) {
    this.x = x
    this.y = y
    this.radius = radius
    this.vx = 0
    this.vy = 0
    this.index = index
    this.active = false
    this.used = false
    this.pulling = false
    this.colors = ['#E74C3C', '#3498DB', '#F1C40F', '#2ECC71', '#E67E22']
    this.color = this.colors[index % this.colors.length]
    // 预计算明暗色，避免每帧重复解析
    this.lightColor = this.lightenColor(this.color, 30)
    this.darkColor = this.darkenColor(this.color, 20)
    this.strokeColor = this.darkenColor(this.color, 30)
    this.rotation = 0
    // 飞行拖尾：记录最近位置，渲染时画成渐隐圆点
    this.trail = []
    // 消失动画：落地静置或飞行超时后渐隐，避免残鸟挡在场景里
    this.fadeAlpha = 1
    this.disappearing = false
    this.gone = false
  }

  // 更新拖尾（由主循环每帧调用）：高速飞行时记录位置，停下后逐渐消散
  updateTrail() {
    if (!this.used) return
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy)
    if (speed > 3) {
      this.trail.push({ x: this.x, y: this.y })
      while (this.trail.length > 14) this.trail.shift()
    } else if (this.trail.length > 0) {
      this.trail.shift()
    }
  }

  // 消失动画：发射出去的小鸟用完即消失——落地静置或飞行超时后快速渐隐
  // （0.18/帧，约 0.12 秒），到 0 后标记 gone 不再渲染/参与碰撞
  updateFade() {
    if (!this.disappearing || this.gone) return
    this.fadeAlpha -= 0.18
    if (this.fadeAlpha <= 0) {
      this.fadeAlpha = 0
      this.gone = true
    }
  }

  renderTrail(ctx) {
    if (this.trail.length === 0) return
    ctx.save()
    for (let i = 0; i < this.trail.length; i++) {
      const t = this.trail[i]
      const k = (i + 1) / this.trail.length
      ctx.globalAlpha = k * 0.3
      ctx.fillStyle = this.lightColor
      ctx.beginPath()
      ctx.arc(t.x, t.y, 2 + k * 7, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
    ctx.restore()
  }

  render(ctx) {
    if (!this.active && !this.used) return
    // 淡出完成的小鸟彻底不渲染（残鸟清理）
    if (this.gone) return
    // 已使用且飞出屏幕边界的小鸟不渲染
    if (this.used && (this.y > 700 || this.x < -100 || this.x > 1000)) return

    this.renderTrail(ctx)

    ctx.save()
    ctx.globalAlpha = this.fadeAlpha
    ctx.translate(this.x, this.y)
    
    // 飞行时喙朝向运动方向（侧身朝右的画法，无需再翻转 180°）
    if (!this.pulling && this.active && this.used) {
      this.rotation = Math.atan2(this.vy, this.vx)
      ctx.rotate(this.rotation)
    }

    // 侧身朝右的画法：所有坐标以半径 r 为单位，喙朝 +x 方向
    const r = this.radius

    // 尾部羽毛：3 片花瓣形（上左/正左/下左扇形展开），身体后面先画
    for (const a of [Math.PI * 1.17, Math.PI, Math.PI * 0.83]) {
      const bx = Math.cos(a) * 0.5 * r
      const by = Math.sin(a) * 0.5 * r
      const tx = Math.cos(a) * 1.38 * r
      const ty = Math.sin(a) * 1.38 * r
      // 叶片两侧控制点（垂直于羽轴向外扩）
      const mx1 = Math.cos(a) * 0.95 * r - Math.sin(a) * 0.18 * r
      const my1 = Math.sin(a) * 0.95 * r + Math.cos(a) * 0.18 * r
      const mx2 = Math.cos(a) * 0.95 * r + Math.sin(a) * 0.22 * r
      const my2 = Math.sin(a) * 0.95 * r - Math.cos(a) * 0.18 * r
      ctx.beginPath()
      ctx.moveTo(bx, by)
      ctx.quadraticCurveTo(mx1, my1, tx, ty)
      ctx.quadraticCurveTo(mx2, my2, bx, by)
      ctx.closePath()
      ctx.fillStyle = this.darkColor
      ctx.fill()
      ctx.strokeStyle = this.strokeColor
      ctx.lineWidth = 1.5
      ctx.stroke()
    }

    // 头顶冠羽（3 根小羽，向后的怒发型）
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(-0.05 * r, -0.82 * r)
    ctx.quadraticCurveTo(-0.35 * r, -1.25 * r, -0.72 * r, -1.18 * r)
    ctx.moveTo(0.08 * r, -0.85 * r)
    ctx.quadraticCurveTo(0.05 * r, -1.32 * r, -0.22 * r, -1.42 * r)
    ctx.moveTo(0.18 * r, -0.8 * r)
    ctx.quadraticCurveTo(0.3 * r, -1.2 * r, 0.12 * r, -1.45 * r)
    ctx.stroke()

    // 身体：略扁的圆 + 左上高光径向渐变
    const gradient = ctx.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.15, 0, 0, r * 1.15)
    gradient.addColorStop(0, this.lightColor)
    gradient.addColorStop(0.62, this.color)
    gradient.addColorStop(1, this.darkColor)
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.ellipse(0, 0, r, r * 0.95, 0, 0, Math.PI * 2)
    ctx.fill()

    // 奶油色肚皮（前下方）
    ctx.fillStyle = '#FFF1DC'
    ctx.beginPath()
    ctx.ellipse(0.22 * r, 0.5 * r, 0.62 * r, 0.48 * r, 0, 0, Math.PI * 2)
    ctx.fill()

    // 身体描边（盖住肚皮边缘，保持轮廓干净）
    ctx.strokeStyle = this.strokeColor
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.ellipse(0, 0, r, r * 0.95, 0, 0, Math.PI * 2)
    ctx.stroke()

    // 翅膀（身体中部偏后，拉弓时微微下压）
    ctx.save()
    ctx.translate(-0.15 * r, 0.12 * r)
    ctx.rotate(this.pulling ? -0.45 : -0.3)
    ctx.fillStyle = this.darkColor
    ctx.beginPath()
    ctx.ellipse(0, 0, 0.55 * r, 0.34 * r, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = this.strokeColor
    ctx.lineWidth = 1.5
    ctx.stroke()
    ctx.restore()

    // 双眼（3/4 侧视：前眼大、后眼小）
    ctx.fillStyle = 'white'
    ctx.beginPath()
    ctx.arc(-0.18 * r, -0.34 * r, 0.26 * r, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(0.38 * r, -0.36 * r, 0.31 * r, 0, Math.PI * 2)
    ctx.fill()

    // 瞳孔与高光（视线朝前）
    ctx.fillStyle = '#1B1B1B'
    ctx.beginPath()
    ctx.arc(-0.12 * r, -0.3 * r, 0.11 * r, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(0.46 * r, -0.33 * r, 0.13 * r, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'white'
    ctx.beginPath()
    ctx.arc(-0.16 * r, -0.36 * r, 0.045 * r, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(0.41 * r, -0.39 * r, 0.05 * r, 0, Math.PI * 2)
    ctx.fill()

    // 怒眉：两道粗黑眉向鼻梁下压，经典愤怒表情
    ctx.strokeStyle = '#2C1810'
    ctx.lineWidth = 0.16 * r
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(0.5 * r, -0.68 * r)
    ctx.lineTo(0.12 * r, -0.5 * r)
    ctx.moveTo(-0.34 * r, -0.62 * r)
    ctx.lineTo(0.02 * r, -0.52 * r)
    ctx.stroke()

    // 喙：上喙 + 下喙两段，尖端朝前
    ctx.fillStyle = '#FFA726'
    ctx.beginPath()
    ctx.moveTo(0.62 * r, -0.18 * r)
    ctx.quadraticCurveTo(1.32 * r, -0.1 * r, 1.28 * r, 0.08 * r)
    ctx.quadraticCurveTo(1.0 * r, 0.2 * r, 0.62 * r, 0.14 * r)
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = '#D35400'
    ctx.lineWidth = 1.5
    ctx.stroke()
    ctx.fillStyle = '#F57C00'
    ctx.beginPath()
    ctx.moveTo(0.62 * r, 0.14 * r)
    ctx.quadraticCurveTo(1.15 * r, 0.2 * r, 1.1 * r, 0.34 * r)
    ctx.quadraticCurveTo(0.9 * r, 0.44 * r, 0.62 * r, 0.34 * r)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    // 拉弓时脸颊泛红（单侧腮红，朝前）
    if (this.pulling) {
      ctx.fillStyle = 'rgba(255, 107, 107, 0.5)'
      ctx.beginPath()
      ctx.ellipse(0.55 * r, 0.22 * r, 0.2 * r, 0.13 * r, 0, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.restore()
  }
  
  lightenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16)
    const amt = Math.round(2.55 * percent)
    const R = (num >> 16) + amt
    const G = (num >> 8 & 0x00FF) + amt
    const B = (num & 0x0000FF) + amt
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1)
  }
  
  darkenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16)
    const amt = Math.round(2.55 * percent)
    const R = (num >> 16) - amt
    const G = (num >> 8 & 0x00FF) - amt
    const B = (num & 0x0000FF) - amt
    return '#' + (0x1000000 + (R > 0 ? R : 0) * 0x10000 +
      (G > 0 ? G : 0) * 0x100 +
      (B > 0 ? B : 0)).toString(16).slice(1)
  }
}


// ===== level.js =====
class LevelManager {
  static getTotalLevels() {
    return 5
  }

  static getLevel(index) {
    const levels = [
      this.level1(),
      this.level2(),
      this.level3(),
      this.level4(),
      this.level5(),
    ]
    return levels[index % levels.length]
  }

  static level1() {
    return {
      birds: [
        { x: 120, y: 435 },
        { x: 80, y: 440 },
        { x: 40, y: 440 },
      ],
      blocks: [
        { x: 520, y: 420, w: 80, h: 20, type: 'board' },
        { x: 520, y: 370, w: 80, h: 20, type: 'board' },
        { x: 540, y: 320, w: 20, h: 50, type: 'board' },
        { x: 580, y: 320, w: 20, h: 50, type: 'board' },
      ],
      pigs: [
        { x: 560, y: 340, radius: 16 },
      ],
    }
  }

  static level2() {
    return {
      birds: [
        { x: 120, y: 435 },
        { x: 80, y: 440 },
        { x: 40, y: 440 },
        { x: 0, y: 440 },
      ],
      blocks: [
        { x: 480, y: 420, w: 20, h: 80, type: 'glass' },
        { x: 500, y: 370, w: 100, h: 20, type: 'glass' },
        { x: 500, y: 320, w: 20, h: 50, type: 'board' },
        { x: 580, y: 320, w: 20, h: 50, type: 'board' },
        { x: 580, y: 420, w: 20, h: 80, type: 'glass' },
      ],
      pigs: [
        { x: 520, y: 340, radius: 15 },
        { x: 570, y: 395, radius: 14 },
      ],
    }
  }

  static level3() {
    return {
      birds: [
        { x: 120, y: 435 },
        { x: 80, y: 440 },
        { x: 40, y: 440 },
        { x: 0, y: 440 },
      ],
      blocks: [
        { x: 460, y: 420, w: 20, h: 80, type: 'stone' },
        { x: 460, y: 350, w: 100, h: 20, type: 'board' },
        { x: 540, y: 350, w: 20, h: 70, type: 'board' },
        { x: 480, y: 290, w: 80, h: 20, type: 'glass' },
        { x: 580, y: 420, w: 20, h: 80, type: 'stone' },
        { x: 620, y: 370, w: 60, h: 20, type: 'board' },
      ],
      pigs: [
        { x: 500, y: 310, radius: 15 },
        { x: 560, y: 395, radius: 14 },
        { x: 640, y: 345, radius: 14 },
      ],
    }
  }

  static level4() {
    return {
      birds: [
        { x: 120, y: 435 },
        { x: 80, y: 440 },
        { x: 40, y: 440 },
        { x: 0, y: 440 },
        { x: -40, y: 440 },
      ],
      blocks: [
        { x: 440, y: 420, w: 20, h: 80, type: 'stone' },
        { x: 460, y: 370, w: 80, h: 20, type: 'stone' },
        { x: 520, y: 370, w: 20, h: 70, type: 'glass' },
        { x: 460, y: 310, w: 80, h: 20, type: 'board' },
        { x: 600, y: 420, w: 20, h: 80, type: 'board' },
        { x: 620, y: 370, w: 80, h: 20, type: 'board' },
        { x: 680, y: 370, w: 20, h: 70, type: 'board' },
        { x: 620, y: 310, w: 80, h: 20, type: 'glass' },
        { x: 660, y: 260, w: 20, h: 50, type: 'glass' },
      ],
      pigs: [
        { x: 480, y: 330, radius: 14 },
        { x: 540, y: 345, radius: 14 },
        { x: 640, y: 330, radius: 14 },
        { x: 670, y: 275, radius: 13 },
      ],
    }
  }

  static level5() {
    return {
      birds: [
        { x: 120, y: 435 },
        { x: 80, y: 440 },
        { x: 40, y: 440 },
        { x: 0, y: 440 },
        { x: -40, y: 440 },
      ],
      blocks: [
        { x: 430, y: 420, w: 20, h: 80, type: 'stone' },
        { x: 450, y: 370, w: 80, h: 20, type: 'stone' },
        { x: 510, y: 370, w: 20, h: 70, type: 'stone' },
        { x: 450, y: 310, w: 80, h: 20, type: 'board' },
        { x: 490, y: 260, w: 20, h: 50, type: 'glass' },
        { x: 590, y: 420, w: 20, h: 80, type: 'stone' },
        { x: 610, y: 370, w: 80, h: 20, type: 'stone' },
        { x: 670, y: 370, w: 20, h: 70, type: 'glass' },
        { x: 610, y: 310, w: 80, h: 20, type: 'board' },
        { x: 650, y: 260, w: 20, h: 50, type: 'glass' },
        { x: 550, y: 230, w: 100, h: 20, type: 'board' },
      ],
      pigs: [
        { x: 470, y: 330, radius: 14 },
        { x: 530, y: 345, radius: 14 },
        { x: 510, y: 270, radius: 12 },
        { x: 630, y: 330, radius: 14 },
        { x: 690, y: 345, radius: 14 },
      ],
    }
  }
}


// ===== block.js =====
class Block {
  constructor(x, y, w, h, type) {
    this.x = x
    this.y = y
    this.w = w
    this.h = h
    this.type = type
    this.vx = 0
    this.vy = 0
    this.hp = this.getMaxHp()
    this.maxHp = this.getMaxHp()
    this.onGround = false
    // 预生成石头的高光斑点位置，避免每帧随机导致闪烁
    this.stoneSpots = []
    if (type === 'stone') {
      for (let i = 0; i < 5; i++) {
        this.stoneSpots.push({
          rx: 5 + Math.random() * (w - 15),
          ry: 5 + Math.random() * (h - 15),
          rw: 4 + Math.random() * 8,
          rh: 4 + Math.random() * 8
        })
      }
    }
  }

  // 血量 = "满攻次数" × 单次满攻伤害（collision.js 中 FULL_HIT_DAMAGE = 10）：
  // 玻璃 1 次满攻击碎、板材 1.5 次满攻击碎、石头 2 次满攻击碎
  getMaxHp() {
    switch (this.type) {
      case 'glass': return 10
      case 'board': return 15
      case 'stone': return 20
      default: return 15
    }
  }
  
  drawRoundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + width - radius, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    ctx.lineTo(x + width, y + height - radius)
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    ctx.lineTo(x + radius, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
  }

  render(ctx) {
    if (this.hp <= 0) return

    ctx.save()
    
    const ratio = this.hp / this.maxHp
    
    if (this.type === 'board') {
      this.renderBoard(ctx, ratio)
    } else if (this.type === 'glass') {
      this.renderGlass(ctx, ratio)
    } else if (this.type === 'stone') {
      this.renderStone(ctx, ratio)
    }
    
    if (this.hp < this.maxHp * 0.7) {
      this.drawCracks(ctx)
    }

    ctx.restore()
  }
  
  renderBoard(ctx, ratio) {
    const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.h)
    if (ratio > 0.6) {
      gradient.addColorStop(0, '#C89058')
      gradient.addColorStop(0.5, '#A67438')
      gradient.addColorStop(1, '#82552A')
    } else if (ratio > 0.3) {
      gradient.addColorStop(0, '#A67438')
      gradient.addColorStop(0.5, '#8A5A2C')
      gradient.addColorStop(1, '#6E4520')
    } else {
      gradient.addColorStop(0, '#8A5A2C')
      gradient.addColorStop(0.5, '#6E4520')
      gradient.addColorStop(1, '#5C3A1A')
    }
    
    ctx.fillStyle = gradient
    this.drawRoundRect(ctx, this.x, this.y, this.w, this.h, 3)
    ctx.fill()
    
    ctx.strokeStyle = '#5C3A1A'
    ctx.lineWidth = 3
    this.drawRoundRect(ctx, this.x, this.y, this.w, this.h, 3)
    ctx.stroke()
    
    ctx.strokeStyle = 'rgba(74, 40, 16, 0.3)'
    ctx.lineWidth = 2
    for (let i = 0; i < 4; i++) {
      ctx.beginPath()
      const yOffset = this.y + this.h * (i + 0.5) / 4
      ctx.moveTo(this.x + 5, yOffset)
      for (let j = 0; j < this.w - 10; j += 10) {
        ctx.quadraticCurveTo(
          this.x + 5 + j + 5, yOffset + (Math.sin(j * 0.1) * 2),
          this.x + 5 + j + 10, yOffset
        )
      }
      ctx.stroke()
    }
  }
  
  renderGlass(ctx, ratio) {
    const gradient = ctx.createLinearGradient(this.x, this.y, this.x + this.w, this.y + this.h)
    if (ratio > 0.6) {
      gradient.addColorStop(0, 'rgba(173, 216, 230, 0.9)')
      gradient.addColorStop(0.5, 'rgba(135, 206, 235, 0.9)')
      gradient.addColorStop(1, 'rgba(100, 149, 237, 0.9)')
    } else if (ratio > 0.3) {
      gradient.addColorStop(0, 'rgba(135, 206, 235, 0.9)')
      gradient.addColorStop(0.5, 'rgba(100, 149, 237, 0.9)')
      gradient.addColorStop(1, 'rgba(70, 130, 180, 0.9)')
    } else {
      gradient.addColorStop(0, 'rgba(100, 149, 237, 0.9)')
      gradient.addColorStop(0.5, 'rgba(70, 130, 180, 0.9)')
      gradient.addColorStop(1, 'rgba(50, 100, 150, 0.9)')
    }
    
    ctx.fillStyle = gradient
    this.drawRoundRect(ctx, this.x, this.y, this.w, this.h, 4)
    ctx.fill()
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.lineWidth = 2
    this.drawRoundRect(ctx, this.x + 2, this.y + 2, this.w - 4, this.h - 4, 2)
    ctx.stroke()
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    ctx.beginPath()
    ctx.moveTo(this.x + this.w * 0.2, this.y + 5)
    ctx.lineTo(this.x + this.w * 0.35, this.y + 5)
    ctx.lineTo(this.x + this.w * 0.25, this.y + 15)
    ctx.closePath()
    ctx.fill()
    
    ctx.beginPath()
    ctx.arc(this.x + this.w * 0.7, this.y + this.h * 0.6, 6, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.strokeStyle = 'rgba(30, 144, 255, 0.5)'
    ctx.lineWidth = 3
    this.drawRoundRect(ctx, this.x, this.y, this.w, this.h, 4)
    ctx.stroke()
  }
  
  renderStone(ctx, ratio) {
    const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.h)
    if (ratio > 0.6) {
      gradient.addColorStop(0, '#AEBFC4')
      gradient.addColorStop(0.3, '#97A8AD')
      gradient.addColorStop(0.7, '#829499')
      gradient.addColorStop(1, '#6E8087')
    } else if (ratio > 0.3) {
      gradient.addColorStop(0, '#97A8AD')
      gradient.addColorStop(0.3, '#829499')
      gradient.addColorStop(0.7, '#6E8087')
      gradient.addColorStop(1, '#5C6E77')
    } else {
      gradient.addColorStop(0, '#829499')
      gradient.addColorStop(0.3, '#6E8087')
      gradient.addColorStop(0.7, '#5C6E77')
      gradient.addColorStop(1, '#4C5C66')
    }
    
    ctx.fillStyle = gradient
    this.drawRoundRect(ctx, this.x, this.y, this.w, this.h, 2)
    ctx.fill()
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'
    for (let i = 0; i < this.stoneSpots.length; i++) {
      const spot = this.stoneSpots[i]
      this.drawRoundRect(ctx, this.x + spot.rx, this.y + spot.ry, spot.rw, spot.rh, 1)
      ctx.fill()
    }
    
    ctx.strokeStyle = '#3E5666'
    ctx.lineWidth = 3
    this.drawRoundRect(ctx, this.x, this.y, this.w, this.h, 2)
    ctx.stroke()
  }
  
  drawCracks(ctx) {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    
    const cracks = [
      [[this.x + this.w * 0.2, this.y + this.h * 0.1], 
       [this.x + this.w * 0.35, this.y + this.h * 0.4], 
       [this.x + this.w * 0.25, this.y + this.h * 0.7]],
      [[this.x + this.w * 0.8, this.y + this.h * 0.2], 
       [this.x + this.w * 0.7, this.y + this.h * 0.5], 
       [this.x + this.w * 0.85, this.y + this.h * 0.8]],
      [[this.x + this.w * 0.5, this.y], 
       [this.x + this.w * 0.45, this.y + this.h * 0.5], 
       [this.x + this.w * 0.55, this.y + this.h]]
    ]
    
    const numCracks = this.hp < this.maxHp * 0.3 ? 3 : this.hp < this.maxHp * 0.5 ? 2 : 1
    
    for (let i = 0; i < numCracks; i++) {
      ctx.beginPath()
      for (let j = 0; j < cracks[i].length; j++) {
        if (j === 0) {
          ctx.moveTo(cracks[i][j][0], cracks[i][j][1])
        } else {
          ctx.lineTo(cracks[i][j][0], cracks[i][j][1])
        }
      }
      ctx.stroke()
    }
  }

  getBounds() {
    return {
      left: this.x,
      right: this.x + this.w,
      top: this.y,
      bottom: this.y + this.h
    }
  }
}


// ===== pig.js =====
class Pig {
  constructor(x, y, radius) {
    this.x = x
    this.y = y
    this.radius = radius
    this.vx = 0
    this.vy = 0
    this.alive = true
    this.hp = 40
    this.maxHp = 40
    this.hitTimer = 0
    this.onGround = false
    // 是否被方块支撑（踩在方块顶面）。支撑被击碎后自由落地 → 判死
    this.onBlock = false
  }

  takeDamage(amount) {
    this.hp -= amount
    this.hitTimer = 10
    if (this.hp <= 0) {
      this.alive = false
    }
  }

  render(ctx) {
    if (!this.alive) return

    ctx.save()

    if (this.hitTimer > 0) {
      this.hitTimer--
    }

    const shakeX = this.hitTimer > 0 ? (Math.random() - 0.5) * 4 : 0
    const shakeY = this.hitTimer > 0 ? (Math.random() - 0.5) * 4 : 0
    const cx = this.x + shakeX
    const cy = this.y + shakeY
    const ratio = this.hp / this.maxHp
    
    const r = this.radius

    // 头顶大双耳（先画，被身体压住根部）：外耳粉色 + 内耳深粉
    ctx.fillStyle = '#FF9FBE'
    ctx.beginPath()
    ctx.ellipse(cx - r * 0.72, cy - r * 0.88, r * 0.42, r * 0.52, -0.45, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(cx + r * 0.72, cy - r * 0.88, r * 0.42, r * 0.52, 0.45, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#C2185B'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.ellipse(cx - r * 0.72, cy - r * 0.88, r * 0.42, r * 0.52, -0.45, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.ellipse(cx + r * 0.72, cy - r * 0.88, r * 0.42, r * 0.52, 0.45, 0, Math.PI * 2)
    ctx.stroke()
    ctx.fillStyle = '#E91E63'
    ctx.beginPath()
    ctx.ellipse(cx - r * 0.72, cy - r * 0.86, r * 0.2, r * 0.3, -0.45, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(cx + r * 0.72, cy - r * 0.86, r * 0.2, r * 0.3, 0.45, 0, Math.PI * 2)
    ctx.fill()

    // 身体：粉色渐变，血越少颜色越暗
    const bodyGradient = ctx.createRadialGradient(
      cx - r * 0.35, cy - r * 0.35, 0,
      cx, cy, r * 1.1
    )
    if (ratio > 0.6) {
      bodyGradient.addColorStop(0, '#FFD3E0')
      bodyGradient.addColorStop(0.55, '#FF9FBE')
      bodyGradient.addColorStop(1, '#F06292')
    } else if (ratio > 0.3) {
      bodyGradient.addColorStop(0, '#F8AFC6')
      bodyGradient.addColorStop(0.55, '#F07EA6')
      bodyGradient.addColorStop(1, '#D95C85')
    } else {
      bodyGradient.addColorStop(0, '#EF93AE')
      bodyGradient.addColorStop(0.55, '#E05C84')
      bodyGradient.addColorStop(1, '#BE3D69')
    }
    ctx.fillStyle = bodyGradient
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = '#AD1457'
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.stroke()

    // 脸颊腮红
    ctx.fillStyle = 'rgba(255, 105, 150, 0.4)'
    ctx.beginPath()
    ctx.ellipse(cx - r * 0.68, cy + r * 0.25, r * 0.18, r * 0.12, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(cx + r * 0.68, cy + r * 0.25, r * 0.18, r * 0.12, 0, 0, Math.PI * 2)
    ctx.fill()

    // 大圆眼：白底 + 黑瞳 + 高光（血少时变 X 眼）
    ctx.fillStyle = 'white'
    ctx.beginPath()
    ctx.ellipse(cx - r * 0.42, cy - r * 0.3, r * 0.22, r * 0.26, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(cx + r * 0.42, cy - r * 0.3, r * 0.22, r * 0.26, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#8E1040'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.ellipse(cx - r * 0.42, cy - r * 0.3, r * 0.22, r * 0.26, 0, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.ellipse(cx + r * 0.42, cy - r * 0.3, r * 0.22, r * 0.26, 0, 0, Math.PI * 2)
    ctx.stroke()

    if (ratio > 0.5) {
      ctx.fillStyle = '#222'
      ctx.beginPath()
      ctx.arc(cx - r * 0.38, cy - r * 0.26, r * 0.11, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(cx + r * 0.46, cy - r * 0.26, r * 0.11, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'white'
      ctx.beginPath()
      ctx.arc(cx - r * 0.42, cy - r * 0.33, r * 0.05, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(cx + r * 0.42, cy - r * 0.33, r * 0.05, 0, Math.PI * 2)
      ctx.fill()
    } else {
      ctx.strokeStyle = '#222'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(cx - r * 0.5, cy - r * 0.42)
      ctx.lineTo(cx - r * 0.18, cy - r * 0.14)
      ctx.moveTo(cx - r * 0.18, cy - r * 0.42)
      ctx.lineTo(cx - r * 0.5, cy - r * 0.14)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(cx + r * 0.3, cy - r * 0.42)
      ctx.lineTo(cx + r * 0.62, cy - r * 0.14)
      ctx.moveTo(cx + r * 0.62, cy - r * 0.42)
      ctx.lineTo(cx + r * 0.3, cy - r * 0.14)
      ctx.stroke()
    }

    // 标志性的粉色大鼻吻：渐变 + 双鼻孔 + 顶部高光
    const snoutGradient = ctx.createRadialGradient(cx, cy + r * 0.08, r * 0.05, cx, cy + r * 0.12, r * 0.55)
    snoutGradient.addColorStop(0, '#FF8FB3')
    snoutGradient.addColorStop(1, '#E84C7E')
    ctx.fillStyle = snoutGradient
    ctx.beginPath()
    ctx.ellipse(cx, cy + r * 0.12, r * 0.52, r * 0.34, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#B71C50'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.ellipse(cx, cy + r * 0.12, r * 0.52, r * 0.34, 0, 0, Math.PI * 2)
    ctx.stroke()

    ctx.fillStyle = '#8E1040'
    ctx.beginPath()
    ctx.ellipse(cx - r * 0.18, cy + r * 0.12, r * 0.08, r * 0.13, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(cx + r * 0.18, cy + r * 0.12, r * 0.08, r * 0.13, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(cx, cy + r * 0.12, r * 0.42, -2.6, -1.2)
    ctx.stroke()

    // 小嘴：健康时微笑，血少时撇嘴
    ctx.strokeStyle = '#8E1040'
    ctx.lineWidth = 1.8
    ctx.lineCap = 'round'
    ctx.beginPath()
    if (ratio > 0.5) {
      ctx.moveTo(cx - r * 0.2, cy + r * 0.62)
      ctx.quadraticCurveTo(cx, cy + r * 0.82, cx + r * 0.2, cy + r * 0.62)
    } else {
      ctx.moveTo(cx - r * 0.22, cy + r * 0.8)
      ctx.quadraticCurveTo(cx, cy + r * 0.6, cx + r * 0.22, cy + r * 0.8)
    }
    ctx.stroke()
    
    if (this.hp < this.maxHp * 0.7) {
      ctx.fillStyle = 'rgba(244, 67, 54, 0.3)'
      ctx.beginPath()
      ctx.arc(cx, cy, this.radius, 0, Math.PI * 2)
      ctx.fill()
      
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(cx - this.radius * 0.3, cy - this.radius * 0.5)
      ctx.lineTo(cx + this.radius * 0.1, cy)
      ctx.lineTo(cx - this.radius * 0.2, cy + this.radius * 0.4)
      ctx.stroke()
      
      ctx.beginPath()
      ctx.moveTo(cx + this.radius * 0.4, cy - this.radius * 0.3)
      ctx.lineTo(cx, cy + this.radius * 0.2)
      ctx.stroke()
    }

    ctx.restore()
  }

  getBounds() {
    return {
      left: this.x - this.radius,
      right: this.x + this.radius,
      top: this.y - this.radius,
      bottom: this.y + this.radius
    }
  }
}


// ===== effects.js =====
// 特效模块：粒子（木屑/冰晶/石屑、火花、烟雾）+ 屏幕震动
// 纯 Canvas 绘制，无外部资源；所有粒子带生命上限，总量封顶防止性能问题
class Effects {
  constructor() {
    this.particles = []
    this.shakeTime = 0
    this.shakeDuration = 18
    this.shakeMagnitude = 0
  }

  clear() {
    this.particles = []
    this.shakeTime = 0
    this.shakeMagnitude = 0
  }

  // 触发屏幕震动：amplitude 越大震得越猛；已有震动时只取更强的
  shake(amplitude) {
    if (amplitude <= 0) return
    if (this.shakeTime <= 0 || amplitude > this.shakeMagnitude) {
      this.shakeMagnitude = Math.min(10, amplitude)
      this.shakeDuration = 18
      this.shakeTime = 18
    }
  }

  // 渲染前调用一次，返回本帧偏移量（随时间衰减）
  getShakeOffset() {
    if (this.shakeTime <= 0) return { x: 0, y: 0 }
    this.shakeTime--
    const decay = this.shakeTime / this.shakeDuration
    const m = this.shakeMagnitude * decay
    return { x: (Math.random() - 0.5) * 2 * m, y: (Math.random() - 0.5) * 2 * m }
  }

  // 方块碎裂碎片（板屑/玻璃碴/石屑）：分材料呈现不同碎裂质感
  // 玻璃=细碎玻璃碴高速飞溅、寿命短；板材=长条板屑；石头=大块石砾滚动坠落
  spawnDebris(x, y, type, count) {
    const palettes = {
      board: ['#A67C52', '#8B5A2B', '#6B4423'],
      glass: ['#B3E5FC', '#81D4FA', '#4FC3F7', '#E1F5FE'],
      stone: ['#95A5A6', '#7F8C8D', '#5D6D7E'],
    }
    const colors = palettes[type] || palettes.board
    const speedMul = type === 'glass' ? 1.9 : type === 'stone' ? 0.55 : 1
    const sizeMul = type === 'stone' ? 1.5 : type === 'glass' ? 0.7 : 1.1
    const lifeMul = type === 'glass' ? 0.6 : type === 'stone' ? 1.3 : 1
    // 玻璃易碎：额外多喷 80% 的碎片
    const total = count + (type === 'glass' ? Math.floor(count * 0.8) : 0)
    for (let i = 0; i < total; i++) {
      if (this.particles.length >= 300) break
      const life = (40 + Math.random() * 30) * lifeMul
      this.particles.push({
        kind: 'debris',
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 8 * speedMul,
        vy: -2 - Math.random() * 5 * speedMul,
        size: (3 + Math.random() * 5) * sizeMul,
        elong: type === 'board' ? 1.8 : type === 'stone' ? 1.1 : 0.7,
        color: colors[Math.floor(Math.random() * colors.length)],
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * (type === 'stone' ? 0.25 : 0.5),
        life: life,
        maxLife: life,
      })
    }
  }

  // 高速撞击火花
  spawnSparks(x, y, count) {
    const colors = ['#FFF176', '#FFEE58', '#FFFFFF', '#FFD54F']
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= 300) break
      const angle = Math.random() * Math.PI * 2
      const speed = 2 + Math.random() * 4
      this.particles.push({
        kind: 'spark',
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 1.5 + Math.random() * 2.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 15 + Math.random() * 15,
        maxLife: 30,
      })
    }
  }

  // 猪死亡烟圈：一圈向外扩散、逐渐放大淡出的圆
  spawnPoof(x, y, radius) {
    const colors = ['#A5D6A7', '#81C784', '#C8E6C9', '#EF9A9A']
    const count = 10
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= 300) break
      const angle = (i / count) * Math.PI * 2
      this.particles.push({
        kind: 'poof',
        x: x + Math.cos(angle) * radius * 0.4,
        y: y + Math.sin(angle) * radius * 0.4,
        vx: Math.cos(angle) * (1 + Math.random() * 2),
        vy: Math.sin(angle) * (1 + Math.random() * 2) - 1,
        size: 6 + Math.random() * 8,
        grow: 0.5 + Math.random() * 0.4,
        color: colors[i % colors.length],
        life: 25 + Math.random() * 15,
        maxLife: 40,
      })
    }
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.life--
      if (p.life <= 0) {
        this.particles.splice(i, 1)
        continue
      }
      p.x += p.vx
      p.y += p.vy
      if (p.kind === 'debris') {
        p.vy += 0.5
        p.rot += p.vrot
      } else if (p.kind === 'spark') {
        p.vx *= 0.92
        p.vy *= 0.92
      } else if (p.kind === 'poof') {
        p.size += p.grow
        p.vx *= 0.95
        p.vy *= 0.95
      }
    }
  }

  render(ctx) {
    if (this.particles.length === 0) return
    ctx.save()
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife)
      ctx.globalAlpha = alpha
      if (p.kind === 'debris') {
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * (p.elong || 0.7))
        ctx.restore()
      } else if (p.kind === 'spark') {
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      } else if (p.kind === 'poof') {
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    ctx.globalAlpha = 1
    ctx.restore()
  }
}



// ===== ui.js =====
class UI {
  // confetti 粒子在每次进入胜利界面时预生成一次，之后每帧更新位置
  static confetti = null
  static winShown = false
  static winFrame = 0
  static loseShown = false
  static loseFrame = 0

  static render(ctx, screenWidth, screenHeight, score, levelIndex, gameState, birds) {
    ctx.save()

    this.renderTopBar(ctx, screenWidth, score, levelIndex, birds)
    this.renderRemainingBirds(ctx, birds, screenWidth)

    if (gameState === 'win') {
      if (!this.winShown) {
        this.winShown = true
        this.winFrame = 0
        this.confetti = this.generateConfetti(screenWidth, screenHeight)
      }
      this.renderWinScreen(ctx, screenWidth, screenHeight, birds)
    } else {
      this.winShown = false
    }

    if (gameState === 'lose') {
      if (!this.loseShown) {
        this.loseShown = true
        this.loseFrame = 0
      }
      this.renderLoseScreen(ctx, screenWidth, screenHeight)
    } else {
      this.loseShown = false
    }

    ctx.restore()
  }

  // 回弹缓动：t ∈ [0,1]，先冲过头再回落
  static easeOutBack(t) {
    const c1 = 1.70158
    const c2 = c1 * 1.525
    return 1 + c2 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
  }

  static drawRoundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + width - radius, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    ctx.lineTo(x + width, y + height - radius)
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    ctx.lineTo(x + radius, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
  }

  // 五芒星路径（顶点朝上）
  static drawStar(ctx, cx, cy, outerR, innerR) {
    ctx.beginPath()
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? outerR : innerR
      const a = -Math.PI / 2 + (i * Math.PI) / 5
      const px = cx + Math.cos(a) * r
      const py = cy + Math.sin(a) * r
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.closePath()
  }

  static renderTopBar(ctx, screenWidth, score, levelIndex, birds) {
    const x = 12, y = 12, w = screenWidth - 24, h = 48

    // 木质底牌
    const gradient = ctx.createLinearGradient(0, y, 0, y + h)
    gradient.addColorStop(0, '#C08850')
    gradient.addColorStop(0.5, '#A5722F')
    gradient.addColorStop(1, '#82552A')
    ctx.fillStyle = gradient
    this.drawRoundRect(ctx, x, y, w, h, 12)
    ctx.fill()

    // 深色描边 + 内侧高光
    ctx.strokeStyle = '#4A2810'
    ctx.lineWidth = 3
    this.drawRoundRect(ctx, x, y, w, h, 12)
    ctx.stroke()
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
    ctx.lineWidth = 1.5
    this.drawRoundRect(ctx, x + 3, y + 3, w - 6, h - 6, 9)
    ctx.stroke()

    // 木纹
    ctx.strokeStyle = 'rgba(74, 40, 16, 0.35)'
    ctx.lineWidth = 1.5
    for (let i = 0; i < 3; i++) {
      const ly = y + h * (0.28 + i * 0.22)
      ctx.beginPath()
      ctx.moveTo(x + 10, ly)
      for (let jx = x + 10; jx < x + w - 10; jx += 24) {
        ctx.quadraticCurveTo(jx + 12, ly + Math.sin(jx * 0.05) * 1.5, jx + 24, ly)
      }
      ctx.stroke()
    }

    // 两端铁钉
    ctx.fillStyle = '#D7CCC8'
    ctx.strokeStyle = '#8D6E63'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(x + 16, y + h / 2, 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(x + w - 16, y + h / 2, 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    // 分数
    ctx.fillStyle = '#FFE082'
    ctx.shadowColor = 'rgba(255, 213, 79, 0.55)'
    ctx.shadowBlur = 10
    ctx.font = 'bold 22px "Arial Black", sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(`⭐ ${score}`, 32, 44)
    ctx.shadowBlur = 0

    // 关卡
    ctx.fillStyle = '#FFF8E1'
    ctx.shadowColor = 'rgba(255, 248, 225, 0.45)'
    ctx.shadowBlur = 10
    ctx.font = 'bold 22px "Arial Black", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`🎮 第 ${levelIndex + 1} 关`, screenWidth / 2, 44)
    ctx.shadowBlur = 0

    // 剩余小鸟
    ctx.fillStyle = '#FFCDD2'
    ctx.shadowColor = 'rgba(255, 205, 210, 0.45)'
    ctx.shadowBlur = 10
    ctx.textAlign = 'right'
    ctx.font = 'bold 20px "Arial Black", sans-serif'
    const remaining = birds.filter(b => !b.used).length
    ctx.fillText(`🐦 x ${remaining}`, screenWidth - 32, 44)
    ctx.shadowBlur = 0
  }

  static renderRemainingBirds(ctx, birds, screenWidth) {
    let x = screenWidth - 105
    const y = 82
    const spacing = 32

    let count = 0
    for (let i = birds.length - 1; i >= 0; i--) {
      if (!birds[i].used) {
        const colors = ['#E74C3C', '#3498DB', '#F1C40F', '#2ECC71', '#E67E22', '#9B59B6']
        const color = colors[birds[i].index % colors.length]

        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
        ctx.beginPath()
        ctx.arc(x + 2, y + 3, 12, 0, Math.PI * 2)
        ctx.fill()

        const gradient = ctx.createRadialGradient(x - 3, y - 3, 0, x, y, 12)
        gradient.addColorStop(0, this.lightenColor(color, 35))
        gradient.addColorStop(0.6, color)
        gradient.addColorStop(1, this.darkenColor(color, 25))

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(x, y, 12, 0, Math.PI * 2)
        ctx.fill()

        ctx.strokeStyle = this.darkenColor(color, 35)
        ctx.lineWidth = 2
        ctx.stroke()

        x -= spacing
        count++
        if (count >= 5) break
      }
    }
  }

  static renderWinScreen(ctx, screenWidth, screenHeight, birds) {
    this.winFrame++

    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)'
    ctx.fillRect(0, 0, screenWidth, screenHeight)

    const centerX = screenWidth / 2
    const centerY = screenHeight / 2

    // 标题弹跳入场
    const tScale = Math.min(1, this.winFrame / 24)
    const scale = tScale < 1 ? this.easeOutBack(tScale) : 1
    ctx.save()
    ctx.translate(centerX, centerY - 50)
    ctx.scale(scale, scale)
    ctx.fillStyle = '#2ECC71'
    ctx.shadowColor = 'rgba(46, 204, 113, 0.8)'
    ctx.shadowBlur = 20
    ctx.font = 'bold 56px "Arial Black", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('🎉 恭喜过关! 🎉', 0, 0)
    ctx.shadowBlur = 0
    ctx.restore()

    // 星级评价：按剩余小鸟数给 1~3 星，逐颗回弹入场
    const remaining = birds.filter(b => !b.used).length
    const stars = remaining >= 2 ? 3 : remaining === 1 ? 2 : 1
    for (let i = 0; i < 3; i++) {
      const sx = centerX + (i - 1) * 70
      const sy = centerY + 18
      const start = 18 + i * 12
      const t = (this.winFrame - start) / 18
      if (t <= 0) continue
      const ss = t < 1 ? this.easeOutBack(t) : 1
      ctx.save()
      ctx.translate(sx, sy)
      ctx.scale(ss, ss)
      this.drawStar(ctx, 0, 0, 26, 11)
      if (i < stars) {
        ctx.fillStyle = '#FFD700'
        ctx.shadowColor = 'rgba(255, 215, 0, 0.8)'
        ctx.shadowBlur = 15
        ctx.fill()
        ctx.shadowBlur = 0
        ctx.strokeStyle = '#E6A800'
        ctx.lineWidth = 2.5
        ctx.stroke()
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.18)'
        ctx.fill()
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
        ctx.lineWidth = 2
        ctx.stroke()
      }
      ctx.restore()
    }

    // 副标题与提示
    const fade = Math.min(1, Math.max(0, (this.winFrame - 30) / 20))
    ctx.globalAlpha = fade
    ctx.fillStyle = '#F1C40F'
    ctx.shadowColor = 'rgba(241, 196, 15, 0.6)'
    ctx.shadowBlur = 15
    ctx.font = 'bold 28px "Arial Black", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('⭐ 太棒了! ⭐', centerX, centerY + 72)
    ctx.shadowBlur = 0

    ctx.fillStyle = '#ECF0F1'
    ctx.font = '22px Arial, sans-serif'
    ctx.fillText('准备进入下一关...', centerX, centerY + 106)
    ctx.globalAlpha = 1

    this.updateConfetti(ctx, screenWidth, screenHeight)
  }

  static renderLoseScreen(ctx, screenWidth, screenHeight) {
    this.loseFrame++

    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)'
    ctx.fillRect(0, 0, screenWidth, screenHeight)

    const centerX = screenWidth / 2
    const centerY = screenHeight / 2

    const tScale = Math.min(1, this.loseFrame / 24)
    const scale = tScale < 1 ? this.easeOutBack(tScale) : 1
    ctx.save()
    ctx.translate(centerX, centerY - 40)
    ctx.scale(scale, scale)
    ctx.fillStyle = '#E74C3C'
    ctx.shadowColor = 'rgba(231, 76, 60, 0.8)'
    ctx.shadowBlur = 20
    ctx.font = 'bold 56px "Arial Black", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('💥 游戏失败 💥', 0, 0)
    ctx.shadowBlur = 0
    ctx.restore()

    const fade = Math.min(1, Math.max(0, (this.loseFrame - 18) / 20))
    ctx.globalAlpha = fade
    ctx.fillStyle = '#F39C12'
    ctx.shadowColor = 'rgba(243, 156, 18, 0.6)'
    ctx.shadowBlur = 15
    ctx.font = 'bold 28px "Arial Black", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('😢 再试一次! 😢', centerX, centerY + 40)
    ctx.shadowBlur = 0

    ctx.fillStyle = '#ECF0F1'
    ctx.font = '22px Arial, sans-serif'
    ctx.fillText('重新开始...', centerX, centerY + 78)
    ctx.globalAlpha = 1
  }

  static generateConfetti(screenWidth, screenHeight) {
    const colors = ['#E74C3C', '#3498DB', '#F1C40F', '#2ECC71', '#9B59B6', '#E67E22', '#FF8A65', '#4DD0E1']
    const particles = []
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * screenWidth,
        y: -Math.random() * screenHeight,
        size: 4 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        vy: 1.2 + Math.random() * 1.8,
        phase: Math.random() * Math.PI * 2,
        sway: 0.5 + Math.random() * 0.8,
        rot: Math.random() * Math.PI,
        vrot: (Math.random() - 0.5) * 0.2,
      })
    }
    return particles
  }

  // 彩带：下落 + 左右飘摆 + 自转，落出屏幕后从顶部循环
  static updateConfetti(ctx, screenWidth, screenHeight) {
    if (!this.confetti) return
    for (const p of this.confetti) {
      p.y += p.vy
      p.phase += 0.05
      p.x += Math.sin(p.phase) * p.sway
      p.rot += p.vrot
      if (p.y > screenHeight + 10) {
        p.y = -10
        p.x = Math.random() * screenWidth
      }
    }
    for (const p of this.confetti) {
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rot)
      // 沿一个轴缩放模拟纸片翻转
      ctx.scale(1, 0.5 + 0.5 * Math.abs(Math.sin(p.phase)))
      ctx.fillStyle = p.color
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size)
      ctx.restore()
    }
  }

  static lightenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16)
    const amt = Math.round(2.55 * percent)
    const R = Math.max(0, Math.min(255, (num >> 16) + amt))
    const G = Math.max(0, Math.min(255, ((num >> 8) & 0xFF) + amt))
    const B = Math.max(0, Math.min(255, (num & 0xFF) + amt))
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)
  }

  static darkenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16)
    const amt = Math.round(2.55 * percent)
    const R = Math.max(0, Math.min(255, (num >> 16) - amt))
    const G = Math.max(0, Math.min(255, ((num >> 8) & 0xFF) - amt))
    const B = Math.max(0, Math.min(255, (num & 0xFF) - amt))
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)
  }
}



// ===== scenes.js =====
class Scenes {
  // 5 个关卡各配一套天气/时段主题：清晨 / 正午 / 黄昏 / 夜晚 / 风暴
  static THEMES = [
    {
      name: 'dawn',
      sky: [[0, '#FFB49B'], [0.25, '#FFCCA8'], [0.55, '#FFE6CE'], [0.8, '#FFF5DC'], [1, '#FFFBEF']],
      sun: { color: '#FFB74D', glow: 'rgba(255, 167, 100, 0.4)', r: 30 },
      cloud: 'rgba(255, 236, 224, 0.92)',
      hillFar: { r: 175, g: 130, b: 150, a: 0.6 },
      hillNear: { r: 150, g: 170, b: 100, a: 0.85 },
      ground: { dirt: '#B08A63', dirtDark: '#8E6C4A', grass: '#8BC34A', grassLight: '#C5E1A5' },
    },
    {
      name: 'noon',
      sky: [[0, '#42A0DC'], [0.2, '#55ADE3'], [0.5, '#79C4EE'], [0.8, '#A5D8F5'], [1, '#C6EBFC']],
      sun: { color: '#f1c40f', glow: 'rgba(255, 165, 0, 0.35)', r: 30 },
      cloud: 'rgba(255, 255, 255, 0.95)',
      hillFar: { r: 125, g: 175, b: 115, a: 0.6 },
      hillNear: { r: 135, g: 210, b: 90, a: 0.8 },
      ground: { dirt: '#AE8C6E', dirtDark: '#8A6B52', grass: '#86BF4B', grassLight: '#B5E08A' },
    },
    {
      name: 'dusk',
      sky: [[0, '#7A52A8'], [0.3, '#A568C4'], [0.55, '#D87FBE'], [0.78, '#F5A07A'], [1, '#FFC98E']],
      sun: { color: '#FF7043', glow: 'rgba(255, 112, 67, 0.4)', r: 34 },
      cloud: 'rgba(240, 218, 245, 0.9)',
      hillFar: { r: 135, g: 100, b: 155, a: 0.65 },
      hillNear: { r: 165, g: 125, b: 140, a: 0.85 },
      ground: { dirt: '#8D6E5C', dirtDark: '#6B4E3F', grass: '#93AE55', grassLight: '#C0D494' },
    },
    {
      name: 'night',
      sky: [[0, '#16294F'], [0.4, '#1E3560'], [0.75, '#28457C'], [1, '#33558F']],
      moon: true,
      cloud: 'rgba(150, 160, 200, 0.55)',
      hillFar: { r: 55, g: 70, b: 105, a: 0.7 },
      hillNear: { r: 68, g: 92, b: 75, a: 0.8 },
      ground: { dirt: '#6E584C', dirtDark: '#55443B', grass: '#5F8C46', grassLight: '#7FAF66' },
    },
    {
      name: 'storm',
      sky: [[0, '#4E6470'], [0.4, '#5C7480'], [0.75, '#6E8894'], [1, '#7E97A3']],
      cloud: 'rgba(130, 138, 148, 0.92)',
      hillFar: { r: 100, g: 108, b: 118, a: 0.6 },
      hillNear: { r: 110, g: 122, b: 100, a: 0.8 },
      ground: { dirt: '#816954', dirtDark: '#64503E', grass: '#78995A', grassLight: '#9CBB7E' },
    },
  ]

  constructor(screenWidth, screenHeight, levelIndex = 0) {
    this.width = screenWidth
    this.height = screenHeight
    // levelIndex 是 0 基索引，对应 THEMES 的 清晨/正午/黄昏/夜晚/风暴
    this.theme = Scenes.THEMES[levelIndex % Scenes.THEMES.length]
    this.clouds = this.generateClouds()
    this.hills = this.generateHills()
    this.birds = this.generateBackgroundBirds()
    this.stars = this.theme.name === 'night' ? this.generateStars() : []
    this.frame = 0
    this.grass = this.generateGrass(screenWidth)
    this.dirtSpots = this.generateDirtSpots(screenWidth)
  }

  generateStars() {
    const stars = []
    for (let i = 0; i < 40; i++) {
      stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height * 0.5,
        r: 0.6 + Math.random() * 1.4,
        tw: Math.random() * Math.PI * 2,
      })
    }
    return stars
  }

  // 地面草丛：沿整条地面线预生成，渲染时画成小三角形
  generateGrass(width) {
    const tufts = []
    for (let i = 0; i < Math.floor(width / 14); i++) {
      tufts.push({
        x: i * 14 + Math.random() * 8,
        h: 6 + Math.random() * 8,
        lean: (Math.random() - 0.5) * 6,
        light: Math.random() > 0.5,
      })
    }
    return tufts
  }

  // 泥土中的深色斑点（预生成避免每帧随机闪烁）
  generateDirtSpots(width) {
    const spots = []
    for (let i = 0; i < 45; i++) {
      spots.push({
        x: Math.random() * width,
        dy: 14 + Math.random() * 38,
        r: 1.5 + Math.random() * 3,
      })
    }
    return spots
  }

  generateClouds() {
    const clouds = []
    for (let i = 0; i < 7; i++) {
      clouds.push({
        x: Math.random() * this.width,
        y: 25 + Math.random() * 100,
        w: 70 + Math.random() * 90,
        h: 28 + Math.random() * 25,
        speed: 0.15 + Math.random() * 0.25,
      })
    }
    return clouds
  }

  generateHills() {
    const hills = []
    for (let i = 0; i < 5; i++) {
      hills.push({
        x: i * 220 - 80,
        w: 180 + Math.random() * 160,
        h: 60 + Math.random() * 70,
        shade: 0.6 + Math.random() * 0.4,
      })
    }
    return hills
  }

  generateBackgroundBirds() {
    const birds = []
    for (let i = 0; i < 5; i++) {
      birds.push({
        x: Math.random() * this.width,
        y: 50 + Math.random() * 120,
        speed: 0.8 + Math.random() * 0.7,
        amplitude: 8 + Math.random() * 10,
        frequency: 0.02 + Math.random() * 0.02,
        phase: Math.random() * Math.PI * 2,
        size: 8 + Math.random() * 5,
      })
    }
    return birds
  }

  drawBackground(ctx) {
    this.frame++
    const theme = this.theme

    // 天空渐变
    const skyGradient = ctx.createLinearGradient(0, 0, 0, this.height)
    theme.sky.forEach(([pos, color]) => skyGradient.addColorStop(pos, color))
    ctx.fillStyle = skyGradient
    ctx.fillRect(0, 0, this.width, this.height)

    // 夜晚：闪烁的星星
    if (this.stars.length > 0) {
      ctx.fillStyle = '#FFFFFF'
      this.stars.forEach(s => {
        const twinkle = 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(this.frame * 0.05 + s.tw))
        ctx.globalAlpha = twinkle
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fill()
      })
      ctx.globalAlpha = 1
    }

    // 太阳 / 月亮
    if (theme.moon) {
      const mx = 100, my = 80
      ctx.fillStyle = 'rgba(230, 235, 245, 0.15)'
      ctx.beginPath()
      ctx.arc(mx, my, 55, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ECEFF1'
      ctx.beginPath()
      ctx.arc(mx, my, 28, 0, Math.PI * 2)
      ctx.fill()
      // 环形山
      ctx.fillStyle = 'rgba(158, 168, 180, 0.55)'
      ctx.beginPath()
      ctx.arc(mx - 8, my - 6, 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(mx + 9, my + 7, 4.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(mx + 3, my - 12, 3, 0, Math.PI * 2)
      ctx.fill()
    } else if (theme.sun) {
      const s = theme.sun
      // 光晕
      const glow = ctx.createRadialGradient(100, 80, 0, 100, 80, 150)
      glow.addColorStop(0, s.glow)
      glow.addColorStop(0.5, 'rgba(255, 165, 0, 0.12)')
      glow.addColorStop(1, 'rgba(255, 165, 0, 0)')
      ctx.fillStyle = glow
      ctx.beginPath()
      ctx.arc(100, 80, 150, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = s.color
      ctx.shadowColor = s.color
      ctx.shadowBlur = 25
      ctx.beginPath()
      ctx.arc(100, 80, s.r, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
    }

    this.drawClouds(ctx)
    this.drawBackgroundBirds(ctx)
    this.drawHills(ctx)
  }

  // 地面：泥土 + 顶部草带 + 草丛 + 泥土斑点
  // groundY 为地面顶边，与 main 中一致（screenHeight - 60）
  drawGround(ctx, groundY) {
    const g = this.theme.ground
    const h = this.height - groundY

    ctx.fillStyle = g.dirt
    ctx.fillRect(0, groundY, this.width, h)

    // 顶部草带
    ctx.fillStyle = g.grass
    ctx.fillRect(0, groundY, this.width, 10)
    ctx.fillStyle = g.grassLight
    ctx.fillRect(0, groundY, this.width, 4)

    // 草丛
    this.grass.forEach(t => {
      ctx.fillStyle = t.light ? g.grassLight : g.grass
      ctx.beginPath()
      ctx.moveTo(t.x - 3, groundY + 4)
      ctx.lineTo(t.x + t.lean * 0.4, groundY + 4 - t.h)
      ctx.lineTo(t.x + 3, groundY + 4)
      ctx.closePath()
      ctx.fill()
    })

    // 泥土斑点
    ctx.fillStyle = g.dirtDark
    this.dirtSpots.forEach(s => {
      ctx.beginPath()
      ctx.arc(s.x, groundY + s.dy, s.r, 0, Math.PI * 2)
      ctx.fill()
    })
  }

  drawClouds(ctx) {
    const cloudColor = this.theme.cloud
    this.clouds.forEach(cloud => {
      cloud.x += cloud.speed
      if (cloud.x > this.width + 120) {
        cloud.x = -cloud.w - 50
        cloud.y = 25 + Math.random() * 100
      }

      // 云朵阴影
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
      ctx.beginPath()
      ctx.ellipse(cloud.x + 3, cloud.y + 5, cloud.w / 2, cloud.h / 2, 0, 0, Math.PI * 2)
      ctx.fill()

      // 主云朵
      ctx.fillStyle = cloudColor
      ctx.beginPath()
      ctx.ellipse(cloud.x, cloud.y, cloud.w / 2, cloud.h / 2, 0, 0, Math.PI * 2)
      ctx.fill()

      // 左云朵
      ctx.globalAlpha = 0.85
      ctx.beginPath()
      ctx.ellipse(cloud.x - cloud.w * 0.32, cloud.y + cloud.h * 0.18, cloud.w * 0.38, cloud.h * 0.42, 0, 0, Math.PI * 2)
      ctx.fill()

      // 右云朵
      ctx.globalAlpha = 0.88
      ctx.beginPath()
      ctx.ellipse(cloud.x + cloud.w * 0.28, cloud.y + cloud.h * 0.12, cloud.w * 0.33, cloud.h * 0.48, 0, 0, Math.PI * 2)
      ctx.fill()

      // 中间点缀
      ctx.globalAlpha = 0.75
      ctx.beginPath()
      ctx.ellipse(cloud.x, cloud.y - cloud.h * 0.15, cloud.w * 0.25, cloud.h * 0.35, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    })
  }

  drawBackgroundBirds(ctx) {
    // 夜晚/风暴天色较暗，剪影鸟改浅色更清晰
    const silhouette = this.theme.name === 'night' ? '#9FB4D8' :
      this.theme.name === 'storm' ? '#263238' : '#2c3e50'
    this.birds.forEach(bird => {
      bird.x += bird.speed
      bird.phase += 0.1

      if (bird.x > this.width + 50) {
        bird.x = -50
        bird.y = 50 + Math.random() * 120
        bird.phase = Math.random() * Math.PI * 2
      }

      const wingAngle = Math.sin(bird.phase) * 0.5
      const bob = Math.sin(bird.phase * bird.frequency) * bird.amplitude

      ctx.save()
      ctx.translate(bird.x, bird.y + bob)

      // 身体
      ctx.fillStyle = silhouette
      ctx.beginPath()
      ctx.ellipse(0, 0, bird.size, bird.size * 0.4, 0, 0, Math.PI * 2)
      ctx.fill()

      // 翅膀
      ctx.strokeStyle = silhouette
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.quadraticCurveTo(-bird.size * 0.8, -bird.size * wingAngle, -bird.size * 1.3, 0)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.quadraticCurveTo(bird.size * 0.8, -bird.size * wingAngle, bird.size * 1.3, 0)
      ctx.stroke()

      ctx.restore()
    })
  }

  drawHills(ctx) {
    const theme = this.theme

    // 远山（暗色）
    this.hills.forEach((hill, index) => {
      if (index % 2 === 0) {
        const c = theme.hillFar
        ctx.fillStyle = `rgba(${Math.floor(c.r * hill.shade)}, ${Math.floor(c.g * hill.shade)}, ${Math.floor(c.b * hill.shade)}, ${c.a})`
        ctx.beginPath()
        ctx.ellipse(hill.x + hill.w / 2, this.height - 40, hill.w / 2, hill.h * 0.7, 0, Math.PI, 0)
        ctx.fill()
      }
    })

    // 近山（亮色）
    this.hills.forEach((hill, index) => {
      if (index % 2 === 1) {
        const c = theme.hillNear
        ctx.fillStyle = `rgba(${Math.floor(c.r * hill.shade)}, ${Math.floor(c.g * hill.shade)}, ${Math.floor(c.b * hill.shade)}, ${c.a})`
        ctx.beginPath()
        ctx.ellipse(hill.x + hill.w / 2, this.height - 50, hill.w / 2, hill.h, 0, Math.PI, 0)
        ctx.fill()
      }
    })
  }
}



// ===== input.js =====
class InputManager {
  constructor(canvas, logicalWidth, logicalHeight) {
    this.canvas = canvas
    this.logicalWidth = logicalWidth
    this.logicalHeight = logicalHeight
    this.touchActive = false
    this.touchX = 0
    this.touchY = 0

    canvas.addEventListener('mousedown', (e) => {
      e.preventDefault()
      this.touchActive = true
      this.updatePosition(e.clientX, e.clientY)
    })

    canvas.addEventListener('mousemove', (e) => {
      e.preventDefault()
      if (this.touchActive) {
        this.updatePosition(e.clientX, e.clientY)
      }
    })

    canvas.addEventListener('mouseup', (e) => {
      e.preventDefault()
      this.touchActive = false
    })

    canvas.addEventListener('mouseleave', (e) => {
      e.preventDefault()
      this.touchActive = false
    })

    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault()
      const touch = e.touches[0]
      this.touchActive = true
      this.updatePosition(touch.clientX, touch.clientY)
    })

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault()
      const touch = e.touches[0]
      this.updatePosition(touch.clientX, touch.clientY)
    })

    canvas.addEventListener('touchend', (e) => {
      e.preventDefault()
      this.touchActive = false
    })

    canvas.addEventListener('touchcancel', (e) => {
      e.preventDefault()
      this.touchActive = false
    })
  }

  updatePosition(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect()
    // 将 CSS 像素坐标映射到 Canvas 逻辑像素坐标
    const scaleX = this.logicalWidth / rect.width
    const scaleY = this.logicalHeight / rect.height
    this.touchX = (clientX - rect.left) * scaleX
    this.touchY = (clientY - rect.top) * scaleY
  }

  getTouch() {
    return {
      active: this.touchActive,
      x: this.touchX,
      y: this.touchY
    }
  }
}


// ===== sound.js =====
// 音效管理器 - SoundManager（使用 Web Audio API 合成音效）
// 非浏览器环境（如微信小游戏，无 window.AudioContext）自动静默，所有方法为安全的空操作
class SoundManager {
  constructor() {
    this.ctx = null
    this.supported = typeof window !== 'undefined' &&
      !!(window.AudioContext || window.webkitAudioContext)
    if (!this.supported) return
    // AudioContext 必须在用户交互后创建
    const initAudio = () => {
      if (!this.ctx) {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)()
      }
    }
    document.addEventListener('click', initAudio, { once: true })
    document.addEventListener('touchstart', initAudio, { once: true })
  }

  _ensureContext() {
    if (!this.ctx) return false
    if (this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
    return true
  }

  playLaunch() {
    // 发射：呼啸声 - 白噪声+高通滤波器
    if (!this._ensureContext()) return
    const duration = 0.3
    const sr = this.ctx.sampleRate
    const len = Math.floor(sr * duration)
    const buffer = this.ctx.createBuffer(1, len, sr)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < len; i++) {
      const t = i / sr
      data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 8) * 0.3
    }
    const source = this.ctx.createBufferSource()
    source.buffer = buffer
    const filter = this.ctx.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.setValueAtTime(200, this.ctx.currentTime)
    filter.frequency.exponentialRampToValueAtTime(2000, this.ctx.currentTime + duration)
    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration)
    source.connect(filter)
    filter.connect(gain)
    gain.connect(this.ctx.destination)
    source.start()
  }

  playHitPig() {
    // 击中小猪：吱的一声
    if (!this._ensureContext()) return
    const osc = this.ctx.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(600, this.ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.15)
    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15)
    osc.connect(gain)
    gain.connect(this.ctx.destination)
    osc.start()
    osc.stop(this.ctx.currentTime + 0.15)
  }

  playPigDeath() {
    // 小猪死亡：痛苦的咕噜声
    if (!this._ensureContext()) return
    const osc = this.ctx.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(500, this.ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.4)
    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4)
    osc.connect(gain)
    gain.connect(this.ctx.destination)
    osc.start()
    osc.stop(this.ctx.currentTime + 0.4)
  }

  // 噪声爆发：duration 秒、截止频率 freq、音量 vol（受击/碎裂共用）
  _noiseBurst(duration, freq, vol) {
    if (!this._ensureContext()) return
    const sr = this.ctx.sampleRate
    const len = Math.floor(sr * duration)
    const buffer = this.ctx.createBuffer(1, len, sr)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < len; i++) {
      const t = i / sr
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t / duration, 1.5) * vol
    }
    const source = this.ctx.createBufferSource()
    source.buffer = buffer
    const filter = this.ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = freq
    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(vol, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration)
    source.connect(filter)
    filter.connect(gain)
    gain.connect(this.ctx.destination)
    source.start()
  }

  playHitBlock(type) {
    // 击中方块：分材料 —— 板材=沉闷咚、玻璃=清脆哒、石头=厚重轰
    if (type === 'glass') {
      this._noiseBurst(0.08, 6000, 0.3)
      this._toneBurst('square', 2600, 0.05, 0.15)
    } else if (type === 'stone') {
      this._noiseBurst(0.14, 320, 0.5)
    } else {
      this._noiseBurst(0.1, 800, 0.4)
    }
  }

  // 短促单音（玻璃的碎裂"叮"）
  _toneBurst(toneType, freq, duration, vol) {
    if (!this._ensureContext()) return
    const osc = this.ctx.createOscillator()
    osc.type = toneType
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(freq * 1.6, this.ctx.currentTime + duration)
    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(vol, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration)
    osc.connect(gain)
    gain.connect(this.ctx.destination)
    osc.start()
    osc.stop(this.ctx.currentTime + duration)
  }

  playBlockBreak(type) {
    // 碎裂音：分材料 —— 玻璃=高频连续脆裂叮当、板材=木质噼啪、石头=沉闷崩裂
    if (type === 'glass') {
      // 三段错开的高频脆裂
      this._noiseBurst(0.16, 8000, 0.4)
      this._toneBurst('square', 3200, 0.08, 0.12)
      setTimeout(() => this._toneBurst('square', 4100, 0.07, 0.1), 60)
      setTimeout(() => this._toneBurst('square', 5200, 0.06, 0.08), 130)
    } else if (type === 'stone') {
      this._noiseBurst(0.3, 240, 0.6)
      this._toneBurst('sine', 70, 0.25, 0.3)
    } else {
      // 板材噼啪：两段错开的中频噪声
      this._noiseBurst(0.2, 1400, 0.5)
      setTimeout(() => this._noiseBurst(0.12, 900, 0.35), 70)
    }
  }

  playWin() {
    // 胜利：上行琶音 C5-E5-G5-C6
    if (!this._ensureContext()) return
    const notes = [523, 659, 784, 1047]
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator()
      osc.type = 'triangle'
      osc.frequency.value = freq
      const gain = this.ctx.createGain()
      const t = this.ctx.currentTime + i * 0.12
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.2, t + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3)
      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start(t)
      osc.stop(t + 0.3)
    })
  }

  playLose() {
    // 失败：下行音
    if (!this._ensureContext()) return
    const osc = this.ctx.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(400, this.ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.6)
    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6)
    osc.connect(gain)
    gain.connect(this.ctx.destination)
    osc.start()
    osc.stop(this.ctx.currentTime + 0.6)
  }

  playSlingshot() {
    // 弹弓拉伸：橡皮筋声
    if (!this._ensureContext()) return
    const osc = this.ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(300, this.ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.08)
    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08)
    osc.connect(gain)
    gain.connect(this.ctx.destination)
    osc.start()
    osc.stop(this.ctx.currentTime + 0.08)
  }
}

const soundManager = new SoundManager()


// ===== collision.js =====

class CollisionDetection {
  static screenWidth = 800

  static init(screenWidth, maxPull) {
    CollisionDetection.screenWidth = screenWidth
    // 满攻参照：满拉（maxPull × 0.35 功率系数）打出的平射冲击约等于 fullHitSpeed 的 1/0.75 倍。
    // 冲击速度 ≥ fullHitSpeed 的一击按"一次满攻"结算，与 block.js 的血量对齐：
    // 玻璃(10) = 1 次满攻、板材(15) = 1.5 次满攻、石头(20) = 2 次满攻
    CollisionDetection.fullHitSpeed = (maxPull || 80) * 0.35 * 0.75
    // 单次满攻伤害（玻璃 hp 恰好等于它 → 满攻击碎）
    CollisionDetection.fullHitDamage = 10
    // 砸落加成：无直射角度时小鸟走抛物线从结构上方俯冲，
    // 垂直方向累积的自由落体速度按此系数追加伤害（上限 vy=18 时 +27）
    CollisionDetection.divestBonus = 1.5
  }

  static checkBirdWithGround(bird, groundY) {
    if (!bird || !bird.used) return
    const bottom = bird.y + bird.radius
    if (bottom >= groundY) {
      bird.y = groundY - bird.radius
      bird.vy *= -0.3
      bird.vx *= 0.5
      // 速度极小时直接停止微弹跳
      if (Math.abs(bird.vy) < 0.5) bird.vy = 0
    }
    // 左右墙不反弹：小鸟可以飞出屏幕，由 update 的出屏判定结束本轮飞行
  }

  // 材料强度表（按易击碎程度排：玻璃 < 板材 < 石头）。
  // 撞击伤害统一走"满攻归一化"（见 checkBirdWithBlocks），不再各材料单独配伤害系数；
  // push = 被撞飞冲量系数（越硬推得越远），fallDamage = 方块自由落体摔地伤害系数
  //（玻璃摔地最脆、石头几乎耐摔）。
  static MATERIALS = {
    glass: { push: 0.9, fallDamage: 1.0 },
    board: { push: 1.2, fallDamage: 0.7 },
    stone: { push: 1.5, fallDamage: 0.35 }
  }

  static checkBirdWithBlocks(bird, blocks) {
    if (!bird || !bird.used || bird.gone) return
    const bx = bird.x
    const by = bird.y
    const br = bird.radius

    blocks.forEach(block => {
      if (block.hp <= 0) return

      const closestX = Math.max(block.x, Math.min(bx, block.x + block.w))
      const closestY = Math.max(block.y, Math.min(by, block.y + block.h))
      const dx = bx - closestX
      const dy = by - closestY
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < br) {
        const overlap = br - dist
        const nx = dist > 0 ? dx / dist : 0
        const ny = dist > 0 ? dy / dist : -1

        bird.x += nx * overlap
        bird.y += ny * overlap

        const mat = CollisionDetection.MATERIALS[block.type] || CollisionDetection.MATERIALS.board
        // 沿法向的接近速度（正数 = 正在撞进去）
        const impactSpeed = Math.abs(bird.vx * nx + bird.vy * ny)

        // 真实撞击才结算伤害/推挤：接近速度低于阈值视为贴靠（静置）接触，
        // 只做位置分离，防止小鸟停在方块上时每帧磨掉少量血
        if (impactSpeed > 1.5) {
          // 满攻归一化：冲击 ≥ fullHitSpeed 的一击 = 一次满攻（fullHitDamage），
          // 与 block.js 血量对齐 → 玻璃 1 次满攻击碎、板材 1.5 次、石头 2 次
          let damage = Math.min(impactSpeed / CollisionDetection.fullHitSpeed, 1) *
                       CollisionDetection.fullHitDamage

          // 砸落加成：无直射角度时，小鸟从结构上方沿抛物线俯冲砸中顶面，
          // 垂直自由落体速度叠加额外伤害，加大砸落/自由落体的破坏力
          if (bird.vy > 0 && ny < -0.5) {
            damage += Math.min(bird.vy, 18) * CollisionDetection.divestBonus
          }

          block.hp -= damage

          const wasAlive = block.hp > 0
          if (block.hp <= 0) {
            block.hp = 0
            if (wasAlive) soundManager.playBlockBreak(block.type)
          } else {
            soundManager.playHitBlock(block.type)
          }

          // 推挤冲量：越硬的材料被推得越狠（石头 1.5 / 板材 1.2 / 玻璃 0.9）
          // n 从方块指向小鸟，方块应被沿小鸟运动方向（-n）推走
          const pushForce = impactSpeed * mat.push
          block.vx -= nx * pushForce
          block.vy -= ny * pushForce
        }

        // 真实撞击才反弹：按法向做带能量损失的镜面反射（恢复系数 0.55），
        // 保留大部分切向动能，让小鸟撞穿结构后还有余力继续破坏
        const vn = bird.vx * nx + bird.vy * ny
        if (vn < -0.5) {
          const restitution = 0.55
          bird.vx -= (1 + restitution) * vn * nx
          bird.vy -= (1 + restitution) * vn * ny
        }
      }
    })
  }

  static checkBirdWithPigs(bird, pigs) {
    if (!bird || !bird.used || bird.gone) return
    pigs.forEach(pig => {
      if (!pig.alive) return
      const dx = bird.x - pig.x
      const dy = bird.y - pig.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      const minDist = bird.radius + pig.radius

      if (dist < minDist) {
        const overlap = minDist - dist
        const nx = dist > 0 ? dx / dist : 0
        const ny = dist > 0 ? dy / dist : -1

        bird.x += nx * overlap
        bird.y += ny * overlap

        const impactSpeed = Math.abs(bird.vx * nx + bird.vy * ny)
        // 伤害系数 6：正常命中（冲击 ~10）即可打出 60+ 伤害，一击致命
        const damage = impactSpeed * 6

        const wasAlive = pig.alive
        pig.takeDamage(damage)
        if (!pig.alive && wasAlive) {
          soundManager.playPigDeath()
        } else if (impactSpeed > 1) {
          soundManager.playHitPig()
        }

        // 小猪被撞得飞出去：冲量加大；
        // n 从猪指向小鸟，猪应被沿小鸟运动方向（-n）撞飞
        pig.vx -= nx * impactSpeed * 1.1
        pig.vy -= ny * impactSpeed * 1.1

        // 小鸟按法向弹性反射（恢复系数 0.5），保留动能继续横扫
        const vn = bird.vx * nx + bird.vy * ny
        if (vn < -0.5) {
          const restitution = 0.5
          bird.vx -= (1 + restitution) * vn * nx
          bird.vy -= (1 + restitution) * vn * ny
        }
      }
    })
  }

  static checkBlocksWithGround(blocks, groundY) {
    blocks.forEach(block => {
      if (block.hp <= 0) return
      if (block.y + block.h >= groundY) {
        const wasAirborne = !block.onGround
        // 修复：必须在反弹前读取落地冲击速度，
        // 旧代码先 vy *= -0.2 再结算，冲击被砍到 20%，方块摔地几乎不掉血
        const fallSpeed = Math.abs(block.vy)
        block.y = groundY - block.h
        block.vy *= -0.2
        block.vx *= 0.4
        block.onGround = true
        // 只有从空中落地时才计算伤害，防止地面连续伤害；
        // 分材料结算：玻璃摔地最脆，板材次之，石头几乎耐摔
        if (wasAirborne && fallSpeed > 2) {
          const mat = CollisionDetection.MATERIALS[block.type] || CollisionDetection.MATERIALS.board
          block.hp -= fallSpeed * mat.fallDamage
          if (block.hp <= 0) {
            block.hp = 0
            soundManager.playBlockBreak(block.type)
          }
        }
        // 如果速度极小，直接停止，防止微弹跳
        if (Math.abs(block.vy) < 0.5) {
          block.vy = 0
          block.vx *= 0.3
        }
      } else {
        block.onGround = false
      }
    })
  }

  static checkPigsWithGround(pigs, groundY) {
    pigs.forEach(pig => {
      if (!pig.alive) return
      if (pig.y + pig.radius >= groundY) {
        const wasAirborne = !pig.onGround
        // 修复：必须在反弹前读取落地冲击速度，
        // 旧代码先 vy *= -0.2 再结算，猪从高处摔下也不掉血
        const fallSpeed = Math.abs(pig.vy)
        // 必须在清零前读取：本次落地是否源自"方块支撑"
        const wasOnBlock = pig.onBlock
        pig.y = groundY - pig.radius
        pig.vy *= -0.2
        pig.vx *= 0.4
        pig.onGround = true
        // 落地后不再算"方块支撑"，下一次离开地面重新判定
        pig.onBlock = false
        // 只有从空中落地时才结算自由落体（物理已恢复真实自由落体，无 0.7 衰减）：
        // 1) 站在方块上失去支撑的猪 → 自由落地即判死；
        // 2) 其他高空坠落：冲击 > 12px/帧（重力 0.5 下约 144px 高度）直接摔死，
        //    否则按 x3.5 系数结算（~130px 摔落即可摔死 40 血的猪）
        if (wasAirborne && fallSpeed > 2) {
          const wasAlive = pig.alive
          if (wasOnBlock || fallSpeed > 12) {
            pig.takeDamage(9999)
          } else {
            pig.takeDamage(fallSpeed * 3.5)
          }
          if (!pig.alive && wasAlive) {
            // 摔死也要有死亡反馈（粒子/震屏由 pollEffects 统一触发）
            soundManager.playPigDeath()
          }
        }
        // 如果速度极小，直接停止，防止微弹跳
        if (Math.abs(pig.vy) < 0.5) {
          pig.vy = 0
          pig.vx *= 0.3
        }
      } else {
        pig.onGround = false
      }
    })
  }

  // 新增：方块与方块的碰撞检测
  static checkBlocksWithBlocks(blocks) {
    for (let i = 0; i < blocks.length; i++) {
      for (let j = i + 1; j < blocks.length; j++) {
        const b1 = blocks[i]
        const b2 = blocks[j]
        
        if (b1.hp <= 0 || b2.hp <= 0) continue

        // 计算重叠
        const overlapX = Math.max(0, 
          Math.min(b1.x + b1.w, b2.x + b2.w) - Math.max(b1.x, b2.x))
        const overlapY = Math.max(0, 
          Math.min(b1.y + b1.h, b2.y + b2.h) - Math.max(b1.y, b2.y))

        if (overlapX > 0 && overlapY > 0) {
          // 决定从哪个方向推动（最小重叠方向）
          if (overlapX < overlapY) {
            // 水平推动
            const pushDir = (b1.x + b1.w / 2) < (b2.x + b2.w / 2) ? -1 : 1
            const totalMass = 2 // 简化质量
            b1.x += pushDir * overlapX / totalMass
            b2.x -= pushDir * overlapX / totalMass

            // 沿法向的接近速度：<=0 表示正在分离或静置
            const approach = b1.vx * pushDir - b2.vx * pushDir
            if (approach > 0.5) {
              // 真实撞击：速度交换（弹性碰撞）
              const tempVx = b1.vx
              b1.vx = b2.vx * 0.5
              b2.vx = tempVx * 0.5
            } else {
              // 贴靠（静置）接触：让法向速度强衰减，
              // 否则上方方块的重力微振荡无法收敛到 allSettled 阈值以下
              b1.vx *= 0.2
              b2.vx *= 0.2
            }
          } else {
            // 垂直推动
            const pushDir = (b1.y + b1.h / 2) < (b2.y + b2.h / 2) ? -1 : 1
            const totalMass = 2
            b1.y += pushDir * overlapY / totalMass
            b2.y -= pushDir * overlapY / totalMass

            // 沿法向的接近速度：<=0 表示正在分离或静置
            const approach = b1.vy * pushDir - b2.vy * pushDir
            if (approach > 0.5) {
              // 真实撞击：速度交换
              const tempVy = b1.vy
              b1.vy = b2.vy * 0.5
              b2.vy = tempVy * 0.5
            } else {
              // 贴靠（静置）接触：法向速度强衰减，保证堆叠能收敛
              b1.vy *= 0.2
              b2.vy *= 0.2
            }
          }
        }
      }
    }
  }

  // 新增：小猪与方块的碰撞检测
  static checkPigsWithBlocks(pigs, blocks) {
    pigs.forEach(pig => {
      if (!pig.alive) return
      
      blocks.forEach(block => {
        if (block.hp <= 0) return
        
        // 找到最近点
        const closestX = Math.max(block.x, Math.min(pig.x, block.x + block.w))
        const closestY = Math.max(block.y, Math.min(pig.y, block.y + block.h))
        const dx = pig.x - closestX
        const dy = pig.y - closestY
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < pig.radius) {
          const overlap = pig.radius - dist
          const nx = dist > 0 ? dx / dist : 0
          const ny = dist > 0 ? dy / dist : -1

          pig.x += nx * overlap
          pig.y += ny * overlap

          const impactSpeed = Math.sqrt(pig.vx * pig.vx + pig.vy * pig.vy)
          // 仅在真实撞击（速度足够）时施加冲量：
          // 原代码在贴靠状态下每帧注入固定 1px/帧 速度，
          // 会让猪永远振荡、沉降阶段无法结束，导致游戏软锁
          if (impactSpeed > 0.5) {
            // 方块应被沿小猪运动方向（-n，n 从方块指向猪）推走
            const pushForce = impactSpeed * 0.5
            block.vx -= nx * pushForce
            block.vy -= ny * pushForce

            pig.vx = -pig.vx * 0.3 + nx * impactSpeed * 0.3
            pig.vy = -pig.vy * 0.3 + ny * impactSpeed * 0.3
          } else {
            // 贴靠（静置）接触：只分离位置，同时让双方速度强衰减，
            // 保证重力微振荡能收敛到 allSettled 阈值（0.05）以下
            // （例如结构塌落后方块压在猪身上、猪坐在方块顶面）
            pig.vx *= 0.2
            pig.vy *= 0.2
            block.vx *= 0.2
            block.vy *= 0.2
          }

          // 支撑记录：猪在方块顶面（方块在猪下方）→ 标记为方块支撑。
          // 之后支撑被击碎、猪失去支撑自由落地时，checkPigsWithGround 会判其死亡
          if (ny < -0.5) pig.onBlock = true
        }
      })
    })
  }

  // 新增：小猪与小猪的碰撞检测
  static checkPigsWithPigs(pigs) {
    for (let i = 0; i < pigs.length; i++) {
      for (let j = i + 1; j < pigs.length; j++) {
        const p1 = pigs[i]
        const p2 = pigs[j]
        
        if (!p1.alive || !p2.alive) continue

        const dx = p1.x - p2.x
        const dy = p1.y - p2.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const minDist = p1.radius + p2.radius

        if (dist < minDist && dist > 0) {
          const overlap = minDist - dist
          const nx = dx / dist
          const ny = dy / dist

          p1.x += nx * overlap / 2
          p1.y += ny * overlap / 2
          p2.x -= nx * overlap / 2
          p2.y -= ny * overlap / 2

          // 交换速度
          const tempVx = p1.vx
          const tempVy = p1.vy
          p1.vx = p2.vx * 0.5
          p1.vy = p2.vy * 0.5
          p2.vx = tempVx * 0.5
          p2.vy = tempVy * 0.5
        }
      }
    }
  }
}



// ===== main-browser.js =====

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

  // 留边距，确保按钮和提示文字不超出
  const margin = 20
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

const physics = new Physics(screenWidth, screenHeight)
const groundY = screenHeight - 60
// 满拉距离 150（与 update 中的 maxPull 一致），用于满攻伤害归一化
CollisionDetection.init(screenWidth, 150)

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
      const dist = Math.sqrt(dx * dx + dy * dy)
      const maxPull = 150
      
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
            // 小鸟已静止：同样启动淡出。旧代码走这条分支时不会置 disappearing，
            // 小鸟就残留在地面上，换下一只鸟后依然一直渲染（"发射后的小鸟没有消失"）
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


})()
