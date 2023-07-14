import { BootScene } from './scenes/boot-scene'
import { GameScene } from './scenes/game-scene'

export const GameConfig: Phaser.Types.Core.GameConfig = {
    title: 'Candy crush',
    version: '2.0',
    width: 640,
    height: window.innerHeight,
    type: Phaser.AUTO,
    parent: 'game',
    scene: [BootScene, GameScene],
    backgroundColor: '#de3412',
    render: { pixelArt: false, antialias: true },
}
