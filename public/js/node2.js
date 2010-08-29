
$(document).ready(function(){

//do dodo
var holder_min_height = 0;
var READONLY = false
var springs_physics = springsPhysics.generate()
    springs_physics.static();

var ani_man = springs_physics.ani_manager(42, 50);
//ani_man.start();

var initNode = function (_node) {
    var node = $(_node);
    var holder = node.find(".holder");
    var body = node.find(".body");
    var canvas = $("#canvas");
    var left, top;
    
    // nice initial position
    var par = $('#'+node[0].id.slice(0, -2));
    if(par && par.length) {
        childs = $('.'+node[0].id.slice(0, -2)).length;
        a = childs % 4;
        left = par.offset().left + (childs%2) + 1/(a+1) - 1.5;
        top = par.offset().top + (childs/2)%2 - 0.5;
    } else {
        left = canvas.offset().left + canvas.width() / 2;
        top = canvas.offset().top + canvas.height() / 2;
    }
    
    /*
    left = canvas.offset().left + canvas.width() / 2;
    top = canvas.offset().top + canvas.height() / 2;
    */
    
    node.css({left: left, top: top});
    //node.css({left:canvas.width() / 2, top:canvas.height() / 2});
    node.hover(
        function () {$(this).addClass("fixed");},
        function () {$(this).removeClass("fixed");}
    );
    holder_min_height = Math.max(holder_min_height, parseInt(holder.height()));
    var h = 13+parseInt(holder.parent().find(".body").height());
    holder.width('20px');
    holder.animate({width:'-=15px', height:h}, 100, function () {
        $(this).find(".button").css("visibility","hidden");
    }).parent().animate({height:h},100);
    holder.hover(
        function () {
            var h = Math.max(holder_min_height,13+parseInt($(this).parent().find(".body").height()));
            $(this).find(".button").css("visibility","visible");
            $(this).animate({width:'+=15px', height:h}, 50, function () {
                $(this).css("overflow","visible");
            }).parent().animate({left:'-=15px',width:'+=16px',height:h},50);},//handleIn
        function () {
            var h = 13+parseInt($(this).parent().find(".body").height());
            $(this).css("overflow","hidden");
            $(this).animate({width:'-=15px', height:h}, 50, function () {
                $(this).find(".button").css("visibility","hidden");
            }).parent().animate({left:'+=15px',width:'-=20px',height:h},50);} //handleOut
    );
    node.css({height:Math.max(body.height(),holder_min_height)+1,
               width:holder.width()+body.width()+23,
               position:"absolute"
             });
};

$(".node").each(function (_, _node) {initNode(_node);});
//setTimeout("springsPhysics.generate().pre_render(10,23)",3000);
//setInterval("springsPhysics.generate().pre_render(100,23)",100);
//setInterval("springs_physics.static()",42);


//cookies
var initial_name  = $.cookie('name')
var initial_color = $.cookie('color')
if( !initial_name ){ initial_name = 'unknown' } // TODO overlay
if( !initial_name ){ initial_color = 'black' }

$('#change_name').val( initial_name )

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
  
  // overlayss
  var error_msg = function(text){
    if(!text){
      text = '!!!'
    }
    $('#error').text( 'Error: ' + text )
    $( "#error" ).dialog(
    {
//        modal:true,
//        'position': [3,3],
        buttons:
        {
          "Ok": function() { $(this).dialog("close"); },
        }
     });
   //$( "#error" ).dialog( "option", "buttons" );
  }
  // triggers
  var get_node_id = function(ele){
    return $(ele).parents('.node')[0].id  
  }
  
  // visual
  var fade_and_remove = function(html_id) {
    var current  = $('#' + html_id);
    current.fadeOut(90, function () {
      current.remove();
      //updateCanvas();
    })
  }

// draggable
var draggable_options = {
    stop: function () {
        springs_physics.update($(this)[0].id);
        //springs_physics.live_render(10, 42, 500);
        ani_man.animate(500);
    },
    drag: function () {
        springs_physics.update($(this)[0].id);
        springs_physics.static();
    }
}
var droppable_options = {
    drop: function(_, ui){
      move_node(this.id, ui.draggable[0].id)
	}
}
$(".draggable").draggable( draggable_options );
$(".draggable").droppable( droppable_options );
$(window).resize(function () {
    springs_physics.static();
});


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
  $.cookie('name', name)
  socket.send(json_plz({
    change_name: {
      'name': name
    }
  }) )
}

var change_color = function(color){
  $.cookie('color', color)
  socket.send(json_plz({
    change_color: {
      'color': color
    }
  }) )
}

// changing tree structure
draw_node = function(node, par_id){
  if(node) {
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
    console.log( $('#user_' + node.user).length )
    $('.user_' + node.user).find('.holder').css('background', $('#user_' + node.user).css('color'));
    var par = $('#'+id_for_html(par_id));
    par.attr('relation',par.attr('relation')+','+html_id);
    initNode(obj, par);
    springs_physics.add(html_id, id_for_html(par_id));
    if(node.subs) {
      $.each(node.subs, function(_,cur){
        draw_node(cur, id_for_json(html_id) )
      });
    }
  }
}

var draw_all_nodes = function(node) {
    draw_node(node.subs[0].subs[0], [0]);
    $('#n_0_0').addClass("root");
    ani_man.animate(1000, 2);
};

var delete_with_children = function(current){
console.log('DEL')
console.log($(current))

    var children = ''
    if( $(current).attr('relation') && $(current).attr('relation').length ){
      children = $(current).attr("relation")
    }
    clog(4444444)
    console.log(children)
    $.each(children.split(","),function (_,relation) {
    console.log(relation)
        if(relation != "") {
            var target = $("#"+relation);
            clog('t')
            clog(target)
            if(target.length) {
            console.log('BBBBBBBBBBBBBBB')
               delete_with_children(target)
            }
        }
    });
    clog('REM')
    $(current).remove()
//    fade_and_remove( $(current)[0].id )
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

var create_bubble = function(bubble_name, name, color){
  socket.send(json_plz({
    create_bubble: {
      'bubble_name': bubble_name,
      'user_name': name,
      'user_color': color,
    }
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
  create_bubble(name,  $.cookie('name'),  $.cookie('color'))
  return false
})

var edit_node_action = function (obj) {
    var parent = obj.parent();
    obj.replaceWith('<input type="text" class="in-place-edit" value="' + obj.text() + '" />').focus();
    parent.find('input.in-place-edit').focus();
};

if(!READONLY){
    $('.node p').live('dblclick', function(){edit_node_action($(this));});
    $('.edit.button').live('click',function(){edit_node_action($(this).parents(".node").find("p"));});
}

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
        break;case 'err':
          error_msg(val.msg)
        break;case 'registered':
          append_user(val.id, val) 
        break;case 'left':
          fade_and_remove( $('#user_' + html_for_id(val.id)) )
        break;case 'node_data':
          $('#bubble').text( val.bubble.content )
          // build hash string
          console.log(val.bubble)
                    console.log(val.bubble.hashes.length)
          
          if( val.bubble.hasOwnProperty('hashes') ){
              hash_string = ''
              if( val.bubble.hashes.length == 3 ){
                hash_string = hash_string.concat( '<a href="' + location.host + '/' + val.bubble.hashes[0] + '">admin version</a>' )
              }
              
              if( val.bubble.hashes.length >= 2 ){
                hash_string = hash_string.concat( '<a href="' + location.host + '/' + (val.bubble.hashes[val.bubble.hashes.length - 2]) + '">read-only version</a>')
              }
              hash_string = hash_string.concat( '<a href="' + location.host + '/' + val.bubble.hashes[val.bubble.hashes.length - 1] + '">read-only version</a>')
              
              if( val.bubble.hashes.length == 0 ){
                READONLY = true
              }
          }
          console.log('hs' + hash_string)
          $('#hashes').html( hash_string )
          // draw
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
          ani_man.animate(1500, 3);
          
          //Width fix
          var obj = $("#"+val.id);
          obj.width(obj.find(".body").width()+33+obj.find(".holder").width());
          obj.height(obj.find(".body").height()+13);

        break;case 'node_moved':
          // .. 
        break;case 'node_deleted':
            jq_delete = $('#'+id_for_html(val.id))
            springs_physics.remove( jq_delete[0].ida );
            delete_with_children( jq_delete );
        break;case 'position_changed':
          // .. 
        break;case 'content_edited':
          $('#' + id_for_html(val.id) + ' p').text(val.content);
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

register(initial_name, initial_color, location.pathname.slice(1))
//set_color(initial_color) // be lazy, don't solve bugs ;)
/*
var submit_color = function(colpkr){
  $(colpkr).fadeOut(500);
  $('#colorpicker div').css('backgroundColor', '#' + hex);
  return false
}*/

$('#colorpicker').ColorPicker({
	color: '#000000',
	onShow: function (colpkr) {
		$(colpkr).fadeIn(500);
		return false;
	},
//	onChange: function (hsb, hex, rgb) {
//		$('#colorpicker div').css('backgroundColor', '#' + hex);
//	},
	onHide: function(colpkr){
      $(colpkr).fadeOut(500);
      return false
    },
	onSubmit: function(colpkr, hex){
      $('#colorpicker').css('backgroundColor', '#' + hex);
      change_color('#' + hex)
      $(colpkr).fadeOut(500);
      return false
    }
})

$('#real_time').click(function(){
  
})
// close (document ready)
});
