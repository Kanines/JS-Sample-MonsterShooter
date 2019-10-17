kamyk.monsterShooter={};
kamyk.monsterShooter.MonsterShooter = kamyk.Game.$extend({
    __init__: function (canvasID) {
        self = this;
        self.$super(canvasID);
        self.context.fillStyle = "white";
        self.context.font = "bold 18px Arial";
        self.fpsFrames = 0;
        self.fpsTime = 0;
        self.fps = 0
        self.collisionDetector = new kamyk.CollisionDetector();
        self.inputManager = new kamyk.InputManager(self);
        self.offScreenCanvas = new kamyk.OffScreenCanvas(self);
        self.monstersNumber = 15;
        self.monsterSpawnInterval = 2000;
        self.monsterPositions = [
            [0, 0], 						// top left
            [self.width, 0], 				// top right
            [self.width, self.height], 		// bottom right
            [0, self.height], 				// bottom left
            [self.width / 2, 0], 			// top
            [self.width, self.height / 2],	// right
            [self.width / 2, self.height], 	// bottom
            [0, self.height / 2] 			// left
        ];

        self.lastSpawnTime = 0;
        self.monsters = [];
		self.shootingAngle = undefined;
		self.projectiles = [];
		self.background = new kamyk.Sprite(0, 0);
        self.hero = new kamyk.Player(self.width / 2 - 50, self.height / 2 - 50, 100);
    },    
    initResources: function() {
        //u¿ycie obiektu ³aduj¹cego obrazki
        self.backgroundImgIndex = self.imageLoader.addURL("img/background.png", self.background);
        self.imageLoader.addURL("img/wizard_small.png", self.hero);
        self.monsterImage = self.imageLoader.addURL("img/skeleton_walk_sprite.png", undefined);
        self.projectileImage = self.imageLoader.addURL("img/projectile_glow_orange_sprite.png", undefined);
        self.imageLoader.startLoading();
    },
    onLoaderReady: function(imageLoader) {
        self.$super(imageLoader);
        self.background.resize(self.width, self.height);
        self.offScreenCanvas.addRenderable(self.background);
        self.offScreenCanvas.addRenderable(self.hero);
        self.offScreenCanvas.renderYourself();
    },
    render: function () {
        self.offScreenCanvas.renderToMainCanvas();
		
        //self.context.drawImage(self.imageLoader.getImage(self.backgroundImgIndex), 0, 0, self.width, self.height);
        //self.hero.render(self.context);
		
        if (self.hero.health > 0) {
            self.context.fillText("HP: " + self.hero.health, 10, 20);
            for (var i = 0; i < self.monsters.length; i++) {
                self.monsters[i].render(self.context);
            }
            for (var i = 0; i < self.projectiles.length; i++) {
                self.projectiles[i].render(self.context);
            }
        } else {
            self.context.fillText("DEFEAT", self.width / 2 - 50, self.height / 2 - 150);
        }
        if (self.fps > 0){
            self.context.fillText("FPS: " + Math.round(self.fps), self.width - 70, 20);
		}
    },
    update: function (dt) {
        self.updateFps(dt);
        self.hero.update(dt);
        self.spawnMonsterIfNeeded(dt);
        for (var i = 0; i < self.monsters.length; i++) {
            if (self.collisionDetector.collide(self.hero, self.monsters[i])) {
                self.monsters[i].stopMoving();
                self.monsters[i].attack(self.hero);
            } else {
                self.monsters[i].stopAttacking();
                self.monsters[i].moveTo(self.hero.x, self.hero.y);
            }
            self.monsters[i].update(dt);
        }
        for (var i = 0; i < self.projectiles.length; i++) {
            self.projectiles[i].update(dt);
            if (self.projectiles[i].x < 0 ||
                self.projectiles[i].x > self.width ||
                self.projectiles[i].y < 0 ||
                self.projectiles[i].y > self.height) {
                self.projectiles.splice(i, 1);
                i--;
            }
            for (var j = 0; j < self.monsters.length; j++) {
                if (self.collisionDetector.collide(self.projectiles[i], self.monsters[j])) {
                    self.monsters.splice(j, 1);
                    self.projectiles.splice(i, 1);
                    i--;
                }
            }
        }
    },
    updateFps: function (dt) {
        self.fpsTime += dt;
        self.fpsFrames++;
        if (self.fpsTime > 1000) {
            self.fps = self.fpsFrames / (self.fpsTime / 1000);
            self.fpsTime = 0;
            self.fpsFrames = 0;
        }
    },
    spawnMonsterIfNeeded: function(dt) {
        self.lastSpawnTime += dt;
        if (self.lastSpawnTime > self.monsterSpawnInterval && self.monsters.length < self.monstersNumber) {
            self.lastSpawnTime = 0;
            var monsterPosIndex = Math.floor(Math.random() * self.monsterPositions.length);
            self.monsters.push(new kamyk.Monster(self.monsterPositions[monsterPosIndex][0],
                self.monsterPositions[monsterPosIndex][1],
                self.imageLoader.getImage(self.monsterImage)));
        }
    },
	newHeading: function (heading) {
		self.shootingAngle = heading;
	},
	shootProjectile: function () {
	    var angle = self.shootingAngle != undefined ? self.shootingAngle : (Math.random() * Math.PI * 2);
		self.projectiles.push(new kamyk.Projectile(self.hero.midX, self.hero.midY,
                self.imageLoader.getImage(self.projectileImage), angle));
	}
});

kamyk.InputManager = Class.$extend({
    __init__: function (game) {
        var shootEvent = navigator.userAgent.match(/(iPhone|Android)/) ? "touchstart" : "click";
        game.kanwa.addEventListener(shootEvent, function (evt) {
			game.shootProjectile();
        }, true)
		
		var options = {frequency:1000};
		var onError = function(compassError){
			alert('Kompas jednak nie dzia³a: '+ compassError.code);
		};
		if(navigator.compass!== undefined){
			var watchID = navigator.compass.watchHeading(function(heading){     
				//u¿ycie azymutu (heading), by okreœliæ kierunek wystrzelenia pocisku
				game.newHeading(heading.trueHeading)
			;}, onError, options)
		;}
		else {
			console.error("Nie ma obiektu navigator.compass!");
		}
    }
});

var gra = undefined;
kamyk.monsterShooter.onDeviceReady = function () {
    gra = new kamyk.monsterShooter.MonsterShooter("kanwa");
    gra.start();
};
kamyk.monsterShooter.letsGo=function(){
    if (navigator.userAgent.match(/(iPhone|Android)/)) {
        document.addEventListener("deviceready", kamyk.monsterShooter.onDeviceReady, false);
    } else {
        kamyk.monsterShooter.onDeviceReady();
    }
};
