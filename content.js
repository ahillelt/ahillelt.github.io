// ============================================================================
// content.js - loads every CSV-driven section of index.html.
// Loaded at the end of <body> (before script.js), so all containers exist.
// Relies on head.js for escapeHtml/sanitizeUrl/sanitizeHtml and the CSV helpers
// (fetchCSV, parseCSVRows, parseCSVObjects, parseCSVKeyValues).
// ============================================================================

// ============================================================================
// Apply saved section order immediately (before CSV content arrives)
// ============================================================================
(function() {
  // Guard: Prevent double execution; ignore malformed saved values
  if (!Array.isArray(window.__initialNavOrder) || window.__layoutReordered) return;

  const nav = document.getElementById('mainNav');
  const main = document.querySelector('main');

  // Null safety checks
  if (!nav || !main) {
    console.error('Required elements not found');
    return;
  }
  const sectionMap = window.__portfolioUtils.sectionMap;

  // REORDER NAV ITEMS IMMEDIATELY
  const navItems = Array.from(nav.querySelectorAll('a'));
  const itemMap = {};
  navItems.forEach(item => {
    itemMap[item.getAttribute('href')] = item;
  });

  const dropIndicator = document.getElementById('dropIndicator');
  const layoutControls = nav.querySelector('.layout-controls');

  navItems.forEach(item => item.remove());

  const firstNonLink = dropIndicator || layoutControls;
  window.__initialNavOrder.forEach(href => {
    if (itemMap[href]) {
      if (firstNonLink) {
        nav.insertBefore(itemMap[href], firstNonLink);
      } else {
        nav.appendChild(itemMap[href]);
      }
    }
  });

  // REORDER SECTIONS IMMEDIATELY
  const sections = {};
  Object.values(sectionMap).forEach(id => {
    const section = document.getElementById(id);
    if (section) {
      sections[id] = section;
      section.style.transition = 'none';
    }
  });

  window.__initialNavOrder.forEach(href => {
    const sectionId = sectionMap[href];
    if (sections[sectionId]) {
      main.appendChild(sections[sectionId]);
    }
  });

  // Re-enable transitions immediately
  Object.values(sections).forEach(section => {
    section.style.transition = '';
  });

  // Mark that we've already done the reordering
  window.__layoutReordered = true;
})();

// ============================================================================
// Shared rendering helpers
// ============================================================================

// Links format: "Label|URL::Label|URL"
function renderPubLinks(links) {
  if (!links) return '';
  let html = '<div class="pub-links">';
  links.split('::').forEach(pair => {
    const [label, url] = pair.split('|');
    if (label && url) {
      html += `<a href="${sanitizeUrl(url.trim())}" class="pub-link" target="_blank" rel="noopener noreferrer">${escapeHtml(label.trim())}</a>`;
    }
  });
  return html + '</div>';
}

function renderLoadError(title, error, extraStyle = '') {
  return `
    <div style="padding: 40px; text-align: center; background: var(--bg-tertiary); border-radius: 12px; border: 2px dashed var(--border);${extraStyle}">
      <div style="font-size: 48px; margin-bottom: 8px;">⚠️</div>
      <h3 style="color: var(--text); margin-bottom: 12px;">${escapeHtml(title)}</h3>
      <p style="color: var(--text-muted);">${escapeHtml(error.message)}</p>
    </div>
  `;
}

// section_headers.csv is shared by several sections: fetch it once
let sectionHeadersPromise = null;
async function loadSectionHeader(sectionId, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  try {
    if (!sectionHeadersPromise) {
      sectionHeadersPromise = fetchCSV('section_headers.csv').then(parseCSVObjects);
    }
    const header = (await sectionHeadersPromise).find(h => h.section_id === sectionId);
    if (header) {
      container.innerHTML = `
        <h2 class="section-title">${escapeHtml(header.title)}</h2>
        <p class="section-subtitle">${escapeHtml(header.subtitle)}</p>
      `;
    }
  } catch (e) {
    console.error(`Error loading ${sectionId} header:`, e);
  }
}

// ============================================================================
// Hero - hero_content.csv
// ============================================================================
(async function() {
  const container = document.querySelector('#hero-container');
  if (!container) return;

  try {
    const data = parseCSVKeyValues(await fetchCSV('hero_content.csv'));

    const chips = data.chips ? data.chips.split('|').map(chip =>
      `<span class="chip">${escapeHtml(chip)}</span>`
    ).join('') : '';

    container.innerHTML = `
      <div class="hero-text">
        <span class="eyebrow">${escapeHtml(data.eyebrow || '')}</span>
        <h1>${escapeHtml(data.title || '')}</h1>
        <p class="tagline">${sanitizeHtml(data.tagline || '')}</p>
        <div class="chips">${chips}</div>
        <div class="cta">
          <a href="${sanitizeUrl(data.cta_primary_link || '#contact')}" class="btn primary">${escapeHtml(data.cta_primary_text || 'Contact')}</a>
          <a href="${sanitizeUrl(data.cta_secondary_link || '#')}" target="_blank" class="btn secondary" rel="noopener noreferrer">${escapeHtml(data.cta_secondary_text || '')}</a>
        </div>
      </div>
      <div class="portrait">
        <img src="${sanitizeUrl(data.image_src || 'headshot2.png')}"
             alt="${escapeHtml(data.image_alt || 'Alon Hillel-Tuch')}"
             width="800" height="800" fetchpriority="high" decoding="async"
             style="width: 100%; height: 100%; object-fit: cover;" />
      </div>
    `;
  } catch (error) {
    console.error('Error loading hero content:', error);
  }
})();

// ============================================================================
// Stats - stats.csv (+ students taught computed from courses_history.csv)
// ============================================================================
(async function() {
  const container = document.querySelector('#stats-container');
  if (!container) return;

  try {
    const [statsText, coursesText] = await Promise.all([
      fetchCSV('stats.csv'),
      fetchCSV('courses_history.csv').catch(() => null)
    ]);

    // Calculate dynamic faculty student count from courses_history.csv
    let dynamicStudentCount = null;
    if (coursesText) {
      const courses = parseCSVObjects(coursesText);
      if (courses.length && 'enrollment' in courses[0] && 'role' in courses[0]) {
        dynamicStudentCount = 0;
        courses.forEach(course => {
          if (course.role === 'Faculty') {
            const match = course.enrollment.match(/~?(\d+)/);
            if (match) dynamicStudentCount += parseInt(match[1], 10);
          }
        });
      }
    }

    container.innerHTML = '';
    parseCSVObjects(statsText).forEach(stat => {
      let statNumber = stat.number;
      const statLabel = stat.label;

      // Replace static student count with dynamic calculation
      if (statLabel.toLowerCase().includes('students taught') && dynamicStudentCount !== null) {
        statNumber = String(dynamicStudentCount);
      }

      const card = document.createElement('div');
      card.className = 'stat-card';
      card.innerHTML = `
        <div class="stat-number">${escapeHtml(statNumber)}</div>
        <div class="stat-label">${escapeHtml(statLabel)}</div>
      `;
      container.appendChild(card);
    });
  } catch (error) {
    console.error('Error loading stats:', error);
  }
})();

// ============================================================================
// About - section_headers.csv + about_content.csv
// ============================================================================
loadSectionHeader('about', 'about-header');

(async function() {
  const contentContainer = document.querySelector('#about-content');
  if (!contentContainer) return;

  try {
    const rows = parseCSVObjects(await fetchCSV('about_content.csv'));

    // Build Academic Card
    // Note: row.content may contain intentional <strong>/<br> from CSV; sanitizeHtml allows only those
    let academicHtml = '';
    rows.forEach(row => {
      if (['academic_mission', 'education_credentials', 'research_teaching', 'teaching_philosophy'].includes(row.section)) {
        academicHtml += `<h3>${escapeHtml(row.title)}</h3>`;
        if (row.section === 'education_credentials') {
          const items = row.content.split('|');
          academicHtml += '<ul style="margin-top: 12px;">' + items.map(item => `<li>${sanitizeHtml(item)}</li>`).join('') + '</ul>';
        } else {
          academicHtml += `<p>${sanitizeHtml(row.content)}</p>`;
        }
        if (row.section === 'education_credentials') academicHtml += '<h4 style="margin-top: 20px;">Research & Teaching</h4>';
        if (row.section === 'research_teaching') academicHtml += '<h4>Teaching Philosophy</h4>';
      }
    });

    // Build Industry Card
    // Note: row.content may contain intentional <strong>/<br> from CSV; sanitizeHtml allows only those
    let industryHtml = '<h3>Industry & Entrepreneurship</h3>';
    rows.forEach(row => {
      if (['career_highlights', 'policy_regulatory', 'consulting_advisory'].includes(row.section)) {
        industryHtml += `<h4>${escapeHtml(row.title)}</h4>`;
        if (row.section === 'career_highlights') {
          const items = row.content.split('|');
          industryHtml += '<ul style="margin-top: 12px; margin-bottom: 20px;">' + items.map(item => `<li>${sanitizeHtml(item)}</li>`).join('') + '</ul>';
        } else {
          industryHtml += `<p>${sanitizeHtml(row.content)}</p>`;
        }
      }
    });

    contentContainer.innerHTML = `
      <div class="card">${academicHtml}</div>
      <div class="card">${industryHtml}</div>
    `;
  } catch (error) {
    console.error('Error loading about content:', error);
  }
})();

// ============================================================================
// Press & Speaking
// ============================================================================

// Congressional Testimony - congressional_testimony.csv
(async function() {
  const container = document.querySelector('#congressional-testimony-container');
  if (!container) return;

  try {
    const items = parseCSVObjects(await fetchCSV('congressional_testimony.csv'));

    container.innerHTML = '';
    items.forEach(item => {
      const card = document.createElement('article');
      card.className = 'card';

      let videoHtml = '';
      if (item.video_type === 'jwplayer') {
        videoHtml = `<div class="video-wrapper"><div style="position:relative;overflow:hidden;padding-bottom:56.25%"><iframe sandbox="allow-scripts allow-same-origin allow-presentation" loading="lazy" src="${sanitizeUrl(item.video_src)}" width="100%" height="100%" frameborder="0" scrolling="auto" title="${escapeHtml(item.title)}" style="position:absolute;" allowfullscreen></iframe></div></div>`;
      } else if (item.video_type === 'vimeo') {
        videoHtml = `<div class="video-wrapper"><iframe sandbox="allow-scripts allow-same-origin allow-presentation" loading="lazy" src="${sanitizeUrl(item.video_src)}" title="${escapeHtml(item.title)}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>`;
      }

      card.innerHTML = `
        <h3>${escapeHtml(item.title)}</h3>
        <p style="color: var(--accent); font-weight: 700; margin-bottom: 8px;">${escapeHtml(item.date)}</p>
        ${videoHtml}
        <p>${escapeHtml(item.description)}</p>
        ${renderPubLinks(item.links)}
      `;
      container.appendChild(card);
    });
  } catch (error) {
    console.error('Error loading congressional testimony:', error);
  }
})();

// Keynotes & Speaking - keynotes_speaking.csv
(async function() {
  const container = document.querySelector('#keynotes-speaking-container');
  if (!container) return;

  try {
    const items = parseCSVObjects(await fetchCSV('keynotes_speaking.csv'));

    container.innerHTML = '';
    items.forEach(item => {
      const card = document.createElement('div');
      card.className = item.video_type !== 'none' && item.video_src ? 'card video-card' : 'card';

      let videoHtml = '';
      if (item.video_type === 'vimeo' && item.video_src) {
        videoHtml = `<div class="video-wrapper"><iframe sandbox="allow-scripts allow-same-origin allow-presentation" loading="lazy" src="${sanitizeUrl(item.video_src)}" title="${escapeHtml(item.title)}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>`;
      } else if (item.video_type === 'youtube' && item.video_src) {
        videoHtml = `<div class="video-wrapper"><iframe sandbox="allow-scripts allow-same-origin allow-presentation" loading="lazy" src="${sanitizeUrl(item.video_src)}" title="${escapeHtml(item.title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`;
      }

      card.innerHTML = `
        <h3>${escapeHtml(item.title)}</h3>
        <p style="color: var(--accent); font-weight: 700; margin-bottom: 8px;">${escapeHtml(item.venue)} · ${escapeHtml(item.date)}</p>
        ${videoHtml}
        <p>${escapeHtml(item.description)}</p>
        ${renderPubLinks(item.links)}
      `;
      container.appendChild(card);
    });
  } catch (error) {
    console.error('Error loading keynotes:', error);
  }
})();

// Academic & Legal Forums - academic_legal_forums.csv
(async function() {
  const container = document.querySelector('#academic-legal-container');
  if (!container) return;

  try {
    const items = parseCSVObjects(await fetchCSV('academic_legal_forums.csv'));

    container.innerHTML = '';
    items.forEach(item => {
      const card = document.createElement('article');
      card.className = 'card';
      // Note: item.description may contain intentional <strong>/<br> from CSV; sanitizeHtml allows only those
      card.innerHTML = `
        <h3>${escapeHtml(item.title)}</h3>
        <p style="color: var(--accent); font-weight: 700; margin-bottom: 8px;">${escapeHtml(item.venue)} · ${escapeHtml(item.date)}</p>
        <p>${sanitizeHtml(item.description)}</p>
        ${renderPubLinks(item.links)}
      `;
      container.appendChild(card);
    });
  } catch (error) {
    console.error('Error loading academic legal forums:', error);
  }
})();

// Press Coverage - press_coverage.csv
(async function() {
  const container = document.querySelector('#press-coverage-container');
  if (!container) return;

  try {
    const items = parseCSVObjects(await fetchCSV('press_coverage.csv'));

    container.innerHTML = '';
    items.forEach(item => {
      const card = document.createElement('article');
      card.className = 'card';

      let videoHtml = '';
      if (item.video_type === 'vimeo' && item.video_src) {
        videoHtml = `<div class="video-wrapper"><iframe sandbox="allow-scripts allow-same-origin allow-presentation" loading="lazy" src="${sanitizeUrl(item.video_src)}" title="${escapeHtml(item.title)}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>`;
      }

      card.innerHTML = `
        <h3>${escapeHtml(item.title)}</h3>
        <p style="color: var(--accent); font-weight: 700; margin-bottom: 8px;">${escapeHtml(item.date)}</p>
        ${videoHtml}
        <p>${escapeHtml(item.description)}</p>
        ${renderPubLinks(item.links)}
      `;
      container.appendChild(card);
    });
  } catch (error) {
    console.error('Error loading press coverage:', error);
  }
})();

// Forbes Technology Council - forbes_council.csv + forbes_articles.csv
(async function() {
  const container = document.querySelector('#forbes-council-container');
  if (!container) return;

  try {
    const [councilText, articlesText] = await Promise.all([
      fetchCSV('forbes_council.csv'),
      fetchCSV('forbes_articles.csv')
    ]);
    const councilData = parseCSVKeyValues(councilText);
    const articles = parseCSVObjects(articlesText).filter(a => a.title);

    const articlesHtml = articles.map(a => `
      <a href="${sanitizeUrl(a.url)}" target="_blank" rel="noopener noreferrer" class="forbes-article-link">
        <span class="article-title">${escapeHtml(a.title)}</span>
        <span class="article-date">${escapeHtml(a.date)}</span>
      </a>
    `).join('');

    container.innerHTML = `
      <div class="forbes-header">
        <div><span class="forbes-badge">${escapeHtml(councilData.badge || 'Forbes Technology Council')}</span></div>
        <div>
          <h3 style="margin: 0 0 8px 0; font-size: 24px;">${escapeHtml(councilData.title || '')}</h3>
          <p style="color: var(--text-secondary); font-size: 15px; line-height: 1.6; margin: 0;">${escapeHtml(councilData.description || '')}</p>
        </div>
        <div class="pub-links">
          <a href="${sanitizeUrl(councilData.profile_url || '#')}" class="pub-link" target="_blank" rel="noopener noreferrer">${escapeHtml(councilData.profile_text || 'View Profile')}</a>
        </div>
      </div>
      <div class="forbes-articles-grid">${articlesHtml}</div>
    `;
  } catch (error) {
    console.error('Error loading Forbes council:', error);
  }
})();

// Major Press Coverage - news_articles.csv
(async function() {
  const container = document.querySelector('#news-articles-container');
  if (!container) return;

  try {
    const articles = parseCSVObjects(await fetchCSV('news_articles.csv'));

    container.innerHTML = '';
    articles.forEach(article => {
      const card = document.createElement('article');
      card.className = 'card';

      let html = `
        <h3>${escapeHtml(article.source)}</h3>
        <p style="color: var(--accent); font-weight: 700; margin-bottom: 8px;">${escapeHtml(article.date)}</p>
        <p><strong>"${escapeHtml(article.title)}"</strong></p>
        <p>${escapeHtml(article.body)}</p>
      `;

      if (article.link_url) {
        html += `
        <div class="pub-links">
          <a href="${sanitizeUrl(article.link_url)}" class="pub-link" target="_blank" rel="noopener noreferrer">
            ${article.link_icon ? escapeHtml(article.link_icon) + ' ' : ''}${escapeHtml(article.link_caption)}
          </a>
        </div>
        `;
      }

      card.innerHTML = html;
      container.appendChild(card);
    });
  } catch (error) {
    console.error('Error loading news articles:', error);
    container.innerHTML = renderLoadError('Unable to Load Articles', error, ' grid-column: 1 / -1;');
  }
})();

// Additional Coverage - additional_coverage.csv
(async function() {
  const container = document.querySelector('#additional-coverage-container');
  if (!container) return;

  try {
    const data = parseCSVKeyValues(await fetchCSV('additional_coverage.csv'));

    container.innerHTML = `
      <div class="card">
        <h3>Additional Coverage</h3>
        <p style="margin-bottom: 8px;"><strong>Featured in:</strong> ${escapeHtml(data.featured_in || '')}</p>
        <p style="color: var(--text-muted);">${escapeHtml(data.description || '')}</p>
        <p style="margin-top: 16px; color: var(--accent); font-weight: 600;">${escapeHtml(data.cta_text || '')}</p>
        <div class="pub-links">
          <a href="${sanitizeUrl(data.cta_link || '#contact')}" class="pub-link">${escapeHtml(data.cta_label || 'Media Inquiries')}</a>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Error loading additional coverage:', error);
  }
})();

// Podcasts & Webinars - podcasts_webinars.csv
(async function() {
  const container = document.querySelector('#podcasts-webinars-container');
  if (!container) return;

  try {
    const items = parseCSVObjects(await fetchCSV('podcasts_webinars.csv'));

    container.innerHTML = '';
    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'card';
      // Note: item.description may contain intentional <strong>/<br> from CSV; sanitizeHtml allows only those
      card.innerHTML = `
        <h3>${escapeHtml(item.title)}</h3>
        <p style="color: var(--accent); font-weight: 700; margin-bottom: 8px;">${escapeHtml(item.venue)} · ${escapeHtml(item.date)}</p>
        <p>${sanitizeHtml(item.description)}</p>
      `;
      container.appendChild(card);
    });
  } catch (error) {
    console.error('Error loading podcasts webinars:', error);
  }
})();

// Speaking Topics - speaking_info.csv + speaking_topics.csv
(async function() {
  const container = document.querySelector('#speaking-topics-section');
  if (!container) return;

  try {
    const [infoText, topicsText] = await Promise.all([
      fetchCSV('speaking_info.csv'),
      fetchCSV('speaking_topics.csv')
    ]);
    const info = parseCSVKeyValues(infoText);
    const topics = parseCSVObjects(topicsText);
    const col1Topics = topics.filter(t => t.column === '1');
    const col2Topics = topics.filter(t => t.column !== '1');

    const renderTopics = list => list.map(t => `<li><strong>${escapeHtml(t.topic)}:</strong> ${escapeHtml(t.description)}</li>`).join('');

    container.innerHTML = `
      <div class="card">
        <h3>Available for Speaking Engagements</h3>
        <p>${escapeHtml(info.intro || '')}</p>
        <h4 style="color: var(--navy); margin-top: 24px; margin-bottom: 8px;">${escapeHtml(info.section_title || 'Speaking Topics')}</h4>
        <div class="grid cols-2" style="margin-top: 20px;">
          <div><ul>${renderTopics(col1Topics)}</ul></div>
          <div><ul>${renderTopics(col2Topics)}</ul></div>
        </div>
        <div class="pub-links" style="margin-top: 24px;">
          <a href="${sanitizeUrl(info.cta_link || '#contact')}" class="pub-link">${escapeHtml(info.cta_label || 'Request Speaking Engagement')}</a>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Error loading speaking topics:', error);
  }
})();

// ============================================================================
// Teaching (course history/details tables are rendered by script.js)
// ============================================================================
loadSectionHeader('teaching', 'teaching-header');

// CAE Designations - cae_designations.csv (first data row)
(async function() {
  const container = document.querySelector('#cae-designations-container');
  if (!container) return;

  try {
    const [cae] = parseCSVObjects(await fetchCSV('cae_designations.csv'));
    if (!cae) return;

    const designations = cae.designations ? cae.designations.split('|') : [];
    const designationsHtml = designations.map(d =>
      `<div style="padding: 12px 24px; background: #fee2e2; color: #991b1b; border: 2px solid #fca5a5; border-radius: 10px; font-weight: 700; font-size: 15px;">${escapeHtml(d)}</div>`
    ).join('');

    container.innerHTML = `
      <div class="card">
        <h3>CAE Designations</h3>
        <p>${escapeHtml(cae.description)}</p>
        <div style="display: flex; flex-wrap: wrap; gap: 16px; margin-top: 20px; justify-content: center;">${designationsHtml}</div>
      </div>
    `;
  } catch (error) {
    console.error('Error loading CAE designations:', error);
  }
})();

// Course Development - course_development.csv
(async function() {
  const container = document.querySelector('#course-development-container');
  if (!container) return;

  try {
    const courses = parseCSVObjects(await fetchCSV('course_development.csv'));

    container.innerHTML = '';
    courses.forEach((course, index) => {
      const p = document.createElement('p');
      p.style.marginTop = index === 0 ? '20px' : '16px';
      p.innerHTML = `<strong>${escapeHtml(course.course_name)} (${escapeHtml(course.course_code)})</strong> — ${escapeHtml(course.description)}`;
      container.appendChild(p);
    });
  } catch (error) {
    console.error('Error loading course development data:', error);
    container.innerHTML = `
      <p style="color: var(--text-muted); margin-top: 20px; font-style: italic;">Unable to load course development data.</p>
    `;
  }
})();

// ============================================================================
// Labs & Centers - labs_centers.csv
// ============================================================================
loadSectionHeader('labs', 'labs-header');

(async function() {
  const container = document.querySelector('#labs-centers-container');
  if (!container) return;

  try {
    const items = parseCSVObjects(await fetchCSV('labs_centers.csv'));

    container.innerHTML = '';
    items.forEach(item => {
      const activities = item.activities ? item.activities.split('|').map(a => `<li>${escapeHtml(a)}</li>`).join('') : '';

      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <h3>${escapeHtml(item.name)}</h3>
        <p style="color: var(--accent); font-weight: 700; margin-bottom: 8px;">${escapeHtml(item.role)}</p>
        <p>${escapeHtml(item.description)}</p>
        <h4>${item.name.includes('Lab') ? 'Lab Activities' : 'Center Focus Areas'}</h4>
        <ul>${activities}</ul>
        <p style="margin-top: 16px;"><a href="${sanitizeUrl(item.link_url)}" target="_blank" rel="noopener noreferrer" style="font-weight: 700;">${escapeHtml(item.link_text)}</a></p>
      `;
      container.appendChild(card);
    });
  } catch (error) {
    console.error('Error loading labs centers:', error);
  }
})();

// ============================================================================
// Research
// ============================================================================

// Research Areas - research_areas.csv
(async function() {
  const container = document.querySelector('#research-areas-container');
  if (!container) return;

  try {
    const areas = parseCSVObjects(await fetchCSV('research_areas.csv'));

    container.innerHTML = '';
    areas.forEach(area => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <h3>${escapeHtml(area.title)}</h3>
        <p>${escapeHtml(area.description)}</p>
      `;
      container.appendChild(card);
    });
  } catch (error) {
    console.error('Error loading research areas:', error);
    container.innerHTML = renderLoadError('Unable to Load Research Areas', error, ' grid-column: 1 / -1;');
  }
})();

// Papers - papers_published.csv
(async function() {
  const container = document.querySelector('#papers-container');
  if (!container) return;

  try {
    const papers = parseCSVObjects(await fetchCSV('papers_published.csv'));

    container.innerHTML = '';
    papers.forEach(paper => {
      const pub = document.createElement('div');
      pub.className = 'publication';

      let html = `
        <div class="pub-title">${escapeHtml(paper.title)}</div>
        <div class="pub-authors">${escapeHtml(paper.authors)}</div>
        <div class="pub-venue">${escapeHtml(paper.venue)}</div>
        <p class="pub-abstract">${escapeHtml(paper.abstract)}</p>
      `;

      // Add impact if available
      if (paper.impact) {
        html += `<p style="color: var(--accent); font-size: 14px; margin-top: 8px; font-weight: 600;">${escapeHtml(paper.impact)}</p>`;
      }

      html += renderPubLinks(paper.links);

      pub.innerHTML = html;
      container.appendChild(pub);
    });
  } catch (error) {
    console.error('Error loading papers:', error);
    container.innerHTML = renderLoadError('Unable to Load Papers', error);
  }
})();

// Patents - patents.csv
(async function() {
  const container = document.querySelector('#patents-container');
  if (!container) return;

  try {
    const items = parseCSVObjects(await fetchCSV('patents.csv'));

    container.innerHTML = '';
    items.forEach(item => {
      const pub = document.createElement('div');
      pub.className = 'publication';
      pub.innerHTML = `
        <div class="pub-title">${escapeHtml(item.title)}</div>
        <div class="pub-authors">${escapeHtml(item.authors)}</div>
        <div class="pub-venue">${escapeHtml(item.venue)}</div>
        <p class="pub-abstract">${escapeHtml(item.abstract)}</p>
        <p style="color: var(--accent); font-size: 14px; margin-top: 12px; font-weight: 600;">${escapeHtml(item.impact)}</p>
        <p style="color: var(--text-muted); font-size: 13px; margin-top: 8px;"><strong>Cited by:</strong> ${escapeHtml(item.cited_by)}</p>
        <div class="pub-links">
          <a href="${sanitizeUrl(item.link_url)}" class="pub-link" target="_blank" rel="noopener noreferrer">${escapeHtml(item.link_text)}</a>
        </div>
      `;
      container.appendChild(pub);
    });
  } catch (error) {
    console.error('Error loading patents:', error);
  }
})();

// ============================================================================
// Industry
// ============================================================================
loadSectionHeader('industry', 'industry-header');

// Companies - industry_companies.csv
(async function() {
  const container = document.querySelector('#industry-companies-container');
  if (!container) return;

  try {
    const items = parseCSVObjects(await fetchCSV('industry_companies.csv'));

    container.innerHTML = '';
    items.forEach(item => {
      const achievements = item.achievements ? item.achievements.split('|').map(a => `<li>${escapeHtml(a)}</li>`).join('') : '';
      const achievementsTitle = item.name.includes('RocketHub') ? 'Key Achievements' : 'Investment Focus';

      const card = document.createElement('div');
      card.className = 'card industry-card';
      card.innerHTML = `
        <h3>${escapeHtml(item.name)} · ${escapeHtml(item.role)}</h3>
        <p style="color: var(--accent); font-weight: 700; margin-bottom: 8px;">${escapeHtml(item.dates)}</p>
        <p>${escapeHtml(item.description)}</p>
        <h4>${achievementsTitle}</h4>
        <ul>${achievements}</ul>
      `;
      container.appendChild(card);
    });
  } catch (error) {
    console.error('Error loading industry companies:', error);
  }
})();

// Partnership Projects - partnership_projects.csv
(async function() {
  const largeContainer = document.querySelector('#partnership-large-container');
  const smallContainer = document.querySelector('#partnership-small-container');
  if (!largeContainer || !smallContainer) return;

  try {
    const items = parseCSVObjects(await fetchCSV('partnership_projects.csv'));

    largeContainer.innerHTML = '';
    smallContainer.innerHTML = '';

    items.forEach(item => {
      const card = document.createElement('article');
      card.className = 'card';

      let videoHtml = '';
      if (item.video_src) {
        videoHtml = `<div class="video-wrapper"><iframe sandbox="allow-scripts allow-same-origin allow-presentation" loading="lazy" src="${sanitizeUrl(item.video_src)}" title="${escapeHtml(item.title)}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>`;
      }

      card.innerHTML = `
        <h3>${escapeHtml(item.title)}</h3>
        <p style="color: var(--accent); font-weight: 700; margin-bottom: 8px;">${escapeHtml(item.partner)}</p>
        ${videoHtml}
        <p>${escapeHtml(item.description)}</p>
      `;

      if (item.card_size === 'large') {
        largeContainer.appendChild(card);
      } else {
        smallContainer.appendChild(card);
      }
    });
  } catch (error) {
    console.error('Error loading partnership projects:', error);
  }
})();

// Partners - partners_list.csv
(async function() {
  const container = document.querySelector('#partners-list-container');
  if (!container) return;

  try {
    const partners = parseCSVObjects(await fetchCSV('partners_list.csv'));

    const partnersHtml = partners.filter(p => p.name).map(p =>
      `<span style="padding: 10px 20px; background: var(--bg-secondary); border-radius: 8px; font-weight: 600; color: var(--navy); font-size: 14px;">${escapeHtml(p.name)}</span>`
    ).join('');

    container.innerHTML = `<div style="display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; align-items: center;">${partnersHtml}</div>`;
  } catch (error) {
    console.error('Error loading partners list:', error);
  }
})();

// Consulting & Advisory - consulting_advisory.csv
(async function() {
  const container = document.querySelector('#consulting-container');
  if (!container) return;

  try {
    const engagements = parseCSVObjects(await fetchCSV('consulting_advisory.csv'));

    container.innerHTML = '';
    engagements.forEach(eng => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <h3>${escapeHtml(eng.company)}</h3>
        <p style="color: var(--accent); font-weight: 700; margin-bottom: 8px;">${escapeHtml(eng.role)}</p>
        <p>${escapeHtml(eng.description)}</p>
      `;
      container.appendChild(card);
    });
  } catch (error) {
    console.error('Error loading consulting engagements:', error);
    container.innerHTML = renderLoadError('Unable to Load Consulting Data', error, ' grid-column: 1 / -1;');
  }
})();

// Additional Career Experience - career_experience.csv
(async function() {
  const container = document.querySelector('#career-experience-container');
  if (!container) return;

  try {
    const items = parseCSVObjects(await fetchCSV('career_experience.csv'));

    container.innerHTML = '';
    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <h3>${escapeHtml(item.company)}</h3>
        <p style="color: var(--accent); font-weight: 700; margin-bottom: 8px;">${escapeHtml(item.dates)} · ${escapeHtml(item.role)}</p>
        <p>${escapeHtml(item.description)}</p>
      `;
      container.appendChild(card);
    });
  } catch (error) {
    console.error('Error loading career experience:', error);
  }
})();

// ============================================================================
// Awards & Credentials
// ============================================================================
loadSectionHeader('credentials', 'credentials-header');

// Credentials - credentials.csv
(async function() {
  const container = document.querySelector('#credentials-container');
  if (!container) return;

  try {
    const credentials = parseCSVObjects(await fetchCSV('credentials.csv'));

    container.innerHTML = '';
    credentials.forEach(cred => {
      const items = cred.items.split('|');
      const card = document.createElement('div');
      card.className = 'card';
      // Note: credential items may contain intentional <strong> from CSV; sanitizeHtml allows only that
      card.innerHTML = `
        <h3>${escapeHtml(cred.category)}</h3>
        <ul style="margin-top: 16px;">${items.map(item => `<li>${sanitizeHtml(item)}</li>`).join('')}</ul>
      `;
      container.appendChild(card);
    });
  } catch (error) {
    console.error('Error loading credentials:', error);
  }
})();

// Languages - languages.csv
(async function() {
  const container = document.querySelector('#languages-container');
  if (!container) return;

  try {
    const languages = parseCSVObjects(await fetchCSV('languages.csv'));

    const languagesHtml = languages.map(l =>
      `<span style="padding: 12px 24px; background: var(--bg-secondary); border-radius: 8px; font-weight: 600; color: var(--navy); font-size: 15px;">${escapeHtml(l.language)} <span style="color: var(--text-muted); font-weight: 400;">(${escapeHtml(l.proficiency)})</span></span>`
    ).join('');

    container.innerHTML = `
      <div class="card">
        <h3 style="text-align: center; margin-bottom: 24px;">Languages</h3>
        <div style="display: flex; flex-wrap: wrap; gap: 16px; justify-content: center; align-items: center;">${languagesHtml}</div>
      </div>
    `;
  } catch (error) {
    console.error('Error loading languages:', error);
  }
})();

// Technical Skills - technical_skills.csv
(async function() {
  const container = document.querySelector('#technical-skills-container');
  if (!container) return;

  try {
    const skills = parseCSVObjects(await fetchCSV('technical_skills.csv'));

    // Note: skill items may contain intentional <strong> from CSV; sanitizeHtml allows only that
    const skillsHtml = skills.map(skill => {
      const items = skill.items ? skill.items.split('|').map(item => `<p style="color: var(--text-muted); line-height: 1.8;">${sanitizeHtml(item)}</p>`).join('') : '';
      return `
        <div>
          <h4 style="color: var(--navy); font-size: 16px; margin-bottom: 12px;">${escapeHtml(skill.title)}</h4>
          ${items}
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="card">
        <h3 style="text-align: center; margin-bottom: 24px;">Technical Skills & Expertise</h3>
        <div class="grid cols-2" style="margin-top: 24px;">${skillsHtml}</div>
      </div>
    `;
  } catch (error) {
    console.error('Error loading technical skills:', error);
  }
})();

// Education - education.csv
(async function() {
  const container = document.querySelector('#education-container');
  if (!container) return;

  try {
    const schools = parseCSVObjects(await fetchCSV('education.csv'));

    const educationHtml = schools.map(school => {
      const additional = school.additional ? school.additional.split('|').map(a => `<p style="color: var(--text-muted); font-size: 13px; margin-top: 4px;">${escapeHtml(a)}</p>`).join('') : '';
      return `
        <div style="text-align: center; padding: 20px;">
          <h4 style="color: var(--navy); font-size: 18px; margin-bottom: 8px;">${escapeHtml(school.institution)}</h4>
          <p style="color: var(--accent); font-weight: 600;">${escapeHtml(school.degree)}</p>
          <p style="color: var(--text-muted); font-size: 14px; margin-top: 8px;">${escapeHtml(school.field)}</p>
          ${school.honors ? `<p style="color: var(--text-muted); font-size: 13px; margin-top: 8px;">${escapeHtml(school.honors)}</p>` : ''}
          ${additional}
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="card">
        <h3 style="text-align: center; margin-bottom: 20px;">Education</h3>
        <div class="grid cols-3" style="margin-top: 24px;">${educationHtml}</div>
      </div>
    `;
  } catch (error) {
    console.error('Error loading education:', error);
  }
})();

// ============================================================================
// Contact
// ============================================================================
loadSectionHeader('contact', 'contact-header');

// Contact info - contact_info.csv
(async function() {
  const container = document.querySelector('#contact-info-container');
  if (!container) return;

  try {
    const items = parseCSVObjects(await fetchCSV('contact_info.csv'));

    container.innerHTML = '';
    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.description)}</p>
        <p style="margin-top: 16px;"><strong>${escapeHtml(item.email_label)}:</strong> ${escapeHtml(item.email)}</p>
        ${item.office ? `<p><strong>Office:</strong> ${escapeHtml(item.office)}</p>` : ''}
        <p style="margin-top: 16px; color: var(--text-muted); font-size: 14px;">${escapeHtml(item.note)}</p>
      `;
      container.appendChild(card);
    });
  } catch (error) {
    console.error('Error loading contact info:', error);
  }
})();

// Professional profiles - professional_profiles.csv
(async function() {
  const container = document.querySelector('#professional-profiles-container');
  if (!container) return;

  try {
    const profiles = parseCSVObjects(await fetchCSV('professional_profiles.csv'));

    const profilesHtml = profiles.map(p =>
      `<a href="${sanitizeUrl(p.url)}" target="_blank" class="btn secondary" rel="noopener noreferrer">${escapeHtml(p.name)}</a>`
    ).join('');

    container.innerHTML = `
      <h3 style="text-align: center; margin-bottom: 24px;">Professional Profiles</h3>
      <div class="cta" style="justify-content: center;">${profilesHtml}</div>
    `;
  } catch (error) {
    console.error('Error loading professional profiles:', error);
  }
})();
