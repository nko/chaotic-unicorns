$(document).ready(function(){

//do dodo
var holder_min_height = 0;

var initNode = function (_node) {
    var node = $(_node);
    var holder = node.find(".holder");
    var body = node.find(".body");
    var canvas = $("#canvas");
    node.css({left:canvas.offset().left + canvas.width() / 2, top:canvas.offset().top + canvas.height() / 2});
    //node.css({left:canvas.width() / 2, top:canvas.height() / 2});
    node.hover(
        function () {$(this).addClass("fixed");},
        function () {$(this).removeClass("fixed");}
    );
    holder_min_height = Math.max(holder_min_height, parseInt(holder.height()));
    var h = 10+holder.parent().find(".body").height();
    holder.width('20px');
    holder.animate({width:'-=15px', height:h}, 100, function () {$(this).find(".button").css("visibility","hidden");});
    holder.hover(
        function () {
            var h = Math.max(holder_min_height,10+parseInt($(this).parent().find(".body").height()));
            $(this).find(".button").css("visibility","visible");
            $(this).animate({width:'+=15px', height:h}, 50, function () {
                $(this).css("overflow","visible");
            }).parent().animate({left:'-=15px',width:'+=16px'},50);},//handleIn
        function () {
            var h = 10+parseInt($(this).parent().find(".body").height());
            $(this).css("overflow","hidden");
            $(this).animate({width:'-=15px', height:h}, 50, function () {
                $(this).find(".button").css("visibility","hidden");
            }).parent().animate({left:'+=15px',width:'-=16px'},50);} //handleOut
    );
    node.css({height:Math.max(body.height(),holder_min_height)+10,
               width:holder.width()+body.width()+10,
               position:"absolute"
             });
};

$(".node").each(function (_, _node) {initNode(_node);});
//updateCanvas();
setTimeout("springsPhysics.generate().pre_render(10,23)",3000);
//setInterval("springsPhysics.generate().pre_render(100,23)",100);
setInterval("springsPhysics.generate().static()",20);


//cookies
var initial_name  = $.cookie('name')
var initial_color = $.cookie('color')

if( !initial_name ){ initial_name = 'unknown' } // TODO overlay
if( !initial_name ){ initial_color = 'black' }

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
      //updateCanvas();
    })
  }

// draggable
var draggable_options = {
    stop: function () { springsPhysics.generate().pre_render(10,23,2000); }
  //drag:updateCanvas
}
var droppable_options = {
    drop: function(_, ui){
      move_node(this.id, ui.draggable[0].id)
	}
}
$(".draggable").draggable( draggable_options );
$(".draggable").droppable( droppable_options );



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
  $.cookie['name'] = name
  socket.send(json_plz({
    change_name: {
      'name': name
    }
  }) )
}

var change_color = function(color){
  $.cookie['color'] = name
  socket.send(json_plz({
    change_color: {
      'color': color
    }
  }) )
}

// changing tree structure
draw_node = function(node, par_id){
    console.log(node, par_id)
    var html_id = id_for_html(par_id) + '_' + ($('.'+ id_for_html(par_id)).length )
    obj = $('#protonode').clone().
                  attr('id', html_id ).
                  addClass(id_for_html(par_id)).
                  addClass('user_' + node.user).
                  //attr('relation', id_for_html(par_id)).
                  draggable(draggable_options).
                  droppable( droppable_options ).
                  appendTo('#nodes').fadeIn(100);
    obj.find('p').text( node.content || ' ' );
    console.log($('#user_' + node.user).length)
    $('.user_' + node.user).find('.holder').css('background', $('#user_' + node.user).css('color'));
    var par = $('#'+id_for_html(par_id));
    par.attr('relation',par.attr('relation')+','+html_id);
    initNode(obj);
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

var delete_with_children = function(current){
    $.each(current.attr("relation").split(","),function (_,relation) {
        if(relation != "") {
            var target = $("#"+relation);
            if(target.length) {
               delete_with_children(target)
               fade_and_remove( $(this)[0].id )
            }
        }
    });
}


//...
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
  obj.height(obj.find(".body").height()+10);
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

var append_user = function(id, cur){
  $('ul#user_list').append('<li id="user_' + id + '" style="color:' + cur.color + '">' + cur.name + '</li>')
}

// triggers

$('#change_name_form').submit(function(){
  var name = $(this).find('input[type=text]').val()
  var color = $(this).find('#colorpicker div').css('backgroundColor')
  change_name(name)
  change_color(color)
  return false
})


$('.add_node').live('click', function(){
  var to_id   = id_for_json( get_node_id(this) )
  var content = $(this).parent().find('p').text()
  add_node(content, to_id)
  return false
})

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
  console.log('message incoming: ', msg);
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
          append_user(val.id, val)
        break;case 'left':
          fade_and_remove( $('#user_' + val.id) )
        break;case 'node_data':
          draw_all_nodes(val.bubble)
          for (cur in val.bubble.users){
            append_user(cur, val.bubble.users[cur])
          }
        break;case 'name_changed':
          $('#user_' + val.id).text( val.name )
        break;case 'color_changed':
          $('#user_' + val.id).css('color', val.color)
          $('.user_' + val.id).find('.holder').css('background', val.color);//.css('border', '1px solid ' + val.color)
        break;case 'node_added':
          draw_node(val, val.to)
        break;case 'node_moved':
          // .. 
        break;case 'node_deleted':
        console.log( $('#'+id_for_html).find('.node') )
        delete_with_children( $('#'+id_for_html) );
        break;case 'position_changed':
          // .. 
        break;case 'content_edited':
          $('#' + id_for_html(val.id) + ' p').text(val.content)
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

register(initial_name, initial_color, location.pathname.slice(1)) // TODO hidden field

$('#colorpicker').ColorPicker({
	color: '#0000ff',
	onShow: function (colpkr) {
		$(colpkr).fadeIn(500);
		return false;
	},
	onHide: function (colpkr) {
		$(colpkr).fadeOut(500);
		return false;
	},
	onChange: function (hsb, hex, rgb) {
		$('#colorpicker div').css('backgroundColor', '#' + hex);
	}
})

// close (document ready)
});