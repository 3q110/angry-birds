// 特效模块：粒子（木屑/冰晶/石屑、火花、烟雾）+ 屏幕震动
// 纯 Canvas 绘制，无外部资源；所有粒子带生命上限，总量封顶防止性能问题
class Effects {
  constructor() {
    this.particles = []
    this.shakeTime = 0
    this.shakeDuration = 18
    this.shakeMagnitude = 0
  }

  clear() {
    this.particles = []
    this.shakeTime = 0
    this.shakeMagnitude = 0
  }

  // 触发屏幕震动：amplitude 越大震得越猛；已有震动时只取更强的
  shake(amplitude) {
    if (amplitude <= 0) return
    if (this.shakeTime <= 0 || amplitude > this.shakeMagnitude) {
      this.shakeMagnitude = Math.min(10, amplitude)
      this.shakeDuration = 18
      this.shakeTime = 18
    }
  }

  // 渲染前调用一次，返回本帧偏移量（随时间衰减）
  getShakeOffset() {
    if (this.shakeTime <= 0) return { x: 0, y: 0 }
    this.shakeTime--
    const decay = this.shakeTime / this.shakeDuration
    const m = this.shakeMagnitude * decay
    return { x: (Math.random() - 0.5) * 2 * m, y: (Math.random() - 0.5) * 2 * m }
  }

  // 方块碎裂碎片（板屑/玻璃碴/石屑）：分材料呈现不同碎裂质感
  // 玻璃=细碎玻璃碴高速飞溅、寿命短；板材=长条板屑；石头=大块石砾滚动坠落
  spawnDebris(x, y, type, count) {
    const palettes = {
      board: ['#A67C52', '#8B5A2B', '#6B4423'],
      glass: ['#B3E5FC', '#81D4FA', '#4FC3F7', '#E1F5FE'],
      stone: ['#95A5A6', '#7F8C8D', '#5D6D7E'],
    }
    const colors = palettes[type] || palettes.board
    const speedMul = type === 'glass' ? 1.9 : type === 'stone' ? 0.55 : 1
    const sizeMul = type === 'stone' ? 1.5 : type === 'glass' ? 0.7 : 1.1
    const lifeMul = type === 'glass' ? 0.6 : type === 'stone' ? 1.3 : 1
    // 玻璃易碎：额外多喷 80% 的碎片
    const total = count + (type === 'glass' ? Math.floor(count * 0.8) : 0)
    for (let i = 0; i < total; i++) {
      if (this.particles.length >= 300) break
      const life = (40 + Math.random() * 30) * lifeMul
      this.particles.push({
        kind: 'debris',
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 8 * speedMul,
        vy: -2 - Math.random() * 5 * speedMul,
        size: (3 + Math.random() * 5) * sizeMul,
        elong: type === 'board' ? 1.8 : type === 'stone' ? 1.1 : 0.7,
        color: colors[Math.floor(Math.random() * colors.length)],
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * (type === 'stone' ? 0.25 : 0.5),
        life: life,
        maxLife: life,
      })
    }
  }

  // 高速撞击火花
  spawnSparks(x, y, count) {
    const colors = ['#FFF176', '#FFEE58', '#FFFFFF', '#FFD54F']
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= 300) break
      const angle = Math.random() * Math.PI * 2
      const speed = 2 + Math.random() * 4
      this.particles.push({
        kind: 'spark',
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 1.5 + Math.random() * 2.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 15 + Math.random() * 15,
        maxLife: 30,
      })
    }
  }

  // 猪死亡烟圈：一圈向外扩散、逐渐放大淡出的圆
  spawnPoof(x, y, radius) {
    const colors = ['#A5D6A7', '#81C784', '#C8E6C9', '#EF9A9A']
    const count = 10
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= 300) break
      const angle = (i / count) * Math.PI * 2
      this.particles.push({
        kind: 'poof',
        x: x + Math.cos(angle) * radius * 0.4,
        y: y + Math.sin(angle) * radius * 0.4,
        vx: Math.cos(angle) * (1 + Math.random() * 2),
        vy: Math.sin(angle) * (1 + Math.random() * 2) - 1,
        size: 6 + Math.random() * 8,
        grow: 0.5 + Math.random() * 0.4,
        color: colors[i % colors.length],
        life: 25 + Math.random() * 15,
        maxLife: 40,
      })
    }
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.life--
      if (p.life <= 0) {
        this.particles.splice(i, 1)
        continue
      }
      p.x += p.vx
      p.y += p.vy
      if (p.kind === 'debris') {
        p.vy += 0.5
        p.rot += p.vrot
      } else if (p.kind === 'spark') {
        p.vx *= 0.92
        p.vy *= 0.92
      } else if (p.kind === 'poof') {
        p.size += p.grow
        p.vx *= 0.95
        p.vy *= 0.95
      }
    }
  }

  render(ctx) {
    if (this.particles.length === 0) return
    ctx.save()
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife)
      ctx.globalAlpha = alpha
      if (p.kind === 'debris') {
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * (p.elong || 0.7))
        ctx.restore()
      } else if (p.kind === 'spark') {
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      } else if (p.kind === 'poof') {
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    ctx.globalAlpha = 1
    ctx.restore()
  }
}

export { Effects }
