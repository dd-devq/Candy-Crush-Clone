import { Confetti } from "./Confetti"

export class Panel extends Phaser.GameObjects.Container {
    private score = 0
    private phaseScore = 500
    private scoreText: Phaser.GameObjects.Text
    private background: Phaser.GameObjects.Graphics
    private loadingBar: Phaser.GameObjects.Graphics
    private progressBar: Phaser.GameObjects.Graphics

    public newPhase = false

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y)
        this.scoreText = this.scene.add.text(this.scene.cameras.main.width / 2 - x, this.scene.cameras.main.height / 2 - y / 1.75, 'SCORE: ' + '0', { fontSize: 32 }).setOrigin(0.5)

        this.background = this.scene.add.graphics()
        this.background.lineStyle(3, 0xFFA500, 1)
        this.background.fillStyle(0x000000, 0.8).setAlpha(0.75)

        const width = 500
        const height = 150
        const cornerRadius = 10

        this.background.fillRoundedRect(0, 0, width, height, cornerRadius)
        this.background.strokeRoundedRect(0, 0, width, height, cornerRadius)
        this.createLoadingBar()
        this.add(this.background)
        this.add(this.scoreText)
        this.add(this.loadingBar)
        this.add(this.progressBar)
        this.scene.add.existing(this)
    }

    private createLoadingBar(): void {
        this.loadingBar = this.scene.add.graphics()
        this.loadingBar.fillStyle(0x78aade, 1)
        this.loadingBar.fillRect(0, this.scene.cameras.main.height / 2 - this.y / 2,
            500,
            20
        )
        this.progressBar = this.scene.add.graphics()
    }

    public addScore(score: number) {
        this.score += score
        this.scoreText.setText('SCORE: ' + this.score.toString())
        this.progressBar.clear()
        this.progressBar.fillStyle(0xFFA500, 1)
        this.progressBar.fillRect(
            0, this.scene.cameras.main.height / 2 - this.y / 2,
            500 * (this.score / this.phaseScore >= 1 ? 1 : this.score / this.phaseScore),
            20
        )
        
        if (this.phaseScore <= this.score) {
            this.newPhase = true
            this.phaseScore = this.score * 1.5

            const particles = this.scene.add.particles(this.scene.cameras.main.width / 2, this.scene.cameras.main.height, 'confetti', {
                lifespan: 10000,
                frame: ['red.png', 'yellow.png', 'green.png', 'orange.png', 'blue.png', 'pink.png'],
                angle: { min: 180, max: 360 },
                speedX: { min: -75, max: 75 },
                speedY: { min: -125, max: -175 },
                gravityY: 60,
                scale: { min: 0.1, max: 1.5 },
                emitting: true,
                particleClass: Confetti,
            })
            particles.explode(150)
            particles.setDepth(10)
        }

    }
}