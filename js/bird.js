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
    this.rotation = 0
  }

  render(ctx) {
    if (!this.active && !this.used) return
    // 已使用且飞出屏幕边界的小鸟不渲染
    if (this.used && (this.y > 700 || this.x < -100 || this.x > 1000)) return

    ctx.save()
    ctx.translate(this.x, this.y)
    
    if (this.pulling) {
    } else if (this.active && this.used) {
      const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy)
      this.rotation = Math.atan2(this.vy, this.vx) + Math.PI
      ctx.rotate(this.rotation)
    }

    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius)
    gradient.addColorStop(0, this.lightenColor(this.color, 30))
    gradient.addColorStop(0.7, this.color)
    gradient.addColorStop(1, this.darkenColor(this.color, 20))
    
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = this.darkenColor(this.color, 30)
    ctx.lineWidth = 3
    ctx.stroke()

    ctx.fillStyle = '#2C3E50'
    ctx.beginPath()
    ctx.ellipse(-this.radius - 2, -4, 10, 7, -0.3, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(this.radius + 2, -4, 10, 7, 0.3, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = 'white'
    ctx.beginPath()
    ctx.ellipse(-7, -4, 7, 8, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(7, -4, 7, 8, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#222'
    ctx.beginPath()
    ctx.arc(-5, -3, 3.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(9, -3, 3.5, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = 'white'
    ctx.beginPath()
    ctx.arc(-4, -5, 1.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(10, -5, 1.5, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#F39C12'
    ctx.beginPath()
    ctx.moveTo(-3, 4)
    ctx.lineTo(5, 4)
    ctx.lineTo(2, 11)
    ctx.closePath()
    ctx.fill()
    
    ctx.fillStyle = '#E67E22'
    ctx.beginPath()
    ctx.moveTo(-1, 5)
    ctx.lineTo(3, 5)
    ctx.lineTo(1, 9)
    ctx.closePath()
    ctx.fill()

    ctx.strokeStyle = '#222'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.beginPath()
    if (this.pulling) {
      ctx.moveTo(-10, 8)
      ctx.quadraticCurveTo(0, 14, 10, 8)
    } else {
      ctx.moveTo(-8, 7)
      ctx.lineTo(8, 7)
    }
    ctx.stroke()

    if (this.pulling) {
      ctx.fillStyle = 'rgba(255, 107, 107, 0.6)'
      ctx.beginPath()
      ctx.ellipse(-12, 5, 4, 3, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.ellipse(12, 5, 4, 3, 0, 0, Math.PI * 2)
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