export class Panel extends Phaser.GameObjects.Container {
    private score = 0
    private phaseScore = 500
    private scoreText:Phaser.GameObjects.Text
    private background: Phaser.GameObjects.Graphics

    public newPhase = false
    constructor(scene:Phaser.Scene, x:number, y:number) {
        super(scene, x, y)
        this.scoreText = this.scene.add.text(0, 0, '0', {fontSize: 32})
        
        this.background = this.scene.add.graphics()
        this.background.lineStyle(3, 0xFFD580, 1)
        this.background.fillStyle(0x000000, 0.8).setAlpha(0.75)    
        
        const width = 500 
        const height = 150
        const cornerRadius = 10 
        
        this.background.fillRoundedRect(0, 0, width, height, cornerRadius)
        this.background.strokeRoundedRect(0, 0, width, height, cornerRadius)

        this.add(this.background)
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