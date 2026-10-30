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

## Site Quality Follow-Up

After adding articles, run `node scripts/complete-site-quality-20261019.cjs`
to deduplicate category pagination and optimize large body images, then
`node scripts/add-decision-worksheets-20261019.cjs`,
`node scripts/install-privacy-controls.cjs`, and `node scripts/build-search.cjs`.
The search builder imports saved query records and preserves their legacy
URLs with query-specific permanent redirects. Saved records are not live data.

Run `node scripts/test-site-quality-20261019.cjs` for search record counts,
category uniqueness, snapshot redirects, worksheets, responsive images and
consent-change controls. `TEST_ORIGIN` enables production checks. The consent
API tests use controlled EU/non-EU fixtures, not a claim of live regional delivery.
The AdSense account's Google CMP message must remain published for this domain.
Do not remove the AdSense tag or the conditional footer privacy controls.

Exception: the privacy disclosure and its legacy copies intentionally have no
executable scripts, ad tags or CMP loader. They must be readable without consent.
`scripts/privacy-disclosure.cjs` enforces this exception during privacy/search
maintenance. General content pages keep the AdSense tag and consent controls.

## October 30 Content Follow-Up

`reports/duplicate-body-review-20261030.json` records all 14 candidate-pair
decisions. Three retired URLs redirect to two expanded articles; the other
11 pairs address different trades or benefit systems and remain separate.

`reports/fact-followup-result-20261030.json` records the scoped checks and
actual changes. The 219-article source/amount scan is not a sentence-by-sentence
fact-check: 72 articles received targeted source verification or additions;
144 retained articles still require detailed review. Three were merged.
Do not relabel the remaining articles as fully verified or refresh their dates
solely because a source returned HTTP 200.

The primary-page research cache stays outside the published site at
`../4050-source-evidence-20261030`. Reports and maintenance scripts carry
`X-Robots-Tag: noindex`; they are not reader articles.

Run `node scripts/test-fact-followup-20261030.cjs` for the current 216-article
index, merge redirects, sitemap exclusions, changed pages and mobile layout.
The older focus and site-quality tests also account for these explicit merges.

The shared footer lives in `scripts/footer-template.html`. After publishing or
editing trust pages, run `node scripts/sync-trust-pages-20261022.cjs`, then
`node scripts/install-privacy-controls.cjs`. The sync keeps the Korean trust pages
and their canonical legacy copies consistent. Run
`node scripts/test-trust-pages-20261022.cjs` (or with `TEST_ORIGIN`) to verify
policy access, footer links, responsive layout and absence of ad/CMP requests
on the disclosure page.
