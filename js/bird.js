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

export { Bird }