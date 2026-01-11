/**
 * Mac Apps Search - Main Application Logic
 */

(function() {
  // State
  let allApps = [];
  let fuse = null;
  let currentFilter = 'all';
  let currentQuery = '';

  // DOM Elements
  const searchInput = document.getElementById('search-input');
  const resultsContainer = document.getElementById('results');
  const loadingEl = document.getElementById('loading');
  const emptyStateEl = document.getElementById('empty-state');
  const resultsCountEl = document.getElementById('results-count');
  const totalCountEl = document.getElementById('total-count');
  const filterButtons = document.querySelectorAll('.filter-btn');

  // Fuse.js configuration for fuzzy search
  const fuseOptions = {
    keys: [
      { name: 'name', weight: 0.7 },
      { name: 'description', weight: 0.3 }
    ],
    threshold: 0.4,
    ignoreLocation: true,
    minMatchCharLength: 2
  };

  // Initialize
  async function init() {
    try {
      const response = await fetch('data/apps.json');
      const data = await response.json();
      allApps = data.apps;
      fuse = new Fuse(allApps, fuseOptions);

      totalCountEl.textContent = allApps.length;
      loadingEl.classList.add('hidden');

      render(allApps);
      setupEventListeners();
    } catch (error) {
      console.error('Failed to load apps:', error);
      loadingEl.textContent = 'Failed to load apps. Please refresh the page.';
    }
  }

  // Setup event listeners
  function setupEventListeners() {
    // Search input with debounce
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        currentQuery = e.target.value.trim();
        updateResults();
      }, 150);
    });

    // Filter buttons
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        currentFilter = btn.dataset.filter;
        updateFilterButtonStyles();
        updateResults();
      });
    });

    // Keyboard shortcut: focus search on '/'
    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement !== searchInput) {
        e.preventDefault();
        searchInput.focus();
      }
      if (e.key === 'Escape') {
        searchInput.blur();
      }
    });
  }

  // Update filter button styles
  function updateFilterButtonStyles() {
    filterButtons.forEach(btn => {
      if (btn.dataset.filter === currentFilter) {
        btn.className = 'filter-btn px-4 py-2 rounded-lg font-medium transition-colors bg-blue-600 text-white';
      } else {
        btn.className = 'filter-btn px-4 py-2 rounded-lg font-medium transition-colors bg-gray-200 text-gray-700 hover:bg-gray-300';
      }
    });
  }

  // Filter and search apps
  function getFilteredApps() {
    let results = allApps;

    // Apply pricing filter
    if (currentFilter !== 'all') {
      results = results.filter(app => app.pricing === currentFilter);
    }

    // Apply search query
    if (currentQuery.length >= 2) {
      const searchResults = fuse.search(currentQuery);
      const searchIds = new Set(searchResults.map(r => r.item.id));
      results = results.filter(app => searchIds.has(app.id));

      // Sort by search relevance
      const idToIndex = new Map(searchResults.map((r, i) => [r.item.id, i]));
      results.sort((a, b) => (idToIndex.get(a.id) ?? 999) - (idToIndex.get(b.id) ?? 999));
    }

    return results;
  }

  // Update results display
  function updateResults() {
    const results = getFilteredApps();
    render(results);
  }

  // Render app cards
  function render(apps) {
    // Update count
    resultsCountEl.textContent = `Showing ${apps.length} app${apps.length !== 1 ? 's' : ''}`;

    // Handle empty state
    if (apps.length === 0) {
      resultsContainer.innerHTML = '';
      emptyStateEl.classList.remove('hidden');
      return;
    }

    emptyStateEl.classList.add('hidden');

    // Render cards (limit to 100 for performance)
    const displayApps = apps.slice(0, 100);
    const hasMore = apps.length > 100;

    resultsContainer.innerHTML = displayApps.map(app => createAppCard(app)).join('') +
      (hasMore ? `<p class="text-center text-gray-500 py-4">Showing first 100 results. Refine your search to see more.</p>` : '');
  }

  // Create HTML for a single app card
  function createAppCard(app) {
    const pricingBadge = app.pricing === 'free'
      ? '<span class="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded">FREE</span>'
      : '<span class="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded border border-gray-300">PAID</span>';

    const ossBadge = app.isOpenSource
      ? `<a href="${escapeHtml(app.repoUrl || app.url)}" target="_blank" rel="noopener" class="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded hover:bg-blue-200">OSS</a>`
      : '';

    const appStoreBadge = app.isAppStore
      ? `<a href="${escapeHtml(app.appStoreUrl || '#')}" target="_blank" rel="noopener" class="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 rounded hover:bg-purple-200">App Store</a>`
      : '';

    return `
      <article class="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap mb-1">
              <a href="${escapeHtml(app.url)}"
                 target="_blank"
                 rel="noopener noreferrer"
                 class="font-semibold text-gray-900 hover:text-blue-600 truncate">
                ${escapeHtml(app.name)}
              </a>
              ${pricingBadge}
              ${ossBadge}
              ${appStoreBadge}
            </div>
            <p class="text-sm text-gray-500 mb-2">${escapeHtml(app.category)}${app.subcategory !== app.category ? ' > ' + escapeHtml(app.subcategory) : ''}</p>
            <p class="text-gray-600 text-sm line-clamp-2">${escapeHtml(app.description)}</p>
          </div>
        </div>
      </article>
    `;
  }

  // Escape HTML to prevent XSS
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Start app
  init();
})();
