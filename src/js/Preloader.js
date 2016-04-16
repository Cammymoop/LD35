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
	},

	create: function () {
        this.game.state.start('Game');
	}
};

})(this);
