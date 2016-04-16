(function (scope) {
"use strict";

var LD35 = scope.LD35;
var Phaser = scope.Phaser;

LD35.Game = function () {
};

LD35.Game.prototype = {
	create: function () {
        this.physics = this.game.physics.arcade;

        this.player = this.game.add.sprite(this.game.world.centerX, this.game.world.centerY, 'player');
        this.player.anchor.setTo(0.5, 0.5);

        this.physics.enable(this.player);
        this.player.body.drag.setTo(2000, 0);


        this.blocks = this.game.add.group();

        this.center = new Phaser.Point(this.game.world.centerX, this.game.world.centerY);
        this.addBlock(this.center.x, this.center.y + 100, 4, 0.2, -0.01, 0.01);

        this.physics.gravity.setTo(0, 600);

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
	},

	update: function () {
        if (this.gamePaused) {
            return;
        }
        this.physics.collide(this.player, this.blocks);

        if (this.controls.jump.isDown && this.player.body.touching.down) {
            this.player.body.velocity.y = -300;
        }

        if (this.player.body.touching.down) {
            this.player.body.drag.x = 2000;
        } else {
            this.player.body.drag.x = 80;
        }

        var movePressed = (this.controls.left.isDown || this.controls.right.isDown) && !(this.controls.left.isDown && this.controls.right.isDown);
        if (movePressed) {
            var targetVelocity = 50;
            var sign = this.controls.left.isDown ? -1 : 1;
            if (this.player.body.touching.down) {
                targetVelocity = 200;
            }
            if (this.player.body.velocity.x * sign < targetVelocity) {
                this.player.body.velocity.x = targetVelocity * sign;
            }
        }

        if (this.blocks.total < 8) {
            var randX = this.randomBetween(20, this.game.width - 20);
            var randY = this.randomBetween(this.game.height/2, this.game.height - 30);

            var randScaleX = this.randomBetween(0.2, 4);
            var randScaleY = this.randomBetween(0.2, 4);

            var randomDelta = this.randomBetween(0.02, 0.005);
            var randSign = Math.random() > 0.5 ? -1 : 1;
            this.addBlock(randX, randY, randScaleX, randScaleY, (randomDelta * randSign), (randomDelta * randSign * -1));
        }
	},

    randomBetween: function (min, max) {
        return min + (Math.random() * (max - min));
    },

    togglePause: function () {
        this.gamePaused = !this.gamePaused;
    },

    addBlock: function (x, y, scaleX, scaleY, deltaScaleX, deltaScaleY) {
        var block = this.blocks.create(x, y, 'block');
        block.anchor.setTo(0.5, 0.5);

        this.physics.enable(block);
        block.body.immovable = true;
        block.body.allowGravity = false;
        block.scale.setTo(scaleX, scaleY);

        block.deltaScale = new Phaser.Point(deltaScaleX, deltaScaleY); 

        block.update = function () {
            this.scale.add(this.deltaScale.x, this.deltaScale.y);
            if (this.scale.x < 0.01 || this.scale.y < 0.01) {
                this.kill();
            }
        };
    },

    resetGame: function () {
        this.game.state.start("Game");
    }
};

})(this);
