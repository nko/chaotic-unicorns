var mongo = require('./lib/mongodb');

exports.connect = function(cb) {
    var host = process.env['MONGO_NODE_DRIVER_HOST'] != null ?
        process.env['MONGO_NODE_DRIVER_HOST'] : 'localhost';
    var port = process.env['MONGO_NODE_DRIVER_PORT'] != null ?
        process.env['MONGO_NODE_DRIVER_PORT'] : mongo.Connection.DEFAULT_PORT;
    
    var client = new mongo.Db('node2', new mongo.Server(host, port, {}));
    
    client.open(function(err, client) {
        var con = {client: client};
        
        con.close = function() {
            client.close();
        }
        
        cb(con);
    });
}
