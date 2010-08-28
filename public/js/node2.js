$(document).ready(function(){

$(".holder").animate({width:'-=15px'}, 500);

// helpers
  // firefox workaround
  if(typeof(console) == 'undefined') console = {log: function () {}};

  // less debug typing
  var clog = function(str){ console.log(str) }
  
  
  // json
  var json_plz = function(obj){
    return JSON.stringify(obj)
  }
  // triggers
  var get_node_id = function(ele){
    return $(ele).parents('.node')[0].id  
  }
  
  // visual
  var fade_and_remove = function(id) {
    var current  = $('#' + id);
    current.fadeOut(90, function () {
      current.remove();
      updateCanvas();
    })
  }

updateCanvas();

// draggable
$(".draggable").draggable({drag:updateCanvas});

$(".holder").hover(
    function () {$(this).animate({width:'+=15px'}, 100).parent().animate({marginLeft:'-=15px'},100);},//handleIn
    function () { $(this).animate({width:'-=15px'}, 100).parent().animate({marginLeft:'+=15px'},100);} //handleOut
);


// init part 1
  // create socket
  var socket = new io.Socket(location.hostname, {
    transports: ['websocket', 'xhr-polling', 'xhr-multipart', 'server-events', 'htmlfile', 'flashsocket']
  });
  
  socket.on('connect', function() {
    console.log('socket connected');
  });

// messages to server
  // user management
var register = function(name, color){

}

var change_name = function(name){
  socket.send(json_plz({
    change_name: {'name': name,}
  }) )
}

var change_color = function(color){
  socket.send(json_plz({
    change_color: {'color': color,}
  }) )
}

  // changing tree structure
var add_node =  function(to){
  socket.send(json_plz({
    add_node: {'to': to,}
  }) )
}

var move_node = function(id, to){
  socket.send(json_plz({
    move_node: {'id': id, 'to': to,}
  }) )
}

var delete_node = function(id){
  socket.send(json_plz({
    delete_node: {'id': id,}
  }) )
}

  // changing properties
var edit_content = function(id, content){
  socket.send(json_plz({
    edit_content: {'id': id, 'content': content,}
  }) )
}

var change_position = function(id, $DODO){
  socket.send(json_plz({
    edit_content: {'id': id, '$DODO': $DODO,}
  }) )
}

// bubble management

var create_bubble = function(name){
  socket.send(json_plz({
    create_bubble: {'name': name,}
  }) )
}

// triggers

$('#change_name_form').submit(function(){
  var name = 'unicorn' // ...
  change_name(name)
  return false
})

$('#change_color').click(function(){
  var color = 'blue' // ...
  change_color(color)
})

$('.add_node').click(function(){
  var to_id = 0 // ...
  add_node(to_id)
  return false
})

/*
$('.node').function(){ //TODO jquery hook
  var node_id = get_node_id(this)
  var to_id   = // ...
  move_node(node_id, content)
})
*/

$('.delete_node').click(function(){
  var node_id = get_node_id(this)
  delete_node(node_id)
  return false
})

$('.edit_content').click(function(){
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

$('#create_bubble_form').submit(function(){
  var name = 'unicorn\'s bubble' // ...
  create_bubble(name)
  return false
})


// signals

// socket test code ...
socket.on('message', function(msg) {
  console.log('message incoming: ' + msg);
  msg = JSON.parse( msg )
  
  for ( prop in  msg){
    if (typeof msg[prop] !== 'function'){ // enum only props
      val = msg[prop]
      switch(prop){
        case 'debug':
          console.log('_debug: ' + val.msg)
        break;case 'error':
          console.log('ERROR: ' + val.msg)
        break;case 'registered':
          // .. val.rootnode
        break;case 'name_changed':
          // .. 
        break;case 'color_changed':
          // .. 
        break;case 'node_added':
          // .. 
        break;case 'node_moved':
          // .. 
        break;case 'node_deleted':
          fade_and_remove( val.id )
        break;case 'position_changed':
          // .. 
        break;case 'content_edited':
          // .. 
        break;default:
          // .. 
        break;
      }
    }
  }
});


// init part 2
socket.connect();

var initial_name = 'chaot' // ...
var initial_color = 'red' // ...
register(initial_name, initial_color)


// close (document ready)
});