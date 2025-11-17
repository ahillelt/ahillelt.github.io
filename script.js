    // ============================================================================
    // SECURITY: HTML Escaping Function (Prevent XSS)
    // ============================================================================
    function escapeHtml(text) {
      if (text === null || text === undefined) return '';
      const div = document.createElement('div');
      div.textContent = String(text);
      return div.innerHTML;
    }

    // ============================================================================
    // PERFORMANCE: DOM Element Cache
    // ============================================================================
    const DOM_CACHE = {
      year: null,
      mainNav: null,
      sections: null,
      navLinks: null,
      historyContainer: null,
      detailsContainer: null,
      init() {
        this.year = document.getElementById('year');
        this.mainNav = document.getElementById('mainNav');
        this.sections = document.querySelectorAll('section[id]');
        this.navLinks = document.querySelectorAll('#mainNav a[href^="#"]');
      }
    };

    // Year
    document.addEventListener('DOMContentLoaded', () => {
      DOM_CACHE.init();
      if (DOM_CACHE.year) {
        DOM_CACHE.year.textContent = new Date().getFullYear();
      }
    });

    // Mobile menu
    function toggleMenu() {
      const nav = document.getElementById('mainNav');
      nav.classList.toggle('active');
    }

    // Year switching
    // Filter switching
    function filterPublications(event, category) {
      document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.remove('active');
      });
      event.target.classList.add('active');

      document.querySelectorAll('.publication').forEach(pub => {
        if (category === 'all' || pub.dataset.category === category) {
          pub.classList.add('active');
          pub.style.display = 'block';
        } else {
          pub.classList.remove('active');
          pub.style.display = 'none';
        }
      });
    }

    // ============================================================================
    // PERFORMANCE: Event Delegation for Smooth Scroll (prevents memory leaks)
    // ============================================================================
    document.addEventListener('click', function (e) {
      const anchor = e.target.closest('a[href^="#"]');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (href !== '#') {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          // Remove active from all nav links immediately
          document.querySelectorAll('#mainNav a').forEach(link => {
            link.classList.remove('active');
          });

          // Add active to clicked link and ARIA current
          anchor.classList.add('active');
          anchor.setAttribute('aria-current', 'page');

          // Scroll to target
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });

          // ACCESSIBILITY: Set focus to target for screen readers
          target.setAttribute('tabindex', '-1');
          target.focus({ preventScroll: true });

          // Close mobile menu
          const nav = document.getElementById('mainNav');
          if (nav) nav.classList.remove('active');
        }
      }
    });

    // ============================================================================
    // PERFORMANCE: Intersection Observer with proper cleanup
    // ============================================================================
    (function() {
      const elementsToObserve = document.querySelectorAll('.card, .course-card, .publication, .stat-card');
      let observedCount = 0;
      const totalElements = elementsToObserve.length;

      if (totalElements === 0) return; // No elements to observe

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
            observer.unobserve(entry.target);
            observedCount++;

            // MEMORY: Disconnect observer when all elements are observed
            if (observedCount === totalElements) {
              observer.disconnect();
            }
          }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

      elementsToObserve.forEach(el => observer.observe(el));
    })();

    // ============================================================================
    // Active navigation highlighting based on scroll position
    // ============================================================================
    const SCROLL_OFFSET = 150; // Offset for determining active section
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('#mainNav a[href^="#"]');

    function highlightNavigation() {
      const scrollPosition = window.scrollY + SCROLL_OFFSET;

      // Find the current section
      let currentSection = null;
      let maxVisible = 0;

      sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionBottom = sectionTop + sectionHeight;

        // Check how much of the section is visible
        if (scrollPosition >= sectionTop - 200 && scrollPosition < sectionBottom) {
          const visible = Math.min(scrollPosition + window.innerHeight, sectionBottom) - Math.max(scrollPosition, sectionTop);
          if (visible > maxVisible) {
            maxVisible = visible;
            currentSection = section.getAttribute('id');
          }
        }
      });

      // Update active states
      navLinks.forEach(link => {
        const href = link.getAttribute('href').substring(1);
        if (href === currentSection) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
    }

    // Throttled scroll listener
    let scrollTicking = false;
    window.addEventListener('scroll', () => {
      if (!scrollTicking) {
        window.requestAnimationFrame(() => {
          highlightNavigation();
          scrollTicking = false;
        });
        scrollTicking = true;
      }
    }, { passive: true }); // PERFORMANCE: Passive listener for better scroll performance

    // Initial highlight on load
    window.addEventListener('load', highlightNavigation);

    // Load and render courses from CSV
    // UX: Show loading state
    function showCourseLoading() {
      const loadingHtml = `
        <div style="padding: 60px; text-align: center;">
          <div class="loading-spinner"></div>
          <p style="margin-top: 16px; color: var(--text-muted); font-weight: 500;">Loading courses...</p>
        </div>
      `;
      const historyContainer = document.querySelector('#history-container');
      const detailsContainer = document.querySelector('#details-container');
      if (historyContainer) historyContainer.innerHTML = loadingHtml;
      if (detailsContainer) detailsContainer.innerHTML = loadingHtml;
    }

    async function loadCourses() {
      // Show loading state
      showCourseLoading();

      try {
        // Load both CSV files
        const [historyResponse, catalogResponse] = await Promise.all([
          fetch('courses_history.csv', { cache: 'no-store' }),
          fetch('courses_catalog.csv', { cache: 'no-store' })
        ]);

        // Check for HTTP errors
        if (!historyResponse.ok || !catalogResponse.ok) {
          throw new Error('Failed to load course data files');
        }

        const historyText = await historyResponse.text();
        const catalogText = await catalogResponse.text();

        const courseHistory = parseCSV(historyText);
        const courseCatalog = parseCSV(catalogText);

        renderCourses(courseHistory, courseCatalog);
      } catch (error) {
        console.error('Error loading courses:', error);
        showCourseLoadError(error.message);
      }
    }

    function showCourseLoadError(message) {
      const errorHtml = `
        <div style="padding: 40px; text-align: center; background: var(--bg-tertiary); border-radius: 12px; border: 2px dashed var(--border);">
          <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
          <h3 style="color: var(--text); margin-bottom: 12px;">Unable to Load Course Data</h3>
          <p style="color: var(--text-muted); margin-bottom: 24px;">${message || 'An error occurred while loading the course information.'}</p>
          <button onclick="loadCourses()" style="padding: 10px 20px; background: var(--accent); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px;">
            Try Again
          </button>
        </div>
      `;

      const historyContainer = document.querySelector('#history-container');
      const detailsContainer = document.querySelector('#details-container');

      if (historyContainer) historyContainer.innerHTML = errorHtml;
      if (detailsContainer) detailsContainer.innerHTML = errorHtml;
    }

    function parseCSV(csvText) {
      const lines = csvText.trim().split('\n');
      const headers = lines[0].split(',');
      const courses = [];

      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const course = {};
        headers.forEach((header, index) => {
          course[header] = values[index] || '';
        });
        courses.push(course);
      }

      return courses;
    }

    function parseCSVLine(line) {
      const result = [];
      let current = '';
      let insideQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
          // Check for escaped quote (two consecutive quotes)
          if (insideQuotes && nextChar === '"') {
            current += '"';
            i++; // Skip the next quote
          } else {
            insideQuotes = !insideQuotes;
          }
        } else if (char === ',' && !insideQuotes) {
          result.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current);
      return result;
    }

    // Switch between views
    function switchView(view, event) {
      // Update tab states
      document.querySelectorAll('.view-tab').forEach(tab => {
        tab.classList.remove('active');
        tab.setAttribute('aria-pressed', 'false');
      });

      // Update content visibility
      document.querySelectorAll('.view-content').forEach(content => {
        content.classList.remove('active');
      });

      document.querySelector(`#view-${view}`).classList.add('active');

      if (event && event.target) {
        event.target.classList.add('active');
        event.target.setAttribute('aria-pressed', 'true');
      }
    }

    function renderCourses(courseHistory, courseCatalog) {
      const years = [...new Set(courseHistory.map(c => c.year))].sort((a, b) => b - a);

      // Render Course History View (simple table)
      renderHistoryView(courseHistory);

      // Render Course Details View (unique courses only)
      renderDetailsView(courseCatalog);
    }

    function renderHistoryView(courses) {
      const container = document.querySelector('#history-container');
      let html = '<table class="course-table"><thead><tr>';
      html += '<th>Year</th><th>Semester</th><th>Course Title</th><th>Enrollment</th><th>Role</th>';
      html += '</tr></thead><tbody>';

      courses.forEach(course => {
        const enrollment = course.enrollment || 'TBD';
        const role = course.role || 'Instructor';
        // SECURITY: Escape all CSV data to prevent XSS
        html += `<tr>
          <td>${escapeHtml(course.year)}</td>
          <td>${escapeHtml(course.semester)}</td>
          <td><strong>${escapeHtml(course.course_title)}</strong></td>
          <td class="enrollment-cell">${escapeHtml(enrollment)}</td>
          <td>${escapeHtml(role)}</td>
        </tr>`;
      });

      html += '</tbody></table>';

      // Add aggregated stats by role
      const facultyEnrollment = courses.reduce((sum, c) => {
        if (c.role === 'Faculty') {
          const match = c.enrollment ? c.enrollment.match(/~?(\d+)/) : null;
          return sum + (match ? parseInt(match[1]) : 0);
        }
        return sum;
      }, 0);

      const taEnrollment = courses.reduce((sum, c) => {
        if (c.role && c.role.includes('TA')) {
          const match = c.enrollment ? c.enrollment.match(/~?(\d+)/) : null;
          return sum + (match ? parseInt(match[1]) : 0);
        }
        return sum;
      }, 0);

      const totalEnrollment = facultyEnrollment + taEnrollment;

      html += `<div style="margin-top: 24px; padding: 20px; background: var(--bg-tertiary); border-radius: 12px;">
        <h3 style="color: var(--navy); margin-bottom: 16px;">Teaching Summary</h3>
        <p><strong>Total Students Taught:</strong> ~${totalEnrollment} students across all courses</p>
        <p style="margin-top: 8px;"><strong>As Faculty:</strong> ~${facultyEnrollment} students</p>
        <p style="margin-top: 8px;"><strong>As TA/CA:</strong> ~${taEnrollment} students</p>
        <p style="margin-top: 12px;"><strong>Primary Courses:</strong> Application Security (CS-GY 9163), Computer Networking (CS-GY 6843), AI Governance (CS-GY 9215), Cyber Resiliency Management (CS-GY 9215), ISSEM (CS-GY 6803)</p>
      </div>`;

      container.innerHTML = html;
    }

    function renderDetailsView(courses) {
      const container = document.querySelector('#details-container');

      // Hide year tabs since we're showing unique courses only
      const yearTabsContainer = document.querySelector('#view-details .year-tabs');
      yearTabsContainer.style.display = 'none';

      // Render unique courses
      container.innerHTML = '';
      courses.forEach(course => {
        const card = document.createElement('div');
        card.className = 'course-card';

        const badges = course.badges ? course.badges.split('|').filter(b => b) : [];
        const keyTopics = course.key_topics ? course.key_topics.split('|').filter(t => t) : [];

        // SECURITY: Escape all CSV data to prevent XSS
        card.innerHTML = `
          <div class="course-header">
            <div>
              <div class="course-code">${escapeHtml(course.course_code)}</div>
              <h3>${escapeHtml(course.course_title)}</h3>
            </div>
          </div>
          <div class="badges">
            ${badges.map(badge => {
              const className = badge.toLowerCase().replace(/[^a-z]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
              return `<span class="badge ${escapeHtml(className)}">${escapeHtml(badge)}</span>`;
            }).join('\n            ')}
          </div>
          ${course.description ? `<p>${escapeHtml(course.description)}</p>` : ''}
          ${keyTopics.length > 0 ? `
          <h4>Key Topics</h4>
          <ul>
            ${keyTopics.map(topic => `<li>${escapeHtml(topic)}</li>`).join('\n            ')}
          </ul>
          ` : ''}
        `;

        container.appendChild(card);
      });
    }

    // Load courses on page load
    window.addEventListener('load', loadCourses);

    // ===== DRAG-AND-DROP NAVIGATION REORDERING =====
    (function() {
      const nav = document.getElementById('mainNav');
      const main = document.querySelector('main');
      let draggedElement = null;
      let draggedOverElement = null;

      // Use shared utilities to avoid code duplication
      const sectionMap = window.__portfolioUtils.sectionMap;
      const setCookie = window.__portfolioUtils.setCookie;
      const getCookie = window.__portfolioUtils.getCookie;

      // Load saved order from localStorage AND cookies
      function loadSavedOrder(isInitialLoad = false) {
        // Use pre-loaded order from inline script if available
        let order = window.__initialNavOrder;

        if (!order) {
          let savedOrder = localStorage.getItem('navOrder');
          if (!savedOrder) {
            savedOrder = getCookie('navOrder');
          }

          if (savedOrder) {
            try {
              order = JSON.parse(savedOrder);
            } catch (e) {
              console.error('Failed to load saved nav order:', e);
              return;
            }
          }
        }

        if (order) {
          reorderNav(order);
          reorderSections(order, isInitialLoad);
        }
      }

      // Save order to BOTH localStorage AND cookies
      function saveOrder() {
        const navItems = Array.from(nav.querySelectorAll('a'));
        const order = navItems.map(a => a.getAttribute('href'));
        const orderJSON = JSON.stringify(order);

        // Save to localStorage with error handling
        try {
          localStorage.setItem('navOrder', orderJSON);
        } catch (e) {
          // QuotaExceededError or localStorage disabled
          console.warn('Failed to save to localStorage:', e.message);
        }

        // Always save to cookie as fallback
        try {
          setCookie('navOrder', orderJSON);
        } catch (e) {
          console.error('Failed to save layout:', e);
        }
      }

      // Reorder navigation items (preserving non-link elements)
      function reorderNav(order) {
        const navItems = Array.from(nav.querySelectorAll('a'));
        const itemMap = {};
        navItems.forEach(item => {
          itemMap[item.getAttribute('href')] = item;
        });

        // Save references to elements we need to preserve
        const dropIndicator = document.getElementById('dropIndicator');
        const layoutControls = nav.querySelector('.layout-controls');

        // Remove all anchor tags (but keep other elements)
        navItems.forEach(item => item.remove());

        // Re-insert anchor tags in new order
        const firstNonLink = dropIndicator || layoutControls;
        order.forEach(href => {
          if (itemMap[href]) {
            if (firstNonLink) {
              nav.insertBefore(itemMap[href], firstNonLink);
            } else {
              nav.appendChild(itemMap[href]);
            }
          }
        });
      }

      // Reorder sections to match navigation order
      function reorderSections(order, isInitialLoad = false) {
        const sections = {};

        // Collect all sections
        Object.values(sectionMap).forEach(id => {
          const section = document.getElementById(id);
          if (section) {
            sections[id] = section;
          }
        });

        if (isInitialLoad) {
          // On initial load: no animations, instant reorder
          Object.values(sections).forEach(section => {
            section.classList.add('no-transition');
          });

          order.forEach(href => {
            const sectionId = sectionMap[href];
            if (sections[sectionId]) {
              main.appendChild(sections[sectionId]);
            }
          });

          // Remove no-transition class after DOM update
          requestAnimationFrame(() => {
            Object.values(sections).forEach(section => {
              section.classList.remove('no-transition');
            });
          });
        } else {
          // During drag-and-drop: instant reordering
          order.forEach(href => {
            const sectionId = sectionMap[href];
            if (sections[sectionId]) {
              main.appendChild(sections[sectionId]);
            }
          });

          // Reset save button state when layout changes
          resetSaveButtonState();
        }
      }

      // Helper to reset save button to allow re-saving
      function resetSaveButtonState() {
        const saveBtn = document.querySelector('.layout-controls-floating .save-btn');
        if (saveBtn && saveBtn.classList.contains('saved')) {
          saveBtn.classList.remove('saved');
          // Restore original text with icon
          saveBtn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
              <polyline points="17 21 17 13 7 13 7 21"></polyline>
              <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
            Save Layout
          `;
        }
      }

      // Drop indicator helpers
      const dropIndicator = document.getElementById('dropIndicator');

      function showDropIndicator(targetElement, draggedElement) {
        if (!dropIndicator || !targetElement || targetElement === draggedElement) return;

        const allItems = Array.from(nav.querySelectorAll('a'));
        const draggedIndex = allItems.indexOf(draggedElement);
        const targetIndex = allItems.indexOf(targetElement);

        // Check if nav is vertical (flex-direction: column)
        const navStyle = window.getComputedStyle(nav);
        const isVertical = navStyle.flexDirection === 'column';

        if (isVertical) {
          // Vertical nav: horizontal indicator between items
          let top;
          if (draggedIndex < targetIndex) {
            // Dragging down: show indicator below target
            top = targetElement.offsetTop + targetElement.offsetHeight + 2;
          } else {
            // Dragging up: show indicator above target
            top = targetElement.offsetTop - 2;
          }
          dropIndicator.style.top = top + 'px';
          // CSS handles left positioning for vertical nav (10% left, 80% width)
        } else {
          // Horizontal nav: vertical indicator between items
          let left;
          if (draggedIndex < targetIndex) {
            // Dragging forward: show indicator on right side of target
            left = targetElement.offsetLeft + targetElement.offsetWidth + 1;
          } else {
            // Dragging backward: show indicator on left side of target
            left = targetElement.offsetLeft - 1.5;
          }
          dropIndicator.style.left = left + 'px';
          dropIndicator.style.top = '50%';
        }

        dropIndicator.classList.add('show');
      }

      function hideDropIndicator() {
        if (dropIndicator) {
          dropIndicator.classList.remove('show');
        }
      }

      // Initialize drag and drop for each nav item
      function initDragAndDrop() {
        const navItems = nav.querySelectorAll('a');

        navItems.forEach(item => {
          item.setAttribute('draggable', 'true');

          // Drag start
          item.addEventListener('dragstart', (e) => {
            draggedElement = item;
            item.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', item.innerHTML);
          });

          // Drag end
          item.addEventListener('dragend', (e) => {
            item.classList.remove('dragging');

            // Remove drag-over class from all items
            navItems.forEach(navItem => {
              navItem.classList.remove('drag-over');
            });

            // Hide drop indicator
            hideDropIndicator();

            draggedElement = null;
            draggedOverElement = null;
          });

          // Drag over
          item.addEventListener('dragover', (e) => {
            if (e.preventDefault) {
              e.preventDefault();
            }
            e.dataTransfer.dropEffect = 'move';

            if (item !== draggedElement) {
              draggedOverElement = item;
              item.classList.add('drag-over');
              showDropIndicator(item, draggedElement);
            }

            return false;
          });

          // Drag enter
          item.addEventListener('dragenter', (e) => {
            if (item !== draggedElement) {
              item.classList.add('drag-over');
              showDropIndicator(item, draggedElement);
            }
          });

          // Drag leave
          item.addEventListener('dragleave', (e) => {
            item.classList.remove('drag-over');
          });

          // Drop
          item.addEventListener('drop', (e) => {
            if (e.stopPropagation) {
              e.stopPropagation();
            }

            e.preventDefault();

            if (draggedElement && draggedElement !== item) {
              // Swap positions
              const allItems = Array.from(nav.querySelectorAll('a'));
              const draggedIndex = allItems.indexOf(draggedElement);
              const targetIndex = allItems.indexOf(item);

              if (draggedIndex < targetIndex) {
                nav.insertBefore(draggedElement, item.nextSibling);
              } else {
                nav.insertBefore(draggedElement, item);
              }

              // Get new order and reorder sections
              const newOrder = Array.from(nav.querySelectorAll('a')).map(a => a.getAttribute('href'));
              reorderSections(newOrder);
              saveOrder();
            }

            item.classList.remove('drag-over');
            return false;
          });

          // Touch events for mobile support
          let touchStartY = 0;
          let touchCurrentElement = null;

          item.addEventListener('touchstart', (e) => {
            draggedElement = item;
            item.classList.add('dragging');
            touchStartY = e.touches[0].clientY;
            touchCurrentElement = item;
            // Prevent scrolling while dragging
            e.preventDefault();
          }, { passive: false });

          item.addEventListener('touchmove', (e) => {
            if (!draggedElement) return;

            e.preventDefault();
            const touch = e.touches[0];
            const elementAtPoint = document.elementFromPoint(touch.clientX, touch.clientY);

            // Find the closest nav item
            const targetNavItem = elementAtPoint?.closest('#mainNav a');

            if (targetNavItem && targetNavItem !== draggedElement) {
              draggedOverElement = targetNavItem;

              // Remove drag-over from all items
              navItems.forEach(navItem => {
                navItem.classList.remove('drag-over');
              });

              targetNavItem.classList.add('drag-over');
              showDropIndicator(targetNavItem, draggedElement);
              touchCurrentElement = targetNavItem;
            }
          }, { passive: false });

          item.addEventListener('touchend', (e) => {
            if (!draggedElement) return;

            item.classList.remove('dragging');

            // Remove drag-over from all items
            navItems.forEach(navItem => {
              navItem.classList.remove('drag-over');
            });

            hideDropIndicator();

            if (touchCurrentElement && touchCurrentElement !== draggedElement) {
              // Perform the swap
              const allItems = Array.from(nav.querySelectorAll('a'));
              const draggedIndex = allItems.indexOf(draggedElement);
              const targetIndex = allItems.indexOf(touchCurrentElement);

              if (draggedIndex < targetIndex) {
                nav.insertBefore(draggedElement, touchCurrentElement.nextSibling);
              } else {
                nav.insertBefore(draggedElement, touchCurrentElement);
              }

              // Get new order and reorder sections
              const newOrder = Array.from(nav.querySelectorAll('a')).map(a => a.getAttribute('href'));
              reorderSections(newOrder);
              saveOrder();
            }

            draggedElement = null;
            draggedOverElement = null;
            touchCurrentElement = null;
          });
        });
      }

      // Initialize ASAP using DOMContentLoaded (doesn't wait for images)
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDragAndDrop);
      } else {
        // DOM already loaded
        initDragAndDrop();
      }

      // Make functions globally accessible for button onclick handlers
      window.navReorderModule = {
        saveOrder,
        loadSavedOrder,
        reorderSections,
        getCookie,
        setCookie
      };
    })();

    // Global functions for Save/Reset buttons
    function saveLayout(event) {
      const btn = event.target.closest('button'); // Handle clicks on SVG or button

      // Save the layout
      window.navReorderModule.saveOrder();

      // Instant visual feedback - show checkmark
      btn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        Saved!
      `;
      btn.classList.add('saved');

      // Reset button after 2 seconds
      setTimeout(() => {
        if (btn.classList.contains('saved')) {
          btn.classList.remove('saved');
          btn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
              <polyline points="17 21 17 13 7 13 7 21"></polyline>
              <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
            Save Layout
          `;
        }
      }, 2000);
    }

    function resetLayout(event) {
      const btn = event.target;

      // Clear saved data
      localStorage.removeItem('navOrder');
      document.cookie = 'navOrder=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

      // Instant reload
      location.reload();
    }

    // ============================================================================
    // RESPONSIVE CARD ALIGNMENT
    // Dynamically aligns card elements in grid layouts based on actual rendering
    // ============================================================================
    (function() {
      function alignGridCards() {
        // Find all grid containers
        const grids = document.querySelectorAll('.grid.cols-2, .grid.cols-3');

        grids.forEach(grid => {
          const cards = Array.from(grid.querySelectorAll('.card'));
          if (cards.length === 0) return;

          // Reset all min-heights first
          cards.forEach(card => {
            const h3 = card.querySelector('h3');
            const accentP = card.querySelector('p[style*="color: var(--accent)"]');
            const h4 = card.querySelector('h4');
            const descriptions = card.querySelectorAll('p');

            if (h3) h3.style.minHeight = '';
            if (accentP) accentP.style.minHeight = '';
            if (h4) h4.style.minHeight = '';
            descriptions.forEach(p => {
              if (p !== accentP && p.parentElement === card) {
                p.style.minHeight = '';
              }
            });
          });

          // Group cards by row based on offsetTop
          const rows = [];
          let currentRow = [];
          let lastTop = -1;

          cards.forEach(card => {
            const top = card.offsetTop;
            if (lastTop === -1 || Math.abs(top - lastTop) < 10) {
              currentRow.push(card);
              lastTop = top;
            } else {
              if (currentRow.length > 0) rows.push(currentRow);
              currentRow = [card];
              lastTop = top;
            }
          });
          if (currentRow.length > 0) rows.push(currentRow);

          // Align each row
          rows.forEach(row => {
            if (row.length <= 1) return; // No alignment needed for single card

            let maxH3Height = 0;
            let maxAccentPHeight = 0;
            let maxH4Height = 0;
            let maxDescHeight = 0;

            // Measure heights
            row.forEach(card => {
              const h3 = card.querySelector('h3');
              const accentP = card.querySelector('p[style*="color: var(--accent)"]');
              const h4 = card.querySelector('h4');

              if (h3) maxH3Height = Math.max(maxH3Height, h3.offsetHeight);
              if (accentP) maxAccentPHeight = Math.max(maxAccentPHeight, accentP.offsetHeight);
              if (h4) maxH4Height = Math.max(maxH4Height, h4.offsetHeight);

              // Find description paragraph - the one immediately before h4
              if (h4) {
                let descP = h4.previousElementSibling;
                // Walk backwards to find the first paragraph before h4
                while (descP && descP.tagName !== 'P') {
                  descP = descP.previousElementSibling;
                }
                // Make sure it's not the accent paragraph
                if (descP && descP.tagName === 'P' && !descP.style.color) {
                  maxDescHeight = Math.max(maxDescHeight, descP.offsetHeight);
                }
              }
            });

            // Apply min-heights to align
            row.forEach(card => {
              const h3 = card.querySelector('h3');
              const accentP = card.querySelector('p[style*="color: var(--accent)"]');
              const h4 = card.querySelector('h4');

              if (h3 && maxH3Height > 0) h3.style.minHeight = maxH3Height + 'px';
              if (accentP && maxAccentPHeight > 0) accentP.style.minHeight = maxAccentPHeight + 'px';
              if (h4 && maxH4Height > 0) h4.style.minHeight = maxH4Height + 'px';

              // Apply to description paragraph - the one immediately before h4
              if (h4 && maxDescHeight > 0) {
                let descP = h4.previousElementSibling;
                // Walk backwards to find the first paragraph before h4
                while (descP && descP.tagName !== 'P') {
                  descP = descP.previousElementSibling;
                }
                // Make sure it's not the accent paragraph
                if (descP && descP.tagName === 'P' && !descP.style.color) {
                  descP.style.minHeight = maxDescHeight + 'px';
                }
              }
            });
          });
        });
      }

      // Debounce function for events
      let alignTimer;
      function debounceAlign() {
        clearTimeout(alignTimer);
        alignTimer = setTimeout(alignGridCards, 50);
      }

      // Event-based triggers
      window.addEventListener('resize', debounceAlign);
      window.addEventListener('load', alignGridCards);

      // Re-align when fonts load
      if (document.fonts) {
        document.fonts.ready.then(alignGridCards);
      }

      // MutationObserver to detect when content is added to grids
      const gridObserver = new MutationObserver((mutations) => {
        let shouldAlign = false;
        mutations.forEach(mutation => {
          if (mutation.addedNodes.length > 0) {
            mutation.addedNodes.forEach(node => {
              if (node.nodeType === 1) { // Element node
                if (node.classList && node.classList.contains('card')) {
                  shouldAlign = true;
                }
                // Check if any child is a card
                if (node.querySelector && node.querySelector('.card')) {
                  shouldAlign = true;
                }
              }
            });
          }
        });
        if (shouldAlign) {
          debounceAlign();
        }
      });

      // Observe all grid containers
      document.addEventListener('DOMContentLoaded', () => {
        const grids = document.querySelectorAll('.grid.cols-2, .grid.cols-3');
        grids.forEach(grid => {
          gridObserver.observe(grid, {
            childList: true,
            subtree: true
          });
        });

        // Initial alignment
        alignGridCards();
      });

      // If DOM already loaded
      if (document.readyState !== 'loading') {
        const grids = document.querySelectorAll('.grid.cols-2, .grid.cols-3');
        grids.forEach(grid => {
          gridObserver.observe(grid, {
            childList: true,
            subtree: true
          });
        });
        alignGridCards();
      }

      // Expose function globally so CSV scripts can trigger it
      window.alignGridCards = alignGridCards;
    })();
