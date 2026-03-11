'use strict';

const throttle = (fn, ms=50) => { let l=0; return (...a) => { const n=Date.now(); if(n-l>=ms){l=n;fn(...a);} }; };
const debounce = (fn, ms=100) => { let id; return (...a) => { clearTimeout(id); id=setTimeout(()=>fn(...a),ms); }; };

let _galaxyCtrl = null; // controlled by initTheme after initGalaxy runs

/* ── 1. GALAXY ── */
function initGalaxy() {
  const canvas = document.getElementById('galaxyCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, stars=[], nebulae=[], shooters=[];
  let rafId = null;
  const rand = (a,b) => Math.random()*(b-a)+a;

  function resize(){ W=canvas.width=window.innerWidth; H=canvas.height=window.innerHeight; }
  resize();
  window.addEventListener('resize', ()=>{ resize(); build(); });

  function build(){
    const N = Math.floor(W*H/1800);
    stars = Array.from({length:N}, ()=>({
      x:rand(0,W), y:rand(0,H), r:rand(0.2,1.8),
      a:rand(0.15,0.9), speed:rand(0.003,0.015), phase:rand(0,Math.PI*2),
      color:['#ffffff','#fffde0','#c8e6ff','#ffd8d8','#d0ffe8'][Math.floor(Math.random()*5)],
      layer:Math.floor(Math.random()*3)
    }));
    nebulae = Array.from({length:5}, ()=>({
      x:rand(0,W), y:rand(0,H), rx:rand(120,350), ry:rand(80,220),
      col:['rgba(79,70,229,','rgba(6,182,212,','rgba(139,92,246,','rgba(16,185,129,'][Math.floor(Math.random()*4)],
      a:rand(0.018,0.05)
    }));
  }
  build();

  let mx=0, my=0;
  // Parallax only on non-touch devices — pointless and battery-draining on mobile
  if(!window.matchMedia('(hover: none)').matches){
    window.addEventListener('mousemove', e=>{ mx=(e.clientX/W-0.5)*2; my=(e.clientY/H-0.5)*2; },{passive:true});
  }

  let t=0;
  const PLX = [0, 1.5, 3];
  function frame(){
    ctx.clearRect(0,0,W,H);
    nebulae.forEach(n=>{
      const maxR=Math.max(n.rx,n.ry);
      const g=ctx.createRadialGradient(n.x,n.y,0,n.x,n.y,maxR);
      g.addColorStop(0,n.col+n.a+')'); g.addColorStop(1,n.col+'0)');
      ctx.save(); ctx.scale(n.rx/maxR,n.ry/maxR);
      ctx.fillStyle=g; ctx.beginPath();
      ctx.arc(n.x*(maxR/n.rx),n.y*(maxR/n.ry),maxR,0,Math.PI*2); ctx.fill(); ctx.restore();
    });
    t+=0.008;
    stars.forEach(s=>{
      const px=s.x+mx*PLX[s.layer], py=s.y+my*PLX[s.layer];
      const tw=s.a*(0.65+0.35*Math.sin(t*s.speed*80+s.phase));
      ctx.globalAlpha=tw; ctx.fillStyle=s.color;
      ctx.beginPath(); ctx.arc(px,py,s.r,0,Math.PI*2); ctx.fill();
    });
    // constellation lines
    const S = Math.min(stars.length,80);
    for(let i=0;i<S;i++) for(let j=i+1;j<S;j++){
      const dx=stars[i].x-stars[j].x, dy=stars[i].y-stars[j].y;
      const d=Math.sqrt(dx*dx+dy*dy);
      if(d<120){ ctx.globalAlpha=0.04*(1-d/120); ctx.strokeStyle='#a5b4fc'; ctx.lineWidth=0.8;
        ctx.beginPath(); ctx.moveTo(stars[i].x,stars[i].y); ctx.lineTo(stars[j].x,stars[j].y); ctx.stroke(); }
    }
    if(Math.random()<0.004 && shooters.length<3){
      shooters.push({x:rand(0,W*0.7),y:rand(0,H*0.4),len:rand(70,180),speed:rand(5,14),angle:rand(0.35,0.65),life:1,decay:rand(0.02,0.045)});
    }
    shooters=shooters.filter(s=>s.life>0);
    shooters.forEach(s=>{
      ctx.globalAlpha=s.life*0.85; ctx.strokeStyle='#fff'; ctx.lineWidth=1.2;
      ctx.shadowBlur=6; ctx.shadowColor='#a8c8ff';
      ctx.beginPath(); ctx.moveTo(s.x,s.y);
      ctx.lineTo(s.x-Math.cos(s.angle)*s.len,s.y-Math.sin(s.angle)*s.len); ctx.stroke();
      ctx.shadowBlur=0; s.x+=Math.cos(s.angle)*s.speed; s.y+=Math.sin(s.angle)*s.speed; s.life-=s.decay;
    });
    ctx.globalAlpha=1;
    rafId = requestAnimationFrame(frame);
  }

  _galaxyCtrl = {
    start(){ if(!rafId) frame(); },
    stop(){ if(rafId){ cancelAnimationFrame(rafId); rafId=null; } ctx.clearRect(0,0,W,H); }
  };
}

/* ── 2. THEME ── */
function initTheme(){
  const t  = document.getElementById('theme-toggle');
  const ts = document.getElementById('theme-toggle-sidebar');
  if(!t) return;
  const saved = localStorage.getItem('theme');
  const systemDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  const theme = saved || (systemDark ? 'dark' : 'light');
  document.body.setAttribute('data-theme', theme);
  t.checked  = (theme === 'dark');
  if(ts) ts.checked = (theme === 'dark');
  // Sync galaxy with initial theme
  theme === 'dark' ? _galaxyCtrl?.start() : _galaxyCtrl?.stop();

  function applyTheme(dark){
    const th = dark ? 'dark' : 'light';
    document.body.setAttribute('data-theme', th);
    localStorage.setItem('theme', th);
    t.checked  = dark;
    if(ts) ts.checked = dark;
    dark ? _galaxyCtrl?.start() : _galaxyCtrl?.stop();
  }
  t.addEventListener('change', ()=>applyTheme(t.checked));
  ts?.addEventListener('change', ()=>applyTheme(ts.checked));

  // React to OS-level colour scheme changes (only when user hasn't set a manual preference)
  window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener('change', e=>{
    if(localStorage.getItem('theme')) return; // manual preference takes priority
    applyTheme(e.matches);
  });
}

/* ── 3. TYPED ── */
function initTyped(){
  const el=document.getElementById('typed'); if(!el) return;
  const strings=['Full-Stack Developer','AI & ML Engineer','Data Mining Researcher','Cloud Developer','Event Coordinator'];
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    el.textContent=strings[0]; return;
  }
  let si=0,ci=0,del=false,wait=80;
  function tick(){
    const s=strings[si];
    el.textContent=del?s.slice(0,--ci):s.slice(0,++ci);
    if(!del&&ci===s.length){del=true;wait=2000;}
    else if(del&&ci===0){del=false;si=(si+1)%strings.length;wait=350;}
    else wait=del?35:55+Math.random()*35;
    setTimeout(tick,wait);
  }
  setTimeout(tick,1000);
}

/* ── 4. GSAP ANIMATIONS ── */
function revealHero(){
  document.querySelectorAll('.hero-anim-badge,.hero-anim-title,.hero-anim-subtitle,.hero-anim-desc,.hero-anim-cta,.hero-anim-socials')
    .forEach(el=>{ el.style.opacity='1'; el.style.transform='none'; });
}

function initAnimations(){
  if(typeof gsap==='undefined'){ console.warn('GSAP not loaded'); revealHero(); return; }
  // Skip animations for users who prefer reduced motion
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if(typeof ScrollTrigger!=='undefined'){
    gsap.registerPlugin(ScrollTrigger);
  }

  // Set initial hidden state via JS (not CSS) so content is always visible if GSAP fails
  gsap.set('.hero-anim-badge',   {y:16,opacity:0});
  gsap.set('.hero-anim-title',   {y:44,opacity:0});
  gsap.set('.hero-anim-subtitle',{y:28,opacity:0});
  gsap.set('.hero-anim-desc',    {y:22,opacity:0});
  gsap.set('.hero-anim-cta > *', {y:18,opacity:0});
  gsap.set('.hero-anim-socials', {y:14,opacity:0});

  // Hero entrance
  gsap.timeline({defaults:{ease:'power3.out'}})
    .to('.hero-anim-badge',    {y:0,opacity:1,duration:0.6,delay:0.1})
    .to('.hero-anim-title',    {y:0,opacity:1,duration:0.9},'-=0.3')
    .to('.hero-anim-subtitle', {y:0,opacity:1,duration:0.7},'-=0.5')
    .to('.hero-anim-desc',     {y:0,opacity:1,duration:0.7},'-=0.45')
    .to('.hero-anim-cta > *',  {y:0,opacity:1,duration:0.55,stagger:0.12},'-=0.4')
    .to('.hero-anim-socials',  {y:0,opacity:1,duration:0.5},'-=0.3');

  if(typeof ScrollTrigger==='undefined') return;

  // Section headings
  gsap.utils.toArray('.section-heading').forEach(el=>{
    gsap.fromTo(el,{y:20,opacity:0},{
      y:0,opacity:1,duration:0.65,ease:'power2.out',
      scrollTrigger:{trigger:el,start:'top 88%',toggleActions:'play none none none'}
    });
  });

  // About
  gsap.from('.about-photo-wrap',{scale:0.85,opacity:0,rotate:-6,duration:0.9,ease:'back.out(1.5)',
    scrollTrigger:{trigger:'#about',start:'top 80%'}});
  gsap.from('.about-name,.about-role',{x:-30,opacity:0,duration:0.7,stagger:0.15,ease:'power2.out',
    scrollTrigger:{trigger:'#about',start:'top 75%'}});
  gsap.from('.about-stat-card',{y:28,opacity:0,duration:0.6,stagger:0.12,ease:'back.out(1.3)',
    scrollTrigger:{trigger:'.about-stat-card',start:'top 85%'}});

  // Skill cards — stagger per row
  gsap.utils.toArray('.skill-card').forEach((c,i)=>{
    gsap.from(c,{y:24,opacity:0,scale:0.9,duration:0.5,delay:(i%8)*0.04,ease:'back.out(1.4)',
      scrollTrigger:{trigger:c,start:'top 92%',toggleActions:'play none none none'}});
  });

  // Achievement cards
  gsap.utils.toArray('.achievement-card').forEach((c,i)=>{
    gsap.from(c,{y:28,opacity:0,duration:0.55,delay:(i%4)*0.08,ease:'power2.out',
      scrollTrigger:{trigger:c,start:'top 90%',toggleActions:'play none none none'}});
  });

  // Testimonial cards
  gsap.utils.toArray('.testimonial-card').forEach((c,i)=>{
    gsap.from(c,{y:28,opacity:0,duration:0.6,delay:i*0.12,ease:'power2.out',
      scrollTrigger:{trigger:c,start:'top 88%',toggleActions:'play none none none'}});
  });

  // Project cards
  gsap.utils.toArray('.project-card').forEach((c,i)=>{
    gsap.from(c,{y:30,opacity:0,duration:0.55,delay:(i%4)*0.07,ease:'power2.out',
      scrollTrigger:{trigger:c,start:'top 92%',toggleActions:'play none none none'}});
  });

  // Gallery
  gsap.utils.toArray('.gallery-strip-item').forEach((item,i)=>{
    gsap.from(item,{x:i%2===0?-30:30,opacity:0,duration:0.6,delay:i*0.1,ease:'power2.out',
      scrollTrigger:{trigger:item,start:'top 88%',toggleActions:'play none none none'}});
  });

  // Contact form
  gsap.from('#contactForm',{y:30,opacity:0,duration:0.7,ease:'power2.out',
    scrollTrigger:{trigger:'#contactForm',start:'top 85%'}});
}

/* ── 5. HERO PARALLAX ── */
function initHeroParallax(){
  const hero = document.querySelector('.hero-section');
  if(!hero) return;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  window.addEventListener('scroll', throttle(()=>{
    const offset = window.scrollY;
    if(offset < window.innerHeight){
      hero.style.backgroundPositionY = `calc(50% + ${offset * 0.3}px)`;
    }
  }, 16), {passive:true});
}

/* ── 7. PHOTO TILT ── */
function initPhotoTilt(){
  const wrap=document.querySelector('.about-photo-wrap'); if(!wrap) return;
  wrap.addEventListener('mousemove',e=>{
    const r=wrap.getBoundingClientRect();
    const x=((e.clientX-r.left)/r.width-0.5)*22;
    const y=((e.clientY-r.top)/r.height-0.5)*-22;
    wrap.style.transform=`perspective(500px) rotateX(${y}deg) rotateY(${x}deg) scale(1.06)`;
  });
  wrap.addEventListener('mouseleave',()=>{ wrap.style.transform=''; });
}

/* ── 6. SCROLL BAR ── */
function initScrollBar(){
  const bar=document.getElementById('scrollBar'); if(!bar) return;
  window.addEventListener('scroll',throttle(()=>{
    const {scrollTop,scrollHeight,clientHeight}=document.documentElement;
    bar.style.width=(scrollTop/(scrollHeight-clientHeight)*100)+'%';
  },16),{passive:true});
}

/* ── 7. BACK TO TOP ── */
function initBackToTop(){
  const btn=document.getElementById('backToTop'); if(!btn) return;
  window.addEventListener('scroll',throttle(()=>{
    btn.style.display=window.scrollY>300?'flex':'none';
  },100),{passive:true});
  btn.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
}

/* ── 8. HEADER ── */
function initHeader(){
  const header   = document.getElementById('site-header');
  const menuBtn  = document.getElementById('mobileMenuBtn');
  const sidebar  = document.getElementById('mobileSidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  const closeBtn = document.getElementById('sidebarCloseBtn');
  if(!header) return;

  // Scroll shadow
  window.addEventListener('scroll',throttle(()=>{
    header.classList.toggle('scrolled',window.scrollY>10);
  },100),{passive:true});

  // ── Sidebar open/close ──
  function openSidebar(){
    sidebar?.classList.add('open');
    backdrop?.classList.add('open');
    sidebar?.setAttribute('aria-hidden','false');
    menuBtn?.setAttribute('aria-expanded','true');
    document.body.classList.add('sidebar-open');
    // Focus first link for keyboard users
    sidebar?.querySelector('.sidebar-link')?.focus();
  }
  function closeSidebar(){
    sidebar?.classList.remove('open');
    backdrop?.classList.remove('open');
    sidebar?.setAttribute('aria-hidden','true');
    menuBtn?.setAttribute('aria-expanded','false');
    document.body.classList.remove('sidebar-open');
    menuBtn?.focus();
  }

  menuBtn?.addEventListener('click', openSidebar);
  closeBtn?.addEventListener('click', closeSidebar);
  backdrop?.addEventListener('click', closeSidebar);

  // Close on nav-link click
  sidebar?.querySelectorAll('.sidebar-link').forEach(a=>{
    a.addEventListener('click', closeSidebar);
  });

  // Escape key
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape' && sidebar?.classList.contains('open')) closeSidebar();
  });

  // ── Active link highlighting (desktop nav + sidebar) ──
  const allLinks=[
    ...document.querySelectorAll('.header-link[href^="#"]'),
    ...document.querySelectorAll('.sidebar-link[href^="#"]')
  ];
  const hl=()=>{
    const y=window.scrollY+80;
    allLinks.forEach(a=>{
      const s=document.querySelector(a.getAttribute('href'));
      a.classList.toggle('active-link',s&&s.offsetTop<=y&&s.offsetTop+s.offsetHeight>y);
    });
  };
  window.addEventListener('scroll',hl,{passive:true}); hl();
}

/* ── 9. TIMELINE ── */
function initTimeline(){
  const toggle=document.querySelector('.timeline-toggle'); if(!toggle) return;
  const btns=Array.from(toggle.querySelectorAll('.toggle-btn'));
  const secs={education:document.querySelector('.section-education'),experience:document.querySelector('.section-experience')};
  function show(name){
    toggle.dataset.active=name;
    toggle.style.setProperty('--pill-left',name==='education'?'0%':'50%');
    btns.forEach(b=>b.setAttribute('aria-selected',b.dataset.section===name));
    Object.entries(secs).forEach(([k,el])=>{
      if(!el) return;
      el.classList.toggle('d-none',k!==name);
      if(k===name) el.querySelectorAll('.timeline-item').forEach((item,i)=>{
        item.classList.add('tl-anim');
        item.classList.remove('visible');
        setTimeout(()=>item.classList.add('visible'),i*160);
      });
    });
  }
  btns.forEach(b=>b.addEventListener('click',()=>show(b.dataset.section)));
  requestAnimationFrame(()=>requestAnimationFrame(()=>show(toggle.dataset.active||'education')));
}

/* ── 10. SKILLS ── */
function initSkills(){
  const toggle=document.querySelector('.skills-toggle'); if(!toggle) return;
  const btns=Array.from(toggle.querySelectorAll('.toggle-btn'));
  const cards=Array.from(document.querySelectorAll('.skill-card'));
  toggle.style.setProperty('--count',btns.length);
  toggle.style.setProperty('--pill-index',0);
  btns.forEach((btn,idx)=>{
    btn.setAttribute('aria-selected',idx===0);
    btn.addEventListener('click',()=>{
      toggle.style.setProperty('--pill-index',idx);
      btns.forEach(b=>b.setAttribute('aria-selected','false'));
      btn.setAttribute('aria-selected','true');
      const cat=btn.dataset.cat;
      cards.forEach(c=>c.classList.toggle('d-none',cat!=='all'&&c.dataset.cat!==cat));
    });
  });
}
function initSkillCharts(){
  const charts=Array.from(document.querySelectorAll('.skill-chart'));
  if(!charts.length) return;
  charts.forEach(c=>c.style.setProperty('--pct',0));
  function animate(chart){
    if(chart.dataset.animated) return;
    chart.dataset.animated='1';
    const card=chart.closest('.skill-card');
    const pct=parseFloat(card.dataset.value)||0;
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      chart.style.setProperty('--pct',pct);
      const valEl=card.querySelector('.skill-value');
      if(valEl) valEl.textContent=Math.round(pct)+'%';
      return;
    }
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      chart.style.setProperty('--pct',pct);
      const valEl=card.querySelector('.skill-value');
      if(valEl){ let n=0; const step=()=>{ n=Math.min(n+Math.ceil(pct/50),pct); valEl.textContent=Math.round(n)+'%'; if(n<pct) requestAnimationFrame(step); }; step(); }
    }));
  }
  if('IntersectionObserver' in window){
    const obs=new IntersectionObserver(entries=>{
      entries.forEach(e=>{ if(e.isIntersecting){animate(e.target);obs.unobserve(e.target);} });
    },{threshold:0.05,rootMargin:'0px 0px -20px 0px'});
    charts.forEach(c=>obs.observe(c));
  } else {
    // No IntersectionObserver — animate all immediately
    charts.forEach(c=>animate(c));
  }
}

/* ── 11. PROJECT FILTER ── */
function initProjectFilter(){
  const search=document.getElementById('projectSearch');
  const filter=document.getElementById('projectFilter');
  const sort=document.getElementById('projectSort');
  const cont=document.getElementById('projectGallery');
  const noMsg=document.getElementById('noProjectsMsg');
  if(!search||!filter||!sort||!cont||!noMsg) return;
  const cards=Array.from(document.querySelectorAll('.project-card'));
  function apply(){
    const term=search.value.trim().toLowerCase(), cat=filter.value; let vis=0;
    cards.forEach(c=>{
      const title=(c.querySelector('.card-title')?.textContent||'').toLowerCase();
      const desc=(c.querySelector('.card-text')?.textContent||'').toLowerCase();
      const ok=(!term||title.includes(term)||desc.includes(term))&&(cat==='all'||c.dataset.category===cat);
      c.style.display=ok?'':'none'; vis+=ok?1:0;
    });
    const visible=cards.filter(c=>c.style.display!=='none');
    if(sort.value==='az') visible.sort((a,b)=>a.querySelector('.card-title').textContent.localeCompare(b.querySelector('.card-title').textContent));
    if(sort.value==='za') visible.sort((a,b)=>b.querySelector('.card-title').textContent.localeCompare(a.querySelector('.card-title').textContent));
    visible.forEach(c=>cont.appendChild(c));
    noMsg.classList.toggle('d-none',vis>0);
  }
  search.addEventListener('input',debounce(apply,100));
  filter.addEventListener('change',apply);
  sort.addEventListener('change',apply);
  apply();
}

/* ── 12. CERTIFICATE MODAL ── */
function initCertModal(){
  // Section-local modals keyed by data-cert-modal attribute value
  const MODALS = {
    achievements: {
      modal:     document.getElementById('achievementsCertModal'),
      titleEl:   document.getElementById('achievementsCertModalTitle'),
      subEl:     document.getElementById('achievementsCertModalSubtitle'),
      contentEl: document.getElementById('achievementsCertModalContent'),
      openLink:  document.getElementById('achievementsCertModalOpenLink'),
      dlBtn:     document.getElementById('achievementsCertModalDownload'),
    },
    testimonials: {
      modal:     document.getElementById('testimonialsCertModal'),
      titleEl:   document.getElementById('testimonialsCertModalTitle'),
      subEl:     document.getElementById('testimonialsCertModalSubtitle'),
      contentEl: document.getElementById('testimonialsCertModalContent'),
      openLink:  document.getElementById('testimonialsCertModalOpenLink'),
      dlBtn:     document.getElementById('testimonialsCertModalDownload'),
    }
  };

  function closeAll(){
    Object.values(MODALS).forEach(m => {
      if (!m.modal) return;
      m.modal.classList.remove('is-open');
      m.modal.setAttribute('aria-hidden', 'true');
      setTimeout(() => { if (m.contentEl) m.contentEl.innerHTML = ''; }, 250);
    });
    document.body.classList.remove('cert-modal-open');
  }

  // Close buttons inside modals
  document.querySelectorAll('.section-cert-close').forEach(btn => {
    btn.addEventListener('click', closeAll);
  });

  // Click backdrop to close
  Object.values(MODALS).forEach(m => {
    if (!m.modal) return;
    m.modal.addEventListener('click', e => { if (e.target === m.modal) closeAll(); });
    // Swipe down to close on touch devices
    let touchY = 0;
    const box = m.modal.querySelector('.section-cert-modal-box');
    if (box) {
      box.addEventListener('touchstart', e => { touchY = e.touches[0].clientY; }, { passive: true });
      box.addEventListener('touchend', e => { if (e.changedTouches[0].clientY - touchY > 80) closeAll(); }, { passive: true });
    }
  });

  // Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      const anyOpen = Object.values(MODALS).some(m => m.modal?.classList.contains('is-open'));
      if (anyOpen) closeAll();
    }
  });

  // Open modal on [data-cert] button click
  document.querySelectorAll('[data-cert]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      const certPath = btn.dataset.cert;
      const certName = btn.dataset.certName || 'Certificate';
      const modalKey = btn.dataset.certModal || 'achievements';
      const m = MODALS[modalKey];
      if (!m || !m.modal) return;

      const isPdf = /\.pdf$/i.test(certPath);

      if (m.titleEl) m.titleEl.textContent = certName;
      if (m.subEl)   m.subEl.textContent   = isPdf ? 'PDF preview' : 'Image preview';
      if (m.openLink){ m.openLink.href = certPath; }
      if (m.dlBtn)   { m.dlBtn.href = certPath; m.dlBtn.setAttribute('download', certName); }

      m.contentEl.innerHTML = '<div class="cert-spinner"><div class="cert-spinner-ring"></div><span>Loading certificate…</span></div>';

      if (isPdf) {
        m.contentEl.innerHTML = '';
        const obj = document.createElement('object');
        obj.data = certPath;
        obj.type = 'application/pdf';
        obj.style.cssText = 'width:100%;height:520px;border:none;border-radius:0.75rem;background:#fff;display:block;';
        obj.setAttribute('aria-label', certName);
        obj.innerHTML = `<div class="cert-error"><i class="fas fa-file-pdf"></i><p>PDF preview not available in this browser.</p><a href="${certPath}" target="_blank" rel="noopener" class="btn btn-primary btn-sm"><i class="fas fa-external-link-alt me-1"></i>Open PDF</a></div>`;
        m.contentEl.appendChild(obj);
      } else {
        const img = new Image();
        img.alt = certName;
        img.style.cssText = 'width:100%;border-radius:0.75rem;display:none;';
        img.onload  = () => { m.contentEl.innerHTML = ''; img.style.display = 'block'; m.contentEl.appendChild(img); };
        img.onerror = () => { m.contentEl.innerHTML = `<div class="cert-error"><i class="fas fa-exclamation-circle"></i><p>Could not load preview.</p><a href="${certPath}" target="_blank" rel="noopener" class="btn btn-outline-primary btn-sm"><i class="fas fa-external-link-alt me-1"></i>Open directly</a></div>`; };
        img.src = certPath;
      }

      m.modal.classList.add('is-open');
      m.modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('cert-modal-open');
      const certBox = m.modal.querySelector('.section-cert-modal-box') || m.modal.querySelector('[tabindex="-1"]');
      if(certBox){ certBox.setAttribute('tabindex','-1'); setTimeout(()=>certBox.focus({ preventScroll:true }),50); }
    });
  });
}

/* ── 13. CONTACT ── */
function initContact(){
  const form=document.getElementById('contactForm'); if(!form) return;
  const btn=document.getElementById('contactSubmitBtn');
  const successEl=document.getElementById('contactSuccess');
  const errorEl=document.getElementById('contactError');

  form.addEventListener('submit', async e=>{
    e.preventDefault();
    if(!form.checkValidity()){
      form.classList.add('was-validated');
      form.querySelectorAll('input,textarea,select').forEach(el=>{
        el.setAttribute('aria-invalid', el.validity.valid ? 'false' : 'true');
      });
      form.querySelector(':invalid')?.focus();
      return;
    }
    form.querySelectorAll('[aria-invalid]').forEach(el=>el.removeAttribute('aria-invalid'));

    if(btn){ btn.disabled=true; btn.innerHTML='<i class="fas fa-spinner fa-spin me-2"></i>Sending…'; }
    successEl?.classList.add('d-none');
    errorEl?.classList.add('d-none');

    try{
      const res=await fetch(form.action,{method:'POST',body:new FormData(form),headers:{'Accept':'application/json'}});
      if(res.ok){
        form.reset(); form.classList.remove('was-validated');
        form.querySelectorAll('[aria-invalid]').forEach(el=>el.removeAttribute('aria-invalid'));
        successEl?.classList.remove('d-none');
        successEl?.scrollIntoView({behavior:'smooth',block:'nearest'});
      } else { throw new Error('server'); }
    } catch{
      errorEl?.classList.remove('d-none');
    } finally{
      if(btn){ btn.disabled=false; btn.innerHTML='<i class="fas fa-paper-plane me-2"></i>Send Message'; }
    }
  });
}

/* small toast for placeholder links */
function showLinkToast(anchor){
  let toast = document.getElementById('_linkToast');
  if(!toast){
    toast = document.createElement('div');
    toast.id = '_linkToast';
    toast.setAttribute('role','status');
    toast.setAttribute('aria-live','polite');
    Object.assign(toast.style, {
      position:'fixed', bottom:'1.5rem', left:'50%', transform:'translateX(-50%) translateY(8px)',
      background:'var(--card,#1e293b)', color:'var(--text,#dde3f0)',
      padding:'.5rem 1.25rem', borderRadius:'999px', fontSize:'.85rem',
      boxShadow:'0 4px 20px rgba(0,0,0,.35)', zIndex:'99999',
      opacity:'0', transition:'opacity .2s ease, transform .2s ease',
      whiteSpace:'nowrap', pointerEvents:'none'
    });
    document.body.appendChild(toast);
  }
  const label = anchor.textContent.trim() || 'Link';
  toast.textContent = `${label} not available yet`;
  toast.style.opacity = '1';
  toast.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(()=>{
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(8px)';
  }, 2200);
}

/* ── 13. PROJECT DETAIL MODAL ── */
function initProjectModal(){
  const modal     = document.getElementById('projectModal');
  const closeBtn  = document.getElementById('projModalClose');
  if(!modal) return;

  const titleEl   = document.getElementById('projModalTitle');
  const tagEl     = document.getElementById('projModalTag');
  const descEl    = document.getElementById('projModalDesc');
  const actionsEl = document.getElementById('projModalActions');

  function openModal(card){
    const title   = card.querySelector('.card-title')?.textContent?.trim() || '';
    const tag     = card.querySelector('.project-tag')?.textContent?.trim() || '';
    const desc    = card.querySelector('.card-text')?.textContent?.trim() || '';
    const actions = card.querySelector('.project-actions');

    if(titleEl) titleEl.textContent = title;
    if(tagEl)   tagEl.textContent   = tag;
    if(descEl)  descEl.textContent  = desc;
    if(actionsEl && actions) actionsEl.innerHTML = actions.innerHTML;

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden','false');
    closeBtn?.focus({ preventScroll: true });
  }
  function closeModal(){
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden','true');
  }

  closeBtn?.addEventListener('click', closeModal);
  modal.addEventListener('click', e=>{ if(e.target===modal) closeModal(); });
  document.addEventListener('keydown', e=>{ if(e.key==='Escape'&&modal.classList.contains('is-open')) closeModal(); });

  // Make entire project card clickable — skip if clicking a link/button inside project-actions
  document.querySelectorAll('.project-card').forEach(card=>{
    card.setAttribute('role','button');
    card.setAttribute('tabindex','0');
    card.setAttribute('aria-label', card.querySelector('.card-title')?.textContent?.trim() || 'Project details');
    card.style.cursor='pointer';
    card.addEventListener('click', e=>{
      if(e.target.closest('.project-actions')){
        // Prevent href="#" Demo/Source placeholders from scrolling to top
        const placeholderLink = e.target.closest('a[href="#"]');
        if(placeholderLink){
          e.preventDefault();
          showLinkToast(placeholderLink);
        }
        return;
      }
      openModal(card);
    });
    card.addEventListener('keydown', e=>{
      if((e.key==='Enter'||e.key===' ') && !e.target.closest('.project-actions')) openModal(card);
    });
  });
}

/* ── 14. HIRE BANNER ── */
function initHireBanner(){
  const banner = document.getElementById('hireBanner');
  const closeBtn = document.getElementById('hireBannerClose');
  if(!banner || !closeBtn) return;
  // Respect previous dismissal in session
  if(sessionStorage.getItem('hireBannerDismissed')) banner.classList.add('dismissed');
  closeBtn.addEventListener('click', ()=>{
    banner.classList.add('dismissed');
    sessionStorage.setItem('hireBannerDismissed','1');
  });
}

/* ── 15. COPY EMAIL ── */
function initCopyEmail(){
  const btn = document.getElementById('copyEmailBtn');
  if(!btn) return;
  btn.addEventListener('click', async ()=>{
    try{
      await navigator.clipboard.writeText('nveeravenkataganesh@gmail.com');
      btn.classList.add('copied');
      btn.innerHTML='<i class="fas fa-check" aria-hidden="true"></i> Copied!';
      setTimeout(()=>{
        btn.classList.remove('copied');
        btn.innerHTML='<i class="fas fa-copy" aria-hidden="true"></i> Copy';
      },2000);
    } catch{
      // Fallback for browsers without clipboard API
      btn.textContent='nveeravenkataganesh@gmail.com';
    }
  });
}

/* ── 16. TESTIMONIALS PAGINATOR + LEAVE A TESTIMONIAL ── */
function initTestimonialsCarousel(){
  const grid   = document.getElementById('tpGrid');
  const navEl  = document.getElementById('tpNav');
  const prevBtn= document.getElementById('tpPrev');
  const nextBtn= document.getElementById('tpNext');
  const pageInfo= document.getElementById('tpPageInfo');
  if(!grid) return;

  const PER_PAGE = 3;
  let cards = Array.from(grid.querySelectorAll('.tp-card'));
  let page  = 0;

  function totalPages(){ return Math.ceil(cards.length / PER_PAGE); }

  function render(){
    const tp = totalPages();
    cards.forEach((c,i)=>{
      const onPage = Math.floor(i / PER_PAGE) === page;
      c.classList.toggle('visible', onPage);
    });
    if(tp > 1){
      navEl.classList.add('visible');
      if(pageInfo) pageInfo.textContent = `Page ${page+1} of ${tp}`;
      if(prevBtn)  prevBtn.disabled = page === 0;
      if(nextBtn)  nextBtn.disabled = page === tp - 1;
    } else {
      navEl.classList.remove('visible');
    }
  }

  prevBtn?.addEventListener('click',()=>{ if(page>0){ page--; render(); } });
  nextBtn?.addEventListener('click',()=>{ if(page<totalPages()-1){ page++; render(); } });

  render();

  // Leave a Testimonial modal
  const openBtn  = document.getElementById('leaveTestimonialBtn');
  const modal    = document.getElementById('leaveTestimonialModal');
  const closeBtn = document.getElementById('ltmClose');
  const cancelBtn= document.getElementById('ltmCancel');
  const form     = document.getElementById('leaveTestimonialForm');
  const feedback = document.getElementById('ltmFeedback');

  function openModal(){
    modal?.classList.add('is-open');
    modal?.setAttribute('aria-hidden','false');
    document.getElementById('ltmName')?.focus({ preventScroll: true });
  }
  function closeModal(){
    modal?.classList.remove('is-open');
    modal?.setAttribute('aria-hidden','true');
    form?.reset();
    if(feedback){ feedback.textContent=''; feedback.className='mb-2 ltm-feedback-hidden'; }
  }

  openBtn?.addEventListener('click', openModal);
  closeBtn?.addEventListener('click', closeModal);
  cancelBtn?.addEventListener('click', closeModal);
  modal?.addEventListener('click', e=>{ if(e.target===modal) closeModal(); });
  document.addEventListener('keydown', e=>{ if(e.key==='Escape' && modal?.classList.contains('is-open')) closeModal(); });

  form?.addEventListener('submit', e=>{
    e.preventDefault();
    const name = document.getElementById('ltmName')?.value.trim();
    const msg  = document.getElementById('ltmMessage')?.value.trim();
    if(!name || !msg){
      if(feedback){
        feedback.textContent = 'Please fill in your name and testimonial.';
        feedback.className = 'mb-2 alert alert-warning py-2';
      }
      return;
    }
    // Show thank-you message (submissions reviewed before going live)
    if(feedback){
      feedback.textContent = 'Thank you! Your testimonial has been submitted for review.';
      feedback.className = 'mb-2 alert alert-success py-2';
    }
    form.querySelectorAll('input,textarea,button[type="submit"]').forEach(el=>el.disabled=true);
    setTimeout(closeModal, 2800);
  });
}

/* ── 18. STAT COUNTERS ── */
function initStatCounters(){
  const counters = document.querySelectorAll('.stat-counter');
  if(!counters.length) return;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    counters.forEach(el=>{ el.textContent = el.dataset.target + (el.dataset.suffix||''); });
    return;
  }
  const obs = new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(!e.isIntersecting) return;
      obs.unobserve(e.target);
      const el = e.target;
      const target = parseInt(el.dataset.target,10);
      const suffix = el.dataset.suffix||'';
      const duration = 1200;
      const start = performance.now();
      function step(now){
        const p = Math.min((now-start)/duration,1);
        const ease = 1-Math.pow(1-p,3); // cubic ease-out
        el.textContent = Math.round(ease*target) + suffix;
        if(p<1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  },{threshold:0.6});
  counters.forEach(c=>obs.observe(c));
}

/* ── 19. URL HASH SYNC ── */
function initHashSync(){
  const sections = Array.from(document.querySelectorAll('main section[id]'));
  if(!sections.length) return;
  const obs = new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(e.isIntersecting && e.intersectionRatio >= 0.35){
        const id = e.target.id;
        history.replaceState(null,'','#'+id);
      }
    });
  },{threshold:0.35});
  sections.forEach(s=>obs.observe(s));
}

/* ── 20. HERO SPHERE (Three.js wireframe) ── */
function initHeroSphere(){
  const container = document.getElementById('heroSphere');
  if(!container || typeof THREE === 'undefined') return;

  const W = container.offsetWidth  || 280;
  const H = container.offsetHeight || 260;

  // Scene + camera
  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
  camera.position.z = 3.2;

  // Renderer — transparent background so hero gradient shows through
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  // Outer wireframe icosahedron (main sphere)
  const outerGeo   = new THREE.IcosahedronGeometry(1, 5);
  const outerEdges = new THREE.EdgesGeometry(outerGeo);
  const outerMat   = new THREE.LineBasicMaterial({
    color: 0xa5b4fc,
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
  });
  const outerMesh = new THREE.LineSegments(outerEdges, outerMat);
  scene.add(outerMesh);

  // Inner counter-rotating icosahedron (depth / glow)
  const innerGeo   = new THREE.IcosahedronGeometry(0.62, 3);
  const innerEdges = new THREE.EdgesGeometry(innerGeo);
  const innerMat   = new THREE.LineBasicMaterial({
    color: 0x67e8f9,
    transparent: true,
    opacity: 0.35,
    blending: THREE.AdditiveBlending,
  });
  const innerMesh = new THREE.LineSegments(innerEdges, innerMat);
  scene.add(innerMesh);

  // Floating dot particles orbiting the sphere
  const pCount    = 220;
  const pPositions = new Float32Array(pCount * 3);
  for(let i = 0; i < pCount; i++){
    const r     = 1.25 + Math.random() * 0.75;
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);
    pPositions[i*3]   = r * Math.sin(phi) * Math.cos(theta);
    pPositions[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
    pPositions[i*3+2] = r * Math.cos(phi);
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
  const pMat = new THREE.PointsMaterial({
    color: 0xa5b4fc,
    size: 0.022,
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(pGeo, pMat);
  scene.add(points);

  // Mouse parallax
  let mx = 0, my = 0, tx = 0, ty = 0;
  const onMouseMove = e => {
    mx = (e.clientX / window.innerWidth  - 0.5) * 2;
    my = -(e.clientY / window.innerHeight - 0.5) * 2;
  };
  window.addEventListener('mousemove', onMouseMove);

  // Resize
  const onResize = () => {
    const w = container.offsetWidth;
    const h = container.offsetHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  window.addEventListener('resize', onResize);

  // Animate
  const clock = new THREE.Clock();
  let rafId;
  (function frame(){
    rafId = requestAnimationFrame(frame);
    const t = clock.getElapsedTime();

    tx += (mx - tx) * 0.04;
    ty += (my - ty) * 0.04;

    outerMesh.rotation.y = t * 0.14 + tx * 0.28;
    outerMesh.rotation.x = t * 0.07 + ty * 0.18;

    innerMesh.rotation.y = -t * 0.22 + tx * 0.18;
    innerMesh.rotation.x = -t * 0.11 + ty * 0.12;

    points.rotation.y = t * 0.06;
    points.rotation.x = t * 0.04;

    renderer.render(scene, camera);
  })();

  // Clean up if galaxy stops (dark→light) — reuse same lifecycle
  window._heroSphereCleanup = () => {
    cancelAnimationFrame(rafId);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('resize', onResize);
    renderer.dispose();
  };
}

/* ── 21. FOOTER ── */
function initFooter(){
  const yr=document.getElementById('footerYear'); if(yr) yr.textContent=new Date().getFullYear();
}

/* ── BOOT ── */
document.addEventListener('DOMContentLoaded', () => {
  initHeroSphere();
  initGalaxy();
  initTheme();
  initTyped();
  initScrollBar();
  initBackToTop();
  initHeader();
  initTimeline();
  initSkills();
  initSkillCharts();
  initProjectFilter();
  initCertModal();
  initProjectModal();
  initContact();
  initFooter();
  initPhotoTilt();
  initHeroParallax();
  initHireBanner();
  initCopyEmail();
  initTestimonialsCarousel();
  initStatCounters();
  initHashSync();
});

// GSAP scripts are loaded synchronously at end of <body> before app.js,
// so by window.load they are guaranteed to be defined.
window.addEventListener('load', () => {
  initAnimations();
});