/* ===========================
   PAGE.JS — Nav + Theme (mentions-legales, cv)
   Partagé entre les pages secondaires qui ne chargent pas script.js
   =========================== */

document.getElementById('year').textContent = new Date().getFullYear();

const burger   = document.querySelector('.nav__burger');
const navLinks = document.querySelector('.nav__links');

function toggleMenu(force) {
  const isOpen = force !== undefined ? force : !burger.classList.contains('open');
  burger.classList.toggle('open', isOpen);
  navLinks.classList.toggle('open', isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : '';
}

burger?.addEventListener('click', () => toggleMenu());
navLinks?.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => toggleMenu(false));
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') toggleMenu(false); });

document.getElementById('theme-toggle')?.addEventListener('click', () => {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  if (isDark) {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('theme', 'light');
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
  }
});
