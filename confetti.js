let canvas = document.getElementById("confetti-canvas");
let ctx = canvas.getContext("2d");
const SIZE = 12;
const SPEED = 7;
let confetti = [];

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

function createConfetti() {
  for (let i = 0; i < 150; i++) {
    confetti.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      r: Math.random() * 6 + SIZE,
      d: Math.random() * 50 + 10,
      color: `hsl(${Math.random() * 360}, 100%, 50%)`,
      tilt: Math.random() * 10 - 10,
    });
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  confetti.forEach((c, i) => {
    ctx.beginPath();
    ctx.fillStyle = c.color;
    ctx.fillRect(c.x, c.y, c.r, c.r);
  });

  update();
}

function update() {
  confetti.forEach((c) => {
    c.y += Math.cos(c.d) + SPEED;
    c.x += 2 * Math.sin(c.d);

    if (c.y > canvas.height) {
      c.y = -10;
      c.x = Math.random() * canvas.width;
    }
  });
}

function animate(length) {
  canvas = document.getElementById("confetti-canvas");
  ctx = canvas.getContext("2d");
  createConfetti();
  animateFrames(length);
  setTimeout(() => (confetti = []), length);
}

function animateFrames(length = 5000) {
  draw();
  requestAnimationFrame(animateFrames);
}
