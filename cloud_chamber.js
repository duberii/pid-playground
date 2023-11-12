
// Simulation Parameters
const particlesize = 4;
const minvelocity = 0.2;
const decayRate = 0.004;
const numParticles = 20;
const spawnChance = 0.95;
const fadeRate = 20;
const fieldStrength = 0.01;
const slowDown = 0.99;
const trailSize = 4;

//Particle Lists
let particles = [];
let toRemove = [];

function setup() {
    let cnv = createCanvas(windowWidth, windowHeight);
    cnv.parent('bg');
    cnv.position(0, 0);
    cnv.style('z-index', '-10');
    cnv.style('position', 'fixed')
    background(34, 35, 52);
}
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
function mouseClicked() {
    background(34, 35, 52);
}
function draw() {
    background(34, 35, 52, fadeRate);
    // Create new particles occasionally if there are under numParticles
    if (particles.length < numParticles & Math.random() > spawnChance) {
        particles.push(new Particle());
    }
    // Make particles fade if they are outside of the screen or if their velocity is below minvelocity
    for (let i = particles.length - 1; i >= 0; i--) {
        if (particles[i].position.x < 0 || particles[i].position.x > width || particles[i].position.y < 0 || particles[i].position.y >
            height || particles[i].velocity.mag() < minvelocity) {
            particles.splice(i, 1);
            continue
        }
        // The update method returns a bool stating whether or not the particle decayed let 
        didDecay = particles[i].update();
        if (didDecay) {
            // Generates a random velocity, and calculates the original 
            let temp = p5.Vector.random2D();
            let originalCharge = particles[i].charge;
            let originalMomentum = p5.Vector.mult(particles[i].velocity.copy(), particles[i].mass);
            if (!(particles[i].charge == 0)) {
                //For charged particles, a random charge value is chosen for the daughter particles. The value is generated so that 
                // the decaying particle can be used as a daughter particle as well
                particles[i].charge = 2 * getRandomInt(0, 1) - 1;
                particles[i].mass = random() + 1;
                particles[i].velocity = temp.copy();
                particles[i].decayProbability = particles[i].decayProbability / 2;
                particles[i].acceleration = particles[i].calc_acceleration();

                // The other particle is generated based on conservation of momentum and conservation of charge
                particles.push(new Particle());
                particles[particles.length - 1].position = particles[i].position.copy();
                particles[particles.length - 1].velocity = p5.Vector.mult(p5.Vector.sub(originalMomentum.copy(), p5.Vector.mult(particles[i].velocity.copy(), particles[i].mass)), 1 / particles[particles.length - 1].mass);
                particles[particles.length - 1].charge = originalCharge - particles[i].charge;
                particles[particles.length - 1].decayProbability = particles[i].decayProbability / 2;
                particles[particles.length - 1].acceleration = particles[particles.length - 1].calc_acceleration();
            } else {
                // For neutral particles, the decays always contain one positive particle and one negative particle
                particles.push(new Particle());
                particles[particles.length - 1].position = particles[i].position.copy();
                particles[particles.length - 1].velocity = temp.copy();
                particles[particles.length - 1].charge = -1;
                particles[particles.length - 1].decayProbability = particles[i].decayProbability / 4;
                particles[particles.length - 1].acceleration = particles[particles.length - 1].calc_acceleration();
                particles.push(new Particle());
                particles[particles.length - 1].position = particles[i].position.copy();
                particles[particles.length - 1].velocity = p5.Vector.mult(p5.Vector.sub(originalMomentum.copy(), p5.Vector.mult(particles[particles.length - 2].velocity.copy(), particles[i].mass)), 1 / particles[particles.length - 1].mass);
                particles[particles.length - 1].charge = 1;
                particles[particles.length - 1].decayProbability = particles[i].decayProbability / 4;
                particles[particles.length - 1].acceleration = particles[particles.length - 1].calc_acceleration();
                particles.splice(i, 1);
            }
        }
    }
    for (let i = particles.length - 1; i >= 0; i--) {
        //Displays all of the particles
        particles[i].display();
    }
}

class Particle {
    constructor() {
        // randInt randomly picks which side of the screen the particle will enter from
        let randInt = getRandomInt(0, 3);

        //tempLen is the magnitude of the velcity vector
        let tempLen = 5 * random() + 3;

        //Angle is the angle of the velocity from the inward normal from the edge of the screen
        let angle = 1.6 * random() - 0.8;

        //Based on the side of the screen to enter from, a random entry point is chosen and the velocity is calculated as a vector
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

        //Randomly generates properties of the particle
        this.charge = getRandomInt(-1, 1); 
        this.mass = random() + 0.5;
        this.decayProbability = decayRate;
        this.acceleration = this.calc_acceleration();
        this.history = [];

        //Neutral particles are guaranteed to decay after a certain number of ticks. This value determines 
        //how many ticks need to pass before the decay
        this.guaranteed_decay = 50 * random() + 10;
    }

    update() {
        // Adds the current position to the history list for use in drawing the trail
        this.history.push(createVector(this.position.x, this.position.y));

        // Deletes history if it is too long
        if (this.history.length > 100) {
            this.history.shift();
        }
        // Particles slow down over time
        this.velocity.mult(slowDown);
        this.acceleration = this.calc_acceleration();
        this.velocity.add(this.acceleration);
        // Move the particle
        this.position.add(this.velocity);
        // Checks for certain decay conditions, and returns a bool saying if the particle decays or not
        if (random() < this.decayProbability & this.velocity.mag() > minvelocity & !(this.charge == 0)) {
            return true;
        } else if (this.history.length > this.guaranteed_decay & this.charge == 0) {
            return true;
        } else {
            return false;
        }
    }
    calc_acceleration() {
        // Calculates acceleration based on the Lorentz force
        return createVector((-1 * fieldStrength / this.mass) * this.charge * this.velocity.y, (fieldStrength / this.mass) * this.charge * this.velocity.x);
    }
    display() {
        //Neutral particles are not drawn
        if (!(this.charge == 0)) {
            strokeWeight(trailSize);
            stroke(color(255));
            noFill();
            beginShape();
            for (let i = 1; i <=this.history.length - 1; i++) {
                curveVertex(this.history[this.history.length - i].x, this.history[this.history.length - i].y);
            }
            endShape();
        }
    }

}
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}
