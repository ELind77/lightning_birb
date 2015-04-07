// The Birb Game!!!
//////////////////////////////
// Dodge the lightning!
// Use the arrow keys to dodge the lightning.

// TODO:
//    - Assets
//        - Birb asset
//        - Ground asset
//        - Background asset
//        - Clouds?
//        - Game Over asset
//    - Functionality
//        - Levels
//        - Lives?
//        - Better lightning?
//            - Random chance to change direction?
//            - Moves faster?
//            - overlapping time?
//                - So you can't jsut move to the top and be safe


window.onload = function() {
    var canvas = document.getElementById('can');
    //var ctx = canvas.getContext('2d');

    var world = new World(canvas);
    world.init();
    world.run();
};

// WORLD
///////////////////////////////////
function World(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ticker = null;
    this.lightningBoundsWidth = 150;
    this.lightning = null;
    this.lightningChance = 0;
    this.lightningThreshold = 0.5;
    this.flashing = false;
    this.count = 0;
    this.bird = null;
    var that = this;

    // INIT

    this.init = function init() {
        this.bird = new Bird(this.canvas, this.ctx);
        this.bird.init();
        document.addEventListener("keyup", this.checkKeys);
    };


    // TICK
    this.tick = function tick() {
        if (this.count < 10000) {
            this.count ++;
            console.log("tick!", this, this.lightning, this.lightningChance);
            if (this.flashing) {
                this.flash();
            } else if (this.lightning) {
                // Check for collision with bird
                if (this.bird.collide(this.lightning.currPosn)) {
                    this.gameOver();
                }
                // Check for lightning and draw it if needed
                if (this.lightning.done) {
                    this.lightning = null;
                    this.lightningChance = 0;
                    this.clearWorld();
                } else {
                    this.lightning.tick();
                }
            } else {
                var rand = Math.random();
                // Update chance
                this.lightningChance += rand/50;
                // Check chance
                if (this.lightningChance >= this.lightningThreshold) {
                //if (rand > this.lightningThreshold) {
                    this.lightning = new Lightning(this.canvas, 20, this.getStartX(), 150);
                    this.flash(this.ctx, this.canvas);
                }
            }
        }
    };

    // RUN
    this.run = function run() {
        var that = this;
        this.ticker = setInterval(function() {that.tick.call(that);  }, 100);
    };

    // GG
    this.gameOver = function gameOver() {
        // Stop ticking
        clearInterval(this.ticker);
        // Clear listeners
        document.removeEventListener("keyup", this.checkKeys);
        // Load game over
        var url = 'http://blog.check-and-secure.com/wp-content/uploads/2014/06/gameover.jpg';
        var img = new Image();
        img.onload = function() {
            that.ctx.drawImage(img, 0, 0, that.canvas.width, that.canvas.height);
        };
        img.src = url;
        // Draw replay
        //drawReplay(this.ctx, this.canvas);
        // Add listeners to replay
    };


    //
    // Helpers
    //
    function drawReplay(ctx, canvas) {
        var text = 'Play Again?';
        var txtWidth = ctx.measureText(text), txtHeight = 25;
        var center = [canvas.width/2, canvas.height/2];
        ctx.save();
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.translate(center[0], center[1]);
        ctx.fillText('Play again?', txtWidth/-2, txtHeight/-2);
        ctx.translate(center[0], center[1]);
        //ctx.rect(txtWidth/-2, txtHeight, txtWidth, txtHeight*2)

    }

    this.clearWorld = function clearWorld() {
        this.ctx.clearRect(0, 0, this.canvas.width, canvas.height);
        this.bird.draw();
    };

    this.flash = function flash(ctx, canvas) {
        if (this.flashing) {
            this.flashing = null;
            this.clearWorld();
        } else {
            this.flashing = true;
            ctx.save();
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.restore();
        }
    };

    this.getStartX = function getStartX() {
        //var rand = Math.random();
        //return 150;
        var rand, x;
        do {
            rand = Math.random();
            x = this.canvas.width * rand;
            if (x > this.lightningBoundsWidth/2 && x < this.canvas.width - this.lightningBoundsWidth/2) {
                return x;
            }
        } while (true);
    };

    this.checkKeys = function checkKeys(e) {
        switch(e.which) {
            case 38:
                that.bird.move("up");
                break;
            case 40:
                that.bird.move("down");
                break;
            case 37:
                that.bird.move("left");
                break;
            case 39:
                that.bird.move("right");
                break;
        }
    }

}


// BIRD
///////////////////////////////////
function Bird(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.posn = [canvas.width/2, canvas.height/2];
    this.width = 50;
    this.height = 50;
    this.img = null;

    this.init = function birdInit() {
        this.loadSprite();
        //this.draw();
    };

    this.draw = function drawBird() {
        this.ctx.save();
        this.ctx.translate(this.posn[0], this.posn[1]);
        //this.ctx.fillStyle = 'blue';
        //this.ctx.fillRect(this.width/-2, this.width/-2, this.width, this.height);
        this.ctx.drawImage(this.img, this.width/-2, this.width/-2, this.width, this.height);
        this.ctx.restore();
    };

    this.clear = function clearBird() {
        this.ctx.save();
        this.ctx.fillStyle = 'blue';
        this.ctx.translate(this.posn[0], this.posn[1]);
        this.ctx.clearRect(this.width/-2, this.width/-2, this.width, this.height);
        //this.ctx.fillRect(this.width/-2, this.width/-2, this.width, this.height);
        this.ctx.restore();
    };

    this.move = function moveBird(direction) {
        var directions = {
            "up" : {posn: 1, val: -10},
            "down" : {posn: 1, val: 10},
            "left" : {posn: 0, val: -10},
            "right" : {posn: 0, val: 10}
        };
        var dir = directions[direction]

        this.clear();
        this.posn[dir.posn] += dir.val;
        this.draw();
    };

    this.collide = function collide(posn) {
        var x = this.posn[0], y = this.posn[1];
        return posn[0] < x + this.width && posn[0] > x &&
            posn[1]  > y && posn[1] < y + this.height;
    };

    //
    // Helpers
    //
    this.loadSprite = function loadSprite() {
        var that = this;
        var url = 'http://sweetclipart.com/multisite/sweetclipart/files/imagecache/middle/chick_baby_cute_easter_blue.png';
        //'http://sweetclipart.com/multisite/sweetclipart/files/bird_blue_cute.png';
        var img = new Image();
        img.onload = function() {
            console.log("loaded birb");
            that.img = img;
            that.draw();
        };
        img.src = url;
        return img;
    }

}




// LIGHTNING
///////////////////////////////////
function Lightning(canvas, baseLen, startX, boundsWidth) {
    // Properties
    //var baseLen = baseLen;
    var height = canvas.height, width = canvas.width;
    //var startX = this.getStartX(boundsWidth);
    this.leftBound = startX - boundsWidth/2;
    this.rightBound = startX + boundsWidth/2;
    this.startPosn = [startX, 0];
    this.currPosn = this.startPosn;
    this.done = null;
    this.count = 0;
    this.times = 100;

    this.tick = function tick() {
        console.log("lighting!", this);
        if (this.currPosn[1] >= height) {
            this.done = true;
        } else {
            var newPosn = getNewPosn(this.currPosn);
            while (!checkBounds(newPosn, this.leftBound, this.rightBound)) {
                if (this.count < 100) {
                    this.count ++;
                    console.log("trying new posn");
                    //newPosn = getNewPosn(currPosn);
                    newPosn = boundsAdjust(newPosn, this.leftBound, this.rightBound);
                }
            }
            this.count = 0;
            drawLine(ctx, this.currPosn, newPosn);
            this.currPosn = newPosn;
        }
    };

    //
    // Helpers
    //
    function getNewPosn(currPosn) {
        var rand = Math.random();
        var theta = rand * Math.PI;
        var newLen = rand * baseLen;
        var newX = currPosn[0] + newLen * Math.cos(theta);
        var newY = currPosn[1] + newLen * Math.sin(theta);
        return [newX, newY];
    }

    function drawLine(ctx, posn1, posn2) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(posn1[0], posn1[1]);
        ctx.lineTo(posn2[0], posn2[1]);
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#f7da36';
        ctx.shadowColor = '#999';
        ctx.shadowBlur = 3;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 3;
        ctx.stroke();
        ctx.restore();
    }

    // Returns true if x is within bounds
    function checkBounds(posn, leftBound, rightBound) {
        var x = posn[0];
        return x > leftBound && x < rightBound;
    }

    function boundsAdjust(posn, leftBound, rightBound) {
        var rand = Math.random();
        posn[0] = ((rightBound - leftBound) * (rand/2)) + leftBound;
        return posn;
    }
}









