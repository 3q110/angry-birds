class Scenes {
  constructor(screenWidth, screenHeight) {
    this.width = screenWidth
    this.height = screenHeight
    this.clouds = this.generateClouds()
    this.hills = this.generateHills()
    this.birds = this.generateBackgroundBirds()
  }

  generateClouds() {
    const clouds = []
    for (let i = 0; i < 7; i++) {
      clouds.push({
        x: Math.random() * this.width,
        y: 25 + Math.random() * 100,
        w: 70 + Math.random() * 90,
        h: 28 + Math.random() * 25,
        speed: 0.15 + Math.random() * 0.25
      })
    }
    return clouds
  }

  generateHills() {
    const hills = []
    for (let i = 0; i < 5; i++) {
      hills.push({
        x: i * 220 - 80,
        w: 180 + Math.random() * 160,
        h: 60 + Math.random() * 70,
        shade: 0.6 + Math.random() * 0.4
      })
    }
    return hills
  }
  
  generateBackgroundBirds() {
    const birds = []
    for (let i = 0; i < 5; i++) {
      birds.push({
        x: Math.random() * this.width,
        y: 50 + Math.random() * 120,
        speed: 0.8 + Math.random() * 0.7,
        amplitude: 8 + Math.random() * 10,
        frequency: 0.02 + Math.random() * 0.02,
        phase: Math.random() * Math.PI * 2,
        size: 8 + Math.random() * 5
      })
    }
    return birds
  }

  drawBackground(ctx) {
    // 天空渐变
    const skyGradient = ctx.createLinearGradient(0, 0, 0, this.height)
    skyGradient.addColorStop(0, '#2980b9')
    skyGradient.addColorStop(0.2, '#3498db')
    skyGradient.addColorStop(0.5, '#5dade2')
    skyGradient.addColorStop(0.8, '#85c1e9')
    skyGradient.addColorStop(1, '#aed6f1')
    ctx.fillStyle = skyGradient
    ctx.fillRect(0, 0, this.width, this.height)
    
    // 太阳/光晕
    const sunGradient = ctx.createRadialGradient(100, 80, 0, 100, 80, 150)
    sunGradient.addColorStop(0, 'rgba(255, 204, 0, 0.35)')
    sunGradient.addColorStop(0.5, 'rgba(255, 165, 0, 0.2)')
    sunGradient.addColorStop(1, 'rgba(255, 165, 0, 0)')
    ctx.fillStyle = sunGradient
    ctx.beginPath()
    ctx.arc(100, 80, 150, 0, Math.PI * 2)
    ctx.fill()
    
    // 太阳
    ctx.fillStyle = '#f1c40f'
    ctx.shadowColor = '#f39c12'
    ctx.shadowBlur = 25
    ctx.beginPath()
    ctx.arc(100, 80, 30, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0

    this.drawClouds(ctx)
    this.drawBackgroundBirds(ctx)
    this.drawHills(ctx)
  }

  drawClouds(ctx) {
    this.clouds.forEach(cloud => {
      cloud.x += cloud.speed
      if (cloud.x > this.width + 120) {
        cloud.x = -cloud.w - 50
        cloud.y = 25 + Math.random() * 100
      }

      // 云朵阴影
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
      ctx.beginPath()
      ctx.ellipse(cloud.x + 3, cloud.y + 5, cloud.w / 2, cloud.h / 2, 0, 0, Math.PI * 2)
      ctx.fill()
      
      // 主云朵
      ctx.fillStyle = 'rgba(255, 255, 255, 0.92)'
      ctx.beginPath()
      ctx.ellipse(cloud.x, cloud.y, cloud.w / 2, cloud.h / 2, 0, 0, Math.PI * 2)
      ctx.fill()

      // 左云朵
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
      ctx.beginPath()
      ctx.ellipse(cloud.x - cloud.w * 0.32, cloud.y + cloud.h * 0.18, cloud.w * 0.38, cloud.h * 0.42, 0, 0, Math.PI * 2)
      ctx.fill()

      // 右云朵
      ctx.fillStyle = 'rgba(255, 255, 255, 0.88)'
      ctx.beginPath()
      ctx.ellipse(cloud.x + cloud.w * 0.28, cloud.y + cloud.h * 0.12, cloud.w * 0.33, cloud.h * 0.48, 0, 0, Math.PI * 2)
      ctx.fill()
      
      // 中间点缀
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)'
      ctx.beginPath()
      ctx.ellipse(cloud.x, cloud.y - cloud.h * 0.15, cloud.w * 0.25, cloud.h * 0.35, 0, 0, Math.PI * 2)
      ctx.fill()
    })
  }
  
  drawBackgroundBirds(ctx) {
    this.birds.forEach(bird => {
      bird.x += bird.speed
      bird.phase += 0.1
      
      if (bird.x > this.width + 50) {
        bird.x = -50
        bird.y = 50 + Math.random() * 120
        bird.phase = Math.random() * Math.PI * 2
      }
      
      const wingAngle = Math.sin(bird.phase) * 0.5
      const bob = Math.sin(bird.phase * bird.frequency) * bird.amplitude
      
      ctx.save()
      ctx.translate(bird.x, bird.y + bob)
      
      // 身体
      ctx.fillStyle = '#2c3e50'
      ctx.beginPath()
      ctx.ellipse(0, 0, bird.size, bird.size * 0.4, 0, 0, Math.PI * 2)
      ctx.fill()
      
      // 翅膀
      ctx.strokeStyle = '#2c3e50'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.quadraticCurveTo(-bird.size * 0.8, -bird.size * wingAngle, -bird.size * 1.3, 0)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.quadraticCurveTo(bird.size * 0.8, -bird.size * wingAngle, bird.size * 1.3, 0)
      ctx.stroke()
      
      ctx.restore()
    })
  }

  drawHills(ctx) {
    // 远山（暗色）
    this.hills.forEach((hill, index) => {
      if (index % 2 === 0) {
        const color = `rgba(${Math.floor(100 * hill.shade)}, ${Math.floor(150 * hill.shade)}, ${Math.floor(100 * hill.shade)}, 0.6)`
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.ellipse(hill.x + hill.w / 2, this.height - 40, hill.w / 2, hill.h * 0.7, 0, Math.PI, 0)
        ctx.fill()
      }
    })
    
    // 近山（亮色）
    this.hills.forEach((hill, index) => {
      if (index % 2 === 1) {
        const color = `rgba(${Math.floor(120 * hill.shade)}, ${Math.floor(200 * hill.shade)}, ${Math.floor(80 * hill.shade)}, 0.8)`
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.ellipse(hill.x + hill.w / 2, this.height - 50, hill.w / 2, hill.h, 0, Math.PI, 0)
        ctx.fill()
      }
    })
  }
}

export { Scenes }