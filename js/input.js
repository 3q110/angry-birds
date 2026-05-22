class InputManager {
  constructor(canvas) {
    this.touchActive = false
    this.touchX = 0
    this.touchY = 0

    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault()
      const touch = e.touches[0]
      this.touchActive = true
      this.touchX = touch.clientX
      this.touchY = touch.clientY
    })

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault()
      const touch = e.touches[0]
      this.touchX = touch.clientX
      this.touchY = touch.clientY
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

  getTouch() {
    return {
      active: this.touchActive,
      x: this.touchX,
      y: this.touchY
    }
  }
}

export { InputManager }