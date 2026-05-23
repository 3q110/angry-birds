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
    
    const bodyGradient = ctx.createRadialGradient(
      cx - this.radius * 0.3, cy - this.radius * 0.3, 0,
      cx, cy, this.radius
    )
    if (ratio > 0.6) {
      bodyGradient.addColorStop(0, '#66BB6A')
      bodyGradient.addColorStop(0.5, '#4CAF50')
      bodyGradient.addColorStop(1, '#388E3C')
    } else if (ratio > 0.3) {
      bodyGradient.addColorStop(0, '#5DBB63')
      bodyGradient.addColorStop(0.5, '#43A047')
      bodyGradient.addColorStop(1, '#2E7D32')
    } else {
      bodyGradient.addColorStop(0, '#4CAF50')
      bodyGradient.addColorStop(0.5, '#388E3C')
      bodyGradient.addColorStop(1, '#2E7D32')
    }
    
    ctx.fillStyle = bodyGradient
    ctx.beginPath()
    ctx.arc(cx, cy, this.radius, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.strokeStyle = '#1B5E20'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(cx, cy, this.radius, 0, Math.PI * 2)
    ctx.stroke()
    
    ctx.fillStyle = '#81C784'
    ctx.beginPath()
    ctx.ellipse(cx - this.radius * 0.9, cy - this.radius * 0.3, 8, 10, -0.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(cx + this.radius * 0.9, cy - this.radius * 0.3, 8, 10, 0.5, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.strokeStyle = '#388E3C'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.ellipse(cx - this.radius * 0.9, cy - this.radius * 0.3, 8, 10, -0.5, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.ellipse(cx + this.radius * 0.9, cy - this.radius * 0.3, 8, 10, 0.5, 0, Math.PI * 2)
    ctx.stroke()
    
    ctx.fillStyle = 'white'
    ctx.beginPath()
    ctx.ellipse(cx - 6, cy - 4, 6, 7, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(cx + 6, cy - 4, 6, 7, 0, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.ellipse(cx - 6, cy - 4, 6, 7, 0, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.ellipse(cx + 6, cy - 4, 6, 7, 0, 0, Math.PI * 2)
    ctx.stroke()
    
    ctx.fillStyle = '#222'
    if (ratio > 0.5) {
      ctx.beginPath()
      ctx.arc(cx - 5, cy - 3, 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(cx + 7, cy - 3, 3, 0, Math.PI * 2)
      ctx.fill()
    } else {
      ctx.beginPath()
      ctx.moveTo(cx - 8, cy - 5)
      ctx.lineTo(cx - 3, cy - 1)
      ctx.moveTo(cx - 3, cy - 5)
      ctx.lineTo(cx - 8, cy - 1)
      ctx.stroke()
      
      ctx.beginPath()
      ctx.moveTo(cx + 4, cy - 5)
      ctx.lineTo(cx + 9, cy - 1)
      ctx.moveTo(cx + 9, cy - 5)
      ctx.lineTo(cx + 4, cy - 1)
      ctx.stroke()
    }
    
    ctx.fillStyle = 'white'
    ctx.beginPath()
    ctx.arc(cx - 4, cy - 5, 1.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(cx + 8, cy - 5, 1.5, 0, Math.PI * 2)
    ctx.fill()
    
    const snoutGradient = ctx.createRadialGradient(cx, cy + 3, 0, cx, cy + 3, 6)
    snoutGradient.addColorStop(0, '#F0B27A')
    snoutGradient.addColorStop(1, '#E59866')
    ctx.fillStyle = snoutGradient
    ctx.beginPath()
    ctx.ellipse(cx, cy + 3, 7, 5, 0, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.strokeStyle = '#D35400'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.ellipse(cx, cy + 3, 7, 5, 0, 0, Math.PI * 2)
    ctx.stroke()
    
    ctx.fillStyle = '#A04000'
    ctx.beginPath()
    ctx.ellipse(cx - 2.5, cy + 3, 1.5, 2, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(cx + 2.5, cy + 3, 1.5, 2, 0, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.strokeStyle = '#1B5E20'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.beginPath()
    if (ratio > 0.5) {
      ctx.moveTo(cx - 4, cy + 10)
      ctx.quadraticCurveTo(cx, cy + 13, cx + 4, cy + 10)
    } else {
      ctx.moveTo(cx - 5, cy + 9)
      ctx.quadraticCurveTo(cx, cy + 14, cx + 5, cy + 9)
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