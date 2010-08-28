/**
 * Module dependencies.
 */

require.paths.unshift(__dirname + '/lib');

var express = require('express'),
    connect = require('connect'),
    io = require('socket.io'),
    session = require('./session'),
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

    app.get('/:hash', function(req, res){
        hash = req.params.hash;
        res.render('index.haml', {
            locals: {
                title: 'Node²',
                hash: hash,
            }
        });
    });
    




    // Only listen on $ node app.js

    if (!module.parent) {
        app.listen(parseInt(process.env.PORT) || 3000);
        console.log("server listening on port %d ...", app.address().port);
        
        ios = io.listen(app);
        
        var session_manager = session.session_manager();
        
        ios.on('connection', function(client) {
            var bubble, session;
            
            var error = function(msg) {
                client.send(JSON.stringify({err: {msg: msg}}));
            }
            
            client.send(JSON.stringify({
                debug: {msg: 'hello world'}
            }) );
            
            client.on('disconnect', function() {
                console.log('bye client')
                if(session) {
                    session.remove_client(client);
                }
            });
        
            client.on('message', function(msg) {
                console.log("incoming: " + msg);
                stanza = JSON.parse(msg);
                
                if(stanza.register) {
                    // TODO: color and name
                    session = session_manager.get(stanza.register.hash);
                    session.add_client(client);
                } else if(stanza.create_bubble) {
                    dbc.create_bubble(stanza.create_bubble.name, function(bubble) {
                        client.send(JSON.stringify({
                            bubble_created: {hash: bubble.hash}
                        }));
                    });
                } else if(stanza.add_node) {
                    if(session) {
                        // TODO: fake?
                        session.broadcast(JSON.stringify({
                          node_added:{
                            id: stanza.add_node.id,
                            to: stanza.add_node.to,
                          }
                        }) );
                    } else {
                        error("No session");
                    }
                } else if(stanza.delete_node) {
                    if(session) {
                        // TODO: fake!
                        session.broadcast(JSON.stringify({
                          node_deleted: {id: stanza.delete_node.id }
                        }) );
                    } else {
                        error("No session");
                    }
                } else {
                    error("Unknown method");
                }
            });
        });
    }
});