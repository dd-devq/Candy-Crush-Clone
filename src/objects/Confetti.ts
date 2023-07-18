export class Confetti extends Phaser.GameObjects.Particles.Particle {
    public angleRotationRate: number
    
    constructor(emitter: Phaser.GameObjects.Particles.ParticleEmitter) {
        super(emitter)
        this.angleRotationRate = Phaser.Math.Between(-180, 180)
    }

    update(delta: number, step: number, processors: Phaser.GameObjects.Particles.ParticleProcessor[]): boolean {
        super.update(delta, step, processors)
        this.alpha -= step * 0.025
        if (this.alpha < 0) {
            this.destroy()
        }
        this.angle -= this.angleRotationRate * step
        this.y -= step * 400
        return super.update(delta, step, processors)
    }
}