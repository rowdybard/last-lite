import fs from 'node:fs';

const banned = [
  /\bbabylon(js)?\b/i, 
  /\bthree(\.js)?\b/i, 
  /webgl2?/i, 
  /WebGLRenderingContext\b/, 
  /WebGL2RenderingContext\b/, 
  /\bGLTFLoader\b/i, 
  /\bShaderMaterial\b/i, 
  /\bMesh\b/i, 
  /\bPBR\b/i, 
  /\bUnity\b/i, 
  /\bPlayCanvas\b/i
];

const ok2D = [/getContext\(\s*['\"]2d['\"]\s*\)/];

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap(d => {
  const p = dir + '/' + d.name; 
  return d.isDirectory() ? walk(p) : [p];
});

const files = walk('.')
  .filter(p => /\.(ts|tsx|js|jsx|json|html|css|md)$/.test(p) && 
    !p.startsWith('./node_modules') && 
    !p.startsWith('./dist') && 
    !p.startsWith('./.git'));

let bad = [];

for (const f of files) {
  const txt = fs.readFileSync(f, 'utf8');
  if (ok2D.some(r => r.test(txt))) { 
    /* allowed */ 
  }
  if (banned.some(r => r.test(txt))) bad.push(f);
}

const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
const deps = Object.keys({ ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) }).join(' ');

if (/(babylon|three|playcanvas|unity)/i.test(deps)) bad.push('package.json(deps)');

if (bad.length) {
  console.error('❌ 3D tech detected in:', bad);
  process.exit(1);
} else {
  console.log('✅ No 3D tech detected.');
}
