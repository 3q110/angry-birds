import { soundManager } from './sound.js'

class CollisionDetection {
  static screenWidth = 800

  static init(screenWidth, maxPull) {
    CollisionDetection.screenWidth = screenWidth
    // 满攻参照：满拉（maxPull × 0.35 功率系数）打出的平射冲击约等于 fullHitSpeed 的 1/0.75 倍。
    // 冲击速度 ≥ fullHitSpeed 的一击按"一次满攻"结算，与 block.js 的血量对齐：
    // 玻璃(10) = 1 次满攻、板材(15) = 1.5 次满攻、石头(20) = 2 次满攻
    CollisionDetection.fullHitSpeed = (maxPull || 80) * 0.35 * 0.75
    // 单次满攻伤害（玻璃 hp 恰好等于它 → 满攻击碎）
    CollisionDetection.fullHitDamage = 10
    // 砸落加成：无直射角度时小鸟走抛物线从结构上方俯冲，
    // 垂直方向累积的自由落体速度按此系数追加伤害（上限 vy=18 时 +27）
    CollisionDetection.divestBonus = 1.5
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
    // 左右墙不反弹：小鸟可以飞出屏幕，由 update 的出屏判定结束本轮飞行
  }

  // 材料强度表（按易击碎程度排：玻璃 < 板材 < 石头）。
  // 撞击伤害统一走"满攻归一化"（见 checkBirdWithBlocks），不再各材料单独配伤害系数；
  // push = 被撞飞冲量系数（越硬推得越远），fallDamage = 方块自由落体摔地伤害系数
  //（玻璃摔地最脆、石头几乎耐摔）。
  static MATERIALS = {
    glass: { push: 0.9, fallDamage: 1.0 },
    board: { push: 1.2, fallDamage: 0.7 },
    stone: { push: 1.5, fallDamage: 0.35 }
  }

  static checkBirdWithBlocks(bird, blocks) {
    if (!bird || !bird.used || bird.gone) return
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

        const mat = CollisionDetection.MATERIALS[block.type] || CollisionDetection.MATERIALS.board
        // 沿法向的接近速度（正数 = 正在撞进去）
        const impactSpeed = Math.abs(bird.vx * nx + bird.vy * ny)

        // 真实撞击才结算伤害/推挤：接近速度低于阈值视为贴靠（静置）接触，
        // 只做位置分离，防止小鸟停在方块上时每帧磨掉少量血
        if (impactSpeed > 1.5) {
          // 满攻归一化：冲击 ≥ fullHitSpeed 的一击 = 一次满攻（fullHitDamage），
          // 与 block.js 血量对齐 → 玻璃 1 次满攻击碎、板材 1.5 次、石头 2 次
          let damage = Math.min(impactSpeed / CollisionDetection.fullHitSpeed, 1) *
                       CollisionDetection.fullHitDamage

          // 砸落加成：无直射角度时，小鸟从结构上方沿抛物线俯冲砸中顶面，
          // 垂直自由落体速度叠加额外伤害，加大砸落/自由落体的破坏力
          if (bird.vy > 0 && ny < -0.5) {
            damage += Math.min(bird.vy, 18) * CollisionDetection.divestBonus
          }

          block.hp -= damage

          const wasAlive = block.hp > 0
          if (block.hp <= 0) {
            block.hp = 0
            if (wasAlive) soundManager.playBlockBreak(block.type)
          } else {
            soundManager.playHitBlock(block.type)
          }

          // 推挤冲量：越硬的材料被推得越狠（石头 1.5 / 板材 1.2 / 玻璃 0.9）
          // n 从方块指向小鸟，方块应被沿小鸟运动方向（-n）推走
          const pushForce = impactSpeed * mat.push
          block.vx -= nx * pushForce
          block.vy -= ny * pushForce
        }

        // 真实撞击才反弹：按法向做带能量损失的镜面反射（恢复系数 0.55），
        // 保留大部分切向动能，让小鸟撞穿结构后还有余力继续破坏
        const vn = bird.vx * nx + bird.vy * ny
        if (vn < -0.5) {
          const restitution = 0.55
          bird.vx -= (1 + restitution) * vn * nx
          bird.vy -= (1 + restitution) * vn * ny
        }
      }
    })
  }

  static checkBirdWithPigs(bird, pigs) {
    if (!bird || !bird.used || bird.gone) return
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
        // 伤害系数 6：正常命中（冲击 ~10）即可打出 60+ 伤害，一击致命
        const damage = impactSpeed * 6

        const wasAlive = pig.alive
        pig.takeDamage(damage)
        if (!pig.alive && wasAlive) {
          soundManager.playPigDeath()
        } else if (impactSpeed > 1) {
          soundManager.playHitPig()
        }

        // 小猪被撞得飞出去：冲量加大；
        // n 从猪指向小鸟，猪应被沿小鸟运动方向（-n）撞飞
        pig.vx -= nx * impactSpeed * 1.1
        pig.vy -= ny * impactSpeed * 1.1

        // 小鸟按法向弹性反射（恢复系数 0.5），保留动能继续横扫
        const vn = bird.vx * nx + bird.vy * ny
        if (vn < -0.5) {
          const restitution = 0.5
          bird.vx -= (1 + restitution) * vn * nx
          bird.vy -= (1 + restitution) * vn * ny
        }
      }
    })
  }

  static checkBlocksWithGround(blocks, groundY) {
    blocks.forEach(block => {
      if (block.hp <= 0) return
      if (block.y + block.h >= groundY) {
        const wasAirborne = !block.onGround
        // 修复：必须在反弹前读取落地冲击速度，
        // 旧代码先 vy *= -0.2 再结算，冲击被砍到 20%，方块摔地几乎不掉血
        const fallSpeed = Math.abs(block.vy)
        block.y = groundY - block.h
        block.vy *= -0.2
        block.vx *= 0.4
        block.onGround = true
        // 只有从空中落地时才计算伤害，防止地面连续伤害；
        // 分材料结算：玻璃摔地最脆，板材次之，石头几乎耐摔
        if (wasAirborne && fallSpeed > 2) {
          const mat = CollisionDetection.MATERIALS[block.type] || CollisionDetection.MATERIALS.board
          block.hp -= fallSpeed * mat.fallDamage
          if (block.hp <= 0) {
            block.hp = 0
            soundManager.playBlockBreak(block.type)
          }
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
        // 修复：必须在反弹前读取落地冲击速度，
        // 旧代码先 vy *= -0.2 再结算，猪从高处摔下也不掉血
        const fallSpeed = Math.abs(pig.vy)
        // 必须在清零前读取：本次落地是否源自"方块支撑"
        const wasOnBlock = pig.onBlock
        pig.y = groundY - pig.radius
        pig.vy *= -0.2
        pig.vx *= 0.4
        pig.onGround = true
        // 落地后不再算"方块支撑"，下一次离开地面重新判定
        pig.onBlock = false
        // 只有从空中落地时才结算自由落体（物理已恢复真实自由落体，无 0.7 衰减）：
        // 1) 站在方块上失去支撑的猪 → 自由落地即判死；
        // 2) 其他高空坠落：冲击 > 12px/帧（重力 0.5 下约 144px 高度）直接摔死，
        //    否则按 x3.5 系数结算（~130px 摔落即可摔死 40 血的猪）
        if (wasAirborne && fallSpeed > 2) {
          const wasAlive = pig.alive
          if (wasOnBlock || fallSpeed > 12) {
            pig.takeDamage(9999)
          } else {
            pig.takeDamage(fallSpeed * 3.5)
          }
          if (!pig.alive && wasAlive) {
            // 摔死也要有死亡反馈（粒子/震屏由 pollEffects 统一触发）
            soundManager.playPigDeath()
          }
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

            // 沿法向的接近速度：<=0 表示正在分离或静置
            const approach = b1.vx * pushDir - b2.vx * pushDir
            if (approach > 0.5) {
              // 真实撞击：速度交换（弹性碰撞）
              const tempVx = b1.vx
              b1.vx = b2.vx * 0.5
              b2.vx = tempVx * 0.5
            } else {
              // 贴靠（静置）接触：让法向速度强衰减，
              // 否则上方方块的重力微振荡无法收敛到 allSettled 阈值以下
              b1.vx *= 0.2
              b2.vx *= 0.2
            }
          } else {
            // 垂直推动
            const pushDir = (b1.y + b1.h / 2) < (b2.y + b2.h / 2) ? -1 : 1
            const totalMass = 2
            b1.y += pushDir * overlapY / totalMass
            b2.y -= pushDir * overlapY / totalMass

            // 沿法向的接近速度：<=0 表示正在分离或静置
            const approach = b1.vy * pushDir - b2.vy * pushDir
            if (approach > 0.5) {
              // 真实撞击：速度交换
              const tempVy = b1.vy
              b1.vy = b2.vy * 0.5
              b2.vy = tempVy * 0.5
            } else {
              // 贴靠（静置）接触：法向速度强衰减，保证堆叠能收敛
              b1.vy *= 0.2
              b2.vy *= 0.2
            }
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
          // 仅在真实撞击（速度足够）时施加冲量：
          // 原代码在贴靠状态下每帧注入固定 1px/帧 速度，
          // 会让猪永远振荡、沉降阶段无法结束，导致游戏软锁
          if (impactSpeed > 0.5) {
            // 方块应被沿小猪运动方向（-n，n 从方块指向猪）推走
            const pushForce = impactSpeed * 0.5
            block.vx -= nx * pushForce
            block.vy -= ny * pushForce

            pig.vx = -pig.vx * 0.3 + nx * impactSpeed * 0.3
            pig.vy = -pig.vy * 0.3 + ny * impactSpeed * 0.3
          } else {
            // 贴靠（静置）接触：只分离位置，同时让双方速度强衰减，
            // 保证重力微振荡能收敛到 allSettled 阈值（0.05）以下
            // （例如结构塌落后方块压在猪身上、猪坐在方块顶面）
            pig.vx *= 0.2
            pig.vy *= 0.2
            block.vx *= 0.2
            block.vy *= 0.2
          }

          // 支撑记录：猪在方块顶面（方块在猪下方）→ 标记为方块支撑。
          // 之后支撑被击碎、猪失去支撑自由落地时，checkPigsWithGround 会判其死亡
          if (ny < -0.5) pig.onBlock = true
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
