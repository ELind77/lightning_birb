// The Birb Game!!!
//////////////////////////////
// Dodge the lightning!
// Use the arrow keys to dodge the lightning.

// TODO:
//    - Assets
//        - Birb asset
//        - Ground asset? (maybe not necessary?)
//        - Background asset
//        - Clouds
//        - Game Over asset
//    - Functionality
//        - Prevent birb from running off canvas (done)
//        - Levels
//        - Lives (done)
//        - Better lightning?
//            - Random chance to change direction?
//            - Moves faster?
//            - overlapping time?
//                - So you can't just move to the top and be safe
//        - Prevent Birb from overlapping lighting?
//    - Code
//         - requestanimationframe // Make things smoother
//                - Will also require reworking lightning


window.onload = runIt;

function runIt() {
    var canvas = document.getElementById('can');
    var ctx = canvas.getContext('2d');
    var world = new World(canvas, ctx);

    // Run IT!
    world.init();
    world.run();
}

// WORLD
///////////////////////////////////
function World(canvas, ctx) {
    this.canvas = canvas;
    this.width = canvas.width;
    this.height = canvas.height;
    this.ctx = ctx;
    this.ticker = null;
    this.lightningBoundsWidth = 150;
    this.lightning = null;
    this.lightningChance = 0;
    // New lightning roughly every 5 seconds (50 ticks)
    this.lightningThreshold = 25;
    this.flashing = false;
    this.count = 0;
    this.bird = null;
    this.lives = 3;
    this.level = 1;
    var that = this;

    // INIT
    this.init = function init() {
        this.bird = new Bird(this.canvas, this.ctx);
        var promise = new Promise(function(resolve, reject) {
            that.bird.init(resolve, reject);
        });
        promise.then(function(resolved) {
            that.clearWorld();
        });
        //this.clearWorld();
        document.addEventListener('keyup', this.checkKeys);
    };

    // RUN
    this.run = function run() {
        //var that = this;
        this.ticker = setInterval(function() {that.tick.call(that);  }, 100);
    };

    // TICK
    this.tick = function tick() {
        if (this.count < 10000) {
            this.count ++;
            //console.log("tick!", this, this.lightning, this.lightningChance);
            if (this.flashing) {
                this.flash();
            } else if (this.lightning) {
                // Check for collision with bird
                if (this.bird.collide(this.lightning.currPosn)) {
                    if (this.lives >= 1) {
                        this.lives -= 1;
                        this.restart();
                    } else {
                        this.gameOver();
                    }
                // Check for lightning and draw it if needed
                } else if (this.lightning.done) {
                    this.lightning = null;
                    this.lightningChance = 0;
                    this.clearWorld();
                } else {
                    this.lightning.tick();
                }
            } else {
                var rand = Math.random();
                // Update chance
                this.lightningChance += rand;
                // Check chance
                if (this.lightningChance >= this.lightningThreshold) {
                //if (rand > this.lightningThreshold) {
                    this.lightning = new Lightning(this.canvas, 20, this.getStartX(), this.lightningBoundsWidth);
                    this.flash(this.ctx, this.canvas);
                }
            }
        }
    };

    // Clear World
    this.clearWorld = function clearWorld() {
        this.ctx.clearRect(0, 0, this.canvas.width, canvas.height);
        this.bird.draw();
        this.drawLives();
    };

    this.restart = function reset() {
        console.log("Restart!");
        // Remove Listeners and ticker
        this.stopEverything();
        function restartHelper() {
            that.flashing = false;
            that.ticker = null;
            that.lightning = null;
            that.lightningChance = 0;
            document.addEventListener('keyup', that.checkKeys);
            that.clearWorld();
            that.run();
        }
        setTimeout(restartHelper, 500);
    };

    this.reset = function reset() {
        // Reset game persistent world properties
        that.lives = 3;
        that.level = 1;
        // Remove css
        that.canvas.className = '';
        // Clear the canvas
        that.ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Remove listeners
        that.canvas.removeEventListener('mousedown', that.reset);
        // Play again
        that.restart();
    };

    // GG
    this.gameOver = function gameOver() {
        // Remove Liseners and ticker
        this.stopEverything();
        // Show game over
        writeGG(this.ctx, this.canvas);
        // Draw replay
        drawReplay(this.ctx, this.canvas);
        // Add listeners to replay
        this.canvas.className += "over";
        this.canvas.addEventListener('mousedown', that.reset);
    };

    //
    // LIVES
    //
    this.drawLives = function drawLives() {
        var livesSize = 20;
        var margin = 5;

        function drawLife(num) {
            var x = (livesSize + margin) * num;
            var y = livesSize + margin;
            that.ctx.translate(that.width, that.height);
            that.ctx.drawImage(that.bird.img, -x, -y, livesSize, livesSize);
        }

        for(var i = 1; i <= this.lives; i++) {
            this.ctx.save();
            drawLife(i);
            this.ctx.restore();
        }
    };


    //
    // Helpers
    //
    this.stopEverything = function stopEverything() {
        // Stop ticking
        clearInterval(this.ticker);
        // Clear listeners
        document.removeEventListener('keyup', this.checkKeys);
    };

    function writeGG(ctx, canvas) {
        ctx.save();
        var text = 'GAME OVER';
        var center = [canvas.width/2, canvas.height/2];
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'red';
        ctx.font = '50pt Arial';
        ctx.textAlign ='center';
        ctx.translate(center[0], center[1]);
        ctx.fillText(text, 0, 0);
        ctx.restore();
    }

    function drawReplay(ctx, canvas) {
        console.log("Play again");
        var text = 'Play Again?';
        var txtWidth = ctx.measureText(text).width, txtHeight = 20;
        var center = [canvas.width/2, canvas.height/2];
        var offset = 10;
        // Text
        ctx.save();
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.textAlign ='center';
        ctx.translate(center[0], center[1]);
        ctx.fillText('Play again?', 0, 75);
        ctx.restore();
        // Rectangle
        //ctx.save();
        //ctx.strokeStyle = 'white';
        //ctx.lineWidth = 5;
        //ctx.translate(center[0], center[1]);
        //ctx.rect(txtWidth/-2, (txtHeight + offset)/2, txtWidth, (txtHeight + offset)*2);
        //ctx.stroke();
        //ctx.restore();
    }

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

    this.init = function birdInit(resolve, reject) {
        this.loadSprite(resolve, reject);
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
        var dir = directions[direction];
        var newPosn = this.posn.slice();
        newPosn[dir.posn] += dir.val;
        var newX = newPosn[0], newY = newPosn[1];

        // Check canvas edges
        if (newX >= this.width/2 && newX <= this.canvas.width - this.width/2 &&
            newY >= this.height/2 && newY <= this.canvas.height - this.height/2) {
            this.clear();
            this.posn = newPosn;
            this.draw();
        }
    };

    this.collide = function collide(posn) {
        var x = this.posn[0] - this.width/2, y = this.posn[1] - this.height/2;
        return posn[0] > x && posn[0] < x + this.width &&
               posn[1] > y && posn[1] < y + this.height;
    };

    //
    // Helpers
    //
    this.loadSprite = function loadSprite(resolve, reject) {
        var that = this;
        var url = 'http://sweetclipart.com/multisite/sweetclipart/files/imagecache/middle/chick_baby_cute_easter_blue.png';
        //'http://sweetclipart.com/multisite/sweetclipart/files/bird_blue_cute.png';
        var img = new Image();
        img.onload = function() {
            console.log("loaded birb");
            that.img = img;
            //that.draw();
            that.img.onload  = null;
            resolve(true);
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
    var height = canvas.height;//, width = canvas.width;
    //var startX = this.getStartX(boundsWidth);
    this.ctx = canvas.getContext('2d');
    this.leftBound = startX - boundsWidth/2;
    this.rightBound = startX + boundsWidth/2;
    this.startPosn = [startX, 0];
    this.currPosn = this.startPosn;
    this.theta = Math.PI/2;
    this.chanceToChange = 0;
    this.changeThreshold = 0.5;
    this.done = null;
    this.count = 0;
    //this.times = 100;

    this.tick = function tick() {
        //console.log("lighting!", this);
        if (this.currPosn[1] >= height) {
            this.done = true;
        } else {
            var newPosn = this.getNewPosn(this.currPosn);
            while (!checkBounds(newPosn, this.leftBound, this.rightBound)) {
                if (this.count < 100) {
                    this.count ++;
                    //console.log("trying new posn");
                    //newPosn = getNewPosn(currPosn);
                    newPosn = boundsAdjust(newPosn, this.leftBound, this.rightBound);
                }
            }
            this.count = 0;
            drawLine(this.ctx, this.currPosn, newPosn);
            this.currPosn = newPosn;
        }
    };

    //
    // Helpers
    //
    this.getNewPosn = function getNewPosn(currPosn) {
        var rand = Math.random();
        //// Update chance
        //this.chanceToChange += rand * 0.5;
        //// Check chance
        //if (this.chanceToChange > this.changeThreshold) {
        //    this.theta = rand * Math.PI;
        //    this.chanceToChange = 0;
        //}
        this.theta = rand * Math.PI;
        var newLen = rand * baseLen;
        var newX = currPosn[0] + newLen * Math.cos(this.theta);
        var newY = currPosn[1] + newLen * Math.sin(this.theta);
        return [newX, newY];
    };

    function drawLine(ctx, posn1, posn2) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(posn1[0], posn1[1]);
        ctx.lineTo(posn2[0], posn2[1]);
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#f7da36'; // Lightning yellow
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









