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

  getMaxHp() {
    switch (this.type) {
      case 'wood': return 30
      case 'ice': return 20
      case 'stone': return 60
      default: return 30
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
    
    if (this.type === 'wood') {
      this.renderWood(ctx, ratio)
    } else if (this.type === 'ice') {
      this.renderIce(ctx, ratio)
    } else if (this.type === 'stone') {
      this.renderStone(ctx, ratio)
    }
    
    if (this.hp < this.maxHp * 0.7) {
      this.drawCracks(ctx)
    }

    ctx.restore()
  }
  
  renderWood(ctx, ratio) {
    const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.h)
    if (ratio > 0.6) {
      gradient.addColorStop(0, '#A67C52')
      gradient.addColorStop(0.5, '#8B5A2B')
      gradient.addColorStop(1, '#6B4423')
    } else if (ratio > 0.3) {
      gradient.addColorStop(0, '#8B5A2B')
      gradient.addColorStop(0.5, '#704214')
      gradient.addColorStop(1, '#5C3317')
    } else {
      gradient.addColorStop(0, '#704214')
      gradient.addColorStop(0.5, '#5C3317')
      gradient.addColorStop(1, '#4A2810')
    }
    
    ctx.fillStyle = gradient
    this.drawRoundRect(ctx, this.x, this.y, this.w, this.h, 3)
    ctx.fill()
    
    ctx.strokeStyle = '#4A2810'
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
  
  renderIce(ctx, ratio) {
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
      gradient.addColorStop(0, '#95A5A6')
      gradient.addColorStop(0.3, '#7F8C8D')
      gradient.addColorStop(0.7, '#6C7A7B')
      gradient.addColorStop(1, '#5D6D7E')
    } else if (ratio > 0.3) {
      gradient.addColorStop(0, '#7F8C8D')
      gradient.addColorStop(0.3, '#6C7A7B')
      gradient.addColorStop(0.7, '#5D6D7E')
      gradient.addColorStop(1, '#4A5568')
    } else {
      gradient.addColorStop(0, '#6C7A7B')
      gradient.addColorStop(0.3, '#5D6D7E')
      gradient.addColorStop(0.7, '#4A5568')
      gradient.addColorStop(1, '#3D4852')
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
    
    ctx.strokeStyle = '#2C3E50'
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