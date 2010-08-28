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
  
  var id_for_html = function(arr){
    return 'n_' + arr.join('_')
  }
  
  var id_for_json = function(obj){
    return $.each( obj.slice(2).split('_'), function(ele){ parseInt(ele) })
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

initSprings();
updateCanvas();
setInterval("updateSprings(1/20)",20);

// draggable
var draggable_options = {drag:updateCanvas}
$(".draggable").draggable( draggable_options );

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
var register = function(name, color, hash){
  socket.send(json_plz({
    register: {
      'name': name,
      'color': color,
      'hash': hash,
    }
  }) )
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
var draw_all_nodes =  function(node){
//  add_node
}


var add_node =  function(to){
  socket.send(json_plz({
    add_node: {
      'content': '',
      'to': to,
    }
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
  var to_id = id_for_json( get_node_id(this) )
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
  var name = $(this).find('input[type=text]').val();
  create_bubble(name)
  return false
})

$('.node p').live('dblclick', function(){
  var parent = $(this).parent()
  $(this).replaceWith('<input type="text" class="in-place-edit" value="' + $(this).text() + '" />').focus()
  parent.find('input.in-place-edit').focus()
  
})

var inplace_restore_p = function(ele){
  $(ele).replaceWith('<p>' + $(ele).val() + '</p>')
}
$("input.in-place-edit").live('keypress', function (e) {
  if( e.which == 13 ){
    $(this).replaceWith('<p>' + $(this).val() + '</p>')
  }
  else if( e.which == 27 ){
    inplace_restore_p(this)
  }
})
$("input.in-place-edit").live('blur', function () {
  inplace_restore_p(this)
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
          //draw_all_nodes(val.root_node)
        break;case 'node_data':
          draw_all_nodes(val.root_node)
        break;case 'name_changed':
          // .. 
        break;case 'color_changed':
          // .. 
        break;case 'node_added':
          $('#protonode').clone().
                          appendTo('#nodes').
                          attr('id', id_for_html(val.to) + '_9').
                          attr('rel', id_for_html(val.to)).
                          draggable(draggable_options).
                          fadeIn(100)
        break;case 'node_moved':
          // .. 
        break;case 'node_deleted':
          fade_and_remove( val.id )
        break;case 'position_changed':
          // .. 
        break;case 'content_edited':
          // .. 
        break;case 'bubble_created':
          location.href = '/' + val.hash
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
register(initial_name, initial_color, location.pathname.slice(1)) // TODO hidden field

// close (document ready)
});
