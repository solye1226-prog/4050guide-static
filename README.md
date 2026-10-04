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
