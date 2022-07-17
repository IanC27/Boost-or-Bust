

class LevelZero extends Phaser.Scene {
    constructor() {
        super("LevelZero");
    }

    preload() {
        this.load.image('hero', 'assets/hero.png');
        this.load.image('protoTiles', 'assets/protoTiles.png');
        this.load.image('background', 'assets/background.png');
        this.load.image('platform', 'assets/platform.png');
        this.load.image('lava', 'assets/lava.png');
        this.load.image('lifeHeart', 'assets/life_heart.png');

        this.load.audio('boost', 'assets/booost.wav');
        this.load.audio('explode', 'assets/Explosion9.wav');
        this.load.audio('jump', 'assets/Jump3.wav');

    }

    create() {
        this.VELOCITY = 100;
        this.JUMP_VELOCITY = -290;
        this.BOOST_VELOCITY = -300;
        this.Y_GRAVITY = 400
        this.STARTING_HEALTH = 3;
        this.startingPosition = {x: game.config.width / 2, y:game.config.height - 32}

        /*
        this.gui = new dat.GUI();
        let playerFolder = this.gui.addFolder('Parameters');
        playerFolder.add(this, 'VELOCITY', 0, 1000).step(10);
        playerFolder.add(this, 'JUMP_VELOCITY', -400, 0).step(10);
        playerFolder.add(this, 'BOOST_VELOCITY', -400, 0).step(10);
        playerFolder.add(this, 'Y_GRAVITY', 0, 350).step(10);
        playerFolder.open()
        */

        this.controls = this.input.keyboard.addKeys({
            jump: 'SPACE',
            boost: 'SHIFT',
            left: 'A',
            right: 'D'
        });

        this.add.tileSprite(game.config.width / 2, game.config.height / 2, 400, 350, 'background').setScrollFactor(0)

        this.hero = this.physics.add.sprite(this.startingPosition.x, this.startingPosition.y, 'hero', 0);
        this.cameras.main.startFollow(this.hero, true, 0.1, 0.1, 0, 75);
        this.cameras.main.setDeadzone(game.config.width, 50);

        this.platforms = this.physics.add.staticGroup();
        this.physics.add.collider(this.hero, this.platforms, null, (player, platform) => {
            if (player.y - 16 > platform.y - 8) {
                return false;
            }
            return true;
        });
        this.lastPlatformX = game.config.width / 2;
        this.nextPlatformY = game.config.height - 70;

        this.platformMilestone = game.config.height - 70;

        for (let i = 0; i < 5; i++) {
            this.createPlatform();
        }

        this.walls = this.physics.add.staticGroup();
        this.walls.add( this.add.rectangle(game.config.width / 2, game.config.height - 16, game.config.width, 128, 0xffffff).setOrigin(0.5, 0))
        this.walls.add( this.add.rectangle(0, 0, 32, game.config.height, 0x000000).setOrigin(0, 0).setScrollFactor(0));
        this.walls.add( this.add.rectangle(game.config.width - 32, 0, 32, game.config.height, 0x000000).setOrigin(0, 0).setScrollFactor(0));

        this.physics.add.collider(this.hero, this.walls);

        this.lava = this.physics.add.sprite(game.config.width / 2, game.config.height + 30, 'lava').setOrigin(0.5, 0);
        this.lava.setVelocityY(-10);
        this.lava.setBodySize(400, 350);
        this.physics.add.overlap(this.hero, this.lava, this.gameOver, null, this);

        this.lavaSpeedMilestone = 200;

        
        const textConfigUI = {
            fontFamily: 'Consolas',
            fontSize: '15px',
            color: '#000000',
            align: 'center',
            padding: {
                top: 5,
                bottom: 5,
            }
        }
        this.add.text(game.config.width / 2, game.config.height - 60, 'Jetpack', textConfigUI).setOrigin(0.5).setScrollFactor(0).setDepth(1);
        
        this.jetpackHealthBar = this.add.rectangle(game.config.width / 2, game.config.height - 45, game.config.width / 2, 12, 0xff0000);
        this.jetpackHealthBar.setScrollFactor(0, 0);
        this.jetpackHealthBar.setDepth(1);

        this.jetpackChargeBar = this.add.rectangle(game.config.width / 2, game.config.height - 41, game.config.width / 2, 2, 0x00ff00);
        this.jetpackChargeBar.setScrollFactor(0);
        this.jetpackChargeBar.setDepth(1);

        this.jetpackHealthText = this.add.text(game.config.width / 2, game.config.height - 45, '100%', textConfigUI).setOrigin(0.5).setScrollFactor(0).setDepth(1);

        this.scoreText = this.add.text(40, 5, 'Distance: 0m', textConfigUI).setOrigin(0).setScrollFactor(0).setDepth(1);
        this.hearts = this.add.tileSprite(game.config.width - 32, 5, 32*this.STARTING_HEALTH, 32, 'lifeHeart').setOrigin(1, 0).setScrollFactor(0);

        this.boostReady = true;
        this.boost = false;
        this.jetpackIntegrity = 1;
        this.life = this.STARTING_HEALTH;
        this.score = 0;
        this.justDown = false;
    }

    update() {
        let distance = this.startingPosition.y - this.hero.y;
        this.score = Math.floor(distance / 16);
        this.scoreText.text = `Distance: ${this.score}m`;


        let movement = 0;
        if (this.controls.right.isDown) {
            movement += 1;
        }
        if (this.controls.left.isDown) {
            movement -= 1;
        }

        this.hero.setVelocityX(movement * this.VELOCITY);
        this.hero.setGravityY(this.Y_GRAVITY)

        if (`this.controls.jump.isDown `&& this.hero.body.blocked.down) {
            this.hero.setVelocityY(this.JUMP_VELOCITY);
            if (!this.justDown) {
                this.sound.play('jump');
                this.justDown = true;
            }
        } else {
            this.justDown = false
        }

        if (Phaser.Input.Keyboard.JustDown(this.controls.boost) && this.boostReady){
            if (this.rollForBoost()) {
                this.sound.play('boost');
                this.jetpackIntegrity -= this.jetpackIntegrity / 3;
                this.jetpackHealthText.text = `${Math.floor(this.jetpackIntegrity * 100)}%`
                this.jetpackHealthBar.displayWidth = (game.config.width / 2) * this.jetpackIntegrity
                this.boostReady = false;
                this.boost = true;
                this.time.delayedCall(1000, () => {this.boost = false;}, null, this);
            } else {
                this.sound.play('explode');
                this.takeDamage();
            }
        }

        if (this.boost) {
            this.hero.setVelocityY(this.BOOST_VELOCITY);
            this.hero.setVelocityX(movement * this.VELOCITY * 1.5);
        } else {
            this.hero.setVelocityX(movement * this.VELOCITY);
        }

        if(!this.boostReady & this.hero.body.blocked.down){
            this.boostReady = true;
        }

        if (this.hero.y < this.platformMilestone) {
            console.log("making platform")
            this.createPlatform();
            this.platformMilestone -= 60;
            
        }

        if (distance > this.lavaSpeedMilestone) {
            console.log("lava gets faster");
            this.lava.setVelocityY(this.lava.body.velocity.y * 1.5);
            this.lavaSpeedMilestone *= 2;
        }
    }

    rollForBoost() {
        return !(Math.random() >= this.jetpackIntegrity)
    }

    takeDamage() {
        this.life -= 1;
        this.hearts.width = this.life * 32;
        if (this.life <= 0) {
            this.gameOver();
        }
    }

    gameOver() {
        this.hero.setTintFill(0x770000)
        this.hero.disableBody();
        
        const gameOverTextConfig = {
            fontFamily: 'Consolas',
            fontSize: '35px',
            color: '#000000',
            align: 'center',
            padding: {
                top: 5,
                bottom: 5,
            }
        };

        const gameOverStuff = this.add.group()
        

        const fadeOut = this.add.rectangle(0, 0, game.config.width, game.config.height, 0xff5500)
            .setDepth(1)
            .setScrollFactor(0)
            .setOrigin(0);
        
        this.tweens.add({
            targets: fadeOut,
            alpha: {from: 0, to: 1},
            ease: 'Linear',
            duration: 1500,
            repeat:0
        })

        this.time.delayedCall(1500, () => {
            gameOverStuff.add(this.add.text(game.config.width / 2, game.config.height / 2 - 20, 'Game Over', gameOverTextConfig).setScrollFactor(0));
            gameOverTextConfig.fontSize = '15px'

            // save high score
            const currentBest = localStorage.getItem('highScore');
            if (this.score > currentBest) {
                localStorage.setItem('highScore', this.score);
                gameOverTextConfig.color = '#00ff00';
                gameOverStuff.add(this.add.text(game.config.width / 2, game.config.height / 2 + 10, `New high score: ${this.score}`, gameOverTextConfig).setScrollFactor(0));
                gameOverTextConfig.color = '#000000';
                if (currentBest) {
                    gameOverStuff.add(this.add.text(game.config.width / 2, game.config.height / 2 + 30, `Previous high score: ${currentBest}`, gameOverTextConfig).setScrollFactor(0));
                }
                
                
            } else {
                gameOverStuff.add(this.add.text(game.config.width / 2, game.config.height / 2 + 10, `Your score: ${this.score}`, gameOverTextConfig).setScrollFactor(0));
                gameOverStuff.add(this.add.text(game.config.width / 2, game.config.height / 2 + 30, `Current high score: ${currentBest}`, gameOverTextConfig).setScrollFactor(0));
                
            }

            gameOverStuff.add(this.add.text(game.config.width / 2, game.config.height / 2 + 60, 'Press R to try again\nPress SHIFT to return to the menu', gameOverTextConfig).setScrollFactor(0));

            gameOverStuff.setDepth(1);
            gameOverStuff.setOrigin(0.5);

            this.input.keyboard.on('keydown-R', () => {
                this.scene.restart();
            });

            this.input.keyboard.on('keydown-SHIFT', () => {
                this.scene.start("Menu");
            })

            console.log("game over screen - restart prompt");
        })

    }

    createPlatform() {
        let nextPlatform = randomRange(Math.max(this.lastPlatformX - 150, 64), Math.min(game.config.width - 64, this.lastPlatformX + 150));
        this.platforms.add(this.add.sprite(nextPlatform, this.nextPlatformY, 'platform', 0));
        this.lastPlatformX = nextPlatform;
        this.nextPlatformY = this.nextPlatformY - 70;
    }


    
}

function randomRange(min, max) {
        let range = max - min;
        let val = Math.random() * range
        return val + min;
    }