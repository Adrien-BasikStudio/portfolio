/* ===========================
   BASIK STUDIO — JS
   =========================== */

// ===== Animation dots grid (mouse parallax) =====
function initCanvas() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H;
  // Point de fuite cible et courant (interpolé)
  let mouseX = 0.5, mouseY = 0.5;
  let currentVPX = 0, currentVPY = 0;

  const SPACING = 90;   // espacement entre les points
  const COLS    = 22;   // nombre de colonnes de chaque côté du centre
  const ROWS    = 14;   // nombre de lignes de chaque côté du centre
  const FOV     = 500;  // profondeur perspective
  const LAYERS  = [0, 120, 260, 420, 600, 820]; // plans en Z

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  // Suivi souris (normalisé 0→1)
  window.addEventListener('mousemove', e => {
    mouseX = e.clientX / window.innerWidth;
    mouseY = e.clientY / window.innerHeight;
  });

  function project(x3d, y3d, z, vpx, vpy) {
    const scale = FOV / (FOV + z);
    return {
      x: vpx + x3d * scale,
      y: vpy + y3d * scale,
      scale
    };
  }

  function draw() {
    // Interpolation douce du point de fuite vers la souris
    const targetVPX = W  * (0.35 + mouseX * 0.3);
    const targetVPY = H  * (0.35 + mouseY * 0.3);
    currentVPX += (targetVPX - currentVPX) * 0.04;
    currentVPY += (targetVPY - currentVPY) * 0.04;

    ctx.clearRect(0, 0, W, H);

    // Dessiner du plan le plus loin au plus proche
    const reversedLayers = [...LAYERS].reverse();

    for (const z of reversedLayers) {
      const zNorm  = z / LAYERS[LAYERS.length - 1]; // 0 = loin, 1 = proche
      const alpha  = 0.08 + zNorm * 0.55;
      const radius = 0.8 + zNorm * 3.5;

      for (let row = -ROWS; row <= ROWS; row++) {
        for (let col = -COLS; col <= COLS; col++) {
          const p = project(col * SPACING, row * SPACING, z, currentVPX, currentVPY);

          // Ignorer si hors écran
          if (p.x < -20 || p.x > W + 20 || p.y < -20 || p.y > H + 20) continue;

          // Ligne vers le voisin droit
          if (col < COLS) {
            const r = project((col + 1) * SPACING, row * SPACING, z, currentVPX, currentVPY);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(r.x, r.y);
            ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.3})`;
            ctx.lineWidth = 0.4;
            ctx.stroke();
          }

          // Ligne vers le voisin bas
          if (row < ROWS) {
            const d = project(col * SPACING, (row + 1) * SPACING, z, currentVPX, currentVPY);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(d.x, d.y);
            ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.3})`;
            ctx.lineWidth = 0.4;
            ctx.stroke();
          }

          // Point
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${alpha})`;
          ctx.fill();
        }
      }
    }

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  resize();
  currentVPX = W * 0.5;
  currentVPY = H * 0.5;
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
