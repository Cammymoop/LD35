(function (scope) {
"use strict";

var LD35 = scope.LD35;
//var Phaser = scope.Phaser;

LD35.Separator = function (physics, minThrowOverlap) {
    this.physics = physics;

    this.minThrowOverlap = (minThrowOverlap ? minThrowOverlap : 4);

    this.yOverlapBias = 2; // maximum y overlap before we seperate on x first:w
};

LD35.Separator.prototype = {
	specialSeparate: function (dynamicObj, staticObj) {
        var dynBody = dynamicObj.body;
        var staticBody = staticObj.body;
        if (!this.physics.intersects(dynBody, staticBody)) {
            return false;
        }

        var axes;
        // determine whether to do x or y first
        var overlaps = this.getOverlaps(dynBody, staticBody);

        //console.log(Math.abs(overlaps.y) - this.yOverlapBias + ' |=| ' + Math.abs(overlaps.x));
        if (Math.abs(overlaps.y) - this.yOverlapBias > Math.abs(overlaps.x)) {
            axes = ['x', 'y'];
        } else {
            axes = ['y', 'x'];
        }

        this.separator(axes[0], dynBody, staticBody, overlaps);
        //this.separator(axes[1], dynBody, staticBody, overlaps);
        //var maxOverlap = dynBody.deltaAbsX() + staticBody.deltaAbsX() + this.OVERLAP_BIAS;

        return false;
	},

    getOverlaps: function (dynBody, staticBody) {
        var overlaps = {};

        overlaps.x = (dynBody.center.x < staticBody.center.x ? dynBody.right - staticBody.x : dynBody.x - staticBody.right);
        overlaps.y = (dynBody.center.y < staticBody.center.y ? dynBody.bottom - staticBody.y : dynBody.y - staticBody.bottom);
        return overlaps;
    },

    separator: function (axis, dynBody, staticBody, overlaps) {
        var map = {
            x: {lesser: "left", greater: "right", measure: "width", overlap: "overlapX"},
            y: {lesser: "up", greater: "down", measure: "hight", overlap: "overlapY"},
        };
        var overlap = overlaps[axis];

        if (overlaps[axis] > 0)
        {
            //  dynBody is (left or top) of staticBody's center
            if (dynBody.checkCollision[map[axis].greater] === false || staticBody.checkCollision[map[axis].lesser] === false) {
                overlap = 0;
            } else {
                dynBody.touching.none = false;
                if (axis === 'y' && dynBody.debugMe) {
                    console.log('touchdown ' + dynBody.position.x + ':' + dynBody.position.y);
                    dynBody.debugMe = false;
                }
                dynBody.touching[map[axis].greater] = true;
                staticBody.touching.none = false;
                staticBody.touching[map[axis].lesser] = true;
            }
        } else if (overlaps[axis] < 0) {
            //  dynBody is (right or bottom) of staticBody's center
            if (dynBody.checkCollision[map[axis].lesser] === false || staticBody.checkCollision[map[axis].greater] === false)
            {
                overlap = 0;
            } else {
                dynBody.touching.none = false;
                dynBody.touching[map[axis].lesser] = true;
                staticBody.touching.none = false;
                staticBody.touching[map[axis].greater] = true;
            }
        }

        //  Resets the overlapX to zero if there is no overlap, or to the actual pixel value if there is
        dynBody[map[axis].overlap] = overlap;
        staticBody[map[axis].overlap] = overlap;

        //  Then adjust their positions and velocities accordingly (if there was any overlap)
        if (overlap !== 0)
        {
            dynBody[axis] = dynBody[axis] - overlap;
            if (axis === "y" && !dynBody.touching.down) {
                var throwVelocity = this.throwAmount(overlap);
                if (throwVelocity > dynBody.velocity.y) {
                    dynBody.velocity.y = throwVelocity; //get thrown unless we're already falling faster, so we don't stick to the bottom of blocks
                }
                return true;
            }
            dynBody.velocity[axis] = this.throwAmount(overlap); //staticVelocity - dynVelocity * dynBody.bounce[axis];

            //  This is special case code that handles things like vertically moving platforms you can ride
            if (staticBody.moves && axis === "y")
            {
                dynBody.x += (staticBody.x - staticBody.prev.x) * staticBody.friction.x;
            }

            return true;
        }
        return false;
    },

    throwAmount: function (overlap) {
        if (Math.abs(overlap) < this.minThrowOverlap) {
            return 0;
        }
        return overlap * -1;
    }
};

})(this);
