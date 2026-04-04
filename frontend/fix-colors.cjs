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

const colorMap = {
  // Emerald
  '#6ee7b7': 'var(--sm-emerald)',
  '#34d399': 'var(--sm-emerald-muted)',
  // Indigo
  '#818cf8': 'var(--sm-indigo)',
  '#a5b4fc': 'var(--sm-indigo-muted)',
  // Red
  '#fca5a5': 'var(--sm-red)',
  '#f87171': 'var(--sm-red-muted)',
  // Yellow
  '#fcd34d': 'var(--sm-yellow)',
  // Orange
  '#fb923c': 'var(--sm-orange)',
  // Cyan
  '#7dd3fc': 'var(--sm-cyan)',
  '#38bdf8': 'var(--sm-cyan-muted)'
};

const files = walk(srcDir);
let changedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let orig = content;

  Object.entries(colorMap).forEach(([hex, cssVar]) => {
    // Replace hex precisely. Use regex with word boundaries sort of, 
    // or just direct string replacement using regex with global flag + case insensitive.
    // e.g. /#6ee7b7/gi
    const regex = new RegExp(hex, 'gi');
    content = content.replace(regex, cssVar);
  });

  if (content !== orig) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
    changedFiles++;
  }
});

console.log(`\nAll done. Updated ${changedFiles} files with semantic colors.`);
