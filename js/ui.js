class UI {
  static render(ctx, screenWidth, screenHeight, score, levelIndex, gameState, birds) {
    ctx.save()
    
    this.renderTopBar(ctx, screenWidth, score, levelIndex, birds)
    this.renderRemainingBirds(ctx, birds, screenWidth)
    
    if (gameState === 'win') {
      this.renderWinScreen(ctx, screenWidth, screenHeight)
    }

    if (gameState === 'lose') {
      this.renderLoseScreen(ctx, screenWidth, screenHeight)
    }

    ctx.restore()
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
  
  static renderTopBar(ctx, screenWidth, score, levelIndex, birds) {
    // 主背景渐变
    const gradient = ctx.createLinearGradient(0, 0, 0, 60)
    gradient.addColorStop(0, 'rgba(30, 45, 59, 0.98)')
    gradient.addColorStop(0.5, 'rgba(44, 62, 80, 0.95)')
    gradient.addColorStop(1, 'rgba(52, 73, 94, 0.9)')
    ctx.fillStyle = gradient
    this.drawRoundRect(ctx, 12, 12, screenWidth - 24, 52, 14)
    ctx.fill()
    
    // 描边
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)'
    ctx.lineWidth = 2
    this.drawRoundRect(ctx, 12, 12, screenWidth - 24, 52, 14)
    ctx.stroke()
    
    // 内侧高亮
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.lineWidth = 1
    this.drawRoundRect(ctx, 16, 16, screenWidth - 32, 44, 10)
    ctx.stroke()
    
    // 分数
    ctx.fillStyle = '#F1C40F'
    ctx.shadowColor = 'rgba(241, 196, 15, 0.6)'
    ctx.shadowBlur = 14
    ctx.font = 'bold 24px "Arial Black", sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(`⭐ ${score}`, 35, 48)
    ctx.shadowBlur = 0
    
    // 关卡
    ctx.fillStyle = '#3498DB'
    ctx.shadowColor = 'rgba(52, 152, 219, 0.6)'
    ctx.shadowBlur = 14
    ctx.font = 'bold 24px "Arial Black", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`🎮 第 ${levelIndex + 1} 关`, screenWidth / 2, 48)
    ctx.shadowBlur = 0
    
    // 剩余小鸟
    ctx.fillStyle = '#E74C3C'
    ctx.shadowColor = 'rgba(231, 76, 60, 0.6)'
    ctx.shadowBlur = 14
    ctx.textAlign = 'right'
    ctx.font = 'bold 22px "Arial Black", sans-serif'
    const remaining = birds.filter(b => !b.used).length
    ctx.fillText(`🐦 x ${remaining}`, screenWidth - 35, 48)
    ctx.shadowBlur = 0
  }
  
  static renderRemainingBirds(ctx, birds, screenWidth) {
    let x = screenWidth - 110
    const y = 88
    const spacing = 34
    
    let count = 0
    for (let i = birds.length - 1; i >= 0; i--) {
      if (!birds[i].used) {
        const colors = ['#E74C3C', '#3498DB', '#F1C40F', '#2ECC71', '#E67E22', '#9B59B6']
        const color = colors[birds[i].index % colors.length]
        
        // 小鸟阴影
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
        ctx.beginPath()
        ctx.arc(x + 2, y + 3, 13, 0, Math.PI * 2)
        ctx.fill()
        
        const gradient = ctx.createRadialGradient(x - 3, y - 3, 0, x, y, 14)
        gradient.addColorStop(0, this.lightenColor(color, 40))
        gradient.addColorStop(0.6, color)
        gradient.addColorStop(
  
  static renderWinScreen(ctx, screenWidth, screenHeight) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)'
    ctx.fillRect(0, 0, screenWidth, screenHeight)
    
    const centerX = screenWidth / 2
    const centerY = screenHeight / 2
    
    ctx.fillStyle = 'rgba(46, 204, 113, 0.3)'
    ctx.beginPath()
    ctx.arc(centerX, centerY, 150, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.fillStyle = 'rgba(46, 204, 113, 0.2)'
    ctx.beginPath()
    ctx.arc(centerX, centerY, 120, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.fillStyle = '#2ECC71'
    ctx.shadowColor = 'rgba(46, 204, 113, 0.8)'
    ctx.shadowBlur = 20
    ctx.font = 'bold 56px "Arial Black", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('🎉 恭喜过关! 🎉', centerX, centerY - 20)
    ctx.shadowBlur = 0
    
    ctx.fillStyle = '#F1C40F'
    ctx.shadowColor = 'rgba(241, 196, 15, 0.6)'
    ctx.shadowBlur = 15
    ctx.font = 'bold 28px "Arial Black", sans-serif'
    ctx.fillText('⭐ 太棒了! ⭐', centerX, centerY + 30)
    ctx.shadowBlur = 0
    
    ctx.fillStyle = '#ECF0F1'
    ctx.font = '22px Arial, sans-serif'
    ctx.fillText('准备进入下一关...', centerX, centerY + 70)
    
    this.drawConfetti(ctx, screenWidth, screenHeight)
  }
  
  static renderLoseScreen(ctx, screenWidth, screenHeight) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)'
    ctx.fillRect(0, 0, screenWidth, screenHeight)
    
    const centerX = screenWidth / 2
    const centerY = screenHeight / 2
    
    ctx.fillStyle = 'rgba(231, 76, 60, 0.3)'
    ctx.beginPath()
    ctx.arc(centerX, centerY, 150, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.fillStyle = 'rgba(231, 76, 60, 0.2)'
    ctx.beginPath()
    ctx.arc(centerX, centerY, 120, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.fillStyle = '#E74C3C'
    ctx.shadowColor = 'rgba(231, 76, 60, 0.8)'
    ctx.shadowBlur = 20
    ctx.font = 'bold 56px "Arial Black", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('💥 游戏失败 💥', centerX, centerY - 20)
    ctx.shadowBlur = 0
    
    ctx.fillStyle = '#F39C12'
    ctx.shadowColor = 'rgba(243, 156, 18, 0.6)'
    ctx.shadowBlur = 15
    ctx.font = 'bold 28px "Arial Black", sans-serif'
    ctx.fillText('😢 再试一次! 😢', centerX, centerY + 30)
    ctx.shadowBlur = 0
    
    ctx.fillStyle = '#ECF0F1'
    ctx.font = '22px Arial, sans-serif'
    ctx.fillText('重新开始...', centerX, centerY + 70)
  }
  
  static drawConfetti(ctx, screenWidth, screenHeight) {
    const colors = ['#E74C3C', '#3498DB', '#F1C40F', '#2ECC71', '#9B59B6', '#E67E22']
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * screenWidth
      const y = Math.random() * screenHeight
      const size = 4 + Math.random() * 6
      const color = colors[Math.floor(Math.random() * colors.length)]
      
      ctx.fillStyle = color
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(Math.random() * Math.PI)
      ctx.fillRect(-size/2, -size/2, size, size)
      ctx.restore()
    }
  }
  
  static lightenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16)
    const amt = Math.round(2.55 * percent)
    const R = (num >> 16) + amt
    const G = (num >> 8 & 0x00FF) + amt
    const B = (num & 0x0000FF) + amt
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1)
  }
  
  static darkenColor(color, percent) {
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

export { UI }