class UI {
  // confetti 粒子在每次进入胜利界面时预生成一次，之后每帧更新位置
  static confetti = null
  static winShown = false
  static winFrame = 0
  static loseShown = false
  static loseFrame = 0

  static render(ctx, screenWidth, screenHeight, score, levelIndex, gameState, birds) {
    ctx.save()

    this.renderTopBar(ctx, screenWidth, score, levelIndex, birds)
    this.renderRemainingBirds(ctx, birds, screenWidth)

    if (gameState === 'win') {
      if (!this.winShown) {
        this.winShown = true
        this.winFrame = 0
        this.confetti = this.generateConfetti(screenWidth, screenHeight)
      }
      this.renderWinScreen(ctx, screenWidth, screenHeight, birds)
    } else {
      this.winShown = false
    }

    if (gameState === 'lose') {
      if (!this.loseShown) {
        this.loseShown = true
        this.loseFrame = 0
      }
      this.renderLoseScreen(ctx, screenWidth, screenHeight)
    } else {
      this.loseShown = false
    }

    ctx.restore()
  }

  // 回弹缓动：t ∈ [0,1]，先冲过头再回落
  static easeOutBack(t) {
    const c1 = 1.70158
    const c2 = c1 * 1.525
    return 1 + c2 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
  }

  static drawRoundRect(ctx, x, y, width, height, radius) {
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

  // 五芒星路径（顶点朝上）
  static drawStar(ctx, cx, cy, outerR, innerR) {
    ctx.beginPath()
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? outerR : innerR
      const a = -Math.PI / 2 + (i * Math.PI) / 5
      const px = cx + Math.cos(a) * r
      const py = cy + Math.sin(a) * r
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.closePath()
  }

  static renderTopBar(ctx, screenWidth, score, levelIndex, birds) {
    const x = 12, y = 12, w = screenWidth - 24, h = 48

    // 木质底牌
    const gradient = ctx.createLinearGradient(0, y, 0, y + h)
    gradient.addColorStop(0, '#C08850')
    gradient.addColorStop(0.5, '#A5722F')
    gradient.addColorStop(1, '#82552A')
    ctx.fillStyle = gradient
    this.drawRoundRect(ctx, x, y, w, h, 12)
    ctx.fill()

    // 深色描边 + 内侧高光
    ctx.strokeStyle = '#4A2810'
    ctx.lineWidth = 3
    this.drawRoundRect(ctx, x, y, w, h, 12)
    ctx.stroke()
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
    ctx.lineWidth = 1.5
    this.drawRoundRect(ctx, x + 3, y + 3, w - 6, h - 6, 9)
    ctx.stroke()

    // 木纹
    ctx.strokeStyle = 'rgba(74, 40, 16, 0.35)'
    ctx.lineWidth = 1.5
    for (let i = 0; i < 3; i++) {
      const ly = y + h * (0.28 + i * 0.22)
      ctx.beginPath()
      ctx.moveTo(x + 10, ly)
      for (let jx = x + 10; jx < x + w - 10; jx += 24) {
        ctx.quadraticCurveTo(jx + 12, ly + Math.sin(jx * 0.05) * 1.5, jx + 24, ly)
      }
      ctx.stroke()
    }

    // 两端铁钉
    ctx.fillStyle = '#D7CCC8'
    ctx.strokeStyle = '#8D6E63'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(x + 16, y + h / 2, 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(x + w - 16, y + h / 2, 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    // 分数
    ctx.fillStyle = '#FFE082'
    ctx.shadowColor = 'rgba(255, 213, 79, 0.55)'
    ctx.shadowBlur = 10
    ctx.font = 'bold 22px "Arial Black", sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(`⭐ ${score}`, 32, 44)
    ctx.shadowBlur = 0

    // 关卡
    ctx.fillStyle = '#FFF8E1'
    ctx.shadowColor = 'rgba(255, 248, 225, 0.45)'
    ctx.shadowBlur = 10
    ctx.font = 'bold 22px "Arial Black", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`🎮 第 ${levelIndex + 1} 关`, screenWidth / 2, 44)
    ctx.shadowBlur = 0

    // 剩余小鸟
    ctx.fillStyle = '#FFCDD2'
    ctx.shadowColor = 'rgba(255, 205, 210, 0.45)'
    ctx.shadowBlur = 10
    ctx.textAlign = 'right'
    ctx.font = 'bold 20px "Arial Black", sans-serif'
    const remaining = birds.filter(b => !b.used).length
    ctx.fillText(`🐦 x ${remaining}`, screenWidth - 32, 44)
    ctx.shadowBlur = 0
  }

  static renderRemainingBirds(ctx, birds, screenWidth) {
    let x = screenWidth - 105
    const y = 82
    const spacing = 32

    let count = 0
    for (let i = birds.length - 1; i >= 0; i--) {
      if (!birds[i].used) {
        const colors = ['#E74C3C', '#3498DB', '#F1C40F', '#2ECC71', '#E67E22', '#9B59B6']
        const color = colors[birds[i].index % colors.length]

        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
        ctx.beginPath()
        ctx.arc(x + 2, y + 3, 12, 0, Math.PI * 2)
        ctx.fill()

        const gradient = ctx.createRadialGradient(x - 3, y - 3, 0, x, y, 12)
        gradient.addColorStop(0, this.lightenColor(color, 35))
        gradient.addColorStop(0.6, color)
        gradient.addColorStop(1, this.darkenColor(color, 25))

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(x, y, 12, 0, Math.PI * 2)
        ctx.fill()

        ctx.strokeStyle = this.darkenColor(color, 35)
        ctx.lineWidth = 2
        ctx.stroke()

        x -= spacing
        count++
        if (count >= 5) break
      }
    }
  }

  static renderWinScreen(ctx, screenWidth, screenHeight, birds) {
    this.winFrame++

    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)'
    ctx.fillRect(0, 0, screenWidth, screenHeight)

    const centerX = screenWidth / 2
    const centerY = screenHeight / 2

    // 标题弹跳入场
    const tScale = Math.min(1, this.winFrame / 24)
    const scale = tScale < 1 ? this.easeOutBack(tScale) : 1
    ctx.save()
    ctx.translate(centerX, centerY - 50)
    ctx.scale(scale, scale)
    ctx.fillStyle = '#2ECC71'
    ctx.shadowColor = 'rgba(46, 204, 113, 0.8)'
    ctx.shadowBlur = 20
    ctx.font = 'bold 56px "Arial Black", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('🎉 恭喜过关! 🎉', 0, 0)
    ctx.shadowBlur = 0
    ctx.restore()

    // 星级评价：按剩余小鸟数给 1~3 星，逐颗回弹入场
    const remaining = birds.filter(b => !b.used).length
    const stars = remaining >= 2 ? 3 : remaining === 1 ? 2 : 1
    for (let i = 0; i < 3; i++) {
      const sx = centerX + (i - 1) * 70
      const sy = centerY + 18
      const start = 18 + i * 12
      const t = (this.winFrame - start) / 18
      if (t <= 0) continue
      const ss = t < 1 ? this.easeOutBack(t) : 1
      ctx.save()
      ctx.translate(sx, sy)
      ctx.scale(ss, ss)
      this.drawStar(ctx, 0, 0, 26, 11)
      if (i < stars) {
        ctx.fillStyle = '#FFD700'
        ctx.shadowColor = 'rgba(255, 215, 0, 0.8)'
        ctx.shadowBlur = 15
        ctx.fill()
        ctx.shadowBlur = 0
        ctx.strokeStyle = '#E6A800'
        ctx.lineWidth = 2.5
        ctx.stroke()
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.18)'
        ctx.fill()
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
        ctx.lineWidth = 2
        ctx.stroke()
      }
      ctx.restore()
    }

    // 副标题与提示
    const fade = Math.min(1, Math.max(0, (this.winFrame - 30) / 20))
    ctx.globalAlpha = fade
    ctx.fillStyle = '#F1C40F'
    ctx.shadowColor = 'rgba(241, 196, 15, 0.6)'
    ctx.shadowBlur = 15
    ctx.font = 'bold 28px "Arial Black", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('⭐ 太棒了! ⭐', centerX, centerY + 72)
    ctx.shadowBlur = 0

    ctx.fillStyle = '#ECF0F1'
    ctx.font = '22px Arial, sans-serif'
    ctx.fillText('准备进入下一关...', centerX, centerY + 106)
    ctx.globalAlpha = 1

    this.updateConfetti(ctx, screenWidth, screenHeight)
  }

  static renderLoseScreen(ctx, screenWidth, screenHeight) {
    this.loseFrame++

    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)'
    ctx.fillRect(0, 0, screenWidth, screenHeight)

    const centerX = screenWidth / 2
    const centerY = screenHeight / 2

    const tScale = Math.min(1, this.loseFrame / 24)
    const scale = tScale < 1 ? this.easeOutBack(tScale) : 1
    ctx.save()
    ctx.translate(centerX, centerY - 40)
    ctx.scale(scale, scale)
    ctx.fillStyle = '#E74C3C'
    ctx.shadowColor = 'rgba(231, 76, 60, 0.8)'
    ctx.shadowBlur = 20
    ctx.font = 'bold 56px "Arial Black", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('💥 游戏失败 💥', 0, 0)
    ctx.shadowBlur = 0
    ctx.restore()

    const fade = Math.min(1, Math.max(0, (this.loseFrame - 18) / 20))
    ctx.globalAlpha = fade
    ctx.fillStyle = '#F39C12'
    ctx.shadowColor = 'rgba(243, 156, 18, 0.6)'
    ctx.shadowBlur = 15
    ctx.font = 'bold 28px "Arial Black", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('😢 再试一次! 😢', centerX, centerY + 40)
    ctx.shadowBlur = 0

    ctx.fillStyle = '#ECF0F1'
    ctx.font = '22px Arial, sans-serif'
    ctx.fillText('重新开始...', centerX, centerY + 78)
    ctx.globalAlpha = 1
  }

  static generateConfetti(screenWidth, screenHeight) {
    const colors = ['#E74C3C', '#3498DB', '#F1C40F', '#2ECC71', '#9B59B6', '#E67E22', '#FF8A65', '#4DD0E1']
    const particles = []
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * screenWidth,
        y: -Math.random() * screenHeight,
        size: 4 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        vy: 1.2 + Math.random() * 1.8,
        phase: Math.random() * Math.PI * 2,
        sway: 0.5 + Math.random() * 0.8,
        rot: Math.random() * Math.PI,
        vrot: (Math.random() - 0.5) * 0.2,
      })
    }
    return particles
  }

  // 彩带：下落 + 左右飘摆 + 自转，落出屏幕后从顶部循环
  static updateConfetti(ctx, screenWidth, screenHeight) {
    if (!this.confetti) return
    for (const p of this.confetti) {
      p.y += p.vy
      p.phase += 0.05
      p.x += Math.sin(p.phase) * p.sway
      p.rot += p.vrot
      if (p.y > screenHeight + 10) {
        p.y = -10
        p.x = Math.random() * screenWidth
      }
    }
    for (const p of this.confetti) {
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rot)
      // 沿一个轴缩放模拟纸片翻转
      ctx.scale(1, 0.5 + 0.5 * Math.abs(Math.sin(p.phase)))
      ctx.fillStyle = p.color
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size)
      ctx.restore()
    }
  }

  static lightenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16)
    const amt = Math.round(2.55 * percent)
    const R = Math.max(0, Math.min(255, (num >> 16) + amt))
    const G = Math.max(0, Math.min(255, ((num >> 8) & 0xFF) + amt))
    const B = Math.max(0, Math.min(255, (num & 0xFF) + amt))
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)
  }

  static darkenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16)
    const amt = Math.round(2.55 * percent)
    const R = Math.max(0, Math.min(255, (num >> 16) - amt))
    const G = Math.max(0, Math.min(255, ((num >> 8) & 0xFF) - amt))
    const B = Math.max(0, Math.min(255, (num & 0xFF) - amt))
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)
  }
}

export { UI }
