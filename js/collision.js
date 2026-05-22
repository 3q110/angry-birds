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
        block.y = groundY - block.h
        block.vy *= -0.2
        block.vx *= 0.4
        const impact = Math.abs(block.vy)
        block.hp -= impact
        if (block.hp <= 0) block.hp = 0
      }
    })
  }

  static checkPigsWithGround(pigs, groundY) {
    pigs.forEach(pig => {
      if (!pig.alive) return
      if (pig.y + pig.radius >= groundY) {
        pig.y = groundY - pig.radius
        pig.vy *= -0.2
        pig.vx *= 0.4
        const impact = Math.abs(pig.vy)
        pig.takeDamage(impact * 2)
      }
    })
  }
}

export { CollisionDetection }