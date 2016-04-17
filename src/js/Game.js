(function (scope) {
"use strict";

var LD35 = scope.LD35;
var Phaser = scope.Phaser;

LD35.Game = function () {
};

LD35.Game.prototype = {
	create: function () {
        this.game.time.advancedTiming = true;
        this.stage.backgroundColor = '#222272';


        //this.game.physics.startSystem(Phaser.Physics.P2JS);
        this.physics = this.game.physics.arcade;
        //this.physics.restitution = 0.1;

        this.physics.gravity.y = 600;
        //this.physics.applyGravity = true;


        this.separator = new LD35.Separator(this.physics, 7);

        this.bg = this.game.add.tilemap('bg-map', 20, 20);
        this.tileset = this.bg.addTilesetImage('tiles', 'bg-tiles');

        var layer = this.bg.createLayer('Tile Layer 1');
        this.spriteBatch = new Phaser.SpriteBatch(this.game);
        this.spriteBatch.add(layer);

        this.game.world.setBounds(0, 0, this.bg.widthInPixels, this.bg.heightInPixels);

        this.bg.createFromObjects('Object Layer 1', 'playerSpawn', 'player');
        var players = this.game.world.filter(function (obj) {
            if (obj.hasOwnProperty('key') && obj.key === 'player') { 
                return true;
            } 
            return false; 
        });
        this.player = players.list[0];
        this.player.getPlayerBounds = function () {
            return new Phaser.Rectangle(this.x, this.y, this.width, this.height);
        };
        this.player.anchor.setTo(0.5, 0.5);

        this.physics.enable(this.player);
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
            this.blockZones.add(group);
        }, this);


        this.deathZones = [];
        this.emitters = [];
        this.mapObjects.filter(function (obj) { return obj.name === "death"; }).forEach(function (obj) {
            var g = this.game.add.graphics(obj.x, obj.y);
            g.beginFill(0x000000);
            g.drawRect(0, 0, obj.width, obj.height);
            var emitter = this.game.add.emitter(obj.x + obj.width/2, obj.y + obj.height/2, 800);
            emitter.gravity = -600;
            emitter.minParticleSpeed.setTo(0, 3);
            emitter.maxParticleSpeed.setTo(0, 44);
            emitter.minParticleScale = 0.8;
            emitter.minParticleScale = 1.4;
            emitter.area = new Phaser.Rectangle(0, 0, obj.width, obj.height);
            //emitter.makeParticles(['particle']);
            emitter.particleClass = LD35.DeathParticle;
            emitter.makeParticles();

            emitter.flow(600, 1, 20, -1);

            this.emitters.push(emitter);
            this.deathZones.push(new Phaser.Rectangle(obj.x, obj.y, obj.width, obj.height));
        }, this);

        this.mapObjects.filter(function (obj) { return obj.name === "kill"; }).forEach(function (obj) {
            var g = this.game.add.graphics(obj.x, obj.y);
            g.beginFill(0x000000);
            g.drawRect(0, 0, obj.width, obj.height);
            this.deathZones.push(new Phaser.Rectangle(obj.x, obj.y, obj.width, obj.height));
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

        if (this.player.alive) {
            this.blockZones.forEach(function (zone) {
                //this.physics.collide(this.player, zone);
                this.physics.overlap(this.player, zone, null, this.separator.specialSeparate, this.separator);
            }, this);
            //this.physics.collide(this.player, this.blockZones);
            //this.physics.collide(this.player, this.staticBlocks);
            this.physics.overlap(this.player, this.staticBlocks, null, this.separator.specialSeparate, this.separator);

            var playerBounds = this.player.getPlayerBounds();
            this.deathZones.forEach(function (deathZone) {
                if (deathZone.intersects(playerBounds)) {
                    this.playerDeath();
                }
            }, this);

            if (this.controls.jump.isDown && this.player.body.touching.down) {
                this.player.body.velocity.y = -300;
            }

            if (this.player.body.touching.down) {
                this.player.body.drag.x = 2000;
            } else {
                this.player.body.drag.x = 40;
            }

            var movePressed = (this.controls.left.isDown || this.controls.right.isDown) && !(this.controls.left.isDown && this.controls.right.isDown);
            if (movePressed) {
                var targetVelocity = 80;
                var sign = this.controls.left.isDown ? -1 : 1;
                if (this.player.body.touching.down) {
                    targetVelocity = 300;
                }
                if (this.player.body.velocity.x * sign < targetVelocity) {
                    this.player.body.velocity.x += (targetVelocity * sign)/3;
                }
            }
        }

        this.blockZones.forEach(function (zone) {
            if (zone.total >= 3) {
                return;
            }
            var bounds = zone.zoneRectangle;
            var randX = this.randomBetween(bounds.left, bounds.right);
            var randY = this.randomBetween(bounds.top, bounds.bottom);

            var randScaleX = this.randomBetween(0.8, 4);
            var randScaleY = this.randomBetween(0.8, 4);

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

    render: function () {
        this.game.debug.text(this.game.time.fps, 10, 10, '#FF0000');
    },

    playerDeath: function () {
        this.player.alive = false;
        this.player.body.allowGravity = false;
        this.player.body.velocity.setTo(0, 0);
        console.log('player dead');
        var black = this.game.add.sprite(0, 0, 'particle');
        black.width = this.game.width;
        black.height = this.game.height;
        black.alpha = 0;
        black.fixedToCamera = true;
        var tween = this.game.tweens.create(black).to({alpha: 1}, 1200);
        tween.onComplete.add(function () {
            this.resetGame();
        }, this);
        tween.start();
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
