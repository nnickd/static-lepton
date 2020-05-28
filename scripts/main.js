let shapes;
let nodes;

let space;

let spaceX;
let spaceY;

function setup() {
    shapes = 6;
    nodes = 3;
    spaceX = windowWidth;
    spaceY = windowHeight;
    createCanvas(spaceX, spaceY);

    space = new Space(shapes, nodes, spaceX, spaceY)

    noStroke();
    frameRate(60);
}

function draw() {
    fill(0, 100);
    rect(0, 0, width, height);

    space.tick();
}

function Space(shapes = 1, nodes = 6, x = 100, y = 100) {
    this.shapes = [];
    this.x = x;
    this.y = y;
    this.time = 0;

    for (let i = 0; i < shapes; i++) {
        let shape = new Shape(this, nodes);
        this.shapes.push(shape);
    }
}

Space.prototype.tick = function () {
    for (let i = 0; i < this.shapes.length; i++) {
        let shape = this.shapes[i];
        shape.tick();
    }
    this.time++;
}

function Shape(space, nodes = 6) {
    this.space = space;
    this.nodes = [];

    for (let i = 0; i < nodes; i++) {
        let node = new Node();
        this.nodes.push(node);
    }

    let offset = 100;
    this.centerX = (this.space.x / 2) + random(offset * -1, offset);
    this.centerY = (this.space.y / 2) + random(offset * -1, offset);
    this.radius = 45;
    this.radius = random(45, 100);
    this.rotAngle = -90;
    this.accelX = 0.0;
    this.accelY = 0.0;
    this.deltaX = 0.0;
    this.deltaY = 0.0;
    this.springing = 0.0009;
    this.damping = 0.98;
    this.organicConstant = 1.0;
    this.color = [random(0, 255), random(0, 255), random(0, 255)];
    this.dir = 1;
    this.limit = 100;
}

Shape.prototype.tick = function () {
    this.draw();
    this.gravity(10);
    // this.move(this.centerX + random(-300, 300), this.centerY + random(-300, 300));
    this.move(mouseX, mouseY, 60);

    this.lerp();
    this.bounds();

    if (this.nodes.length < 100) {
        this.nodes.push(new Node(this.centerX, this.centerY, this.centerX, this.centerY));
    }

    if (this.space.time % 6000 == 0) {
    }

    // this.pulse(300, 300);
    // this.killNodes();
}

Shape.prototype.draw = function () {
    //  calculate node  starting locations
    for (let i = 0; i < this.nodes.length; i++) {
        let node = this.nodes[i];
        node.nodeStartX = this.centerX + cos(radians(this.rotAngle)) * this.radius;
        node.nodeStartY = this.centerY + sin(radians(this.rotAngle)) * this.radius;
        this.rotAngle += 360.0 / this.nodes.length;
    }

    // draw polygon
    curveTightness(this.organicConstant);
    fill(this.color[0], this.color[1], this.color[2]);
    beginShape();
    for (let i = 0; i < this.nodes.length; i++) {
        let node = this.nodes[i];
        curveVertex(node.nodeX, node.nodeY);
    }
    for (let i = 0; i < this.nodes.length - 1; i++) {
        let node = this.nodes[i];
        curveVertex(node.nodeX, node.nodeY);
    }
    endShape(CLOSE);
}

Shape.prototype.lerp = function () {
    this.deltaX += this.accelX;
    this.deltaY += this.accelY;
    if (this.deltaX > this.limit) {
        this.deltaX = this.limit;
    }
    if (this.deltaY > this.limit) {
        this.deltaY = this.limit;
    }
    this.centerX += this.deltaX;
    this.centerY += this.deltaY;
    this.accelX = 0;
    this.accelY = 0;
}

Shape.prototype.force = function (x, y) {
    let mass = this.nodes.length * this.radius * 0.001;
    this.accelX += (x / mass);
    this.accelY += (y / mass)
}

Shape.prototype.move = function (x, y, scale = 1) {
    //move center point
    let deltaX = x - this.centerX;
    let deltaY = y - this.centerY;

    // create springing effect
    deltaX *= this.springing;
    deltaY *= this.springing;
    // this.accelX += deltaX * scale;
    // this.accelY += deltaY * scale;
    this.force(deltaX * scale, deltaY * scale)

    // slow down springing
    this.accelX *= this.damping;
    this.accelY *= this.damping;

    // change curve tightness
    this.organicConstant = 1 - ((abs(this.accelX) + abs(this.accelY)) * 0.1);

    //move nodes
    for (let i = 0; i < this.nodes.length; i++) {
        let node = this.nodes[i];
        node.nodeX = node.nodeStartX + sin(radians(node.angle)) * (this.accelX * 2);
        node.nodeY = node.nodeStartY + sin(radians(node.angle)) * (this.accelY * 2);
        node.angle += node.frequency;
    }
}

Shape.prototype.gravity = function (scale = 1) {
    for (let i = 0; i < this.space.shapes.length; i++) {
        let shape = this.space.shapes[i];
        if (this != shape) {
            this.move(shape.centerX, shape.centerY, scale);
        }
    }
}

Shape.prototype.bounds = function () {
    if (this.centerX + this.deltaX > this.space.x) {
        this.deltaX *= -1;
    }
    else if (this.centerX + this.deltaX < 0) {
        this.deltaX *= -1;
    }

    if (this.centerY + this.deltaY > this.space.y) {
        this.deltaY *= -1;
    }
    else if (this.centerY + this.deltaY < 0) {
        this.deltaY *= -1;
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
    this.nodeStartX = nodeStartX;
    this.nodeStartY = nodeStartY;
    this.nodeX = nodeX;
    this.nodeY = nodeY;
    this.angle = angle;
    this.frequency = frequency;

    this.isDead = false;
}