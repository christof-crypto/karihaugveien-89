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
  }
});
