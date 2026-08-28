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

export { Pig }