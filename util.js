"use strict";

function multiBy(value) {
    var ratio = 1.333;
    var scale = 1;
    // var scale2 = window.devicePixelRatio;
    var scale2 = 1;
    // console.log("window.devicePixelRatio:", scale2);
    return value * ratio * scale * scale2 / 100.0;
}

export {multiBy};