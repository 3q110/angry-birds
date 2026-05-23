class InputManager {
  constructor(canvas, logicalWidth, logicalHeight) {
    this.canvas = canvas
    this.logicalWidth = logicalWidth
    this.logicalHeight = logicalHeight
    this.touchActive = false
    this.touchX = 0
    this.touchY = 0

    canvas.addEventListener('mousedown', (e) => {
      e.preventDefault()
      this.touchActive = true
      this.updatePosition(e.clientX, e.clientY)
    })

    canvas.addEventListener('mousemove', (e) => {
      e.preventDefault()
      if (this.touchActive) {
        this.updatePosition(e.clientX, e.clientY)
      }
    })

    canvas.addEventListener('mouseup', (e) => {
      e.preventDefault()
      this.touchActive = false
    })

    canvas.addEventListener('mouseleave', (e) => {
      e.preventDefault()
      this.touchActive = false
    })

    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault()
      const touch = e.touches[0]
      this.touchActive = true
      this.updatePosition(touch.clientX, touch.clientY)
    })

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault()
      const touch = e.touches[0]
      this.updatePosition(touch.clientX, touch.clientY)
    })

    canvas.addEventListener('touchend', (e) => {
      e.preventDefault()
      this.touchActive = false
    })

    canvas.addEventListener('touchcancel', (e) => {
      e.preventDefault()
      this.touchActive = false
    })
  }

  updatePosition(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect()
    // 将 CSS 像素坐标映射到 Canvas 逻辑像素坐标
    const scaleX = this.logicalWidth / rect.width
    const scaleY = this.logicalHeight / rect.height
    this.touchX = (clientX - rect.left) * scaleX
    this.touchY = (clientY - rect.top) * scaleY
  }

  getTouch() {
    return {
      active: this.touchActive,
      x: this.touchX,
      y: this.touchY
    }
  }
}

export { InputManager }