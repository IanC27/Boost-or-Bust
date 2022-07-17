

class LevelZero extends Phaser.Scene {
    constructor() {
        super("LevelZero");
    }

    preload() {
        
        
        this.load.image('platform', 'assets/platform.png');
        this.load.image('lava', 'assets/lava.png');
        this.load.image('lifeHeart', 'assets/life_heart.png');
        this.load.image('boulder', 'assets/boulder.png');
        this.load.image('darkCobbles', 'assets/cobbleTileDark.png');
        this.load.image('repairKit', 'assets/repairKit.png');
        this.load.image('healthPack', 'assets/healthPack.png');

        this.load.audio('boost', 'assets/booost.wav');
        this.load.audio('explode', 'assets/Explosion9.wav');
        this.load.audio('jump', 'assets/Jump3.wav');

    }

    create() {
        this.VELOCITY = 170;
        this.JUMP_VELOCITY = -290;
        this.BOOST_VELOCITY = -300;
        this.Y_GRAVITY = 400;
        this.STARTING_HEALTH = 3;
        this.PLATFORM_SPREAD = 220;
        this.PLATFORM_HEIGHT = 70;
        this.LAVA_SPEED = 30;
        this.startingPosition = {x: game.config.width / 2, y:game.config.height - 32};

        this.controls = this.input.keyboard.addKeys({
            jump: 'SPACE',
            boost: 'SHIFT',
            left: 'A',
            right: 'D'
        });

        this.background = this.add.tileSprite(game.config.width / 2, game.config.height / 2, 400, 350, 'cobbles').setScrollFactor(0, 0);

        this.hero = this.physics.add.sprite(this.startingPosition.x, this.startingPosition.y, 'hero', 1);
        this.cameras.main.startFollow(this.hero, true, 0.1, 0.1, 0, 0);
        this.cameras.main.setDeadzone(game.config.width, 50);


        this.platforms = this.physics.add.staticGroup();
        this.physics.add.collider(this.hero, this.platforms, null, (player, platform) => {
            if (player.y - 16 > platform.y - 8) {
                return false;
            }
            return true;
        });
        this.lastPlatformX = game.config.width / 2;
        this.nextPlatformY = game.config.height - this.PLATFORM_HEIGHT;

        this.platformMilestone = game.config.height - this.PLATFORM_HEIGHT;

        for (let i = 0; i < 5; i++) {
            this.createPlatform();
        }

        this.platforms.add(this.add.tileSprite(game.config.width / 2, game.config.height - 16, game.config.width, 128, 'darkCobbles').setOrigin(0.5, 0));

       
        this.leftWall = this.physics.add.existing(this.add.rectangle(0, 0, 32, game.config.height).setOrigin(0));
        this.rightWall = this.physics.add.existing(this.add.rectangle(game.config.width - 32, 0, 32, game.config.height).setOrigin(0));
        this.leftWall.body.setImmovable();
        this.rightWall.body.setImmovable();

        this.walls = this.add.group();
        this.walls.add(this.add.tileSprite(0, 0, 32, game.config.height, 'darkCobbles').setScrollFactor(0));
        this.walls.add(this.add.tileSprite(game.config.width - 32, 0, 32, game.config.height, 'darkCobbles').setScrollFactor(0));
        this.walls.setOrigin(0);

        this.physics.add.collider(this.hero, this.leftWall);
        this.physics.add.collider(this.hero, this.rightWall);


        // hazards

        //lava
        this.lava = this.physics.add.sprite(game.config.width / 2, game.config.height + 30, 'lava').setOrigin(0.5, 0);
        this.lava.setVelocityY(-10);
        this.lava.setBodySize(400, 340);
        this.physics.add.overlap(this.hero, this.lava, this.gameOver, null, this);
        
        //rocks
        this.fallingRocks = this.physics.add.group();
        this.physics.add.overlap(this.hero, this.fallingRocks, this.takeDamage, null, this);

        this.fallingRockEvent = this.time.addEvent({
            delay: 5000,
            callback: this.fallingRock,
            callbackScope: this,
            loop: true,
            paused: true
        });

        // UI
        const textConfigUI = {
            fontFamily: 'Consolas',
            fontSize: '15px',
            color: '#ffffff',
            align: 'center',
            padding: {
                top: 5,
                bottom: 5,
            }
        }
        this.add.text(game.config.width / 2, game.config.height - 60, 'Jetpack', textConfigUI).setOrigin(0.5).setScrollFactor(0).setDepth(1);
        
        this.jetpackHealthBar = this.add.rectangle(game.config.width / 2, game.config.height - 45, game.config.width / 2, 12, 0x002166);
        this.jetpackHealthBar.setScrollFactor(0, 0);
        this.jetpackHealthBar.setDepth(1);

        this.jetpackChargeBar = this.add.rectangle(game.config.width / 2, game.config.height - 35, game.config.width / 2, 5, 0x00ff00);
        this.jetpackChargeBar.setScrollFactor(0);
        this.jetpackChargeBar.setDepth(1);

        this.jetpackHealthText = this.add.text(game.config.width / 2, game.config.height - 45, '100%', textConfigUI).setOrigin(0.5).setScrollFactor(0).setDepth(1);

        this.scoreText = this.add.text(40, 5, 'Distance: 0m', textConfigUI).setOrigin(0).setScrollFactor(0).setDepth(1);
        this.hearts = this.add.tileSprite(game.config.width - 32, 5, 32*this.STARTING_HEALTH, 32, 'lifeHeart').setOrigin(1, 0).setScrollFactor(0).setDepth(1);

        // STATUS
        this.boostReady = true;
        this.boost = false;
        this.jetpackIntegrity = 1;
        this.life = this.STARTING_HEALTH;
        this.invulnerable = false;
        this.score = 0;
        this.justDown = false;

        this.nextWaveAt = 50;

        // lava starts slow at first
        this.time.delayedCall(5000, () => {
            this.lava.setVelocityY(-this.LAVA_SPEED);
        })
    }

    update() {
        let distance = this.startingPosition.y - this.hero.y;
        this.score = Math.floor(distance / 16);
        this.scoreText.text = `Distance: ${this.score}m`;

        this.background.tilePositionY = this.cameras.main.scrollY;
        this.walls.propertyValueSet('tilePositionY', this.cameras.main.scrollY);
        this.leftWall.y = this.cameras.main.scrollY;
        this.rightWall.y = this.cameras.main.scrollY;
        
        this.hero.setGravityY(this.Y_GRAVITY);

        let movement = 0;
        if (this.controls.right.isDown) {
            movement += 1;
        }
        if (this.controls.left.isDown) {
            movement -= 1;
        }

        let heroFrame = movement + 1;

        if (this.hero.body.blocked.down) {
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
                this.boost = true;
                this.time.delayedCall(1000, () => {this.boost = false;}, null, this);
                this.time.delayedCall(5000, () => {
                    this.boostReady = true;
                });
                this.tweens.timeline({
                    targets: this.jetpackChargeBar,
                    ease: 'Linear',
        
                    tweens: [
                        {
                            targets: this.jetpackChargeBar,
                            displayWidth: 0,
                            duration: 1000
                        },
                        {
                            targets: this.jetpackChargeBar,
                            displayWidth: game.config.width / 2,
                            duration: 4000
                        }
                    ]
                });
            } else {
                this.time.delayedCall(4000, () => {
                    this.boostReady = true;
                });
                this.tweens.add({
                    targets: this.jetpackChargeBar,
                    displayWidth: {from:0, to: game.config.width / 2},
                    ease: 'Linear',
                    duration: 4000,
                    repeat: 0,
                    yoyo: false

                });
                this.takeDamage();
            }
            
        }

        if (this.boost) {
            this.hero.setVelocityY(this.BOOST_VELOCITY);
            this.hero.setVelocityX(movement * this.VELOCITY * 1.5);
            heroFrame += 3;
        } else {
            this.hero.setVelocityX(movement * this.VELOCITY);
        }

        this.hero.setFrame(heroFrame);

        if (this.hero.y < this.platformMilestone) {
            //console.log("making platform")
            this.createPlatform();
            this.platformMilestone -= 60;
            
        }

        if (this.score >= this.nextWaveAt) {
            //console.log("next wave");
            const chance = Math.random();
            if (chance >= 0.66) {
               this.spawnRepairPickup();
            } else if (chance >= 0.33) {
                this.spawnHealthPickup()
            }

            if (this.nextWaveAt >= 200) {
                // double the rate of rocks
                this.fallingRockEvent.timeScale = 2;
            } else if (this.nextWaveAt >= 100) {
                // let the rocks begin
                this.fallingRockEvent.paused = false;
            }
            this.nextWaveAt *= 2;
            if (this.PLATFORM_HEIGHT < 90) {
                this.PLATFORM_HEIGHT += 5;
            }
            if (this.LAVA_SPEED < 80) {
                this.LAVA_SPEED += 10;
                this.lava.setVelocityY(-this.LAVA_SPEED);
            }
            this.lava.y = this.hero.y + 340;
            
        }

    }

    rollForBoost() {
        this.boostReady = false;
        return !(Math.random() >= this.jetpackIntegrity)

    }

    takeDamage() {
        if(!this.invulnerable) {
            this.sound.play('explode');
            this.invulnerable = true;
            // 3 sec invulnerability
            this.time.delayedCall(2000, () => {
                this.invulnerable = false;
                //console.log("invulnerability over");
            });
            this.tweens.add({
                targets: this.hero,
                alpha: 0,
                ease: 'Cubic.easeOut',
                duration: 100,
                repeat: 10,
                yoyo: true
            });
            this.life -= 1;
            this.hearts.width = this.life * 32;
            if (this.life <= 0) {
                this.gameOver();
            }
        }
    }

    spawnRepairPickup() {
        const randX = randomRange(64, game.config.width - 64);
                let kit = this.physics.add.sprite(randX, this.nextPlatformY - 16, 'repairKit');
                this.physics.add.overlap(this.hero, kit, (player, pickup) => {
                    this.jetpackIntegrity = 1;
                    this.jetpackHealthBar.displayWidth = game.config.width / 2;
                    this.jetpackHealthText.text = '100%';
                    pickup.destroy();
                });

    }

    spawnHealthPickup() {
        const randX = randomRange(64, game.config.width - 64);
                let health = this.physics.add.sprite(randX, this.nextPlatformY - 16, 'healthPack');
                this.physics.add.overlap(this.hero, health, (player, pickup) => {
                    this.life += 1;
                    this.hearts.width = this.life * 32;
                    pickup.destroy();
                });
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
        let nextPlatform = randomRange(Math.max(this.lastPlatformX - this.PLATFORM_SPREAD, 64), Math.min(game.config.width - 64, this.lastPlatformX + this.PLATFORM_SPREAD));
        //let nextPlatform = randomRange(64, game.config.width - 64);
        this.platforms.add(this.add.sprite(nextPlatform, this.nextPlatformY, 'platform', 0));
        this.lastPlatformX = nextPlatform;
        this.nextPlatformY = this.nextPlatformY - this.PLATFORM_HEIGHT;
    }

    fallingRock() {
        let xpos = randomRange(64, game.config.width - 64);
        let rock = this.physics.add.sprite(xpos, this.hero.y - 350, 'boulder', 0);
        this.fallingRocks.add(rock);
        rock.setGravityY(this.Y_GRAVITY);

    }


    
}

function randomRange(min, max) {
        let range = max - min;
        let val = Math.random() * range
        return val + min;
    }