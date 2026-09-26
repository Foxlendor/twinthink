// House rule: no em dash (U+2014) or en dash (U+2013) anywhere on the site.
// Runs before every build (npm "prebuild"), so a dash fails the deploy
// instead of reaching visitors. Use a comma, colon, period or plain hyphen.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const scan = ['src', 'public'];
const textExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.md', '.mdx', '.css', '.html', '.txt', '.svg', '.xml', '.webmanifest']);
const dash = /[–—]/;

function* files(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) yield* files(path);
    else if (textExtensions.has(extname(name).toLowerCase())) yield path;
  }
}

const found = [];
for (const folder of scan) {
  for (const file of files(join(root, folder))) {
    readFileSync(file, 'utf8')
      .split('\n')
      .forEach((line, index) => {
        if (dash.test(line)) found.push(`${relative(root, file)}:${index + 1}`);
      });
  }
}

if (found.length) {
  console.error(`No dashes allowed on the site. Replace the em/en dash in:\n  ${found.join('\n  ')}`);
  process.exit(1);
}
console.log('no-dashes: ok');
