class InputManager {
  constructor(canvas) {
    this.touchActive = false
    this.touchX = 0
    this.touchY = 0

    canvas.addEventListener('mousedown', (e) => {
      e.preventDefault()
      this.touchActive = true
      this.touchX = e.clientX
      this.touchY = e.clientY
    })

    canvas.addEventListener('mousemove', (e) => {
      e.preventDefault()
      if (this.touchActive) {
        this.touchX = e.clientX
        this.touchY = e.clientY
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