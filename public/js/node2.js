$(document).ready(function(){
$(".holder").animate({width:'-=15px'}, 500);


// helpers
  // firefox workaround
  if(typeof(console) == 'undefined') console = {log: function () {}};
  
  // json
  var json_plz = function(obj){
    return JSON.stringify(obj)
  }

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

// messages to server
  // user management
var register = function(name, color){

}

var change_name = function(name){
  socket.send(json_plz({
    change_name: name
  }) )
}

var change_color = function(color){

}

  // changing tree structure
var add_node =  function(to){
}

var move_node = function(id, to){
}

var delete_node = function(id){
}

  // changing properties
var edit_content = function(id, content){
}

var change_position = function(id, $DODO){
}

// triggers

/* register: at init */
var initial_name = 'chaot' // ...
var initial_color = 'red' // ...
register(initial_name, initial_color)

$('#change_name_form').submit(function(){
  var name = 'unicorn' // ...
  change_name(name)
  return false
})

$('#change_color').click(function(){
  var color = 'blue' // ...
  change_color(color)
})

$('#add_node').click(function(){
  var to_id = 0 // ...
  add_node(to_id)
})

/*
$('.node').function(){ //TODO jquery hook
  var node_id = get_node_id(this)
  var to_id   = // ...
  move_node(node_id, content)
})
*/

$('#delete_node').click(function(){
  var node_id = get_node_id(this)
  delete_node(node_id)
})


$('#edit_content').click(function(){
  var node_id = get_node_id(this)
  var content = //...
  edit_content(node_id, content)
})

/*
$('.node').function(){ //TODO jquery hook
  var node_id = get_node_id(this)
  var $DODOs = //...
  change_position(node_id, content)
})
*/

// close (document ready)
});
