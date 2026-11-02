/* Ivory Consulting, maquette V5 : interactions partagées par toutes les pages.
   Retirés par rapport à la V3 : rideau, boutons magnétiques, cartes inclinées, décodage des lettres,
   étincelles, aurore, parallaxe, apparitions floutées, ruban, barre de progression, halo.
   Gardés : l'impulsion du mot-clé (un par page) et le retournement des lettres C.R.E.O.L.E. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const store = {
    get: k => { try { return localStorage.getItem(k); } catch (_) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (_) {} }
  };

  /* ---------- réglages du site ---------- */
  const CAL = 'https://calendly.com/guehinadje-ivoryconsulting/audit'; // à remplacer par l'événement Calendly de 30 minutes
  const SCAN_ENDPOINT = 'https://hook.us2.make.com/jn3cf5ihh218lo8i3u3l17l4kou1qmhv';  // webhook Make « [IC] Scan C.R.E.O.L.E. · site V5 » : contact Brevo (liste 7) et email de résultat
  /* TVA : passer franchise à false le jour où la franchise en base cesse de s'appliquer.
     Les prix restent saisis hors taxes dans les pages (data-ht) : rien d'autre à modifier. */
  const TVA = { franchise: true, taux: 0.085 };

  /* ---------- en-tête et menu ---------- */
  const nav = $('#nav'), burger = $('#burger'), menu = $('#menu');
  burger?.addEventListener('click', () => { const o = menu.classList.toggle('open'); burger.setAttribute('aria-expanded', o); });
  const onScroll = () => nav?.classList.toggle('scrolled', scrollY > 30);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  $$('.dd').forEach(dd => {
    const b = $('.dd-btn', dd);
    b.addEventListener('click', e => { e.stopPropagation(); const o = dd.classList.toggle('open'); b.setAttribute('aria-expanded', o); });
  });
  document.addEventListener('click', () => $$('.dd.open').forEach(d => { d.classList.remove('open'); $('.dd-btn', d).setAttribute('aria-expanded', false); }));
  addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    $$('.dd.open').forEach(d => { d.classList.remove('open'); $('.dd-btn', d).setAttribute('aria-expanded', false); });
    closeModal();
  });

  /* ---------- effet signature 1 : le mot-clé s'allume à l'entrée dans l'écran ---------- */
  $$('.nk').forEach(el => el.insertAdjacentHTML('beforeend', '<span class="ap" aria-hidden="true"></span>'));
  /* ---------- effet signature 2 : les lettres se retournent ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const t = e.target;
    setTimeout(() => t.classList.add(t.matches('.nk') ? 'on' : 'in'), t.closest('.hero') ? 500 : 120);
    io.unobserve(t);
  }), { threshold: .3 });
  $$('.nk, .letters.rev').forEach(el => io.observe(el));

  const Ls = $$('.L'), panels = $$('.cpanel');
  if (Ls.length && panels.length) {
    let cur = 0, auto = null;
    const show = (i, flip) => {
      cur = i;
      Ls.forEach((b, k) => { b.classList.toggle('on', k === i); b.setAttribute('aria-pressed', k === i); });
      panels.forEach((p, k) => { p.hidden = k !== i; });
      if (flip && !reduce) { const b = Ls[i]; b.classList.remove('flip'); void b.offsetWidth; b.classList.add('flip'); }
    };
    Ls.forEach(b => b.addEventListener('click', () => { clearInterval(auto); show(+b.dataset.i, true); }));
    show(0);
    const lettersEl = $('.letters');
    if (!reduce && lettersEl) {
      const start = () => { auto = setInterval(() => show((cur + 1) % Ls.length, true), 4200); };
      const lio = new IntersectionObserver(es => { if (es[0].isIntersecting && !auto) start(); }, { threshold: .4 });
      lio.observe(lettersEl);
      lettersEl.addEventListener('pointerenter', () => { clearInterval(auto); auto = 1; });
    }
  }

  /* ---------- situations à cocher ---------- */
  const situ = $$('.situ'), meter = $('.meter');
  if (situ.length && meter) {
    const n = $('.n', meter), msg = $('.msg', meter), bar = $('.bar i', meter);
    const texts = [
      'Touchez les situations que vous vivez : chacune révèle un levier d\'organisation.',
      '<b>1 levier repéré.</b> Le Scan vous dit s\'il est vraiment votre priorité.',
      '<b>2 leviers repérés.</b> Le Scan vous dit lequel travailler en premier.',
      '<b>3 leviers ou plus.</b> Le Scan classe vos six dimensions en 8 minutes : vous saurez par où commencer.'
    ];
    const upd = () => { const k = situ.filter(s => s.classList.contains('on')).length; n.textContent = k; msg.innerHTML = texts[Math.min(3, k)]; bar.style.width = (k / situ.length * 100) + '%'; };
    situ.forEach(s => s.addEventListener('click', () => { s.classList.toggle('on'); s.setAttribute('aria-pressed', s.classList.contains('on')); upd(); }));
  }

  /* ---------- études : données et modale ---------- */
  const fr = v => String(v).replace('.', ',');
  const hbars = (title, rows, max, fmt) => `<p class="kicker" style="margin-top:16px">${title}</p>` + rows.map(([l, v, c]) => `<div class="hbar"><span>${l}</span><div class="tr"><div class="fl ${c}" style="--w:${v / max * 100}%"></div></div><span class="v">${fmt(v)}</span></div>`).join('');
  const gradeRow = (l, s, n) => `<div class="row"><b>${l}</b><span class="dots" aria-label="${n} sur 4">${[0, 1, 2, 3].map(k => `<i class="${k < n ? 'f' : ''}"></i>`).join('')}</span><small>${s}</small></div>`;
  const STUDIES = {
    manager: { st: ['m', 'Mesuré'], t: 'Le manager de proximité, point de bascule',
      intro: 'Les managers décrivent eux-mêmes ce qui pèse sur leur rôle : une part importante de leur temps passe dans les urgences et l\'administratif, et beaucoup se sentent peu outillés pour repérer ce qui use leur équipe.',
      chart: () => hbars('Ce que déclarent les managers', [['Citent la détection des risques pour la santé mentale de leur équipe', 52, ''], ['Citent la gestion de la pression hiérarchique', 53, 'a'], ['Part de leur temps passée dans les urgences', 22, 'p'], ['Part de leur temps passée dans l\'administratif', 21, 's']], 100, v => v + ' %'),
      src: 'Anact et Malakoff Humanis, sondage Toluna auprès de 1 101 managers, avril et mai 2026. Données France.',
      keep: 'Le levier est la pratique d\'encadrement et l\'organisation qui l\'entoure : c\'est le terrain des Ateliers Koudmen.' },
    oms: { st: ['e', 'Établi'], t: 'Former les encadrants : la recommandation la plus solide de l\'OMS',
      intro: 'Dans ses recommandations 2022 sur la santé mentale au travail, l\'OMS évalue chaque type d\'intervention avec la méthode GRADE. La formation des encadrants obtient le meilleur niveau de certitude.',
      chart: () => `<div class="grade">${gradeRow('Formation des encadrants', 'Recommandation forte, certitude modérée', 3)}${gradeRow('Gestion du stress individuelle', 'Certitude faible', 2)}${gradeRow('Interventions organisationnelles', 'Recommandation conditionnelle, certitude très faible : preuves en cours de consolidation', 1)}<small>Niveau de certitude des preuves, sur une échelle de 4.</small></div>`,
      src: 'Organisation mondiale de la santé, Recommandations sur la santé mentale au travail, 2022, méthode GRADE.',
      keep: 'Outiller les encadrants est l\'action la mieux étayée. Les interventions sur l\'organisation sont encore peu évaluées : la méthode C.R.E.O.L.E. les rend mesurables.' },
    prev: { st: ['o', 'Corrélation observée'], t: 'Une prévention structurée, des équipes en meilleure santé',
      intro: 'Les salariés des organisations dotées d\'un plan de prévention complet en santé mentale déclarent presque deux fois plus souvent une très bonne santé mentale. Corrélation, pas causalité.',
      chart: () => hbars('Salariés déclarant une très bonne santé mentale', [['Sans dispositif de prévention', 10, 'p'], ['Avec un plan de prévention complet', 19, 'a']], 25, v => v + ' %'),
      src: 'Qualisocial avec Ipsos-BVA, baromètre 2026, 3 000 salariés. Corrélation observée.',
      keep: 'Structurer la prévention va de pair avec des équipes en meilleure forme. Le Scan en pose la première pierre, gratuitement.' },
    aiss: { st: ['m', 'Estimé'], t: '1 € investi en prévention, jusqu\'à 2,20 € de rendement potentiel',
      intro: 'L\'Association internationale de la sécurité sociale a estimé le rendement économique potentiel de la prévention en entreprise, à partir d\'estimations déclaratives.',
      chart: () => `<div class="coins"><div class="col">${'<i></i>'.repeat(5)}<b>1 €</b><small>investi</small></div><div class="col b">${'<i></i>'.repeat(11)}<b>2,20 €</b><small>rendement potentiel</small></div></div>`,
      src: 'AISS avec la DGUV et la BG ETEM, 2011, 300 entreprises dans 15 pays hors France, estimations déclaratives.',
      keep: 'La prévention se pilote comme un investissement, avec des indicateurs. C\'est le rôle de la mesure trimestrielle du Lakou.' },
    marge: { st: ['m', 'Mesuré'], t: 'En Guadeloupe, la marge de décision est le grand levier',
      intro: 'Les trois indicateurs les plus défavorables à la Guadeloupe dans l\'enquête Conditions de travail portent tous sur la marge de décision des salariés.',
      chart: () => hbars('Appliquent strictement les consignes', [['Guadeloupe', 44, 'a'], ['France', 33, '']], 50, v => v + ' %') + hbars('Peuvent choisir la façon d\'atteindre leurs objectifs', [['Guadeloupe', 77, 'a'], ['France', 80, '']], 100, v => v + ' %') + hbars('Peuvent modifier leurs priorités', [['Guadeloupe', 50, 'a'], ['France', 60, '']], 70, v => v + ' %'),
      src: 'Enquête Conditions de travail 2013, résultats pour la Guadeloupe comparés au national.',
      keep: 'Vos managers décident-ils, ou appliquent-ils ? C\'est la dimension Ouverture de la méthode C.R.E.O.L.E.' },
    gwada: { st: ['e', 'Établi'], t: 'Le profil guadeloupéen : agir sur l\'usure',
      intro: 'Le taux de fréquence des accidents du travail en Guadeloupe est environ deux fois inférieur au national. La prévention locale gagne à cibler l\'usure et l\'organisation du travail.',
      chart: () => hbars('Accidents du travail avec arrêt, par million d\'heures rémunérées (2022)', [['Guadeloupe, Saint-Martin, Saint-Barthélemy', 8.4, 'a'], ['Autres régions d\'outre-mer', 11.8, 'p'], ['France', 16.7, '']], 18, fr) + hbars('Part des troubles musculo-squelettiques dans les maladies professionnelles reconnues', [['Guadeloupe, 2011 à 2018', 90.7, 'a']], 100, v => fr(v) + ' %'),
      src: 'DEETS Guadeloupe, données 2022, publication novembre 2025 (1 481 accidents avec arrêt, 105 704 journées perdues). DEETS Guadeloupe, 313 cas reconnus entre 2011 et 2018, plus de 70 % concernant des femmes.',
      keep: 'En Guadeloupe, la prévention la plus utile porte sur la charge, la cadence et l\'organisation : la dimension Rythme.' },
    arrets: { st: ['m', 'Mesuré'], t: 'Les arrêts longs d\'origine psychologique',
      intro: 'En 2025, le taux d\'absentéisme dans le privé atteint 4,3 % en France, en hausse de 25,5 % par rapport à 2019. Plus d\'un arrêt long sur trois est d\'origine psychologique.',
      chart: () => hbars('Arrêts de plus de 30 jours d\'origine psychologique, 2025', [['Tous salariés du privé', 37.8, '']], 50, v => fr(v) + ' %'),
      src: 'Malakoff Humanis, étude du 9 juin 2026. France, secteur privé. Aucun taux d\'absentéisme n\'est publié pour la Guadeloupe.',
      keep: 'Aucune promesse chiffrée sur l\'absentéisme : agir en amont, sur l\'organisation du travail, reste la réponse la plus durable.' }
  };
  const modal = $('#modal'), mBody = $('#mBody'); let lastFocus = null;
  function openStudy(id) {
    const s = STUDIES[id]; if (!s || !modal) return false; lastFocus = document.activeElement;
    mBody.innerHTML = `<span class="st ${s.st[0]}"><i></i>${s.st[1]}</span><h3 id="mTitle">${s.t}</h3><p class="lead" style="font-size:1rem">${s.intro}</p><div>${s.chart()}</div><p class="source"><b>Source :</b> ${s.src}</p><div class="keep"><b>À retenir pour votre organisation.</b> ${s.keep}</div>`;
    modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false'); $('.x', modal).focus();
    return true;
  }
  function closeModal() { if (!modal?.classList.contains('open')) return; modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); lastFocus?.focus(); }
  $$('[data-study]').forEach(c => c.addEventListener('click', e => { if (openStudy(c.dataset.study)) e.preventDefault(); }));
  modal && $$('[data-close]', modal).forEach(c => c.addEventListener('click', closeModal));
  $$('.filters button').forEach(b => b.addEventListener('click', () => {
    $$('.filters button').forEach(x => x.setAttribute('aria-pressed', x === b));
    const f = b.dataset.f; $$('.ecard').forEach(c => c.classList.toggle('hide', f !== 'all' && !c.dataset.tags.includes(f)));
  }));

  /* ---------- ateliers : exemples selon la structure ---------- */
  const seg = $('#structure');
  if (seg) {
    const set = s => {
      $$('button', seg).forEach(b => b.setAttribute('aria-pressed', b.dataset.s === s));
      $$('.atel .ex [data-s]').forEach(x => x.classList.toggle('on', x.dataset.s === s));
      store.set('ivoryStructure', s);
    };
    $$('button', seg).forEach(b => b.addEventListener('click', () => set(b.dataset.s)));
    set(store.get('ivoryStructure') || 'ent');
  }

  /* ---------- onglets « un atelier de l'intérieur » ---------- */
  const tabs = $$('.tabs [role=tab]'), tpanels = $$('.tabpanel');
  const selTab = b => {
    tabs.forEach(x => { const on = x === b; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1; });
    tpanels.forEach(p => { p.hidden = p.id !== b.getAttribute('aria-controls'); });
  };
  tabs.forEach((b, k) => {
    b.addEventListener('click', () => selTab(b));
    b.addEventListener('keydown', e => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (!d) return;
      e.preventDefault(); const n = tabs[(k + d + tabs.length) % tabs.length]; selTab(n); n.focus();
    });
  });
  if (tabs.length) selTab(tabs[0]);

  /* ---------- prix : hors taxes, prêt pour la TVA ---------- */
  const eurFmt = v => v.toLocaleString('fr-FR', { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 }) + ' €';
  function applyTva(franchise) {
    $$('.px[data-ht]').forEach(p => {
      const box = p.closest('.price'); if (!box) return;
      $('.ttc', box)?.remove();
      if (!franchise) box.insertAdjacentHTML('beforeend', `<span class="ttc">soit ${eurFmt(Math.round(+p.dataset.ht * (1 + TVA.taux) * 100) / 100)} TTC</span>`);
    });
    $$('.tva-note[data-tva]').forEach(n => { n.textContent = franchise ? 'Tarifs hors taxes. TVA non applicable, article 293 B du CGI.' : `Tarifs hors taxes. TVA ${fr(TVA.taux * 100)} % en sus (taux normal en Guadeloupe, article 296 du CGI).`; });
    $$('.tva-legal').forEach(n => { n.textContent = franchise ? 'TVA non applicable, article 293 B du CGI' : `TVA ${fr(TVA.taux * 100)} % (Guadeloupe)`; });
  }
  const tvaPref = store.get('ivoryTva');
  applyTva(TVA.franchise);

  /* ---------- calculateur du coût des réunions ---------- */
  const calc = $('#calc');
  if (calc) {
    const v = id => +$('#' + id, calc).value;
    const eur = n => Math.round(n).toLocaleString('fr-FR') + ' €';
    const num = n => Math.round(n).toLocaleString('fr-FR');
    const run = () => {
      const P = v('cP'), D = v('cD'), R = v('cR'), H = v('cH'), W = v('cW'), G = v('cG');
      $$('output', calc).forEach(o => { const i = $('#' + o.htmlFor, calc); o.textContent = i.dataset.fmt ? i.dataset.fmt.replace('%v', (+i.value).toLocaleString('fr-FR')) : i.value; });
      const hours = P * (D / 60) * R * W, cost = hours * H, saved = hours * G / 100;
      $('#oCost', calc).textContent = eur(cost); $('#oHours', calc).textContent = num(hours); $('#oSaved', calc).textContent = num(saved);
      $('#oDays', calc).textContent = num(saved / 7); $('#oValue', calc).textContent = eur(saved * H);
    };
    $$('input', calc).forEach(i => i.addEventListener('input', run)); run();
  }


  /* ---------- calculateur de passerelle : 60 jours de déduction ---------- */
  const pc = $('#pcalc');
  if (pc) {
    const PAID = { none: [0, 0], atelier: [650, 1], seance: [290, 1], miroir: [790, 2], trois: [1800, 2], miratel: [1440, 2], subE: [390, 3], subD: [250, 3] };
    const TARGET = { trois: [1800, 2, 0], miroir: [790, 2, 0], E: [390, 3, 1], D: [250, 3, 1], C: [590, 3, 1] };
    const NAMES = { trois: '3 Ateliers Koudmen', miroir: 'le Miroir', E: 'Lakou Équipe', D: 'Lakou Dirigeant', C: 'Lakou Complet' };
    const e = v => Math.round(v).toLocaleString('fr-FR') + ' €';
    const out = $('#pOut');
    const run = () => {
      const pk = $('#pPaid').value, tk = $('#pTarget').value, [paid, pl] = PAID[pk], [price, tl, monthly] = TARGET[tk];
      if (pk.startsWith('sub')) {
        if (tk !== 'C') { out.innerHTML = `<p class="pt">Vous êtes déjà abonné</p><p class="pn">Pour passer à Lakou Complet, seule la différence est facturée. Les autres offres sont déjà comprises dans votre abonnement ou à tarif abonné.</p>`; return; }
        const diff = 590 - paid;
        out.innerHTML = `<p class="pt">Passage à Lakou Complet</p><p class="big1">+ ${e(diff)}</p><p class="pn">par mois, en plus de votre abonnement actuel : seule la différence est facturée.</p>`; return;
      }
      if (pk !== 'none' && tl <= pl) { out.innerHTML = `<p class="pt">Même étage</p><p class="pn">Le Miroir et les 3 ateliers sont au même étage : la déduction s'applique à l'offre au-dessus, une formule Lakou.</p>`; return; }
      const note = paid ? `<p class="pn">Déduction de ${e(paid)}, valable 60 jours après votre paiement.</p>` : '<p class="pn">Rien à déduire : vous payez le prix affiché.</p>';
      if (!monthly) { out.innerHTML = `<p class="pt">Ce qu'il vous reste à payer pour ${NAMES[tk]}</p><p class="big1">${e(Math.max(0, price - paid))}</p>${note}`; return; }
      let credit = Math.min(paid, 3 * price); const rows = [];
      for (let m = 1; m <= 3; m++) { const due = Math.max(0, price - credit); credit = Math.max(0, credit - price); rows.push(`<li><span>Mois ${m}</span><b class="${due ? '' : 'off'}">${due ? e(due) : 'offert'}</b></li>`); }
      rows.push(`<li><span>Ensuite</span><b>${e(price)} par mois, sans engagement</b></li>`);
      out.innerHTML = `<p class="pt">Ce qu'il vous reste à payer pour ${NAMES[tk]}</p><ol>${rows.join('')}</ol>${paid > 3 * price ? `<p class="pn">Déduction plafonnée aux 3 mois d'engagement (${e(3 * price)}).</p>` : note}`;
    };
    $$('select', pc).forEach(s => s.addEventListener('change', run)); run();
  }

  /* ---------- copier ---------- */
  $$('[data-copy]').forEach(b => b.addEventListener('click', () => {
    const done = () => { b.textContent = 'Copié'; setTimeout(() => b.textContent = 'Copier', 1600); };
    navigator.clipboard?.writeText(b.dataset.copy).then(done, () => {});
  }));

  /* ---------- liens Calendly ---------- */
  $$('[data-cal]').forEach(a => { a.href = CAL; a.target = '_blank'; a.rel = 'noopener'; });

  /* ---------- notification ---------- */
  const toast = document.createElement('div'); toast.className = 'toast'; toast.setAttribute('role', 'status'); document.body.appendChild(toast);
  let tt; const say = html => { toast.innerHTML = html; toast.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('show'), 4200); };

  /* =====================================================================
     SCAN C.R.E.O.L.E. : 18 questions, échelle de 1 à 4, calcul par formule
     ===================================================================== */
  const scan = $('#scan');
  if (scan) {
    const DIMS = [
      { k: 'C', n: 'Clarté', pair: 0 }, { k: 'R', n: 'Rythme', pair: 0 },
      { k: 'E', n: 'Écoute', pair: 1 }, { k: 'O', n: 'Ouverture', pair: 1 },
      { k: 'L', n: 'Lien', pair: 2 }, { k: 'E', n: 'Estime', pair: 2 }
    ];
    const PAIRS = ['Le cadre', 'La parole', 'Le lien'];
    const Q = [
      'Quand une nouvelle priorité arrive, je dis dans la même phrase ce qui s\'arrête ou se décale.',
      'Chaque personne de l\'équipe pourrait citer les trois priorités du mois sans se tromper.',
      'Quand deux personnes pensent être responsables de la même tâche, ou aucune, c\'est clarifié dans la semaine.',
      'Mes managers ont au moins un créneau par semaine où personne ne les sollicite.',
      'Nos réunions ont un ordre du jour écrit, envoyé avant, et se terminent à l\'heure.',
      'Une règle connue de tous distingue une vraie urgence d\'une demande « pour hier ».',
      'Je peux nommer la dernière personne qui m\'a dit que je me trompais.',
      'Quand quelqu\'un signale un problème, il apprend ensuite ce qui en a été fait.',
      'En réunion, les personnes les moins gradées s\'expriment avant les plus gradées.',
      'Ceux qui détiennent une information se parlent directement, sans passer par moi.',
      'Qui décide quoi, et jusqu\'à quel montant ou quel risque, est écrit quelque part.',
      'Une décision prise en mon absence n\'est pas refaite à mon retour.',
      'Quand quelqu\'un est débordé, un collègue propose son aide sans que je le demande.',
      'Chaque nouvel arrivant a, dès le premier jour, une ou plusieurs personnes identifiées pour l\'accompagner.',
      'Deux services peuvent se rendre service sans passer par leurs responsables.',
      'Au moins une fois par semaine, je nomme à une personne un fait précis et daté de son travail.',
      'Chaque personne de l\'équipe peut dire à qui, concrètement, son travail sert.',
      'Chaque départ de l\'année a donné lieu à un échange pour comprendre ce qui l\'a motivé.'
    ];
    const SCALE = ['Jamais', 'Parfois', 'Souvent', 'Systématiquement'];
    const PROF = [
      ['brume', 'dans la brume', 'Tout le monde travaille, personne ne sait vraiment ce qui compte.'],
      ['contretemps', 'à contretemps', 'Tout est urgent, personne n\'a le temps de penser.'],
      ['silencieuse', 'silencieuse', 'Tout va bien, officiellement. Ce qui coince ne remonte pas.'],
      ['etoile', 'en étoile', 'Tout passe par le responsable : rapide sur les décisions simples, goulot sur les autres.'],
      ['archipel', 'en archipel', 'Des îles qui ne se parlent pas : chacun tient sa partie, seul.'],
      ['invisible', 'invisible', 'Le travail est fait, personne ne le voit.']
    ];
    const ACC = ['accordee', 'accordée', 'Comme des tambours accordés : chacun joue sa partie, et l\'ensemble tient.'];
    const GESTE = [
      ['La phrase qui arrête', 'Toute nouvelle priorité est annoncée, à l\'oral et devant l\'équipe, avec ce qui s\'arrête ou se décale.'],
      ['Le créneau protégé', 'Réservez, pour vous et pour chaque membre de l\'équipe, un temps hebdomadaire sans sollicitation, et tenez-le.'],
      ['La bonne question', 'Remplacez « tout le monde est d\'accord ? » par « qui a vu quelque chose qui ne colle pas ? ».'],
      ['La mise en lien', 'Quand deux personnes détiennent chacune une partie d\'un sujet, mettez-les en relation au lieu de servir d\'intermédiaire.'],
      ['Demander en premier', 'Demandez de l\'aide publiquement à votre équipe, pour montrer que demander est normal.'],
      ['Le merci daté', 'Une fois par semaine au moins, nommez à une personne un fait précis et daté de son travail, et son effet.']
    ];
    const RITUEL = ['Le point des trois priorités', 'La réunion tenue', 'Le kozè du vendredi', 'Le tour des décisions', 'Le tour de table du lundi', 'Le travail invisible nommé'];

    const intro = $('#sIntro'), qv = $('#sQ'), rv = $('#sRes');
    const prog = $('.sprog', qv), meta = $('.sq-meta', qv), txt = $('.sq-txt', qv), ansEl = $('.answers', qv), back = $('#sBack');
    const ans = Array(18).fill(0); let qi = 0;
    prog.innerHTML = PAIRS.map((p, k) => `<div class="pp" data-p="${k}"><span>${p}</span><div class="ticks">${'<i></i>'.repeat(6)}</div></div>`).join('');
    ansEl.innerHTML = SCALE.map((l, k) => `<button type="button" data-v="${k + 1}" aria-pressed="false"><b>${k + 1}</b>${l}</button>`).join('');
    const ticks = $$('.ticks i', prog);
    const view = el => { [intro, qv, rv].forEach(x => x.hidden = x !== el); };
    const render = () => {
      const d = DIMS[Math.floor(qi / 3)];
      ticks.forEach((t, k) => { t.className = k === qi ? 'cur' : ans[k] ? 'done' : ''; });
      $$('.pp', prog).forEach(p => p.classList.toggle('cur', +p.dataset.p === d.pair));
      meta.innerHTML = `<span>${d.k} · ${d.n}</span><span class="cnt" aria-live="polite">Question ${qi + 1} sur 18</span>`;
      txt.textContent = Q[qi];
      $$('button', ansEl).forEach(b => b.setAttribute('aria-pressed', +b.dataset.v === ans[qi]));
      back.disabled = qi === 0;
      txt.focus({ preventScroll: true });
    };
    const answer = v => {
      ans[qi] = v;
      if (qi < 17) { qi++; render(); } else result();
    };
    $$('button', ansEl).forEach(b => b.addEventListener('click', () => answer(+b.dataset.v)));
    back.addEventListener('click', () => { if (qi > 0) { qi--; render(); } });
    addEventListener('keydown', e => {
      if (qv.hidden || e.target.matches('input,select,textarea')) return;
      if (/^[1-4]$/.test(e.key)) answer(+e.key);
      if (e.key === 'ArrowLeft' && qi > 0) { qi--; render(); }
    });
    $('#sStart').addEventListener('click', () => { view(qv); render(); scan.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); });

    let last = null;
    function result() {
      const sc = DIMS.map((_, i) => ans[i * 3] + ans[i * 3 + 1] + ans[i * 3 + 2]);
      const total = sc.reduce((a, b) => a + b, 0);
      const min = Math.min(...sc), lows = sc.map((v, i) => v === min ? i : -1).filter(i => i >= 0);
      const acc = min >= 9;
      const pic = acc ? ACC[0] : PROF[lows[0]][0];
      const name = acc ? 'L\'équipe accordée' : 'L\'équipe ' + lows.slice(0, 2).map(i => PROF[i][1]).join(' et ');
      const desc = acc ? ACC[2] : lows.slice(0, 2).map(i => PROF[i][2]).join(' ');
      const band = total <= 35 ? 'Pilotage à vue : les gestes de base ne sont pas encore installés, et le premier palier coûte peu.' : total <= 53 ? 'Les fondamentaux tiennent : ce qui coûte, ce sont les angles morts.' : 'Base solide : l\'enjeu est la régularité quand la charge augmente.';
      const g = acc ? [RITUEL[lows[0]], `Votre équipe est accordée. Pour le rester quand la charge monte, installez le rituel de votre dimension la plus basse (${DIMS[lows[0]].n}).`] : GESTE[lows[0]];
      last = { reponses: ans.join(','), scores: DIMS.map((d, i) => `${d.n} ${sc[i]}/12`).join(' · '), total, profil: name,
        dimension: DIMS[lows[0]].n, geste_titre: g[0], geste_texte: g[1] };
      $('#rPicto').innerHTML = `<svg class="picto lg" viewBox="0 0 48 48" aria-hidden="true"><use href="#p-${pic}"/></svg>`;
      $('#rName').textContent = name; $('#rDesc').textContent = desc;
      $('#rScores').innerHTML = PAIRS.map((p, k) => `<div class="pairrow"><span>${p} · ${sc[k * 2] + sc[k * 2 + 1]} / 24</span>${[k * 2, k * 2 + 1].map(i => `<div class="sc${sc[i] === min && !acc ? ' low' : ''}"><span class="nm">${DIMS[i].k} · ${DIMS[i].n}</span><span class="tr"><span class="fl" style="display:block;width:${(sc[i] - 3) / 9 * 100}%"></span></span><span class="v">${sc[i]} / 12</span></div>`).join('')}</div>`).join('');
      $('#rBand').innerHTML = `<b>Score total : ${total} / 72.</b> ${band} Ce qui compte n'est jamais le total, mais la dimension la plus basse.`;
      $('#rGesteT').textContent = g[0]; $('#rGesteP').textContent = g[1];
      view(rv); rv.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      $('#rName').focus({ preventScroll: true });
    }
    $('#sAgain').addEventListener('click', () => { ans.fill(0); qi = 0; view(qv); render(); });
    const form = $('#sForm');
    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const fd = new FormData(form);
      // envoi en formulaire encodé : requête simple, sans pré-vérification CORS
      const payload = new URLSearchParams({ ...last, prenom: fd.get('prenom'), email: fd.get('email'), structure: fd.get('structure') || '', effectif: fd.get('effectif'),
        consentement_resultat: String(!!fd.get('c1')), consentement_observatoire: String(!!fd.get('c2')), date: new Date().toISOString(), page: location.pathname });
      const btn = $('button[type=submit]', form); btn.disabled = true;
      try {
        if (SCAN_ENDPOINT) { const r = await fetch(SCAN_ENDPOINT, { method: 'POST', body: payload }); if (!r.ok) throw new Error(r.status); }
        else say('<b>Maquette :</b> l\'envoi sera branché sur un webhook Make, puis Brevo. Rien n\'a été transmis.');
        form.classList.add('sent');
      } catch (_) { say('L\'envoi n\'a pas abouti. Réessayez dans un instant.'); btn.disabled = false; }
    });
  }

  /* =====================================================================
     RÉSEAU DU HERO : organisation centralisée ou en réseau (arrêté hors écran)
     ===================================================================== */
  const cv = $('#net');
  if (cv) {
    const ctx = cv.getContext('2d'); let W, H, visible = true;
    const size = () => { const d = Math.min(2, devicePixelRatio || 1), r = cv.getBoundingClientRect(); W = r.width; H = r.height; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
    size(); addEventListener('resize', size);
    const nodes = [], edges = [], lateral = [];
    const add = (lvl, parent) => (nodes.push({ lvl, parent, a: {}, b: {} }), nodes.length - 1);
    const top = add(0, -1), mgrs = [0, 1, 2, 3].map(() => add(1, top)), team = [];
    mgrs.forEach(m => { for (let k = 0; k < 6; k++) team.push(add(2, m)); });
    nodes.forEach((n, i) => { if (n.parent >= 0) edges.push([i, n.parent]); });
    nodes[top].a = { x: 0, y: -1.15, z: 0 };
    mgrs.forEach((m, k) => { const t = k / 4 * Math.PI * 2 + Math.PI / 4; nodes[m].a = { x: Math.cos(t) * .75, y: -.25, z: Math.sin(t) * .75 }; });
    team.forEach((p, k) => { const mi = mgrs.indexOf(nodes[p].parent), t = (mi / 4 + (k % 6 - 2.5) / 30) * Math.PI * 2 + Math.PI / 4; nodes[p].a = { x: Math.cos(t) * 1.45, y: .75 + (k % 2) * .12, z: Math.sin(t) * 1.45 }; });
    const N = nodes.length;
    nodes.forEach((n, i) => { const y = 1 - (i + .5) / N * 2, r = Math.sqrt(1 - y * y), th = i * 2.39996; n.b = { x: Math.cos(th) * r * 1.25, y: y * 1.15, z: Math.sin(th) * r * 1.25 }; });
    for (let i = 0; i < N; i++) {
      nodes.map((m, j) => [j, Math.hypot(m.b.x - nodes[i].b.x, m.b.y - nodes[i].b.y, m.b.z - nodes[i].b.z)]).filter(([j]) => j !== i).sort((p, q) => p[1] - q[1]).slice(0, 3)
        .forEach(([j]) => { if (!lateral.some(([p, q]) => p === j && q === i)) lateral.push([i, j]); });
    }
    let mode = 0, t = 0, yaw = .4, pitch = .18, drag = null, touched = false, raf = 0;
    const pulses = [], fires = new Float32Array(N);
    const caps = ['Organisation centralisée : tout remonte au dirigeant', 'Organisation en réseau : les décisions circulent entre les équipes'];
    const capEl = $('#vizCap'), tb = $$('.toggle button', cv.parentElement);
    const setMode = (m, u) => { mode = m; if (u) touched = true; tb.forEach(b => { b.classList.toggle('on', +b.dataset.mode === m); b.setAttribute('aria-pressed', +b.dataset.mode === m); }); capEl.textContent = caps[m]; if (reduce) { t = m; draw(); } };
    tb.forEach(b => b.addEventListener('click', () => setMode(+b.dataset.mode, true)));
    if (!reduce) setInterval(() => { if (!touched && visible) setMode(1 - mode); }, 5500);
    cv.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, yaw, pitch }; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointermove', e => { if (drag) { yaw = drag.yaw + (e.clientX - drag.x) * .008; pitch = Math.max(-.8, Math.min(.8, drag.pitch + (e.clientY - drag.y) * .006)); if (reduce) draw(); } });
    cv.addEventListener('pointerup', () => drag = null);
    const ease = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    const pos = (n, k) => ({ x: n.a.x + (n.b.x - n.a.x) * k, y: n.a.y + (n.b.y - n.a.y) * k, z: n.a.z + (n.b.z - n.a.z) * k });
    const proj = p => { const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch); let x = p.x * cy - p.z * sy, z = p.x * sy + p.z * cy; const y = p.y * cp - z * sp; z = p.y * sp + z * cp; const s = 3.2 / (3.2 + z), R = Math.min(W, H) * .29; return { x: W / 2 + x * R * s, y: H / 2 - 6 + y * R * s, s, z }; };
    let lastTs = 0;
    function draw(dt = 16) {
      const k = ease(Math.max(0, Math.min(1, t))); ctx.clearRect(0, 0, W, H);
      const P = nodes.map(n => proj(pos(n, k)));
      ctx.lineWidth = 1;
      edges.forEach(([i, j]) => { const a = P[i], b = P[j]; ctx.strokeStyle = `rgba(244,241,232,${(.12 + .3 * (1 - k)) * Math.min(a.s, b.s)})`; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); });
      if (k > .02) lateral.forEach(([i, j]) => { const a = P[i], b = P[j]; ctx.strokeStyle = `rgba(141,176,255,${.4 * k * Math.min(a.s, b.s)})`; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); });
      if (!reduce && Math.random() < .4) {
        if (Math.random() < .5 + (1 - k) * .4) { const e = edges[Math.random() * edges.length | 0]; pulses.push({ e, u: 0, sp: .012 + Math.random() * .01 }); }
        if (k > .5 && Math.random() < k) { const l = lateral[Math.random() * lateral.length | 0]; pulses.push({ e: Math.random() < .5 ? l : [l[1], l[0]], u: 0, sp: .015 + Math.random() * .01 }); }
      }
      for (let q = pulses.length - 1; q >= 0; q--) {
        const p = pulses[q]; p.u += p.sp * dt / 16;
        if (p.u >= 1) { fires[p.e[1]] = 1; pulses.splice(q, 1); continue; }
        const a = P[p.e[0]], b = P[p.e[1]], x = a.x + (b.x - a.x) * p.u, y = a.y + (b.y - a.y) * p.u;
        ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.arc(x, y, 2.2, 0, 7); ctx.fill();
      }
      nodes.map((n, i) => [i, P[i]]).sort((u, v) => v[1].z - u[1].z).forEach(([i, p]) => {
        const n = nodes[i], f = fires[i]; fires[i] *= .92;
        const r = (n.lvl === 0 ? 11 - 4 * k : n.lvl === 1 ? 7 - 1.5 * k : 4.6) * p.s;
        if (n.lvl === 0 || f > .05) { const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3.2); g.addColorStop(0, n.lvl === 0 ? `rgba(201,164,53,${.55 - .3 * k})` : `rgba(141,176,255,${f * .6})`); g.addColorStop(1, 'rgba(141,176,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, r * 3.2, 0, 7); ctx.fill(); }
        ctx.fillStyle = n.lvl === 0 ? '#C9A435' : n.lvl === 1 ? '#8DB0FF' : `rgba(244,241,232,${.6 + .25 * p.s + f * .3})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 7); ctx.fill();
      });
    }
    const frame = ts => {
      const dt = Math.min(50, ts - lastTs || 16); lastTs = ts;
      t += ((mode ? 1 : 0) - t) * .035; if (!drag) yaw += .0035 * dt / 16;
      draw(dt); raf = visible ? requestAnimationFrame(frame) : 0;
    };
    if (reduce) { draw(); } else {
      new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible && !raf) raf = requestAnimationFrame(frame); }).observe(cv);
    }
  }

  /* ---------- focus du dirigeant : des sollicitations qui se rassemblent ---------- */
  const fc = $('#focus');
  if (fc) {
    const ctx = fc.getContext('2d'); let W, H, visible = true, raf = 0;
    const size = () => { const d = Math.min(2, devicePixelRatio || 1), r = fc.getBoundingClientRect(); W = r.width; H = r.height; fc.width = W * d; fc.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
    size(); addEventListener('resize', size);
    const P = [...Array(70)].map((_, i) => ({ x: Math.random(), y: Math.random(), vx: (Math.random() - .5) * .004, vy: (Math.random() - .5) * .004, a: i / 70 * Math.PI * 2, ring: i % 3 }));
    let focus = 0, target = 0, touched = false, rot = 0;
    const btns = $$('.toggle button', fc.parentElement), cap = $('#focusCap');
    const caps = ['Journée dispersée : tout sollicite le dirigeant', 'Mode focus : les priorités se rassemblent'];
    const set = (m, u) => { target = m; if (u) touched = true; btns.forEach(b => { b.classList.toggle('on', +b.dataset.mode === m); b.setAttribute('aria-pressed', +b.dataset.mode === m); }); cap.textContent = caps[m]; if (reduce) { focus = m; draw(); } };
    btns.forEach(b => b.addEventListener('click', () => set(+b.dataset.mode, true)));
    if (!reduce) setInterval(() => { if (!touched && visible) set(1 - target); }, 5000);
    function draw() {
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2 - 4, R = Math.min(W, H) * .36;
      [1, .66, .33].forEach(s => { ctx.strokeStyle = `rgba(141,176,255,${.08 + focus * .22})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, R * s, 0, 7); ctx.stroke(); });
      P.forEach(p => {
        const rr = R * [1, .66, .33][p.ring], ax = cx + Math.cos(p.a + rot * (p.ring + 1)) * rr, ay = cy + Math.sin(p.a + rot * (p.ring + 1)) * rr;
        const x = p.x * W * (1 - focus) + ax * focus, y = p.y * H * (1 - focus) + ay * focus;
        ctx.fillStyle = `rgba(${focus > .5 ? '141,176,255' : '244,241,232'},${.45 + focus * .45})`;
        ctx.beginPath(); ctx.arc(x, y, 2.4 + focus * 1.2, 0, 7); ctx.fill();
      });
      ctx.fillStyle = '#C9A435'; ctx.beginPath(); ctx.arc(cx, cy, 6 + focus * 4, 0, 7); ctx.fill();
    }
    const frame = () => {
      focus += (target - focus) * .04; rot += .004;
      P.forEach(p => { p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > 1) p.vx *= -1; if (p.y < 0 || p.y > 1) p.vy *= -1; });
      draw(); raf = visible ? requestAnimationFrame(frame) : 0;
    };
    if (reduce) draw(); else new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible && !raf) raf = requestAnimationFrame(frame); }).observe(fc);
  }

})();
