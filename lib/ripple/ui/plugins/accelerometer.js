/*
 * Copyright (c) 2010 Epic Train Hack
 * Copyright (c) 2011 Research In Motion Limited
 * Contributors: Wolfram Kriesing, Dan Silivestru, Brent Lintner
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
var ui = require('ripple/ui'),
    goodVibrations = require('ripple/ui/plugins/goodVibrations'),
    accelerometer = require('ripple/accelerometer'),
    event = require('ripple/event'),
    Rotation = require('ripple/platform/w3c/1.0/Rotation'),
    Acceleration = require('ripple/platform/w3c/1.0/Acceleration'),
    _mouseDown,
    _offsets = {
        x: 0,
        y: 0,
        z: 0
    },
    _oldX,
    _oldY,
    _shape =
        //
        // The front side
        //
        // x, y, z      x, y, z         x, y, z
        // for some strange reason for y -100 is top, 100 is bottom
        "-30,30,10,     30,30,10,       30,60,10,       100,100,100,-1,0;" + // top left, top right, bottom right - of the right triangle
        "-30,30,10,     30,60,10,       -30,60,10,      100,100,100,-1,0;" + // top left, right bottom, left bottom - of the left triangle
        // front side "the phone display"
        "-20,-50,11,    20,-50,11,      20,20,11,       100,100,100,-1,0;" +
        "-20,-50,11,    20,20,11,       -20,20,11,      100,100,100,-1,0;" +
        // below the display
        "-30,30,10,     30,20,10,       30,30,10,       0,0,0,-1,0;" +
        "-30,30,10,     -30,20,10,      30,20,10,       0,0,0,-1,0;" +
        // above the display
        "-30,-60,10,    30,-60,10,      30,-50,10,      0,0,0,-1,0;" +
        "-30,-60,10,    30,-50,10,      -30,-50,10,     0,0,0,-1,0;" +
        // left of the display
        "-30,-50,10,    -20,-50,10,     -20,20,10,      0,0,0,-1,0;" +
        "-30,-50,10,    -20,20,10,      -30,20,10,      0,0,0,-1,0;" +
        // right of the display
        "20,-50,10,     30,-50,10,      30,20,10,       0,0,0,-1,0;" +
        "20,-50,10,     30,20,10,       20,20,10,       0,0,0,-1,0;" +


        // back side, opposite side to the above one
        "-30,-60,-10,   30,60,-10,      30,-60,-10,     0,0,0,-1,0;" +
        "-30,-60,-10,   -30,60,-10,     30,60,-10,      0,00,-1,0;" +
        // right side
        "30,-60,-10,    30,60,-10,      30,60,10,       50,50,80,-1,0;" +
        "30,-60,-10,    30,60,10,       30,-60,10,      50,50,80,-1,0;" +
        // left side
        "-30,-60,-10,   -30,60,10,      -30,60,-10,     50,50,80,-1,0;" +
        "-30,-60,-10,   -30,-60,10,     -30,60,10,      50,50,80,-1,0;" +

        // top
        "30,-60,-10,    -30,-60,10, -30,-60,-10,    50,80,50,-1,0;" +
        "30,-60,-10,    30,-60,10,      -30,-60,10, 50,80,50,-1,0;" +
        // bottom
        "30,60,-10, -30,60,-10,     -30,60,10,      80,50,50,-1,0;" +
        "30,60,-10, -30,60,10,      30,60,10,       80,50,50,-1,0";

function _shakeDevice() {
    window.setTimeout(goodVibrations.shakeDevice(8), 1);
    accelerometer.shake();
}

function _updateAccelerometerPanel(motion) {
    jQuery("#accelerometer-x").html(Math.round(motion.accelerationIncludingGravity.x * 100) / 100);
    jQuery("#accelerometer-y").html(Math.round(motion.accelerationIncludingGravity.y * 100) / 100);
    jQuery("#accelerometer-z").html(Math.round(motion.accelerationIncludingGravity.z * 100) / 100);
    jQuery("#accelerometer-alpha").html(Math.round(motion.orientation.alpha));
    jQuery("#accelerometer-beta").html(Math.round(motion.orientation.beta));
    jQuery("#accelerometer-gamma").html(Math.round(motion.orientation.gamma));
}

function _updateCanvas(a, b, g) {
    ThreeDee.loadMesh(_shape);
    g = g || 0;
    ThreeDee.rotate(b, g, a);
    ThreeDee.backface();
    ThreeDee.shade();
    ThreeDee.zSort();
    Draw.initialize(document.querySelector("#accelerometer-canvas"));
    Draw.clear(0, 0, 480, 300);
    Draw.drawScene(ThreeDee.getTranslation(), 3);
}

function _createCanvas() {
    var node = document.querySelector("#accelerometer-canvas");
    ThreeDee.setCenter(150, 100);
    ThreeDee.setLight(-300, -300, 800);

    node.addEventListener("mousemove", function (e) {
        if (_mouseDown) {
            _offsets.x = (_offsets.x + _oldX - e.offsetX) % 360;
            _offsets.y = (_offsets.y + _oldY - e.offsetY) % 360;

            _updateCanvas(_offsets.x, _offsets.y);

            var cosX = Math.cos((_offsets.x) * (Math.PI / 180)),
                sinX = Math.sin((_offsets.x) * (Math.PI / 180)),
                cosY = Math.cos((_offsets.y) * (Math.PI / 180)),
                sinY = Math.sin((_offsets.y) * (Math.PI / 180));

            accelerometer.setInfo({
                x: sinX * 9.81,
                z: -cosX * cosY * 9.81,
                y: sinY * cosX * 9.81,
                alpha: (-_offsets.x + 360) % 360,
                beta: -_offsets.y % 90,
                gamma: 0 //gamma radiation is dangerous, stay away
            });

            _oldX = e.offsetX;
            _oldY = e.offsetY;
        }
    });

    node.addEventListener("mousedown", function (e) {
        _oldX = e.offsetX;
        _oldY = e.offsetY;
        _mouseDown = true;
    });

    node.addEventListener("mouseup", function (e) {
        _mouseDown = false;
    });

    return node;
}

function _resetAccelerometer() {
    var node = _createCanvas();
    jQuery(node).bind("dblclick", function (e) {
        _resetAccelerometer();
    });

    _updateCanvas(0, 0);
    _oldX = 0;
    _oldY = 0;
    _offsets = {
        x: 0,
        y: 0,
        z: 0
    };
    accelerometer.setInfo({
        acceleration: new Acceleration(0, 0, 0),
        accelerationIncludingGravity: new Acceleration(0, 0, -9.81),
        rotationRate: new Rotation(0, 0, 0),
        orientation: new Rotation(0, 0, 0),
        timestamp: new Date().getTime()
    });
}

module.exports = {
    panel: {
        domId: "accelerometer-container",
        collapsed: true,
        pane: "left"
    },
    initialize: function () {
        _resetAccelerometer();

        _updateAccelerometerPanel(accelerometer.getInfo());

        jQuery("#accelerometer-shake").click(_shakeDevice);

        event.on("AccelerometerInfoChangedEvent", _updateAccelerometerPanel, this);
    }
};
