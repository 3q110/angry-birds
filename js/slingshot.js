class Slingshot {
  constructor(x, y, screenWidth, screenHeight) {
    this.x = x
    this.y = y
    this.forkLeft = { x: x - 18, y: y - 50 }
    this.forkRight = { x: x + 18, y: y - 50 }
    this.baseY = y
    this.bandMaxLength = 80
  }
  
  drawRoundRect(ctx, x, y, width, height, radius) {
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

  render(ctx, bird, isAiming) {
    ctx.save()

    ctx.fillStyle = '#654321'
    ctx.beginPath()
    ctx.moveTo(this.x - 12, this.baseY + 60)
    ctx.lineTo(this.x + 12, this.baseY + 60)
    ctx.lineTo(this.x + 8, this.baseY - 10)
    ctx.lineTo(this.x - 8, this.baseY - 10)
    ctx.closePath()
    ctx.fill()
    
    ctx.strokeStyle = '#4A3019'
    ctx.lineWidth = 2
    ctx.stroke()

    this.drawWoodenArm(ctx, this.x, this.baseY - 10, this.forkLeft.x, this.forkLeft.y)
    this.drawWoodenArm(ctx, this.x, this.baseY - 10, this.forkRight.x, this.forkRight.y)

    ctx.fillStyle = '#5D4037'
    ctx.beginPath()
    ctx.arc(this.forkLeft.x, this.forkLeft.y, 8, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(this.forkRight.x, this.forkRight.y, 8, 0, Math.PI * 2)
    ctx.fill()

    if (bird && isAiming) {
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      
      ctx.strokeStyle = '#2C1810'
      ctx.lineWidth = 10
      ctx.beginPath()
      ctx.moveTo(this.forkLeft.x, this.forkLeft.y)
      ctx.lineTo(bird.x, bird.y)
      ctx.lineTo(this.forkRight.x, this.forkRight.y)
      ctx.stroke()
      
      ctx.strokeStyle = '#8B4513'
      ctx.lineWidth = 6
      ctx.beginPath()
      ctx.moveTo(this.forkLeft.x, this.forkLeft.y)
      ctx.lineTo(bird.x, bird.y)
      ctx.lineTo(this.forkRight.x, this.forkRight.y)
      ctx.stroke()
      
      ctx.strokeStyle = '#A0522D'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(this.forkLeft.x, this.forkLeft.y)
      ctx.lineTo(bird.x, bird.y)
      ctx.lineTo(this.forkRight.x, this.forkRight.y)
      ctx.stroke()
      
      if (bird.pulling) {
        this.drawTrajectory(ctx, bird)
      }
    } else if (bird && !bird.active) {
      ctx.strokeStyle = '#8B4513'
      ctx.lineWidth = 4
      ctx.lineCap = 'round'

      ctx.beginPath()
      ctx.moveTo(this.forkLeft.x, this.forkLeft.y)
      ctx.lineTo(this.forkLeft.x + 8, this.forkLeft.y + 8)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(this.forkRight.x, this.forkRight.y)
      ctx.lineTo(this.forkRight.x - 8, this.forkRight.y + 8)
      ctx.stroke()
    }

    ctx.restore()
  }
  
  drawWoodenArm(ctx, x1, y1, x2, y2) {
    const angle = Math.atan2(y2 - y1, x2 - x1)
    const width = 10
    
    ctx.save()
    ctx.translate((x1 + x2) / 2, (y1 + y2) / 2)
    ctx.rotate(angle)
    
    const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
    
    const gradient = ctx.createLinearGradient(-length/2, -width/2, -length/2, width/2)
    gradient.addColorStop(0, '#8B5A2B')
    gradient.addColorStop(0.3, '#A0522D')
    gradient.addColorStop(0.7, '#8B4513')
    gradient.addColorStop(1, '#654321')
    
    ctx.fillStyle = gradient
    this.drawRoundRect(ctx, -length/2, -width/2, length, width, 3)
    ctx.fill()
    
    ctx.strokeStyle = '#5D3A1A'
    ctx.lineWidth = 1
    ctx.stroke()
    
    ctx.strokeStyle = 'rgba(0,0,0,0.1)'
    ctx.lineWidth = 1
    for (let i = 0; i < 3; i++) {
      ctx.beginPath()
      ctx.moveTo(-length/2 + 10 + i * (length/3), -width/2 + 2)
      ctx.lineTo(-length/2 + 10 + i * (length/3), width/2 - 2)
      ctx.stroke()
    }
    
    ctx.restore()
  }
  
  drawTrajectory(ctx, bird) {
    const dx = bird.x - this.x
    const dy = bird.y - this.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist === 0) return
    
    // 使用与实际发射完全相同的物理参数和计算方式
    const power = dist * 0.25
    const nx = dx / dist
    const ny = dy / dist
    let vx = -nx * power
    let vy = -ny * power
    
    // 轨迹起点：从小鸟当前位置开始预测
    let px = bird.x
    let py = bird.y

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.lineWidth = 3
    ctx.setLineDash([8, 4])
    ctx.beginPath()
    ctx.moveTo(px, py)

    // 使用与实际游戏相同的物理参数
    const gravity = 0.15
    const friction = 0.998
    const groundY = 540

    // 模拟飞行轨迹（与实际游戏update循环一致）
    for (let i = 0; i < 200; i++) {
      // 应用重力
      vy += gravity
      // 应用空气阻力
      vx *= friction
      vy *= friction
      // 更新位置
      px += vx
      py += vy

      // 地面碰撞检测
      if (py > groundY) break
      
      // 飞出屏幕右侧停止预测
      if (px > 950) break

      // 每隔几帧画一个点
      if (i % 2 === 0) {
        ctx.lineTo(px, py)
      }
    }
    ctx.stroke()
    ctx.setLineDash([])
    
    // 绘制终点指示器（小圆圈）
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.beginPath()
    ctx.arc(px, py, 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255, 200, 100, 0.8)'
    ctx.lineWidth = 2
    ctx.stroke()
  }
}

export { Slingshot }