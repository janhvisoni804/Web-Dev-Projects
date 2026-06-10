const state = {
params: { N: 10000, pInf: 0.05, gamma: 0.14, sigma: 0, tMax: 150 },
sim: { running: false, paused: false, step: 0, totalSteps: 150, S: [], I: [], R: [], dIdt: [], frameId: null, computed: false, peakI: 0, peakDay: 0 }
};

let lastStepTime = 0;
const STEP_INTERVAL = 60;

function formatNum(n) {
if (n == null || !isFinite(n)) return '0';
if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(2) + 'M';
if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + 'K';
return Math.round(n).toString();
}

function formatFloat(n, d) {
if (n == null || !isFinite(n)) return Number(0).toFixed(d);
return n.toFixed(d);
}

function getBeta() {
return state.params.pInf * (1 - state.params.sigma);
}

function getR0() {
var g = state.params.gamma;
if (g <= 0) return 0;
return getBeta() / g;
}

function updateMetrics() {
var beta = getBeta();
var r0 = getR0();
document.getElementById('valBeta').textContent = formatFloat(beta, 3);
document.getElementById('valR0').textContent = formatFloat(r0, 2);
document.getElementById('teleR0').textContent = formatFloat(r0, 2);
var hitEl = document.getElementById('teleHIT');
if (r0 > 1) {
var hit = (1 - 1 / r0) * 100;
hitEl.textContent = formatFloat(hit, 1) + '%';
} else {
hitEl.textContent = '—';
}
}

function updateStatus(text, type) {
document.getElementById('statusText').textContent = text;
var ind = document.getElementById('statusIndicator');
ind.className = 'status-indicator';
if (type) ind.classList.add(type);
}

function hardReset() {
if (state.sim.frameId) { cancelAnimationFrame(state.sim.frameId); state.sim.frameId = null; }
state.sim.running = false;
state.sim.paused = false;
state.sim.step = 0;
state.sim.computed = false;
state.sim.S = [];
state.sim.I = [];
state.sim.R = [];
state.sim.dIdt = [];
state.sim.peakI = 0;
state.sim.peakDay = 0;
document.getElementById('btnRun').disabled = false;
document.getElementById('telemetryBody').innerHTML = '';
document.getElementById('teleIt').textContent = '1';
document.getElementById('teleImax').textContent = '—';
document.getElementById('simState').textContent = 'Day: 0 / ' + state.params.tMax;
var chart = window.epiChart;
if (chart) {
chart.data.labels = [];
chart.data.datasets[0].data = [];
chart.data.datasets[1].data = [];
chart.data.datasets[2].data = [];
chart.update('none');
}
updateMetrics();
updateStatus('AWAITING INITIALIZATION', 'idle');
}

function computeSIR() {
var N = state.params.N;
var beta = getBeta();
var gamma = state.params.gamma;
var tMax = state.params.tMax;
var S = new Array(tMax + 1);
var I = new Array(tMax + 1);
var R = new Array(tMax + 1);
var dIdt = new Array(tMax + 1);
S[0] = N - 1;
I[0] = 1;
R[0] = 0;
dIdt[0] = 0;
var peakI = 1;
var peakDay = 0;
for (var t = 1; t <= tMax; t++) {
var sPrev = S[t - 1], iPrev = I[t - 1];
var newInf = (beta * sPrev * iPrev) / N;
var newRec = gamma * iPrev;
S[t] = Math.max(0, sPrev - newInf);
I[t] = Math.max(0, iPrev + newInf - newRec);
R[t] = Math.max(0, R[t - 1] + newRec);
var total = S[t] + I[t] + R[t];
if (Math.abs(total - N) > 0.01) {
R[t] = Math.max(0, R[t] + (N - total));
}
dIdt[t] = newInf - newRec;
if (I[t] > peakI) { peakI = I[t]; peakDay = t; }
}
state.sim.S = S;
state.sim.I = I;
state.sim.R = R;
state.sim.dIdt = dIdt;
state.sim.totalSteps = tMax;
state.sim.peakI = peakI;
state.sim.peakDay = peakDay;
state.sim.computed = true;
}

function updateChart() {
var chart = window.epiChart;
if (!chart || state.sim.S.length === 0) return;
var tMax = state.params.tMax;
var step = state.sim.step;
chart.data.labels = Array.from({ length: tMax + 1 }, function(_, i) { return i; });
var Sdata = new Array(tMax + 1).fill(null);
var Idata = new Array(tMax + 1).fill(null);
var Rdata = new Array(tMax + 1).fill(null);
for (var i = 0; i <= step && i < state.sim.S.length; i++) {
Sdata[i] = state.sim.S[i];
Idata[i] = state.sim.I[i];
Rdata[i] = state.sim.R[i];
}
chart.data.datasets[0].data = Sdata;
chart.data.datasets[1].data = Idata;
chart.data.datasets[2].data = Rdata;
chart.update('none');
}

function addTelemetryRow(t, S, I, R, dIdtVal) {
var tbody = document.getElementById('telemetryBody');
var tr = document.createElement('tr');
tr.innerHTML = '<td>' + t + '</td><td>' + formatNum(S) + '</td><td>' + formatNum(I) + '</td><td>' + formatNum(R) + '</td><td>' + formatFloat(dIdtVal, 1) + '</td>';
tbody.appendChild(tr);
var log = tbody.closest('.telemetry-log');
log.scrollTop = log.scrollHeight;
}

function updateDisplay() {
var step = state.sim.step;
updateChart();
var st = state.sim.S[step], it = state.sim.I[step], rt = state.sim.R[step], dt = state.sim.dIdt[step];
document.getElementById('teleIt').textContent = formatNum(it);
document.getElementById('teleImax').textContent = formatNum(state.sim.peakI);
document.getElementById('simState').textContent = 'Day: ' + step + ' / ' + state.sim.totalSteps;
addTelemetryRow(step, st, it, rt, dt);
}

function finishSimulation() {
state.sim.running = false;
document.getElementById('btnRun').disabled = false;
var lastI = state.sim.I[state.sim.step] || 0;
if (lastI < 1 && state.sim.peakI > 10) {
updateStatus('OUTBREAK CONTAINED', 'contained');
} else if (state.sim.peakI < 100) {
updateStatus('FLATTENING THE CURVE ACHIEVED', 'flattened');
} else {
updateStatus('OUTBREAK CONTAINED', 'contained');
}
}

function simulationLoop(timestamp) {
if (!state.sim.running || state.sim.paused) return;
if (timestamp - lastStepTime < STEP_INTERVAL) {
state.sim.frameId = requestAnimationFrame(simulationLoop);
return;
}
lastStepTime = timestamp;
if (state.sim.step >= state.sim.totalSteps) { finishSimulation(); return; }
state.sim.step++;
updateDisplay();
if (state.sim.step >= state.sim.totalSteps) { finishSimulation(); return; }
updateStatus('PROPAGATING TRANSMISSION CHAINS...', 'running');
state.sim.frameId = requestAnimationFrame(simulationLoop);
}

function runSimulation() {
if (state.sim.running && !state.sim.paused) return;
if (state.sim.paused) {
state.sim.paused = false;
document.getElementById('btnRun').disabled = true;
updateStatus('PROPAGATING TRANSMISSION CHAINS...', 'running');
lastStepTime = performance.now();
state.sim.frameId = requestAnimationFrame(simulationLoop);
return;
}
hardReset();
computeSIR();
state.sim.running = true;
state.sim.step = 0;
document.getElementById('btnRun').disabled = true;
updateDisplay();
updateStatus('PROPAGATING TRANSMISSION CHAINS...', 'running');
lastStepTime = performance.now();
state.sim.frameId = requestAnimationFrame(simulationLoop);
}

function togglePause() {
if (!state.sim.running) return;
if (!state.sim.computed) return;
state.sim.paused = !state.sim.paused;
if (state.sim.paused) {
updateStatus('SIMULATION PAUSED', 'idle');
} else {
updateStatus('PROPAGATING TRANSMISSION CHAINS...', 'running');
lastStepTime = performance.now();
state.sim.frameId = requestAnimationFrame(simulationLoop);
}
}

function stepSimulation() {
if (state.sim.running && !state.sim.paused) {
state.sim.paused = true;
updateStatus('SIMULATION PAUSED', 'idle');
}
if (!state.sim.computed) {
hardReset();
computeSIR();
state.sim.running = true;
state.sim.paused = true;
state.sim.step = 0;
document.getElementById('btnRun').disabled = true;
updateDisplay();
updateStatus('SIMULATION PAUSED (DAY 0)', 'idle');
return;
}
if (state.sim.step >= state.sim.totalSteps) { finishSimulation(); return; }
if (!state.sim.running) {
state.sim.running = true;
document.getElementById('btnRun').disabled = true;
}
state.sim.step++;
updateDisplay();
if (state.sim.step >= state.sim.totalSteps) { finishSimulation(); return; }
updateStatus('SIMULATION PAUSED', 'idle');
}

function resetSimulation() {
hardReset();
document.getElementById('btnRun').disabled = false;
}

function exportCSV() {
if (!state.sim.computed || state.sim.S.length === 0) return;
var maxIdx = Math.min(state.sim.step, state.sim.S.length - 1);
var csv = 'Day,Susceptible (S),Infected (I),Recovered (R),Daily Transmission Velocity (dI/dt)\n';
for (var i = 0; i <= maxIdx; i++) {
var s = state.sim.S[i] != null ? state.sim.S[i] : '';
var ii = state.sim.I[i] != null ? state.sim.I[i] : '';
var r = state.sim.R[i] != null ? state.sim.R[i] : '';
var d = state.sim.dIdt[i] != null ? state.sim.dIdt[i] : '';
csv += i + ',' + s + ',' + ii + ',' + r + ',' + d + '\n';
}
var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
var url = URL.createObjectURL(blob);
var a = document.createElement('a');
a.href = url;
a.download = 'epidemic_spread_data.csv';
document.body.appendChild(a);
a.click();
document.body.removeChild(a);
URL.revokeObjectURL(url);
}

function initChart() {
var ctx = document.getElementById('epidemicChart').getContext('2d');
window.epiChart = new Chart(ctx, {
type: 'line',
data: {
labels: [],
datasets: [
{ label: 'Susceptible S(t)', data: [], borderColor: '#4caf50', backgroundColor: 'rgba(76,175,80,0.08)', borderWidth: 2.5, pointRadius: 0, tension: 0.3, fill: true },
{ label: 'Infected I(t)', data: [], borderColor: '#e65100', backgroundColor: 'rgba(230,81,0,0.08)', borderWidth: 2.5, pointRadius: 0, tension: 0.3, fill: true },
{ label: 'Recovered R(t)', data: [], borderColor: '#2e7d32', backgroundColor: 'rgba(46,125,50,0.08)', borderWidth: 2.5, pointRadius: 0, tension: 0.3, fill: true }
]
},
options: {
responsive: true, maintainAspectRatio: false, animation: { duration: 0 },
interaction: { mode: 'index', intersect: false },
plugins: {
legend: { display: true, position: 'top', align: 'end', labels: { usePointStyle: true, pointStyle: 'line', padding: 14, font: { size: 11, weight: '600' }, color: '#557a61' } },
tooltip: { backgroundColor: '#ffffff', titleColor: '#1b3a24', bodyColor: '#557a61', borderColor: '#e2ebd9', borderWidth: 1, padding: 10, cornerRadius: 6 }
},
scales: {
x: { title: { display: true, text: 'Day (t)', color: '#557a61', font: { size: 11, weight: '600' } }, grid: { color: 'rgba(226,235,217,0.5)' }, ticks: { color: '#557a61', font: { size: 10 }, maxTicksLimit: 15 } },
y: { title: { display: true, text: 'Population', color: '#557a61', font: { size: 11, weight: '600' } }, grid: { color: 'rgba(226,235,217,0.5)' }, ticks: { color: '#557a61', font: { size: 10 }, callback: function(v) { return v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v; } }, beginAtZero: true }
}
}
});
}

function setupSliders() {
var config = [
{ id: 'sliderN', key: 'N', display: 'valN', fmt: function(v) { return Math.round(v).toString(); } },
{ id: 'sliderPinf', key: 'pInf', display: 'valPinf', fmt: function(v) { return formatFloat(v * 100, 1) + '%'; }, scale: function(v) { return v / 100; } },
{ id: 'sliderGamma', key: 'gamma', display: 'valGamma', fmt: function(v) { return formatFloat(v, 2); } },
{ id: 'sliderSigma', key: 'sigma', display: 'valSigma', fmt: function(v) { return Math.round(v * 100) + '%'; }, scale: function(v) { return v / 100; } },
{ id: 'sliderTMax', key: 'tMax', display: 'valTMax', fmt: function(v) { return Math.round(v).toString(); } }
];
config.forEach(function(c) {
var el = document.getElementById(c.id);
if (!el) return;
el.addEventListener('input', function() {
var raw = parseFloat(this.value);
var val = c.scale ? c.scale(raw) : raw;
state.params[c.key] = val;
document.getElementById(c.display).textContent = c.fmt(val);
updateMetrics();
hardReset();
});
});
}

function setupButtons() {
document.getElementById('btnRun').addEventListener('click', runSimulation);
document.getElementById('btnPause').addEventListener('click', togglePause);
document.getElementById('btnStep').addEventListener('click', stepSimulation);
document.getElementById('btnReset').addEventListener('click', resetSimulation);
document.getElementById('btnExport').addEventListener('click', exportCSV);
}

document.addEventListener('DOMContentLoaded', function() {
initChart();
setupSliders();
setupButtons();
updateMetrics();
hardReset();
});
