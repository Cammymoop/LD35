(function (scope) {
"use strict";

var LD35 = scope.LD35;
var Phaser = scope.Phaser;

LD35.Preloader = function () {
	this.ready = false;
};

LD35.Preloader.prototype = {
	preload: function () {
        this.game.load.spritesheet('player', '/assets/img/player.png', 20, 26, -1, 0, 1);
        this.game.load.image('block', '/assets/img/block.png');
        this.game.load.image('block-green', '/assets/img/block_green.png');
        this.game.load.image('particle', '/assets/img/particle.png');
        this.game.load.image('parachute', '/assets/img/parachute.png');

        this.game.load.image('bg-tiles', '/assets/img/bg_tiles.png');
        this.game.load.tilemap('bg-map', '/assets/map/bg.json', null, Phaser.Tilemap.TILED_JSON);

        this.game.load.audio('death', ['assets/sfx/death.mp3', 'assets/sfx/death.ogg']);
        this.game.load.audio('pop', ['assets/sfx/pop.mp3', 'assets/sfx/pop.ogg']);
        this.game.load.audio('jump', ['assets/sfx/jump.mp3', 'assets/sfx/jump.ogg']);
        this.game.load.audio('para', ['assets/sfx/para.mp3', 'assets/sfx/para.ogg']);
	},

	create: function () {
        this.game.state.start('Game');
	}
};

})(this);
