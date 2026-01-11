#!/usr/bin/env node

/**
 * Parser script to extract Mac app data from awesome-mac README.md
 * Outputs structured JSON to data/apps.json
 */

const fs = require('fs');
const path = require('path');

const README_URL = 'https://raw.githubusercontent.com/jaywcjlove/awesome-mac/master/README.md';

async function fetchReadme() {
  const response = await fetch(README_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch README: ${response.status}`);
  }
  return response.text();
}

function parseApps(markdown) {
  const apps = [];
  const categories = new Set();
  const subcategories = {};

  let currentCategory = '';
  let currentSubcategory = '';
  let appId = 0;

  // Skip content before the first category (sponsors, TOC, etc.)
  const contentStart = markdown.indexOf('## Reading and Writing Tools');
  if (contentStart === -1) {
    throw new Error('Could not find start of app listings');
  }

  const lines = markdown.slice(contentStart).split('\n');

  for (const line of lines) {
    // Match category headers (## Category Name)
    const categoryMatch = line.match(/^## (.+)$/);
    if (categoryMatch) {
      currentCategory = categoryMatch[1].trim();
      // Skip non-app sections
      if (currentCategory.includes('Contributors') ||
          currentCategory.includes('License') ||
          currentCategory.includes('Acknowledgements')) {
        currentCategory = '';
        continue;
      }
      categories.add(currentCategory);
      subcategories[currentCategory] = subcategories[currentCategory] || [];
      currentSubcategory = '';
      continue;
    }

    // Match subcategory headers (### Subcategory Name)
    const subcategoryMatch = line.match(/^### (.+)$/);
    if (subcategoryMatch && currentCategory) {
      currentSubcategory = subcategoryMatch[1].trim();
      if (!subcategories[currentCategory].includes(currentSubcategory)) {
        subcategories[currentCategory].push(currentSubcategory);
      }
      continue;
    }

    // Match app entries (* [App Name](URL) - Description...)
    const appMatch = line.match(/^\*\s+\[([^\]]+)\]\(([^)]+)\)\s*-?\s*(.*)$/);
    if (appMatch && currentCategory) {
      const [, name, url, rest] = appMatch;

      // Skip entries that are just category links or badges without descriptions
      if (!rest || rest.trim().length === 0) continue;

      // Extract description (text before any badge markers)
      let description = rest
        .replace(/\[!\[.*?\]\[.*?\]\]\([^)]*\)/g, '') // Remove linked badges
        .replace(/!\[.*?\]\[.*?\]/g, '')              // Remove inline badges
        .replace(/\s+/g, ' ')                          // Normalize whitespace
        .trim();

      // Clean trailing punctuation
      description = description.replace(/[.\s]+$/, '').trim();

      // Detect badges for pricing and metadata
      const isFreeware = rest.includes('[Freeware Icon]');
      const isOpenSource = rest.includes('[OSS Icon]');
      const isAppStore = rest.includes('[app-store Icon]');

      // Extract repo URL if open source
      let repoUrl = null;
      const repoMatch = rest.match(/\[!\[Open-Source Software\]\[OSS Icon\]\]\(([^)]+)\)/);
      if (repoMatch) {
        repoUrl = repoMatch[1];
      }

      // Extract App Store URL
      let appStoreUrl = null;
      const storeMatch = rest.match(/\[!\[App Store\]\[app-store Icon\]\]\(([^)]+)\)/);
      if (storeMatch) {
        appStoreUrl = storeMatch[1];
      }

      // Determine pricing: free if has freeware or OSS badge
      const pricing = (isFreeware || isOpenSource) ? 'free' : 'paid';

      apps.push({
        id: ++appId,
        name: name.trim(),
        url: url.trim(),
        description: description || name.trim(),
        category: currentCategory,
        subcategory: currentSubcategory || currentCategory,
        pricing,
        isOpenSource,
        isAppStore,
        ...(repoUrl && { repoUrl }),
        ...(appStoreUrl && { appStoreUrl })
      });
    }
  }

  return {
    apps,
    categories: Array.from(categories),
    subcategories,
    meta: {
      totalApps: apps.length,
      freeApps: apps.filter(a => a.pricing === 'free').length,
      paidApps: apps.filter(a => a.pricing === 'paid').length,
      openSourceApps: apps.filter(a => a.isOpenSource).length,
      generatedAt: new Date().toISOString()
    }
  };
}

async function main() {
  console.log('Fetching README from awesome-mac repository...');
  const markdown = await fetchReadme();
  console.log(`Fetched ${markdown.length} characters`);

  console.log('Parsing app data...');
  const data = parseApps(markdown);

  console.log(`\nExtraction complete:`);
  console.log(`  Total apps: ${data.meta.totalApps}`);
  console.log(`  Free apps: ${data.meta.freeApps}`);
  console.log(`  Paid apps: ${data.meta.paidApps}`);
  console.log(`  Open source: ${data.meta.openSourceApps}`);
  console.log(`  Categories: ${data.categories.length}`);

  const outputPath = path.join(__dirname, '..', 'data', 'apps.json');
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  console.log(`\nData saved to ${outputPath}`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
