class Physics {
  constructor(screenWidth, screenHeight) {
    this.gravity = 0.4
    this.friction = 0.98
    this.groundFriction = 0.7
    this.bounce = 0.3
    this.settleThreshold = 0.2
  }

  reset() {}

  launch(bird, dx, dy, power) {
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist === 0) return
    const nx = dx / dist
    const ny = dy / dist
    bird.vx = -nx * power
    bird.vy = -ny * power
  }

  update(bird, blocks, pigs, groundY) {
    if (bird && bird.used) {
      bird.vy += this.gravity
      bird.x += bird.vx
      bird.y += bird.vy
      bird.vx *= this.friction
      bird.vy *= this.friction
    }

    blocks.forEach(b => {
      if (b.hp <= 0) return
      b.vy += this.gravity
      b.x += b.vx
      b.y += b.vy
      b.vx *= this.groundFriction
      b.vy *= this.groundFriction
    })

    pigs.forEach(p => {
      if (!p.alive) return
      p.vy += this.gravity
      p.x += p.vx
      p.y += p.vy
      p.vx *= this.groundFriction
      p.vy *= this.groundFriction
    })
  }

  isSettled(bird, blocks, pigs, groundY) {
    // 小鸟必须已经落地（速度很低且接近地面）才能进入沉降阶段
    // 防止小鸟在抛物线顶点（速度接近0）时被误判为已沉降
    if (bird && bird.used) {
      const speed = Math.sqrt(bird.vx * bird.vx + bird.vy * bird.vy)
      // 小鸟速度仍然较大，或仍在空中较高位置（离地面超过80像素）
      if (speed > this.settleThreshold * 3) return false
      const heightAboveGround = groundY - bird.y
      if (heightAboveGround > 80) return false
    }
    for (let b of blocks) {
      if (b.hp > 0 && (Math.abs(b.vx) > this.settleThreshold ||
          Math.abs(b.vy) > this.settleThreshold)) return false
    }
    for (let p of pigs) {
      if (p.alive && (Math.abs(p.vx) > this.settleThreshold ||
          Math.abs(p.vy) > this.settleThreshold)) return false
    }
    return true
  }

  settleUpdate(blocks, pigs, groundY) {
    blocks.forEach(b => {
      if (b.hp <= 0) return
      b.vy += this.gravity
      b.x += b.vx
      b.y += b.vy
      // 地面碰撞：防止方块在沉降阶段穿地
      if (b.y + b.h >= groundY) {
        b.y = groundY - b.h
        b.vy = 0
        b.vx *= 0.3
      }
      b.vx *= 0.5
      b.vy *= 0.5
    })
    pigs.forEach(p => {
      if (!p.alive) return
      p.vy += this.gravity
      p.x += p.vx
      p.y += p.vy
      // 地面碰撞：防止小猪在沉降阶段穿地
      if (p.y + p.radius >= groundY) {
        p.y = groundY - p.radius
        p.vy = 0
        p.vx *= 0.3
      }
      p.vx *= 0.5
      p.vy *= 0.5
    })
  }

  allSettled(blocks, pigs) {
    const stopped = (obj) => Math.abs(obj.vx) < 0.05 && Math.abs(obj.vy) < 0.05
    return blocks.every(b => b.hp <= 0 || stopped(b)) &&
           pigs.every(p => !p.alive || stopped(p))
  }
}

export { Physics }