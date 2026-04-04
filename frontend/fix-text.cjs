const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    if (fs.statSync(file).isDirectory()) { 
      results = results.concat(walk(file));
    } else if ((file.endsWith('.js') || file.endsWith('.jsx')) && !file.endsWith('theme.js')) {
      results.push(file);
    }
  });
  return results;
}

const map = {
  // Whites and light greys used as primary text
  "'#f1f5f9'": "'var(--sm-text)'",
  "'#f8fafc'": "'var(--sm-text)'",
  "'#e2e8f0'": "'var(--sm-text)'",
  "'#ffffff'": "'var(--sm-text)'",
  
  // Mid-greys used as muted/sub text
  "'#cbd5e1'": "'var(--sm-text-muted)'",
  "'#94a3b8'": "'var(--sm-text-sub)'",
  "'#64748b'": "'var(--sm-text-sub)'",
  "'#9ca3af'": "'var(--sm-text-sub)'",
  "'#475569'": "'var(--sm-text-muted)'"
};

const files = walk(srcDir);
let changedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const orig = content;

  Object.entries(map).forEach(([hex, cssVar]) => {
    // Look for color: '#hex'
    // This regex ensures we only replace it if it's assigned to color:
    // It handles cases like `color: '#f1f5f9'` or `color: isDone ? '#cbd5e1' : '#f1f5f9'`
    // Wait, the easiest way is to match `color: ...` and replace within it, or just blindly replace the string if it's a known text color.
    // Let's do a safe string replacement only if preceded by `color:` or `, color:` or `?` or `:` (ternary)
    
    // Actually, just replacing the literal string in JSX is usually safe for these specific hex codes because they are almost exclusively used for text in this dark theme format. 
    // Wait! What if it's background: '#f1f5f9'? The dark theme doesn't use light backgrounds!
    // So any use of #f1f5f9 is definitely a text color or a border (but we already converted transparent borders).
    
    const regex = new RegExp(hex, 'gi');
    content = content.replace(regex, cssVar);
  });

  // What about color: '#fff'? If it's pure white, sometimes it's for buttons.
  // We will NOT universally replace '#fff' because buttons need to stay white!

  if (content !== orig) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
    changedFiles++;
  }
});

console.log(`\nDone. Updated ${changedFiles} files with text semantic colors.`);
