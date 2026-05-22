class UI {
  static render(ctx, screenWidth, screenHeight, score, levelIndex, gameState, birds) {
    ctx.save()

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(0, 0, screenWidth, 40)

    ctx.fillStyle = '#FFF'
    ctx.font = 'bold 18px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(`分数: ${score}`, 15, 28)

    ctx.textAlign = 'center'
    ctx.fillText(`第 ${levelIndex + 1} 关`, screenWidth / 2, 28)

    ctx.textAlign = 'right'

    const remaining = birds.filter(b => !b.used).length
    ctx.fillText(`剩余小鸟: ${remaining}`, screenWidth - 15, 28)

    if (gameState === 'win') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
      ctx.fillRect(0, 0, screenWidth, screenHeight)

      ctx.fillStyle = '#FFD700'
      ctx.font = 'bold 48px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('恭喜过关!', screenWidth / 2, screenHeight / 2 - 20)

      ctx.fillStyle = '#FFF'
      ctx.font = 'bold 24px sans-serif'
      ctx.fillText('准备进入下一关...', screenWidth / 2, screenHeight / 2 + 30)
    }

    if (gameState === 'lose') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
      ctx.fillRect(0, 0, screenWidth, screenHeight)

      ctx.fillStyle = '#FF6B6B'
      ctx.font = 'bold 48px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('游戏失败', screenWidth / 2, screenHeight / 2 - 20)

      ctx.fillStyle = '#FFF'
      ctx.font = 'bold 24px sans-serif'
      ctx.fillText('重新开始...', screenWidth / 2, screenHeight / 2 + 30)
    }

    ctx.restore()
  }
}

export { UI }