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
            var bubble, session, user, rights = 0;
            
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
                    session.broadcast({left: {name: user.name}});
                }
            });
        
            client.on('message', function(msg) {
                console.log("incoming: " + msg);
                stanza = JSON.parse(msg);
                
                // enter a chat
                if(stanza.register) {
                    if(session) {
                        error("Already attached to a session");
                        return;
                    }
                    
                    // TODO: move bubble into session?
                    d = stanza.register
                    
                    // db-abstraction
                    bubble = dbc.get_bubble(d.hash);
                    bubble.create_user(d.name, d.color, function(res) {   
                        user = res;
                                         
                        // sending the tree
                        bubble.get_tree(function(tree) {
                            console.log("tree:");
                            console.log(tree);
                            
                            if(tree) {
                                for(var n = 0; n < tree.hashes.length; n++) {
                                    if(tree.hashes[n] == d.hash) {
                                        console.log("rights: " + n);
                                        rights = n;
                                    }
                                }
                                
                                tree.hashes = tree.hashes.slice(0, rights + 1);
                                
                                client.send(JSON.stringify({node_data: {bubble: tree}}));
                                
                                // session management
                                session = session_manager.get(d.hash);
                                session.broadcast({registered: {name: d.name, color: d.color}})
                                session.add_client(client);
                            } else {
                                // TODO: close connection?
                                error("Unknown Hash");
                            }
                        });
                    });
                // create a bubble
                } else if(stanza.create_bubble) {
                    dbc.create_bubble(stanza.create_bubble.name, function(bubble) {
                        client.send(JSON.stringify({
                            bubble_created: {hash: bubble.hash},
                        }));
                    });
                // change your color
                } else if(stanza.change_color) {
                    color = stanza.change_color.color;
                    user.set_color(color);
                    session.broadcast({color_changed: {color: color}});
                // change your name
                } else if(stanza.change_name) {
                    name = stanza.change_name.name;
                    user.set_name(name);
                    session.broadcast({name_changed: {name: name}});
                // write operations from here on
                } else if(rights > 0) {
                    if(stanza.add_node) {
                        if(session) {
                            d = stanza.add_node;
                            bubble.add_node(d.to, d.content, function() {
                                // tell your friends
                                session.broadcast(JSON.stringify({
                                  node_added:{
                                    content: d.content,
                                    to: d.to,
                                  }
                                }) );
                            });
                        } else {
                            error("No session");
                        }
                    } else if(stanza.move_node) {
                        if(session) {
                            d = stanza.move_node;
                            bubble.add_moved(d.id, d.to, function() {
                                // tell your friends
                                session.broadcast(JSON.stringify({
                                  node_added:{
                                    id: d.id,
                                    to: d.to,
                                  }
                                }) );
                            });
                        } else {
                            error("No session");
                        }
                    } else if(stanza.delete_node) {
                        if(session) {
                            bubble.del_node(stanza.delete_node, function() {
                                // tell your friends
                                session.broadcast(JSON.stringify({
                                  node_deleted:{
                                    id: stanza.delete_node.id,
                                  }
                                }) );
                            });
                        } else {
                            error("No session");
                        }
                    } else if(stanza.edit_content) {
                        if(session) {
                            d = stanza.edit_content;
                            bubble.edit_node(d.id, d.content, function() {
                                // tell your friends
                                session.broadcast(JSON.stringify({
                                  content_edited:{
                                    id: d.id,
                                    content: d.content,
                                  }
                                }) );
                            });
                        } else {
                            error("No session");
                        }
                    } else {
                        error("Unknown method");
                    }
                } else {
                    error("Not a read-only method");
                }
            });
        });
    }
});