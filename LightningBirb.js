// The Birb Game!!!
//////////////////////////////
// Dodge the lightning!
// Use the arrow keys to dodge the lightning.

// TODO:
//    - Assets
//        - Birb asset
//        - Background (done)
//            - Clouds (done)
//        - Better fonts?
//        - Game Over Screen
//        - Loading Splash
//        - End of level splash/animation
//        - Favicon
//    - Functionality
//        - Prevent birb from running off canvas  (done)
//        - Help text below screen
//        - Pause (p)  (done)
//        - Prevent Birb from overlapping lighting?
//        - Levels
//        - Lives  (done)
//        - Better lightning?
//            - Random chance to change direction?  (tried)
//            - Moves faster?
//            - overlapping time?
//                - So you can't just move to the top and be safe
//    - Code
//         - requestanimationframe // Make things smoother
//                - Will also require reworking lightning

// In order to implement levels I think I'm going to needto use multiple
// canvases.  The flash will need to be a separate canvas on top.  And each
// lightning will need to be on it's own canvas so that they can be cleared
// independently.  I think that the architecture I have will actually work
// ok for this as I can just iterate over an array of Lightning.  The biggest
// change will be in clearWorld which will need to remove the extra DOM
// elements and manage multiple canvases.


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
    this.container = document.getElementById('container');
    // Canvas
    this.canvas = canvas;
    this.width = canvas.width;
    this.height = canvas.height;
    this.ctx = ctx;
    // Ticker
    this.tickRate = 50;
    this.ticker = null;
    // Lightning
    this.lightningBoundsWidth = 150;
    this.lightning = null;
    this.lightningChance = 0;
    this.lightningThreshold = 25; // New lightning roughly every 2.5 seconds (50 ticks)
    this.flasher = null;
    this.flashing = false;
    // Everything Else
    this.paused = false;
    this.pauser = null;
    this.gg = null;
    this.count = 0;
    this.bird = null;
    this.lives = 3;
    this.level = 1;
    var that = this;

    // INIT
    this.init = function init() {
        // Pauser
        this.pauser = makePauser();
        // GG
        this.gg = makeGG();
        // Flash
        this.flasher = makeFlash();
        // Birb
        this.bird = new Bird(this);
        var promise = new Promise(function(resolve, reject) {
            that.bird.init(resolve, reject);
        });
        promise.then(function(resolved) {
            that.clearWorld();
        });
        addControls();
    };


    // RUN
    this.run = function run() {
        //var that = this;
        this.ticker = setInterval(function() {that.tick.call(that);}, that.tickRate);
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
                    this.container.removeChild(this.lightning.canvas);
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
                    this.lightning = new Lightning(this.canvas, this.container, 20, this.getStartX(), this.lightningBoundsWidth);
                    this.flash();
                }
            }
        }
    };

    // Clear World
    this.clearWorld = function clearWorld() {
        this.ctx.save();
        this.ctx.clearRect(0, 0, this.canvas.width, canvas.height);
        //ctx.fillStyle = '#000099';
        //this.ctx.fillRect(0, 0, this.canvas.width, canvas.height);
        //this.ctx.fillRect(0, 0, this.width, this.height);
        this.ctx.restore();
        this.bird.draw();
        this.drawLives();
        this.drawLevel();

    };

    this.restart = function reset() {
        console.log("Restart!");
        // Remove Listeners and ticker
        this.stopEverything();
        function restartHelper() {
            that.flashing = false;
            that.ticker = null;
            that.container.removeChild(that.lightning.canvas);
            that.lightning = null;
            that.lightningChance = 0;
            addControls();
            that.clearWorld();
            that.run();
        }
        setTimeout(restartHelper, 500);
    };

    // Resets the world to it's initial state
    // Primarily called after GameOver
    this.reset = function reset() {
        // Reset game persistent world properties
        that.lives = 3;
        that.level = 1;
        // Remove css
        that.canvas.className = '';
        // Clear the canvas
        that.container.removeChild(that.gg);
        //that.ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Remove listeners
        that.gg.removeEventListener('mousedown', that.reset);
        // Play again
        that.restart();
    };

    // Flash
    this.flash = function flash() {
        if (this.flashing) {
            this.flashing = null;
            this.container.removeChild(this.flasher);
            //this.clearWorld();
        } else {
            this.flashing = true;
            this.flasher.style['left'] = this.canvas.getBoundingClientRect().left + 'px';
            this.container.appendChild(this.flasher);
        }
    };

    // GG
    this.gameOver = function gameOver() {
        // Remove Listeners and ticker
        this.stopEverything();
        // Show game over
        this.gg.style['left'] = that.canvas.getBoundingClientRect().left + 'px';
        this.container.appendChild(this.gg);
        // Add listener to replay
        this.gg.addEventListener('mousedown', that.reset);
    };

    // Pause
    this.pause = function pause() {
        if (this.paused) {
            this.resume();
        } else {
            this.paused = true;
            this.pauser.style['left'] = that.canvas.getBoundingClientRect().left + 'px';
            this.container.appendChild(this.pauser);
            this.stopEverything();
            document.addEventListener('keyup', pauseListener);
        }
    };

    this.resume = function resume() {
        this.paused = false;
        //this.clearWorld();
        this.container.removeChild(this.pauser);
        document.removeEventListener('keyup', pauseListener);
        addControls();
        this.run();
    };

    // Help
    this.help = function help() {};

    //
    // LIVES and LEVEL
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

    this.drawLevel = function drawLevel() {
        var x = 10;
        var y = this.height - (15);
        this.ctx.save();
        this.ctx.font = '15px Arial';
        this.ctx.fillStyle = '#78C2FF';
        this.ctx.translate(x, y);
        this.ctx.fillText('Level '+this.level, 0, 0);
        this.ctx.restore();
    };

    // Stop Everything
    this.stopEverything = function stopEverything() {
        // Stop ticking
        clearInterval(this.ticker);
        // Clear listeners
        removeControls();
        //document.removeEventListener('keyup', this.checkKeys);
    };


    //
    // Helpers
    //
    function makePauser() {
        var can = document.createElement('canvas');
        can.className = 'secondary overlay';
        can.width = that.width;
        can.height = that.height;
        var ctx = can.getContext('2d');
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.fillRect(0, 0, can.width, can.height);
        ctx.fillStyle = 'white';
        ctx.font = '50pt Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Paused', canvas.width/2, canvas.height/2);
        ctx.restore();
        return can;
    }

    function makeGG() {
        var can = document.createElement('canvas');
        can.id = "gg";
        can.className = 'secondary overlay';
        //can.style['z-index'] = 1000;
        can.width = that.width;
        can.height = that.height;
        var ctx = can.getContext('2d');
        writeGG(ctx, can);
        drawReplay(ctx, can);
        return can;
    }

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

    function makeFlash() {
        var can = document.createElement('canvas');
        var ctx = can.getContext('2d');
        can.id = "flash";
        can.className = 'secondary overlay';
        //can.style['z-index'] = 1000;
        can.width = that.width;
        can.height = that.height;
        ctx.save();
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, can.width, can.height);
        ctx.restore();

        return can;
    }

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

    //
    // Listeners
    //
    function addControls() {
        document.addEventListener('keyup', checkKeys);
    }

    function removeControls() {
        document.removeEventListener('keyup', checkKeys);
    }

    function pauseListener(e) {
        if (e.which == 80) {
            that.pause();
        }
    }

    function checkKeys(e) {
        switch(e.which) {
            case 38:
            case 87:
                that.bird.move("up");
                break;
            case 40:
            case 83:
                that.bird.move("down");
                break;
            case 37:
            case 65:
                that.bird.move("left");
                break;
            case 39:
            case 68:
                that.bird.move("right");
                break;
            case 80: // P
                that.pause();
                break;
            case 72: // H
                that.help();
                break;
        }
    }
}


// BIRD
///////////////////////////////////
function Bird(world) {
    this.container = world.container;
    this.canvas = addCanvas(world);
    this.ctx = this.canvas.getContext('2d');
    this.posn = [this.canvas.width/2, this.canvas.height/2];
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
        //var url = 'http://sweetclipart.com/multisite/sweetclipart/files/imagecache/middle/chick_baby_cute_easter_blue.png';
        //'http://sweetclipart.com/multisite/sweetclipart/files/bird_blue_cute.png';
        var img = new Image();
        img.onload = function() {
            console.log("loaded birb");
            that.img = img;
            //that.draw();
            that.img.onload  = null;
            resolve(true);
        };
        img.src = "assets/birb.png";
        return img;
    };

    function addCanvas(world) {
        var can = document.createElement('canvas');
        can.className = 'secondary bird';
        can.style['left'] = world.canvas.getBoundingClientRect().left + 'px';
        can.width = world.canvas.width;
        can.height = world.canvas.height;
        world.container.appendChild(can);
        return can;
    }
}


// LIGHTNING
///////////////////////////////////
function Lightning(canvas, container, baseLen, startX, boundsWidth) {
    // Properties
    this.canvas = addCanvas(canvas, container);
    var height = this.canvas.height;//, width = canvas.width;
    this.ctx = this.canvas.getContext('2d');
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

    // Methods
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

    //
    // Helpers
    //
    function addCanvas(canvas, container) {
        var can = document.createElement('canvas');
        can.className = 'secondary lightning';
        can.style['left'] = canvas.getBoundingClientRect().left + 'px';
        can.width = canvas.width;
        can.height = canvas.height;
        container.appendChild(can);
        return can;
    }

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









