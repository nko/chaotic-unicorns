exports.session_manager = function() {
    // manages the bubble-sessions
    var manager = {sessions: {}};
    
    manager.get = function(hash) {
        if(manager.sessions[hash]) {
            return manager.sessions[hash];
        } else {
            return manager.sessions[hash] = function() {
                // represents an ongoing bubble session
                var session = {
                    participants: {},
                };
                
                var orphaned = function() {
                    var participants = session.participants;
                    
                    for(attr in participants) {
                        if(participant.hasOwnProperty(attr)) {
                            return false;
                        }
                    }
                    
                    return true;
                }
                
                session.add_client = function(client) {
                    session.participants[client.sessionId] = client;
                }
                
                session.remove_client = function(client) {
                    session.participants[client.sessionId] = undefined;
                    
                    if(orphaned()) {
                        console.log("session died of loneliness")
                        manager.remove(session);
                    }
                }
                
                session.broadcast = function(msg) {
                    var participants = session.participants;
                    
                    for(attr in participants) {
                        if(participants.hasOwnProperty(attr)) {
                            participants[attr].send(msg);
                        }
                    }
                }
                
                return session;
            }();
        }
    }
    
    return manager;
}
