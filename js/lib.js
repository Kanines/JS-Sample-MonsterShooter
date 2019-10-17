//polyfill by Erik Möller
//http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
//http://www.paulirish.com/2011/requestanimationframe-for-smart-animating/
(function () {
    var lastTime = 0;
    var vendors = ['webkit', 'moz'];
    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function (callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function () { callback(currTime + timeToCall); }, timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    if (!window.cancelAnimationFrame) window.cancelAnimationFrame = function (id) { clearTimeout(id); };
}());

/** * Klasa obs³uguj¹ca ³adowanie obrazków. */
var kamyk = {};
kamyk.ImageLoader = Class.$extend({
    /**"Konstruktor"*/
    __init__: function (whoWaitsForMyJob) {
        //Liczba obrazków, które za³adowano
        this.numLoaded = 0;/*         * Obiekt, który oczekuje na za³adowanie wszystkich obrazków         
        * Musi implementowaæ metodê onLoaderReady(imageLoader)         */
        this.waiting = whoWaitsForMyJob;//Adresy obrazków
        this.URLs = [];//Same obrazki
        this.images = [];//Obiekty oczekuj¹ce za³adowania poszczególnych obrazków.
        this.imageReceivers = [];
    },
    /**Dodaje url obrazka do wczytania i zwraca jego identyfikator.     
        * Opcjonalnie mo¿na zdefiniowaæ obiekt oczekuj¹cy za³adowania tego konkretnego obrazka -      
        * powinien on zawieraæ metodê "setImage(img)".*/
    addURL: function (imageURL, imageReceiver) {
        this.imageReceivers.push(imageReceiver);
        return this.URLs.push(imageURL) - 1;
    },
    /**      * Rozpoczyna ³adowanie obrazków.     */
    startLoading: function () {
        this.numLoaded = 0;
        var that = this;
        var loadedFuncWrapper = function () {
            that.__imageLoaded();
        };
        for (var i = 0; i < this.URLs.length; i++) {
            this.images[i] = new Image();
            this.images[i].onload = loadedFuncWrapper;
            this.images[i].src = this.URLs[i];
        }
    },
    /**     * Zwraca i-ty obrazek.     */
    getImage: function (ind) {
        return this.images[ind];
    },
    /*** Wywo³ywane po za³adowaniu ka¿dego z obrazków.     */
    __imageLoaded: function () {
        this.numLoaded++;
        var isReady = (this.numLoaded === this.URLs.length);
        if (isReady === true) { this.__finishedLoading(); }
    },
    /**     * Wywo³ywane po za³adowaniu wszystkich obrazków.     */
    __finishedLoading: function () {
        for (var i = 0; i < this.URLs.length; i++) {
            if (this.imageReceivers[i] !== undefined) {
                this.imageReceivers[i].setImage(this.getImage(i));
            }
        }
        this.waiting.onLoaderReady(this);
    }
});

kamyk.AbstractException = "Brak implementacji metody w podklasie!";

kamyk.Game = Class.$extend({
    /**"Konstruktor"*/
    __init__: function (canvasId) {
        this.kanwa = document.getElementById(canvasId);
        this.kanwa.width = window.innerWidth;
        this.kanwa.height = window.innerHeight;
        this.context = this.kanwa.getContext("2d");
        this.kanwa.getAttribute("tabIndex", "0");
        this.kanwa.focus();
        this.imageLoader = new kamyk.ImageLoader(this);
        this.width = this.kanwa.width;
        this.height = this.kanwa.height;
        this.time = 0;
    },
    initResources: function () {
        throw kamyk.AbstractException;
    },
    update: function () {
        throw kamyk.AbstractException;
    },
    render: function () {
        throw kamyk.AbstractException;
    },
    draw: function () {
        requestAnimationFrame(gra.draw);
        var now = new Date().getTime(),
            dt = now - (this.time || now);
        this.time = now;
        gra.update(dt);
        gra.render();
    },
    onLoaderReady: function (imageLoader) {
        this.draw();
    },
    start: function () {
        this.initResources();
    }
});

kamyk.Sprite = Class.$extend({
    __init__: function (x, y) {
        this.x = x;
        this.y = y;
        this.sizeX = 1;
        this.sizeY = 1;
        this.midXOffset = 1;
        this.midYOffset = 1;
        this.speed = 0.1;
        this.isMoving = false;
        this.image = undefined;
    },
    setImage: function(img) {
        this.image = img;
        this.resize(this.image.width, this.image.height);
    },
    resize: function (newWidth, newHeight) {
        this.sizeX = newWidth;
        this.sizeY = newHeight;
        this.midXOffset = Math.floor(this.sizeX / 2);
        this.midYOffset = Math.floor(this.sizeY / 2);
        this.__middleCoordsInit();
    },
    __middleCoordsInit: function () {
        this.midX = this.x + this.midXOffset;
        this.midY = this.y + this.midYOffset;
    },
    /**Rysowanie*/    
    render: function(ctx){
        if(this.image!== undefined) {   
            ctx.drawImage(this.image, Math.floor(this.x), Math.floor(this.y),this.sizeX,this.sizeY);
        }
    },
    update: function (dt) {
        if (this.isMoving) {
            var distance = dt * this.speed;

            if (this.x < this.xTarget) {
                this.x += distance;
                if (this.x > this.xTarget)
                    this.x = this.xTarget;
            }
            else if (this.x > this.xTarget) {
                this.x -= distance;
                if (this.x < this.xTarget)
                    this.x = this.xTarget;
            }

            if (this.y < this.yTarget) {
                this.y += distance;
                if (this.y > this.yTarget)
                    this.y = this.yTarget;
            }
            else if (this.y > this.yTarget) {
                this.y -= distance;
                if (this.y < this.yTarget)
                    this.y = this.yTarget;
            }

            if (this.x == this.xTarget && this.y == this.yTarget)
                this.isMoving = false;
        }
    },
    moveTo: function (xTarg, yTarg) {
        this.xTarget = xTarg,
        this.yTarget = yTarg;
        this.isMoving = true;
    },
    stopMoving: function() {
        this.isMoving = false;
    }
});

/**Animowany obiekt gry*/
kamyk.AnimatedSprite= kamyk.Sprite.$extend({
    /**Konstruktor z dodatkowymi parametrami - iloœci¹ kolumn i rzêdów w obrazku z animacjami*/    
    __init__:function(x, y, numCol, numRow){
        this.$super(x, y);
        //liczba kolumn obrazka
        this.cols= numCol;
        //liczba wierszy obrazka
        this.rows= numRow;
        //co ile ms podmieniaæ obrazek(klatkê) animacji
        this.__frameChangeDt = 100;
        //ile czasu jest ju¿ wyœwietlany aktualny obrazek(klatka) animacji
        this.__curFrameTime = 0;
        //indeks aktualnej klatki animacji
        this.__curFrameInd = 0;
        //”ramki”/klatki animacji – domyœlnie pierwsza ramka obrazka        
        this.frames = [0];
        //czy zapêtlaæ animacjê
        this.loopAnim = true;
        //czy wstrzymaæ animacjê
        this.stopAnim = false;

        var frameNumbers = [];
        for (var i = 0; i < (numRow * numCol) ; i++) {
            frameNumbers.push(i);
        }
        this.setAnimationFramesSeq(frameNumbers);
    },
    /**Zmodyfikowana wersja metody setImage() -> rozmiar nie mo¿e ju¿ byæ rozmiarem obrazka*/
    setImage:function(img){
        this.image= img;
        this.sizeX= Math.floor(this.image.width/this.cols);
        this.sizeY= Math.floor(this.image.height/this.rows);
        this.midXOffset=this.sizeX/2;
        this.midYOffset=this.sizeY/2;
        this.__middleCoordsInit();
    },
    /**Ustala, które czêœci obrazka maj¹ braæ udzia³ w animacji*/    
    setAnimationFramesSeq:function(frameNumbers){
        this.frames = frameNumbers;
        this.__curFrameTime = 0;
        this.__curFrameInd = 0;
        this.curFrame=this.frames[this.__curFrameInd];
    },
    /**Rysuje w odpowiednim miejscu (x,y) odpowiedni fragment obrazka*/    
    render:function(ctx){
        if(this.image!== undefined){
            var xFrame = (this.curFrame%this.cols)*this.sizeX;
            var yFrame = Math.floor(this.curFrame/this.cols)*this.sizeY;            
            ctx.drawImage(this.image, xFrame, yFrame,this.sizeX,this.sizeY,Math.floor(this.x), Math.floor(this.y),this.sizeX,this.sizeY);
        }
    },
    update: function (dt) {
        this.$super(dt);
        this.__curFrameTime += dt;
        if (this.__curFrameTime > this.__frameChangeDt) {
            this.__curFrameTime = 0;
            if (this.__curFrameInd < this.frames.length - 1) {
                this.__curFrameInd++;
            } else if (this.loopAnim) {
                this.__curFrameInd = 0;
            }
            this.curFrame = this.frames[this.__curFrameInd];
        }
    }
});

kamyk.Actor = kamyk.AnimatedSprite.$extend({
    __init__: function (x, y, numCol, numRow) {
        this.$super(x, y, numCol, numRow);
        this.directionSeqs = {
            down: [0, 1, 2, 3, 4, 5],
            left: [6, 7, 8, 9, 10, 11],
            right: [12, 13, 14, 15, 16, 17],
            up: [18, 19, 20, 21, 22 ,23]
        };
        this.currentDirection = "";
    },
    update: function(dt) {
        this.$super(dt);
        var vAngle = Math.atan2(this.yTarget - this.y, this.xTarget - this.x) * 180 / Math.PI;
        var direction = "";

        if (vAngle > 45 && vAngle < 135)
            direction = "down";
        else if (vAngle < -135 || vAngle > 135)
            direction = "left";
        else if (vAngle < 45 && vAngle > -45)
            direction = "right";
        else if (vAngle < -45 && vAngle > -135)
            direction = "up";

        if (direction != this.currentDirection) {
            this.setAnimationFramesSeq(this.directionSeqs[direction]);
            this.currentDirection = direction;
        }
    }
});

kamyk.Player = kamyk.Sprite.$extend({
    __init__: function (x, y, baseHP) {
        this.$super(x, y);
        this.health = baseHP;
    },
    obtain: function (dmg) {
        if (this.health > 0)
            this.health -= dmg;
    }
});

kamyk.Monster = kamyk.Actor.$extend({
    __init__: function (x, y, image) {
        this.$super(x, y, 6, 4);
        this.attackInterval = 500;
        this.attackPower = 1;
        this.lastAttackTime = 0;
        this.attackTarget = undefined;
        this.setImage(image);
    },
    attack: function (target) {
        this.attackTarget = target;
    },
    stopAttacking: function () {
        this.attackTarget = undefined;
    },
    update: function (dt) {
        this.$super(dt);
        if (this.attackTarget != undefined) {
            this.lastAttackTime += dt;
            if (this.lastAttackTime > this.attackInterval) {
                this.lastAttackTime = 0;
                this.attackTarget.obtain(this.attackPower);
            }
        }
    }
});

kamyk.Projectile = kamyk.AnimatedSprite.$extend({
    __init__: function(x, y, image, angle) {
        this.$super(x, y, 4, 4);
        this.angle = angle;
        this.speed = 1;
        this.setImage(image);
    },
    update: function (dt) {
        this.$super(dt);
        var vx = dt * this.speed * Math.cos(this.angle);
        var vy = dt * this.speed * Math.sin(this.angle); 
        this.x += vx;
        this.y += vy;
    }
});

/*** 
* „Wykrywacz” kolizji.
*/
kamyk.CollisionDetector=Class.$extend({
    /**Czy dwa „sprite'y” koliduj¹. */    
    collide:function(spriteA, spriteB) {
        var result =this._intersectsRectRect(spriteA, spriteB);
        return result;
    },
    /**Wykrywanie kolizji na bazie prostok¹tów*/    
    _intersectsRectRect:function(a, b){
        return (a.x <= b.x + b.sizeX &&
			b.x <= a.x + a.sizeX &&
			a.y <= b.y + b.sizeY &&
			b.y <= a.y + a.sizeY);
    }
});

kamyk.OffScreenCanvas = Class.$extend({
    __init__ :function(game){
        this.__renderables =[];
        //tworzenie "off-screen canvas" o odpowiednim rozmiarze
        this.__offScreenCanvas = document.createElement("canvas");
        this.__offScreenCanvas.width = game.width;
        this.__offScreenCanvas.height = game.height;
        //zapamiêtanie dwóch kontekstów graficznych
        this.__ctx = this.__offScreenCanvas.getContext("2d");
        this.__mainCanvasContext = game.context;
    },
    /**Dodanie obiektu, który ma byæ rysowany za poœrednictwem "off-screen canvas". Nale¿y
		wykonaæ na wszystkich obiektach przed wywo³aniem renderYourself()*/
    addRenderable: function (r) { 
		this.__renderables.push(r); 
	},
    /**Do wykonania na pocz¹tku metody Game.render()*/
    renderToMainCanvas: function() {
         this.__mainCanvasContext.drawImage(this.__offScreenCanvas, 0, 0);
    },
    /**Do wykonania tylko raz, na pocz¹tku.*/
    renderYourself: function() {
         for (var i = 0; i < this.__renderables.length; i++) {
              this.__renderables[i].render(this.__ctx);
         }
    }
});