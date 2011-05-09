!function(global){
	var engine = global.engine = function(canvas){
		if (!canvas){ return; }

		this.canvas = canvas;
		this.ctx = this.canvas.getContext('2d');
		this.players = {
			'dude': {
				x: 23,
				y: 50,
				color: 'rgb(123,240,543)',
				d: 'l',
				name: 'Dude'
			},
			'fritz': {
				x: 55,
				y: 87,
				color: 'rgb(100,200,300)',
				d: 'r',
				name: 'Fritz'
			}
		};
		this.keyMap = {
			65: {
				id: 'fritz',
				d: 'l'
			},
			87: {
				id: 'fritz',
				d: 'u'
			},
			68: {
				id: 'fritz',
				d: 'r'
			},
			83: {
				id: 'fritz',
				d: 'd'
			},
			37: {
				id: 'dude',
				d: 'l'
			},
			38: {
				id: 'dude',
				d: 'u'
			},
			39: {
				id: 'dude',
				d: 'r'
			},
			40: {
				id: 'dude',
				d: 'd'
			},

		};

		// Config
		this.framerate = 60;

		// Setup
		this.registerKeyEvents();

		// Paint canvas black
		this.ctx.fillStyle = "rgb(0,0,0)";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

		this.init = true;
	};

	engine.prototype = {
		collides: function(x, y){
			var data = this.ctx.getImageData(x, y, 1, 1).data;
			if (data[0] == 0 && data[1] == 0 && data[2] == 0){
				return false;
			}
			return true;
		},
		dispatch: function(charCode){
			var user, km;
			(km = this.keyMap[charCode]) && (user = this.keyMap[charCode].id);
			user && (this.players[user].d = km.d);
		},
		drawPlayer: function(user){
			// Draw
			this.ctx.fillStyle = user.color;
			this.ctx.fillRect(user.x, user.y, 1, 1);
		},
		gameOver: function(user){
			alert(user.name + ': you lost!');

			// Paint canvas black
			this.ctx.fillStyle = "rgb(0,0,0)";
			this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

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
		nextPosition: function(user){
			switch (user.d){
				case 'l':
					user.x--;
					break;
				case 'u':
					user.y--;
					break;
				case 'r':
					user.x++;
					break;
				case 'd':
					user.y++;
					break;
			}
		},
		render: function(){
			var p;
			for (var player in this.players){
				p = this.players[player];
				this.nextPosition(p);

				// Collision detection
				if (this.collides(p.x, p.y)){
					this.gameOver(p);
				}else{
					this.drawPlayer(p);
				}
			}
			var that = this;
			webkitRequestAnimationFrame(function(){
				that.running && that.render();
			});
		},
		registerKeyEvents: function(){
			var that = this;
			document.body.addEventListener('keydown', function(e){
				e.preventDefault();
				that.dispatch(e.keyCode);
			})
		}
	};
}(this);
