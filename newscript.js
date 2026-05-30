/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   RENNICK PORTFOLIO – SCRIPT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

/* ────────────────────────────
   1. CANVAS / STAR BACKGROUND
──────────────────────────────*/
const canvas = document.getElementById("stars");
const ctx    = canvas.getContext("2d");

let stars         = [];
let shootingStars = [];
let mouseX = 0, mouseY = 0;

const STAR_COUNT          = 180;
const SHOOTING_STAR_CHANCE = 0.012;   // ~1 every few seconds
const BLUE_STAR_CHANCE     = 0.55;    // majority white/blue
const GOLD_CHANCE          = 0.08;    // rare gold
const RED_CHANCE           = 0.04;    // even rarer red

// Rare scheduled events every 2–3 min
let lastRareEvent = Date.now();
const RARE_INTERVAL_MIN = 120_000; // 2 min
const RARE_INTERVAL_MAX = 180_000; // 3 min
let nextRareInterval = randRange(RARE_INTERVAL_MIN, RARE_INTERVAL_MAX);

function randRange(min, max) { return Math.random() * (max - min) + min; }

function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", () => { resizeCanvas(); initStars(); });
resizeCanvas();

/* Cursor parallax */
window.addEventListener("mousemove", e => {
  mouseX = (e.clientX / window.innerWidth  - 0.5) * 18;
  mouseY = (e.clientY / window.innerHeight - 0.5) * 18;
});

/* Cursor glow follow */
const cursorGlow = document.getElementById("cursorGlow");
window.addEventListener("mousemove", e => {
  cursorGlow.style.left = e.clientX + "px";
  cursorGlow.style.top  = e.clientY + "px";
});

/* ── Stars init ── */
function initStars() {
  stars = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    const isBlue = Math.random() < 0.3;
    stars.push({
      x:     Math.random() * canvas.width,
      y:     Math.random() * canvas.height,
      size:  Math.random() * 1.6 + 0.2,
      speed: Math.random() * 0.2 + 0.04,
      depth: Math.random() * 0.6 + 0.4,
      color: isBlue ? `rgba(140,220,255,${Math.random() * 0.6 + 0.4})`
                    : `rgba(255,255,255,${Math.random() * 0.7 + 0.3})`
    });
  }
}
initStars();

/* ── Shooting star spawner ── */
function spawnShootingStar(type = "white") {
  const colorMap = {
    white: { head: "255,255,255", tail: "255,255,255", width: 2, life: 0.016 },
    blue:  { head: "100,220,255", tail: "80,180,255",  width: 2, life: 0.014 },
    gold:  { head: "255,220,60",  tail: "255,180,30",  width: 3, life: 0.010 },
    red:   { head: "255,80,80",   tail: "255,40,40",   width: 3.5, life: 0.008 }
  };
  const c = colorMap[type] || colorMap.white;

  shootingStars.push({
    x:       canvas.width  + randRange(50, 300),
    y:       randRange(0,   canvas.height * 0.65),
    length:  randRange(110, 220),
    speed:   randRange(16, 28),
    opacity: 1,
    type,
    head:    c.head,
    tail:    c.tail,
    width:   c.width,
    fade:    c.life
  });
}

function pickRandomType() {
  const r = Math.random();
  if      (r < BLUE_STAR_CHANCE)                       return "blue";
  else if (r < BLUE_STAR_CHANCE + GOLD_CHANCE)          return "gold";
  else if (r < BLUE_STAR_CHANCE + GOLD_CHANCE + RED_CHANCE) return "red";
  else                                                  return "white";
}

/* ── Rare event burst ── */
function triggerRareBurst() {
  // 2–4 gold and/or red shooting stars in quick succession
  const count = Math.floor(randRange(2, 5));
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      spawnShootingStar(Math.random() < 0.5 ? "gold" : "red");
    }, i * randRange(120, 300));
  }
}

/* ── Main animation loop ── */
function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  /* Stars */
  stars.forEach(s => {
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.arc(
      s.x + mouseX * s.depth,
      s.y + mouseY * s.depth,
      s.size, 0, Math.PI * 2
    );
    ctx.fill();

    s.y += s.speed;
    if (s.y > canvas.height) {
      s.y = 0;
      s.x = Math.random() * canvas.width;
    }
  });

  /* Random shooting star trigger */
  if (Math.random() < SHOOTING_STAR_CHANCE) {
    spawnShootingStar(pickRandomType());
  }

  /* Rare event check */
  const now = Date.now();
  if (now - lastRareEvent >= nextRareInterval) {
    triggerRareBurst();
    lastRareEvent    = now;
    nextRareInterval = randRange(RARE_INTERVAL_MIN, RARE_INTERVAL_MAX);
  }

  /* Draw shooting stars */
  for (let i = shootingStars.length - 1; i >= 0; i--) {
    const s = shootingStars[i];

    const grad = ctx.createLinearGradient(
      s.x, s.y,
      s.x - s.length, s.y + s.length * 0.3
    );
    grad.addColorStop(0, `rgba(${s.head},${s.opacity})`);
    grad.addColorStop(1, `rgba(${s.tail},0)`);

    ctx.strokeStyle = grad;
    ctx.lineWidth   = s.width;
    ctx.lineCap     = "round";

    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x - s.length, s.y + s.length * 0.3);
    ctx.stroke();

    /* Glow for rare types */
    if (s.type === "gold" || s.type === "red") {
      ctx.shadowColor = `rgba(${s.head}, 0.8)`;
      ctx.shadowBlur  = 12;
      ctx.stroke();
      ctx.shadowBlur  = 0;
    }

    s.x       -= s.speed;
    s.y       += s.speed * 0.35;
    s.opacity -= s.fade;

    if (s.opacity <= 0) shootingStars.splice(i, 1);
  }

  requestAnimationFrame(animate);
}
animate();


/* ────────────────────────────
   2. TYPED TEXT EFFECT
──────────────────────────────*/
const phrases = [
  "Cybersecurity Student",
  "Digital Forensics Analyst",
  "Malware Investigator",
  "Network Security Specialist",
  "Future Founder @ CyberGuard Solutions"
];
let phraseIdx  = 0;
let charIdx    = 0;
let deleting   = false;
let typePause  = 0;
const typedEl  = document.getElementById("typedText");

function typeLoop() {
  if (!typedEl) return;
  const current = phrases[phraseIdx];

  if (!deleting && charIdx <= current.length) {
    typedEl.textContent = current.slice(0, charIdx++);
    setTimeout(typeLoop, 65);
  } else if (!deleting && charIdx > current.length) {
    deleting = true;
    setTimeout(typeLoop, 1800);
  } else if (deleting && charIdx > 0) {
    typedEl.textContent = current.slice(0, --charIdx);
    setTimeout(typeLoop, 35);
  } else {
    deleting = false;
    phraseIdx = (phraseIdx + 1) % phrases.length;
    setTimeout(typeLoop, 350);
  }
}
typeLoop();


/* ────────────────────────────
   3. NAV SCROLL SHRINK
──────────────────────────────*/
const mainNav = document.getElementById("mainNav");
window.addEventListener("scroll", () => {
  if (window.scrollY > 60) {
    mainNav.style.padding = "0.6rem 2.5rem";
  } else {
    mainNav.style.padding = "1rem 2.5rem";
  }
});


/* ────────────────────────────
   4. HAMBURGER MENU
──────────────────────────────*/
const hamburger  = document.getElementById("hamburger");
const mobileMenu = document.getElementById("mobileMenu");

hamburger.addEventListener("click", () => {
  hamburger.classList.toggle("open");
  mobileMenu.classList.toggle("open");
});

document.querySelectorAll(".mobile-link").forEach(link => {
  link.addEventListener("click", () => {
    hamburger.classList.remove("open");
    mobileMenu.classList.remove("open");
  });
});


/* ────────────────────────────
   5. SCROLL FADE-IN
──────────────────────────────*/
const fadeTargets = document.querySelectorAll(
  ".section-header, .about-text, .about-aside, .skill-category, " +
  ".project-card, .course-card, .cert-card, .timeline-item, " +
  ".contact-info, .contact-form, .welcome-badge, .welcome-name, " +
  ".welcome-title, .welcome-tagline, .welcome-cta, .welcome-stats"
);

fadeTargets.forEach(el => el.classList.add("fade-in"));

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

fadeTargets.forEach(el => observer.observe(el));


/* ────────────────────────────
   6. LIQUID GLASS RIPPLE
──────────────────────────────*/
document.querySelectorAll(".liquid-glass").forEach(el => {
  el.addEventListener("click", function(e) {
    const rect   = this.getBoundingClientRect();
    const ripple = document.createElement("span");
    const size   = Math.max(rect.width, rect.height) * 2;
    const x      = e.clientX - rect.left - size / 2;
    const y      = e.clientY - rect.top  - size / 2;

    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: radial-gradient(circle, rgba(255,255,255,0.25) 0%, transparent 60%);
      border-radius: 50%;
      pointer-events: none;
      animation: rippleAnim 0.6s ease-out forwards;
    `;
    this.appendChild(ripple);
    setTimeout(() => ripple.remove(), 650);
  });
});

// Inject ripple keyframe
const style = document.createElement("style");
style.textContent = `
  @keyframes rippleAnim {
    from { transform: scale(0); opacity: 1; }
    to   { transform: scale(1); opacity: 0; }
  }
`;
document.head.appendChild(style);


/* ────────────────────────────
   7. ACTIVE NAV HIGHLIGHT
──────────────────────────────*/
const sections  = document.querySelectorAll("section[id]");
const navLinks  = document.querySelectorAll(".nav-link");

const navObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      navLinks.forEach(a => {
        a.style.color = a.getAttribute("href") === `#${id}`
          ? "var(--accent)" : "";
      });
    }
  });
}, { rootMargin: "-40% 0px -50% 0px" });

sections.forEach(s => navObserver.observe(s));
