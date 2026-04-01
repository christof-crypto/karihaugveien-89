// ===== SCROLL-DRIVEN VIDEO FRAMES =====
(function() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const FRAME_COUNT = 60;
  const frames = [];
  let loaded = 0;
  let currentFrame = 0;
  let targetFrame = 0;
  let animating = false;

  // Preload all frames
  for (let i = 1; i <= FRAME_COUNT; i++) {
    const img = new Image();
    img.src = `Bilder/frames/frame-${String(i).padStart(3, '0')}.jpg`;
    img.onload = () => {
      loaded++;
      if (loaded === 1) drawFrame(0); // Draw first frame immediately
    };
    frames.push(img);
  }

  function drawFrame(index) {
    const img = frames[index];
    if (!img || !img.complete) return;

    // Set canvas size to match display
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }

    // Cover-fit: fill canvas while maintaining aspect ratio
    const imgRatio = img.width / img.height;
    const canvasRatio = canvas.width / canvas.height;
    let sx = 0, sy = 0, sw = img.width, sh = img.height;

    if (imgRatio > canvasRatio) {
      // Image wider than canvas — crop sides
      sw = img.height * canvasRatio;
      sx = (img.width - sw) / 2;
    } else {
      // Image taller — crop top/bottom
      sh = img.width / canvasRatio;
      sy = (img.height - sh) / 2;
    }

    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  }

  // Scroll handler
  const wrap = document.querySelector('.hero-parallax-wrap');
  if (!wrap) return;

  // Smooth lerp loop — interpolates toward target frame
  function animateFrames() {
    if (Math.abs(targetFrame - currentFrame) < 0.5) {
      currentFrame = targetFrame;
      drawFrame(Math.round(currentFrame));
      animating = false;
      return;
    }
    // Lerp: ease toward target (higher = snappier, lower = smoother)
    currentFrame += (targetFrame - currentFrame) * 0.18;
    drawFrame(Math.round(currentFrame));
    requestAnimationFrame(animateFrames);
  }

  function onScroll() {
    const rect = wrap.getBoundingClientRect();
    const scrollHeight = wrap.offsetHeight - window.innerHeight;
    if (scrollHeight <= 0) return;

    const scrolled = -rect.top;
    const progress = Math.max(0, Math.min(1, scrolled / scrollHeight));
    targetFrame = Math.min(FRAME_COUNT - 1, progress * (FRAME_COUNT - 1));

    if (!animating) {
      animating = true;
      requestAnimationFrame(animateFrames);
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => drawFrame(Math.round(currentFrame)));
})();

// ===== MOBILE MENU =====
document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');

  if (hamburger) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      hamburger.classList.toggle('active');
    });

    // Close menu on link click
    document.querySelectorAll('.nav-links a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        hamburger.classList.remove('active');
      });
    });
  }

  // ===== CONTACT FORM =====
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const formData = new FormData(contactForm);

      fetch(contactForm.action, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
      }).then(response => {
        if (response.ok) {
          contactForm.style.display = 'none';
          document.querySelector('.form-success').classList.add('show');
          contactForm.reset();

          setTimeout(() => {
            contactForm.style.display = 'block';
            document.querySelector('.form-success').classList.remove('show');
          }, 5000);
        } else {
          alert('Noe gikk galt. Vennligst prøv igjen eller kontakt oss direkte på co@oroeiendom.no');
        }
      }).catch(() => {
        alert('Noe gikk galt. Vennligst prøv igjen eller kontakt oss direkte på co@oroeiendom.no');
      });
    });
  }

  // ===== NAVBAR SCROLL EFFECT =====
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        navbar.style.background = 'rgba(26, 29, 35, 0.98)';
      } else {
        navbar.style.background = 'rgba(26, 29, 35, 0.95)';
      }
    });
  }

  // ===== INTERSECTION OBSERVER FOR ANIMATIONS =====
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);

  document.querySelectorAll('.fact-card, .location-card, .lokal-card, .breeam-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });

  // ===== SCROLL REVEAL SECTIONS =====
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.01, rootMargin: '0px 0px 0px 0px' });

  document.querySelectorAll('.reveal-section').forEach(el => {
    // If already in viewport on load, reveal immediately
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      el.classList.add('revealed');
    } else {
      revealObserver.observe(el);
    }
  });

  // ===== ELEGANT CAROUSEL =====
  const ecWrapper = document.querySelector('.ec-wrapper');
  if (ecWrapper && typeof EC_SLIDES !== 'undefined') {
    let ecIndex = 0;
    let ecTransitioning = false;
    let ecProgress = 0;
    let ecPaused = false;
    const SLIDE_DUR = 6000;
    const TRANS_DUR = 700;
    const slides = EC_SLIDES;

    const $ = (sel) => ecWrapper.querySelector(sel);
    const $$ = (sel) => ecWrapper.querySelectorAll(sel);

    function ecUpdate() {
      const s = slides[ecIndex];
      // Animate out
      ecTransitioning = true;
      $$('.ec-collection-num, .ec-title, .ec-subtitle, .ec-description, .ec-specs, .ec-image-frame').forEach(el => el.classList.remove('visible'));

      setTimeout(() => {
        // Update content
        $('.ec-num-text').textContent = String(ecIndex + 1).padStart(2, '0') + ' / ' + String(slides.length).padStart(2, '0');
        $('.ec-title').textContent = s.navn;
        $('.ec-subtitle').textContent = s.areal + ' — ' + s.undertittel;
        $('.ec-subtitle').style.color = s.accent;
        $('.ec-description').textContent = s.beskrivelse;

        // Specs
        const specsEl = $('.ec-specs');
        specsEl.innerHTML = s.specs.map(sp =>
          '<div><div class="ec-spec-label">' + sp.label + '</div><div class="ec-spec-value">' + sp.verdi + '</div></div>'
        ).join('');

        // Image
        $('.ec-image-frame img').src = s.bilde;
        $('.ec-image-frame img').alt = s.navn + ' – ' + s.areal;
        $('.ec-image-overlay').style.background = 'linear-gradient(135deg, ' + s.accent + '22 0%, transparent 50%)';
        $('.ec-bg-wash').style.background = 'radial-gradient(ellipse at 70% 50%, ' + s.accent + '18 0%, transparent 70%)';
        $$('.ec-frame-corner').forEach(c => c.style.borderColor = s.accent);

        // CTA button color (if present)
        const cta = $('.ec-cta-btn');
        if (cta) {
          cta.style.background = s.accent;
          cta.style.color = (s.accent === '#c8a951' || s.accent === '#059669') ? '#0f172a' : '#ffffff';
        }

        // Filmstrip thumbnails
        const filmstrip = $('.ec-filmstrip');
        if (filmstrip) {
          const gallery = s.galleri || [s.bilde];
          filmstrip.innerHTML = gallery.map((src, i) =>
            '<button class="ec-thumb' + (i === 0 ? ' active' : '') + '" data-src="' + src + '"><img src="' + src + '" alt="Bilde ' + (i+1) + '"></button>'
          ).join('');
          // Thumb click -> swap main image
          filmstrip.querySelectorAll('.ec-thumb').forEach(btn => {
            btn.addEventListener('click', () => {
              $('.ec-main-img').src = btn.dataset.src;
              filmstrip.querySelectorAll('.ec-thumb').forEach(t => t.classList.remove('active'));
              btn.classList.add('active');
            });
          });
        }

        // Progress bar
        $$('.ec-progress-item').forEach((item, i) => {
          item.classList.toggle('active', i === ecIndex);
          const fill = item.querySelector('.ec-progress-fill');
          fill.style.backgroundColor = i === ecIndex ? s.accent : '';
          fill.style.width = i < ecIndex ? '100%' : '0%';
        });

        // Animate in
        setTimeout(() => {
          $$('.ec-collection-num, .ec-title, .ec-subtitle, .ec-description, .ec-specs, .ec-image-frame').forEach(el => el.classList.add('visible'));
          ecTransitioning = false;
        }, 50);
      }, TRANS_DUR / 2);
    }

    function ecGoTo(idx) {
      if (ecTransitioning || idx === ecIndex) return;
      ecIndex = idx;
      ecProgress = 0;
      ecUpdate();
    }

    function ecNext() { ecGoTo((ecIndex + 1) % slides.length); }
    function ecPrev() { ecGoTo((ecIndex - 1 + slides.length) % slides.length); }

    // Nav arrows
    const prevBtn = $('.ec-arrow-btn[data-dir="prev"]');
    const nextBtn = $('.ec-arrow-btn[data-dir="next"]');
    if (prevBtn) prevBtn.addEventListener('click', ecPrev);
    if (nextBtn) nextBtn.addEventListener('click', ecNext);

    // Progress buttons
    $$('.ec-progress-item').forEach((btn, i) => {
      btn.addEventListener('click', () => ecGoTo(i));
    });

    // Pause on hover
    ecWrapper.addEventListener('mouseenter', () => { ecPaused = true; });
    ecWrapper.addEventListener('mouseleave', () => { ecPaused = false; });

    // Touch support
    let touchX = 0;
    ecWrapper.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
    ecWrapper.addEventListener('touchend', (e) => {
      const diff = touchX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 60) { diff > 0 ? ecNext() : ecPrev(); }
    });

    // Auto advance + progress
    setInterval(() => {
      if (ecPaused || ecTransitioning) return;
      ecProgress += 100 / (SLIDE_DUR / 50);
      const activeFill = ecWrapper.querySelector('.ec-progress-item.active .ec-progress-fill');
      if (activeFill) activeFill.style.width = Math.min(ecProgress, 100) + '%';
      if (ecProgress >= 100) { ecProgress = 0; ecNext(); }
    }, 50);

    // Init first slide
    ecUpdate();

    // ===== LIGHTBOX =====
    const lightbox = document.getElementById('ecLightbox');
    if (lightbox) {
      let lbImages = [];
      let lbIndex = 0;
      const lbImg = lightbox.querySelector('.ec-lightbox-img');
      const lbStrip = lightbox.querySelector('.ec-lightbox-strip');

      function lbOpen(gallery, startIdx) {
        lbImages = gallery;
        lbIndex = startIdx || 0;
        lbRender();
        lightbox.classList.add('open');
        document.body.style.overflow = 'hidden';
      }

      function lbClose() {
        lightbox.classList.remove('open');
        document.body.style.overflow = '';
      }

      function lbRender() {
        lbImg.src = lbImages[lbIndex];
        lbStrip.innerHTML = lbImages.map((src, i) =>
          '<button class="ec-lthumb' + (i === lbIndex ? ' active' : '') + '"><img src="' + src + '" alt="Bilde ' + (i+1) + '"></button>'
        ).join('');
        lbStrip.querySelectorAll('.ec-lthumb').forEach((btn, i) => {
          btn.addEventListener('click', () => { lbIndex = i; lbRender(); });
        });
      }

      lightbox.querySelector('.ec-lightbox-close').addEventListener('click', lbClose);
      lightbox.querySelector('.ec-lightbox-prev').addEventListener('click', () => { lbIndex = (lbIndex - 1 + lbImages.length) % lbImages.length; lbRender(); });
      lightbox.querySelector('.ec-lightbox-next').addEventListener('click', () => { lbIndex = (lbIndex + 1) % lbImages.length; lbRender(); });
      lightbox.addEventListener('click', (e) => { if (e.target === lightbox) lbClose(); });
      document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('open')) return;
        if (e.key === 'Escape') lbClose();
        if (e.key === 'ArrowLeft') { lbIndex = (lbIndex - 1 + lbImages.length) % lbImages.length; lbRender(); }
        if (e.key === 'ArrowRight') { lbIndex = (lbIndex + 1) % lbImages.length; lbRender(); }
      });

      // Click main image or thumb -> open lightbox
      ecWrapper.addEventListener('click', (e) => {
        const mainImg = e.target.closest('.ec-main-img');
        if (mainImg) {
          const s = slides[ecIndex];
          const gallery = s.galleri || [s.bilde];
          const activeThumb = ecWrapper.querySelector('.ec-thumb.active');
          const clickedSrc = activeThumb ? activeThumb.dataset.src : s.bilde;
          const startIdx = gallery.indexOf(clickedSrc);
          lbOpen(gallery, startIdx >= 0 ? startIdx : 0);
        }
      });
    }
  }

  // ===== ETASJEPLAN INTERAKTIVITET =====
  if (typeof FP_DATA !== 'undefined' && FP_DATA.length > 0) {
    const zones = document.querySelectorAll('.fp-zone');
    const legends = document.querySelectorAll('.fp-legend-item');
    const detailEmpty = document.querySelector('.fp-detail-empty');
    const detailContent = document.getElementById('fpDetailContent');

    function selectZone(idx) {
      if (idx < 0 || idx >= FP_DATA.length) return;
      const d = FP_DATA[idx];

      // Highlight SVG zone
      zones.forEach(z => {
        z.classList.remove('active');
        z.style.strokeWidth = '0';
      });
      document.querySelectorAll(`.fp-zone[data-zone="${idx}"]`).forEach(z => {
        z.classList.add('active');
        z.style.strokeWidth = '2';
      });

      // Highlight legend
      legends.forEach(l => l.classList.remove('active'));
      if (legends[idx]) legends[idx].classList.add('active');

      // Fill detail panel
      if (detailEmpty) detailEmpty.style.display = 'none';
      if (detailContent) detailContent.style.display = 'block';

      document.getElementById('fpBadge').textContent = 'Ledig';
      document.getElementById('fpTitle').textContent = d.navn;
      document.getElementById('fpSub').textContent = d.areal + ' — ' + d.undertittel;
      document.getElementById('fpSub').style.color = d.accent;
      document.getElementById('fpDesc').textContent = d.beskrivelse;

      const specsEl = document.getElementById('fpSpecs');
      specsEl.innerHTML = d.specs.map(s =>
        `<div class="fp-detail-spec"><div class="fp-detail-spec-label">${s.label}</div><div class="fp-detail-spec-value">${s.verdi}</div></div>`
      ).join('');

      const galEl = document.getElementById('fpGallery');
      galEl.innerHTML = (d.galleri || []).map((src, i) =>
        `<img src="${src}" alt="${d.navn} bilde ${i+1}" onclick="if(window.openLightbox) openLightbox('${src}')">`
      ).join('');
    }

    // Click on SVG zones
    zones.forEach(z => {
      z.addEventListener('click', () => selectZone(parseInt(z.dataset.zone)));
    });

    // Click on legend items
    legends.forEach((l, i) => {
      l.addEventListener('click', () => selectZone(parseInt(l.dataset.zone)));
    });

    // Hover effect on SVG
    zones.forEach(z => {
      z.addEventListener('mouseenter', () => {
        if (!z.classList.contains('active')) z.style.strokeWidth = '1.5';
      });
      z.addEventListener('mouseleave', () => {
        if (!z.classList.contains('active')) z.style.strokeWidth = '0';
      });
    });
  }
});
