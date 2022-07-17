const config = {
    width: 400,
    height: 350,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
            gravity: {
                x: 0,
                y: 0
            }
        }
    },
    pixelArt: true,
    scene: [Menu, LevelZero]
};

const game = new Phaser.Game(config)