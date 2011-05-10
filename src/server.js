var express = require('express');
var app = express.createServer();
var io = require('socket.io-node').listen(app);

var games = {};

app.configure(function(){
	app.use(express.static(__dirname + '/js'));
	app.use(express.static(__dirname + '../node_modules/socket.io-node/lib/client'));
	app.set('views', __dirname);
	app.set('view options', { layout: false });
	app.set('view engine', 'mustache');
	app.register('.html', require('stache'));
});
app.listen(8080);

app.get('/', function(req, res){
	res.render('index.html');
});

app.get('/new', function(req, res){
	var hash = (+new Date).toString(36);
	var game = games[hash] = {};
	
	io.for('/' + hash).on('connection', function(socket){
		
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
