// ホーム画面用アイコンを作る（ゲームと同じボクセルの飛行機を使う）。
// ブラウザのコンソールで  const m = await import('./tools/make-icons.js'); m.make()
// → { 'icon-180.png': dataURL, ... } を返す。
export function make() {
  const base = n => {   // n×n ドットの元絵
    const c = document.createElement('canvas'); c.width = c.height = n;
    const g = c.getContext('2d');
    const bands = ['#2f74b8', '#3a86c8', '#4a97d6', '#5aa8e2', '#6db7ea', '#86c6ef'];
    const h = Math.ceil(n * .62 / bands.length);
    bands.forEach((col, i) => { g.fillStyle = col; g.fillRect(0, i * h, n, h); });
    const cloud = (x, y, w) => { g.fillStyle = '#e9f4fb'; g.fillRect(x, y, w, 2); g.fillRect(x + 2, y - 2, w - 5, 2); g.fillStyle = '#cfe4f2'; g.fillRect(x, y + 2, w, 1); };
    cloud(Math.round(n * .08), Math.round(n * .2), 14); cloud(Math.round(n * .62), Math.round(n * .12), 11);
    const gy = Math.round(n * .62);
    g.fillStyle = '#4f7f3c'; g.fillRect(0, gy, n, n - gy);
    for (let x = 0; x < n; x += 6) { g.fillStyle = '#558a40'; g.fillRect(x, gy, 3, n - gy); }
    const ry = Math.round(n * .74), rh = Math.round(n * .12);
    g.fillStyle = '#3c4046'; g.fillRect(0, ry, n, rh);
    g.fillStyle = '#e8ebee'; g.fillRect(0, ry + 1, n, 1); g.fillRect(0, ry + rh - 2, n, 1);
    for (let x = 2; x < n; x += 9) g.fillRect(x, ry + (rh >> 1), 5, 1);
    const sp = window.planeSprite(2, '#ffcd1c', 0);
    const px = Math.round((n - sp.img.width) / 2), py = Math.round(n * .48 - sp.img.height / 2);
    g.globalAlpha = .28; g.drawImage(sp.sh.img, px + 8, py + 18); g.globalAlpha = 1;
    g.drawImage(sp.img, px, py);
    return c;
  };
  const out = {};
  const scaled = (src, size, pad = 0) => {
    const c = document.createElement('canvas'); c.width = c.height = size;
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    g.fillStyle = '#2f74b8'; g.fillRect(0, 0, size, size);
    g.drawImage(src, pad, pad, size - pad * 2, size - pad * 2);
    return c.toDataURL('image/png');
  };
  const b90 = base(90), b96 = base(96);
  out['icon-180.png'] = scaled(b90, 180);
  out['icon-192.png'] = scaled(b96, 192);
  out['icon-512.png'] = scaled(b96, 512, 16);
  return out;
}
