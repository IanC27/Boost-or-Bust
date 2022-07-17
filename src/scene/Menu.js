class Menu extends Phaser.Scene {
    constructor() {
        super("Menu");
    }

    preload() {
    }

    create() {
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

        this.add.text(game.config.width / 2, 70, 'Boost\nor\nBust', menuConfig).setOrigin(0.5);

        menuConfig.fontSize = '14px';
        this.add.text(game.config.width / 2, game.config.height - 90, 'A and D to move left/right.\nShift key to attempt a boost with your jetpack', menuConfig).setOrigin(0.5);
        this.add.text(game.config.width / 2, game.config.height / 2, `You are in possesion of an old jetpack. It may come in handy as you try to escape this volcano. But watch out! As you use it, it will become more damaged and will have an increased likelihood of backfiring and hurting you so use it wisely.`,
                                                                        menuConfig).setOrigin(0.5);
        menuConfig.color = '#449900';
        this.add.text(game.config.width / 2, game.config.height - 20, 'Press the boost key to begin').setOrigin(0.5);

        this.input.keyboard.on('keydown-SHIFT', () => {
            this.scene.start("LevelZero");
        })

    }
}