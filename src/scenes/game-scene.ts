import { CONST } from '../const/const'
import { Tile } from '../objects/Tile'

export class GameScene extends Phaser.Scene {
    private grid: Map<string, Tile | undefined> = new Map<string, Tile | undefined>()

    private init = false

    private canMove: boolean

    private firstSelectedTile: Tile | undefined
    private secondSelectedTile: Tile | undefined

    private tileTweenSelect: Phaser.Tweens.BaseTween

    constructor() {
        super({
            key: 'GameScene',
        })
    }

    create(): void {

        this.canMove = true

        this.cameras.main.setBackgroundColor(0x78aade)
        for (let x = 0; x < CONST.gridHeight; x++) {
            for (let y = 0; y < CONST.gridWidth; y++) {
                const tile = this.addTile(x, y)
                this.grid.set(this.createKey(x, y), tile)
            }
        }

        this.shuffle()
        this.firstSelectedTile = undefined
        this.secondSelectedTile = undefined

        this.input.on('gameobjectdown', this.tileDown, this)
    }

    private createKey(i: number, j: number): string {
        return i.toString() + j.toString()
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
                const tile = this.grid.get(this.createKey(i, j))
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
        }, 2000)
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

            this.grid.set(this.getTileKey(this.firstSelectedTile?.x, this.firstSelectedTile?.y), this.secondSelectedTile)
            this.grid.set(this.getTileKey(this.secondSelectedTile?.x, this.secondSelectedTile?.y), this.firstSelectedTile)

            const tween1 = this.add.tween({
                targets: this.firstSelectedTile,
                x: this.secondSelectedTile.x,
                y: this.secondSelectedTile.y,
                ease: 'sine.inout',
                duration: 500,
                repeat: 0,
                yoyo: false,
            })

            const tween2 = this.add.tween({
                targets: this.secondSelectedTile,
                x: this.firstSelectedTile.x,
                y: this.firstSelectedTile.y,
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
        // console.log(listMatches)
        if (listMatches.length > 0) {
            for (const key of listMatches) {
                this.grid.get(key)?.setActive(false).setVisible(false)
                this.grid.set(key, undefined)
            }

            this.updateGrid()
            this.checkTweensComplete().then(()=>{
                this.fillTiles()
                this.checkTweensComplete().then(()=>{
                    this.checkMatches()    
                })
            })              
        }
        else {
            this.swapTiles()
        }
        this.resetTiles()
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

    private getMatches(): string[] {
        const listKey: string[] = []
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
                        }
                    }
                    else {
                        if (count >= 3) {
                            for (let k = j - count + 1; k < j + 1; k++) {
                                listKey.push(this.indexToKey(i, k))
                            }
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
                        }
                    }
                    else {
                        if (count >= 3) {
                            for (let k = j - count + 1; k < j + 1; k++) {
                                listKey.push(this.indexToKey(k, i))
                            }

                        }
                        count = 1
                    }
                }
            }
        }
        return listKey
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
                        onComplete: ()=>{
                            console.log("Finish Update")
                        },
                        onCompleteScope: this,
                    })
                    j = CONST.gridHeight
                }
            }
        }
    }

    private fillTiles():void {
        for (let i = CONST.gridWidth - 1; i >= 0; i--) {
            for (let j = CONST.gridHeight - 1; j >= 0; j--) {
                const currentTile = this.grid.get(this.indexToKey(i, j))
                if (currentTile === undefined) {
                    const newTilePosX = i *CONST.tileWidth +CONST.tileWidth/2
                    const newTilePosY = -1 *CONST.tileHeight+ CONST.tileHeight/2
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
                        onComplete: ()=>{
                            console.log("Add New Tiles")
                        },
                        onCompleteScope: this,
                    })
                }
            }
        }
    }

    // Get Hint Tiles

    // Show Hint Tiles



    // private swapTiles(): void {
    //     if (this.firstSelectedTile && this.secondSelectedTile) {
    //         // Get the position of the two tiles
    //         const firstTilePosition = {
    //             x: this.firstSelectedTile.x,
    //             y: this.firstSelectedTile.y,
    //         }

    //         const secondTilePosition = {
    //             x: this.secondSelectedTile.x,
    //             y: this.secondSelectedTile.y,
    //         }

    //         // Swap them in our grid with the tiles
    //         this.tileGrid[firstTilePosition.y / CONST.tileHeight][
    //             firstTilePosition.x / CONST.tileWidth
    //         ] = this.secondSelectedTile
    //         this.tileGrid[secondTilePosition.y / CONST.tileHeight][
    //             secondTilePosition.x / CONST.tileWidth
    //         ] = this.firstSelectedTile

    //         // Move them on the screen with tweens
    //         this.add.tween({
    //             targets: this.firstSelectedTile,
    //             x: this.secondSelectedTile.x,
    //             y: this.secondSelectedTile.y,
    //             ease: 'sine.inout',
    //             duration: 400,
    //             repeat: 0,
    //             yoyo: false,
    //         })

    //         this.add.tween({
    //             targets: this.secondSelectedTile,
    //             x: this.firstSelectedTile.x,
    //             y: this.firstSelectedTile.y,
    //             ease: 'sine.inout',
    //             duration: 400,
    //             repeat: 0,
    //             yoyo: false,
    //             onComplete: () => {
    //                 this.checkMatches()
    //             },
    //         })

    //         this.firstSelectedTile =
    //             this.tileGrid[firstTilePosition.y / CONST.tileHeight][
    //             firstTilePosition.x / CONST.tileWidth
    //             ]
    //         this.secondSelectedTile =
    //             this.tileGrid[secondTilePosition.y / CONST.tileHeight][
    //             secondTilePosition.x / CONST.tileWidth
    //             ]
    //     }
    // }

    // private checkMatches(): void {
    //     //Call the getMatches function to check for spots where there is
    //     //a run of three or more tiles in a row
    //     const matches = this.getMatches(this.tileGrid)

    //     //If there are matches, remove them
    //     if (matches.length > 0) {
    //         //Remove the tiles
    //         this.removeTileGroup(matches)
    //         // Move the tiles currently on the board into their new positions
    //         this.resetTile()
    //         //Fill the board with new tiles wherever there is an empty spot
    //         this.fillTile()
    //         this.tileUp()
    //         this.checkMatches()
    //     } else {
    //         // No match so just swap the tiles back to their original position and reset
    //         this.swapTiles()
    //         this.tileUp()
    //         this.canMove = true
    //     }
    // }

    // private resetTile(): void {
    //     // Loop through each column starting from the left
    //     for (let y = this.tileGrid.length - 1; y > 0; y--) {
    //         // Loop through each tile in column from bottom to top
    //         for (let x = this.tileGrid[y].length - 1; x > 0; x--) {
    //             // If this space is blank, but the one above it is not, move the one above down
    //             if (this.tileGrid[y][x] === undefined && this.tileGrid[y - 1][x] !== undefined) {
    //                 // Move the tile above down one
    //                 const tempTile = this.tileGrid[y - 1][x]
    //                 this.tileGrid[y][x] = tempTile
    //                 this.tileGrid[y - 1][x] = undefined

    //                 this.add.tween({
    //                     targets: tempTile,
    //                     y: CONST.tileHeight * y,
    //                     ease: 'Linear',
    //                     duration: 200,
    //                     repeat: 0,
    //                     yoyo: false,
    //                 })

    //                 //The positions have changed so start this process again from the bottom
    //                 //NOTE: This is not set to me.tileGrid[i].length - 1 because it will immediately be decremented as
    //                 //we are at the end of the loop.
    //                 x = this.tileGrid[y].length
    //             }
    //         }
    //     }
    // }

    // private fillTile(): void {
    //     //Check for blank spaces in the grid and add new tiles at that position
    //     for (let y = 0; y < this.tileGrid.length; y++) {
    //         for (let x = 0; x < this.tileGrid[y].length; x++) {
    //             if (this.tileGrid[y][x] === undefined) {
    //                 //Found a blank spot so lets add animate a tile there
    //                 const tile = this.addTile(x, y)

    //                 //And also update our "theoretical" grid
    //                 this.tileGrid[y][x] = tile
    //             }
    //         }
    //     }
    // }

    // private tileUp(): void {
    //     // Reset active tiles
    //     this.firstSelectedTile = undefined
    //     this.secondSelectedTile = undefined
    // }

    // private removeTileGroup(matches: any): void {
    //     // Loop through all the matches and remove the associated tiles
    //     for (let i = 0; i < matches.length; i++) {
    //         const tempArr = matches[i]

    //         for (let j = 0; j < tempArr.length; j++) {
    //             const tile = tempArr[j]
    //             //Find where this tile lives in the theoretical grid
    //             const tilePos = this.getTilePos(this.tileGrid, tile)

    //             // Remove the tile from the theoretical grid
    //             if (tilePos.x !== -1 && tilePos.y !== -1) {
    //                 tile.destroy()
    //                 this.tileGrid[tilePos.y][tilePos.x] = undefined
    //             }
    //         }
    //     }
    // }

    // private getTilePos(tileGrid: (Tile | undefined)[][], tile: Tile): any {
    //     const pos = { x: -1, y: -1 }

    //     //Find the position of a specific tile in the grid
    //     for (let y = 0; y < tileGrid.length; y++) {
    //         for (let x = 0; x < tileGrid[y].length; x++) {
    //             //There is a match at this position so return the grid coords
    //             if (tile === tileGrid[y][x]) {
    //                 pos.x = x
    //                 pos.y = y
    //                 break
    //             }
    //         }
    //     }

    //     return pos
    // }



    // private getMatches(tileGrid: (Tile | undefined)[][]): Tile[][] {
    //     const matches: Tile[][] = []
    //     let groups: Tile[] = []

    //     // Check for horizontal matches
    //     for (let y = 0; y < tileGrid.length; y++) {
    //         const tempArray = tileGrid[y]
    //         groups = []
    //         for (let x = 0; x < tempArray.length; x++) {
    //             if (x < tempArray.length - 2) {
    //                 if (tileGrid[y][x] && tileGrid[y][x + 1] && tileGrid[y][x + 2]) {
    //                     if (
    //                         tileGrid[y][x]?.texture.key === tileGrid[y][x + 1]?.texture.key &&
    //                         tileGrid[y][x + 1]?.texture.key === tileGrid[y][x + 2]?.texture.key
    //                     ) {
    //                         const tile1 = tileGrid[y][x]
    //                         const tile2 = tileGrid[y][x + 1]
    //                         const tile3 = tileGrid[y][x + 2]
    //                         if (tile1 !== undefined && tile2 !== undefined && tile3 !== undefined) {
    //                             if (groups.length > 0) {
    //                                 if (groups.indexOf(tile1) == -1) {
    //                                     matches.push(groups)
    //                                     groups = []
    //                                 }
    //                             }

    //                             if (groups.indexOf(tile1) == -1) {
    //                                 groups.push(tile1)
    //                             }

    //                             if (groups.indexOf(tile2) == -1) {
    //                                 groups.push(tile2)
    //                             }

    //                             if (groups.indexOf(tile3) == -1) {
    //                                 groups.push(tile3)
    //                             }
    //                         }
    //                     }
    //                 }
    //             }
    //         }

    //         if (groups.length > 0) {
    //             matches.push(groups)
    //         }
    //     }

    //     //Check for vertical matches
    //     for (let j = 0; j < tileGrid.length; j++) {
    //         const tempArr = tileGrid[j]
    //         groups = []
    //         for (let i = 0; i < tempArr.length; i++) {
    //             if (i < tempArr.length - 2)
    //                 if (tileGrid[i][j] && tileGrid[i + 1][j] && tileGrid[i + 2][j]) {
    //                     if (
    //                         tileGrid[i][j]?.texture.key === tileGrid[i + 1][j]?.texture.key &&
    //                         tileGrid[i + 1][j]?.texture.key === tileGrid[i + 2][j]?.texture.key
    //                     ) {
    //                         const tile1 = tileGrid[i][j]
    //                         const tile2 = tileGrid[i + 1][j]
    //                         const tile3 = tileGrid[i + 2][j]
    //                         if (tile1 !== undefined && tile2 !== undefined && tile3 !== undefined) {
    //                             if (groups.length > 0) {
    //                                 if (groups.indexOf(tile1) == -1) {
    //                                     matches.push(groups)
    //                                     groups = []
    //                                 }
    //                             }

    //                             if (groups.indexOf(tile1) == -1) {
    //                                 groups.push(tile1)
    //                             }
    //                             if (groups.indexOf(tile2) == -1) {
    //                                 groups.push(tile2)
    //                             }
    //                             if (groups.indexOf(tile3) == -1) {
    //                                 groups.push(tile3)
    //                             }
    //                         }
    //                     }
    //                 }
    //         }
    //         if (groups.length > 0) matches.push(groups)
    //     }

    //     return matches
    // }

    // private shuffleTiles(): void {
    //     //
    // }
}
