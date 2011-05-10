!function(global){
	var mobile = true;

	var CLICK = mobile ? 'touchstart' : 'click';
	var KEY_DOWN = mobile ? 'touchstart' : 'keydown';
	var KEY_UP = mobile ? 'touchend' : 'keyup';

	var engine = global.engine = function(canvas){
		if (!canvas){ return; }

		mixin(this, delegate());

		this.canvas = canvas;
		this.ctx = this.canvas.getContext('2d');
		this.players = {
			'dude': {
				x: 200,
				y: 200,
				color: 'rgb(123,240,543)',
				ix: 0,
				iy: 1,
				angle: 0,
				name: 'Dude'
			}/*,
			'fritz': {
				x: 250,
				y: 250,
				color: 'rgb(100,200,300)',
				ix: 1,
				iy: 0,
				angle: 0,
				name: 'Fritz'
			}*/
		};
		this.keyMap = {
			65: {
				id: 'fritz',
				angle: -3
			},
			68: {
				id: 'fritz',
				angle: 3
			},
			37: {
				id: 'dude',
				angle: -3
			},
			39: {
				id: 'dude',
				angle: 3
			},
			left: {
			  	id: 'dude',
			  	angle: -3
			},
			right: {
			   	id: 'dude',
			   	angle: 3
			}
		};

		// Config
		this.framerate = 60;
		this.radius = 1.5;
		this.center = 1;
		this.width = this.canvas.width;
		this.height = this.canvas.height;

		// Setup
		this.registerKeyEvents();

		// Paint clear canvas
		this.clear();

		this.init = true;
	};

	engine.prototype = {
     	clear: function(){
			this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
     	},
		isCollidingPixelValue: function(vector){
			var data = this.ctx.getImageData(vector[0]-this.center, vector[1]-this.center, 1, 1).data;
			return data[3] > 100;
		},
		collides: function(user){
			var x = user.x;
			var y = user.y;

			// Getting next hypothetical position
			var ixy = this.orientate(user, 0);

			// Calculating the delta between the current and the new vector to then
			// determine the next pixel based on the deltas angle.
			var deltax = ixy[0] - x;
			var deltay = ixy[1] - y;
			var angle = Math.atan2(deltay, deltax);

			// Checking collision at three spots around the tip of the line:
			// front, left and right
			var nxyf = this.getVector(user, angle);
			var nxyr = this.getVector(user, angle + Math.PI/180*90);
			var nxyl = this.getVector(user, angle + Math.PI/180*-90);

			if (x <= 1 || x >= this.width - 1 || y <= 1 || y >= this.height - 1 ||
					this.isCollidingPixelValue(nxyf) ||
					this.isCollidingPixelValue(nxyl) ||
					this.isCollidingPixelValue(nxyr)){
				return true;
			}
			return false;
		},
		getVector: function(user, angle){
			var x = (user.x + (this.radius + 1) * Math.cos(angle));
			var y = (user.y + (this.radius + 1) * Math.sin(angle));
			return [x, y];
		},
		handleEvent: function(e){
			e.preventDefault();
			var charCode = e.target.id || e.keyCode;
			var user, km;
			(km = this.keyMap[charCode]) && (user = this.keyMap[charCode].id);
			if (user) {
				this.players[user].angle = km.angle - (e.type === KEY_UP ? km.angle : 0);
			}
		},
		drawPlayer: function(user){
			// Draw
			this.ctx.fillStyle = user.color;
			this.ctx.beginPath();
			this.ctx.arc(user.x - this.center, user.y - this.center, this.radius, 0, Math.PI*2);
			this.ctx.fill();
		},
		gameOver: function(user){
			alert(user.name + ': you lost!');

			// Paint canvas black
			this.clear();

			this.running = false;
			this.emit('over');
		},
		initPlayer: function(){
			for (var player in this.players){
				this.drawPlayer(this.players[player]);
			}
		},
		orientate: function(user, angle){
				var angle = angle * (Math.PI / 120);
				var _ix = user.ix;
				var _iy = user.iy;

				ix = _ix * Math.cos(angle) - _iy * Math.sin(angle);
				iy = _ix * Math.sin(angle) + _iy * Math.cos(angle);

				var x = user.x + ix;
				var y = user.y + iy;

				return [x, y, ix, iy];
		},
		start: function(){
			if (!this.init){ return; };
			this.running = true;
			this.initPlayer();
			this.render();
		},
		stop: function(){
			this.clear();
			this.running = false;
		},
		transform: function(user){
			var ixy = this.orientate(user, user.angle);

			user.x = ixy[0];
			user.y = ixy[1];
			user.ix = ixy[2];
			user.iy = ixy[3];
		},
		render: function(){
			var p;
			for (var player in this.players){
				p = this.players[player];
				this.transform(p);

				this.drawPlayer(p);

				// Collision detection
				if (this.collides(p)){
					this.gameOver(p);
				}
			}
			var that = this;
			// Can't use requestAnimationFrame on mobile :(
			var t = setTimeout(function(){
				clearTimeout(t);
				that.running && that.render();
			}, 1000 / 40);
		},
		registerKeyEvents: function(){
			document.body.addEventListener(KEY_DOWN, this);
			document.body.addEventListener(KEY_UP, this);
		}
	};

	var controls = global.controls = function(domNode){
		this.domNode = domNode;

		mixin(this, delegate());

		this.init();
	};

	controls.prototype = {
		createButton: function(name, label, callb){
			var button = this[name] = document.createElement('button');
			button.id = name;
			button.innerHTML = label;
			button.addEventListener(CLICK, function(){
				callb();
			});
			this.domNode.appendChild(button);
		},
		init: function(){
			var that = this;
			this.createButton('startButton', 'Start', function(){
				that.start();
			});

			this.createButton('stopButton', 'Stop', function(){
				that.stop();
			});
		},
		start: function(){
			this.stopButton.style.display = '';
			this.startButton.style.display = 'none';
			this.emit('start');
		},
		stop: function(){
			this.stopButton.style.display = 'none';
			this.startButton.style.display = '';
			this.emit('stop');
		}
	};
}(this);
