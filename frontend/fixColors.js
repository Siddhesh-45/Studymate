import fs from 'fs';
import path from 'path';

const SRC_DIR = path.join(process.cwd(), 'src');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.jsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk(SRC_DIR);
let updatedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const initialContent = content;

  // Replace hardcoded values with var() dynamically assigned to the right theme token
  content = content.replace(/'#f1f5f9'/g, "'var(--sm-text, #f1f5f9)'");
  content = content.replace(/'#e2e8f0'/g, "'var(--sm-text, #e2e8f0)'");
  content = content.replace(/'#cbd5e1'/g, "'var(--sm-text, #cbd5e1)'");
  content = content.replace(/'#94a3b8'/g, "'var(--sm-text-sub, #94a3b8)'");
  content = content.replace(/'#475569'/g, "'var(--sm-text-muted, #475569)'");
  content = content.replace(/'#334155'/g, "'var(--sm-text-muted, #334155)'");
  
  if (content !== initialContent) {
    fs.writeFileSync(file, content, 'utf8');
    updatedFiles++;
  }
});

console.log(`Updated ${updatedFiles} files.`);
