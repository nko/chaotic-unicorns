$(document).ready(function(){
$(".holder").animate({width:'-=15px'}, 500);

// firefox workaround
if(typeof(console) == 'undefined') console = {log: function () {}};

// draggable
$(".draggable").draggable();

$(".holder").hover(
    function () {$(this).animate({width:'+=15px'}, 100);},//handleIn
    function () { $(this).animate({width:'-=15px'}, 100);} //handleOut
);

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
