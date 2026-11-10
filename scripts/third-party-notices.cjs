const fs = require('node:fs');
const path = require('node:path');

function thirdPartyNotices(root) {
  const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
  const sections = ['Third-party notices\n\nnode-forge is used under its BSD-3-Clause license option.\n'];
  const seen = new Set();
  for (const [location, locked] of Object.entries(lock.packages).sort(([a], [b]) => a.localeCompare(b, 'en'))) {
    if (!location || locked.dev) continue;
    const folder = path.join(root, location);
    const installed = JSON.parse(fs.readFileSync(path.join(folder, 'package.json'), 'utf8'));
    if (installed.version !== locked.version) throw new Error(`Stale dependency: ${installed.name}`);
    const key = `${installed.name}@${installed.version}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const files = fs.readdirSync(folder).filter(name => /^(licen[cs]e(?:\..+)?|copyrightnotice\.txt)$/i.test(name)).sort();
    if (!files.length) throw new Error(`Missing license notice for ${key}`);
    const notices = files.map(name => fs.readFileSync(path.join(folder, name), 'utf8').replace(/\r\n/g, '\n').trim());
    if (installed.name === 'pako') {
      const inflate = fs.readFileSync(path.join(folder, 'lib/zlib/inflate.js'), 'utf8').replace(/\r\n/g, '\n');
      const header = inflate.match(/\/\/ \(C\)[\s\S]*?(?=\nvar )/);
      if (!header) throw new Error('Missing pako Zlib notice');
      notices.push(header[0].replace(/^\/\/ ?/gm, '').trim());
    }
    sections.push(`\n${key} (${locked.license})\n${notices.join('\n\n')}\n`);
  }
  return sections.join('\n');
}
module.exports = { thirdPartyNotices };
