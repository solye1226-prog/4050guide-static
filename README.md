# 4050guide Static Site

Static export of 4050guide.co.kr for Cloudflare Pages deployment.

## Search

`assets/search.js` searches the generated post index in the browser. The three
topic search pages show site guides and saved official records separately; they
do not call a live public API. No API keys are shipped to the browser.

After publishing or changing posts, regenerate the index with
`node scripts/build-search.cjs`, then run `node scripts/test-search.cjs`.
Both maintenance scripts require Playwright in Node's module search path.
Set `TEST_ORIGIN=https://4050guide.co.kr` to run the same tests against production.
Screenshots are saved outside this checkout.

The root `404.html` enables Cloudflare Pages' normal 404 behavior instead of its
default single-page-app fallback. Keep this file when deploying the static site.

## October 2026 Guide Refresh

The ten researched guide revisions are in `scripts/guide-refresh-data.cjs`.
Their official references and check date are included in each article. Review
the sources and dates before reusing `scripts/refresh-guides.cjs`; it replaces
these articles' bodies while retaining existing images and surrounding layout.
It does not fabricate original publication dates.

`node scripts/test-refreshed-guides.cjs` checks all ten pages at desktop and
390px/320px widths, including key facts, visible FAQs, images, related links,
canonical URLs, article schema, sidebar placement, and generated search entries.
`TEST_ORIGIN` enables the same production checks.

`scripts/sync-guide-link-titles.cjs` updates matching link labels from the
current HEAD titles before committing an editorial revision. It does not
change link destinations or unrelated article content.
