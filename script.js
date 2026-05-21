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

function buildMeta(p) {
  const parts = [];
  if (p.year)  parts.push(p.year);
  if (p.role)  parts.push(p.role);
  if (p.stack && p.stack.length) parts.push(p.stack.join(', '));
  return parts.length ? parts.join(' · ') : '';
}

function cardHTML(p, i) {
  const meta = buildMeta(p);
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
        ${meta ? `<div class="project-card__meta">${meta}</div>` : ''}
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

// ===== Galerie photo =====
const GALLERY_PAGE = 3;
let allPhotos       = [];
let visiblePhotoCount = 0;
let currentPhotoIndex = 0;

async function loadPhotos() {
  const grid = document.getElementById('gallery-grid');
  if (!grid) return;

  try {
    const res  = await fetch('photos.json');
    const data = await res.json();
    // Mélange aléatoire (Fisher-Yates)
    const raw = data.photos || [];
    for (let i = raw.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [raw[i], raw[j]] = [raw[j], raw[i]];
    }
    allPhotos = raw;

    if (!allPhotos.length) {
      document.getElementById('gallery').style.display = 'none';
      return;
    }

    appendPhotos(allPhotos.slice(0, GALLERY_PAGE));
    updateGalleryMoreBtn();

  } catch {
    document.getElementById('gallery').style.display = 'none';
  }
}

function appendPhotos(photos) {
  const grid = document.getElementById('gallery-grid');
  photos.forEach(p => {
    const fig = document.createElement('figure');
    fig.className = 'gallery__item';
    fig.setAttribute('role', 'button');
    fig.setAttribute('tabindex', '0');
    fig.setAttribute('aria-label', 'Agrandir');
    const img = document.createElement('img');
    img.src     = p.thumb || p.src;
    img.alt     = p.alt || '';
    img.loading = 'lazy';
    img.addEventListener('error', () => { fig.style.display = 'none'; });
    fig.appendChild(img);
    const idx = allPhotos.indexOf(p);
    fig.addEventListener('click',   () => openLightbox(idx));
    fig.addEventListener('keydown', e => { if (e.key === 'Enter') openLightbox(idx); });
    grid.appendChild(fig);
  });
  visiblePhotoCount += photos.length;
}

function updateGalleryMoreBtn() {
  let btn = document.getElementById('gallery-more-btn');
  if (!btn) {
    btn = document.createElement('button');
    btn.id        = 'gallery-more-btn';
    btn.className = 'btn btn--ghost';
    btn.addEventListener('click', () => {
      const next = allPhotos.slice(visiblePhotoCount, visiblePhotoCount + GALLERY_PAGE);
      appendPhotos(next);
      updateGalleryMoreBtn();
    });
    document.querySelector('.gallery__more').prepend(btn);
  }
  const remaining = allPhotos.length - visiblePhotoCount;
  if (remaining > 0) {
    btn.innerHTML = `Voir plus <span style="font-size:12px;font-weight:400;color:var(--dark-muted)">(${remaining})</span>`;
    btn.style.display = '';
  } else {
    btn.style.display = 'none';
  }
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

// ===== Init =====
loadProjects();
loadPhotos();
initCanvas();
