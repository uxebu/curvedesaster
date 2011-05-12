!function(global){
	var mobile = true;

	var CLICK = mobile ? 'touchstart' : 'click';
	var KEY_DOWN = mobile ? 'touchstart' : 'keydown';
	var KEY_UP = mobile ? 'touchend' : 'keyup';

	var engine = global.engine = function(canvas, hash, obj){
		if (!canvas){ return; }

		mixin(this, delegate());

		this.canvas = canvas;
		this.canvas.style.borderColor = obj.color;
		this.hash = hash;
		this.x = +obj.x; // Cache init values for restart
		this.y = +obj.y; // Cache init values for restart
		this.color = obj.color;
		this.ctx = this.canvas.getContext('2d');

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

		var socket = this.socket = new io.Socket();
		socket.connect();

		var that = this;
 		socket.on('message', function(data){
			switch (data.type){
				case 'admin':
					that.admin = true;
					that.emit('admin');
					break;
				case 'joined':
					console.log('joined', data.users);
					that.emit('joined', data.users);
					break;
				case 'over':
					that.clear();
					that.running = false;

					// TODO: We have some code duplication here and in the gameOver method.
					// factor out.
					that.emit('over');
					that.admin && that.emit('admin');
					alert(data.player.name + ' lost the game hahaha');
					break;
				case 'player':
					console.log('PPlayer');
					that.emit('player');
					break;
				case 'update':
					that.running && that.drawPlayer({
						x: data.x,
						y: data.y,
						color: data.c
					});
					break;
				case 'start':
					that.start();
					that.emit('arm');
					break;
			}
		});
 		socket.on('disconnect', function(){ console.log('disconnect'); });

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
			if (!this.init){
				return;
			}

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
			// Paint canvas black
			this.clear();

			this.socket.send({
				type: 'over',
				player: user
			});

			this.running = false;
			this.emit('over');
			this.admin && this.emit('admin');
			//this.admin && this.emit('over');

			alert(user.name + ': you lost!');
		},
		initPlayer: function(){
			for (var player in this.players){
				this.drawPlayer(this.players[player]);
			}
		},
		join: function(name){
			this.players = {};
			this.players[name] = {
					x: +this.x,
					y: +this.y,
					color: this.color,
					ix: 0,
					iy: 1,
					angle: 0,
					name: name
			};

			this.keyMap = {
				37: {
					id: name,
					angle: -3
				},
				39: {
					id: name,
					angle: 3
				},
				left: {
					id: name,
					angle: -3
				},
				right: {
					id: name,
					angle: 3
				}
			};

			this.socket.send({type: 'join', hash: this.hash, username: name});

			this.init = true;
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
			this.admin && this.socket.send({
				type: 'start'
			});
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

				this.socket.send({
					type: 'update',
					id: player,
					x: p.x,
					y: p.y,
					c: p.color
				});

				// Collision detection
				if (this.collides(p)){
					this.gameOver(p);
					p.x = this.x;
					p.y = this.y;

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

		this.validate = /^[a-z0-9]+$/i;

		this.init();
	};

	controls.prototype = {
		arm: function(){
			this.domNode.style.display = 'none';
			this.startButton.style.display = 'none';
		},
		createButton: function(name, label, callb){
			var button = this[name] = document.createElement('button');
			button.id = name;
			button.innerHTML = label;
			button.addEventListener(CLICK, function(){
				callb();
			});
			this.domNode.appendChild(button);
		},
		createInput: function(name, type, placeholder){
			var input = this[name] = document.createElement('input');
			input.type = type;
			input.id = name;
			input.placeholder = placeholder;
			this.domNode.appendChild(input);
		},
		createNode: function(type, name, text){
			var node = this[name] = document.createElement(type);
			node.innerText = text;
			node.id = name;
			this.domNode.appendChild(node);
		},
		enableGame: function(){
			console.log('Admin again');
			this.startButton.style.display = 'inline';
			this.joinButton.style.display = 'none';
			this.waiting.style.display = 'none';
			this.username.style.display = 'none';
		},
		init: function(){
			var that = this;
			this.createInput('username', 'text', 'Enter username');

			this.createButton('joinButton', 'Join', function(){
				that.join();
			});

			this.createButton('startButton', 'Start', function(){
				that.start();
			});

			this.createNode('div', 'waiting', 'Please wait until admin launches the game.');
			this.createNode('ul', 'members', 'Welcome to curve desaster');
		},
		join: function(){
			var username = this.username.value;
			if (this.validate.test(username)){
				this.emit('join', username);
			}else{
				alert('You can only use characters');
			}
		},
		joined: function(users){
					console.log(users.split(','));
			this.members.innerHTML = users.split(',').map(function(user){
				return '<li>' + user + '</li>';
			}).join('');
		},
		start: function(){
		   	this.arm();
			this.emit('start');
		},
		stop: function(){
			this.domNode.style.display = '-webkit-box';
		},
		waitGame: function(){
			console.log('waiting');
			this.joinButton.style.display = 'none';
			this.username.style.display = 'none';
			this.waiting.style.display = 'block';
		}
	};
}(this);
