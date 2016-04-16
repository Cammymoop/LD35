(function (scope) {
"use strict";

var LD35 = scope.LD35;
var Phaser = scope.Phaser;

LD35.Preloader = function () {
	this.ready = false;
};

LD35.Preloader.prototype = {
	preload: function () {
	},

	create: function () {
        this.game.state.start('Game');
	}
};

})(this);
