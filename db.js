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

exports.connect = function(cb) {
    var host = process.env['MONGO_NODE_DRIVER_HOST'] != null ?
        process.env['MONGO_NODE_DRIVER_HOST'] : 'localhost';
    var port = process.env['MONGO_NODE_DRIVER_PORT'] != null ?
        process.env['MONGO_NODE_DRIVER_PORT'] : mongo.Connection.DEFAULT_PORT;
    
    var client = new mongo.Db('node2', new mongo.Server(host, port, {}));
    
    client.open(function(err, client) {
        var con = {client: client};
        
        con.create_bubble = function(content, cb) {
            var bubble;
            
            console.log("creating bubble")
            
            client.collection('bubbles', function(err, coll) {
                if(err) {
                    console.log(err);
                    cb(null);
                } else {
                    console.log("collection found");
                    bubble = {id: random_hash(), content: content, subs: [], users: []};
                    coll.insert(bubble, function(err, res) {
                        if(err) {
                            console.log(err);
                            cb(null);
                        } else {
                            console.log("bubble created");
                            cb(get_bubble(bubble.id));
                        }
                    });
                }
            });
        }
        
        var get_bubble = con.get_bubble = function(id) {
            var bubble = {id: id};
            
            var findOne = function(criteria, select, cb) {
                criteria.id = id;
                client.collection('bubbles', function(err, coll) {
                    coll.findOne(criteria, select, function(err, res) {
                        if(err) {
                            console.log(err);
                            cb(null);
                        } else {
                            cb(res);
                        }
                    });
                });
            }
            
            var update = function(criteria, data, cb) {
                client.collection('bubbles', function(err, coll) {
                    coll.update(criteria, data, function(err, res) {
                        if(err) {
                            console.log(err);
                            cb(null);
                        } else {
                            cb(res);
                        }
                    });
                });
            }
            
            var create_user = function(data) {
                var user = {data: data};
                
                user.rename = function(name, cb) {
                    update({'id': data.id, 'users.name': data.name},
                        {'$set': {"users.$.name": name}},
                        function() {
                            data.name = name;
                            if(cb !== undefined) {
                                cb();
                            }
                        }
                    );
                }
                
                user.set_color = function(color, cb) {
                    update({'id': data.id, 'users.name': data.name},
                        {'$set': {"users.$.color": color}},
                        function() {
                            data.color = color;
                            if(cb !== undefined) {
                                cb();
                            }
                        }
                    );
                }
                
                return user;
            }
            
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
            
            return bubble;
        }
        
        con.close = function() {
            client.close();
        }
        
        cb(con);
    });
}
