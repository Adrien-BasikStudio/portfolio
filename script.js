/* ===========================
   BASIK STUDIO — JS
   =========================== */

// ===== Animation dots grid =====
function initCanvas() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const COLS = 18;
  const ROWS = 12;
  let W, H, dots;
  let offset = 0;

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    buildDots();
  }

  function buildDots() {
    dots = [];
    const cx = W / 2;
    const cy = H / 2;
    const fov = 400;

    for (let row = -ROWS; row <= ROWS; row++) {
      for (let col = -COLS; col <= COLS; col++) {
        dots.push({ gx: col, gy: row });
      }
    }
  }

  function project(x3d, y3d, z3d) {
    const fov = 420;
    const scale = fov / (fov + z3d);
    return {
      x: W / 2 + x3d * scale,
      y: H / 2 + y3d * scale,
      scale
    };
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    const spacing = 80;
    const depth   = 300;
    const speed   = 0.4;
    const t       = Date.now() * 0.001 * speed;
    const zOffset = (t * depth) % depth;

    // Trier par z décroissant pour peindre en arrière
    const items = [];
    for (let row = -ROWS; row <= ROWS; row++) {
      for (let col = -COLS; col <= COLS; col++) {
        for (let layer = 0; layer <= 6; layer++) {
          const z = ((layer * depth - zOffset) % (depth * 7)) - depth * 2;
          items.push({ gx: col, gy: row, z });
        }
      }
    }
    items.sort((a, b) => b.z - a.z);

    for (const { gx, gy, z } of items) {
      if (z < -depth * 0.5 || z > depth * 5) continue;

      const p = project(gx * spacing, gy * spacing, z);
      if (p.x < -10 || p.x > W + 10 || p.y < -10 || p.y > H + 10) continue;

      const alpha = Math.min(1, Math.max(0, (1 - z / (depth * 4.5)) * p.scale * 2.5));
      const r     = Math.max(0.5, p.scale * 5);

      // Lignes horizontales
      const right = project((gx + 1) * spacing, gy * spacing, z);
      if (right.x > -10 && right.x < W + 10) {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(right.x, right.y);
        ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.18})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // Lignes verticales
      const down = project(gx * spacing, (gy + 1) * spacing, z);
      if (down.y > -10 && down.y < H + 10) {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(down.x, down.y);
        ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.18})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // Point
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${alpha * 0.9})`;
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  resize();
  draw();
}

// ===== Année footer =====
document.getElementById('year').textContent = new Date().getFullYear();

// ===== Burger menu =====
const burger = document.querySelector('.nav__burger');
const navLinks = document.querySelector('.nav__links');

function toggleMenu(force) {
  const isOpen = force !== undefined ? force : !burger.classList.contains('open');
  burger.classList.toggle('open', isOpen);
  navLinks.classList.toggle('open', isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : '';
}

burger?.addEventListener('click', () => toggleMenu());

// Fermer au clic sur un lien
navLinks?.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => toggleMenu(false));
});

// Fermer avec Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') toggleMenu(false);
});

// ===== Chargement des projets =====
const grid = document.getElementById('projects-grid');
const filtersContainer = document.querySelector('.projects__filters');
const statProjects = document.getElementById('stat-projects');

let allProjects = [];

async function loadProjects() {
  try {
    const res = await fetch('projects.json');
    const data = await res.json();
    allProjects = data.projects || [];

    // Compteur animé
    animateCounter(statProjects, allProjects.length);

    // Filtres dynamiques
    buildFilters(allProjects);

    // Affichage
    renderProjects(allProjects);
  } catch (e) {
    grid.innerHTML = '<p style="color:#6b6b6b;grid-column:1/-1">Impossible de charger les projets.</p>';
  }
}

function buildFilters(projects) {
  const tags = new Set();
  projects.forEach(p => (p.tags || []).forEach(t => tags.add(t)));

  tags.forEach(tag => {
    const btn = document.createElement('button');
    btn.className = 'filter';
    btn.dataset.filter = tag;
    btn.textContent = tag;
    filtersContainer.appendChild(btn);
  });

  filtersContainer.addEventListener('click', e => {
    if (!e.target.classList.contains('filter')) return;
    document.querySelectorAll('.filter').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    const filter = e.target.dataset.filter;
    const filtered = filter === 'all' ? allProjects : allProjects.filter(p => (p.tags || []).includes(filter));
    renderProjects(filtered);
  });
}

function renderProjects(projects) {
  if (!projects.length) {
    grid.innerHTML = '<p style="color:#6b6b6b;grid-column:1/-1;padding:40px 0">Aucun projet dans cette catégorie.</p>';
    return;
  }

  grid.innerHTML = projects.map((p, i) => `
    <article class="project-card" data-index="${i}" role="button" tabindex="0" aria-label="Voir le projet ${p.title}">
      ${p.image
        ? `<img class="project-card__img" src="${p.image}" alt="${p.title}" loading="lazy" />`
        : `<div class="project-card__img--placeholder">◈</div>`
      }
      <div class="project-card__body">
        <div class="project-card__tags">
          ${(p.tags || []).map(t => `<span class="project-card__tag">${t}</span>`).join('')}
        </div>
        <h3 class="project-card__title">${p.title}</h3>
        <p class="project-card__desc">${p.shortDesc || ''}</p>
      </div>
    </article>
  `).join('');

  // Événements click sur les cartes
  grid.querySelectorAll('.project-card').forEach(card => {
    const open = () => openModal(projects[+card.dataset.index]);
    card.addEventListener('click', open);
    card.addEventListener('keydown', e => { if (e.key === 'Enter') open(); });
  });
}

// ===== Modal =====
const modal = document.getElementById('project-modal');
const modalBody = document.getElementById('modal-body');
const modalClose = document.getElementById('modal-close');
const modalOverlay = document.getElementById('modal-overlay');

function openModal(project) {
  modalBody.innerHTML = `
    ${project.image ? `<img src="${project.image}" alt="${project.title}" />` : ''}
    <div class="modal__info">
      <div class="modal__tags">
        ${(project.tags || []).map(t => `<span class="project-card__tag">${t}</span>`).join('')}
      </div>
      <h3>${project.title}</h3>
      <p>${project.description || project.shortDesc || ''}</p>
      ${project.url ? `<a href="${project.url}" target="_blank" rel="noopener" class="modal__link">Voir le projet →</a>` : ''}
    </div>
  `;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modal.classList.remove('open');
  document.body.style.overflow = '';
}

modalClose?.addEventListener('click', closeModal);
modalOverlay?.addEventListener('click', closeModal);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ===== Compteur animé =====
function animateCounter(el, target) {
  if (!el) return;
  let count = 0;
  const step = Math.ceil(target / 40);
  const timer = setInterval(() => {
    count = Math.min(count + step, target);
    el.textContent = count;
    if (count >= target) clearInterval(timer);
  }, 30);
}

// ===== Init =====
loadProjects();
initCanvas();
