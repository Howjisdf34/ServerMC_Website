/* ═══════════════════════════════════════════
   OHMDAIL — SCRIPT.JS
   Partículas · Status API · Interacción
════════════════════════════════════════════ */

// ── INIT AOS ──
AOS.init({
  duration: 700,
  easing: 'ease-out-cubic',
  once: true,
  offset: 60,
});

// ══════════════════════════════════════════════
// PARTÍCULAS — Efecto estilo Minecraft Bedrock
// ══════════════════════════════════════════════
(function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];
  let mouse = { x: -9999, y: -9999 };

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  // Tipos de "bloques" pixelados (inspirado en Minecraft)
  const COLORS = [
    'rgba(16, 185, 129, ',   // emerald
    'rgba(245, 158, 11, ',   // gold
    'rgba(6, 182, 212, ',    // teal
    'rgba(255, 255, 255, ',  // white
  ];

  class Particle {
    constructor() { this.reset(true); }

    reset(randomY = false) {
      this.x = Math.random() * W;
      this.y = randomY ? Math.random() * H : H + 10;
      this.size = Math.random() * 3 + 1; // px cuadrado (estilo bloque)
      this.speedY = -(Math.random() * 0.4 + 0.15);
      this.speedX = (Math.random() - 0.5) * 0.3;
      this.opacity = Math.random() * 0.35 + 0.05;
      this.maxOpacity = this.opacity;
      this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
      this.twinkleSpeed = Math.random() * 0.008 + 0.003;
      this.twinkleDir = 1;
      this.isSquare = Math.random() > 0.5; // mezcla círculos y cuadrados
    }

    update() {
      this.y += this.speedY;
      this.x += this.speedX;

      // Twinkle
      this.opacity += this.twinkleSpeed * this.twinkleDir;
      if (this.opacity >= this.maxOpacity || this.opacity <= 0.02) {
        this.twinkleDir *= -1;
      }

      // Mouse repel suave
      const dx = this.x - mouse.x;
      const dy = this.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) {
        const force = (120 - dist) / 120;
        this.x += (dx / dist) * force * 1.2;
        this.y += (dy / dist) * force * 1.2;
      }

      if (this.y < -10 || this.x < -20 || this.x > W + 20) this.reset();
    }

    draw() {
      ctx.fillStyle = this.color + this.opacity + ')';
      if (this.isSquare) {
        ctx.fillRect(this.x, this.y, this.size, this.size);
      } else {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function createParticles() {
    const count = Math.min(Math.floor(W * H / 14000), 120);
    particles = Array.from({ length: count }, () => new Particle());
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(loop);
  }

  window.addEventListener('resize', () => { resize(); createParticles(); });
  window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
  window.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });

  resize();
  createParticles();
  loop();
})();

// ══════════════════════════════════════════════
// NAVBAR — scroll effect
// ══════════════════════════════════════════════
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 30);
}, { passive: true });

// ══════════════════════════════════════════════
// HAMBURGER — menú móvil
// ══════════════════════════════════════════════
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');

hamburger.addEventListener('click', () => {
  mobileMenu.classList.toggle('open');
});

mobileMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => mobileMenu.classList.remove('open'));
});

// ══════════════════════════════════════════════
// COPIAR IP
// ══════════════════════════════════════════════
function copyIP() {
  const ip = document.getElementById('serverIP').textContent;
  const btn = document.getElementById('copyBtn');
  const text = document.getElementById('copyText');

  navigator.clipboard.writeText(ip).then(() => {
    btn.classList.add('copied');
    text.textContent = '¡IP Copiada! ✓';

    // Ripple effect
    const ripple = document.createElement('span');
    ripple.style.cssText = `
      position:absolute; border-radius:50%;
      background:rgba(255,255,255,0.2);
      width:20px; height:20px;
      top:50%; left:50%;
      transform:translate(-50%,-50%) scale(0);
      animation: ripple 0.5s ease-out forwards;
      pointer-events:none;
    `;
    btn.appendChild(ripple);

    if (!document.querySelector('#ripple-style')) {
      const style = document.createElement('style');
      style.id = 'ripple-style';
      style.textContent = '@keyframes ripple { to { transform:translate(-50%,-50%) scale(20); opacity:0; } }';
      document.head.appendChild(style);
    }

    setTimeout(() => {
      btn.classList.remove('copied');
      text.textContent = 'Copiar IP del Servidor';
      ripple.remove();
    }, 2200);
  }).catch(() => {
    // Fallback para navegadores sin clipboard API
    const tmp = document.createElement('input');
    tmp.value = ip;
    document.body.appendChild(tmp);
    tmp.select();
    document.execCommand('copy');
    tmp.remove();
    text.textContent = '¡IP Copiada! ✓';
    setTimeout(() => { text.textContent = 'Copiar IP del Servidor'; }, 2000);
  });
}

// ══════════════════════════════════════════════
// SERVER STATUS — API
// ══════════════════════════════════════════════
//
// Usa la API pública de mcsrvstat.us
// Cuando tengas tu IP real, cámbiala en SERVER_IP.
// También puedes cambiar a tu propia API backend.
//
const SERVER_IP = 'play.ohmdail.net'; // ← Cambia esto a tu IP real

async function checkServerStatus() {
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const playerCount = document.getElementById('playerCount');
  const maxPlayers = document.getElementById('maxPlayers');
  const pingEl = document.getElementById('ping');
  const playerBar = document.getElementById('playerBar');
  const versionEl = document.getElementById('serverVersion');

  // Estado cargando
  statusDot.className = 'status-dot';
  statusText.textContent = 'Verificando...';
  playerCount.textContent = '—';
  maxPlayers.textContent = '—';
  pingEl.textContent = '—';

  try {
    const start = Date.now();
    // API pública de Minecraft server status
    const res = await fetch(`https://api.mcsrvstat.us/3/${SERVER_IP}`);
    const latency = Date.now() - start;
    const data = await res.json();

    if (data.online) {
      statusDot.classList.add('online');
      statusText.textContent = 'En línea';
      statusText.style.color = 'var(--emerald-light)';

      const online = data.players?.online ?? 0;
      const max = data.players?.max ?? 0;

      // Animar contadores
      animateCount(playerCount, online);
      animateCount(maxPlayers, max);
      pingEl.textContent = latency + 'ms';
      pingEl.style.color = latency < 100 ? 'var(--emerald-light)' : latency < 200 ? 'var(--gold)' : '#ef4444';

      // Barra de jugadores
      const pct = max > 0 ? Math.min((online / max) * 100, 100) : 0;
      setTimeout(() => { playerBar.style.width = pct + '%'; }, 300);

      // Versión
      if (data.version) {
        versionEl.textContent = `Java Edition · ${data.version}`;
      }

    } else {
      statusDot.classList.add('offline');
      statusText.textContent = 'Fuera de línea';
      statusText.style.color = '#ef4444';
      playerCount.textContent = '0';
      maxPlayers.textContent = '0';
      pingEl.textContent = '—';
    }

  } catch (err) {
    // Error de red / CORS: muestra estado simulado para demo
    console.warn('No se pudo contactar la API:', err);
    setDemoStatus();
  }
}

// Estado demo (cuando no hay conexión o la IP aún no está configurada)
function setDemoStatus() {
  document.getElementById('statusDot').classList.add('online');
  document.getElementById('statusText').textContent = 'En línea';
  document.getElementById('statusText').style.color = 'var(--emerald-light)';
  animateCount(document.getElementById('playerCount'), 12);
  animateCount(document.getElementById('maxPlayers'), 50);
  document.getElementById('ping').textContent = '32ms';
  document.getElementById('ping').style.color = 'var(--emerald-light)';
  setTimeout(() => { document.getElementById('playerBar').style.width = '24%'; }, 300);
}

function animateCount(el, target) {
  let current = 0;
  const step = Math.max(1, Math.floor(target / 30));
  const interval = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current;
    if (current >= target) clearInterval(interval);
  }, 30);
}

// Llamar al cargar
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(checkServerStatus, 800);
});

// Auto-refresh cada 60s
setInterval(checkServerStatus, 60000);

// ══════════════════════════════════════════════
// FILTRO DE COMANDOS
// ══════════════════════════════════════════════
document.querySelectorAll('.cmd-filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.cmd-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const filter = btn.dataset.filter;
    document.querySelectorAll('.cmd-table tbody tr').forEach(row => {
      if (filter === 'all' || row.dataset.cat === filter) {
        row.classList.remove('hidden');
        row.style.animation = 'none';
        // Trigger reflow
        void row.offsetHeight;
        row.style.animation = '';
      } else {
        row.classList.add('hidden');
      }
    });
  });
});

// ══════════════════════════════════════════════
// SMOOTH SCROLL para anclas
// ══════════════════════════════════════════════
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
