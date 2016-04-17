(function (scope) {
"use strict";

var LD35 = scope.LD35;
var Phaser = scope.Phaser;

LD35.Preloader = function () {
	this.ready = false;
};

LD35.Preloader.prototype = {
	preload: function () {
        this.game.load.image('player', '/assets/img/player.png');
        this.game.load.image('block', '/assets/img/block.png');
        this.game.load.image('block-green', '/assets/img/block_green.png');
        this.game.load.image('particle', '/assets/img/particle.png');

        this.game.load.image('bg-tiles', '/assets/img/bg_tiles.png');
        this.game.load.tilemap('bg-map', '/assets/map/bg.json', null, Phaser.Tilemap.TILED_JSON);
	},

	create: function () {
        this.game.state.start('Game');
	}
};

})(this);
