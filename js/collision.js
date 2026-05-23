class CollisionDetection {
  static screenWidth = 800

  static init(screenWidth) {
    CollisionDetection.screenWidth = screenWidth
  }

  static checkBirdWithGround(bird, groundY) {
    if (!bird || !bird.used) return
    const bottom = bird.y + bird.radius
    if (bottom >= groundY) {
      bird.y = groundY - bird.radius
      bird.vy *= -0.3
      bird.vx *= 0.5
      // 速度极小时直接停止微弹跳
      if (Math.abs(bird.vy) < 0.5) bird.vy = 0
    }
    if (bird.x - bird.radius < 0) {
      bird.x = bird.radius
      bird.vx *= -0.5
    }
    if (bird.x + bird.radius > CollisionDetection.screenWidth) {
      bird.x = CollisionDetection.screenWidth - bird.radius
      bird.vx *= -0.5
    }
  }

  static checkBirdWithBlocks(bird, blocks) {
    if (!bird || !bird.used) return
    const bx = bird.x
    const by = bird.y
    const br = bird.radius

    blocks.forEach(block => {
      if (block.hp <= 0) return

      const closestX = Math.max(block.x, Math.min(bx, block.x + block.w))
      const closestY = Math.max(block.y, Math.min(by, block.y + block.h))
      const dx = bx - closestX
      const dy = by - closestY
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < br) {
        const overlap = br - dist
        const nx = dist > 0 ? dx / dist : 0
        const ny = dist > 0 ? dy / dist : -1

        bird.x += nx * overlap
        bird.y += ny * overlap

        const impactSpeed = Math.abs(bird.vx * nx + bird.vy * ny)
        const damage = impactSpeed * 3

        block.hp -= damage
        if (block.hp <= 0) block.hp = 0

        const pushForce = impactSpeed * 0.8
        block.vx += nx * pushForce
        block.vy += ny * pushForce

        bird.vx = -bird.vx * 0.4 + nx * 2
        bird.vy = -bird.vy * 0.4 + ny * 2
      }
    })
  }

  static checkBirdWithPigs(bird, pigs) {
    if (!bird || !bird.used) return
    pigs.forEach(pig => {
      if (!pig.alive) return
      const dx = bird.x - pig.x
      const dy = bird.y - pig.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      const minDist = bird.radius + pig.radius

      if (dist < minDist) {
        const overlap = minDist - dist
        const nx = dist > 0 ? dx / dist : 0
        const ny = dist > 0 ? dy / dist : -1

        bird.x += nx * overlap
        bird.y += ny * overlap

        const impactSpeed = Math.abs(bird.vx * nx + bird.vy * ny)
        const damage = impactSpeed * 4

        pig.takeDamage(damage)

        pig.vx += nx * impactSpeed * 0.6
        pig.vy += ny * impactSpeed * 0.6

        bird.vx = -bird.vx * 0.3 + nx * 1.5
        bird.vy = -bird.vy * 0.3 + ny * 1.5
      }
    })
  }

  static checkBlocksWithGround(blocks, groundY) {
    blocks.forEach(block => {
      if (block.hp <= 0) return
      if (block.y + block.h >= groundY) {
        const wasAirborne = !block.onGround
        block.y = groundY - block.h
        block.vy *= -0.2
        block.vx *= 0.4
        block.onGround = true
        // 只有从空中落地时才计算伤害，防止地面连续伤害
        if (wasAirborne && Math.abs(block.vy) > 1) {
          const impact = Math.abs(block.vy)
          block.hp -= impact
          if (block.hp <= 0) block.hp = 0
        }
        // 如果速度极小，直接停止，防止微弹跳
        if (Math.abs(block.vy) < 0.5) {
          block.vy = 0
          block.vx *= 0.3
        }
      } else {
        block.onGround = false
      }
    })
  }

  static checkPigsWithGround(pigs, groundY) {
    pigs.forEach(pig => {
      if (!pig.alive) return
      if (pig.y + pig.radius >= groundY) {
        const wasAirborne = !pig.onGround
        pig.y = groundY - pig.radius
        pig.vy *= -0.2
        pig.vx *= 0.4
        pig.onGround = true
        // 只有从空中落地时才计算伤害
        if (wasAirborne && Math.abs(pig.vy) > 1) {
          const impact = Math.abs(pig.vy)
          pig.takeDamage(impact * 2)
        }
        // 如果速度极小，直接停止，防止微弹跳
        if (Math.abs(pig.vy) < 0.5) {
          pig.vy = 0
          pig.vx *= 0.3
        }
      } else {
        pig.onGround = false
      }
    })
  }

  // 新增：方块与方块的碰撞检测
  static checkBlocksWithBlocks(blocks) {
    for (let i = 0; i < blocks.length; i++) {
      for (let j = i + 1; j < blocks.length; j++) {
        const b1 = blocks[i]
        const b2 = blocks[j]
        
        if (b1.hp <= 0 || b2.hp <= 0) continue

        // 计算重叠
        const overlapX = Math.max(0, 
          Math.min(b1.x + b1.w, b2.x + b2.w) - Math.max(b1.x, b2.x))
        const overlapY = Math.max(0, 
          Math.min(b1.y + b1.h, b2.y + b2.h) - Math.max(b1.y, b2.y))

        if (overlapX > 0 && overlapY > 0) {
          // 决定从哪个方向推动（最小重叠方向）
          if (overlapX < overlapY) {
            // 水平推动
            const pushDir = (b1.x + b1.w / 2) < (b2.x + b2.w / 2) ? -1 : 1
            const totalMass = 2 // 简化质量
            b1.x += pushDir * overlapX / totalMass
            b2.x -= pushDir * overlapX / totalMass
            
            // 速度交换（弹性碰撞）
            const tempVx = b1.vx
            b1.vx = b2.vx * 0.5
            b2.vx = tempVx * 0.5
          } else {
            // 垂直推动
            const pushDir = (b1.y + b1.h / 2) < (b2.y + b2.h / 2) ? -1 : 1
            const totalMass = 2
            b1.y += pushDir * overlapY / totalMass
            b2.y -= pushDir * overlapY / totalMass
            
            // 速度交换
            const tempVy = b1.vy
            b1.vy = b2.vy * 0.5
            b2.vy = tempVy * 0.5
          }
        }
      }
    }
  }

  // 新增：小猪与方块的碰撞检测
  static checkPigsWithBlocks(pigs, blocks) {
    pigs.forEach(pig => {
      if (!pig.alive) return
      
      blocks.forEach(block => {
        if (block.hp <= 0) return
        
        // 找到最近点
        const closestX = Math.max(block.x, Math.min(pig.x, block.x + block.w))
        const closestY = Math.max(block.y, Math.min(pig.y, block.y + block.h))
        const dx = pig.x - closestX
        const dy = pig.y - closestY
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < pig.radius) {
          const overlap = pig.radius - dist
          const nx = dist > 0 ? dx / dist : 0
          const ny = dist > 0 ? dy / dist : -1

          pig.x += nx * overlap
          pig.y += ny * overlap

          const impactSpeed = Math.sqrt(pig.vx * pig.vx + pig.vy * pig.vy)
          const pushForce = impactSpeed * 0.5
          block.vx += nx * pushForce
          block.vy += ny * pushForce

          pig.vx = -pig.vx * 0.3 + nx * 1
          pig.vy = -pig.vy * 0.3 + ny * 1
        }
      })
    })
  }

  // 新增：小猪与小猪的碰撞检测
  static checkPigsWithPigs(pigs) {
    for (let i = 0; i < pigs.length; i++) {
      for (let j = i + 1; j < pigs.length; j++) {
        const p1 = pigs[i]
        const p2 = pigs[j]
        
        if (!p1.alive || !p2.alive) continue

        const dx = p1.x - p2.x
        const dy = p1.y - p2.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const minDist = p1.radius + p2.radius

        if (dist < minDist && dist > 0) {
          const overlap = minDist - dist
          const nx = dx / dist
          const ny = dy / dist

          p1.x += nx * overlap / 2
          p1.y += ny * overlap / 2
          p2.x -= nx * overlap / 2
          p2.y -= ny * overlap / 2

          // 交换速度
          const tempVx = p1.vx
          const tempVy = p1.vy
          p1.vx = p2.vx * 0.5
          p1.vy = p2.vy * 0.5
          p2.vx = tempVx * 0.5
          p2.vy = tempVy * 0.5
        }
      }
    }
  }
}

export { CollisionDetection }
