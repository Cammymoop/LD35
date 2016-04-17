(function (scope) {
"use strict";

var LD35 = scope.LD35;
var Phaser = scope.Phaser;

LD35.Game = function () {
};

LD35.Game.prototype = {
	create: function () {
        this.game.time.advancedTiming = true;
        this.stage.backgroundColor = '#191952';

        this.frameCount = 0;

        //this.game.physics.startSystem(Phaser.Physics.P2JS);
        this.physics = this.game.physics.arcade;
        //this.physics.restitution = 0.1;

        this.physics.gravity.y = 600;
        //this.physics.applyGravity = true;


        this.separator = new LD35.Separator(this.physics, 7);

        this.bg = this.game.add.tilemap('bg-map', 20, 20);
        this.tileset = this.bg.addTilesetImage('tiles', 'bg-tiles');

        var layer = this.bg.createLayer('Tile Layer 1');
        this.game.world.remove(layer);
        this.spriteBatch = new Phaser.SpriteBatch(this.game);
        this.spriteBatch.add(layer);
        layer.renderSettings.enableScrollDelta = true;

        /*
        var func = layer.renderFull;
        var count = 0;
        layer.renderFull = function () {
            console.log('needing full render');
            //count++;
            //if (count % 8 === 0) {
                func.call(this);
            //}
        };

        
        var func2 = layer.renderDeltaScroll;
        layer.renderDeltaScroll = function (arg1, arg2) {
            console.log('delta render');
            func2.call(this, arg1, arg2);
        };
        */
        

        this.game.world.setBounds(0, 0, this.bg.widthInPixels, this.bg.heightInPixels);

        this.bg.createFromObjects('Object Layer 1', 'playerSpawn', 'player', 0);
        var players = this.game.world.filter(function (obj) {
            if (obj.hasOwnProperty('key') && obj.key === 'player') { 
                return true;
            } 
            return false; 
        });
        this.player = players.list[0];
        this.player.inAir = false;
        this.player.isAParachute = false;
        this.player.canParachute = false;
        this.player.jumpPushed = false;
        this.player.getPlayerBounds = function () {
            return new Phaser.Rectangle(this.x, this.y, this.width, this.height);
        };
        this.player.beAParachute = function () {
            if (!this.canParachute) {
                return;
            }
            this.isAParachute = true;
            this.frame = 1;
            this.body.velocity.y = 0;
            this.body.gravity.setTo(0, -400);
            this.body.maxVelocity.y = 600;
            this.angle = 30;
            this.tween = this.game.tweens.create(this).to({angle: -30}, 600, Phaser.Easing.Linear.None, false, 0, -1, true);
            this.tween.start();

            this.paraSound.play();
        };
        this.player.stopBeingAParachute = function () {
            if (this.tween) {
                this.tween.stop();
                this.tween = null;
                this.angle = 0;
            }

            this.jumpPushed = false;
            this.isAParachute = false;
            this.frame = 0;
            this.body.gravity.setTo(0, 0);
            this.body.maxVelocity.y = 5000;
        };
        this.player.anchor.setTo(0.5, 0.5);

        this.physics.enable(this.player);
        this.player.body.maxVelocity.y = 5000;
        this.player.body.drag.setTo(2000, 0);


        this.blockZones = this.game.add.group();
        this.staticBlocks = this.game.add.group();

        this.mapObjects = this.bg.objects['Object Layer 1'];

        this.center = new Phaser.Point(this.game.world.centerX, this.game.world.centerY);
        this.mapObjects.filter(function (obj) { return obj.name === "staticBlock"; }).forEach(function (obj) {
            this.addBlock('block-green', this.staticBlocks, obj.x + (obj.width/2), obj.y + (obj.height/2), (obj.width/60), (obj.height/60), 0, 0);
        }, this);

        /*
        var timer = this.game.time.create();
        timer.add(1000, function () {
            this.addBlock('block-green', this.staticBlocks, 1000, 200, 2, 3, -0.01, 0.01);
        }, this);
        timer.start();
        */

        this.mapObjects.filter(function (obj) { return obj.name === "blockZone"; }).forEach(function (obj) {
            var group = new Phaser.Group(this.game);
            group.zoneRectangle = new Phaser.Rectangle(obj.x, obj.y, obj.width, obj.height);
            if (obj.properties.hasOwnProperty('max-blocks')) {
                group.maxBlocks = obj.properties['max-blocks'];
            } else {
                group.maxBlocks = 3;
            }
            if (obj.properties.hasOwnProperty('max-scale')) {
                group.maxScale = obj.properties['max-scale'];
            } else {
                group.maxScale = 3.5;
            }
            this.blockZones.add(group);
        }, this);


        this.deathZones = [];
        this.emitters = [];
        this.mapObjects.filter(function (obj) { return obj.name === "death"; }).forEach(function (obj) {
            var g = this.game.add.graphics(obj.x, obj.y);
            g.beginFill(0x000000);
            g.drawRect(0, 0, obj.width, obj.height);

            var emitterParent = {children: []};
            var thickness = 5;
            var rects = [
                new Phaser.Rectangle(0, 0, obj.width, thickness),
                new Phaser.Rectangle(0, 0, thickness, obj.height),
                new Phaser.Rectangle(0, obj.height - thickness, obj.width, thickness),
                new Phaser.Rectangle(obj.width - thickness, 0, thickness, obj.height),
            ];

            rects.forEach(function (rect) {
                var emitter = this.game.add.emitter(obj.x + rect.centerX, obj.y + rect.centerY, 200);
                emitter.gravity = -600;
                emitter.minParticleSpeed.setTo(0, 3);
                emitter.maxParticleSpeed.setTo(0, 44);
                emitter.minParticleScale = 0.8;
                emitter.minParticleScale = 1.4;
                emitter.area = rect;

                emitter.particleClass = LD35.DeathParticle;
                emitter.makeParticles();

                emitter.flow(600, 1, 2, -1);

                emitter.on = false;
                emitterParent.children.push(emitter);
            }, this);

            emitterParent.turnOn = function () {
                this.children.forEach(function (emitter) {
                    emitter.on = true;
                });
            };
            emitterParent.turnOff = function () {
                this.children.forEach(function (emitter) {
                    emitter.on = false;
                });
            };

            var deathZone = new Phaser.Rectangle(obj.x, obj.y, obj.width, obj.height);
            emitterParent.zone = deathZone;
            this.emitters.push(emitterParent);
            this.deathZones.push(deathZone);
        }, this);

        this.mapObjects.filter(function (obj) { return obj.name === "kill"; }).forEach(function (obj) {
            var g = this.game.add.graphics(obj.x, obj.y);
            g.beginFill(0x000000);
            g.drawRect(0, 0, obj.width, obj.height);
            this.deathZones.push(new Phaser.Rectangle(obj.x, obj.y, obj.width, obj.height));
        }, this);

        this.pickups = this.game.add.group();
        this.mapObjects.filter(function (obj) { return obj.name === "pickup"; }).forEach(function (obj) {
            var pickup = this.pickups.create(obj.x, obj.y, obj.type);
            pickup.x -= pickup.width/2;
            pickup.y -= pickup.height/2;
            pickup.anchor.setTo(0.5, 0.5);
            pickup.type = obj.type;

            this.physics.enable(pickup);
            pickup.body.allowGravity = false;
        }, this);

        this.controls = {
            up:    this.game.input.keyboard.addKey(Phaser.Keyboard.UP),
            left:  this.game.input.keyboard.addKey(Phaser.Keyboard.LEFT),
            right: this.game.input.keyboard.addKey(Phaser.Keyboard.RIGHT),
            down:  this.game.input.keyboard.addKey(Phaser.Keyboard.DOWN),
            jump:  this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR),
            reset: this.game.input.keyboard.addKey(Phaser.Keyboard.R),
            pause: this.game.input.keyboard.addKey(Phaser.Keyboard.P),
        };

        this.sfx = {};
        this.sfx.death = this.game.add.audio('death');
        this.sfx.pops = {sounds: []};
        for (var sfx_i = 0; sfx_i < 6; sfx_i++) {
            this.sfx.pops.sounds.push(this.game.add.audio('pop'));
        }
        this.sfx.pops.play = function () {
            var availableSounds = this.sounds.filter(function (sound) { return !sound.isPlaying; });
            if (availableSounds.length > 0) {
                availableSounds[0].play();
            }
        };
        this.sfx.jump = this.game.add.audio('jump');
        this.sfx.para = this.game.add.audio('para');

        this.player.paraSound = this.sfx.para;

        this.controls.reset.onDown.add(function () {this.resetGame();}, this);
        this.controls.pause.onDown.add(function () {this.togglePause();}, this);

        this.gamePaused = false;

        this.camera.follow(this.player);

        //this.world.bounds.right = 2400;
        this.camera.setBoundsToWorld();
	},

	update: function () {
        if (this.gamePaused) {
            return;
        }
        this.frameCount++;

        if (this.frameCount % 20 === 0) {
            this.emitters.forEach(function (emitter) {
                if (!emitter.on) {
                    if (emitter.zone.intersects(this.game.camera.view)) {
                        emitter.turnOn();
                    }
                } else {
                    if (!emitter.zone.intersects(this.game.camera.view)) {
                        emitter.turnOff();
                    }
                }
            }, this);
        }

        if (this.player.alive) {
            this.blockZones.forEach(function (zone) {
                //this.physics.collide(this.player, zone);
                this.physics.overlap(this.player, zone, null, this.separator.specialSeparate, this.separator);
            }, this);
            //this.physics.collide(this.player, this.blockZones);
            //this.physics.collide(this.player, this.staticBlocks);
            this.physics.overlap(this.player, this.staticBlocks, null, this.separator.specialSeparate, this.separator);
            this.physics.overlap(this.player, this.pickups, this.touchedPickup, null, this);

            var playerBounds = this.player.getPlayerBounds();
            this.deathZones.forEach(function (deathZone) {
                if (deathZone.intersects(playerBounds)) {
                    this.playerDeath();
                }
            }, this);

            if (this.controls.jump.isDown && this.player.body.touching.down) {
                this.player.body.velocity.y = -340;
                if (this.player.isAParachute) {
                    this.player.stopBeingAParachute();
                }
                this.player.jumpPushed = true;
                this.player.body.touching.down = false;
                this.sfx.jump.play();
            }

            if (this.player.body.touching.down) {
                if (this.player.inAir) {
                    this.player.inAir = false;
                    this.player.stopBeingAParachute();
                }
                this.player.body.drag.x = 2000;
            } else {
                if (!this.player.inAir) {
                    this.player.inAir = true;
                }
                if (!this.player.isAParachute) {
                    if (this.player.jumpPushed && !this.controls.jump.isDown) {
                        this.player.jumpPushed = false;
                        this.player.beAParachute();
                    }
                } else if (this.controls.down.isDown) {
                    this.player.stopBeingAParachute();
                }
                this.player.body.drag.x = 90;
            }

            var movePressed = (this.controls.left.isDown || this.controls.right.isDown) && !(this.controls.left.isDown && this.controls.right.isDown);
            if (movePressed) {
                var targetVelocity = 80;
                var sign = this.controls.left.isDown ? -1 : 1;
                if (this.player.body.touching.down) {
                    targetVelocity = 300;
                } else if (this.player.isAParachute) {
                    targetVelocity = 200;
                }
                if (this.player.body.velocity.x * sign < targetVelocity) {
                    this.player.body.velocity.x += (targetVelocity * sign)/3;
                }
            }
        }

        this.blockZones.forEach(function (zone) {
            if (zone.total >= zone.maxBlocks) {
                return;
            }
            var bounds = zone.zoneRectangle;
            var randX = this.randomBetween(bounds.left, bounds.right);
            var randY = this.randomBetween(bounds.top, bounds.bottom);
            if (this.game.camera.view.contains(randX, randY)) {
                this.sfx.pops.play();
            }

            var randScaleX = this.randomBetween(0.8, zone.maxScale);
            var randScaleY = this.randomBetween(0.8, zone.maxScale);

            var randomDeltaX = this.randomBetween(0.02, 0.005);
            var randomDeltaY = this.randomBetween(0.02, 0.005);
            var randSign = Math.random() > 0.5 ? -1 : 1;
            this.addBlock('block', zone, randX, randY, randScaleX, randScaleY, (randomDeltaX * randSign), (randomDeltaY * randSign * -1));
        }, this);
        //this.physics.setBoundsToWorld();
	},

    randomBetween: function (min, max) {
        return min + (Math.random() * (max - min));
    },

    togglePause: function () {
        this.game.paused = !this.game.paused;
    },

    addBlock: function (image, group, x, y, scaleX, scaleY, deltaScaleX, deltaScaleY) {
        var block;
        block = group.create(x, y, image);
        block.anchor.setTo(0.5, 0.5);

        block.scale.setTo(scaleX, scaleY);

        //var thickness = 4;
        this.physics.enable(block);
        //block.topBody = new Phaser.Physics.P2.Body(this.game, null, block.x, block.y);
        //block.topBody.debug = true;
        //block.topBody.setRectangle(block.width, thickness, 0, (thickness/2) - (block.height/2));
        block.body.immovable = true;
        block.body.allowGravity = false;
        //block.body.motionState = Phaser.Physics.P2.Body.STATIC;
        //block.topBody.kinematic = true;

        //this.physics.addBody(block.topBody);
        block.body.drag.setTo(0,0);
        block.body.velocity.setTo(0.001, 0.001);

        if (deltaScaleX !== 0 && deltaScaleY !== 0) {
            block.scale.setTo(0.2, 0.2);
            var tween = this.game.tweens.create(block.scale).to({x: scaleX, y: scaleY}, 800, Phaser.Easing.Circular.Out, true);
            block.tweening = true;
            block.postTween = true;
            tween.onComplete.add(function () { this.tweening = false; }, block);
        }

        block.deltaScale = new Phaser.Point(deltaScaleX, deltaScaleY); 

        block.update = function () {
            //if (this.topBody.debugBody) {
            //    this.topBody.debugBody.updateSpriteTransform();
            //}
            if (this.tweening) {
                return;
            }
            //if (this.postTween) {
            //    this.postTween = false;
            //    block.topBody.moveDown(this.deltaScale.y * -1800);
            //}
            this.scale.add(this.deltaScale.x, this.deltaScale.y);
            if (this.scale.x < 0.01 || this.scale.y < 0.01) {
                //this.topBody.destroy();
                this.kill();
            }
        };
    },

    touchedPickup: function (player, pickup) {
        console.log(pickup.type);
        if (pickup.type === 'parachute') {
            player.canParachute = true;
        }
        pickup.kill();
    },

    render: function () {
        this.game.debug.text('fps: ' + this.game.time.fps, 10, 20, '#FF0000');
    },

    playerDeath: function () {
        this.player.alive = false;
        this.player.body.allowGravity = false;
        this.player.body.velocity.setTo(0, 0);
        if (this.player.tween) {
            this.player.tween.stop();
        }
        var black = this.game.add.sprite(0, 0, 'particle');
        black.width = this.game.width;
        black.height = this.game.height;
        black.alpha = 0;
        black.fixedToCamera = true;
        var tween = this.game.tweens.create(black).to({alpha: 1}, 1520);
        tween.onComplete.add(function () {
            this.resetGame();
        }, this);
        tween.start();

        this.sfx.death.play();
    },

    resetGame: function () {
        this.game.state.start("Game");
    }
};

LD35.DeathParticle = function (game, x, y) {
    var player = game.state.getCurrentState().player;
    Phaser.Particle.call(this, game, x, y, 'particle');
    var interlace = Math.round(Math.random() * 60);
    this.update = function () {
        interlace++;
        if (interlace % 60 === 0) {
            var point = new Phaser.Point(this.body.velocity.getMagnitude(), 0);
            this.body.velocity = point.rotate(0, 0, this.position.angle(player.position));
        }
    };
};

LD35.DeathParticle.prototype = Object.create(Phaser.Particle.prototype);
LD35.DeathParticle.prototype.constructor = LD35.DeathParticle;

})(this);
