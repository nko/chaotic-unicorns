$(document).ready(function(){
var holder_min_height = 0;

var initNode = function (_node) {
    var node = $(_node);
    var holder = node.find(".holder");
    var body = node.find(".body");
    var canvas = $("#canvas");
    node.css({left:canvas.offset().left + canvas.width() / 2, top:canvas.offset().top + canvas.height() / 2});
    initSpring(node);
    node.hover(
        function () {$(this).addClass("fixed");},
        function () {$(this).removeClass("fixed");}
    );
    holder_min_height = Math.max(holder_min_height, parseInt(holder.height()));
    var h = 10+holder.parent().find(".body").height();
    holder.width('20px');
    holder.animate({width:'-=15px', height:h}, 500);
    holder.hover(
        function () {
            var h = Math.max(holder_min_height,10+parseInt($(this).parent().find(".body").height()));
            $(this).animate({width:'+=15px', height:h}, 100, function () {
                $(this).css("overflow","visible");
            }).parent().animate({marginLeft:'-=15px',width:'+=15px'},100);},//handleIn
        function () {
            var h = 10+parseInt($(this).parent().find(".body").height());
            $(this).css("overflow","hidden");
            $(this).animate({width:'-=15px', height:h}, 100).
                parent().animate({marginLeft:'+=15px',width:'-=15px'},100);} //handleOut
    );
    node.css({height:Math.max(body.height(),holder.height())+5,
               width:holder.width()+body.width()+5,
               position:"absolute"
             });
};

$(".node").each(function (_, _node) {initNode(_node);});
updateCanvas();
setInterval("updateSprings(1/100)",100);

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
    a = []
    $.each(obj.slice(2).split('_'), function(cur,ele){
    a[cur]=parseInt(ele)
    })
    return a
  }
  
  // triggers
  var get_node_id = function(ele){
    return $(ele).parents('.node')[0].id  
  }
  
  // visual
  var fade_and_remove = function(id) {
    var current  = $('#' + id_for_html(id));
    current.fadeOut(90, function () {
      current.remove();
      updateCanvas();
    })
  }

// draggable
var draggable_options = {drag:updateCanvas}
$(".draggable").draggable( draggable_options );

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
draw_node = function(node, par_id){
    console.log(node, par_id)
    var html_id = id_for_html(par_id) + '_' + ($('.'+ id_for_html(par_id)).length )
    obj = $('#protonode').clone().
                  attr('id', html_id ).
                  addClass(id_for_html(par_id)).
                  //attr('relation', id_for_html(par_id)).
                  draggable(draggable_options).
                  appendTo('#nodes').fadeIn(100);
    initNode(obj);
    var par = $('#'+id_for_html(par_id));
    par.attr('relation',par.attr('relation')+','+html_id);
    obj.find('p').text( node.content || ' ' );
    if(node.subs) {
      $.each(node.subs, function(_,cur){
        draw_node(cur, id_for_json(html_id) )
      });
    }
}

var draw_all_nodes =  function(node){
  draw_node(node.subs[0].subs[0], [0]);
  $('#n_0_0').addClass("root");
}



var add_node =  function(content, to){
  socket.send(json_plz({
    add_node: {
      'content': content,
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
  var obj = $("#"+id);
  obj.width(obj.find(".body").width()+10+obj.find(".holder").width());
  obj.height(obj.find(".body").height()+5);
  socket.send(json_plz({
    edit_content: {'id': id_for_json(id), 'content': content,}
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

$('#change_color').live('click',function(){
  var color = 'blue' // ...
  change_color(color)
})

$('.add_node').live('click', function(){
  var to_id   = id_for_json( get_node_id(this) )
  var content = $(this).parent().find('p').text()
  add_node(content, to_id)
  return false
})

/*
$('.node').funclivetion(){ //TODO jquery hook
  var node_id = get_node_id(this)
  var to_id   = // ...
  move_node(node_id, content)
})
*/

$('.delete_node').live('click', function(){
  var node_id = id_for_json( get_node_id(this) )
  delete_node(node_id)
  return false
})

$('.edit_content').live('click', function(){
  var node_id = get_node_id(this)
  var content = '5'//...
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

var inplace_submit_and_restore_p = function(ele){
  edit_content( get_node_id(ele), $(ele).val() )
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
  inplace_submit_and_restore_p(this)
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
          draw_all_nodes(val.bubble)
        break;case 'name_changed':
          // .. 
        break;case 'color_changed':
          // .. 
        break;case 'node_added':
          draw_node({content: val.content, }, val.to)
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

//$('#colorpicker').ColorPicker()

// close (document ready)
});