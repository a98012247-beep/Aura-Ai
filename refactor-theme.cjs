const fs = require('fs');
const path = require('path');
const dir = 'src/components/admin';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

const mappings = {
  'bg-slate-950': 'bg-slate-50 dark:bg-slate-950',
  'bg-slate-900': 'bg-slate-100 dark:bg-slate-900',
  'bg-slate-800': 'bg-white dark:bg-slate-800',
  'bg-slate-700': 'bg-slate-200 dark:bg-slate-700',
  'border-slate-800': 'border-slate-200 dark:border-slate-800',
  'border-slate-700': 'border-slate-300 dark:border-slate-700',
  'text-white': 'text-slate-900 dark:text-white',
  'text-slate-300': 'text-slate-700 dark:text-slate-300',
  'text-slate-400': 'text-slate-600 dark:text-slate-400',
  'bg-slate-800/50': 'bg-slate-100/50 dark:bg-slate-800/50'
};

files.forEach(f => {
  let content = fs.readFileSync(path.join(dir, f), 'utf-8');
  for (const [oldClass, newClass] of Object.entries(mappings)) {
    // Escape forward slashes in class names
    const escapedOldClass = oldClass.replace(/\//g, '\\/');
    const regex = new RegExp(`(?<=['"\\s])${escapedOldClass}(?=['"\\s])`, 'g');
    content = content.replace(regex, newClass);
  }
  fs.writeFileSync(path.join(dir, f), content);
});
console.log('done replacing in ' + files.length + ' files');
