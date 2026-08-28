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

export { Block }