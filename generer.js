/**
 * generer.js - Bygge-script for eiendomsnettsider
 *
 * Bruk: node generer.js
 *
 * Leser config.json og HTML-maler fra maler/-mappen,
 * erstatter plassholdere, og genererer ferdige HTML- og CSS-filer.
 */

const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, 'config.json');
const TEMPLATES_DIR = path.join(__dirname, 'maler');
const CSS_TEMPLATE = path.join(__dirname, 'styles.template.css');

// --- Les config ---
if (!fs.existsSync(CONFIG_FILE)) {
  console.error('FEIL: config.json ikke funnet. Opprett config.json forst.');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
console.log(`Genererer nettside for: ${config.eiendom.navn}`);

// --- Hjelpefunksjoner ---

/** Hent nestet verdi fra objekt med punktnotasjon: "eiendom.navn" -> config.eiendom.navn */
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : '';
  }, obj);
}

/** Erstatt alle {{placeholder}} med verdier fra config */
function replacePlaceholders(template, data) {
  return template.replace(/\{\{([^{}]+)\}\}/g, (match, key) => {
    const value = getNestedValue(data, key.trim());
    if (value === undefined || value === null) {
      console.warn(`  Advarsel: Ingen verdi for {{${key.trim()}}}`);
      return match; // Behold plassholder hvis ingen verdi
    }
    return String(value);
  });
}

// --- SVG-ikoner for beliggenhets-kort ---
const LOCATION_ICONS = {
  vei: '<svg viewBox="0 0 24 24"><path d="M1 6v16h22V6M1 6l11-4 11 4M8 14h8M8 18h8M12 14v4"/></svg>',
  kollektiv: '<svg viewBox="0 0 24 24"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>',
  naering: '<svg viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13"/><polygon points="23 7 16 12 16 7"/></svg>',
  service: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>',
};

// --- Generer dynamiske seksjoner ---

/** Generer bildestripe-HTML (med duplisering for uendelig scroll) */
function genererBildestripe(bilder) {
  const items = bilder.map((src, i) =>
    `        <div class="photo-strip-item"><img src="${src}" alt="Bilde ${i + 1}"></div>`
  ).join('\n');
  // Dupliser for seamless loop
  return items + '\n' + items;
}

/** Generer "Om eiendommen"-avsnitt */
function genererOmAvsnitt(avsnitt) {
  return avsnitt.map(p => `          <p>${p}</p>`).join('\n');
}

/** Generer energimerking-bars med riktig aktiv klasse */
function genererEnergiBars(karakter) {
  const bokstaver = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  return `          <div class="energy-bar-container">\n` +
    bokstaver.map(b => {
      const active = b === karakter.toUpperCase() ? ' active' : '';
      return `            <div class="energy-bar${active}">\n` +
        `              <span class="energy-bar-label">${b}</span>\n` +
        `              <div class="energy-bar-fill ${b.toLowerCase()}">${b}</div>\n` +
        `            </div>`;
    }).join('\n') +
    `\n          </div>`;
}

/** Generer beliggenhets-kort */
function genererBeliggenhetKort(kort) {
  return kort.map(k => {
    const ikon = LOCATION_ICONS[k.ikon] || LOCATION_ICONS.service;
    return `        <div class="location-card">
          <div class="location-icon">
            ${ikon}
          </div>
          <h4>${k.tittel}</h4>
          <p>${k.beskrivelse}</p>
        </div>`;
  }).join('\n');
}

/** Generer lokaler-kort (variabelt antall) */
function genererLokalerKort(lokaler) {
  return lokaler.map(lokal => {
    const statusClass = lokal.status.toLowerCase() === 'ledig' ? 'ledig' : 'opptatt';

    const specs = lokal.spesifikasjoner.map(s =>
      `              <div class="lokal-spec">
                <span class="lokal-spec-label">${s.label}</span>
                <span class="lokal-spec-value">${s.verdi}</span>
              </div>`
    ).join('\n');

    const fotos = lokal.bilder.map((src, i) =>
      `            <div class="lokal-photo"><img src="${src}" alt="${lokal.navn} – Bilde ${i + 1}"></div>`
    ).join('\n');

    return `      <!-- ${lokal.navn} -->
      <div class="lokal-card">
        <div class="lokal-card-inner">
          <div class="lokal-plan">
            <img src="${lokal.plantegning}" alt="Plantegning ${lokal.navn}" style="width:100%; height:100%; object-fit:contain; padding: 1rem; background: #f8f8f6;">
          </div>
          <div class="lokal-info">
            <span class="lokal-status ${statusClass}">${lokal.status}</span>
            <h3>${lokal.navn}</h3>
            <p>${lokal.beskrivelse}</p>
            <div class="lokal-specs">
${specs}
            </div>
            <a href="kontakt.html" class="btn btn-primary">Be om visning</a>
          </div>
        </div>
        <div class="lokal-photos">
          <div class="lokal-photos-strip">
${fotos}
          </div>
        </div>
      </div>`;
  }).join('\n\n');
}

/** Generer elegant karusell for arealkonfigurasjoner */
function genererKarusell(konfigurasjoner) {
  if (!konfigurasjoner || konfigurasjoner.length === 0) return '';

  const first = konfigurasjoner[0];

  const progressItems = konfigurasjoner.map((k, i) =>
    `          <button class="ec-progress-item${i === 0 ? ' active' : ''}" aria-label="Gå til ${k.navn}">
            <div class="ec-progress-track">
              <div class="ec-progress-fill" style="width: 0%;${i === 0 ? ' background-color: ' + k.accent + ';' : ''}"></div>
            </div>
            <span class="ec-progress-label">${k.navn} · ${k.areal}</span>
          </button>`
  ).join('\n');

  const firstSpecs = first.specs.map(sp =>
    `<div><div class="ec-spec-label">${sp.label}</div><div class="ec-spec-value">${sp.verdi}</div></div>`
  ).join('');

  const ctaTextColor = (first.accent === '#c8a951' || first.accent === '#059669') ? '#0f172a' : '#ffffff';

  return `  <section class="section" style="padding: 0;">
    <script>
      var EC_SLIDES = ${JSON.stringify(konfigurasjoner)};
    </script>
    <div style="text-align: center; padding: 2rem 2rem 0;">
      <a href="etasjeplan.html" class="btn btn-outline" style="padding: 0.6rem 1.5rem; font-size: 0.72rem; color: var(--dark); border-color: var(--border); display: inline-flex; align-items: center; gap: 0.5rem;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
        Se alle lokaler &amp; etasjeplan
      </a>
    </div>
    <div class="ec-wrapper">
      <div class="ec-bg-wash" style="background: radial-gradient(ellipse at 70% 50%, ${first.accent}18 0%, transparent 70%);"></div>
      <div class="ec-inner">
        <div class="ec-content">
          <div class="ec-content-inner">
            <div class="ec-collection-num visible">
              <span class="ec-num-line"></span>
              <span class="ec-num-text">01 / ${String(konfigurasjoner.length).padStart(2, '0')}</span>
            </div>
            <h2 class="ec-title visible">${first.navn}</h2>
            <p class="ec-subtitle visible" style="color: ${first.accent};">${first.areal} — ${first.undertittel}</p>
            <p class="ec-description visible">${first.beskrivelse}</p>
            <div class="ec-specs visible">${firstSpecs}</div>
            <div class="ec-nav-arrows" style="display:none;"></div>
          </div>
        </div>
        <div class="ec-image-container">
          <div class="ec-image-frame visible">
            <img src="${first.bilde}" alt="${first.navn} – ${first.areal}" class="ec-main-img">
            <div class="ec-image-overlay" style="background: linear-gradient(135deg, ${first.accent}22 0%, transparent 50%);"></div>
          </div>
          <div class="ec-frame-corner ec-frame-corner--tl" style="border-color: ${first.accent};"></div>
          <div class="ec-frame-corner ec-frame-corner--br" style="border-color: ${first.accent};"></div>
          <div class="ec-filmstrip">
${(first.galleri || [first.bilde]).map((src, i) =>
  `            <button class="ec-thumb${i === 0 ? ' active' : ''}" data-src="${src}"><img src="${src}" alt="Bilde ${i+1}"></button>`
).join('\n')}
          </div>
        </div>
      </div>
      <div class="ec-progress-bar">
${progressItems}
      </div>
    </div>
    <!-- Lightbox -->
    <div class="ec-lightbox" id="ecLightbox">
      <button class="ec-lightbox-close" aria-label="Lukk">&times;</button>
      <button class="ec-lightbox-prev" aria-label="Forrige">&#8249;</button>
      <button class="ec-lightbox-next" aria-label="Neste">&#8250;</button>
      <img class="ec-lightbox-img" src="" alt="Forstørret bilde">
      <div class="ec-lightbox-strip"></div>
    </div>
  </section>`;
}

// --- Bygg nettsiden ---

function byggSide(malNavn) {
  const malPath = path.join(TEMPLATES_DIR, malNavn);
  if (!fs.existsSync(malPath)) {
    console.error(`  FEIL: Mal ${malNavn} ikke funnet i maler/`);
    return;
  }

  let html = fs.readFileSync(malPath, 'utf8');

  // Erstatt dynamiske blokker forst
  html = html.replace('{{BILDESTRIPE}}', genererBildestripe(config.bilder.bildestripe));
  html = html.replace('{{OM_AVSNITT}}', genererOmAvsnitt(config.eiendom.om_beskrivelse));
  html = html.replace('{{ENERGI_BARS}}', genererEnergiBars(config.eiendom.energikarakter));
  html = html.replace('{{BELIGGENHET_KORT}}', genererBeliggenhetKort(config.beliggenhet.kort));
  html = html.replace('{{LOKALER_KORT}}', genererLokalerKort(config.lokaler));
  html = html.replace('{{KARUSELL_HTML}}', genererKarusell(config.konfigurasjoner));
  html = html.replace('{{ETASJEPLAN_DATA}}', `var FP_DATA = ${JSON.stringify(config.konfigurasjoner || [])};`);

  // Erstatt enkle plassholdere
  html = replacePlaceholders(html, config);

  // Skriv ferdig fil
  const outputPath = path.join(__dirname, malNavn);
  fs.writeFileSync(outputPath, html, 'utf8');
  console.log(`  OK: ${malNavn}`);
}

function byggCSS() {
  if (!fs.existsSync(CSS_TEMPLATE)) {
    console.error('  FEIL: styles.template.css ikke funnet');
    return;
  }

  let css = fs.readFileSync(CSS_TEMPLATE, 'utf8');
  css = replacePlaceholders(css, config);

  const outputPath = path.join(__dirname, 'styles.css');
  fs.writeFileSync(outputPath, css, 'utf8');
  console.log('  OK: styles.css');
}

// --- Kjor ---
console.log('');
console.log('Bygger HTML-sider...');
byggSide('index.html');
byggSide('lokaler.html');
byggSide('kontakt.html');
byggSide('etasjeplan.html');

console.log('');
console.log('Bygger CSS...');
byggCSS();

console.log('');
console.log('Ferdig! Start serveren med: node server.js');
console.log(`Apne nettleseren pa: http://localhost:4500`);
