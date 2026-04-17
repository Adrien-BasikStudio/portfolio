/* ===========================
   BASIK STUDIO — JS
   =========================== */

// ===== Vanta DOTS background =====
function initCanvas() {
  if (typeof VANTA === 'undefined') return;
  VANTA.DOTS({
    el: '#home',
    mouseControls: true,
    touchControls: true,
    gyroControls: false,
    minHeight: 200,
    minWidth: 200,
    scale: 1.0,
    scaleMobile: 1.0,
    color: 0x3d9eff,
    color2: 0xffffff,
    backgroundColor: 0x0d0d0d,
    size: 3.5,
    spacing: 30.0,
    showLines: false
  });
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
let currentProjects = [];
let visibleCount = 0;

function getPageSize() {
  return window.innerWidth <= 768 ? 3 : 9;
}

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

function cardHTML(p, i) {
  return `
    <article class="project-card" data-index="${i}" role="button" tabindex="0" aria-label="Voir le projet ${p.title}">
      <div class="project-card__media">
        ${p.image
          ? `<img class="project-card__img" src="${p.image}" alt="${p.title}" loading="lazy" />`
          : `<div class="project-card__img--placeholder">◈</div>`
        }
      </div>
      <div class="project-card__body">
        <div class="project-card__tags">
          ${(p.tags || []).map(t => `<span class="project-card__tag">${t}</span>`).join('')}
        </div>
        <h3 class="project-card__title">${p.title}</h3>
        <p class="project-card__desc">${p.shortDesc || ''}</p>
      </div>
    </article>`;
}

function attachCardEvents(projects) {
  grid.querySelectorAll('.project-card').forEach(card => {
    const open = () => openModal(projects[+card.dataset.index]);
    card.addEventListener('click', open);
    card.addEventListener('keydown', e => { if (e.key === 'Enter') open(); });
  });
}

function renderProjects(projects) {
  currentProjects = projects;
  visibleCount = 0;

  if (!projects.length) {
    grid.innerHTML = '<p style="color:#6b6b6b;grid-column:1/-1;padding:40px 0">Aucun projet dans cette catégorie.</p>';
    updateMoreBtn(projects);
    return;
  }

  visibleCount = Math.min(getPageSize(), projects.length);
  grid.innerHTML = projects.slice(0, visibleCount).map((p, i) => cardHTML(p, i)).join('');
  attachCardEvents(projects);
  updateMoreBtn(projects);
}

function showMore() {
  const pageSize = getPageSize();
  const from = visibleCount;
  const to = Math.min(visibleCount + pageSize, currentProjects.length);

  currentProjects.slice(from, to).forEach((p, i) => {
    const div = document.createElement('div');
    div.innerHTML = cardHTML(p, from + i);
    const card = div.firstElementChild;
    grid.appendChild(card);
    const open = () => openModal(currentProjects[+card.dataset.index]);
    card.addEventListener('click', open);
    card.addEventListener('keydown', e => { if (e.key === 'Enter') open(); });
  });

  visibleCount = to;
  updateMoreBtn(currentProjects);
}

function updateMoreBtn(projects) {
  let btn = document.getElementById('projects-more');
  if (!btn) {
    btn = document.createElement('div');
    btn.id = 'projects-more';
    btn.className = 'projects__more';
    grid.parentElement.appendChild(btn);
  }

  if (visibleCount < projects.length) {
    const remaining = projects.length - visibleCount;
    btn.innerHTML = `<button class="btn btn--ghost projects__more-btn" onclick="showMore()">Voir plus <span>(${remaining})</span></button>`;
    btn.style.display = 'flex';
  } else {
    btn.style.display = 'none';
  }
}

// ===== Modal =====
const modal = document.getElementById('project-modal');
const modalBody = document.getElementById('modal-body');
const modalClose = document.getElementById('modal-close');
const modalOverlay = document.getElementById('modal-overlay');

function openModal(project) {
  // Génère les liens : priorité au tableau "links", sinon l'url simple
  let linksHtml = '';
  if (project.links && project.links.length) {
    linksHtml = `<div class="modal__links">
      ${project.links.map(l => `<a href="${l.url}" target="_blank" rel="noopener" class="modal__link">${l.label} →</a>`).join('')}
    </div>`;
  } else if (project.url) {
    linksHtml = `<a href="${project.url}" target="_blank" rel="noopener" class="modal__link">Voir le projet →</a>`;
  }

  modalBody.innerHTML = `
    ${project.image ? `<img src="${project.image}" alt="${project.title}" />` : ''}
    <div class="modal__info">
      <div class="modal__tags">
        ${(project.tags || []).map(t => `<span class="project-card__tag">${t}</span>`).join('')}
      </div>
      <h3>${project.title}</h3>
      <p>${project.description || project.shortDesc || ''}</p>
      ${linksHtml}
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
