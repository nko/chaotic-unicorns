
// spring vars

var spring_length = 0;
var spring_strength = 5;
var spring_mass = 2342;
var spring_charge = 3;

// helper

var min = function (s1,s2) {if(s2>s1) return s1; else return s2};
var max = function (s1,s2) {if(s1>s2) return s1; else return s2};

var vmag = function (vec) {return Math.sqrt(vec.x*vec.x+vec.y*vec.y);};
var vmul = function (vec,a) {return {x: vec.x*a, y: vec.y*a}};
var vnorm = function (vec) {if(vec.x == 0 && vec.y == 0) return vec; else return vmul(vec, 1 / vmag(vec));};
var vadd = function (a,b) {return {x:a.x+b.x, y:a.y+b.y};};
var vsub = function (a,b) {return {x:a.x-b.x, y:a.y-b.y};};


var initSpring = function (_node) {$(_node).attr('speed',"0,0");};


var position_helper = function (offset,obj) {
    var off = obj.offset();
    var mid = {top:  obj.height() / 2,
              left: obj.width() / 2};
    var pos = {x:off.left - offset.left + mid.left,
               y:off.top - offset.top + mid.top};
    return {offset:off, middle:mid, position:pos};
};


// canvas

var updateCanvas = function () {
    var obj = $("#canvas");
    var canvas = obj[0];
    canvas.height = obj.height();
    canvas.width  = obj.width();
    var offset = obj.offset();
    var g = canvas.getContext("2d");
    g.clearRect(0, 0, canvas.width, canvas.height);
    g.beginPath();
    var cache = {};
    $(".node").each(function () {
        var current = $(this);
        var src = position_helper(offset, current);
        $.each(current.attr("relation").split(","),function (_,relation) {
            if(relation != "") {
                var target = $("#"+relation);
                if(target.length) {
                    var hash = min(current[0].id,target[0].id) + "," + max(current[0].id,target[0].id);
                    if(!(hash in cache)) {
                        cache[hash] = 5;
                        var trg = position_helper(offset, target);
                        // finally drawing ...
                        g.moveTo(src.position.x, src.position.y);
                        g.lineTo(trg.position.x, trg.position.y);
                  }
              }
            }
        });
    });
    g.stroke();
    g.closePath();
};

// spring physics engine

var updateSprings = function (ms) {
    var dt = ms/1000;
    var obj = $("#canvas");
    var offset = obj.offset();
    // get all springs
    var cache = {};
    var accelerations = {};
    $(".node").each(function () {
        var current = $(this);
        var src = position_helper(offset, current);
        $.each(current.attr("relation").split(","),function (_,relation) {
            if(relation != "") {
                var target = $("#"+relation);
                if(target.length) {
                    var hash = min(current[0].id,target[0].id) + "," + max(current[0].id,target[0].id);
                    if(!(hash in cache)) {
                        var trg = position_helper(offset, target);
                        // some accel calc
                        var diff = vsub(src.position, trg.position);
                        var dir = vnorm(diff);
                        var difflen = spring_length - vmag(diff);
                        var accel = vmul(dir, difflen * spring_strength);
                        //save
                        cache[hash] = 5;
                        if(current[0].id in accelerations)
                            accelerations[current[0].id].acceleration = vadd(accelerations[current[0].id].acceleration, accel);
                        else accelerations[current[0].id] = {current: current,
                                                       position: src.position,
                                                       other: trg.position,
                                                       acceleration: accel,
                                                       mystirious:{x:src.middle.left, y:src.middle.top}
                                                      };
                        if(target[0].id in accelerations)
                            accelerations[target[0].id].acceleration = vadd(accelerations[target[0].id].acceleration, accel);
                        else accelerations[target[0].id] = {current: target,
                                                       position: trg.position,
                                                       other: src.position,
                                                       acceleration: accel,
                                                       mystirious:{x:trg.middle.left, y:trg.middle.top}
                                                      };
                        //calc some electic force (blitz!)
                        var accel = {x:0,y:0};
                        $(".node").each(function () {
                            var another = $(this);
                            if(current != another) {
                                var atr = position_helper(offset, another);
                                var diff = vsub(atr.position,src.position);
                                var dir = vnorm(diff);
                                var difflen = spring_length - diff.x*diff.x - diff.y*diff.y; //vmag(diff)^2
                                if(Math.abs(difflen) > 1e2)
                                  accel = vadd(accel,vmul(dir, (spring_charge*spring_charge)/-difflen));
                            }
                        });
                        //save
                        if(current[0].id in accelerations)
                            accelerations[current[0].id].acceleration = vadd(accelerations[current[0].id].acceleration, accel);
                        else accelerations[current[0].id] = {current: current,
                                                       position: src.position,
                                                       other: src.position,
                                                       acceleration: accel,
                                                       mystirious:{x:src.middle.left, y:src.middle.top}
                                                      };
                    }
                }
            }
        });
    });
    // update
    var canvas = obj[0];
    canvas.height = obj.height();
    canvas.width  = obj.width();
    var g = canvas.getContext("2d");
    g.clearRect(0, 0, canvas.width, canvas.height);
    g.beginPath();
    $.each(accelerations, function (_, node) {
        var current = node.current;
        if(!current.hasClass("root") && !current.hasClass("fixed")) {
            // some speed calc
            var speed = current.attr('speed').split(",");
            speed = {x: parseFloat(speed[0]), y: parseFloat(speed[1])};
            speed = vadd(speed, vmul(node.acceleration, dt/spring_mass ));
            speed = vmul(speed, 0.9);
            //console.log("speed", speed.x,speed.y,"|",dt);
            var pos = vadd(node.position,speed);
            // drawing ...
            g.moveTo(node.other.x, node.other.y);
            g.lineTo(pos.x, pos.y);
            // applying new position
            pos = vsub(pos, node.mystirious);
            current.animate({left:pos.x, top:pos.y},dt);
            // applying speed
            current.attr('speed', speed.x+","+speed.y);
        } else if(current.hasClass("fixed")) {
             // drawing ...
            g.moveTo(node.other.x, node.other.y);
            g.lineTo(node.position.x, node.position.y);
        }
    });
    g.stroke();
    g.closePath();
};
