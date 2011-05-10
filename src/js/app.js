!function(global){
	var engine = global.engine = function(canvas){
		if (!canvas){ return; }

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
			},
			'fritz': {
				x: 350,
				y: 350,
				color: 'rgb(100,200,300)',
				ix: 1,
				iy: 0,
				angle: 0,
				name: 'Fritz'
			}
		};
		this.keyMap = {
			65: {
				id: 'fritz',
				angle: -4
			},
			68: {
				id: 'fritz',
				angle: 4
			},
			37: {
				id: 'dude',
				angle: -4
			},
			39: {
				id: 'dude',
				angle: 4
			}
		};

		// Config
		this.framerate = 60;
		this.radius = 1.5;
		this.center = 1;

		// Setup
		this.registerKeyEvents();

		// Paint canvas black
		this.clear();

		this.init = true;
	};

	engine.prototype = {
     	clear: function(){
			this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
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
			var newx = (x + this.radius + 1 * Math.cos(angle));
			var newy = (y + this.radius + 1 * Math.sin(angle));


			var data = this.ctx.getImageData(newx-this.center, newy-this.center, 1, 1).data;
			if (x <= 1 || x >= 499 || y <= 1 || y >= 499 || data[3] > 100){
				return true;
			}
			return false;
		},
		handleEvent: function(e){
			e.preventDefault();
			var charCode = e.keyCode;
			var user, km;
			(km = this.keyMap[charCode]) && (user = this.keyMap[charCode].id);
			if (user) {
				this.players[user].angle = km.angle - (e.type === 'keyup' ? km.angle : 0);
			}
		},
		drawPlayer: function(user){
			// Draw
			this.ctx.fillStyle = user.color;
			this.ctx.beginPath();
			this.ctx.arc(user.x - this.center, user.y - this.center, this.radius, 0, Math.PI*2, true);
			this.ctx.closePath();
			this.ctx.fill();
		},
		gameOver: function(user){
			alert(user.name + ': you lost!');

			// Paint canvas black
			this.clear();

			this.running = false;
		},
		initPlayer: function(){
			for (var player in this.players){
				this.drawPlayer(this.players[player]);
			}
		},
		launch: function(){
			if (!this.init){ return; };
			this.running = true;
			this.initPlayer();
			this.render();
		},
		orientate: function(user, angle){
				var angle = angle * (Math.PI / 270);
				var speed = 1;
				var ix = user.ix;
				var iy = user.iy;

				ix = ix * Math.cos(angle) - iy * Math.sin(angle);
				iy = ix * Math.sin(angle) + iy * Math.cos(angle);

				var x = user.x + speed * ix;
				var y = user.y + speed * iy;

				return [x, y, ix, iy];
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
			webkitRequestAnimationFrame(function(){
				that.running && that.render();
			});
		},
		registerKeyEvents: function(){
			var that = this;
			document.body.addEventListener('keydown', this);
			document.body.addEventListener('keyup', this);
		}
	};
}(this);
