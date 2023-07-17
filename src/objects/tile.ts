import { CONST } from '../const/const'
import { IImageConstructor } from '../interfaces/image.interface'

export class Tile extends Phaser.GameObjects.Image {
    private hintEffect: Phaser.Tweens.BaseTween
    private selectEffect: Phaser.Tweens.BaseTween
    private idleEffect: Phaser.Tweens.BaseTween

    private particleEmitter: Phaser.GameObjects.Particles.ParticleEmitter
    public burstParticleEmitter: Phaser.GameObjects.Particles.ParticleEmitter
    private tileGraphics: Phaser.GameObjects.Graphics

    public isBurst: boolean

    private gridX: number
    private gridY: number

    constructor(aParams: IImageConstructor, x: number, y: number) {
        super(aParams.scene, aParams.x, aParams.y, aParams.texture, aParams.frame)
        this.isBurst = false
        this.setOrigin(0.5).setInteractive()
        this.setupEffect()
        this.scene.add.existing(this)
        this.setupParticles()
        this.tileGraphics = this.scene.add.graphics()
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
    }

    private setupParticles(): void {
        this.particleEmitter = this.scene.add.particles(this.x - CONST.tileWidth / 2, this.y - CONST.tileHeight / 2, 'flares', {
            frame: ['red', 'yellow', 'green', 'white', 'blue'],
            lifespan: 1250,
            speed: { min: 150, max: 200 },
            scale: { start: 0.25, end: 0 },
            gravityY: 120,
            blendMode: 'ADD',
            emitting: false
        })

    }



    public backToPosition() {
        const posX = this.gridX * CONST.tileWidth + CONST.tileWidth / 2
        const posY = this.gridY * CONST.tileHeight + CONST.tileHeight / 2

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


    public setRandomTextures(): void {
        const randomTileType: string =
            CONST.candyTypes[Phaser.Math.RND.between(0, CONST.candyTypes.length - 1)]

        this.texture.key = randomTileType
    }

    public showSelectEffect(): void {
        this.selectEffect.resume()
        this.tileGraphics.lineStyle(2, 0xFFD580, 1)
        this.tileGraphics.strokeRoundedRect(this.x - CONST.tileWidth / 2, this.y - CONST.tileHeight / 2, CONST.tileWidth, CONST.tileHeight, 10)
    }

    public deselect(): void {
        this.selectEffect.pause()
        this.setScale(1)
        this.tileGraphics.clear()
    }

    public explode() {
        this.particleEmitter.setX(this.x)
        this.particleEmitter.setY(this.y)
        this.particleEmitter.explode(9)
    }

    public burst(isBig: boolean): void {
        if (isBig) {
            this.burstParticleEmitter = this.scene.add.particles(this.x, this.y, 'flares', {
                frame: 'white',
                color: [0x96e0da, 0x937ef3],
                colorEase: 'quart.out',
                lifespan: 500,
                speed: 100,
                quantity: 10,
                blendMode: 'ADD',
                scale: { start: 0.25, end: 0 },
                alpha: { start: 1, end: 0 },
                gravityY: 0,
                accelerationY: -20, // Acceleration in the Y direction
                rotate: { start: 0, end: 360 }, // Rotation range of the particles
            }).setDepth(-1)
        }
        else {
            this.burstParticleEmitter = this.scene.add.particles(this.x, this.y, 'flares',
                {
                    frame: 'white',
                    color: [0xfacc22, 0xf89800, 0xf83600, 0x9f0404],
                    colorEase: 'quad.out',
                    lifespan: 500,
                    speed: 100,
                    quantity: 20,
                    blendMode: 'ADD',
                    scale: { start: 0.25, end: 0 },
                    alpha: { start: 1, end: 0 },
                    gravityY: 0,
                    accelerationY: -20, // Acceleration in the Y direction
                    rotate: { start: 0, end: 360 }, // Rotation range of the particles
                    }).setDepth(-1)
        }
    }

    public stopBurst(): void {
        if (this.burstParticleEmitter) {

            this.burstParticleEmitter.setActive(false).setVisible(false)
            this.burstParticleEmitter.stop()
        }
    }


    public showIdleEffect(): void {
        this.idleEffect = this.scene.tweens.add({
            targets: this,
            rotation: Phaser.Math.PI2,
            repeat: 0,
            duration: 500,
            ease: 'sine.out',
            onComplete: () => {
                this.idleEffect.destroy()
            },
            onCompleteScope: this,
        })
    }



    public showMatchEffect(): void {
        //
    }

    public getKey(): string {
        return this.texture.key
    }

    public update(): void {
        if (this.isBurst) {

            this.burstParticleEmitter.x = this.x
            this.burstParticleEmitter.y = this.y
        }
    }
}
