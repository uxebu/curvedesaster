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

		// Setup
		this.registerKeyEvents();

		// Paint canvas black
		this.clear();

		this.init = true;
	};

	engine.prototype = {
     	clear: function(){
			this.ctx.fillStyle = "rgb(0,0,0)";
			this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
     	},
		collides: function(user){
			var x = user.x;
			var y = user.y;

			var ixy = this.orientate(user, 2);

			var deltax = ixy[0] - x;
			var deltay = ixy[1] - y;
			var angle = Math.atan2(deltay, deltax);

			var newx = (x + 3 * Math.cos(angle));
			var newy = (y + 3 * Math.sin(angle));

			var data = this.ctx.getImageData(newx, newy, 1, 1).data;
			if (x <= 1 || x >= 499 || y <= 1 || y >= 499 || data[0] != 0 || data[1] != 0 || data[2] != 0){
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
			this.ctx.fillRect(user.x - 1, user.y - 1, 3, 3);
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
		orientate: function(user){
				var angle = user.angle * (Math.PI / 180);
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
			var ixy = this.orientate(user, 1);

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

				// Collision detection
				if (this.collides(p)){
					this.gameOver(p);
				}

				this.drawPlayer(p);
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
