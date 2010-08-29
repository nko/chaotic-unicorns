/**
 * Module dependencies.
 */

require.paths.unshift(__dirname + '/lib');

var express = require('express'),
    connect = require('connect'),
    io = require('socket.io'),
    session = require('./session'),
    db = require('./db');

var error_catcher = function(error) {
    console.log("EXCEPION");
    console.log(e);
}

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
                title: 'Node²',
                hash: '',
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
                    session.broadcast(JSON.stringify({left: {name: user.name}}));
                }
            });
            
            client.on('error', error_catcher)
        
            client.on('message', function(msg) {
                try {
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
                                
                                // send the info
                                tree.hashes = tree.hashes.slice(0, rights + 1);
                                client.send(JSON.stringify({node_data: {bubble: tree}}));
                                
                                if(rights > 0) {
                                    bubble.create_user(d.name, d.color, function(res) {
                                        user = res;
                                        
                                        // user/session management
                                        session = session_manager.get(d.hash);
                                        session.broadcast({registered: {name: d.name, color: d.color}})
                                        session.add_client(client);
                                    });
                                }
                            } else {
                                // TODO: close connection?
                                error("Unknown Hash");
                            }
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
                        if(session) {
                            color = stanza.change_color.color;
                            user.set_color(color);
                            session.broadcast(JSON.stringify({color_changed:{
                              id:    user.id,
                              color: color
                            }}));
                        } else {
                            error("No write permissions");
                        }
                    // change your name
                    } else if(stanza.change_name) {
                        if(session) {
                            name = stanza.change_name.name;
                            user.rename(name);
                            session.broadcast(JSON.stringify({name_changed: {
                              id:   user.id,
                              name: name,
                            }}));
                        } else {
                            error("No write permissions");
                        }
                    // add a node
                    } else if(stanza.add_node) {
                        if(session) {
                            d = stanza.add_node;
                            bubble.add_node(d.to, d.content, user.id, function() {
                                // tell your friends
                                session.broadcast(JSON.stringify({
                                  node_added:{
                                    content: d.content,
                                    to: d.to,
                                    user: user.id,
                                  }
                                }) );
                            });
                        } else {
                            error("No write permissions");
                        }
                    // move a node
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
                            error("No write permissions");
                        }
                    // delete a node
                    } else if(stanza.delete_node) {
                        if(session) {
                            bubble.del_node(stanza.delete_node.id, function() {
                                // tell your friends
                                session.broadcast(JSON.stringify({
                                  node_deleted:{
                                    id: stanza.delete_node.id,
                                  }
                                }) );
                            });
                        } else {
                            error("No write permissions");
                        }
                    // edit a node
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
                            error("No write permissions");
                        }
                    } else {
                        error("Unknown method");
                    }
                }
                catch(e)
                {
                    console.log("EXCEPION");
                    console.log(e);
                }
            });
        });
    }
});