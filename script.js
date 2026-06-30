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

const PAGE_SIZE = 6;
let windowStart = 0;
let navPrev = null;
let navNext = null;

async function loadProjects() {
  try {
    const res = await fetch('projects.json');
    const data = await res.json();
    allProjects = data.projects || [];

    animateCounter(statProjects, allProjects.length);
    buildFilters(allProjects);
    setupProjectsNav();
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

function buildMeta(p) {
  const parts = [];
  if (p.year)  parts.push(p.year);
  if (p.role)  parts.push(p.role);
  if (p.stack && p.stack.length) parts.push(p.stack.join(', '));
  return parts.length ? parts.join(' · ') : '';
}

function cardHTML(p, i) {
  const ctaLabel = p.url ? 'Voir le projet →' : 'En savoir plus →';
  return `
    <article class="project-card" data-index="${i}" role="button" tabindex="0" aria-label="Voir le projet ${p.title}">
      ${p.image
        ? `<img class="project-card__img" src="${p.image}" alt="${p.title}" loading="lazy" />`
        : `<div class="project-card__img--placeholder">◈</div>`
      }
      <div class="project-card__overlay">
        <div class="project-card__tags">
          ${(p.tags || []).map(t => `<span class="project-card__tag">${t}</span>`).join('')}
        </div>
        <h3 class="project-card__title">${p.title}</h3>
        <p class="project-card__desc">${p.shortDesc || ''}</p>
        <span class="project-card__cta">${ctaLabel}</span>
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
  windowStart = 0;

  if (!projects.length) {
    grid.innerHTML = '<p style="color:#6b6b6b;flex:1;text-align:center;padding:40px 0">Aucun projet dans cette catégorie.</p>';
    updateNavButtons(0);
    return;
  }

  renderWindow();
}

function renderWindow() {
  const len = currentProjects.length;
  const size = Math.min(PAGE_SIZE, len);

  grid.innerHTML = '';
  for (let i = 0; i < size; i++) {
    const idx = (windowStart + i) % len;
    grid.insertAdjacentHTML('beforeend', cardHTML(currentProjects[idx], idx));
  }
  attachCardEvents(currentProjects);
  updateNavButtons(len);
}

function navigate(dir) {
  const len = currentProjects.length;
  if (len <= PAGE_SIZE) return;

  grid.style.transition = 'opacity 0.13s ease, transform 0.13s ease';
  grid.style.opacity = '0.45';
  grid.style.transform = dir > 0 ? 'translateX(-1.5%)' : 'translateX(1.5%)';

  setTimeout(() => {
    windowStart = ((windowStart + dir) % len + len) % len;
    renderWindow();
    grid.style.transform = dir > 0 ? 'translateX(1%)' : 'translateX(-1%)';
    grid.style.opacity = '1';
    requestAnimationFrame(() => {
      grid.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
      grid.style.transform = 'translateX(0)';
    });
  }, 140);
}

function setupProjectsNav() {
  const controls = document.createElement('div');
  controls.className = 'projects__controls';

  navPrev = document.createElement('button');
  navPrev.className = 'projects__nav-btn';
  navPrev.setAttribute('aria-label', 'Projets précédents');
  navPrev.textContent = '←';
  navPrev.addEventListener('click', () => navigate(-1));

  navNext = document.createElement('button');
  navNext.className = 'projects__nav-btn';
  navNext.setAttribute('aria-label', 'Projets suivants');
  navNext.textContent = '→';
  navNext.addEventListener('click', () => navigate(+1));

  controls.appendChild(navPrev);
  controls.appendChild(navNext);
  grid.parentElement.appendChild(controls);
}

function updateNavButtons(len) {
  if (!navPrev) return;
  navPrev.parentElement.style.display = len > PAGE_SIZE ? 'flex' : 'none';
}

// ===== Modal =====
const modal = document.getElementById('project-modal');
const modalBody = document.getElementById('modal-body');
const modalClose = document.getElementById('modal-close');
const modalOverlay = document.getElementById('modal-overlay');

function openModal(project) {
  // Genère les liens : priorité au tableau "links", sinon l'url simple
  let linksHtml = '';
  if (project.links && project.links.length) {
    linksHtml = `<div class="modal__links">
      ${project.links.map(l => `<a href="${l.url}" target="_blank" rel="noopener" class="modal__link">${l.label} →</a>`).join('')}
    </div>`;
  } else if (project.url) {
    linksHtml = `<a href="${project.url}" target="_blank" rel="noopener" class="modal__link">Voir le projet →</a>`;
  }

  // Galerie : utilise project.gallery si présent et non vide, sinon fallback sur project.image
  const galleryImages = (project.gallery && project.gallery.length)
    ? project.gallery
    : (project.image ? [project.image] : []);

  let galleryHtml = '';
  if (galleryImages.length === 1) {
    galleryHtml = `<img src="${galleryImages[0]}" alt="${project.title}" />`;
  } else if (galleryImages.length > 1) {
    galleryHtml = `
      <div class="modal__gallery">
        <img class="modal__main-img" id="modal-main-img" src="${galleryImages[0]}" alt="${project.title}" />
        <div class="modal__thumbs">
          ${galleryImages.map((g, i) => `
            <button type="button" class="modal__thumb${i === 0 ? ' is-active' : ''}" data-src="${g}" aria-label="Image ${i+1} sur ${galleryImages.length}">
              <img src="${g}" alt="" loading="lazy" />
            </button>
          `).join('')}
        </div>
      </div>`;
  }

  const meta = buildMeta(project);

  modalBody.innerHTML = `
    ${galleryHtml}
    <div class="modal__info">
      <div class="modal__tags">
        ${(project.tags || []).map(t => `<span class="project-card__tag">${t}</span>`).join('')}
      </div>
      <h3>${project.title}</h3>
      ${meta ? `<div class="modal__meta">${meta}</div>` : ''}
      <p>${project.description || project.shortDesc || ''}</p>
      ${linksHtml}
    </div>
  `;

  // Active les thumbnails (swap de l'image principale)
  const thumbs = modalBody.querySelectorAll('.modal__thumb');
  const mainImg = modalBody.querySelector('#modal-main-img');
  thumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
      thumbs.forEach(t => t.classList.remove('is-active'));
      thumb.classList.add('is-active');
      mainImg.src = thumb.dataset.src;
    });
  });

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

// ===== Formulaire de contact =====
const contactForm = document.getElementById('contact-form');

if (contactForm) {
  const submitBtn  = document.getElementById('cf-submit');
  const feedback   = document.getElementById('cf-feedback');

  contactForm.addEventListener('submit', async e => {
    e.preventDefault();
    feedback.textContent = '';
    feedback.className = 'contact-form__feedback';

    // Validation front légère
    let valid = true;
    ['cf-email', 'cf-message'].forEach(id => {
      const el = document.getElementById(id);
      if (!el.value.trim()) { el.classList.add('error'); valid = false; }
      else el.classList.remove('error');
    });
    if (!valid) {
      feedback.textContent = 'Merci de remplir les champs obligatoires.';
      feedback.classList.add('error');
      return;
    }

    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    try {
      const res  = await fetch('contact.php', { method: 'POST', body: new FormData(contactForm) });
      const data = await res.json();

      if (data.success) {
        feedback.textContent = data.message;
        feedback.classList.add('success');
        contactForm.reset();
      } else {
        feedback.textContent = data.message;
        feedback.classList.add('error');
      }
    } catch {
      feedback.textContent = "Erreur réseau. Réessayez ou écrivez à ciampone@ik.me";
      feedback.classList.add('error');
    } finally {
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
    }
  });

  // Retire la classe error au premier keystroke
  contactForm.querySelectorAll('input, textarea').forEach(el => {
    el.addEventListener('input', () => el.classList.remove('error'));
  });
}

// ===== Scroll progress bar =====
const scrollProgress = document.getElementById('scroll-progress');
if (scrollProgress) {
  const updateProgress = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    scrollProgress.style.width = pct + '%';
  };
  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress);
  updateProgress();
}

// ===== Active section dans la nav =====
const sectionNavLinks = document.querySelectorAll('.nav__links a[href^="#"]');
const navSections = document.querySelectorAll('section[id]');

if (sectionNavLinks.length && navSections.length) {
  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        sectionNavLinks.forEach(link => {
          const href = link.getAttribute('href');
          link.classList.toggle('is-current', href === '#' + id);
        });
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });

  navSections.forEach(s => sectionObserver.observe(s));
}

// ===== Fade-in au scroll =====
const fadeTargets = document.querySelectorAll('.section');
if (fadeTargets.length) {
  const fadeObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        fadeObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -80px 0px' });

  fadeTargets.forEach(el => fadeObserver.observe(el));
}

// ===== Card Stack Gallery =====
let allPhotos       = [];
let csActive        = 0;
let currentPhotoIndex = 0;
let csDragStartX    = null;
let csDragDx        = 0;
let csIsDragging    = false;
let csDragStartTime = null;

const CS_SPREAD_DEG    = 42;
const CS_DEPTH_PX      = 90;
const CS_TILT_X        = 10;
const CS_ACTIVE_LIFT   = 22;
const CS_ACTIVE_SCALE  = 1.04;
const CS_INACTIVE_SCALE = 0.92;

function csMaxOffset() { return window.innerWidth < 768 ? 2 : 3; }
function csSpacing()   {
  if (window.innerWidth < 480) return 88;
  if (window.innerWidth < 768) return 108;
  return 128;
}
function csStepDeg()   { return CS_SPREAD_DEG / csMaxOffset(); }
function csWrap(n, len) { return ((n % len) + len) % len; }

function csSignedOffset(i, active, len) {
  const raw = i - active;
  if (len <= 1) return raw;
  const alt = raw > 0 ? raw - len : raw + len;
  return Math.abs(alt) < Math.abs(raw) ? alt : raw;
}

function csGetTransform(off, abs) {
  const isActive = off === 0;
  const x        = off * csSpacing();
  const y        = abs * 8;
  const rotZ     = off * csStepDeg();
  const rotX     = isActive ? 0 : CS_TILT_X;
  const scale    = isActive ? CS_ACTIVE_SCALE : CS_INACTIVE_SCALE;
  const lift     = isActive ? -CS_ACTIVE_LIFT : 0;
  return `translateX(${x}px) translateY(${y + lift}px) rotateZ(${rotZ}deg) rotateX(${rotX}deg) scale(${scale})`;
}

async function loadCardStack() {
  const stage = document.getElementById('cs-stage');
  if (!stage) return;
  try {
    const res  = await fetch('photos.json');
    const data = await res.json();
    const raw  = data.photos || [];
    for (let i = raw.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [raw[i], raw[j]] = [raw[j], raw[i]];
    }
    allPhotos = raw;
    if (!allPhotos.length) { document.getElementById('gallery').style.display = 'none'; return; }
    csCreateCards(stage);
    csUpdatePositions();
    csRenderDots();
    csBind(stage);
  } catch {
    document.getElementById('gallery').style.display = 'none';
  }
}

function csCreateCards(stage) {
  allPhotos.forEach((p, i) => {
    const card = document.createElement('div');
    card.className    = 'cs-card';
    card.dataset.index = i;

    const img = document.createElement('img');
    img.src       = p.thumb || p.src;
    img.alt       = p.alt   || '';
    img.loading   = i < 4 ? 'eager' : 'lazy';
    img.draggable = false;
    img.addEventListener('error', () => { card.style.display = 'none'; });
    card.appendChild(img);

    const overlay = document.createElement('div');
    overlay.className = 'cs-card__overlay';
    card.appendChild(overlay);

    card.addEventListener('click', () => {
      if (csIsDragging) return;
      const idx = parseInt(card.dataset.index);
      const off = csSignedOffset(idx, csActive, allPhotos.length);
      if (off === 0) {
        openLightbox(idx);
      } else {
        csActive = idx;
        csUpdatePositions();
        csRenderDots();
      }
    });

    stage.appendChild(card);
  });
}

function csUpdatePositions() {
  const stage = document.getElementById('cs-stage');
  if (!stage) return;
  const len = allPhotos.length;
  const mo  = csMaxOffset();
  stage.querySelectorAll('.cs-card').forEach(card => {
    const i   = parseInt(card.dataset.index);
    const off = csSignedOffset(i, csActive, len);
    const abs = Math.abs(off);
    if (abs > mo) {
      card.style.opacity       = '0';
      card.style.pointerEvents = 'none';
      card.style.zIndex        = '0';
    } else {
      const isActive = off === 0;
      card.classList.toggle('cs-card--active', isActive);
      card.style.opacity       = '1';
      card.style.pointerEvents = 'auto';
      card.style.zIndex        = String(100 - abs);
      card.style.cursor        = isActive ? 'zoom-in' : 'pointer';
      card.style.transform     = csGetTransform(off, abs);
    }
  });
}

function csRenderDots() {
  const dotsEl = document.getElementById('cs-dots');
  if (!dotsEl) return;
  const existing = dotsEl.querySelectorAll('.cs-dot');
  if (existing.length === allPhotos.length) {
    existing.forEach((dot, idx) => dot.classList.toggle('cs-dot--active', idx === csActive));
    return;
  }
  dotsEl.innerHTML = '';
  allPhotos.forEach((_, idx) => {
    const dot = document.createElement('button');
    dot.className = 'cs-dot' + (idx === csActive ? ' cs-dot--active' : '');
    dot.setAttribute('aria-label', `Photo ${idx + 1}`);
    dot.addEventListener('click', () => { csActive = idx; csUpdatePositions(); csRenderDots(); });
    dotsEl.appendChild(dot);
  });
}

function csBind(stage) {
  stage.setAttribute('tabindex', '0');
  stage.addEventListener('keydown', e => {
    const len = allPhotos.length;
    if (e.key === 'ArrowLeft')  { csActive = csWrap(csActive - 1, len); csUpdatePositions(); csRenderDots(); }
    if (e.key === 'ArrowRight') { csActive = csWrap(csActive + 1, len); csUpdatePositions(); csRenderDots(); }
    if (e.key === 'Enter')      { openLightbox(csActive); }
  });

  stage.addEventListener('pointerdown', e => {
    const card = e.target.closest('.cs-card--active');
    if (!card) return;
    csDragStartX   = e.clientX;
    csDragDx       = 0;
    csIsDragging   = false;
    csDragStartTime = Date.now();
    card.setPointerCapture(e.pointerId);
  });

  stage.addEventListener('pointermove', e => {
    if (csDragStartX === null) return;
    csDragDx = e.clientX - csDragStartX;
    if (Math.abs(csDragDx) > 8) csIsDragging = true;
  });

  stage.addEventListener('pointerup', () => {
    if (csDragStartX === null || !csIsDragging) { csDragStartX = null; return; }
    const dt       = Math.max(1, Date.now() - csDragStartTime);
    const velocity = Math.abs(csDragDx) / dt;
    const len      = allPhotos.length;
    if (csDragDx > 70 || (velocity > 0.55 && csDragDx > 0)) {
      csActive = csWrap(csActive - 1, len);
    } else if (csDragDx < -70 || (velocity > 0.55 && csDragDx < 0)) {
      csActive = csWrap(csActive + 1, len);
    }
    csUpdatePositions();
    csRenderDots();
    csDragStartX = null;
    setTimeout(() => { csIsDragging = false; }, 50);
  });

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(csUpdatePositions, 150);
  });
}

// ===== Lightbox photo =====
const lightbox        = document.getElementById('photo-lightbox');
const lightboxImg     = document.getElementById('photo-lightbox-img');
const lightboxCounter = document.getElementById('photo-lightbox-counter');

function openLightbox(index) {
  currentPhotoIndex = index;
  const p = allPhotos[index];
  // Affiche d'abord le thumb pendant le chargement de la full
  lightboxImg.src = p.thumb || p.src;
  lightboxImg.alt = p.alt || '';
  lightboxImg.style.filter = 'blur(6px)';
  lightboxCounter.textContent = `${index + 1} / ${allPhotos.length}`;
  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
  // Charge la full en arrière-plan
  const full = new Image();
  full.onload = () => {
    if (currentPhotoIndex === index) {
      lightboxImg.src = full.src;
      lightboxImg.style.filter = '';
    }
  };
  full.src = p.src;
}

function closeLightbox() {
  lightbox.classList.remove('open');
  document.body.style.overflow = '';
  lightboxImg.src = '';
}

function lightboxNav(dir) {
  const next = (currentPhotoIndex + dir + allPhotos.length) % allPhotos.length;
  openLightbox(next);
}

document.getElementById('photo-lightbox-close')?.addEventListener('click', closeLightbox);
document.getElementById('photo-lightbox-overlay')?.addEventListener('click', closeLightbox);
document.getElementById('photo-lightbox-prev')?.addEventListener('click', () => lightboxNav(-1));
document.getElementById('photo-lightbox-next')?.addEventListener('click', () => lightboxNav(+1));
document.addEventListener('keydown', e => {
  if (!lightbox?.classList.contains('open')) return;
  if (e.key === 'Escape')     closeLightbox();
  if (e.key === 'ArrowLeft')  lightboxNav(-1);
  if (e.key === 'ArrowRight') lightboxNav(+1);
});

// ===== Theme toggle =====
const themeToggle = document.getElementById('theme-toggle');
themeToggle?.addEventListener('click', () => {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  if (isDark) {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('theme', 'light');
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
  }
});

// ===== Fallback logos Stack (remplace les onerror inline, incompatibles CSP) =====
document.querySelectorAll('.tool img').forEach(img => {
  const hide = () => { img.closest('.tool').style.display = 'none'; };
  img.addEventListener('error', hide);
  // Image déjà échouée avant l'attachement du listener
  if (img.complete && !img.naturalWidth) hide();
});

// ===== Système solaire des outils =====
// Chaque orbite tourne ; les logos restent droits (contre-rotation) ;
// survol = tout s'arrête ; clic/survol = nom affiché.
function buildSolarSystem() {
  const solar = document.getElementById('solar');
  if (!solar) return;

  // Outils répartis du centre vers l'extérieur (4 orbites)
  const rings = [
    { r: 86,  dur: 46, tools: [
      { name: 'Figma',          img: 'https://cdn.simpleicons.org/figma' },
      { name: 'Photoshop',      img: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/photoshop/photoshop-plain.svg' },
      { name: 'Illustrator',    img: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/illustrator/illustrator-plain.svg' },
      { name: 'InDesign',       img: 'images/icons/indesign.svg' },
    ]},
    { r: 152, dur: 62, tools: [
      { name: 'After Effects',  img: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/aftereffects/aftereffects-plain.svg' },
      { name: 'Premiere',       img: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/premierepro/premierepro-plain.svg' },
      { name: 'Lightroom',      img: 'images/icons/lightroom.svg' },
      { name: 'DaVinci Resolve',img: 'https://cdn.simpleicons.org/davinciresolve' },
      { name: 'Canva',          img: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/canva/canva-original.svg' },
      { name: 'Unity',          img: 'https://cdn.simpleicons.org/unity/000000' },
    ]},
    { r: 224, dur: 80, tools: [
      { name: 'HTML5',          img: 'https://cdn.simpleicons.org/html5' },
      { name: 'CSS3',           img: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg' },
      { name: 'JavaScript',     img: 'https://cdn.simpleicons.org/javascript' },
      { name: 'WordPress',      img: 'https://cdn.simpleicons.org/wordpress' },
      { name: 'VS Code',        img: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vscode/vscode-original.svg' },
      { name: 'Git',            img: 'https://cdn.simpleicons.org/git' },
      { name: 'Claude',         img: 'https://cdn.simpleicons.org/claude' },
      { name: 'ChatGPT',        img: 'https://unpkg.com/@lobehub/icons-static-svg/icons/openai.svg' },
    ]},
    { r: 298, dur: 100, tools: [
      { name: 'Notion',         img: 'https://cdn.simpleicons.org/notion' },
      { name: 'Slack',          img: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/slack/slack-original.svg' },
      { name: 'Trello',         img: 'https://cdn.simpleicons.org/trello' },
      { name: 'Google Workspace', img: 'https://cdn.simpleicons.org/googledrive' },
      { name: 'Microsoft 365',  img: 'images/icons/microsoft365.svg' },
      { name: 'Mailchimp',      img: 'https://cdn.simpleicons.org/mailchimp/000000' },
      { name: 'Meta Business',  img: 'https://cdn.simpleicons.org/meta' },
      { name: 'Google Ads',     img: 'https://cdn.simpleicons.org/googleads' },
      { name: 'Google Analytics', img: 'https://cdn.simpleicons.org/googleanalytics' },
      { name: 'Infomaniak',     img: 'https://cdn.simpleicons.org/infomaniak/000000' },
    ]},
  ];

  const stage = document.createElement('div');
  stage.className = 'solar__stage';

  // Noyau central
  const core = document.createElement('div');
  core.className = 'solar__core';
  core.innerHTML = '<span>28</span><small>outils</small>';
  stage.appendChild(core);

  rings.forEach(ring => {
    // Cercle pointillé (statique)
    const orbitLine = document.createElement('div');
    orbitLine.className = 'orbit-line';
    orbitLine.style.width = orbitLine.style.height = (ring.r * 2) + 'px';
    stage.appendChild(orbitLine);

    // Rotor (tourne) qui porte les satellites
    const rotor = document.createElement('div');
    rotor.className = 'rotor';
    rotor.style.setProperty('--dur', ring.dur + 's');

    ring.tools.forEach((tool, i) => {
      const angle = (360 / ring.tools.length) * i;

      const sat = document.createElement('div');
      sat.className = 'sat';
      sat.style.transform = `rotate(${angle}deg) translateX(${ring.r}px) rotate(${-angle}deg)`;

      const inner = document.createElement('div');
      inner.className = 'sat__inner';
      inner.style.setProperty('--dur', ring.dur + 's');

      const btn = document.createElement('button');
      btn.className = 'sat__btn';
      btn.type = 'button';
      btn.setAttribute('aria-label', tool.name);

      const img = document.createElement('img');
      img.src = tool.img;
      img.alt = tool.name;
      img.loading = 'lazy';
      img.addEventListener('error', () => sat.remove());

      const label = document.createElement('span');
      label.className = 'sat__name';
      label.textContent = tool.name;

      btn.appendChild(img);
      btn.appendChild(label);
      // Clic = fige le nom (utile sur mobile)
      btn.addEventListener('click', () => btn.classList.toggle('is-pinned'));

      inner.appendChild(btn);
      sat.appendChild(inner);
      rotor.appendChild(sat);
    });

    stage.appendChild(rotor);
  });

  solar.appendChild(stage);
}

// ===== Init =====
loadProjects();
loadCardStack();
buildSolarSystem();
initCanvas();
