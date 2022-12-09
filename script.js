// identify HTML elements
let replay = document.querySelector("#replay");
let dom_score = document.querySelector("#score");

// create canvas
let canvas = document.createElement("canvas");
document.querySelector("#canvas").appendChild(canvas);
let c = canvas.getContext("2d");

let W = ~~(canvas.width = innerHeight / 1.5);
let H = ~~(canvas.height = innerHeight / 1.5);

// create variables
let snake,
  cellz = 16,
  cellSize,
  isGameOver = false,
  tails = [],
  score = 0,
  highScore = window.localStorage.getItem("highScore") || 0,
  particles = [],
  poisons = [],
  BombingParticleCount = 16,
  cellsCount,
  requestID;

// create direction and speed
let basics = {
  Vec: class {
    constructor(x, y) {
      this.x = x;
      this.y = y;
    }
    add(v) {
      this.x += v.x;
      this.y += v.y;
    }
  },
  isCollide(v1, v2) {
    return v1.x == v2.x && v1.y == v2.y;
  },
};

// check if key is being pressed prevent turning 180 degrees
let KEY = {
  resetKeys() {
    this.ArrowUp = false;
    this.ArrowRight = false;
    this.ArrowDown = false;
    this.ArrowLeft = false;
  },
  listen() {
    addEventListener(
      "keydown",
      e => {
        if (e.key === "ArrowUp" && this.ArrowDown) return;
        if (e.key === "ArrowDown" && this.ArrowUp) return;
        if (e.key === "ArrowLeft" && this.ArrowRight) return;
        if (e.key === "ArrowRight" && this.ArrowLeft) return;
        this[e.key] = true;
        Object.keys(this)
          .filter(f => f !== e.key && f !== "listen" && f !== "resetKeys")
          .forEach(k => {
            this[k] = false;
          });
      },
      false
    );
  },
};
// create class
class Snake {
  constructor() {
    this.posit = new basics.Vec(W / 2, H / 2);
    this.direction = new basics.Vec(0, 0);
    this.size = W / cellz;
    this.color = "black";
    this.oldLoc = [];
    this.total = 1;
  }
  draw() {
    // draw snake according to position and snake size
    let { x, y } = this.posit;
    c.fillStyle = this.color;
    c.fillRect(x, y, this.size, this.size);
    if (this.total >= 2) {
      for (let i = 0; i < this.oldLoc.length - 1; i++) {
        let { x, y } = this.oldLoc[i];
        c.lineWidth = 1;
        c.fillStyle = "rgba(225,225,225,1)";
        c.fillRect(x, y, this.size, this.size);
      }
    }
  }
  //end game if snake touches border
  borders() {
    let { x, y } = this.posit;
    if (x + cellSize > W || y + cellSize > W || y < 0 || x < 0) {
      isGameOver = true;
    }
  }
  // config keybinds and snake direction
  controls() {
    let direction = this.size;
    if (KEY.ArrowUp) {
      this.direction = new basics.Vec(0, -direction);
    }
    if (KEY.ArrowDown) {
      this.direction = new basics.Vec(0, direction);
    }
    if (KEY.ArrowLeft) {
      this.direction = new basics.Vec(-direction, 0);
    }
    if (KEY.ArrowRight) {
      this.direction = new basics.Vec(direction, 0);
    }
  }
  //end game if snake bumps into itself
  selfCollide() {
    for (let i = 0; i < this.oldLoc.length; i++) {
      let p = this.oldLoc[i];
      if (basics.isCollide(this.posit, p)) {
        isGameOver = true;
      }
    }
  }

  update() {
    this.borders();
    this.draw();
    this.controls();
    if (!this.delay--) {
      if (basics.isCollide(this.posit, apples.posit)) {
        addScore();
        particleBomb();
        apples.spawn();
        this.total++;
      }
      this.oldLoc[this.total - 1] = new basics.Vec(this.posit.x, this.posit.y);
      for (let i = 0; i < this.total - 1; i++) {
        this.oldLoc[i] = this.oldLoc[i + 1];
      }
      this.posit.add(this.direction);
      this.delay = 5;
      this.total > 3 ? this.selfCollide() : null;
    }
  }
}

class apples {
  constructor() {
    //randomize initial apple position
    this.posit = new basics.Vec(
      ~~(Math.random() * cellz) * cellSize,
      ~~(Math.random() * cellz) * cellSize
    );
    this.color = "rgb(255, 0, 0)";
    this.size = cellSize;
  }
  draw() {
    let { x, y } = this.posit;
    c.fillStyle = this.color;
    c.fillRect(x, y, this.size, this.size);
  }
  spawn() {
    // randomize new apple spawn
    let randX = ~~(Math.random() * cellz) * this.size;
    let randY = ~~(Math.random() * cellz) * this.size;
    for (let path of snake.oldLoc) {
      if (basics.isCollide(new basics.Vec(randX, randY), path)) {
        return this.spawn();
      }
    }
    this.color = "rgb(255, 0, 0)";
    this.posit = new basics.Vec(randX, randY);
  }
}

class Poison {
  constructor(posit, velocity) {
    this.posit = posit;
    this.size = cellSize;
    this.velocity = velocity;
    this.delay = 10;
  }
  draw() {
    let { x, y } = this.posit;
    this.color = "rgb(0, 255, 0)";
    c.fillStyle = this.color;
    c.fillRect(x, y, this.size, this.size);
  }
  update() {
    // make the particles fall
    this.draw();
    if (!this.delay--) {
      this.posit.add(this.velocity);
      this.delay = 10;
    }
  }
}

class Particle {
  constructor(posit, color, size, velocity) {
    this.posit = posit;
    this.size = Math.abs(size / 3);
    this.velocity = velocity;
  }
  draw() {
    let { x, y } = this.posit;
    c.fillRect(x, y, this.size, this.size);
  }
  update() {
    // make the particles fall
    this.draw();
    this.size -= 0.3;
    this.posit.add(this.velocity);
  }
}

// add score
function addScore() {
  score++;
  dom_score.innerText = score.toString();
}

function particleBomb() {
  // make particles explode
  for (let i = 0; i < BombingParticleCount; i++) {
    let velocity = new basics.Vec(Math.random() * 6 - 3, Math.random() * 6 - 3);
    let position = new basics.Vec(apples.posit.x, apples.posit.y);
    particles.push(
      new Particle(position, "rgb(255, 0, 0)", apples.size, velocity)
    );
  }
}

let poisonTimer = 2500;

function spawnPoisons() {
  for (let i = 0; i < 1; i++) {
    let velocity = new basics.Vec(0, cellSize);
    let position = new basics.Vec(
      ~~(Math.random() * cellz) * cellSize,
      cellSize
    );
    poisons.push(new Poison(position, velocity));
  }
}

function poisonTimeChange() {
  console.log(poisonTimer);
  clearInterval(poisInterval);
  poisonTimer -= 100;
  poisInterval = setInterval(spawnPoisons, poisonTimer);
}

// clean canvas for animation
function clear() {
  c.clearRect(0, 0, W, H);
}

function cleanUp() {
  for (let i = 0; i < particles.length; i++) {
    if (particles[i].size <= 0) {
      particles.splice(i, 1);
    }
  }
  for (let i = 0; i < poisons.length; i++) {
    if (poisons[i].posit.y > H) {
      poisons.splice(i, 1);
    }
    //end game on contact
    if (
      snake.posit.x - poisons[i].posit.x === 0 &&
      snake.posit.y - poisons[i].posit.y === 0
    ) {
      isGameOver = true;
      console.log("ended");
    }
  }
}

function initialize() {
  poisInterval = setInterval(spawnPoisons, poisonTimer);
  poisonTimeInterval = setInterval(poisonTimeChange, 2500);
  KEY.listen();
  cellsCount = cellz * cellz;
  cellSize = W / cellz;
  snake = new Snake();
  apples = new apples();
  poisons = [];
  replay.addEventListener("click", reset);
  loop();
}

// loop to call functions
function loop() {
  clear();
  cleanUp();
  if (!isGameOver) {
    requestID = setTimeout(loop, 1000 / 60);
    snake.update();
    apples.draw();
    for (let p of particles) {
      p.update();
    }
    for (let z of poisons) {
      z.update();
    }
  } else {
    clear();
    gameOver();
  }
}
// if game ends display game over screen
function gameOver() {
  clearInterval(poisInterval);
  clearInterval(poisonTimeInterval);
  highScore ? null : (highScore = score);
  score > highScore ? (highScore = score) : null;
  window.localStorage.setItem("highScore", highScore);
  c.textAlign = "center";
  c.fillStyle = "black";
  c.font = "bold 30px Poppins, sans-serif";
  c.fillText("GAME OVER", W / 2, H / 2);
  c.font = "15px Poppins, sans-serif";
  c.fillText(`SCORE:   ${score}`, W / 2, H / 2 + 50);
  c.fillText(`HighSCORE:   ${highScore}`, W / 2, H / 2 + 80);
}

// when reset button is pressed reset game
function reset() {
  poisonTimer = 2500;
  poisInterval = setInterval(spawnPoisons, poisonTimer);
  poisonTimeInterval = setInterval(poisonTimeChange, 2500);
  dom_score.innerText = "0";
  score = "0";
  snake = new Snake();
  poisons = [];
  apples.spawn();
  KEY.resetKeys();
  isGameOver = false;
  clearTimeout(requestID);
  loop();
}

initialize();
