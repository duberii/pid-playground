
// Simulation Parameters
const particlesize = 4;
const minvelocity = 0.01;
const decayRate = 0.004;
const numParticles = 20;
const spawnChance = 0.95;
const fadeRate = 3;
const fieldStrength = 0.01;
const slowDown = 0.99;

//Particle Lists
let particles = [];
let fadingParticles = [];
let toRemove = [];

function setup() {
    let cnv = createCanvas(windowWidth, windowHeight);
    cnv.parent('bg');
    cnv.position(0, 0);
    cnv.style('z-index', '-10'); 
    cnv.style('position','fixed') 
}
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
  }
function draw() {
    background('#222334');
    // Create new particles occasionally if there are under numParticles
    if (particles.length + fadingParticles.length < numParticles & Math.random() > spawnChance) {
        particles.push(new Particle());
    }
    // Make particles fade if they are outside of the screen or if their velocity is below minvelocity
    for (let i = particles.length - 1; i >= 0; i--) {
        if (particles[i].position.x < 0 || particles[i].position.x > width || particles[i].position.y < 0 || particles[i] >
            height || particles[i].velocity.mag() < minvelocity) { toRemove.push(i); }
        // The update method returns a bool stating whether or not the particle decayed let 
        didDecay = particles[i].update();
        if (didDecay) {
            // Generates a random velocity, and calculates the original 
            let temp = p5.Vector.random2D(); 
            let originalCharge = particles[i].charge;
            let originalMomentum = p5.Vector.mult(particles[i].velocity.copy(), particles[i].mass);
            if (!(particles[i].charge == 0)) {
                particles[i].charge = 2 * getRandomInt(0, 1) - 1;
                particles[i].mass = random() + 1;
                particles[i].velocity = temp.copy();
                particles[i].decayProbability = particles[i].decayProbability / 2;
                particles[i].acceleration = particles[i].calc_acceleration();
                particles.push(new Particle());
                particles[particles.length - 1].position = particles[i].position.copy();
                particles[particles.length - 1].velocity = p5.Vector.mult(p5.Vector.sub(originalMomentum.copy(), p5.Vector.mult(particles[i].velocity.copy(), particles[i].mass)), 1 / particles[particles.length - 1].mass);
                particles[particles.length - 1].charge = originalCharge - particles[i].charge;
                particles[particles.length - 1].decayProbability = particles[i].decayProbability / 2;
                particles[particles.length - 1].acceleration = particles[particles.length - 1].calc_acceleration();
                if (particles[particles.length - 1].charge == 0) {
                    particles[particles.length - 1].toDraw = false;
                }
            } else {
                toRemove.push(i)
                particles[i].fading = true;
                particles.push(new Particle());
                particles[particles.length - 1].position = particles[i].position.copy();
                particles[particles.length - 1].velocity = temp.copy();
                particles[particles.length - 1].charge = -1;
                particles[particles.length - 1].toDraw = true;
                particles[particles.length - 1].decayProbability = particles[i].decayProbability / 4;
                particles[particles.length - 1].acceleration = particles[particles.length - 1].calc_acceleration();
                particles.push(new Particle());
                particles[particles.length - 1].position = particles[i].position.copy();
                particles[particles.length - 1].velocity = p5.Vector.mult(p5.Vector.sub(originalMomentum.copy(), p5.Vector.mult(particles[particles.length - 2].velocity.copy(), particles[i].mass)), 1 / particles[particles.length - 1].mass);
                particles[particles.length - 1].charge = 1; particles[particles.length - 1].toDraw = true;
                particles[particles.length - 1].decayProbability = particles[i].decayProbability / 4;
                particles[particles.length - 1].acceleration = particles[particles.length - 1].calc_acceleration();
            }
        }
    } for (let i = toRemove.length - 1; i >= 0; i--) {
        fadingParticles.push(particles.splice(i, 1)[0]);
        fadingParticles[fadingParticles.length - 1].fading = true;
    }
    for (let i = fadingParticles.length - 1; i >= 0; i--) {
        fadingParticles[i].update();
        let isDone = fadingParticles[i].display();
        if (isDone) {
            fadingParticles.splice(i, 1);
        }
    }
    toRemove = [];
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].display();
    }
}

class Particle {
    constructor() {
        let randInt = getRandomInt(0, 3);
        let tempLen = 5 * random() + 3;
        let angle = 1.6 * random() - 0.8;
        if (randInt == 0) {
            this.position = createVector(0.8 * width * random() + 0.2 * width, 0);
            this.velocity = createVector(tempLen * Math.sin(angle), tempLen * Math.cos(angle));
        } else if (randInt == 1) {
            this.position = createVector(0.8 * width * random() + 0.2 * width, height);
            this.velocity = createVector(tempLen * Math.sin(angle), -1 * tempLen * Math.cos(angle));
        }
        else if (randInt == 2) {
            this.position = createVector(0, 0.8 * height * random() + 0.2 * height);
            this.velocity = createVector(tempLen * Math.cos(angle), tempLen * Math.sin(angle));
        } else if (randInt == 3) {
            this.position = createVector(width, 0.8 * height * random() + 0.2 * height);
            this.velocity = createVector(-1 * tempLen * Math.cos(angle), tempLen * Math.sin(angle));
        }

        this.charge = getRandomInt(-1, 1); // Adjust charge values as needed
        this.mass = random() + 0.1;
        this.decayProbability = decayRate;
        this.trailColor = color(255, 150); // Adjust trail color and opacity
        this.acceleration = this.calc_acceleration();
        this.history = [];
        this.fading = false;
        this.fadingCount = 0;
        this.guaranteed_decay = 30 * random() + 10;
        if (this.charge == 0) {
            this.toDraw = false;
        } else {
            this.toDraw = true;
        }
    }

    update() {
        // Slow down over time
        this.history.push(createVector(this.position.x, this.position.y));
        if (this.history.length > 300) {
            this.history.shift();
        }
        this.velocity.mult(slowDown);
        this.acceleration = this.calc_acceleration();
        this.velocity.add(this.acceleration);
        // Move the particle
        this.position.add(this.velocity);
        // Decay and create new particles occasionally
        let distance_from_spawn = p5.Vector.sub(this.history[0].copy(), this.position.copy()).mag();
        if (random() < this.decayProbability & !(this.fading) & this.velocity.mag() > minvelocity & !(this.charge == 0)) {
            return true;
        } else if (distance_from_spawn > this.guaranteed_decay & this.charge == 0 & !(this.fading)) {
            return true;
        } else {
            return false;
        }
    }
    calc_acceleration() {
        return createVector((-1 * fieldStrength / this.mass) * this.charge * this.velocity.y, (fieldStrength / this.mass) * this.charge * this.velocity.x);
    }
    display() {
        if (this.fading) {
            this.fadingCount += 1;
        }
        if (this.toDraw) {
            let opac = 255;
            if (this.fading) {
                opac = 255 - fadeRate * this.fadingCount;
                if (opac <= 1) { opac = 0; }
            } for (let i = this.history.length - 1; i > 0; i--) {
                let trailSize = particlesize;
                this.trailColor.setAlpha(map(i, this.history.length, 0, 0, opac));
                strokeWeight(trailSize);
                stroke(this.trailColor);
                line(this.history[this.history.length - i].x, this.history[this.history.length - i].y, this.history[this.history.length - i - 1].x, this.history[this.history.length - i - 1].y);
            }
            // Draw the particle based on its charge
            if (!(this.fading)) {
                fill(255, 255, 255, 255);
                noStroke();
                ellipse(this.position.x, this.position.y, particlesize, particlesize);
            }
        }
        if (this.fadingCount >= 130) {
            return true;
        } else {
            return false;
        }
    }

}
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}