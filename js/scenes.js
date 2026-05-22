class Scenes {
  constructor(screenWidth, screenHeight) {
    this.width = screenWidth
    this.height = screenHeight
    this.clouds = this.generateClouds()
    this.hills = this.generateHills()
  }

  generateClouds() {
    const clouds = []
    for (let i = 0; i < 6; i++) {
      clouds.push({
        x: Math.random() * this.width,
        y: 30 + Math.random() * 80,
        w: 60 + Math.random() * 80,
        h: 25 + Math.random() * 20,
        speed: 0.2 + Math.random() * 0.3
      })
    }
    return clouds
  }

  generateHills() {
    const hills = []
    for (let i = 0; i < 4; i++) {
      hills.push({
        x: i * 250 - 50,
        w: 200 + Math.random() * 150,
        h: 50 + Math.random() * 60
      })
    }
    return hills
  }

  drawBackground(ctx) {
    const skyGradient = ctx.createLinearGradient(0, 0, 0, this.height)
    skyGradient.addColorStop(0, '#4A90D9')
    skyGradient.addColorStop(0.5, '#87CEEB')
    skyGradient.addColorStop(1, '#B0E0E6')
    ctx.fillStyle = skyGradient
    ctx.fillRect(0, 0, this.width, this.height)

    this.drawClouds(ctx)
    this.drawHills(ctx)
  }

  drawClouds(ctx) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    this.clouds.forEach(cloud => {
      cloud.x += cloud.speed
      if (cloud.x > this.width + 100) {
        cloud.x = -cloud.w
        cloud.y = 30 + Math.random() * 80
      }

      ctx.beginPath()
      ctx.ellipse(cloud.x, cloud.y, cloud.w / 2, cloud.h / 2, 0, 0, Math.PI * 2)
      ctx.fill()

      ctx.beginPath()
      ctx.ellipse(cloud.x - cloud.w * 0.3, cloud.y + cloud.h * 0.15, cloud.w * 0.35, cloud.h * 0.4, 0, 0, Math.PI * 2)
      ctx.fill()

      ctx.beginPath()
      ctx.ellipse(cloud.x + cloud.w * 0.25, cloud.y + cloud.h * 0.1, cloud.w * 0.3, cloud.h * 0.45, 0, 0, Math.PI * 2)
      ctx.fill()
    })
  }

  drawHills(ctx) {
    ctx.fillStyle = '#7EC850'
    this.hills.forEach(hill => {
      ctx.beginPath()
      ctx.ellipse(hill.x + hill.w / 2, this.height - 55, hill.w / 2, hill.h, 0, Math.PI, 0)
      ctx.fill()
    })
  }
}

export { Scenes }