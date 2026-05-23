const fs = require('fs');
const path = require('path');

const files = [
  'src/app/pages-admin/ventas-manual/dialogs/sale-success-dialog.component.ts',
  'src/app/pages-admin/ventas-manual/dialogs/sale-success-dialog.component.html',
  'src/app/pages-admin/ventas-manual/dialogs/sale-success-dialog.component.scss',
];

for (const rel of files) {
  const p = path.resolve(rel);
  const buf = fs.readFileSync(p);
  if (buf.length >= 2 && buf[0] === 0xFF && buf[1] === 0xFE) {
    // UTF-16 LE BOM
    const text = buf.slice(2).toString('utf16le');
    fs.writeFileSync(p, text, { encoding: 'utf8' });
    console.log('CONVERTED UTF-16LE -> UTF-8:', rel);
  } else if (buf.length >= 3 && buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) {
    const text = buf.slice(3).toString('utf8');
    fs.writeFileSync(p, text, { encoding: 'utf8' });
    console.log('STRIPPED BOM:', rel);
  } else {
    const hex = buf.slice(0, 2).toString('hex').toUpperCase();
    console.log(`OK (${hex} no BOM):`, rel);
  }
}
