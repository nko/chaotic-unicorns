var mongo = require('./lib/mongodb');

var random_hash = function() {
    hash = "";
    for(var n = 0; n < 16; n++) {
        var rand = Math.floor(Math.random()*62);
        
        // move it to nice ascii values
        rand += 48;
        if(rand > 57) {
            rand += 7;
        }
        if(rand > 90) {
            rand += 6;
        }
        
        hash += String.fromCharCode(rand);  
    }
    return hash;
}

var create_node = function(content) {
    return {content: content, subs: []};
}

exports.connect = function(cb) {
    var host = process.env['MONGO_NODE_DRIVER_HOST'] != null ?
        process.env['MONGO_NODE_DRIVER_HOST'] : 'localhost';
    var port = process.env['MONGO_NODE_DRIVER_PORT'] != null ?
        process.env['MONGO_NODE_DRIVER_PORT'] : mongo.Connection.DEFAULT_PORT;
    
    var client = new mongo.Db('node2', new mongo.Server(host, port, {}));
    
    client.open(function(err, client) {
        var con = {client: client};
        
        con.create_bubble = function(content, cb) {
            var bubble, mindmap, node;
            
            console.log("creating bubble")
            
            client.collection('bubbles', function(err, coll) {
                if(err) {
                    console.log(err);
                    console.log(err.stack)
                    cb(null);
                } else {
                    console.log("collection found");
                    
                    node = create_node(content);
                    mindmap = {content: content, subs: [node]};
                    bubble = {
                        hashes: [random_hash(), random_hash(), random_hash()],
                        content: content,
                        subs: [mindmap],
                        users: [],
                    };
                    
                    coll.insert(bubble, function(err, res) {
                        if(err) {
                            console.log(err);
                            cb(null);
                        } else {
                            console.log("bubble created");
                            cb(get_bubble(bubble.hashes[2]));
                        }
                    });
                }
            });
        }
        
        var get_bubble = con.get_bubble = function(hash) {
            var bubble = {hash: hash};
            
            var findOne = function(criteria, select, cb) {
                criteria.hashes = bubble.hash;
                
                console.log(criteria)
                
                client.collection('bubbles', function(err, coll) {
                    if(err) {
                        console.log(err);
                        console.log(err.stack)
                        cb(null);
                    } else {
                        var find_cb = function(err, res) {
                            if(err) {
                                console.log(err);
                                console.log(err.stack)
                                cb(null);
                            } else {
                                console.log("found: "+res)
                                cb(res);
                            }
                        }
                        
                        if(select === undefined) {
                            coll.findOne(criteria, find_cb);
                        } else {
                            coll.findOne(criteria, select, find_cb);
                        }
                    }
                });
            }
            
            var update = function(criteria, data, cb) {
                criteria.hashes = bubble.hash;
                
                client.collection('bubbles', function(err, coll) {
                    coll.update(criteria, data, function(err, res) {
                        if(err) {
                            console.log(err);
                            console.log(err.stack)
                            cb(null);
                        } else {
                            cb(res);
                        }
                    });
                });
            }
            
            bubble.get_tree = function(cb) {
                findOne({}, undefined, cb);
            }
            
            // TODO: db-interaction at creation
            bubble.create_user = function(name, color, cb) {
                var user = {name: name, color: color};
                
                user.rename = function(name, cb) {
                    update({'users.name': user.name},
                        {'$set': {"users.$.name": name}},
                        function() {
                            user.name = name;
                            if(cb !== undefined) {
                                cb();
                            }
                        }
                    );
                }
                
                user.set_color = function(color, cb) {
                    update({'users.name': user.name},
                        {'$set': {"users.$.color": color}},
                        function() {
                            user.color = color;
                            if(cb !== undefined) {
                                cb();
                            }
                        }
                    );
                }
                
                findOne({'users.name': name}, {'_id': 1}, function(res) {
                    if(res) {
                        console.log('updating user ...');
                        update({'users.name': name}, {'$set': {'users.$.color': color}}, function(res) {
                            cb(user);
                        });
                    } else {
                        console.log('creating user ...')
                        update({}, {'$push': {'users': {name: name, color: color}}}, function() {
                            cb(user);
                        })
                    }
                });
            }
            
            bubble.edit_node = function(position, content, cb) {
                var adress = "subs." + position.join('.subs.') + ".content";
                var diff = {};
                diff[adress] = content;
                update({}, {'$set': diff}, cb);
            }
            
            var add_node = bubble.add_node = function(position, content, cb) {
                var adress = "subs." + position.join('.subs.') + ".subs";
                var diff = {};
                diff[adress] = create_node(content);
                update({}, {'$push': diff}, cb);
            }
            
            var del_node = bubble.del_node = function(position, cb) {
                var adress = "subs." + position.join('.subs.');
                var diff = {};
                diff[adress] = 1;
                update({}, {'$unset': diff}, cb);
            }
            
            bubble.move_node = function(from, to, cb) {
                // TODO: untetested and not even close to atomic
                var adress = "subs." + position.join('.subs.');
                var filter = {};
                filter[adress] = 1;
                
                findOne({}, filter, function(res) {
                    del_node(from, function() {
                        add_node(to, res, function() {
                            cb(res);
                        });
                    });
                });
            }
            
            /*
            bubble.get_user = function(name, cb) {
                findOne({'users.name': name}, {'users.$': 1}, function(err, res) {
                    if(err) {
                        console.log(err);
                        cb(null);
                    } else {
                        cb(create_user(res));
                    }
                });
            }
            
            bubble.create_user = function(name, color, cb) {
                // TODO
                cb(null);
            }
            */
            
            return bubble;
        }
        
        con.close = function() {
            client.close();
        }
        
        cb(con);
    });
}
