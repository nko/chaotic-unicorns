exports.session_manager = function() {
    // manages the bubble-sessions
    var manager = {sessions: {}};
    
    var remove_session = function(hash) {
        delete manager.sessions[hash];
        
        for(attr in manager.sessions) {
            if(manager.sessions.hasOwnProperty(attr)) {
                console.log(attr);
            }
        }
    }
    
    manager.get = function(hash) {
        if(manager.sessions[hash]) {
            return manager.sessions[hash];
        } else {
            return manager.sessions[hash] = function() {
                // represents an ongoing bubble session
                var session = {
                    participants: {},
                    alive: true,
                };
                
                var orphaned = function() {
                    var participants = session.participants;
                    
                    for(attr in participants) {
                        if(participants.hasOwnProperty(attr)) {
                            return false;
                        }
                    }
                    
                    return true;
                }
                
                session.add_client = function(client) {
                    session.participants[client.sessionId] = client;
                }
                
                session.remove_client = function(client) {
                    delete session.participants[client.sessionId];
                    
                    if(orphaned()) {
                        console.log("session died of loneliness")
                        remove_session(hash);
                    }
                }
                
                var broadcast = session.broadcast = function(msg) {
                    var participants = session.participants;
                    
                    for(attr in participants) {
                        if(participants.hasOwnProperty(attr)) {
                            participants[attr].send(msg);
                        }
                    }
                }
                
                session.destroy = function() {
                    broadcast(JSON.stringify({destroy: true}));
                    session.alive = false;
                    console.log("getting attacked by aliens");
                    console.log(new Error().stack)
                }
                
                return session;
            }();
        }
    }
    
    return manager;
}
