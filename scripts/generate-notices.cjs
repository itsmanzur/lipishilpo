// Generate notices for the installed production dependency graph (including transitive packages).
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const lock = JSON.parse(fs.readFileSync(path.join(root, 'src/package-lock.json'), 'utf8'));
let output = `LIPISHILPO THIRD-PARTY JAVASCRIPT NOTICES

Lipishilpo's original code is GPL-2.0-or-later. Third-party components retain
their own copyright and license terms. This inventory covers the production
dependency graph in src/package-lock.json; bundling can omit unused modules.
JSZip is used under its MIT licensing option. Pako includes MIT and zlib terms.
Source code for each package is available from its repository below and from
https://www.npmjs.com/package/<package-name>/v/<version>.
Run npm ci in src/ to obtain the exact versions and integrity-checked packages.
Font and dictionary notices are in assets/fonts/ and assets/dicts/.

`;
let count = 0;
for (const [relative, metadata] of Object.entries(lock.packages)) {
  if (!relative || metadata.dev) continue;
  const directory = path.join(root, 'src', relative);
  const pkg = JSON.parse(fs.readFileSync(path.join(directory, 'package.json'), 'utf8'));
  let files = fs.readdirSync(directory).filter(name => /^(license|copying|notice)/i.test(name));
  let license;
  if (pkg.name === 'isarray') {
    license = fs.readFileSync(path.join(directory, 'README.md'), 'utf8').split('## License')[1];
  } else if (pkg.name === 'dingbat-to-unicode') {
    license = fs.readFileSync(path.join(root, 'licenses/dingbat-to-unicode-LICENSE.txt'), 'utf8');
  } else {
    license = files.map(name => fs.readFileSync(path.join(directory, name), 'utf8')).join('\n\n');
  }
  if (!license?.trim()) throw new Error('Missing license: ' + pkg.name);
  output += '='.repeat(72) + `\n${pkg.name} ${pkg.version}\nLicense: ${metadata.license ?? pkg.license}\nSource: ${typeof pkg.repository === 'object' ? pkg.repository.url : pkg.repository ?? pkg.homepage}\n\n${license.trim()}\n\n`;
  if (pkg.name === 'pako') {
    for (const name of fs.readdirSync(path.join(directory, 'lib/zlib')).filter(name => name.endsWith('.js'))) {
      const source = fs.readFileSync(path.join(directory, 'lib/zlib', name), 'utf8');
      const match = source.match(/\/\/ \(C\)[\s\S]*?(?=\r?\n\r?\n)/);
      if (match) output += `Pako lib/zlib/${name} source notice:\n${match[0]}\n\n`;
    }
  }
  count++;
}
fs.writeFileSync(path.join(root, 'THIRD-PARTY-NOTICES.txt'), output);
console.log(`Generated complete notices for ${count} production dependencies.`);
