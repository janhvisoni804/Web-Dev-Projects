const state = {
image: null,
palette: []
};

function rgbToHex(r, g, b) {
return '#' + [r, g, b].map(function(c) {
return Math.round(c).toString(16).padStart(2, '0');
}).join('');
}

function rgbToString(r, g, b) {
return 'rgb(' + Math.round(r) + ', ' + Math.round(g) + ', ' + Math.round(b) + ')';
}

function colourDistance(a, b) {
const dr = a[0] - b[0], dg = a[1] - b[1], db = a[2] - b[2];
return dr * dr + dg * dg + db * db;
}

function extractPalette(imageData, count) {
var data = imageData.data;
var w = imageData.width, h = imageData.height;
var pixels = [];
var step = Math.max(1, Math.floor(Math.sqrt((w * h) / 8000)));
for (var y = 0; y < h; y += step) {
for (var x = 0; x < w; x += step) {
var idx = (y * w + x) * 4;
var r = data[idx], g = data[idx + 1], b = data[idx + 2], a = data[idx + 3];
if (a < 128) continue;
var qr = Math.round(r / 32) * 32;
var qg = Math.round(g / 32) * 32;
var qb = Math.round(b / 32) * 32;
pixels.push([qr, qg, qb]);
}
}
if (pixels.length === 0) return [];
pixels.sort(function(a, b) {
var hueA = Math.atan2(a[1] - a[2], a[0] - a[1]);
var hueB = Math.atan2(b[1] - b[2], b[0] - b[1]);
return hueA - hueB;
});
var buckets = [];
var threshold = 3000;
for (var i = 0; i < pixels.length; i++) {
var placed = false;
for (var j = 0; j < buckets.length; j++) {
if (colourDistance(pixels[i], buckets[j].avg) < threshold) {
buckets[j].pixels.push(pixels[i]);
var len = buckets[j].pixels.length;
buckets[j].avg = [
(buckets[j].avg[0] * (len - 1) + pixels[i][0]) / len,
(buckets[j].avg[1] * (len - 1) + pixels[i][1]) / len,
(buckets[j].avg[2] * (len - 1) + pixels[i][2]) / len
];
placed = true;
break;
}
}
if (!placed) {
buckets.push({ pixels: [pixels[i]], avg: pixels[i].slice() });
}
}
buckets.sort(function(a, b) { return b.pixels.length - a.pixels.length; });
var colors = [];
for (var k = 0; k < Math.min(count, buckets.length); k++) {
var avg = buckets[k].avg;
var r = Math.round(avg[0]), g = Math.round(avg[1]), b = Math.round(avg[2]);
colors.push({ r: r, g: g, b: b, hex: rgbToHex(r, g, b), rgb: rgbToString(r, g, b), weight: buckets[k].pixels.length });
}
return colors;
}

function renderPalette(colors) {
var grid = document.getElementById('paletteGrid');
grid.innerHTML = '';
colors.forEach(function(c) {
var item = document.createElement('div');
item.className = 'palette-item';
var luminance = (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255;
var textColor = luminance > 0.5 ? '#1a1a2e' : '#ffffff';
item.innerHTML = '<div class="palette-swatch" style="background:' + c.hex + '"></div><div class="palette-info"><div class="palette-hex">' + c.hex + '</div><div class="palette-rgb">' + c.rgb + '</div></div>';
item.addEventListener('click', function() {
navigator.clipboard.writeText(c.hex).then(function() {
showToast('Copied ' + c.hex + ' to clipboard');
});
});
grid.appendChild(item);
});
}

function processImage(file) {
var reader = new FileReader();
reader.onload = function(e) {
var img = new Image();
img.onload = function() {
document.getElementById('previewImage').src = e.target.result;
document.getElementById('workspace').style.display = 'block';
document.getElementById('uploadZone').style.display = 'none';
var canvas = document.createElement('canvas');
var maxDim = 600;
var scale = Math.min(1, maxDim / Math.max(img.width, img.height));
canvas.width = Math.round(img.width * scale);
canvas.height = Math.round(img.height * scale);
var ctx = canvas.getContext('2d');
ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
var count = parseInt(document.getElementById('colorCount').value);
var colors = extractPalette(imageData, count);
state.palette = colors;
renderPalette(colors);
};
img.src = e.target.result;
};
reader.readAsDataURL(file);
}

function setupUpload() {
var zone = document.getElementById('uploadZone');
var input = document.getElementById('fileInput');
zone.addEventListener('click', function() { input.click(); });
zone.addEventListener('dragover', function(e) {
e.preventDefault();
zone.classList.add('drag-over');
});
zone.addEventListener('dragleave', function() {
zone.classList.remove('drag-over');
});
zone.addEventListener('drop', function(e) {
e.preventDefault();
zone.classList.remove('drag-over');
if (e.dataTransfer.files.length > 0) {
processImage(e.dataTransfer.files[0]);
}
});
input.addEventListener('change', function() {
if (this.files.length > 0) processImage(this.files[0]);
});
document.querySelector('.upload-link').addEventListener('click', function(e) {
e.stopPropagation();
input.click();
});
}

function setupColorCount() {
document.getElementById('colorCount').addEventListener('change', function() {
if (state.palette.length > 0) {
document.getElementById('workspace').style.display = 'block';
var canvas = document.createElement('canvas');
var img = document.getElementById('previewImage');
canvas.width = img.naturalWidth;
canvas.height = img.naturalHeight;
var ctx = canvas.getContext('2d');
ctx.drawImage(img, 0, 0);
var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
var count = parseInt(this.value);
var colors = extractPalette(imageData, count);
state.palette = colors;
renderPalette(colors);
}
});
}

function setupExport() {
document.getElementById('btnExport').addEventListener('click', function() {
if (state.palette.length === 0) return;
var css = ':root {\n';
state.palette.forEach(function(c, i) {
css += '  --color-' + (i + 1) + ': ' + c.hex + ';\n';
});
css += '}';
navigator.clipboard.writeText(css).then(function() {
showToast('CSS variables copied to clipboard');
}).catch(function() {
var blob = new Blob([css], { type: 'text/css' });
var url = URL.createObjectURL(blob);
var a = document.createElement('a');
a.href = url;
a.download = 'palette.css';
document.body.appendChild(a);
a.click();
document.body.removeChild(a);
URL.revokeObjectURL(url);
showToast('CSS file downloaded');
});
});
}

var toastTimeout = null;
function showToast(msg) {
var el = document.getElementById('toast');
el.textContent = msg;
el.classList.add('show');
if (toastTimeout) clearTimeout(toastTimeout);
toastTimeout = setTimeout(function() { el.classList.remove('show'); }, 2000);
}

document.addEventListener('DOMContentLoaded', function() {
setupUpload();
setupColorCount();
setupExport();
});
