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

    ctx.fillStyle = '#4CAF50'
    ctx.beginPath()
    ctx.arc(cx, cy, this.radius, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#66BB6A'
    ctx.beginPath()
    ctx.arc(cx - 2, cy - 2, this.radius * 0.85, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = '#2E7D32'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(cx, cy, this.radius, 0, Math.PI * 2)
    ctx.stroke()

    ctx.fillStyle = '#222'
    ctx.beginPath()
    ctx.arc(cx - 6, cy - 5, 3.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(cx + 6, cy - 5, 3.5, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = 'white'
    ctx.beginPath()
    ctx.arc(cx - 5, cy - 6, 1.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(cx + 7, cy - 6, 1.5, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#E8A0BF'
    ctx.beginPath()
    ctx.ellipse(cx + 1, cy + 2, 5, 3.5, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#D47A9E'
    ctx.beginPath()
    ctx.arc(cx + 1, cy + 2, 1.5, 0, Math.PI)
    ctx.fill()

    if (this.hp < this.maxHp * 0.5) {
      ctx.fillStyle = 'rgba(244,67,54,0.4)'
      ctx.beginPath()
      ctx.arc(cx, cy, this.radius, 0, Math.PI * 2)
      ctx.fill()
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