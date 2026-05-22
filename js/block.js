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
  }

  getMaxHp() {
    switch (this.type) {
      case 'wood': return 30
      case 'ice': return 20
      case 'stone': return 60
      default: return 30
    }
  }

  getColor() {
    const ratio = this.hp / this.maxHp
    switch (this.type) {
      case 'wood':
        if (ratio > 0.6) return '#8B5E3C'
        if (ratio > 0.3) return '#A0704A'
        return '#6B3F2A'
      case 'ice':
        if (ratio > 0.6) return '#87CEEB'
        if (ratio > 0.3) return '#6BB5D9'
        return '#4A9BC4'
      case 'stone':
        if (ratio > 0.6) return '#7F8C8D'
        if (ratio > 0.3) return '#6C7A7B'
        return '#566162'
      default: return '#8B5E3C'
    }
  }

  render(ctx) {
    if (this.hp <= 0) return

    ctx.save()

    ctx.fillStyle = this.getColor()
    ctx.fillRect(this.x, this.y, this.w, this.h)

    ctx.strokeStyle = 'rgba(0,0,0,0.4)'
    ctx.lineWidth = 2
    ctx.strokeRect(this.x, this.y, this.w, this.h)

    if (this.type === 'wood') {
      ctx.strokeStyle = 'rgba(0,0,0,0.15)'
      ctx.lineWidth = 1
      for (let i = 0; i < 3; i++) {
        ctx.beginPath()
        ctx.moveTo(this.x, this.y + this.h * (i + 1) / 4)
        ctx.lineTo(this.x + this.w, this.y + this.h * (i + 1) / 4)
        ctx.stroke()
      }
    }

    if (this.type === 'ice') {
      ctx.fillStyle = 'rgba(255,255,255,0.2)'
      ctx.fillRect(this.x + 4, this.y + 2, this.w * 0.3, this.h * 0.5)
    }

    if (this.type === 'stone') {
      ctx.fillStyle = 'rgba(255,255,255,0.1)'
      ctx.fillRect(this.x + 3, this.y + 2, this.w * 0.2, this.h * 0.3)
      ctx.fillRect(this.x + this.w * 0.4, this.y + this.h * 0.5, this.w * 0.3, this.h * 0.3)
    }

    if (this.hp < this.maxHp * 0.5) {
      ctx.strokeStyle = 'rgba(0,0,0,0.6)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(this.x, this.y)
      ctx.lineTo(this.x + this.w, this.y + this.h)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(this.x + this.w, this.y)
      ctx.lineTo(this.x, this.y + this.h)
      ctx.stroke()
    }

    ctx.restore()
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