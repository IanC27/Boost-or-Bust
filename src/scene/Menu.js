class Menu extends Phaser.Scene {
    constructor() {
        super("Menu");
    }

    preload() {
        this.load.image('cobbles', 'assets/cobbleTile.png');
        this.load.image('GMTKlogo', 'assets/GMTK.png');
        let heroDimensions = {
            frameWidth: 16,
            frameHeight: 32
        };

        this.load.spritesheet('hero', 'assets/hero-sheet.png', heroDimensions);
    }

    create() {
        this.backdrop = this.add.tileSprite(0, 0, game.config.width, game.config.height, 'cobbles').setOrigin(0);
        this.add.image(game.config.width, game.config.height, 'GMTKlogo').setOrigin(1)

        this.add.sprite(game.config.width / 2, 70, 'hero', 1)

        let menuConfig = {
            fontFamily: 'Consolas',
            fontSize: '30px',
            color: '#ffffff',
            align: 'center',
            padding: {
                top: 5,
                bottom: 5,
            },
            wordWrap: {width: game.config.width - 20},
        }

        this.add.text(game.config.width / 2, 30, 'Boost or Bust', menuConfig).setOrigin(0.5);

        menuConfig.fontSize = '14px';
        this.add.text(game.config.width / 2, game.config.height - 90, 'A and D to move left/right.\nShift key to attempt a boost with your jetpack', menuConfig).setOrigin(0.5);
        this.add.text(game.config.width / 2, game.config.height / 2 - 20, `Well you just have the worst of luck don't you!\nYou just accidentally fell into this volcano! And all you have on you is the galaxy's worst jetpack. It might be of use, but it's so beat up that every time you use it makes it more likely the next time will backfire and explode!\nGood luck getting out!`,
                                                                        menuConfig).setOrigin(0.5);
        menuConfig.color = '#ffff00';
        this.add.text(game.config.width / 2, game.config.height - 20, 'Press the boost key to begin', menuConfig).setOrigin(0.5);

        this.input.keyboard.on('keydown-SHIFT', () => {
            this.scene.start("LevelZero");
        })

    }

    update(time, delta) {
        this.backdrop.tilePositionY += delta * 0.07
    }
}