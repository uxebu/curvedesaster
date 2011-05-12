var express = require('express');
var app = express.createServer();
var io = require('socket.io').listen(app);

var appDir = '/../app';

var games = {};

app.configure(function(){
	app.use(express.static(__dirname + appDir + '/js'));
	app.use(express.static(__dirname + appDir + '/img'));
	app.use(express.static(__dirname + appDir + '/lib'));
	app.use(express.static(__dirname + appDir + '/css'));
	app.use(express.static(__dirname + '../../node_modules/socket.io/support/socket.io-client'));
	app.set('views', __dirname + appDir);
	app.set('view options', { layout: false });
	app.set('view engine', 'mustache');
	app.register('.html', require('stache'));
});

app.listen(8080);

var nextId = 1;
var maxPlayers = 1;

io.on('connection', function(socket){
	var game, player;
	socket.on('message',function(data){

		var dispatch = function(obj){
			var l = game.players.length;
			var p = game.players;
			while (l--){
				if (p[l] != player){
					p[l].socket.send(obj);
				}
			}
		}

		switch (data.type){
			case 'join':
				game = games[data.hash];
				player = {
					socket: socket,
					username: data.username
				};
				game.players.push(player);

				var allPlayers = game.players.map(function(player){
					return player.username;
				});
				var isAdmin = game.hasAdmin ? false : (game.adminSocket = socket, game.hasAdmin = true);

				socket.send({ type: isAdmin ? 'admin' : 'player', admin: isAdmin });

				var l = game.players.length;
				var p = game.players;
				while (l--){
					p[l].socket.send({
						type: 'joined',
						users: allPlayers.join(',')
					});
				}
				break;
			case 'over':
				if (game){
					dispatch({
						type: 'over',
						player: data.player
					});
				}
				break;
			case 'start':
				if (game){
					dispatch({
						type: 'start'
					});
				}
				break;
			case 'update':
				if (game){
					dispatch({
						type: 'update',
						id: data.id,
						x: data.x,
						y: data.y,
						c: data.c
					});
				}
				break;
		}
	});
});

app.get('/', function(req, res){
	res.render('index.html');
});

app.get('/new', function(req, res){
	var hash = (+new Date).toString(36);
	var game = games[hash] = {
		players: []
	};

	res.redirect('/' + hash);
});

app.get('/:hash', function(req, res){
	var hash = req.params.hash;
	var game = games[hash];

	if(!game){
		return res.send('game not found');
	}
	if(game.started){
		return res.send('game already started');
	}

	res.render('game.html', { locals: {
		hash: hash,
		color: '#' + ((Math.random() * 0x999999 << 0) + 0x666666).toString(16),
		x: Math.floor(Math.random()*250),
		y: Math.floor(Math.random()*250)
	}});
});





























/*app.get('/new', function(req, res){
	var hash = (+new Date).toString(36);
	var players = [];
	var game = games[hash] = {
		started: false,
		players: players
	};
	var nextId = 1;
	var hasAdmin = false;
	
	io.for('/' + hash).on('connection', function(socket){
		if(game.started){
			return;
		}
		
		var isAdmin = hasAdmin ? false : (hasAdmin = true); 
		
		var player = {
			id: nextId++,
			color: '#' + (Math.random() * 0xffffff << 0).toString(16),
			isAdmin: isAdmin
		};
		players.push(player);
		io.sockets.emit('new player', player);
		
		socket.on('disconnect', function(){
			var i = players.indexOf(player);
			players.splice(i, 1);
			hasAdmin = !isAdmin;
			io.sockets.emit('player gone', player);
		});
		
		if(isAdmin){
			socket.on('start', function(){
				game.started = true;
			});
			
			socket.on('restart', function(){
				if(!game.started){
					return;
				}
			});
		}
	});
	
	res.redirect('/' + hash);
});

app.get('/:hash', function(req, res){
	var hash = req.params.hash;
	var game = games[hash];
	
	if(!game){
		return res.send('game not found');
	}
	
	if(game.started){
		return res.send('game already started');
	}
	
	res.render('game.html');
});*/
