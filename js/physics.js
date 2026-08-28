class Physics {
  constructor(screenWidth, screenHeight) {
    // 加强重力：0.15 时抛物线明显"飘"，不符合自由落体手感；
    // 0.5 px/帧² 让下落更快、撞击更有力
    this.gravity = 0.5
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
      // 自由落体规则：空中只受恒定重力加速，不加空气阻力，
      // 能量只在与地面/方块/猪的真实碰撞中消耗
      bird.vy += this.gravity
      bird.x += bird.vx
      bird.y += bird.vy
    }

    blocks.forEach(b => {
      if (b.hp <= 0) return
      // 自由落体：空中不加每帧速度衰减。
      // 旧代码每帧 *0.7 使终端速度只有 ~1.17px/帧，方块像羽毛一样飘落，
      // 落地冲击永远达不到 checkBlocksWithGround 的 fallSpeed>2 阈值，摔落伤害从不生效
      b.vy += this.gravity
      b.x += b.vx
      b.y += b.vy
    })

    pigs.forEach(p => {
      if (!p.alive) return
      // 同上：猪必须按真实自由落体速度下坠，
      // checkPigsWithGround 的"失去支撑落地判死/高空摔死"才能拿到足够的 fallSpeed
      p.vy += this.gravity
      p.x += p.vx
      p.y += p.vy
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
    // 沉降阶段：空中物体保持自然下落速度（不再每帧 50% 衰减，
    // 否则终端速度只有 0.15px/帧，高空物体永远落不下来），
    // 靠地面碰撞 + 碰撞模块的贴靠衰减快速静止
    blocks.forEach(b => {
      if (b.hp <= 0) return
      b.vy += this.gravity
      b.x += b.vx
      b.y += b.vy
      // 地面碰撞：防止方块在沉降阶段穿地
      if (b.y + b.h >= groundY) {
        b.y = groundY - b.h
        b.vy *= -0.2
        if (Math.abs(b.vy) < 0.5) b.vy = 0
        b.vx *= 0.4
      }
      b.vx *= 0.98
    })
    pigs.forEach(p => {
      if (!p.alive) return
      p.vy += this.gravity
      p.x += p.vx
      p.y += p.vy
      // 地面碰撞：防止小猪在沉降阶段穿地
      if (p.y + p.radius >= groundY) {
        p.y = groundY - p.radius
        p.vy *= -0.2
        if (Math.abs(p.vy) < 0.5) p.vy = 0
        p.vx *= 0.4
      }
      p.vx *= 0.98
    })
  }

  allSettled(blocks, pigs) {
    // 注意用 <= 而非 <：微振荡衰减后速度可能恰好停在阈值上
    const stopped = (obj) => Math.abs(obj.vx) <= 0.05 && Math.abs(obj.vy) <= 0.05
    return blocks.every(b => b.hp <= 0 || stopped(b)) &&
           pigs.every(p => !p.alive || stopped(p))
  }
}

export { Physics }