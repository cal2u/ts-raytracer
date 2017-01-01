var canvas = document.getElementById('myCanvas');
var drawButton = document.getElementById('toggle');
var regularOption = document.getElementById('regular');
var ctx = canvas.getContext('2d');
function Dot(a, b) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
}
function Add(a, b) {
    return new Vec3(a.x + b.x, a.y + b.y, a.z + b.z);
}
function Sub(a, b) {
    return new Vec3(a.x - b.x, a.y - b.y, a.z - b.z);
}
function Neg(a) {
    return new Vec3(-a.x, -a.y, -a.z);
}
function Scale(a, b) {
    return new Vec3(a.x * b, a.y * b, a.z * b);
}
function ScaleRGB(a, b) {
    return new RGB(a.r * b, a.g * b, a.b * b);
}
function Cross(a, b) {
    return new Vec3(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
}
function Lambertian(camera, u, v) {
    var ray = camera.getRay(u, v);
    var scene = camera.scene;
    var int = scene.getIntersection(ray);
    if (int && scene.lights) {
        var result = new RGB(0, 0, 0);
        for (var i_1 = 0; i_1 < scene.lights.length; i_1++) {
            var light_1 = scene.lights[i_1];
            var lightDir = Sub(light_1.pos, int.pos).normalize();
            var cos = Dot(lightDir, int.normal);
            if (cos > 0) {
                result.add(ScaleRGB(int.shape.color, cos));
            }
        }
        return result;
    }
    return scene.background.copy();
}
function FixedLambertian(camera, u, v) {
    var ray = camera.getRay(u, v);
    var int = camera.scene.getIntersection(ray);
    if (int) {
        var lightDir = (new Vec3(-1, 1, -1)).normalize();
        var result = ScaleRGB(int.shape.color, Dot(int.normal, Neg(lightDir)));
        return result;
    }
    return camera.scene.background;
}
function PlainTrace(camera, u, v) {
    var ray = camera.getRay(u, v);
    var int = camera.scene.getIntersection(ray);
    if (int) {
        return int.shape.color;
    }
    return camera.scene.background;
}
var OrthoCamera = /** @class */ (function () {
    function OrthoCamera(pos, up, right, scene) {
        this.pos = pos;
        this.scene = scene;
        this.w = Cross(up, right).normalize();
        this.v = up.normalize();
        this.u = Cross(this.w, this.v);
    }
    OrthoCamera.prototype.getRay = function (x, y) {
        return new Ray(Add(Add(this.pos, Scale(this.u, x)), Scale(this.v, y)), new Vec3(0, 0, -1));
    };
    OrthoCamera.prototype.move = function (dx, dy) {
    };
    return OrthoCamera;
}());
var PointLight = /** @class */ (function () {
    function PointLight(pos, color) {
        this.pos = pos;
        this.color = color;
    }
    return PointLight;
}());
var Scene = /** @class */ (function () {
    function Scene(shapes, lights) {
        this.shapes = shapes;
        this.lights = lights;
        this.background = new RGB(255, 255, 255);
    }
    Scene.prototype.getIntersection = function (ray) {
        var tMax = Infinity;
        var int = null;
        for (var i_2 = 0; i_2 < this.shapes.length; i_2++) {
            var shape = this.shapes[i_2];
            var thisInt = shape.intersect(ray, tMax);
            if (thisInt) {
                int = thisInt;
                tMax = int.t;
            }
        }
        return int;
    };
    return Scene;
}());
var Intersection = /** @class */ (function () {
    function Intersection(t, pos, normal, shape) {
        this.t = t;
        this.pos = pos;
        this.normal = normal;
        this.shape = shape;
    }
    return Intersection;
}());
var Sphere = /** @class */ (function () {
    function Sphere(center, radius) {
        this.center = center;
        this.radius = radius;
        this.color = new RGB(0, 0, 200);
    }
    Sphere.prototype.norm = function (p) {
        var c = this.center;
        return Scale(Sub(p, c), 1 / this.radius);
    };
    Sphere.prototype.intersect = function (ray, tMax) {
        var e = ray.start;
        var d = ray.dir;
        var c = this.center;
        var e_c = Sub(e, c);
        var disc = Math.pow(Dot(d, e_c), 2) -
            Dot(d, d) * (Dot(e_c, e_c) - Math.pow(this.radius, 2));
        if (disc < 0)
            return null;
        var root = Math.sqrt(disc);
        var t = Dot(Neg(d), e_c);
        if (t > root) {
            // First intersection is in front of the ray
            t -= root;
        }
        else {
            t += root;
            // All intersections were behind the ray
            if (t < 0)
                return null;
        }
        // Check within tMax distance
        if (t > tMax)
            return null;
        var p = ray.getPos(t);
        return new Intersection(t, p, this.norm(p), this);
    };
    return Sphere;
}());
var Vec3 = /** @class */ (function () {
    function Vec3(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    Vec3.prototype.add = function (other) {
        this.x += other.x;
        this.y += other.y;
        this.z += other.z;
    };
    Vec3.prototype.abs = function () {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    };
    Vec3.prototype.normalize = function () {
        var mag = this.abs();
        this.x /= mag;
        this.y /= mag;
        this.z /= mag;
        return this;
    };
    Vec3.prototype.toString = function () {
        return "(" + this.x + ", " + this.y + ", " + this.z + ")";
    };
    return Vec3;
}());
var Ray = /** @class */ (function () {
    function Ray(start, dir) {
        this.start = start;
        this.dir = dir;
    }
    Ray.prototype.getPos = function (t) {
        return Add(this.start, Scale(this.dir, t));
    };
    return Ray;
}());
var RGB = /** @class */ (function () {
    function RGB(r, g, b) {
        this.r = r;
        this.g = g;
        this.b = b;
    }
    RGB.prototype.copy = function () {
        return new RGB(this.r, this.g, this.b);
    };
    RGB.prototype.add = function (other) {
        this.r += other.r;
        this.g += other.g;
        this.b += other.b;
        return this;
    };
    RGB.prototype.times = function (other) {
        this.r *= other.r;
        this.g *= other.g;
        this.b *= other.b;
        return this;
    };
    RGB.prototype.toString = function () {
        return "(" + this.r + ", " + this.g + ", " + this.b + ")";
    };
    return RGB;
}());
function setPixel(x, y, color) {
    ctx.fillStyle = "rgba(" + Math.round(color.r) + ", " + Math.round(color.g) + ", " + Math.round(color.b) + ", 1.0)";
    ctx.fillRect(x, y, 1, 1);
}
var renderView = {
    l: -1.75,
    r: 1.75,
    t: 1.75,
    b: -1.75,
};
function drawSection(sy, width, sheight, su, v, du, dv, tracingFunction) {
    for (var y = sy; y < sy + sheight; y++) {
        var u = su;
        for (var x = 0; x < width; x++) {
            setPixel(x, y, tracingFunction(camera, u, v));
            u += du;
        }
        v += dv;
    }
}
function drawSectioned(tracingFunction) {
    var width = canvas.width, height = canvas.height;
    var l = renderView.l, r = renderView.r, t = renderView.t, b = renderView.b;
    var du = (r - l) / width;
    var dv = -(t - b) / height;
    var sheight = 1;
    var u = l + du / 2;
    var _loop_1 = function (i_3) {
        var v = t - dv / 2 + i_3 * dv;
        setTimeout(function () { drawSection(i_3, width, sheight, u, v, du, dv, tracingFunction); }, 0);
    };
    for (var i_3 = 0; i_3 + sheight <= height; i_3 += sheight) {
        _loop_1(i_3);
    }
}
function draw(tracingFunction) {
    var width = canvas.width, height = canvas.height;
    var l = renderView.l, r = renderView.r, t = renderView.t, b = renderView.b;
    var du = (r - l) / width;
    var dv = -(t - b) / height;
    var v = t - dv / 2;
    for (var i_4 = 0; i_4 < height; i_4++) {
        var u = l + du / 2;
        for (var j = 0; j < width; j++) {
            setPixel(j, i_4, tracingFunction(camera, u, v));
            u += du;
        }
        if (i_4 % 20 == 0) {
            setTimeout(0);
        }
        v += dv;
    }
}
var sphere = new Sphere(new Vec3(0, 0, -5), 0.6);
var sphere2 = new Sphere(new Vec3(0, 0.4, -10), 0.3);
sphere2.color = new RGB(60, 120, 200);
var light = new PointLight(new Vec3(1, 1, 1), new RGB(255, 255, 255));
var light2 = new PointLight(new Vec3(-1, -1, -8), new RGB(100, 100, 100));
var scene = new Scene([sphere, sphere2], [light, light2]);
var camera = new OrthoCamera(new Vec3(0, 0, 0), new Vec3(0, 1, 0), new Vec3(1, 0, 0), scene);
var fps = document.getElementById('fps');
var i = 0;
var startTime;
var frameCount = 0;
var framerateTimer;
var updateInterval;
function doFramerate() {
    // Collect framerate info
    startTime = (new Date()).getTime();
    frameCount = 0;
    framerateTimer = setTimeout(function () {
        if (fps && frameCount) {
            fps.innerHTML = 'FPS: ' + frameCount / ((new Date()).getTime() - startTime) * 1000;
        }
        doFramerate();
    }, 1000);
}
var drawFunction = draw;
var traceFunction = Lambertian;
var drawing = true;
var p1 = new Vec3(-0.5, 0, 0);
var p2 = new Vec3(0.5, 0, 0);
function startDrawing() {
    updateInterval = setInterval(function () {
        sphere.radius = 0.4 + 0.2 * Math.cos((new Date()).getTime() / 300);
        /*sphere.center = Add(Scale(p1, Math.abs(Math.cos((new Date()).getTime()/1000))),
                            Scale(p2, 1-Math.abs(Math.cos((new Date()).getTime()/1000))));*/
        drawFunction(traceFunction);
        frameCount++;
    }, 1000 / 60);
}
doFramerate();
startDrawing();
drawButton.addEventListener('click', function (e) {
    if (drawing) {
        clearInterval(updateInterval);
        clearTimeout(framerateTimer);
    }
    else {
        doFramerate();
        startDrawing();
    }
    drawing = !drawing;
});
canvas.addEventListener('mousemove', function (e) {
    var rect = canvas.getBoundingClientRect();
    var mouseX = e.clientX - rect.left;
    var mouseY = e.clientY - rect.top;
    //console.log(`Mouse: (${mouseX}, ${mouseY})`);
    var canvasX = mouseX * canvas.width / canvas.clientWidth;
    var canvasY = mouseY * canvas.height / canvas.clientHeight;
    //console.log(`Canvas: (${canvasX}, ${canvasY})`);
    var cameraU = canvasX * (renderView.r - renderView.l) / canvas.width + renderView.l;
    var cameraV = renderView.t - canvasY * (renderView.t - renderView.b) / canvas.height;
    sphere2.center = Add(new Vec3(0, 0, -10), Add(Scale(camera.u, cameraU), Scale(camera.v, cameraV)));
});
function useRegularUpdate() {
    drawFunction = draw;
}
function useSectionedUpdate() {
    drawFunction = drawSectioned;
}
function usePlain() {
    traceFunction = PlainTrace;
}
function useLambertian() {
    traceFunction = Lambertian;
}
/* if (fps) {
   
 } */ 
