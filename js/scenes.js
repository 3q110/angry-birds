class Scenes {
  // 5 个关卡各配一套天气/时段主题：清晨 / 正午 / 黄昏 / 夜晚 / 风暴
  static THEMES = [
    {
      name: 'dawn',
      sky: [[0, '#FFB49B'], [0.25, '#FFCCA8'], [0.55, '#FFE6CE'], [0.8, '#FFF5DC'], [1, '#FFFBEF']],
      sun: { color: '#FFB74D', glow: 'rgba(255, 167, 100, 0.4)', r: 30 },
      cloud: 'rgba(255, 236, 224, 0.92)',
      hillFar: { r: 175, g: 130, b: 150, a: 0.6 },
      hillNear: { r: 150, g: 170, b: 100, a: 0.85 },
      ground: { dirt: '#B08A63', dirtDark: '#8E6C4A', grass: '#8BC34A', grassLight: '#C5E1A5' },
    },
    {
      name: 'noon',
      sky: [[0, '#42A0DC'], [0.2, '#55ADE3'], [0.5, '#79C4EE'], [0.8, '#A5D8F5'], [1, '#C6EBFC']],
      sun: { color: '#f1c40f', glow: 'rgba(255, 165, 0, 0.35)', r: 30 },
      cloud: 'rgba(255, 255, 255, 0.95)',
      hillFar: { r: 125, g: 175, b: 115, a: 0.6 },
      hillNear: { r: 135, g: 210, b: 90, a: 0.8 },
      ground: { dirt: '#AE8C6E', dirtDark: '#8A6B52', grass: '#86BF4B', grassLight: '#B5E08A' },
    },
    {
      name: 'dusk',
      sky: [[0, '#7A52A8'], [0.3, '#A568C4'], [0.55, '#D87FBE'], [0.78, '#F5A07A'], [1, '#FFC98E']],
      sun: { color: '#FF7043', glow: 'rgba(255, 112, 67, 0.4)', r: 34 },
      cloud: 'rgba(240, 218, 245, 0.9)',
      hillFar: { r: 135, g: 100, b: 155, a: 0.65 },
      hillNear: { r: 165, g: 125, b: 140, a: 0.85 },
      ground: { dirt: '#8D6E5C', dirtDark: '#6B4E3F', grass: '#93AE55', grassLight: '#C0D494' },
    },
    {
      name: 'night',
      sky: [[0, '#16294F'], [0.4, '#1E3560'], [0.75, '#28457C'], [1, '#33558F']],
      moon: true,
      cloud: 'rgba(150, 160, 200, 0.55)',
      hillFar: { r: 55, g: 70, b: 105, a: 0.7 },
      hillNear: { r: 68, g: 92, b: 75, a: 0.8 },
      ground: { dirt: '#6E584C', dirtDark: '#55443B', grass: '#5F8C46', grassLight: '#7FAF66' },
    },
    {
      name: 'storm',
      sky: [[0, '#4E6470'], [0.4, '#5C7480'], [0.75, '#6E8894'], [1, '#7E97A3']],
      cloud: 'rgba(130, 138, 148, 0.92)',
      hillFar: { r: 100, g: 108, b: 118, a: 0.6 },
      hillNear: { r: 110, g: 122, b: 100, a: 0.8 },
      ground: { dirt: '#816954', dirtDark: '#64503E', grass: '#78995A', grassLight: '#9CBB7E' },
    },
  ]

  constructor(screenWidth, screenHeight, levelIndex = 0) {
    this.width = screenWidth
    this.height = screenHeight
    // levelIndex 是 0 基索引，对应 THEMES 的 清晨/正午/黄昏/夜晚/风暴
    this.theme = Scenes.THEMES[levelIndex % Scenes.THEMES.length]
    this.clouds = this.generateClouds()
    this.hills = this.generateHills()
    this.birds = this.generateBackgroundBirds()
    this.stars = this.theme.name === 'night' ? this.generateStars() : []
    this.frame = 0
    this.grass = this.generateGrass(screenWidth)
    this.dirtSpots = this.generateDirtSpots(screenWidth)
  }

  generateStars() {
    const stars = []
    for (let i = 0; i < 40; i++) {
      stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height * 0.5,
        r: 0.6 + Math.random() * 1.4,
        tw: Math.random() * Math.PI * 2,
      })
    }
    return stars
  }

  // 地面草丛：沿整条地面线预生成，渲染时画成小三角形
  generateGrass(width) {
    const tufts = []
    for (let i = 0; i < Math.floor(width / 14); i++) {
      tufts.push({
        x: i * 14 + Math.random() * 8,
        h: 6 + Math.random() * 8,
        lean: (Math.random() - 0.5) * 6,
        light: Math.random() > 0.5,
      })
    }
    return tufts
  }

  // 泥土中的深色斑点（预生成避免每帧随机闪烁）
  generateDirtSpots(width) {
    const spots = []
    for (let i = 0; i < 45; i++) {
      spots.push({
        x: Math.random() * width,
        dy: 14 + Math.random() * 38,
        r: 1.5 + Math.random() * 3,
      })
    }
    return spots
  }

  generateClouds() {
    const clouds = []
    for (let i = 0; i < 7; i++) {
      clouds.push({
        x: Math.random() * this.width,
        y: 25 + Math.random() * 100,
        w: 70 + Math.random() * 90,
        h: 28 + Math.random() * 25,
        speed: 0.15 + Math.random() * 0.25,
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
        shade: 0.6 + Math.random() * 0.4,
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
        size: 8 + Math.random() * 5,
      })
    }
    return birds
  }

  drawBackground(ctx) {
    this.frame++
    const theme = this.theme

    // 天空渐变
    const skyGradient = ctx.createLinearGradient(0, 0, 0, this.height)
    theme.sky.forEach(([pos, color]) => skyGradient.addColorStop(pos, color))
    ctx.fillStyle = skyGradient
    ctx.fillRect(0, 0, this.width, this.height)

    // 夜晚：闪烁的星星
    if (this.stars.length > 0) {
      ctx.fillStyle = '#FFFFFF'
      this.stars.forEach(s => {
        const twinkle = 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(this.frame * 0.05 + s.tw))
        ctx.globalAlpha = twinkle
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fill()
      })
      ctx.globalAlpha = 1
    }

    // 太阳 / 月亮
    if (theme.moon) {
      const mx = 100, my = 80
      ctx.fillStyle = 'rgba(230, 235, 245, 0.15)'
      ctx.beginPath()
      ctx.arc(mx, my, 55, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ECEFF1'
      ctx.beginPath()
      ctx.arc(mx, my, 28, 0, Math.PI * 2)
      ctx.fill()
      // 环形山
      ctx.fillStyle = 'rgba(158, 168, 180, 0.55)'
      ctx.beginPath()
      ctx.arc(mx - 8, my - 6, 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(mx + 9, my + 7, 4.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(mx + 3, my - 12, 3, 0, Math.PI * 2)
      ctx.fill()
    } else if (theme.sun) {
      const s = theme.sun
      // 光晕
      const glow = ctx.createRadialGradient(100, 80, 0, 100, 80, 150)
      glow.addColorStop(0, s.glow)
      glow.addColorStop(0.5, 'rgba(255, 165, 0, 0.12)')
      glow.addColorStop(1, 'rgba(255, 165, 0, 0)')
      ctx.fillStyle = glow
      ctx.beginPath()
      ctx.arc(100, 80, 150, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = s.color
      ctx.shadowColor = s.color
      ctx.shadowBlur = 25
      ctx.beginPath()
      ctx.arc(100, 80, s.r, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
    }

    this.drawClouds(ctx)
    this.drawBackgroundBirds(ctx)
    this.drawHills(ctx)
  }

  // 地面：泥土 + 顶部草带 + 草丛 + 泥土斑点
  // groundY 为地面顶边，与 main 中一致（screenHeight - 60）
  drawGround(ctx, groundY) {
    const g = this.theme.ground
    const h = this.height - groundY

    ctx.fillStyle = g.dirt
    ctx.fillRect(0, groundY, this.width, h)

    // 顶部草带
    ctx.fillStyle = g.grass
    ctx.fillRect(0, groundY, this.width, 10)
    ctx.fillStyle = g.grassLight
    ctx.fillRect(0, groundY, this.width, 4)

    // 草丛
    this.grass.forEach(t => {
      ctx.fillStyle = t.light ? g.grassLight : g.grass
      ctx.beginPath()
      ctx.moveTo(t.x - 3, groundY + 4)
      ctx.lineTo(t.x + t.lean * 0.4, groundY + 4 - t.h)
      ctx.lineTo(t.x + 3, groundY + 4)
      ctx.closePath()
      ctx.fill()
    })

    // 泥土斑点
    ctx.fillStyle = g.dirtDark
    this.dirtSpots.forEach(s => {
      ctx.beginPath()
      ctx.arc(s.x, groundY + s.dy, s.r, 0, Math.PI * 2)
      ctx.fill()
    })
  }

  drawClouds(ctx) {
    const cloudColor = this.theme.cloud
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
      ctx.fillStyle = cloudColor
      ctx.beginPath()
      ctx.ellipse(cloud.x, cloud.y, cloud.w / 2, cloud.h / 2, 0, 0, Math.PI * 2)
      ctx.fill()

      // 左云朵
      ctx.globalAlpha = 0.85
      ctx.beginPath()
      ctx.ellipse(cloud.x - cloud.w * 0.32, cloud.y + cloud.h * 0.18, cloud.w * 0.38, cloud.h * 0.42, 0, 0, Math.PI * 2)
      ctx.fill()

      // 右云朵
      ctx.globalAlpha = 0.88
      ctx.beginPath()
      ctx.ellipse(cloud.x + cloud.w * 0.28, cloud.y + cloud.h * 0.12, cloud.w * 0.33, cloud.h * 0.48, 0, 0, Math.PI * 2)
      ctx.fill()

      // 中间点缀
      ctx.globalAlpha = 0.75
      ctx.beginPath()
      ctx.ellipse(cloud.x, cloud.y - cloud.h * 0.15, cloud.w * 0.25, cloud.h * 0.35, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    })
  }

  drawBackgroundBirds(ctx) {
    // 夜晚/风暴天色较暗，剪影鸟改浅色更清晰
    const silhouette = this.theme.name === 'night' ? '#9FB4D8' :
      this.theme.name === 'storm' ? '#263238' : '#2c3e50'
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
      ctx.fillStyle = silhouette
      ctx.beginPath()
      ctx.ellipse(0, 0, bird.size, bird.size * 0.4, 0, 0, Math.PI * 2)
      ctx.fill()

      // 翅膀
      ctx.strokeStyle = silhouette
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
    const theme = this.theme

    // 远山（暗色）
    this.hills.forEach((hill, index) => {
      if (index % 2 === 0) {
        const c = theme.hillFar
        ctx.fillStyle = `rgba(${Math.floor(c.r * hill.shade)}, ${Math.floor(c.g * hill.shade)}, ${Math.floor(c.b * hill.shade)}, ${c.a})`
        ctx.beginPath()
        ctx.ellipse(hill.x + hill.w / 2, this.height - 40, hill.w / 2, hill.h * 0.7, 0, Math.PI, 0)
        ctx.fill()
      }
    })

    // 近山（亮色）
    this.hills.forEach((hill, index) => {
      if (index % 2 === 1) {
        const c = theme.hillNear
        ctx.fillStyle = `rgba(${Math.floor(c.r * hill.shade)}, ${Math.floor(c.g * hill.shade)}, ${Math.floor(c.b * hill.shade)}, ${c.a})`
        ctx.beginPath()
        ctx.ellipse(hill.x + hill.w / 2, this.height - 50, hill.w / 2, hill.h, 0, Math.PI, 0)
        ctx.fill()
      }
    })
  }
}

export { Scenes }
