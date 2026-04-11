'use strict';

/* ── 2. THEME ── */
function initTheme(){
  const t = document.getElementById('theme-toggle');
  if(!t) return;
  const sb = document.getElementById('sidebarThemeToggle');
  const sbIcon = document.getElementById('sidebarThemeIcon');
  const saved = localStorage.getItem('vvg-theme');
  const theme = saved || 'light';
  document.body.setAttribute('data-theme', theme);
  t.checked = (theme === 'dark');
  if(sbIcon) sbIcon.className = (theme === 'dark') ? 'fas fa-sun' : 'fas fa-moon';

  function applyTheme(dark){
    const th = dark ? 'dark' : 'light';
    document.body.setAttribute('data-theme', th);
    localStorage.setItem('vvg-theme', th);
    t.checked = dark;
    if(sbIcon) sbIcon.className = dark ? 'fas fa-sun' : 'fas fa-moon';
  }
  t.addEventListener('change', ()=>applyTheme(t.checked));
  if(sb) sb.addEventListener('click', ()=>applyTheme(document.body.getAttribute('data-theme') !== 'dark'));

}
