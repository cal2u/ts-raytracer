let canvas = <HTMLCanvasElement> document.getElementById('myCanvas');
let drawButton = <HTMLButtonElement> document.getElementById('toggle');
let regularOption = <HTMLInputElement> document.getElementById('regular');

let ctx = <CanvasRenderingContext2D> canvas.getContext('2d');

function Dot(a: Vec3, b:Vec3): number {
  return a.x*b.x + a.y*b.y + a.z*b.z;
}

function Add(a: Vec3, b: Vec3): Vec3 {
  return new Vec3(a.x+b.x, a.y+b.y, a.z+b.z);
}

function Sub(a: Vec3, b: Vec3): Vec3 {
  return new Vec3(a.x-b.x, a.y-b.y, a.z-b.z);
}

function Neg(a: Vec3): Vec3 {
  return new Vec3(-a.x, -a.y, -a.z);
}

function Scale(a: Vec3, b: number): Vec3 {
  return new Vec3(a.x*b, a.y*b, a.z*b);
}

function ScaleRGB(a: RGB, b: number): RGB {
  return new RGB(a.r * b, a.g * b, a.b * b);
}

function Cross(a: Vec3, b: Vec3): Vec3 {
  return new Vec3(a.y*b.z-a.z*b.y, a.z*b.x-a.x*b.z, a.x*b.y-a.y*b.x);
}

interface TracerFunc {
  (camera: Camera, u: number, v:number): RGB;
}

function Lambertian(camera: Camera, u: number, v: number): RGB {
  let ray = camera.getRay(u, v);
  let scene = camera.scene;

  let int = scene.getIntersection(ray);
  if (int && scene.lights) {
    let result = new RGB(0, 0, 0);
    for (let i = 0; i < scene.lights.length; i++) {
      let light = scene.lights[i];
      let lightDir = Sub(light.pos, int.pos).normalize();
      let cos = Dot(lightDir, int.normal);
      if (cos > 0) {
        result.add(ScaleRGB(int.shape.color, cos));
      }
    }
    return result;
  }

  return scene.background.copy();

}

function FixedLambertian(camera: Camera, u: number, v: number): RGB {
  let ray = camera.getRay(u, v);
  let int = camera.scene.getIntersection(ray);

  if (int) {
    let lightDir = (new Vec3(-1, 1, -1)).normalize();
    let result = ScaleRGB(int.shape.color, Dot(int.normal, Neg(lightDir)));
    return result;
  }

  return camera.scene.background;
}


function PlainTrace(camera: Camera, u: number, v: number): RGB {
  let ray = camera.getRay(u, v);
  let int = camera.scene.getIntersection(ray);

  if (int) {
    return int.shape.color;
  }

  return camera.scene.background;
}

interface GetRayFunc {
  (x: number, y: number): Ray 
}

interface Camera {
  scene: Scene;
  getRay: GetRayFunc;
}

class OrthoCamera {
  u: Vec3;
  v: Vec3;
  w: Vec3;

  constructor(public pos: Vec3, up: Vec3, right: Vec3, public scene:Scene) { 
    this.w = Cross(up, right).normalize();
    this.v= up.normalize();
    this.u = Cross(this.w, this.v);
  }

  getRay(x: number, y: number): Ray {
    return new Ray(Add(Add(this.pos, Scale(this.u, x)), Scale(this.v, y)), new Vec3(0, 0, -1));
  }

  move(dx: number, dy: number): void {

  }
}

class PointLight {
  constructor(public pos: Vec3, public color: RGB) { }
}

class Scene {
  background: RGB;
  constructor(public shapes: [Shape], public lights: [PointLight] | null) {
    this.background = new RGB(255, 255, 255);
  }

  getIntersection(ray: Ray) : Intersection | null{
    let tMax = Infinity;
    let int : Intersection | null = null;

    for (let i = 0; i < this.shapes.length; i++) {
      const shape = this.shapes[i];
      let thisInt = shape.intersect(ray, tMax);
      if (thisInt) {
        int = thisInt;
        tMax = int.t;
      }
    }
    return int;
  }
}

class Intersection {
  constructor(public t: number, public pos: Vec3, public normal: Vec3, public shape: Shape) { }
}

interface IntersectFunc {
  (ray: Ray, tMax: number): Intersection | null;
} 

interface Shape {
  color: RGB;
  intersect: IntersectFunc;
}

class Sphere {
  color: RGB;
  constructor(public center: Vec3, public radius: number) {
    this.color = new RGB(0, 0, 200);
  }

  norm(p: Vec3) {
    let c = this.center;
    return Scale(Sub(p, c), 1/this.radius);
  }

  intersect(ray: Ray, tMax: number): Intersection | null {
    let e = ray.start;
    let d = ray.dir;
    let c = this.center;
    let e_c = Sub(e, c);

    let disc = Math.pow(Dot(d, e_c), 2) - 
                Dot(d, d)*(Dot(e_c, e_c) - Math.pow(this.radius, 2));

    if (disc < 0) return null;

    let root = Math.sqrt(disc);
    let t = Dot(Neg(d), e_c);

    if (t > root) {
      // First intersection is in front of the ray
      t -= root;
    } else {
      t += root;
      // All intersections were behind the ray
      if (t < 0) return null;
    }

    // Check within tMax distance
    if (t > tMax) return null;

    let p = ray.getPos(t);

    return new Intersection(t, p, this.norm(p), this);
  }
}

class Vec3 {
  constructor(public x: number, public y: number, public z: number) {  }

  add(other: Vec3) {
    this.x += other.x;
    this.y += other.y;
    this.z += other.z;
  }

  abs() {
    return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z);
  }

  normalize(): Vec3 {
    let mag = this.abs();
    this.x /= mag;
    this.y /= mag;
    this.z /= mag;

    return this;
  }

  toString() {
    return `(${this.x}, ${this.y}, ${this.z})`
  }
}

class Ray {
  constructor(public start: Vec3, public dir: Vec3) { }

  getPos(t) {
    return Add(this.start, Scale(this.dir, t));
  }
}

class RGB {
  constructor(public r: number, public g: number, public b:number) { }

  copy() {
    return new RGB(this.r, this.g, this.b);
  }

  add(other: RGB) {
    this.r += other.r;
    this.g += other.g;
    this.b += other.b;
    return this;
  }

  times(other: RGB) {
    this.r *= other.r;
    this.g *= other.g;
    this.b *= other.b;
    return this;
  }

  toString() {
    return `(${this.r}, ${this.g}, ${this.b})`
  }
}

function setPixel(x, y, color) {
  ctx.fillStyle = `rgba(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)}, 1.0)`;
  ctx.fillRect(x, y, 1, 1);
}

let renderView = {
  l: -1.75,
  r: 1.75,
  t: 1.75,
  b: -1.75,
}

function drawSection(sy, width, sheight, su, v, du, dv, tracingFunction) {
  for (let y = sy; y < sy+sheight; y++) {
    let u = su;
    for (let x = 0; x < width; x++) {
      setPixel(x, y, tracingFunction(camera, u, v));
      u += du;
    }
    v += dv;
  }
}

function drawSectioned(tracingFunction: TracerFunc) {
  let width = canvas.width, height = canvas.height;

  let l = renderView.l,
      r = renderView.r,
      t = renderView.t,
      b = renderView.b;
      
  let du = (r-l)/width;
  let dv = -(t-b)/height;

  let sheight = 1;
  let u = l + du/2;
  for (let i = 0; i+sheight <= height; i+=sheight) {
    let v = t - dv/2 + i*dv;
    setTimeout(()=> { drawSection(i, width, sheight, u, v, du, dv, tracingFunction) }, 0);  
  }
}

function draw(tracingFunction: TracerFunc) {
  let width = canvas.width, height = canvas.height;

  let l = renderView.l,
      r = renderView.r,
      t = renderView.t,
      b = renderView.b;
  
  let du = (r-l)/width;
  let dv = -(t-b)/height;
  
  let v = t - dv/2;
  for (let i = 0; i < height; i++) {
    let u = l + du/2;
    for (let j = 0; j < width; j++) {
      setPixel(j, i, tracingFunction(camera, u, v));
      u += du;
    }
    if (i % 20 == 0) {
      setTimeout(0);
    }
    v += dv;
  }
}


let sphere = new Sphere(new Vec3(0, 0, -5), 0.6);
let sphere2 = new Sphere(new Vec3(0, 0.4, -10), 0.3);
sphere2.color = new RGB(60, 120, 200);
let light = new PointLight(new Vec3(1, 1, 1), new RGB(255, 255, 255));
let light2 = new PointLight(new Vec3(-1,-1, -8), new RGB(100, 100, 100));
let scene = new Scene([sphere, sphere2], [light, light2]);
let camera = new OrthoCamera(new Vec3(0, 0, 0), new Vec3(0, 1, 0), new Vec3(1, 0, 0), scene);

let fps = document.getElementById('fps');

let i = 0;

let startTime;
let frameCount = 0;
let framerateTimer;
let updateInterval;

function doFramerate() {
  // Collect framerate info
  startTime = (new Date()).getTime();
  frameCount = 0;
  framerateTimer = setTimeout(()=>{
    if (fps && frameCount) {
      fps.innerHTML = 'FPS: ' + frameCount/((new Date()).getTime() - startTime)*1000;
    }
    doFramerate();
  }, 1000)
}

let drawFunction = draw;
let traceFunction = Lambertian;
let drawing = true;

let p1 = new Vec3(-0.5, 0, 0);
let p2 = new Vec3(0.5, 0, 0);

function startDrawing() {
  updateInterval = setInterval(() => {
    sphere.radius =  0.4 + 0.2 * Math.cos((new Date()).getTime()/300);
    /*sphere.center = Add(Scale(p1, Math.abs(Math.cos((new Date()).getTime()/1000))),
                        Scale(p2, 1-Math.abs(Math.cos((new Date()).getTime()/1000))));*/
    drawFunction(traceFunction);  
    frameCount++;
  }, 1000/60);  
}

doFramerate();
startDrawing();


drawButton.addEventListener('click', e => {
  if (drawing) {
    clearInterval(updateInterval);
    clearTimeout(framerateTimer);
  } else {
    doFramerate();
    startDrawing();
  }
  drawing = !drawing;
});

canvas.addEventListener('mousemove', e => {
  let rect = canvas.getBoundingClientRect();

  let mouseX = e.clientX - rect.left;
  let mouseY = e.clientY - rect.top;

  //console.log(`Mouse: (${mouseX}, ${mouseY})`);

  let canvasX = mouseX * canvas.width / canvas.clientWidth;
  let canvasY = mouseY * canvas.height / canvas.clientHeight;
  //console.log(`Canvas: (${canvasX}, ${canvasY})`);


  
  let cameraU = canvasX * (renderView.r - renderView.l) / canvas.width + renderView.l;
  let cameraV = renderView.t - canvasY * (renderView.t - renderView.b) / canvas.height;

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