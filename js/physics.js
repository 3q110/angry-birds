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

  isSettled(bird, blocks, pigs) {
    if (bird && bird.used) {
      if (Math.abs(bird.vx) > this.settleThreshold ||
          Math.abs(bird.vy) > this.settleThreshold) return false
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
      b.vx *= 0.5
      b.vy *= 0.5
    })
    pigs.forEach(p => {
      if (!p.alive) return
      p.vy += this.gravity
      p.x += p.vx
      p.y += p.vy
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