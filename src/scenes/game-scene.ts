import { CONST } from '../const/const'
import { Panel } from '../objects/Panel'
import { Tile } from '../objects/Tile'

export class GameScene extends Phaser.Scene {
    private grid: Map<string, Tile | undefined> = new Map<string, Tile | undefined>()

    private canMove: boolean
    private firstSelectedTile: Tile | undefined
    private secondSelectedTile: Tile | undefined

    private scoreBoard: Panel
    private idleTime = 0

    private readonly IDLE_TIME = 15000


    constructor() {
        super({
            key: 'GameScene',
        })
    }

    create(): void {
        this.canMove = true

        this.cameras.main.setBackgroundColor(0x78aade)
        // for (let x = 0; x < CONST.gridHeight; x++) {
        //     for (let y = 0; y < CONST.gridWidth; y++) {
        //         const tile = this.addTile(x, y)
        //         this.grid.set(this.indexToKey(x, y), tile)
        //     }
        // }

        this.scoreBoard = new Panel(this, 100, this.cameras.main.height / 1.25).setDepth(10)
        this.shuffle()
        this.firstSelectedTile = undefined
        this.secondSelectedTile = undefined

        this.input.on('gameobjectdown', this.tileDown, this)
    }

    update(time: number, delta: number): void {
        if (this.IDLE_TIME <= this.idleTime) {
            this.grid.forEach((tile) => {
                tile?.showIdleEffect()
            })
            this.idleTime = 0
        }
        if (this.scoreBoard.newPhase) {
            this.checkTweensComplete().then(()=>{
                this.grid.forEach((tile) => {
                    tile?.stopBurst()
                    tile?.destroy()
                })
                this.grid.clear()
                this.shuffle()
            })
            this.scoreBoard.newPhase = false
        }
        this.idleTime += delta

        this.grid.forEach((tile) => {
            tile?.update()
        })
    }

    private addTile(x: number, y: number): Tile {
        const randomTileType: string =
            CONST.candyTypes[Phaser.Math.RND.between(0, CONST.candyTypes.length - 1)]

        return new Tile({
            scene: this,
            x: this.cameras.main.width / 2,
            y: this.cameras.main.height / 2,
            texture: randomTileType,
        }, x, y)
    }

    private shuffle(): void {
        const shuffleShape = this.getShuffleShape()
        for (let i = 0; i < CONST.gridHeight; i++) {
            for (let j = 0; j < CONST.gridWidth; j++) {
                const tile = this.addTile(i, j)
                this.grid.set(this.indexToKey(i, j), tile)
                const value = { value: (i * CONST.gridHeight + j) / (CONST.gridHeight * CONST.gridWidth) }
                const point = this.getPointFromShape(shuffleShape, value.value)

                if (tile !== undefined) {
                    tile.x = point.x
                    tile.y = point.y
                }

                this.tweens.add({
                    targets: value,
                    value: value.value + 1,
                    duration: 1000,
                    repeat: 0,
                    ease: 'sine.out',
                    onComplete: () => {
                        tile?.backToPosition()
                    },
                    onCompleteScope: this,
                    onUpdate: () => {
                        if (value.value > 1) {
                            value.value -= 1
                        }
                        const point = this.getPointFromShape(shuffleShape, value.value)
                        if (tile !== undefined) {
                            tile.x = point.x
                            tile.y = point.y
                        }
                    },
                    onUpdateScope: this,
                }
                )
            }
        }
        setTimeout(() => {
            this.checkMatches()
        }, 2100)
    }


    private getPointFromShape(shape: Phaser.Geom.Rectangle | Phaser.Geom.Circle, value: number): Phaser.Geom.Point {
        if (shape instanceof Phaser.Geom.Rectangle) {
            return Phaser.Geom.Rectangle.GetPoint(shape, value)
        }
        return Phaser.Geom.Circle.GetPoint(shape, value)
    }

    private getShuffleShape(): Phaser.Geom.Rectangle | Phaser.Geom.Circle {
        const rnd = Phaser.Math.RND.between(0, 1)
        const centerX = this.cameras.main.width / 2
        const centerY = this.cameras.main.width / 2
        if (rnd == 0) {
            return new Phaser.Geom.Rectangle(centerX - 200, centerY - 200, 400, 400)
        }
        return new Phaser.Geom.Circle(centerX, centerY, 225)
    }

    private getTileKey(x: number, y: number): string {
        return ((x - CONST.tileWidth / 2) / CONST.tileWidth).toString() + ((y - CONST.tileHeight / 2) / CONST.tileHeight).toString()
    }

    private tileDown(pointer: Phaser.Input.Pointer, gameobject: Tile): void {

        if (this.canMove) {
            this.idleTime = 0
            if (this.firstSelectedTile === undefined) {
                this.firstSelectedTile = gameobject
                this.firstSelectedTile.showSelectEffect()
            } else {
                if (this.isAdjacentTile(this.firstSelectedTile, gameobject)) {
                    this.canMove = false
                    this.firstSelectedTile.deselect()

                    if (this.firstSelectedTile === gameobject) {
                        this.firstSelectedTile = undefined
                        this.canMove = true
                    } else {
                        this.secondSelectedTile = gameobject
                        this.swapTiles()
                    }

                } else {
                    this.firstSelectedTile.deselect()
                    this.firstSelectedTile = gameobject
                    this.firstSelectedTile.showSelectEffect()
                }
            }
        }
    }
    private isAdjacentTile(tile1: Tile, tile2: Tile): boolean {
        const dx =
            Math.abs(tile1.x - tile2.x) /
            CONST.tileWidth
        const dy =
            Math.abs(tile1.y - tile2.y) /
            CONST.tileHeight
        return dx === 1 && dy === 0 || dx === 0 && dy === 1 || dx === 0 && dy === 0
    }

    private resetTiles(): void {
        this.firstSelectedTile = undefined
        this.secondSelectedTile = undefined
        this.canMove = true
    }

    private swapTiles(): void {
        if (this.firstSelectedTile !== undefined && this.secondSelectedTile !== undefined) {
            this.idleTime = 0
            this.grid.set(this.getTileKey(this.firstSelectedTile?.x, this.firstSelectedTile?.y), this.secondSelectedTile)
            this.grid.set(this.getTileKey(this.secondSelectedTile?.x, this.secondSelectedTile?.y), this.firstSelectedTile)

            const tween1 = this.add.tween({
                targets: this.firstSelectedTile,
                x: this.secondSelectedTile.x,
                y: this.secondSelectedTile.y,
                rotation: Phaser.Math.PI2,
                ease: 'sine.inout',
                duration: 500,
                repeat: 0,
                yoyo: false,
            })


            const tween2 = this.add.tween({
                targets: this.secondSelectedTile,
                x: this.firstSelectedTile.x,
                y: this.firstSelectedTile.y,
                rotation: Phaser.Math.PI2,
                ease: 'sine.inout',
                duration: 500,
                repeat: 0,
                yoyo: false,
                onComplete: () => {
                    tween1.destroy()
                    tween2.destroy()
                    this.checkMatches()
                },
            })



            this.firstSelectedTile = this.grid.get(this.getTileKey(this.firstSelectedTile?.x, this.firstSelectedTile?.y))
            this.secondSelectedTile = this.grid.get(this.getTileKey(this.secondSelectedTile?.x, this.secondSelectedTile?.y))
        }
    }


    private checkMatches(): void {
        const listMatches = this.getMatches()

        // for (const list of listMatches) {
        //     console.log(list)
        // }

        if (listMatches.length > 0) {
            for (const listKey of listMatches) {
                if (listKey.length == 3) {
                    this.handle3Mathces(listKey)
                } else {
                    this.handleGreaterThan3Mathces(listKey)
                }
            }

            this.checkTweensComplete().then(() => {
                this.updateGrid()
            })
            this.checkTweensComplete().then(() => {
                this.fillTiles()
                this.checkTweensComplete().then(() => {
                    this.checkMatches()
                })
            })
        }
        else {
            this.swapTiles()
        }
        this.resetTiles()
    }

    private handle3Mathces(listMatches: string[]): void {
        let score = 0


        for (const key of listMatches) {
            const tile = this.grid.get(key)
            if (tile) {
                if (tile.isBurst) {
                    listMatches = listMatches.concat(this.getAdjacentBurstTiles(key))
                    tile.isBurst = false
                }
            }
        }

        // console.log(listMatches)

        for (const key of listMatches) {
            const tile = this.grid.get(key)
            tile?.stopBurst()
            tile?.explode()
            tile?.destroy()
            this.grid.set(key, undefined)
            score += 10
        }
        this.scoreBoard.addScore(score)

    }


    private getAdjacentBurstTiles(indexKey: string): string[] {
        const direction: { [key: number]: { x: number, y: number } } = {
            0: { x: -1, y: -1 },
            1: { x: -1, y: 0 },
            2: { x: -1, y: 1 },
            3: { x: 0, y: -1 },
            4: { x: 0, y: 1 },
            5: { x: 1, y: -1 },
            6: { x: 1, y: 0 },
            7: { x: 1, y: 1 },
        }

        const keyX = parseInt(indexKey[0])
        const keyY = parseInt(indexKey[1])
        const listBurstTile: string[] = []
        for (let i = 0; i < 8; i++) {
            const tileKey = this.indexToKey(keyX + direction[i].x, keyY + direction[i].y)
            if (this.grid.get(tileKey) !== undefined) {
                listBurstTile.push(tileKey)
            }
        }
        return listBurstTile
    }

    private handleGreaterThan3Mathces(listMatches: string[]): void {
        // Not Good Enough, 4 with 1 burst
        
        let score = 0
        for (const key of listMatches) {
            const tile = this.grid.get(key)
            if (tile) {
                if (tile.isBurst) {
                    listMatches = this.getAdjacentBurstTiles(key).concat(listMatches)
                    tile.isBurst = false
                }
            }
        }
        
        listMatches = listMatches.filter((elem, index, self)=> {
            return index === self.indexOf(elem)
        })

        console.log(listMatches)

        for (let i = 0; i < listMatches.length; i++) {
            if (i !== listMatches.length - 1) {
                const tempTile = this.grid.get(listMatches[i])
                if (tempTile !== undefined) {

                    this.tweens.add({
                        targets: tempTile,
                        x: this.grid.get(listMatches[listMatches.length - 1])?.x,
                        y: this.grid.get(listMatches[listMatches.length - 1])?.y,
                        duration: 250,
                        ease: 'sine.in',
                        repeat: 0,
                        yoyo: false,
                        onComplete: () => {
                            score += 10
                            tempTile?.stopBurst()
                            tempTile?.explode()
                            tempTile?.destroy()
                            this.grid.set(listMatches[i], undefined)
                            this.cameras.main.shake(150, 0.0075)
                        },
                        onCompleteScope: this,
                    })
                }
            }
        }

        const burstTile = this.grid.get(listMatches[listMatches.length - 1])
        if (burstTile) {
            burstTile.isBurst = true
            if (listMatches.length == 4) {
                burstTile.burst(false)
            }
            else {
                burstTile.burst(true)
            }
        }

        this.scoreBoard.addScore(score)
    }

    checkTweensComplete() {
        return new Promise<void>((resolve) => {
            const checkComplete = () => {
                const activeTweens = this.tweens.getTweens()
                const playingTweens = activeTweens.filter((tween) => tween.isPlaying())
                if (playingTweens.length === 0) {
                    resolve()
                } else {
                    setTimeout(checkComplete, 100)
                }
            }

            checkComplete()
        })
    }

    private indexToKey(x: number, y: number): string {
        return x.toString() + y.toString()
    }

    private getMatches(): string[][] {
        const listOfListKey: string[][] = []
        let listKey: string[] = []
        for (let i = 0; i < CONST.gridWidth; i++) {
            let count = 1
            for (let j = 0; j < CONST.gridHeight - 1; j++) {
                const tile1 = this.grid.get(this.indexToKey(i, j))
                const tile2 = this.grid.get(this.indexToKey(i, j + 1))
                if (tile1 && tile2) {
                    if (tile1.getKey() === tile2.getKey()) {
                        count += 1
                        if (j == CONST.gridHeight - 2 && count >= 3) {
                            for (let k = j - count + 2; k <= j + 1; k++) {
                                listKey.push(this.indexToKey(i, k))
                            }
                            listOfListKey.push(listKey)
                            listKey = []

                        }
                    }
                    else {
                        if (count >= 3) {
                            for (let k = j - count + 1; k < j + 1; k++) {
                                listKey.push(this.indexToKey(i, k))
                            }
                            listOfListKey.push(listKey)
                            listKey = []
                        }
                        count = 1
                    }
                }
            }
        }

        for (let i = 0; i < CONST.gridWidth; i++) {
            let count = 1
            for (let j = 0; j < CONST.gridHeight - 1; j++) {
                const tile1 = this.grid.get(this.indexToKey(j, i))
                const tile2 = this.grid.get(this.indexToKey(j + 1, i))
                if (tile1 && tile2) {

                    if (tile1.getKey() === tile2.getKey()) {
                        count += 1
                        if (j == CONST.gridHeight - 2 && count >= 3) {
                            for (let k = j - count + 2; k <= j + 1; k++) {
                                listKey.push(this.indexToKey(k, i))
                            }
                            listOfListKey.push(listKey)
                            listKey = []
                        }
                    }
                    else {
                        if (count >= 3) {
                            for (let k = j - count + 1; k < j + 1; k++) {
                                listKey.push(this.indexToKey(k, i))
                            }
                            listOfListKey.push(listKey)
                            listKey = []

                        }
                        count = 1
                    }
                }
            }
        }
        return listOfListKey
    }

    private updateGrid(): void {
        for (let i = CONST.gridWidth - 1; i >= 0; i--) {
            for (let j = CONST.gridHeight - 1; j > 0; j--) {
                const currentTile = this.grid.get(this.indexToKey(i, j))
                const aboveTile = this.grid.get(this.indexToKey(i, j - 1))
                if (currentTile === undefined && aboveTile !== undefined) {
                    this.grid.set(this.indexToKey(i, j), aboveTile)
                    this.grid.set(this.indexToKey(i, j - 1), undefined)

                    this.add.tween({
                        targets: aboveTile,
                        y: CONST.tileHeight * j + CONST.tileHeight / 2,
                        ease: 'sine.inout',
                        duration: 400,
                        repeat: 0,
                        yoyo: false,
                        onComplete: () => {
                            // console.log("Finish Update")
                        },
                        onCompleteScope: this,
                    })
                    j = CONST.gridHeight
                }
            }
        }
    }

    private fillTiles(): void {
        for (let i = CONST.gridWidth - 1; i >= 0; i--) {
            for (let j = CONST.gridHeight - 1; j >= 0; j--) {
                const currentTile = this.grid.get(this.indexToKey(i, j))
                if (currentTile === undefined) {
                    const newTilePosX = i * CONST.tileWidth + CONST.tileWidth / 2
                    const newTilePosY = -1 * CONST.tileHeight + CONST.tileHeight / 2
                    const newTile = this.addTile(i, j)
                    newTile.setX(newTilePosX)
                    newTile.setY(newTilePosY)
                    this.grid.set(this.indexToKey(i, j), newTile)
                    // console.log(this.grid.get(this.indexToKey(i, j))?.getKey())
                    this.add.tween({
                        targets: newTile,
                        y: CONST.tileHeight * j + CONST.tileHeight / 2,
                        ease: 'sine.inout',
                        duration: 300,
                        repeat: 0,
                        yoyo: false,
                        onComplete: () => {
                            // console.log("Add New Tiles")
                        },
                        onCompleteScope: this,
                    })
                }
            }
        }
    }

    // Get Hint Tiles

    // Show Hint Tiles
}
