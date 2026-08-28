// 音效管理器 - SoundManager（使用 Web Audio API 合成音效）
// 非浏览器环境（如微信小游戏，无 window.AudioContext）自动静默，所有方法为安全的空操作
class SoundManager {
  constructor() {
    this.ctx = null
    this.supported = typeof window !== 'undefined' &&
      !!(window.AudioContext || window.webkitAudioContext)
    if (!this.supported) return
    // AudioContext 必须在用户交互后创建
    const initAudio = () => {
      if (!this.ctx) {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)()
      }
    }
    document.addEventListener('click', initAudio, { once: true })
    document.addEventListener('touchstart', initAudio, { once: true })
  }

  _ensureContext() {
    if (!this.ctx) return false
    if (this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
    return true
  }

  playLaunch() {
    // 发射：呼啸声 - 白噪声+高通滤波器
    if (!this._ensureContext()) return
    const duration = 0.3
    const sr = this.ctx.sampleRate
    const len = Math.floor(sr * duration)
    const buffer = this.ctx.createBuffer(1, len, sr)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < len; i++) {
      const t = i / sr
      data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 8) * 0.3
    }
    const source = this.ctx.createBufferSource()
    source.buffer = buffer
    const filter = this.ctx.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.setValueAtTime(200, this.ctx.currentTime)
    filter.frequency.exponentialRampToValueAtTime(2000, this.ctx.currentTime + duration)
    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration)
    source.connect(filter)
    filter.connect(gain)
    gain.connect(this.ctx.destination)
    source.start()
  }

  playHitPig() {
    // 击中小猪：吱的一声
    if (!this._ensureContext()) return
    const osc = this.ctx.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(600, this.ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.15)
    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15)
    osc.connect(gain)
    gain.connect(this.ctx.destination)
    osc.start()
    osc.stop(this.ctx.currentTime + 0.15)
  }

  playPigDeath() {
    // 小猪死亡：痛苦的咕噜声
    if (!this._ensureContext()) return
    const osc = this.ctx.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(500, this.ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.4)
    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4)
    osc.connect(gain)
    gain.connect(this.ctx.destination)
    osc.start()
    osc.stop(this.ctx.currentTime + 0.4)
  }

  // 噪声爆发：duration 秒、截止频率 freq、音量 vol（受击/碎裂共用）
  _noiseBurst(duration, freq, vol) {
    if (!this._ensureContext()) return
    const sr = this.ctx.sampleRate
    const len = Math.floor(sr * duration)
    const buffer = this.ctx.createBuffer(1, len, sr)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < len; i++) {
      const t = i / sr
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t / duration, 1.5) * vol
    }
    const source = this.ctx.createBufferSource()
    source.buffer = buffer
    const filter = this.ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = freq
    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(vol, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration)
    source.connect(filter)
    filter.connect(gain)
    gain.connect(this.ctx.destination)
    source.start()
  }

  playHitBlock(type) {
    // 击中方块：分材料 —— 板材=沉闷咚、玻璃=清脆哒、石头=厚重轰
    if (type === 'glass') {
      this._noiseBurst(0.08, 6000, 0.3)
      this._toneBurst('square', 2600, 0.05, 0.15)
    } else if (type === 'stone') {
      this._noiseBurst(0.14, 320, 0.5)
    } else {
      this._noiseBurst(0.1, 800, 0.4)
    }
  }

  // 短促单音（玻璃的碎裂"叮"）
  _toneBurst(toneType, freq, duration, vol) {
    if (!this._ensureContext()) return
    const osc = this.ctx.createOscillator()
    osc.type = toneType
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(freq * 1.6, this.ctx.currentTime + duration)
    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(vol, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration)
    osc.connect(gain)
    gain.connect(this.ctx.destination)
    osc.start()
    osc.stop(this.ctx.currentTime + duration)
  }

  playBlockBreak(type) {
    // 碎裂音：分材料 —— 玻璃=高频连续脆裂叮当、板材=木质噼啪、石头=沉闷崩裂
    if (type === 'glass') {
      // 三段错开的高频脆裂
      this._noiseBurst(0.16, 8000, 0.4)
      this._toneBurst('square', 3200, 0.08, 0.12)
      setTimeout(() => this._toneBurst('square', 4100, 0.07, 0.1), 60)
      setTimeout(() => this._toneBurst('square', 5200, 0.06, 0.08), 130)
    } else if (type === 'stone') {
      this._noiseBurst(0.3, 240, 0.6)
      this._toneBurst('sine', 70, 0.25, 0.3)
    } else {
      // 板材噼啪：两段错开的中频噪声
      this._noiseBurst(0.2, 1400, 0.5)
      setTimeout(() => this._noiseBurst(0.12, 900, 0.35), 70)
    }
  }

  playWin() {
    // 胜利：上行琶音 C5-E5-G5-C6
    if (!this._ensureContext()) return
    const notes = [523, 659, 784, 1047]
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator()
      osc.type = 'triangle'
      osc.frequency.value = freq
      const gain = this.ctx.createGain()
      const t = this.ctx.currentTime + i * 0.12
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.2, t + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3)
      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start(t)
      osc.stop(t + 0.3)
    })
  }

  playLose() {
    // 失败：下行音
    if (!this._ensureContext()) return
    const osc = this.ctx.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(400, this.ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.6)
    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6)
    osc.connect(gain)
    gain.connect(this.ctx.destination)
    osc.start()
    osc.stop(this.ctx.currentTime + 0.6)
  }

  playSlingshot() {
    // 弹弓拉伸：橡皮筋声
    if (!this._ensureContext()) return
    const osc = this.ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(300, this.ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.08)
    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08)
    osc.connect(gain)
    gain.connect(this.ctx.destination)
    osc.start()
    osc.stop(this.ctx.currentTime + 0.08)
  }
}

export { SoundManager }
export const soundManager = new SoundManager()
