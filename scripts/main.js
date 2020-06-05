let shapes;
let nodes;

let space;
let spaceX;
let spaceY;

let sliders = {
    nodes: null,
    radius: null,
    gravity: null,
    mouse: null,
    speedLimit: null
};

function setup() {
    shapes = 0;
    nodes = 0;
    spaceX = windowWidth;
    spaceY = windowHeight;
    createCanvas(spaceX, spaceY);

    sliders.nodes = new Slider({min: 3, max: 100, default: 6, posX: 10, posY: 10, width: 80, text: ' sides', color: [0, 102, 153]});
    sliders.radius = new Slider({min: 1, max: 100, default: 60, posX: 10, posY: 40, width: 80, text: 'px radius', color: [0, 102, 153]});
    sliders.gravity = new Slider({min: 1, max: 30, default: 1, posX: 10, posY: 70, width: 80, text: ' shape gravity', color: [0, 102, 153], step: 0.01});
    sliders.mouse = new Slider({min: 1, max: 100, default: 1, posX: 10, posY: 100, width: 80, text: ' mouse gravity', color: [0, 102, 153], step: 0.01});
    sliders.speedLimit = new Slider({min: 1, max: 30, default: 4, posX: 10, posY: 130, width: 80, text: ' speed limit', color: [0, 102, 153]});

    space = new Space(shapes, nodes, spaceX, spaceY)

    noStroke();
    frameRate(60);
}

function draw() {
    background(27);

    for (let key in sliders) {
        sliders[key].draw();
    }

    if (sliders.nodes.value() == 3 && 
        sliders.radius.value() == 1 &&
        sliders.gravity.value() == 1 &&
        sliders.mouse.value() == 1 &&
        sliders.speedLimit.value() == 1 && 
        space.shapes.length > 0
        ) {
        space.shapes.length = 0;
    }

    space.tick();
}

function mousePressed() {

    if (mouseX > 100) {
        space.addShapes(1, sliders.nodes.value(), mouseX, mouseY, sliders.radius.value());
    }
}


function Slider(
    ops = {
        min: 1,
        max: 100,
        default: null,
        step: 1,
        posX: 10,
        posY: 10,
        width: 80,
        text: '',
        color: [0, 102, 153]
    }
) {
    ops.default = ops.default || Math.floor((ops.min + ops.max) / 2);
    this.slider = createSlider(ops.min, ops.max, ops.default, ops.step);
    this.slider.position(ops.posX, ops.posY);
    this.slider.style('width', `${ops.width}px`);

    this.ops = ops;
}

Slider.prototype.value = function () {
    return this.slider.value();
}

Slider.prototype.draw = function () {
    push()
    textSize(30);
    fill(this.ops.color[0], this.ops.color[1], this.ops.color[2]);
    text(`${this.slider.value()}${this.ops.text}`, this.ops.posX + this.ops.width + 10, this.ops.posY + 20);
    pop();
}

function Space(shapes = 1, nodes = 6, x = 100, y = 100) {
    this.shapes = [];
    this.x = x;
    this.y = y;
    this.time = 0;

    this.addShapes(shapes, nodes);
}

Space.prototype.tick = function () {
    for (let i = 0; i < this.shapes.length; i++) {
        let shape = this.shapes[i];
        shape.tick();
    }
    this.time++;
}

Space.prototype.addShapes = function (shapes = 1, nodes = 6, x = null, y = null, radius = null) {
    for (let i = 0; i < shapes; i++) {
        let shape = new Shape(this, nodes, x, y, radius);
        this.shapes.push(shape);
    }
}

function Shape(space, nodes = 6, x = null, y = null, radius = null) {
    this.space = space;
    this.nodes = [];

    for (let i = 0; i < nodes; i++) {
        let node = new Node();
        this.nodes.push(node);
    }

    let offset = 100;
    this.center = createVector(x || (this.space.x / 2) + random(offset * -1, offset), y || (this.space.y / 2) + random(offset * -1, offset))
    this.velocity = createVector(0.0, 0.0)
    this.acceleration = createVector(0.0, 0.0);

    this.radius = radius || random(45, 100);
    this.rotAngle = -90;
    
    this.springing = 0.0009;
    this.damping = 0.98;
    this.organicConstant = 1.0;
    this.color = shuffle([0, random(0, 255), random(0, 255)]);

    this.dir = 1;
    this.minRadius = constrain(random(this.radius - 40, this.radius), 1, this.radius);
    this.maxRadius = random(this.radius, this.radius + 40);
    this.maxNodes = random(nodes, nodes * 6);
    this.limit = random(40, 100);
}

Shape.prototype.tick = function () {
    this.draw();
    this.gravity(sliders.gravity.value());
    this.move(mouseX, mouseY, sliders.mouse.value());

    this.lerp();
    this.bounds();

    if (this.space.time % 100 == 0) {
        this.pulse(this.minRadius, this.maxRadius);
    }

    // this.killNodes();
}

Shape.prototype.draw = function () {
    //  calculate node  starting locations
    for (let i = 0; i < this.nodes.length; i++) {
        let node = this.nodes[i];
        node.origin = createVector(this.center.x + cos(radians(this.rotAngle)) * this.radius, this.center.y + sin(radians(this.rotAngle)) * this.radius)
        this.rotAngle += 360.0 / this.nodes.length;
    }

    // draw polygon
    curveTightness(this.organicConstant);
    fill(this.color[0], this.color[1], this.color[2]);
    beginShape();
    for (let i = 0; i < this.nodes.length; i++) {
        let node = this.nodes[i];
        curveVertex(node.xy.x, node.xy.y);
    }
    for (let i = 0; i < this.nodes.length - 1; i++) {
        let node = this.nodes[i];
        curveVertex(node.xy.x, node.xy.y);
    }
    endShape(CLOSE);
}

Shape.prototype.lerp = function () {
    this.velocity.add(this.acceleration);
    this.limit = sliders.speedLimit.value();
    if (this.velocity.x > this.limit) {
        this.velocity.x = this.limit;
    }
    if (this.velocity.y > this.limit) {
        this.velocity.y = this.limit;
    }
    this.center.add(this.velocity);
    this.acceleration.mult(0);
}

Shape.prototype.force = function (x, y) {
    let mass = this.nodes.length * this.radius * 0.001;
    this.acceleration.add(createVector(x / mass, y / mass));
}

Shape.prototype.move = function (x, y, scale = 1) {
    let delta = createVector(x - this.center.x, y - this.center.y)

    // create springing effect
    delta.mult(this.springing);
    this.force(delta.x * scale, delta.y * scale)

    // slow down springing
    this.acceleration.mult(this.damping);

    // change curve tightness
    this.organicConstant = 1 - ((abs(this.acceleration.x) + abs(this.acceleration.y)) * 0.1);

    //move nodes
    for (let i = 0; i < this.nodes.length; i++) {
        let node = this.nodes[i];
        node.xy = node.origin.copy().add(createVector(sin(radians(node.angle)) * (this.acceleration.x * 2)), sin(radians(node.angle)) * (this.acceleration.y * 2))
        node.angle += node.frequency;
    }
}

Shape.prototype.gravity = function (scale = 1) {
    for (let i = 0; i < this.space.shapes.length; i++) {
        let shape = this.space.shapes[i];
        if (this != shape) {
            this.move(shape.center.x, shape.center.y, scale);
        }
    }
}

Shape.prototype.bounds = function () {
    if (this.center.x + this.velocity.x > this.space.x) {
        this.velocity.x *= -1;
    }
    else if (this.center.x + this.velocity.x < 0) {
        this.velocity.x *= -1;
    }

    if (this.center.y + this.velocity.y > this.space.y) {
        this.velocity.y *= -1;
    }
    else if (this.center.y + this.velocity.y < 0) {
        this.velocity.y *= -1;
    }
}

Shape.prototype.killNodes = function () {
    for (let i = this.nodes.length - 1; i > 0; i--) {
        let node = this.nodes[i];
        if (node.isDead) {
            delete this.nodes[i];
        }
    }
}

Shape.prototype.pulse = function (min = 250, max = 300) {
    if (this.radius > max && this.dir == 1) {
        this.dir = -1;
    }
    if (this.radius <= min && this.dir == -1) {
        this.dir = 1;
    }
    this.radius += 1 * this.dir;
}

function Node(nodeStartX = 0, nodeStartY = 0, nodeX = 0, nodeY = 0, angle = 0, frequency = random(5, 12)) {
    this.origin = createVector(nodeStartX, nodeStartY);
    this.xy = createVector(nodeX, nodeY);
    this.angle = angle;
    this.frequency = frequency;

    this.isDead = false;
}