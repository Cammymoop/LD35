(function (scope) {
"use strict";

var LD35 = scope.LD35;
var Phaser = scope.Phaser;

LD35.Boot = function () {
    "use strict";

};

LD35.Boot.prototype = {
	create: function () {
        "use strict";
		this.game.input.maxPointers = 1;

		this.game.stage.disableVisibilityChange = true;

	    if (this.game.device.desktop)
	    {
		    this.game.stage.scale.pageAlignHorizontally = true;
	    }
	    else
	    {
		    this.game.stage.scaleMode = Phaser.StageScaleMode.SHOW_ALL;
		    this.game.stage.scale.minWidth = 480;
		    this.game.stage.scale.minHeight = 260;
		    this.game.stage.scale.maxWidth = 1024;
		    this.game.stage.scale.maxHeight = 768;
		    this.game.stage.scale.forceLandscape = true;
		    this.game.stage.scale.pageAlignHorizontally = true;
		    this.game.stage.scale.setScreenSize(true);
	    }
        this.game.state.add('Preloader', LD35.Preloader);
        this.game.state.add('Game', LD35.Game);

		this.game.state.start('Preloader');
	}
};

})(this);
