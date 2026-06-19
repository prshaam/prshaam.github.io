(function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const canvas = document.getElementById("brownian-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const particles = [];
  const mouse = { x: 0, y: 0 };
  const smoothMouse = { x: 0, y: 0 };
  let width = 0;
  let height = 0;
  let maxCount = 32;
  let dpr = window.devicePixelRatio || 1;
  const palette = [180, 60, 300];
  const hueCycleMs = 34000;

  function getResponsiveMaxCount() {
    if (width <= 640) return 8;
    if (width <= 1024) return 18;
    if (width <= 1440) return 28;
    return 40;
  }

  function getCurrentHue(time) {
    const raw = ((time % hueCycleMs) / hueCycleMs) * palette.length;
    const index = Math.floor(raw);
    const nextIndex = (index + 1) % palette.length;
    const progress = raw - index;
    const from = palette[index];
    const to = palette[nextIndex];
    const delta = to - from;
    const corrected = from + delta * progress;
    return (corrected + 360) % 360;
  }

  function setAccentColors(time) {
    const hue = getCurrentHue(time);
    const accent = `hsl(${hue}, 92%, 58%)`;
    const accentDark = `hsl(${hue}, 82%, 35%)`;
    const accentGlow = `hsla(${hue}, 95%, 62%, 0.24)`;
    document.documentElement.style.setProperty("--accent", accent);
    document.documentElement.style.setProperty("--accent-dark", accentDark);
    document.documentElement.style.setProperty("--accent-glow", accentGlow);
  }

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = window.devicePixelRatio || 1;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.width = Math.max(1, Math.floor(width * dpr));
    canvas.height = Math.max(1, Math.floor(height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    maxCount = getResponsiveMaxCount();

    if (particles.length > maxCount) {
      particles.splice(maxCount);
    }
  }

  function clampVelocity(v) {
    const max = 3.4;
    return Math.max(-max, Math.min(max, v));
  }

  function createParticle(x, y, vx, vy, hue) {
    const particle = new Particle();
    particle.x = x;
    particle.y = y;
    particle.vx = clampVelocity(vx);
    particle.vy = clampVelocity(vy);
    particle.hue = hue;
    particle.radius = 2.5 + Math.random() * 3.5;
    particle.opacity = 0.08 + Math.random() * 0.12;
    particle.spawnCooldown = 0;
    return particle;
  }

  class Particle {
    constructor() {
      this.reset(true);
    }

    reset(initial) {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      const speed = 1.6 + Math.random() * 1.8;
      const angle = Math.random() * Math.PI * 2;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      this.radius = 2.5 + Math.random() * 3.5;
      this.opacity = 0.08 + Math.random() * 0.12;
      this.hue = getCurrentHue(performance.now() + Math.random() * 8000);
      this.spawnCooldown = 0;
    }

    update(delta) {
      this.x += this.vx;
      this.y += this.vy;
      this.hue = (this.hue + 0.02) % 360;
      this.spawnCooldown = Math.max(0, this.spawnCooldown - delta);

      const hitLeft = this.x <= this.radius;
      const hitRight = this.x >= width - this.radius;
      const hitTop = this.y <= this.radius;
      const hitBottom = this.y >= height - this.radius;

      const bouncedX = hitLeft || hitRight;
      const bouncedY = hitTop || hitBottom;

      if (bouncedX) {
        this.vx *= -1;
        this.x = hitLeft ? this.radius : width - this.radius;
      }

      if (bouncedY) {
        this.vy *= -1;
        this.y = hitTop ? this.radius : height - this.radius;
      }

      if ((bouncedX || bouncedY) && this.spawnCooldown === 0) {
        this.spawnCooldown = 220;
        const angle = Math.atan2(this.vy, this.vx) + (Math.random() - 0.5) * 0.4;
        const speed = Math.hypot(this.vx, this.vy) * 0.85;
        spawnParticle(
          this.x,
          this.y,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          (this.hue + (Math.random() - 0.5) * 24 + 360) % 360
        );
      }
    }

    draw() {
      const gradient = ctx.createRadialGradient(
        this.x,
        this.y,
        0,
        this.x,
        this.y,
        this.radius * 4
      );
      gradient.addColorStop(0, `hsla(${this.hue}, 92%, 68%, ${this.opacity})`);
      gradient.addColorStop(0.45, `hsla(${this.hue}, 92%, 68%, ${this.opacity * 0.6})`);
      gradient.addColorStop(1, `hsla(${this.hue}, 92%, 68%, 0)`);

      ctx.beginPath();
      ctx.fillStyle = gradient;
      ctx.arc(this.x, this.y, this.radius * 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function spawnParticle(x, y, vx, vy, hue) {
    if (particles.length >= maxCount) return;
    particles.push(createParticle(x, y, vx, vy, hue));
  }

  function init() {
    resize();
    particles.length = 0;
    particles.push(new Particle());
    smoothMouse.x = width / 2;
    smoothMouse.y = height / 2;
    mouse.x = smoothMouse.x;
    mouse.y = smoothMouse.y;
  }

  let lastTime = performance.now();

  function tick(now) {
    const delta = Math.min(100, now - lastTime);
    lastTime = now;
    smoothMouse.x += (mouse.x - smoothMouse.x) * 0.02;
    smoothMouse.y += (mouse.y - smoothMouse.y) * 0.02;

    setAccentColors(now);
    ctx.clearRect(0, 0, width, height);

    for (const particle of particles) {
      particle.update(delta);
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
  requestAnimationFrame(tick);
})();
