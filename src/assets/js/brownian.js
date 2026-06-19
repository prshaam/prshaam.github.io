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
  
  // Fixed monochromatic teal - no color changes
  const TEAL_HUE = 174;
  const TEAL_SAT = 92;

  function getResponsiveMaxCount() {
    if (width <= 640) return 12;
    if (width <= 1024) return 24;
    if (width <= 1440) return 36;
    return 48;
  }

  function setAccentColors() {
    // Set fixed teal colors - never change
    const accent = `hsl(${TEAL_HUE}, ${TEAL_SAT}%, 58%)`;
    const accentDark = `hsl(${TEAL_HUE}, 85%, 35%)`;
    const accentLight = `hsl(${TEAL_HUE}, 95%, 65%)`;
    const accentGlow = `hsla(${TEAL_HUE}, 98%, 60%, 0.3)`;
    
    document.documentElement.style.setProperty("--accent", accent);
    document.documentElement.style.setProperty("--accent-dark", accentDark);
    document.documentElement.style.setProperty("--accent-light", accentLight);
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
    const max = 4;
    return Math.max(-max, Math.min(max, v));
  }

  function createParticle(x, y, vx, vy, lightness, genSize = 1) {
    const particle = new Particle();
    particle.x = x;
    particle.y = y;
    particle.vx = clampVelocity(vx);
    particle.vy = clampVelocity(vy);
    particle.lightness = lightness;
    particle.generation = genSize;
    particle.radius = Math.max(1.5, 3 - genSize * 0.5 + Math.random() * 2);
    particle.opacity = Math.max(0.05, 0.15 - genSize * 0.03 + Math.random() * 0.08);
    particle.spawnCooldown = 0;
    particle.lifespan = 6000 + Math.random() * 4000;
    particle.birthTime = performance.now();
    return particle;
  }

  class Particle {
    constructor() {
      this.reset(true);
    }

    reset(initial) {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      const speed = 1.2 + Math.random() * 2.5;
      const angle = Math.random() * Math.PI * 2;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      this.radius = 2.5 + Math.random() * 3.5;
      this.opacity = 0.08 + Math.random() * 0.14;
      this.lightness = 45 + Math.random() * 25;
      this.spawnCooldown = 0;
      this.generation = 1;
      this.lifespan = 8000;
      this.birthTime = performance.now();
    }

    update(delta) {
      this.x += this.vx;
      this.y += this.vy;
      
      // Apply gentle chaos - brownian motion
      this.vx += (Math.random() - 0.5) * 0.08;
      this.vy += (Math.random() - 0.5) * 0.08;
      
      // Clamp velocity after adding chaos
      const maxVel = 4;
      const velocity = Math.hypot(this.vx, this.vy);
      if (velocity > maxVel) {
        const scale = maxVel / velocity;
        this.vx *= scale;
        this.vy *= scale;
      }
      
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

      // DVD screensaver-style replication on bounce
      if ((bouncedX || bouncedY) && this.spawnCooldown === 0 && this.generation < 3) {
        this.spawnCooldown = 150 + Math.random() * 100;
        
        // Create multiple child particles with chaotic directions
        const childCount = 1 + Math.floor(Math.random() * 2);
        for (let i = 0; i < childCount; i++) {
          const angle = Math.atan2(this.vy, this.vx) + (Math.random() - 0.5) * 0.6;
          const speed = Math.hypot(this.vx, this.vy) * (0.7 + Math.random() * 0.3);
          
          // Vary lightness for child particles (different intensities of teal)
          const childLightness = 40 + Math.random() * 30;
          
          spawnParticle(
            this.x + (Math.random() - 0.5) * 20,
            this.y + (Math.random() - 0.5) * 20,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            childLightness,
            this.generation + 1
          );
        }
      }
      
      // Fade out at end of lifespan
      const age = performance.now() - this.birthTime;
      if (age > this.lifespan * 0.8) {
        const fadeProgress = (age - this.lifespan * 0.8) / (this.lifespan * 0.2);
        this.opacity *= Math.max(0, 1 - fadeProgress);
      }
    }

    draw() {
      const gradient = ctx.createRadialGradient(
        this.x,
        this.y,
        0,
        this.x,
        this.y,
        this.radius * 5
      );
      
      const core = `hsla(${TEAL_HUE}, ${TEAL_SAT}%, ${this.lightness}%, ${this.opacity})`;
      const mid = `hsla(${TEAL_HUE}, ${TEAL_SAT - 5}%, ${this.lightness - 5}%, ${this.opacity * 0.6})`;
      const outer = `hsla(${TEAL_HUE}, ${TEAL_SAT}%, ${this.lightness}%, 0)`;
      
      gradient.addColorStop(0, core);
      gradient.addColorStop(0.4, mid);
      gradient.addColorStop(1, outer);

      ctx.beginPath();
      ctx.fillStyle = gradient;
      ctx.arc(this.x, this.y, this.radius * 5, 0, Math.PI * 2);
      ctx.fill();
      
      // Add subtle glow effect
      ctx.beginPath();
      ctx.strokeStyle = `hsla(${TEAL_HUE}, 98%, ${this.lightness}%, ${this.opacity * 0.3})`;
      ctx.lineWidth = 0.5;
      ctx.arc(this.x, this.y, this.radius * 6, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function spawnParticle(x, y, vx, vy, lightness, generation = 1) {
    if (particles.length >= maxCount) return;
    particles.push(createParticle(x, y, vx, vy, lightness, generation));
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

    // Set colors once - they never change
    setAccentColors();
    ctx.clearRect(0, 0, width, height);

    // Update and draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i];
      particle.update(delta);
      
      // Remove dead particles
      const age = performance.now() - particle.birthTime;
      if (age > particle.lifespan || particle.opacity <= 0) {
        particles.splice(i, 1);
      } else {
        particle.draw();
      }
    }
    
    // Spawn new particles if needed to maintain aesthetic
    if (particles.length < maxCount * 0.3) {
      particles.push(new Particle());
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
