import type { App, AppData, PricingFilter } from './types';

interface FuseResult {
  item: App;
  refIndex: number;
}

interface FuseOptions {
  keys: Array<{ name: string; weight: number }>;
  threshold: number;
  ignoreLocation: boolean;
  minMatchCharLength: number;
}

interface FuseInstance {
  search(query: string): FuseResult[];
}

class MacAppsSearch {
  private allApps: App[] = [];
  private fuse: FuseInstance | null = null;
  private currentFilter: PricingFilter = 'all';
  private currentQuery = '';
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly searchInput: HTMLInputElement;
  private readonly resultsContainer: HTMLElement;
  private readonly loadingEl: HTMLElement;
  private readonly emptyStateEl: HTMLElement;
  private readonly resultsCountEl: HTMLElement;
  private readonly totalCountEl: HTMLElement;
  private readonly filterButtons: NodeListOf<HTMLButtonElement>;

  private readonly fuseOptions: FuseOptions = {
    keys: [
      { name: 'name', weight: 0.7 },
      { name: 'description', weight: 0.3 }
    ],
    threshold: 0.4,
    ignoreLocation: true,
    minMatchCharLength: 2
  };

  constructor() {
    this.searchInput = document.getElementById('search-input') as HTMLInputElement;
    this.resultsContainer = document.getElementById('results') as HTMLElement;
    this.loadingEl = document.getElementById('loading') as HTMLElement;
    this.emptyStateEl = document.getElementById('empty-state') as HTMLElement;
    this.resultsCountEl = document.getElementById('results-count') as HTMLElement;
    this.totalCountEl = document.getElementById('total-count') as HTMLElement;
    this.filterButtons = document.querySelectorAll('.filter-btn') as NodeListOf<HTMLButtonElement>;

    this.init();
  }

  private async init(): Promise<void> {
    try {
      const response = await fetch('data/apps.json');
      const data: AppData = await response.json();
      this.allApps = data.apps;
      this.fuse = new window.Fuse(this.allApps, this.fuseOptions) as FuseInstance;

      this.totalCountEl.textContent = String(this.allApps.length);
      this.loadingEl.classList.add('hidden');

      this.render(this.allApps);
      this.setupEventListeners();
    } catch (error) {
      console.error('Failed to load apps:', error);
      this.loadingEl.textContent = 'Failed to load apps. Please refresh the page.';
    }
  }

  private setupEventListeners(): void {
    this.searchInput.addEventListener('input', (e: Event) => {
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }
      this.debounceTimer = setTimeout(() => {
        this.currentQuery = (e.target as HTMLInputElement).value.trim();
        this.updateResults();
      }, 150);
    });

    this.filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentFilter = btn.dataset.filter as PricingFilter;
        this.updateFilterButtonStyles();
        this.updateResults();
      });
    });

    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== this.searchInput) {
        e.preventDefault();
        this.searchInput.focus();
      }
      if (e.key === 'Escape') {
        this.searchInput.blur();
      }
    });
  }

  private updateFilterButtonStyles(): void {
    this.filterButtons.forEach(btn => {
      if (btn.dataset.filter === this.currentFilter) {
        btn.className = 'filter-btn px-4 py-2 rounded-lg font-medium transition-colors bg-blue-600 text-white';
      } else {
        btn.className = 'filter-btn px-4 py-2 rounded-lg font-medium transition-colors bg-gray-200 text-gray-700 hover:bg-gray-300';
      }
    });
  }

  private getFilteredApps(): App[] {
    let results = this.allApps;

    if (this.currentFilter !== 'all') {
      results = results.filter(app => app.pricing === this.currentFilter);
    }

    if (this.currentQuery.length >= 2 && this.fuse) {
      const searchResults = this.fuse.search(this.currentQuery);
      const searchIds = new Set(searchResults.map(r => r.item.id));
      results = results.filter(app => searchIds.has(app.id));

      const idToIndex = new Map(searchResults.map((r, i) => [r.item.id, i]));
      results.sort((a, b) => (idToIndex.get(a.id) ?? 999) - (idToIndex.get(b.id) ?? 999));
    }

    return results;
  }

  private updateResults(): void {
    const results = this.getFilteredApps();
    this.render(results);
  }

  private render(apps: App[]): void {
    this.resultsCountEl.textContent = `Showing ${apps.length} app${apps.length !== 1 ? 's' : ''}`;

    if (apps.length === 0) {
      this.resultsContainer.innerHTML = '';
      this.emptyStateEl.classList.remove('hidden');
      return;
    }

    this.emptyStateEl.classList.add('hidden');

    const displayApps = apps.slice(0, 100);
    const hasMore = apps.length > 100;

    this.resultsContainer.innerHTML = displayApps.map(app => this.createAppCard(app)).join('') +
      (hasMore ? '<p class="text-center text-gray-500 py-4">Showing first 100 results. Refine your search to see more.</p>' : '');
  }

  private createAppCard(app: App): string {
    const pricingBadge = app.pricing === 'free'
      ? '<span class="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded">FREE</span>'
      : '<span class="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded border border-gray-300">PAID</span>';

    const ossBadge = app.isOpenSource
      ? `<a href="${this.escapeHtml(app.repoUrl || app.url)}" target="_blank" rel="noopener" class="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded hover:bg-blue-200">OSS</a>`
      : '';

    const appStoreBadge = app.isAppStore
      ? `<a href="${this.escapeHtml(app.appStoreUrl || '#')}" target="_blank" rel="noopener" class="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 rounded hover:bg-purple-200">App Store</a>`
      : '';

    return `
      <article class="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap mb-1">
              <a href="${this.escapeHtml(app.url)}"
                 target="_blank"
                 rel="noopener noreferrer"
                 class="font-semibold text-gray-900 hover:text-blue-600 truncate">
                ${this.escapeHtml(app.name)}
              </a>
              ${pricingBadge}
              ${ossBadge}
              ${appStoreBadge}
            </div>
            <p class="text-sm text-gray-500 mb-2">${this.escapeHtml(app.category)}${app.subcategory !== app.category ? ' > ' + this.escapeHtml(app.subcategory) : ''}</p>
            <p class="text-gray-600 text-sm line-clamp-2">${this.escapeHtml(app.description)}</p>
          </div>
        </div>
      </article>
    `;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new MacAppsSearch();
});
