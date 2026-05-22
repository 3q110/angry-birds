class LevelManager {
  static getTotalLevels() {
    return 5
  }

  static getLevel(index) {
    const levels = [
      this.level1(),
      this.level2(),
      this.level3(),
      this.level4(),
      this.level5(),
    ]
    return levels[index % levels.length]
  }

  static level1() {
    return {
      birds: [
        { x: 120, y: 435 },
        { x: 80, y: 440 },
        { x: 40, y: 440 },
      ],
      blocks: [
        { x: 520, y: 420, w: 80, h: 20, type: 'wood' },
        { x: 520, y: 370, w: 80, h: 20, type: 'wood' },
        { x: 540, y: 320, w: 20, h: 50, type: 'wood' },
        { x: 580, y: 320, w: 20, h: 50, type: 'wood' },
      ],
      pigs: [
        { x: 560, y: 340, radius: 16 },
      ],
    }
  }

  static level2() {
    return {
      birds: [
        { x: 120, y: 435 },
        { x: 80, y: 440 },
        { x: 40, y: 440 },
        { x: 0, y: 440 },
      ],
      blocks: [
        { x: 480, y: 420, w: 20, h: 80, type: 'ice' },
        { x: 500, y: 370, w: 100, h: 20, type: 'ice' },
        { x: 500, y: 320, w: 20, h: 50, type: 'wood' },
        { x: 580, y: 320, w: 20, h: 50, type: 'wood' },
        { x: 580, y: 420, w: 20, h: 80, type: 'ice' },
      ],
      pigs: [
        { x: 520, y: 340, radius: 15 },
        { x: 570, y: 395, radius: 14 },
      ],
    }
  }

  static level3() {
    return {
      birds: [
        { x: 120, y: 435 },
        { x: 80, y: 440 },
        { x: 40, y: 440 },
        { x: 0, y: 440 },
      ],
      blocks: [
        { x: 460, y: 420, w: 20, h: 80, type: 'stone' },
        { x: 460, y: 350, w: 100, h: 20, type: 'wood' },
        { x: 540, y: 350, w: 20, h: 70, type: 'wood' },
        { x: 480, y: 290, w: 80, h: 20, type: 'ice' },
        { x: 580, y: 420, w: 20, h: 80, type: 'stone' },
        { x: 620, y: 370, w: 60, h: 20, type: 'wood' },
      ],
      pigs: [
        { x: 500, y: 310, radius: 15 },
        { x: 560, y: 395, radius: 14 },
        { x: 640, y: 345, radius: 14 },
      ],
    }
  }

  static level4() {
    return {
      birds: [
        { x: 120, y: 435 },
        { x: 80, y: 440 },
        { x: 40, y: 440 },
        { x: 0, y: 440 },
        { x: -40, y: 440 },
      ],
      blocks: [
        { x: 440, y: 420, w: 20, h: 80, type: 'stone' },
        { x: 460, y: 370, w: 80, h: 20, type: 'stone' },
        { x: 520, y: 370, w: 20, h: 70, type: 'ice' },
        { x: 460, y: 310, w: 80, h: 20, type: 'wood' },
        { x: 600, y: 420, w: 20, h: 80, type: 'wood' },
        { x: 620, y: 370, w: 80, h: 20, type: 'wood' },
        { x: 680, y: 370, w: 20, h: 70, type: 'wood' },
        { x: 620, y: 310, w: 80, h: 20, type: 'ice' },
        { x: 660, y: 260, w: 20, h: 50, type: 'ice' },
      ],
      pigs: [
        { x: 480, y: 330, radius: 14 },
        { x: 540, y: 345, radius: 14 },
        { x: 640, y: 330, radius: 14 },
        { x: 670, y: 275, radius: 13 },
      ],
    }
  }

  static level5() {
    return {
      birds: [
        { x: 120, y: 435 },
        { x: 80, y: 440 },
        { x: 40, y: 440 },
        { x: 0, y: 440 },
        { x: -40, y: 440 },
      ],
      blocks: [
        { x: 430, y: 420, w: 20, h: 80, type: 'stone' },
        { x: 450, y: 370, w: 80, h: 20, type: 'stone' },
        { x: 510, y: 370, w: 20, h: 70, type: 'stone' },
        { x: 450, y: 310, w: 80, h: 20, type: 'wood' },
        { x: 490, y: 260, w: 20, h: 50, type: 'ice' },
        { x: 590, y: 420, w: 20, h: 80, type: 'stone' },
        { x: 610, y: 370, w: 80, h: 20, type: 'stone' },
        { x: 670, y: 370, w: 20, h: 70, type: 'ice' },
        { x: 610, y: 310, w: 80, h: 20, type: 'wood' },
        { x: 650, y: 260, w: 20, h: 50, type: 'ice' },
        { x: 550, y: 230, w: 100, h: 20, type: 'wood' },
      ],
      pigs: [
        { x: 470, y: 330, radius: 14 },
        { x: 530, y: 345, radius: 14 },
        { x: 510, y: 270, radius: 12 },
        { x: 630, y: 330, radius: 14 },
        { x: 690, y: 345, radius: 14 },
      ],
    }
  }
}

export { LevelManager }