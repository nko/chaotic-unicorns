
var springsPhysics = function () {

    // defaults

    var _default = {
            length:   100,
            strength: 500,
            mass:     342,
            charge:   800,
            friction: 0.9,
        };

    // helper

    var _position_helper = function (offset,obj) {
        var off = {x: obj.offset().left, y: obj.offset().top};
        var mid = {x: obj.width() / 2,   y: obj.height() / 2};
        var pos = {x:off.x - offset.left  + mid.x,
                   y:off.y - offset.top   + mid.y};
        var size = (obj.width()+obj.height()) / 2;
        return {offset:off, middle:mid, position:pos, size:size};
    };

    var min = function (s1,s2) {if(s2>s1) return s1; else return s2};
    var max = function (s1,s2) {if(s1>s2) return s1; else return s2};

    var vmag = function (vec) {return Math.sqrt(vec.x*vec.x+vec.y*vec.y);};
    var vmul = function (vec,a) {return {x: vec.x*a, y: vec.y*a}};
    var vadd = function (a,b) {return {x:a.x+b.x, y:a.y+b.y};};
    var vsub = function (a,b) {return {x:a.x-b.x, y:a.y-b.y};};
    var vnorm = function (vec) {if(vec.x == 0 && vec.y == 0)
        return vec; else return vmul(vec, 1 / vmag(vec));};

    // library

    var system = {};
    var constructor = system.generate = function (params) {
        if(typeof(params) == "undefined") params = _default;
        // TODO more params check
        var engine = build(params);
        var realtime = function (/*time in millisec*/ ms) {
            var dt = ms / 1000;
            simulate(engine, dt);
            animate(engine, dt);
            draw(engine);
            return engine;
        };
        var step = function (/*time in millisec*/ ms, /*number of steps*/ nr) {
            var dt = ms / 1000;
            for(var i = 0 ; i < nr ; i++) simulate(engine, dt);
        };
        var pre_render = function (/*time in millisec*/ ms, /*number of steps*/ nr, /*animation time*/ anims) {
            step(ms, nr);
            if(typeof(anims) == "undefined") var ani = ms; else  var ani = anims;
            animate(engine, ani);
            draw(engine);
            return engine;
        };
        var static = function() {draw(engine); return engine;};
        return {realtime:realtime, step:step, pre_render:pre_render,
                static:static};
    };

    var build = system.build = function (params) {
        if(typeof(params) == "undefined") params = _default;
        var nodes = {}, joints = [];
        var window = $("#nodes");
        //get nodes
        $(".node").each(function () {
            var current = $(this);
            var composition = _position_helper(window.offset(), current);
            nodes[current[0].id] = cur_node = {
                    id: current[0].id,
                    object: current,
                    position: composition.position,
                    middle: composition.middle,
                    offset: composition.offset,
                    size: composition.size,
                    acceleration: {x:0, y:0},
                    speed: {x:0, y:0},
                    charge: params.charge,
                    mass: params.mass,
                    friction: params.friction,
                    joints: {},
                };
            //get joints
            $.each(current.attr("relation").split(","),function (_,relation) {
                if(relation != "") {
                    var target = $("#"+relation);
                    if(target.length) {
                        nodes[cur_node.id].joints[target[0].id] =
                            joints.push({
                                source: cur_node,
                                target: target[0].id,
                                length: params.length,
                                strength: params.strength,
                            });
                    }
                }
            });
        });
        //fill relations with nodes
        $.each(joints,function (_,joint) {joint.target = nodes[joint.target];});
        return {nodes:nodes, joints:joints, params:params};
    };

    var simulate = system.run = function (engine, dt) {
        //calc joint acceleration
        $.each(engine.joints, function (_, joint) {
            var diff = vsub(joint.target.position, joint.source.position);
            var dir = vnorm(diff);
            var difflen = joint.length - vmag(diff);
            var accel = vmul(dir, difflen * joint.strength);//<- calc stuff
            joint.target.acceleration = vadd(joint.target.acceleration,accel);
        });
        //calc electric force acceleration (bl!tz)
        $.each(engine.nodes, function (_, node) {
            var accel = {x:0, y:0};
            $.each(engine.nodes, function (_, other) {
                if(other.id != node.id) {
                    var diff = vsub(node.position,other.position);
                    var dir = vnorm(diff);
                    var threshold = engine.params.length + node.size;
                    var difflen = diff.x*diff.x +
                                  diff.y*diff.y; //vmag(diff)^2 //<- calc stuff
                    var difflen = vmag(diff); //<- calc stuff
                    if(difflen < threshold)
                        difflen = (1 - difflen/threshold) * threshold;
                    if(difflen > 1e2)
                        accel = vadd(accel,vmul(dir,
                            (other.charge*other.charge)/difflen));
                    else accel = vadd(accel,vmul(dir,threshold));
                }
            });
            node.acceleration = vadd(node.acceleration,accel);
        });
        //apply results
        $.each(engine.nodes, function (_, node) {
            // omitt all currently hovered nodes and root too
            if(!(node.object.hasClass("fixed")) && !(node.object.hasClass("root"))) {
                //calc speed
                node.speed = vadd(node.speed, vmul(node.acceleration,dt/node.mass));
                node.speed = vmul(node.speed, node.friction);// ^^^ calc stuff
                //apply speed
                node.position = vadd(node.position, node.speed);
            }
            //clean acceleration
            node.acceleration = {x:0, y:0};
        });
        return engine;
    };

    var draw = system.draw = function (engine) {
        var obj = $("#canvas");
        var canvas = obj[0];
        canvas.height = obj.height();
        canvas.width  = obj.width();
        var g = canvas.getContext("2d");
        g.clearRect(0, 0, canvas.width, canvas.height);
        g.beginPath();
        $.each(engine.joints, function (_, joint) {
            var src = vsub(joint.source.position,{x:0,y:joint.source.middle.y/2});//??
            var trg = vsub(joint.target.position,{x:0,y:joint.target.middle.y/2});//??
             // drawing ...
            g.moveTo(src.x, src.y);
            g.lineTo(trg.x, trg.y);
        });
        g.stroke();
        g.closePath();
        return engine;
    };
    
    var animate = system.animate = function (engine, dt) {
        $.each(engine.nodes, function (_, node) {
            var pos = vsub(node.position, node.middle);
            node.object.animate({left:pos.x, top:pos.y}, dt);
        });
        return engine;
    };

    return system;
}();

