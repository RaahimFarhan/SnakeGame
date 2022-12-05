// identify HTML elements
let dom_replay = document.querySelector("#replay");
let dom_score = document.querySelector("#score");

// create canvas
let dom_canvas = document.createElement("canvas");
document.querySelector("#canvas").appendChild(dom_canvas);
let CTX = dom_canvas.getContext("2d");

// const W = (dom_canvas.width = 750);
// const H = (dom_canvas.height = 750);

let W = ~~(dom_canvas.width = screen.height / 1.5);
let H = ~~(dom_canvas.height = screen.height / 1.5);

// create variables
let snake,
  food,
  cells = 20,
  cellSize,
  isGameOver = false,
  tails = [],
  score = 00,
  maxScore = window.localStorage.getItem("maxScore") || undefined,
  particles = [],
  splashingParticleCount = 20,
  cellsCount,
  requestID;

// create direction and speed and  collision
let helpers = {
  Vec: class {
    constructor(x, y) {
      this.x = x;
      this.y = y;
    }
    add(v) {
      this.x += v.x;
      this.y += v.y;
      return this;
    }
    mult(v) {
      if (v instanceof helpers.Vec) {
        this.x *= v.x;
        this.y *= v.y;
        return this;
      } else {
        this.x *= v;
        this.y *= v;
        return this;
      }
    }
  },
  isCollision(v1, v2) {
    return v1.x == v2.x && v1.y == v2.y;
  },

  // clean up particles and draw grid
  garbageCollector() {
    for (let i = 0; i < particles.length; i++) {
      if (particles[i].size <= 0) {
        particles.splice(i, 1);
      }
    }
  },
  drawGrid() {
    CTX.lineWidth = 1;
    CTX.strokeStyle = "#232332";
    CTX.shadowBlur = 0;
    for (let i = 1; i < cells; i++) {
      let f = (W / cells) * i;
      CTX.beginPath();
      CTX.moveTo(f, 0);
      CTX.lineTo(f, H);
      CTX.stroke();
      CTX.beginPath();
      CTX.moveTo(0, f);
      CTX.lineTo(W, f);
      CTX.stroke();
      CTX.closePath();
    }
  },
};

// check if key is being pressed prevent turning 180 degrees
let KEY = {
  ArrowUp: false,
  ArrowRight: false,
  ArrowDown: false,
  ArrowLeft: false,
  resetState() {
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
          .filter(f => f !== e.key && f !== "listen" && f !== "resetState")
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
  constructor(i) {
    this.pos = new helpers.Vec(W / 2, H / 2);
    this.dir = new helpers.Vec(0, 0);
    this.index = i;
    this.delay = 5;
    this.size = W / cells;
    this.color = "white";
    this.history = [];
    this.total = 1;
  }
  draw() {
    //draw snake according to position and snake size
    let { x, y } = this.pos;
    CTX.fillStyle = this.color;
    CTX.fillRect(x, y, this.size, this.size);
    if (this.total >= 2) {
      for (let i = 0; i < this.history.length - 1; i++) {
        let { x, y } = this.history[i];
        CTX.lineWidth = 1;
        CTX.fillStyle = "rgba(225,225,225,1)";
        CTX.fillRect(x, y, this.size, this.size);
      }
    }
  }
  //end game if snake touches wall
  walls() {
    let { x, y } = this.pos;
    if (x + cellSize > W) {
      isGameOver = true;
    }
    if (y + cellSize > W) {
      isGameOver = true;
    }
    if (y < 0) {
      isGameOver = true;
    }
    if (x < 0) {
      isGameOver = true;
    }
  }
  // config keybinds and snake direction
  controls() {
    let dir = this.size;
    if (KEY.ArrowUp) {
      this.dir = new helpers.Vec(0, -dir);
    }
    if (KEY.ArrowDown) {
      this.dir = new helpers.Vec(0, dir);
    }
    if (KEY.ArrowLeft) {
      this.dir = new helpers.Vec(-dir, 0);
    }
    if (KEY.ArrowRight) {
      this.dir = new helpers.Vec(dir, 0);
    }
  }
  //end game if snake bumps into itself
  selfCollision() {
    for (let i = 0; i < this.history.length; i++) {
      let p = this.history[i];
      if (helpers.isCollision(this.pos, p)) {
        isGameOver = true;
      }
    }
  }
  //continuously draw and preform checks
  update() {
    this.walls();
    this.draw();
    this.controls();
    if (!this.delay--) {
      if (helpers.isCollision(this.pos, food.pos)) {
        incrementScore();
        particleSplash();
        food.spawn();
        this.total++;
      }
      this.history[this.total - 1] = new helpers.Vec(this.pos.x, this.pos.y);
      for (let i = 0; i < this.total - 1; i++) {
        this.history[i] = this.history[i + 1];
      }
      this.pos.add(this.dir);
      this.delay = 5;
      this.total > 3 ? this.selfCollision() : null;
    }
  }
}

class Food {
  constructor() {
    //randomize initial apple position
    this.pos = new helpers.Vec(
      ~~(Math.random() * cells) * cellSize,
      ~~(Math.random() * cells) * cellSize
    );
    this.color = "rgb(255, 0, 0)";
    this.size = cellSize;
  }
  draw() {
    let { x, y } = this.pos;
    CTX.fillStyle = this.color;
    CTX.fillRect(x, y, this.size, this.size);
  }
  spawn() {
    // randomize new apple spawn
    let randX = ~~(Math.random() * cells) * this.size;
    let randY = ~~(Math.random() * cells) * this.size;
    for (let path of snake.history) {
      if (helpers.isCollision(new helpers.Vec(randX, randY), path)) {
        return this.spawn();
      }
    }
    this.color = "rgb(255, 0, 0)";
    this.pos = new helpers.Vec(randX, randY);
  }
}

class Particle {
  constructor(pos, color, size, vel) {
    this.pos = pos;
    this.color = color;
    this.size = Math.abs(size / 2);
    this.gravity = -0.2;
    this.vel = vel;
  }
  draw() {
    let { x, y } = this.pos;
    this.color = "rgb(255, 0, 0)";
    CTX.fillRect(x, y, this.size, this.size);
  }
  update() {
    // make the particles fall
    this.draw();
    this.size -= 0.3;
    this.pos.add(this.vel);
    this.vel.y -= this.gravity;
  }
}

// add score
function incrementScore() {
  score++;
  dom_score.innerText = score.toString();
}

function particleSplash() {
  // make particles explode
  for (let i = 0; i < splashingParticleCount; i++) {
    let vel = new helpers.Vec(Math.random() * 6 - 3, Math.random() * 6 - 3);
    let position = new helpers.Vec(food.pos.x, food.pos.y);
    particles.push(new Particle(position, "rgb(255, 0, 0)", food.size, vel));
  }
}

// clean canvas for animation
function clear() {
  CTX.clearRect(0, 0, W, H);
}

function initialize() {
  KEY.listen();
  cellsCount = cells * cells;
  cellSize = W / cells;
  snake = new Snake();
  food = new Food();
  dom_replay.addEventListener("click", reset);
  loop();
}

// loop to call functions
function loop() {
  clear();
  if (!isGameOver) {
    requestID = setTimeout(loop, 1000 / 60);
    helpers.drawGrid();
    snake.update();
    food.draw();
    for (let p of particles) {
      p.update();
    }
    helpers.garbageCollector();
  } else {
    clear();
    gameOver();
  }
}
// if game ends display game over screen
function gameOver() {
  maxScore ? null : (maxScore = score);
  score > maxScore ? (maxScore = score) : null;
  window.localStorage.setItem("maxScore", maxScore);
  CTX.fillStyle = "#4cffd7";
  CTX.textAlign = "center";
  CTX.font = "bold 30px Poppins, sans-serif";
  CTX.fillText("GAME OVER", W / 2, H / 2);
  CTX.font = "15px Poppins, sans-serif";
  CTX.fillText(`SCORE   ${score}`, W / 2, H / 2 + 60);
  CTX.fillText(`MAXSCORE   ${maxScore}`, W / 2, H / 2 + 80);
}

// when reset button is pressed reset game
function reset() {
  dom_score.innerText = "00";
  score = "00";
  snake = new Snake();
  food.spawn();
  KEY.resetState();
  isGameOver = false;
  clearTimeout(requestID);
  loop();
}

initialize();
