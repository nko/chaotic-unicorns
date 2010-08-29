var mongo = require('./lib/mongodb'),
    db = require('./db');

var host = process.env['MONGO_NODE_DRIVER_HOST'] != null ?
    process.env['MONGO_NODE_DRIVER_HOST'] : 'localhost';
var port = process.env['MONGO_NODE_DRIVER_PORT'] != null ?
    process.env['MONGO_NODE_DRIVER_PORT'] : mongo.Connection.DEFAULT_PORT;

var client = new mongo.Db('node2', new mongo.Server(host, port, {}));
client.open(function() {
    client.collection('bubbles', function(err, coll) {
        var map = db.create_node('Welcome');
        map.subs.push(root);

        var root = db.create_node('Welcome');
        map.subs.push(root);

        var mind = db.create_node('Mind Maps');
        mind.subs.push(db.create_node('Develope ideas'));
        mind.subs.push(db.create_node('Be creative'));
        root.subs.push(mind);

        var pers = db.create_node('Persistency');
        pers.subs.push(db.create_node('Continue on another PC'));
        pers.subs.push(db.create_node('Create todo lists'));
        pers.subs.push(db.create_node('Make notes'));
        root.subs.push(pers);

        var co = db.create_node('Collaboration');
        co.subs.push(db.create_node('Invite friends'));
        co.subs.push(db.create_node('Read only access included'));
        root.subs.push(co);
        
        var start_tree = {
            content:    'Welcome',
            hashes:     ['', db.random_hash() + db.random_hash()],
            users:      {},
            subs:       [map],
        };

        console.log(start_tree);

        coll.update({'hashes': ''}, start_tree, {upsert: 1}, function(err, res) {
            if(err) {
                console.log(err);
            } else {
                console.log("Done.");
            }

            client.close();
        });
    });
});

