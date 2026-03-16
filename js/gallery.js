document.addEventListener('DOMContentLoaded', () => {

    // Nav, theme, header, sidebar, footer handled by app.js

    // ── GALLERY DATA ──
    const items = [
      { type:'photo', src:'images/Aaruush.jpg',               alt:'Core Team of Aaruush 22' },
      { type:'photo', src:'images/NASA-SAC.jpg',               alt:'NASA Space Apps Challenge' },
      { type:'photo', src:'images/Ganesh.jpg',                 alt:'Admiration Day' },
      { type:'photo', src:'images/IMG20220805181152.jpg',       alt:'August 15 Event' },
      { type:'video', src:'images/HACK%20SUMMIT%203.0%20Teaser.mp4',
        poster:'images/_DSC0024.jpg',                          alt:'Hack Summit 3.0 Teaser' },
      { type:'video', src:'images/Hack%20Summit%203.0.mp4',
        poster:'images/Aaruush%2022%20backdrop.png',           alt:'Hack Summit 3.0 After Movie' }
    ];

    // ── STATE ──
    let filterType        = 'all';
    let currentIndex      = 0;       // index within filtered list
    let viewMode          = 'split'; // 'split' | 'grid'
    let slideshowOn       = false;
    let slideshowInterval = 4000;    // ms per slide
    let slideshowElapsed  = 0;
    let slideshowTick     = null;

    // ── HELPERS ──
    const filtered = () => items.filter(i => filterType === 'all' || i.type === filterType);
    const clamp    = (idx, list) => ((idx % list.length) + list.length) % list.length;

    function showToast(msg) {
      const t = document.getElementById('toast');
      t.textContent = msg;
      t.classList.add('show');
      clearTimeout(t._hide);
      t._hide = setTimeout(() => t.classList.remove('show'), 2200);
    }

    // ── COUNTER ELEMENTS ──
    const visibleCountEl = document.getElementById('visibleCount');
    const totalCountEl   = document.getElementById('totalCount');
    const currentCaptionEl = document.getElementById('currentCaption');

    function updateCounters() {
      const list = filtered();
      visibleCountEl.textContent = list.length;
      totalCountEl.textContent   = items.length;
    }

    // ── RENDER THUMBNAILS ──
    const thumbsEl = document.getElementById('thumbsContainer');

    function renderThumbnails() {
      // Show skeletons first
      thumbsEl.innerHTML = '';
      const list = filtered();
      list.forEach((_, i) => {
        const skel = document.createElement('div');
        skel.className = 'thumb-skeleton';
        thumbsEl.appendChild(skel);
      });

      // Replace with real thumbs after micro delay (simulate lazy)
      setTimeout(() => {
        thumbsEl.innerHTML = '';
        list.forEach((item, idx) => {
          const div = document.createElement('div');
          div.className = 'thumb';
          div.dataset.idx = idx;
          div.setAttribute('role', 'button');
          div.setAttribute('tabindex', '0');
          div.setAttribute('aria-label', item.alt);

          const ring = document.createElement('div');
          ring.className = 'autoplay-ring';
          div.appendChild(ring);

          const img = document.createElement('img');
          img.loading = 'lazy';
          img.alt = item.alt;
          img.src = item.type === 'photo' ? item.src : (item.poster || '');

          if (item.type === 'video') {
            const overlay = document.createElement('div');
            overlay.className = 'play-icon';
            overlay.innerHTML = '<i class="fas fa-play-circle" aria-hidden="true"></i>';
            div.appendChild(overlay);
          }

          // Label
          const label = document.createElement('div');
          label.className = 'thumb-label';
          label.textContent = item.alt;
          div.appendChild(img);
          div.appendChild(label);

          // Error fallback
          img.onerror = () => {
            img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="120"><rect fill="%23334155" width="200" height="120"/><text fill="%2394a3b8" font-size="12" x="50%" y="50%" text-anchor="middle" dominant-baseline="middle">No Image</text></svg>';
          };

          div.addEventListener('click', () => { currentIndex = idx; showPreview(); });
          div.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); currentIndex = idx; showPreview(); } });

          thumbsEl.appendChild(div);
        });
        highlightThumb();
      }, 60);
    }

    function highlightThumb() {
      thumbsEl.querySelectorAll('.thumb').forEach(t => t.classList.remove('active', 'autoplay-active'));
      const active = thumbsEl.querySelector(`.thumb[data-idx="${currentIndex}"]`);
      if (active) {
        active.classList.add('active');
        if (slideshowOn) active.classList.add('autoplay-active');
        active.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }

    // ── SHOW PREVIEW ──
    const previewMedia   = document.getElementById('previewMedia');
    const captionCounter = document.getElementById('captionCounter');
    const captionText    = document.getElementById('captionText');
    const captionType    = document.getElementById('captionType');
    const mobileCounter  = document.getElementById('mobileCounter');

    function showPreview(skipFade = false) {
      const list = filtered();
      if (!list.length) {
        previewMedia.innerHTML = '<div class="empty-state"><i class="fas fa-photo-video"></i><span>No items to display</span></div>';
        captionText.textContent = 'No items';
        return;
      }

      currentIndex = clamp(currentIndex, list);
      const item = list[currentIndex];

      // Pause any playing video first
      const oldVid = previewMedia.querySelector('video');
      if (oldVid) oldVid.pause();

      const doRender = () => {
        previewMedia.innerHTML = '';
        if (item.type === 'photo') {
          const img = document.createElement('img');
          img.alt = item.alt;
          img.src = item.src;
          img.style.cursor = 'zoom-in';
          img.onerror = () => {
            previewMedia.innerHTML = '<div class="preview-error"><i class="fas fa-exclamation-triangle"></i><span>Image failed to load</span></div>';
          };
          img.addEventListener('click', () => openLightbox(currentIndex));
          previewMedia.appendChild(img);
        } else {
          const vid = document.createElement('video');
          vid.src = item.src;
          vid.controls = true;
          vid.poster = item.poster || '';
          vid.preload = 'metadata';
          vid.onerror = () => {
            previewMedia.innerHTML = '<div class="preview-error"><i class="fas fa-exclamation-triangle"></i><span>Video failed to load</span></div>';
          };
          previewMedia.appendChild(vid);
        }
        previewMedia.classList.remove('fading');
        previewMedia.classList.add('visible');
      };

      if (!skipFade) {
        previewMedia.classList.remove('visible');
        previewMedia.classList.add('fading');
        setTimeout(doRender, 180);
      } else {
        doRender();
      }

      // Update captions
      const total = list.length;
      captionCounter.textContent = `${currentIndex + 1} / ${total}`;
      captionText.textContent    = item.alt || '';
      captionType.textContent    = item.type === 'video' ? 'Video' : 'Photo';
      mobileCounter.textContent  = `${currentIndex + 1} / ${total}`;
      currentCaptionEl.textContent = item.alt;

      highlightThumb();

      // Update grid active (only when grid visible to avoid unnecessary DOM queries)
      if (viewMode === 'grid') {
        document.querySelectorAll('.grid-item').forEach(g => g.classList.remove('active'));
        const gActive = document.querySelector(`.grid-item[data-idx="${currentIndex}"]`);
        if (gActive) gActive.classList.add('active');
      }
    }

    // ── GRID RENDER ──
    const gridMasonry = document.getElementById('gridMasonry');

    function renderGrid() {
      gridMasonry.innerHTML = '';
      filtered().forEach((item, idx) => {
        const div = document.createElement('div');
        div.className = 'grid-item';
        div.dataset.idx = idx;
        div.setAttribute('role', 'button');
        div.setAttribute('tabindex', '0');
        div.setAttribute('aria-label', `Open ${item.alt}`);

        if (item.type === 'photo') {
          const img = document.createElement('img');
          img.src = item.src;
          img.alt = item.alt;
          img.loading = 'lazy';
          img.onerror = () => img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="120"><rect fill="%23334155" width="200" height="120"/></svg>';
          div.appendChild(img);
        } else {
          const img = document.createElement('img');
          img.src = item.poster || '';
          img.alt = item.alt;
          img.loading = 'lazy';
          div.appendChild(img);
        }

        const overlay = document.createElement('div');
        overlay.className = 'grid-overlay';
        const oi = document.createElement('i');
        oi.className = `fas fa-${item.type === 'video' ? 'play-circle' : 'expand'}`;
        oi.setAttribute('aria-hidden', 'true');
        const os = document.createElement('span');
        os.textContent = item.alt; // textContent prevents XSS
        overlay.appendChild(oi);
        overlay.appendChild(os);
        div.appendChild(overlay);

        div.addEventListener('click', () => { if (viewMode === 'grid') openLightbox(idx); });
        div.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(idx); }
        });

        gridMasonry.appendChild(div);
      });
    }

    // ── LIGHTBOX ──
    const lightbox  = document.getElementById('lightbox');
    const lbContent = document.getElementById('lbContent');
    const lbCaption = document.getElementById('lbCaption');
    const lbCounter = document.getElementById('lbCounter');
    let lbIndex = 0;

    let _lbOpener = null;
    function openLightbox(idx) {
      _lbOpener = document.activeElement;
      lbIndex = idx;
      renderLightbox();
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
      document.getElementById('lbClose')?.focus({ preventScroll: true });
    }

    function closeLightbox() {
      // Pause lightbox video if playing
      const v = lbContent.querySelector('video');
      if (v) v.pause();
      lightbox.classList.remove('open');
      document.body.style.overflow = '';
      _lbOpener?.focus();
      _lbOpener = null;
    }

    function renderLightbox() {
      const list = filtered();
      if (!list.length) return;
      lbIndex = clamp(lbIndex, list);
      const item = list[lbIndex];

      // Pause existing video
      const oldVid = lbContent.querySelector('video');
      if (oldVid) oldVid.pause();
      lbContent.innerHTML = '';

      if (item.type === 'photo') {
        const img = document.createElement('img');
        img.src = item.src;
        img.alt = item.alt;
        lbContent.appendChild(img);
      } else {
        const vid = document.createElement('video');
        vid.src = item.src;
        vid.poster = item.poster || '';
        vid.controls = true;
        vid.autoplay = true;
        lbContent.appendChild(vid);
      }

      lbCaption.textContent = item.alt;
      lbCounter.textContent = `${lbIndex + 1} / ${list.length}`;
    }

    document.getElementById('lbClose').addEventListener('click', closeLightbox);
    document.getElementById('lbPrev').addEventListener('click', () => { const _lbList=filtered(); lbIndex=((lbIndex-1)+_lbList.length)%_lbList.length; renderLightbox(); currentIndex=lbIndex; showPreview(true); });
    document.getElementById('lbNext').addEventListener('click', () => { const _lbList=filtered(); lbIndex=(lbIndex+1)%_lbList.length; renderLightbox(); currentIndex=lbIndex; showPreview(true); });
    lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
    // Focus trap — keep keyboard focus inside lightbox while open
    lightbox.addEventListener('keydown', e => {
      if (e.key !== 'Tab' || !lightbox.classList.contains('open')) return;
      const focusable = Array.from(lightbox.querySelectorAll('button:not([disabled]),a[href],[tabindex="0"]')).filter(el => el.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last.focus(); } }
      else            { if (document.activeElement === last)  { e.preventDefault(); first.focus(); } }
    });

    // ── FULLSCREEN ──
    function toggleFullscreen() {
      if (!document.fullscreenElement) {
        const el = document.getElementById('previewContainer');
        if (el.requestFullscreen) {
          el.requestFullscreen().catch(() => showToast('Fullscreen not available'));
          showToast('Press Esc to exit fullscreen');
        } else {
          showToast('Fullscreen not available');
        }
      } else {
        document.exitFullscreen?.();
      }
    }
    document.getElementById('mobileFullscreen').addEventListener('click', toggleFullscreen);

    // ── PREV / NEXT ──
    function navigate(dir) {
      const list = filtered();
      currentIndex = clamp(currentIndex + dir, list);
      showPreview();
      if (slideshowOn) resetSlideshowTimer();
    }

    document.getElementById('prevBtn').addEventListener('click', () => navigate(-1));
    document.getElementById('nextBtn').addEventListener('click', () => navigate(1));
    document.getElementById('mobilePrev').addEventListener('click', () => navigate(-1));
    document.getElementById('mobileNext').addEventListener('click', () => navigate(1));

    // ── SWIPE SUPPORT ──
    let touchStartX = 0, touchStartY = 0;
    previewMedia.addEventListener('touchstart', e => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });
    previewMedia.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
        navigate(dx < 0 ? 1 : -1);
      }
    }, { passive: true });

    // ── KEYBOARD ──
    document.addEventListener('keydown', e => {
      // Don't fire if user is typing in an input
      if (['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)) return;

      if (e.key === 'ArrowLeft')  { e.preventDefault(); navigate(-1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); navigate(1);  }
      if (e.key === 'f' || e.key === 'F') toggleFullscreen();
      if (e.key === 'Escape' && lightbox.classList.contains('open')) closeLightbox();

      if (e.key === ' ') {
        e.preventDefault();
        const vid = previewMedia.querySelector('video');
        if (vid) {
          vid.paused ? vid.play() : vid.pause();
          showToast(vid.paused ? '⏸ Paused' : '▶ Playing');
        } else {
          toggleSlideshow();
        }
      }
    });

    // ── SLIDESHOW ──
    const slideshowBtn      = document.getElementById('slideshowBtn');
    const slideshowProgress = document.getElementById('slideshowProgress');

    function startSlideshowTimer() {
      clearInterval(slideshowTick); // guard against stacking intervals
      slideshowElapsed = 0;
      slideshowProgress.style.width = '0%';

      slideshowTick = setInterval(() => {
        slideshowElapsed += 100;
        const pct = Math.min((slideshowElapsed / slideshowInterval) * 100, 100);
        slideshowProgress.style.width = pct + '%';
        if (slideshowElapsed >= slideshowInterval) navigate(1);
      }, 100);
    }

    function stopSlideshowTimer() {
      clearInterval(slideshowTick);
      slideshowProgress.style.width = '0%';
    }

    function resetSlideshowTimer() {
      stopSlideshowTimer();
      if (slideshowOn) startSlideshowTimer();
    }

    function toggleSlideshow() {
      slideshowOn = !slideshowOn;
      if (slideshowOn) {
        slideshowBtn.innerHTML = '<i class="fas fa-stop"></i> Stop';
        slideshowBtn.classList.add('active');
        startSlideshowTimer();
        showToast('▶ Slideshow started — Space to stop');
      } else {
        slideshowBtn.innerHTML = '<i class="fas fa-play"></i> Slideshow';
        slideshowBtn.classList.remove('active');
        stopSlideshowTimer();
        showToast('⏸ Slideshow stopped');
      }
      highlightThumb();
    }

    slideshowBtn.addEventListener('click', toggleSlideshow);

    // ── FILTER ──
    document.querySelectorAll('.view-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.view-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        filterType = pill.dataset.filter;
        currentIndex = 0;
        updateCounters();
        renderThumbnails();
        renderGrid();
        showPreview();
        if (slideshowOn) resetSlideshowTimer();
      });
    });

    // ── VIEW MODE TOGGLE ──
    const splitView = document.getElementById('splitView');
    const gridView  = document.getElementById('gridView');
    const splitBtn  = document.getElementById('splitBtn');
    const gridBtn   = document.getElementById('gridBtn');

    function setViewMode(mode) {
      viewMode = mode;
      if (mode === 'split') {
        splitView.style.display = '';
        gridView.classList.remove('active');
        splitBtn.classList.add('active');
        gridBtn.classList.remove('active');
      } else {
        splitView.style.display = 'none';
        gridView.classList.add('active');
        splitBtn.classList.remove('active');
        gridBtn.classList.add('active');
        renderGrid();
      }
    }

    splitBtn.addEventListener('click', () => setViewMode('split'));
    gridBtn.addEventListener('click',  () => setViewMode('grid'));

    // ── INIT ──
    updateCounters();
    renderThumbnails();
    showPreview(true);

  }); // end DOMContentLoaded
