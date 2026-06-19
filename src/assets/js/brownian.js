(function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const canvas = document.getElementById("brownian-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const particles = [];
  const count = 48;
  const mouse = { x: 0, y: 0 };
  const smoothMouse = { x: 0, y: 0 };
  let width = 0;
  let height = 0;

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
  }

  class Particle {
    constructor() {
      this.reset(true);
    }

    reset(initial) {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 0.15;
      this.vy = (Math.random() - 0.5) * 0.15;
      this.radius = 1.5 + Math.random() * 3.5;
      this.opacity = 0.06 + Math.random() * 0.14;
      this.isIvory = Math.random() < 0.3;
      if (!initial) {
        this.x = smoothMouse.x + (Math.random() - 0.5) * 40;
        this.y = smoothMouse.y + (Math.random() - 0.5) * 40;
      }
    }

    update() {
      this.vx += (Math.random() - 0.5) * 0.04;
      this.vy += (Math.random() - 0.5) * 0.04;

      const dx = smoothMouse.x - this.x;
      const dy = smoothMouse.y - this.y;
      const dist = Math.hypot(dx, dy) + 1;
      const influence = Math.min(120 / dist, 0.35);
      this.vx += (dx / dist) * influence * 0.012;
      this.vy += (dy / dist) * influence * 0.012;

      this.vx *= 0.992;
      this.vy *= 0.992;

      const speed = Math.hypot(this.vx, this.vy);
      const maxSpeed = 0.35;
      if (speed > maxSpeed) {
        this.vx = (this.vx / speed) * maxSpeed;
        this.vy = (this.vy / speed) * maxSpeed;
      }

      this.x += this.vx;
      this.y += this.vy;

      if (this.x < -20 || this.x > width + 20 || this.y < -20 || this.y > height + 20) {
        this.reset(false);
      }
    }

    draw() {
      const inner = this.isIvory ? "245, 240, 232" : "45, 212, 191";
      const gradient = ctx.createRadialGradient(
        this.x,
        this.y,
        0,
        this.x,
        this.y,
        this.radius * 4
      );
      gradient.addColorStop(0, `rgba(${inner}, ${this.opacity})`);
      gradient.addColorStop(1, `rgba(${inner}, 0)`);

      ctx.beginPath();
      ctx.fillStyle = gradient;
      ctx.arc(this.x, this.y, this.radius * 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function init() {
    resize();
    particles.length = 0;
    for (let i = 0; i < count; i++) {
      particles.push(new Particle());
    }
    smoothMouse.x = width / 2;
    smoothMouse.y = height / 2;
    mouse.x = smoothMouse.x;
    mouse.y = smoothMouse.y;
  }

  function tick() {
    smoothMouse.x += (mouse.x - smoothMouse.x) * 0.018;
    smoothMouse.y += (mouse.y - smoothMouse.y) * 0.018;

    ctx.clearRect(0, 0, width, height);

    for (const particle of particles) {
      particle.update();
      particle.draw();
    }

    requestAnimationFrame(tick);
  }

  window.addEventListener("resize", init);
  window.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  window.addEventListener("mouseleave", () => {
    mouse.x = width / 2;
    mouse.y = height / 2;
  });

  init();
  tick();
})();
