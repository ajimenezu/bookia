import fs from 'fs';
import path from 'path';

const dirsToScan = ['app', 'components', 'lib', 'actions'];

const rules = [
  {
    id: 'zod_validation',
    name: 'Input Sanitization (Missing Zod)',
    check: (content, filePath) => {
      const isServerAction = content.includes("'use server'") || content.includes('"use server"');
      const isApiRoute = filePath.includes('/api/');
      if (isServerAction || isApiRoute) {
        if (!content.includes('.parse') && !content.includes('.safeParse')) {
          return true;
        }
      }
      return false;
    }
  },
  {
    id: 'dangerously_set_html',
    name: 'Unescaped raw HTML',
    check: (content) => content.includes('dangerouslySetInnerHTML')
  },
  {
    id: 'prisma_set_create',
    name: 'Prisma relation "set" during "create"',
    check: (content) => {
      if (content.includes('.create({') && content.includes('set:')) {
        return true;
      }
      return false;
    }
  },
  {
    id: 'hardcoded_colors',
    name: 'Hardcoded Colors (UI/UX)',
    check: (content, filePath) => {
      if (filePath.endsWith('.css')) return false;
      const colorRegex = /(bg|text|border|ring|fill)-(red|blue|green|yellow|purple|pink|indigo|teal|orange|gray|slate|zinc|neutral|stone)-\d{2,3}|#[0-9a-fA-F]{3,6}\b|rgba?\(/g;
      const matches = content.match(colorRegex);
      if (matches) {
        // filter out valid usage or SVGs if needed, for now just flag
        return matches.slice(0, 3).join(', ') + (matches.length > 3 ? '...' : '');
      }
      return false;
    }
  },
  {
    id: 'hardcoded_labels',
    name: 'Hardcoded Dictionary Labels (UI/UX)',
    check: (content, filePath) => {
      if (filePath.includes('dictionary') || filePath.includes('i18n')) return false;
      const match = content.match(/['"](Staff|Barber|Barbers)['"]/i);
      return match ? match[0] : false;
    }
  },
  {
    id: 'scrollability',
    name: 'Missing Scrollability in Sheets/Panels',
    check: (content) => {
      if (content.includes('<SheetContent') && !content.includes('overflow-y-auto')) {
        return true;
      }
      return false;
    }
  },
  {
    id: 'take_5',
    name: 'Admin History Lists limit (take: 5)',
    check: (content, filePath) => {
      if (filePath.includes('admin') && content.includes('findMany(')) {
        if (!content.includes('take: 5') && !content.includes('take:')) {
          return true;
        }
      }
      return false;
    }
  },
  {
    id: 'dry_price',
    name: 'Manual Price Calculation (DRY)',
    check: (content, filePath) => {
      if (filePath.includes('lib/appointments.ts')) return false;
      if (content.includes('reduce') && content.includes('price')) {
        return true;
      }
      return false;
    }
  }
];

function scanDir(dir, results) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDir(fullPath, results);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      for (const rule of rules) {
        const match = rule.check(content, fullPath);
        if (match) {
          if (!results[rule.id]) results[rule.id] = [];
          results[rule.id].push({ file: fullPath, details: typeof match === 'string' ? match : '' });
        }
      }
    }
  }
}

const results = {};
for (const dir of dirsToScan) {
  scanDir(dir, results);
}

// Format output as Markdown
let md = '# PR Audit Report\n\n';

for (const rule of rules) {
  md += `## ${rule.name}\n`;
  if (!results[rule.id] || results[rule.id].length === 0) {
    md += `✅ Passed\n\n`;
  } else {
    for (const item of results[rule.id]) {
      md += `- [ ] \`${item.file}\`${item.details ? ` (Matched: ${item.details})` : ''}\n`;
    }
    md += '\n';
  }
}

fs.writeFileSync('audit-report.md', md);
console.log('Audit completed. Report saved to audit-report.md');
