export class Panel extends Phaser.GameObjects.Container {
    private score = 0
    private phaseScore = 500
    private scoreText:Phaser.GameObjects.Text
    public newPhase = false
    constructor(scene:Phaser.Scene, x:number, y:number) {
        super(scene, x, y)
        this.scoreText = this.scene.add.text(0, 0, '0', {fontSize: 32})
        this.add(this.scoreText)
        this.scene.add.existing(this)
    }

    public addScore(score:number) {
        this.score += score
        this.scoreText.setText(this.score.toString())
        if (this.phaseScore <= this.score) {
            this.newPhase = true
            this.phaseScore = this.score * 1.5
        }
    }
}