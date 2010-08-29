var mongo = require('./lib/mongodb');

var random_hash = exports.random_hash = function() {
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

var create_node = exports.create_node = function(content, user) {
    return {content: content, user: user, subs: []};
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
                        users: {},
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
                        
                        coll.findOne(criteria, {fields: select}, find_cb);
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
                    diff = {}
                    diff["users."+user.id+".name"] = name
                    update({}, {'$set': diff}, function() {
                            user.name = name;
                            if(cb !== undefined) {
                                cb();
                            }
                        }
                    );
                }
                
                var set_color = user.set_color = function(color, cb) {
                    diff = {};
                    diff["users."+user.id+".color"] = color;
                    update({}, {"$set": diff}, function() {
                            user.color = color;
                            if(cb !== undefined) {
                                cb();
                            }
                        }
                    );
                }
                
                findOne({}, {'users': 1}, function(res) {
                    console.log("asmdsa")
                    console.log(res)
                    
                    if(!res) {
                        cb(null)
                        return;
                    }
                    
                    // ugly ...
                    users = res.users;
                    for(id in users) {
                        if(users.hasOwnProperty(id) && users[id].name === name) {
                            console.log("id found: " + id)
                            user.id = id;
                        }
                    }
                    
                    if(user.id === undefined) {
                        console.log('creating user ...');
                        user.id = Math.floor(Math.random()*65536);
                        diff = {};
                        diff["users."+user.id] = {name: name, color: color};
                        update({}, {'$set': diff}, function() {
                            console.log(res);
                            cb(user);
                        })
                    } else {
                        console.log('updating user ...');
                        set_color(color, function() {
                            cb(user);
                        });
                    }
                });
            }
            
            bubble.edit_node = function(position, content, cb) {
                var adress = "subs." + position.join('.subs.') + ".content";
                var diff = {};
                diff[adress] = content;
                update({}, {'$set': diff}, cb);
            }
            
            var add_node = bubble.add_node = function(position, content, user, cb) {
                var adress = "subs." + position.join('.subs.') + ".subs";
                var diff = {};
                diff[adress] = create_node(content, user);
                update({}, {'$push': diff}, cb);
            }
            
            var del_node = bubble.del_node = function(position, cb) {
                var filter = 1, a;
                for(var i = position.length - 2; i >= 0; i--) {
                    a = {};
                    a[position[i]] = filter;
                    filter = {subs: a}
                }
                
                console.log('filter:')
                console.log(filter)
                
                findOne({}, filter, function(res) {
                    if(err) {
                        console.log('fehloer')
                        console.log(err);
                    } else {
                        subs = res.subs;
                        subs.splice(position[position.length-1], 1);
                        
                        var adress = "subs." + position.slice(0, -1).join('.subs.') + ".subs";
                        var diff = {};
                        diff[adress] = subs;
                        
                        update({}, {'$set': diff}, cb);
                    }
                });
                
                /*
                var adress = "subs." + position.join('.subs.');
                var diff = {};
                diff[adress] = 1;
                update({}, {'$unset': diff}, cb);
                */
            }
            
            bubble.move_node = function(from, to, cb) {
                // TODO: untetested and not even close to atomic
                var adress = "subs." + position.join('.subs.');
                var filter = {};
                filter[adress] = 1;
                
                findOne({}, filter, function(res) {
                    del_node(from, function() {
                        add_node(to, res[position[position.lenth-1]], function() {
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
