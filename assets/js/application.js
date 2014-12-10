---
---

var fireballs;
var fireRate = 300;
var nextFire = 0;
var nextJump = 0;
var player;
var left=false;
var right=false;
var duck= false;
var fire=false;
var jump=false;
var activeGameTime = 0;
var score = 0;

var game = new Phaser.Game(window.innerWidth, window.innerHeight, Phaser.AUTO, '', { preload:preload, create: create, update:update});

function preload(){
        //spritesheet for animations
        game.load.spritesheet('mario', '{{ site.baseurl }}/assets/images/mariospritesheet-small.png',50,50); // key, sourcefile, framesize x, framesize y
        //background, ground, fireball images
        game.load.image('brick', '{{ site.baseurl }}/assets/images/brick.png');
        game.load.image('clouds', '{{ site.baseurl }}/assets/images/background.png');
        game.load.image('fireball', '{{ site.baseurl }}/assets/images/fireball.png',40,30);
        game.load.image('star', '{{ site.baseurl }}/assets/images/star.png');
        game.load.spritesheet('baddie', '{{ site.baseurl }}/assets/images/baddie.png', 32, 32);

        preloadAudio();
        //autoalign the game stage
        game.scale.pageAlignHorizontally = true;
        game.scale.pageAlignVertically = true;
        game.scale.setScreenSize(true);
}

function preloadAudio() {
    game.load.audio('sfx', '{{ site.baseurl }}/assets/audio/soundeffects/fx_mixdown.ogg');
    game.audio = game.add.audio('sfx');
    game.audio.addMarker('beat', 1, 1.0);
    game.audio.addMarker('ping', 10, 1.0);
    game.audio.addMarker('killed', 9, 1.0);
}

function create() {
    game.physics.startSystem(Phaser.Physics.ARCADE);

    // game.world.setBounds(0, 0, 2000, 400);//(x, y, width, height)
    // game.physics.setBoundsToWorld(true, true, true, true, false); //(left, right, top, bottom, setCollisionGroup)
    // game.physics.gravity.y=600;  // default gravity in game world
    game.physics.friction =5;   // default friction between ground and player or fireballs
    game.add.text(100, 100, "Game Over", { font: "30px TheFont"} );
    createClouds();
    createGround();
    createFireballs();
    createPlayer();
    createStars();
    createBaddies();
    attachInputEvents();
    addScore();
}

function addScore() {
    scoreText = game.add.text(16, 16, 'Score: 0', {
        fontSize: '20px TheFont',
        fill: '#000'
    });
}

function createClouds() {
    clouds = game.add.tileSprite(0, 0, game.world.width, game.world.height, 'clouds'); //add tiling sprite to cover the whole game world
}

function createGround() {
    ground = game.add.tileSprite(0, game.world.height-96, game.world.width, 96,'brick');
    game.physics.arcade.enable(ground);
    ground.body.immovable=true;    // ground should not move
}

function createFireballs() {
    fireballs = game.add.group();  // add a new group for fireballs
    fireballs.createMultiple(500, 'fireball', 0, false);  // create plenty of them hidden and out of the game world
    game.physics.arcade.enable(fireballs);
}

function createPlayer() {
    //setup our player
    player = game.add.sprite((game.world.width/10), game.world.height - 150, 'mario'); //create and position player
    game.physics.arcade.enable(player);

    //  Player physics properties. Give the little guy a slight bounce.
    player.body.gravity.y = 400;
    player.body.collideWorldBounds = true;
    addPlayerAnimations();
}

function addPlayerAnimations() {
    // add some animations
    player.animations.add('walk', [1,2,3,4], 10, true);  // (key, framesarray, fps,repeat)
    player.animations.add('duck', [11], 0, true);
    player.animations.add('duckwalk', [10,11,12], 2, true);
    player.animations.add('happy', [7], 0, true);
    game.camera.follow(player); //always center player
}

function createStars() {
    stars = game.add.group();
    stars.enableBody = true;
}

function createStar() {
    var star = stars.create(game.world.randomX, 0, 'star');
    star.body.gravity.y = 300;
    star.body.bounce.y = randomBounce();
    star.body.velocity.x = -100;
}

function randomBounce() {
    return 0.7 + Math.random() * 0.2;
}

function createBaddies() {
    baddies = game.add.group();
    baddies.enableBody = true;
    baddies.setAll('checkWorldBounds', true);
    baddies.setAll('outOfBoundsKill', true);
}

function createBaddie() {
    var posX = game.rnd.integerInRange((game.world.width/20), game.world.width);
    var baddie = baddies.create(posX, game.world.randomY - 200, 'baddie');
    addBaddieAnimations(baddie);
    game.physics.arcade.enable(baddie);
    baddie.body.gravity.y = 300;
    baddie.body.bounce.y = randomBounce();
    baddie.body.velocity.x = -100;
    baddie.animations.play('run-left');
}

function addBaddieAnimations(baddie) {
    baddie.animations.add('run-left', [0,1], 5, true);
    baddie.animations.add('run-right', [2,3], 5, true);
}

function attachInputEvents() {
    upKey = game.input.keyboard.addKey(Phaser.Keyboard.UP);
    downKey = game.input.keyboard.addKey(Phaser.Keyboard.DOWN);
    leftKey = game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
    rightKey = game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);
    spacebarKey = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
}

function associatedInteractions() {
    game.physics.arcade.collide(player, ground);
    game.physics.arcade.collide(stars, ground);
    game.physics.arcade.collide(fireballs, ground);
    game.physics.arcade.collide(baddies, ground);
    game.physics.arcade.overlap(player, baddies, killPlayer, null, this);
    game.physics.arcade.overlap(fireballs, baddies, beatBaddie, null, this);
    game.physics.arcade.overlap(player, stars, collectStar, null, this);
}

function update() {
    if(!player.alive) {
        return;
    }

    var fire = spacebarKey.isDown,
        jump = upKey.isDown,
        left = leftKey.isDown,
        right = rightKey.isDown,
        duck = downKey.isDown;

    // Create Baddie after every 4 seconds
    if (game.time.now > activeGameTime) {
        createBaddie();
        createStar();
        activeGameTime = game.time.now + 2000;
    }

    associatedInteractions();
    clouds.tilePosition.x -= 2;
    ground.tilePosition.x -= 0.5;
    player.body.velocity.x = 0;
    player.animations.play('walk');
    // define what should happen when a button is pressed
    if (left && !duck) {
        player.scale.x = -1;
        player.body.velocity.x = -200;
        player.animations.play('walk');
    }
    else if (right && !duck) {
        player.scale.x = 1;
        player.body.velocity.x = 200;
        player.animations.play('walk');
    }
    else if (duck && !left && !right) {
        player.body.velocity.x=0;
        player.animations.play('duck');
    }
    else if (duck && right) {
        player.scale.x = 1;
        player.body.velocity.x = 200;
        player.animations.play('duckwalk');
    }
    else if (duck && left) {
        player.scale.x = -1;
        player.body.velocity.x = -200;
        player.animations.play('duckwalk');
    }
    if (jump) {
        jump_now(); player.loadTexture('mario', 5);
    }  //change to another frame of the spritesheet
    if (fire) {
        fire_now(); player.loadTexture('mario', 8);
    }
    if (game.input.currentPointers == 0 && !game.input.activePointer.isMouse){ fire=false; right=false; left=false; duck=false; jump=false;} //this works around a "bug" where a button gets stuck in pressed state
}

//some useful functions
function jump_now(){  //jump with small delay
    if (game.time.now > nextJump ){
        player.body.velocity.y = -200;
        nextJump = game.time.now + 800;
    }
}

function fire_now() {
    if (game.time.now > nextFire){
        nextFire = game.time.now + fireRate;
        var fireball = fireballs.getFirstExists(false); // get the first created fireball that no exists atm
        if (fireball){
            fireball.exists = true;  // come to existance !
            fireball.lifespan=2500;  // remove the fireball after 2500 milliseconds - back to non-existance
            fireball.body.gravity.y = 400;
            fireball.body.bounce.y = 0.7 + Math.random() * 0.2;
            if(player.scale.x == -1){  // if player looks to the left - create the fireball on his left side
                fireball.reset(player.x-20, player.y);
                fireball.body.velocity.x = -500;
                fireball.body.velocity.y = -80;
            }else{
                fireball.reset(player.x+20, player.y);
                fireball.body.velocity.x = 500;
                fireball.body.velocity.y = -80;
            }
        }
    }
}

function collectStar(player, star) {
    // Removes the star from the screen
    star.kill();
    game.audio.play('ping');
    updateScore(1);
}

function updateScore(points) {
    score += points;
    scoreText.text = 'Score: ' + score;
}

function beatBaddie(fireball, baddie) {
    // Removes the star from the screen
    baddie.kill();
    fireball.kill();
    updateScore(5);
    game.audio.play('beat');
}

function killPlayer(player, baddie) {
    // Removes the star from the screen
    player.kill();
    baddie.kill();
    game.audio.play('killed');
    setTimeout(function() {
        gameOver();
    }, 100);
}

function gameOver() {
    var txtStyle = {font: "50px Arial", fill: "red", stroke: '#000000', strokeThickness: 3},
        txt = this.game.add.text(game.camera.width / 2, game.camera.height / 2, "Game Over", txtStyle);
    txt.anchor.setTo(0.5, 0.5);
    txt.fixedToCamera = true;
}