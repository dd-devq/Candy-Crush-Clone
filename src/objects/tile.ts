import { CONST } from '../const/const'
import { IImageConstructor } from '../interfaces/image.interface'

export class Tile extends Phaser.GameObjects.Image {
    private hintEffect: Phaser.Tweens.BaseTween
    private selectEffect: Phaser.Tweens.BaseTween
    private swapEffect: Phaser.Tweens.BaseTween
    private idleEffect: Phaser.Tweens.BaseTween
    private shuffleEffect: Phaser.Tweens.BaseTween

    private particleEmitter: Phaser.GameObjects.Particles.ParticleEmitter

    private tileGraphics: Phaser.GameObjects.Graphics
    private gridX: number
    private gridY: number

    constructor(aParams: IImageConstructor, x: number, y: number) {
        super(aParams.scene, aParams.x, aParams.y, aParams.texture, aParams.frame)

        this.setOrigin(0.5).setInteractive()
        this.setupEffect()
        this.scene.add.existing(this)
        this.gridX = x
        this.gridY = y
    }

    private setupEffect(): void {
        this.selectEffect = this.scene.tweens.add({
            targets: this,
            scaleX: 1.1,
            scaleY: 0.9,
            repeat: -1,
            yoyo: true,
            duration: 200,
            ease: 'Linear',
        }).pause()

        this.idleEffect = this.scene.tweens.add({
            targets: this,
            rotation: Phaser.Math.PI2,
            repeat: 0,
            yoyo: true,
            duration: 300,
            ease: 'sine.out',
        }).pause()
    }

    private setupParticles():void {
        const shape= new Phaser.Geom.Rectangle(0, 0, this.width, this.height)
        this.particleEmitter = this.scene.add.particles(this.x - CONST.tileWidth/2, this.y - CONST.tileHeight/2, 'flares', {
            frame: { frames: ['white'], cycle: false },
            blendMode: 'ADD',
            lifespan: 250,
            quantity: 1,
            scale: { start: 0.1, end: 0.01 }
        })

        this.particleEmitter.addEmitZone({type: 'edge', source: shape, quantity: 64, total: 1})
    }

    public setupSwapEffect(x: number, y: number, callback: () => void) {
        this.swapEffect = this.scene.tweens.add({
            targets: this,
            x: x,
            y: y,
            repeat: 0,
            duration: 400,
            ease: 'sine.inout',
            onComplete: callback,
            onCompleteScope: this,
        })
    }

    public backToPosition() {
        const posX = this.gridX * CONST.tileWidth +CONST.tileWidth/2  
        const posY = this.gridY * CONST.tileHeight +CONST.tileHeight/2 
    
        this.scene.add.tween({
            targets: this,
            x: posX,
            y: posY,
            rotation: 0,
            ease: 'cubic.inout',
            repeat: 0,
            duration: 750,
            onCompleteScope: this,
        })

    }


    public setRandomTextures():void {
        const randomTileType: string =
        CONST.candyTypes[Phaser.Math.RND.between(0, CONST.candyTypes.length - 1)]

        this.texture.key = randomTileType
    }

    public showSelectEffect(): void {
        this.selectEffect.resume()
        this.setupParticles()
    }

    public deselect(): void {
        this.selectEffect.pause()
        this.setScale(1)
        this.particleEmitter.pause()
        this.particleEmitter.setVisible(false)
    }


    public showIdleEffect(): void {
        this.selectEffect.resume()
    }

    public showMatchEffect(): void {
        //
    }

    public getKey(): string {
        return this.texture.key
    }
}
