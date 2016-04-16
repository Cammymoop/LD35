(function (scope) {
"use strict";

var LD35 = scope.LD35;
var Phaser = scope.Phaser;

LD35.Game = function () {
};

LD35.Game.prototype = {
	create: function () {
	},

	update: function () {
	},

    resetGame: function () {
        this.game.state.start("Game");
    }
};

})(this);
