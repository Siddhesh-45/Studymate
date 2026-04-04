const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if ((file.endsWith('.js') || file.endsWith('.jsx')) && !file.endsWith('theme.js')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(srcDir);
let changedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const orig = content;

  content = content.replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0?\.(\d+)\s*\)/g, (match, p1) => {
    let numStr = p1;
    if (numStr.length === 1) numStr += '0';
    const val = parseInt(numStr, 10);
    return `var(--sm-surface-${val})`;
  });

  if (content !== orig) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
    changedFiles++;
  }
});

console.log(`\nAll done. Updated ${changedFiles} files.`);
