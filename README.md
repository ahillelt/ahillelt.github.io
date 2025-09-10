<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Alon Hillel‑Tuch · CS • Cybersecurity • Engineering</title>
  <meta name="description" content="Alon Hillel‑Tuch — educator and engineer focused on computer science, cybersecurity, hardware security, and resilience in socio‑technical systems." />
  <meta name="theme-color" content="#0f172a" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0a0d14;
      --panel: #0b1220;
      --ink: #e6edf5;
      --muted: #9fb0c6;
      --accent: #60a5fa;
      --accent-2: #22d3ee;
      --success: #34d399;
      --chip: #0b1220;
      --radius-xl: 18px;
      --shadow: 0 12px 40px rgba(0,0,0,.45);
      --ring: 0 0 0 2px rgba(34,211,238,.25), 0 8px 40px rgba(2,132,199,.20);
    }
    * { box-sizing: border-box; }
    html, body { height: 100%; }
    body {
      margin: 0;
      background: radial-gradient(1200px 700px at 10% -10%, rgba(34,211,238,.07), transparent 60%),
                  radial-gradient(900px 600px at 110% 0%, rgba(96,165,250,.08), transparent 60%),
                  linear-gradient(180deg, #06080e 0%, #0a0d14 40%, #0a0d14 100%);
      color: var(--ink);
      font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
      line-height: 1.65;
    }
    a { color: #a5d8ff; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .container { max-width: 1100px; margin: 0 auto; padding: 24px; }
    header.nav { position: sticky; top: 0; backdrop-filter: saturate(140%) blur(10px); background: rgba(6,8,14,.6); border-bottom: 1px solid rgba(148,163,184,.12); z-index: 40; }
    .nav-inner { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
    .brand { display:flex; align-items:center; gap:12px; font-weight:800; letter-spacing:.2px; }
    .brand .logo { width: 36px; height: 36px; border-radius: 10px; background: conic-gradient(from 210deg, var(--accent), var(--accent-2), var(--accent)); box-shadow: var(--ring); display:grid; place-items:center; font-family:"JetBrains Mono", monospace; color:#001018; font-weight:900; }
    nav a { margin-left: 18px; font-weight: 600; color: var(--muted); }
    nav a:hover { color: var(--ink); }

    .hero { display:grid; grid-template-columns: 1.1fr .9fr; gap: 36px; padding: 70px 0 36px; align-items: center; }
    .hero-card { background: linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.01)); border: 1px solid rgba(148,163,184,.16); border-radius: var(--radius-xl); padding: 30px; box-shadow: var(--shadow); position: relative; overflow: hidden; }
    .hero-card::after { content:""; position:absolute; inset:-1px; background: radial-gradient(650px 220px at 30% -20%, rgba(96,165,250,.22), transparent 45%), radial-gradient(600px 200px at 120% -20%, rgba(34,211,238,.18), transparent 40%); mix-blend-mode: screen; opacity:.6; pointer-events:none; }
    .eyebrow { font-size: 12px; text-transform: uppercase; letter-spacing: .18em; color: var(--accent-2); font-weight: 800; }
    h1 { font-size: clamp(34px, 6.2vw, 60px); line-height: 1.12; margin: 8px 0 12px; }
    .tagline { font-size: clamp(16px, 2vw, 20px); color: var(--muted); }
    .chips { display:flex; flex-wrap:wrap; gap:10px; margin: 16px 0 22px; }
    .chip { background: rgba(2,132,199,.08); color:#dbeafe; border:1px solid rgba(56,189,248,.25); padding: 8px 12px; border-radius: 999px; font-size: 13px; backdrop-filter: blur(2px); }
    .cta { display:flex; flex-wrap:wrap; gap:12px; margin-top: 8px; }
    .btn { display:inline-flex; align-items:center; gap:10px; border-radius: 12px; padding: 11px 14px; font-weight: 700; border:1px solid rgba(148,163,184,.18); background:#0b1220; color: var(--ink); transition: transform .12s ease, box-shadow .12s ease; }
    .btn:hover { transform: translateY(-1px); box-shadow: var(--ring); }
    .btn.primary { background: linear-gradient(135deg, rgba(56,189,248,.18), rgba(34,211,238,.22)); border-color: rgba(56,189,248,.35); }

    .portrait { border-radius: 18px; overflow:hidden; border:1px solid rgba(148,163,184,.18); box-shadow: var(--shadow); background:#0c1324; aspect-ratio: 4 / 5; display:grid; place-items:center; color:#93c5fd; font-weight:800; position:relative; }
    .portrait::after { content:""; position:absolute; inset:0; background: radial-gradient(240px 120px at 30% 0%, rgba(59,130,246,.18), transparent 60%); }

    section { padding: 30px 0; }
    .section-title { font-size: 22px; font-weight: 900; letter-spacing:.2px; margin-bottom: 16px; }
    .grid { display:grid; gap: 16px; }
    .grid.cols-3 { grid-template-columns: repeat(3, 1fr); }
    .grid.cols-2 { grid-template-columns: repeat(2, 1fr); }
    .card { background: var(--panel); border:1px solid rgba(148,163,184,.16); border-radius: var(--radius-xl); padding: 18px; box-shadow: var(--shadow); }
    .card h3 { margin: 0 0 6px; font-size: 18px; }
    .meta { color: var(--muted); font-size: 14px; }
    .list { display:grid; gap: 8px; }

    .logo-row { display:flex; flex-wrap:wrap; gap:14px; align-items:center; }
    .logo { height:28px; opacity:.9; filter: grayscale(1) contrast(1.1); }

    .video { aspect-ratio: 16 / 9; width:100%; border-radius: 14px; border:1px solid rgba(148,163,184,.18); background:#0b1220; box-shadow: var(--shadow); }

    footer { border-top: 1px solid rgba(148,163,184,.16); color: var(--muted); padding: 26px 0 42px; }

    @media (max-width: 980px) {
      .hero { grid-template-columns: 1fr; }
      nav { display:none; }
    }
  </style>
  <!-- Schema.org person to enrich SEO -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Alon Hillel‑Tuch",
    "url": "https://ahillelt.github.io/",
    "affiliation": [{"@type":"CollegeOrUniversity","name":"NYU Tandon School of Engineering"}],
    "jobTitle": "Industry Assistant Professor, Computer Science and Engineering",
    "sameAs": [
      "https://engineering.nyu.edu/faculty/alon-hillel-tuch",
      "https://github.com/ahillelt",
      "https://x.com/ahillelt"
    ],
    "knowsAbout": ["cybersecurity","hardware security","cryptography","human‑AI interaction","resilience","socio‑technical systems"],
    "alumniOf": ["New York University","Columbia University","Hamilton College"]
  }
  </script>
</head>
<body>
  <header class="nav">
    <div class="container nav-inner">
      <div class="brand">
        <div class="logo">AH</div>
        <div>Alon Hillel‑Tuch</div>
      </div>
      <nav>
        <a href="#about">About</a>
        <a href="#interests">Research</a>
        <a href="#teaching">Teaching</a>
        <a href="#press">Press</a>
        <a href="#talks">Talks</a>
        <a href="#contact">Contact</a>
      </nav>
    </div>
  </header>

  <main class="container">
    <section class="hero">
      <div class="hero-card">
        <div class="eyebrow">Computer Science · Cybersecurity · Engineering</div>
        <h1>Resilient socio‑technical systems — built with students, research, and industry.</h1>
        <p class="tagline">Industry Assistant Professor at NYU Tandon. Research at the intersection of <strong>hardware/embedded security</strong>, <strong>cryptography</strong>, and <strong>human‑AI interaction</strong>. Former co‑founder (RocketHub) and investor (Stacked Capital).</p>
        <div class="chips" aria-label="focus areas">
          <span class="chip">Hardware security</span>
          <span class="chip">Cryptography</span>
          <span class="chip">Human‑AI interaction</span>
          <span class="chip">Responsible innovation</span>
          <span class="chip">Critical infrastructure</span>
          <span class="chip">Resilience</span>
        </div>
        <div class="cta">
          <a class="btn primary" href="#contact">Invite me to speak</a>
          <a class="btn" href="https://github.com/ahillelt" target="_blank" rel="noopener">GitHub</a>
          <a class="btn" href="https://engineering.nyu.edu/faculty/alon-hillel-tuch" target="_blank" rel="noopener">NYU Profile</a>
        </div>
      </div>
      <div class="portrait" aria-label="Portrait placeholder">
        <!-- Replace src with an actual headshot hosted in this repo (e.g., /assets/alon.jpg) -->
        <svg width="70" height="70" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="avatar">
          <path d="M12 12c2.761 0 5-2.686 5-6S14.761 0 12 0 7 2.686 7 6s2.239 6 5 6Zm0 2c-4.418 0-8 2.91-8 6.5V24h16v-3.5C20 16.91 16.418 14 12 14Z" fill="currentColor"/>
        </svg>
      </div>
    </section>

    <section id="about">
      <h2 class="section-title">About</h2>
      <div class="card">
        <p>I teach computer networking and application security, mentor students through OSIRIS Lab, and build bridges between academia and industry. Before academia I co‑founded RocketHub (acquired in 2015) and served as managing partner at Stacked Capital, investing in deep‑tech and frontier innovation. My work focuses on systems that must be safe, secure, and adoptable by real people.</p>
      </div>
    </section>

    <section id="videos">
      <h2 class="section-title">Featured Videos</h2>
      <div class="grid cols-2">
        <div class="card">
          <h3>U.S. House — JOBS Act Implementation</h3>
          <p class="meta">Panel testimony on crowdfunding policy and investor protection.</p>
          <iframe class="video" loading="lazy" src="https://www.c-span.org/video/standalone/?280562" title="C-SPAN: JOBS Act Implementation" allowfullscreen></iframe>
          <p><a href="https://www.c-span.org/program/house-committee/jobs-act-implementation/280562" target="_blank" rel="noopener">Open on C‑SPAN →</a></p>
        </div>
        <div class="card">
          <h3>TEDx: Emergence of an Alternate Path</h3>
          <p class="meta">On technology cycles and society.</p>
          <iframe class="video" loading="lazy" src="https://www.youtube.com/embed/NaE-fsacHl4" title="TEDx talk" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
          <p><a href="https://www.youtube.com/watch?v=NaE-fsacHl4" target="_blank" rel="noopener">Watch on YouTube →</a></p>
        </div>
      </div>
    </section>

    <section id="interests">
      <h2 class="section-title">Research Interests</h2>
      <div class="grid cols-3">
        <div class="card"><h3>Physical & Embedded Security</h3><p class="meta">Fault injection, side‑channels, and practical defenses in constrained environments.</p></div>
        <div class="card"><h3>Cryptographic Systems</h3><p class="meta">Design and misuse resistance; secure-by-default APIs for builders.</p></div>
        <div class="card"><h3>Human‑AI Interaction</h3><p class="meta">Operational safety, capability overhangs, and aligned decision‑support tools.</p></div>
        <div class="card"><h3>Resilience</h3><p class="meta">Failure modes in socio‑technical systems; graceful degradation and recovery.</p></div>
        <div class="card"><h3>Governance</h3><p class="meta">Standards, incentives, and policy that encourage responsible innovation.</p></div>
        <div class="card"><h3>Education at Scale</h3><p class="meta">Hands‑on labs and secure defaults in curricula for working professionals.</p></div>
      </div>
    </section>

    <section id="teaching">
      <h2 class="section-title">Teaching</h2>
      <div class="grid">
        <div class="card">
          <h3>Courses</h3>
          <ul class="list">
            <li>Computer Networking – graduate course with hands‑on labs and simulations.</li>
            <li>Application Security – secure coding, exploit mitigation, and defenses.</li>
          </ul>
        </div>
        <div class="card">
          <h3>OSIRIS Lab</h3>
          <p class="meta">Student‑run cybersecurity lab at NYU. I advise and collaborate on community‑driven security education and research.</p>
          <p><a href="https://osiris.cyber.nyu.edu/" target="_blank" rel="noopener">Explore OSIRIS →</a></p>
        </div>
      </div>
    </section>

    <section id="collab">
      <h2 class="section-title">Partnerships & Collaborations</h2>
      <div class="card">
        <p class="meta">Selected collaborations from my industry years include initiatives with public institutions and global companies around innovation, entrepreneurship, and security education.</p>
        <div class="logo-row" aria-label="selected logos (text links for a11y)">
          <a href="https://www.state.gov/" target="_blank" rel="noopener"><img class="logo" alt="U.S. Department of State" src="https://upload.wikimedia.org/wikipedia/commons/4/4e/Seal_of_the_United_States_Department_of_State.svg"></a>
          <a href="https://www.microsoft.com/" target="_blank" rel="noopener"><img class="logo" alt="Microsoft" src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg"></a>
          <a href="https://www.cisco.com/" target="_blank" rel="noopener"><img class="logo" alt="Cisco" src="https://upload.wikimedia.org/wikipedia/commons/6/64/Cisco_logo.svg"></a>
          <a href="https://www.stellantis.com/en/brands/chrysler" target="_blank" rel="noopener"><img class="logo" alt="Chrysler" src="https://upload.wikimedia.org/wikipedia/commons/f/fd/Chrysler_2023.svg"></a>
          <a href="https://www.fulbrightprogram.org/" target="_blank" rel="noopener"><img class="logo" alt="Fulbright" src="https://upload.wikimedia.org/wikipedia/commons/8/8c/Fulbright_program_logo.svg"></a>
        </div>
        <p class="meta">See: testimony, media, and talks below for context.</p>
      </div>
    </section>

    <section id="press">
      <h2 class="section-title">Press & Testimony</h2>
      <div class="grid">
        <article class="card">
          <h3>U.S. House Testimony on the JOBS Act (2012)</h3>
          <p class="meta">Remarks on implementing crowdfunding provisions and balancing innovation with investor protection.</p>
          <p><a href="https://oversight.house.gov/wp-content/uploads/2012/06/6-26-12-TARP-Hillel-Tuch.pdf" target="_blank" rel="noopener">Read testimony (June 2012)</a></p>
        </article>
        <article class="card">
          <h3>U.S. House Financial Services Committee (2014)</h3>
          <p class="meta">Statement on crowdfunding market structure and regulation.</p>
          <p><a href="https://financialservices.house.gov/uploadedfiles/hhrg-113-ba09-wstate-ahilleltuch-20140305.pdf" target="_blank" rel="noopener">Read statement (Mar 2014)</a></p>
        </article>
        <article class="card">
          <h3>SEC Comment Letter</h3>
          <p class="meta">RocketHub perspective on proposed crowdfunding rules.</p>
          <p><a href="https://www.sec.gov/comments/s7-09-13/s70913-206.pdf" target="_blank" rel="noopener">SEC letter</a></p>
        </article>
      </div>
    </section>

    <section id="talks">
      <h2 class="section-title">Talks & Media</h2>
      <div class="grid cols-3">
        <div class="card"><h3>C‑SPAN: JOBS Act Implementation</h3><p class="meta">Panel appearance (2012).</p><p><a href="https://www.c-span.org/program/house-committee/jobs-act-implementation/280562" target="_blank" rel="noopener">Watch →</a></p></div>
        <div class="card"><h3>TEDx: Emergence of an Alternate Path</h3><p class="meta">On technology cycles and society.</p><p><a href="https://www.youtube.com/watch?v=NaE-fsacHl4" target="_blank" rel="noopener">Watch →</a></p></div>
        <div class="card"><h3>Forbes Tech Council</h3><p class="meta">Writing on AI risk, cybersecurity, and innovation.</p><p><a href="https://councils.forbes.com/profile/Alon-Hillel-Tuch-Managing-Partner-Stacked-Capital/c2a302ca-0c61-4db5-84b1-68814e376cb5" target="_blank" rel="noopener">Read →</a></p></div>
      </div>
    </section>

    <section id="selected">
      <h2 class="section-title">Selected Writing & Research</h2>
      <div class="grid">
        <div class="card">
          <h3>Data Siphoning Through Advanced Persistent Flows</h3>
          <p class="meta">Working paper exploring data exfiltration dynamics across complex systems.</p>
          <p><a href="https://papers.ssrn.com/sol3/papers.cfm?abstract_id=3890371" target="_blank" rel="noopener">SSRN →</a> · <a href="https://scholar.google.com/citations?hl=en&user=yxEpRBIAAAAJ" target="_blank" rel="noopener">Google Scholar →</a></p>
        </div>
      </div>
    </section>

    <section id="contact">
      <h2 class="section-title">Contact</h2>
      <div class="card">
        <p>Email: <a href="mailto:ah5647@nyu.edu">ah5647@nyu.edu</a> · GitHub: <a href="https://github.com/ahillelt" target="_blank" rel="noopener">@ahillelt</a> · X: <a href="https://x.com/ahillelt" target="_blank" rel="noopener">@ahillelt</a></p>
        <p class="meta">For collaboration or student projects, include a short brief with goals, constraints, and timeline.</p>
      </div>
    </section>
  </main>

  <footer>
    <div class="container">
      <div>© <span id="year"></span> Alon Hillel‑Tuch. Built for GitHub Pages. <span class="meta">v1.0</span></div>
    </div>
  </footer>

  <script>
    // year stamp
    document.getElementById('year').textContent = new Date().getFullYear();

    // simple motion for chips
    const chips = document.querySelectorAll('.chip');
    chips.forEach((chip, i) => {
      chip.animate([
        { transform: 'translateY(0px)' },
        { transform: 'translateY(-3px)' },
        { transform: 'translateY(0px)' }
      ], { duration: 3500 + i*120, iterations: Infinity });
    });
  </script>
</body>
</html>
