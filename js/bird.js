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
  }

  render(ctx) {
    if (!this.active && !this.used) return
    if (this.used && !this.active) {
      if (this.y > 800) return
    }

    ctx.save()

    ctx.fillStyle = this.color
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = 'rgba(0,0,0,0.3)'
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.fillStyle = 'white'
    ctx.beginPath()
    ctx.arc(this.x - 6, this.y - 6, 6, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(this.x + 6, this.y - 6, 6, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#222'
    ctx.beginPath()
    ctx.arc(this.x - 4, this.y - 7, 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(this.x + 8, this.y - 7, 3, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#F39C12'
    ctx.beginPath()
    ctx.moveTo(this.x - 2, this.y + 2)
    ctx.lineTo(this.x + 4, this.y + 2)
    ctx.lineTo(this.x + 1, this.y + 8)
    ctx.closePath()
    ctx.fill()

    if (this.pulling) {
      ctx.fillStyle = '#FF6B6B'
      ctx.beginPath()
      ctx.arc(this.x - 10, this.y - 14, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(this.x + 10, this.y - 14, 4, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.restore()
  }
}

export { Bird }