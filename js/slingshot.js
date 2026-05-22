class Slingshot {
  constructor(x, y, screenWidth, screenHeight) {
    this.x = x
    this.y = y
    this.forkLeft = { x: x - 18, y: y - 50 }
    this.forkRight = { x: x + 18, y: y - 50 }
    this.baseY = y
    this.bandMaxLength = 80
  }

  render(ctx, bird, isAiming) {
    ctx.save()

    ctx.strokeStyle = '#5C3A1E'
    ctx.lineWidth = 4

    ctx.beginPath()
    ctx.moveTo(this.x, this.baseY)
    ctx.lineTo(this.forkLeft.x, this.forkLeft.y)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(this.x, this.baseY)
    ctx.lineTo(this.forkRight.x, this.forkRight.y)
    ctx.stroke()

    if (bird && isAiming) {
      ctx.strokeStyle = '#8B4513'
      ctx.lineWidth = 3

      ctx.beginPath()
      ctx.moveTo(this.forkLeft.x, this.forkLeft.y)
      ctx.lineTo(bird.x, bird.y)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(this.forkRight.x, this.forkRight.y)
      ctx.lineTo(bird.x, bird.y)
      ctx.stroke()
    } else if (bird && !bird.active) {
      ctx.strokeStyle = '#8B4513'
      ctx.lineWidth = 2

      ctx.beginPath()
      ctx.moveTo(this.forkLeft.x, this.forkLeft.y)
      ctx.lineTo(this.forkLeft.x + 10, this.forkLeft.y + 10)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(this.forkRight.x, this.forkRight.y)
      ctx.lineTo(this.forkRight.x - 10, this.forkRight.y + 10)
      ctx.stroke()
    }

    ctx.restore()
  }
}

export { Slingshot }