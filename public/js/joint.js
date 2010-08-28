
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
    $(".node").each(function () {
        var current = $(this);
        var src_offset = current.offset();
        var src_mid = {top:  current.height() / 2,
                       left: current.width() / 2};
        $.each(current.attr("relation").split(","),function (_,relation) {
            if(relation != "") {
              var target = $("#"+relation);
              if(target.length != 0) {
                  var trg_offset = target.offset();
                  var trg_mid = {top:  target.height() / 2,
                                 left: target.width() / 2};
                  // finally drawing ...
                  g.moveTo(src_offset.left - offset.left + src_mid.left, src_offset.top - offset.top + src_mid.top);
                  g.lineTo(trg_offset.left - offset.left + trg_mid.left, trg_offset.top - offset.top + trg_mid.top);
              }
            }
        });
    });
    g.stroke();
    g.closePath();
};