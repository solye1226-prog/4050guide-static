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

## October 30 Remaining 144 Follow-Up

`reports/remaining-review-result-20261030.json` is the follow-up to the historical
144-item pending list above. It records a specific `checked` scope for each
article, not an automatic approval based on source availability. Core conditions,
quantitative examples and their scope were reviewed; this is not a warranty for
every sentence, attachment, local vacancy or individual eligibility decision.

Forty articles received topic-specific practical additions. One additional
article clarifies the September 2025 / March 2026 application dates for 2025
income. The other 103 retain their content and modification dates. No URLs,
original publication dates or article images were changed. The original
preliminary report remains intact as historical evidence; use the follow-up
report when identifying the coverage of this batch.

Official Q-Net, KFSI and social-work regulation PDFs were read separately from
their HTML landing pages. Public research text remains outside the published
repo in `../4050-source-evidence-20261030/official-pdfs.json`.

Run `node scripts/test-remaining-review-20261030.cjs` locally and with
`TEST_ORIGIN=https://4050guide.co.kr`. It checks all 144 target URLs, preserved
metadata/images, 108 image resources, and 328 desktop/mobile views. The report
distinguishes content kept from actual modifications; do not refresh dates for
the 103 unchanged articles just to imply freshness.

## October 30 Practical Content And Search Ads

`scripts/useful-guides-20261030.cjs` replaces eight shallow core guides with
distinct worked examples, decision paths and eight downloadable CSV worksheets.
The examples are editorial exercises, not official exam questions, field
experience or validated eligibility decisions. Existing URLs, article images and
known publication dates are preserved. The homepage links to all eight guides.
`reports/content-value-improvements-20261030.json` records the exact scope.
These eight successor guides replace earlier scoped-check sections; historical
review tests now verify their worksheet rather than requiring the retired text.

Search pages are an exception to the general instruction to keep ad tags:
`scripts/search-ad-policy.cjs` strips ads from all three search tools and saved
search aliases. The homepage uses `assets/home-ads.js` to check for `?s=` before
making any advertising request, and retains the AdSense account verification
meta tag. Normal homepage/article advertising and consent controls remain.
Both home and search builders enforce the policy on future rebuilds.

The privacy disclosure now describes the current calculator/filter memory,
URL-based search queries and device-local CSV files, not the retired checklist.
Its email links use Cloudflare's documented `email_off` exception so the policy
contact remains readable without an injected email-decoding script or JavaScript.
When syncing only updated trust pages, use `TRUST_MODIFIED_DATE=2026-10-30` and
`TRUST_MODIFIED_SLUGS=소개,개인정보처리방침` to avoid redating unchanged terms.

Run `node scripts/test-useful-guides-20261030.cjs`, also with `TEST_ORIGIN` after
deployment. It checks all eight articles/downloads, desktop/mobile tables,
metadata/image preservation and zero advertising/CMP requests on ten search
and disclosure routes. A passing test is not an AdSense approval prediction.

## October 30 Homepage Preparation Paths

The homepage now starts with three preparation paths (qualification choice,
course registration and exam preparation), followed by existing illustrated
comparison articles. The long job table and secondary guide list use native
disclosures; job links open the table before navigating to it. Without JavaScript,
all three paths and the native disclosures remain available.

`scripts/home-paths.html` and `scripts/home-budget-compare.html` are included by
the home builder. The second cost scenario supports independent inputs, the
signed cost difference, a common daily-travel crossover estimate where defined,
and a browser-generated CSV export. These are user-input arithmetic examples,
not quotes, benefit eligibility or a ranking of training quality. Nothing is
saved in localStorage or sent to an application server. The privacy disclosure
describes this behavior; keep its canonical copies synchronized.

Run `node scripts/test-home-paths-20261030.cjs` locally and with `TEST_ORIGIN`
after deployment. It verifies keyboard tabs, links, native no-JS fallback,
equal/unequal/invalid cost scenarios and generated downloads at four widths.
