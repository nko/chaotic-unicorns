/**
 * Module dependencies.
 */

require.paths.unshift(__dirname + '/lib');

var express = require('express'),
    connect = require('connect'),
    io = require('socket.io'),
    db = require('./db');

db.connect(function(dbc) {
    var app = module.exports = express.createServer();

    // Configuration

    app.configure(function(){
        app.set('views', __dirname + '/views');
        app.use(connect.bodyDecoder());
        app.use(connect.methodOverride());
        app.use(connect.compiler({ src: __dirname + '/public', enable: ['less'] }));
        app.use(app.router);
        app.use(connect.staticProvider(__dirname + '/public'));
    });

    app.configure('development', function(){
        app.use(connect.errorHandler({ dumpExceptions: true, showStack: true })); 
    });

    app.configure('production', function(){
       app.use(connect.errorHandler()); 
    });

    // Routes

    app.get('/', function(req, res){
        res.render('index.haml', {
            locals: {
                title: 'Node²'
            }
        });
    });

    // Only listen on $ node app.js

    if (!module.parent) {
        app.listen(parseInt(process.env.PORT) || 3000);
        console.log("server listening on port %d ...", app.address().port);
        
        ios = io.listen(app);
        
        ios.on('connection', function(client) {
            client.send('hello');
        });
    }
});