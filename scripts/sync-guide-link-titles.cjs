const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const guides = require('./guide-refresh-data.cjs');
const root = path.resolve(__dirname, '..');
const titles = guides.map(guide => {
  const baseline = execFileSync('git', ['show', `HEAD:${guide.slug}/index.html`], { cwd: root, encoding: 'utf8' });
  const old = baseline.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)[1];
  return [old, guide.title];
});
function visit(dir) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    if (item.name.startsWith('.') || item.name === 'node_modules') continue;
    const file = path.join(dir, item.name);
    if (item.isDirectory()) visit(file);
    else if (item.name.endsWith('.html')) {
      const original = fs.readFileSync(file, 'utf8');
      const updated = original.replace(/<a\b[^>]*>[\s\S]*?<\/a>/g, anchor => {
        for (const [old, title] of titles) anchor = anchor.replaceAll(old, title);
        return anchor;
      });
      if (updated !== original) {
        fs.writeFileSync(file, updated);
        console.log(`SYNC link titles ${path.relative(root, file)}`);
      }
    }
  }
}
visit(root);
