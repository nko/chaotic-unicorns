$(document).ready(function(){

// firefox workaround
if(typeof(console) == 'undefined') console = {log: function () {}};

// draggable
$(".draggable").draggable();

// socket test code ...
var socket = new io.Socket(location.hostname, {
    transports: ['websocket', 'xhr-polling', 'xhr-multipart', 'server-events', 'htmlfile', 'flashsocket']
});
socket.on('connect', function() {
    console.log('socket connected');
});
socket.on('message', function(msg) {
    console.log('message incoming: ' + msg);
});
socket.connect();

// close
});