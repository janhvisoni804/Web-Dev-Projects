# EPI-SHIELD: Epidemic Spread Simulator

A premium, light botanical-themed interactive epidemiological simulation workspace modeling SIR compartment population dynamics with real-time vector graphing, complete telemetry logs, social distancing attenuations, and raw CSV data exporters.

---

## Mathematical Epidemiology & Compartmental Principles

The **SIR model** (Kermack–McKendrick, 1927) divides a population into three mutually exclusive compartments that capture the fundamental dynamics of a directly-transmitted infectious disease:

- **Susceptible (S)** — Individuals who have not yet been infected and are at risk.
- **Infected (I)** — Individuals currently infected and capable of transmitting the pathogen.
- **Recovered (R)** — Individuals who have recovered, gained immunity, or been removed from the transmission chain.

The model assumes: homogeneous mixing, fixed population $N = S + I + R$, no births or deaths during the epidemic timescale, and lifelong immunity upon recovery.

---

## SIR System Differential Transpilation

### Governing Differential Equations

$$\frac{dS}{dt} = -\frac{\beta \cdot S \cdot I}{N}$$

$$\frac{dI}{dt} = \frac{\beta \cdot S \cdot I}{N} - \gamma \cdot I$$

$$\frac{dR}{dt} = \gamma \cdot I$$

### Parameter Definitions

| Symbol | Parameter | Role |
|---|---|---|
| $\beta$ | Transmission Rate | $P_{inf} \cdot (1 - \sigma)$ — modulated by social distancing |
| $P_{inf}$ | Infection Probability | Per-contact likelihood of transmission |
| $\sigma$ | Social Distancing Factor | Reduces contact frequency (0 = none, 1 = full isolation) |
| $\gamma$ | Recovery Rate | $1 / \text{duration of infectiousness}$ |
| $R_0$ | Basic Reproduction Number | $\beta / \gamma$ — average secondary infections per case |
| HIT | Herd Immunity Threshold | $1 - 1/R_0$ (valid when $R_0 > 1$) |

### Derived Epidemic Metrics

- **Peak Infection ($I_{max}$)**: Maximum simultaneous active cases
- **Transmission Velocity ($dI/dt$)**: Daily change in infected count
- **Flattening**: Reduced peak burden achieved through $\sigma > 0$

---

## Architectural UI Code Design

### File Structure

```
├── index.html         Main application shell
├── style.css          Complete botanical theme and layout
├── script.js          SIR engine, charting, and controls
├── README.md          This documentation
├── project.json       Project metadata
└── thumbnail.svg      Vector preview graphic
```

### Architecture Overview

- **Zero Dependencies**: No build tools, package managers, or server-side runtime required.
- **Client-Side Only**: All computation runs in the browser using vanilla JavaScript.
- **CDN-Sourced Charting**: Chart.js v4 loaded via jsDelivr CDN for high-performance canvas rendering.
- **State Management**: Single-source-of-truth state object tracks parameters, compartmental arrays, and simulation progress.
- **Deterministic Solver**: Discrete-time Euler integration of the SIR differential system with conservation enforcement ($S + I + R = N$).

### Data Flow

1. User adjusts sliders → state.params updated → R₀ and β recomputed → simulation reset
2. RUN clicked → pre-compute all compartment arrays (O(tMax)) → begin animation loop
3. Each frame → advance day counter → update chart datasets → append table row → refresh telemetry cards
4. PAUSE toggles loop; STEP advances one day
5. EXPORT CSV serializes compartment arrays → Blob → client-side download

---

## Simulation Operation Parameters

| Parameter | Range | Description |
|---|---|---|
| $N$ (Total Population) | 100 – 100,000 | Total population size |
| $P_{inf}$ (Infection Probability) | 0% – 100% | Per-contact transmission likelihood |
| $\gamma$ (Recovery Rate) | 0.01 – 1.00 | Daily probability of recovery |
| $\sigma$ (Social Distancing) | 0% – 100% | Contact reduction compliance |
| $t_{max}$ (Horizon) | 30 – 365 days | Simulation duration |

### Controls

- **RUN**: Execute full epidemic simulation with animation
- **PAUSE/STEP**: Pause or advance one day at a time
- **RESET**: Clear all data and return to initial state
- **EXPORT CSV**: Download compartment data as comma-separated values

### System Status Indicators

| Status | Meaning |
|---|---|
| AWAITING INITIALIZATION | Ready for input, no data computed |
| PROPAGATING TRANSMISSION CHAINS... | Simulation actively running |
| SIMULATION PAUSED | Animation suspended |
| OUTBREAK CONTAINED | Infected count dropped to zero |
| FLATTENING THE CURVE ACHIEVED | Peak infection remained low |

---

## Local Standalone Browser Execution

No server, build step, or installation required:

1. Clone or download this directory
2. Open `index.html` in any modern web browser (Chrome, Firefox, Edge, Safari)
3. The application loads instantly — Chart.js is fetched from CDN on first load
4. For offline use, download Chart.js bundle and replace the CDN `<script>` tag with a local reference

### System Requirements

- Modern browser with HTML5 Canvas and ES6 support
- Internet connection (first load only, for Chart.js CDN)
- No additional software, frameworks, or package managers

---

## License

Educational and research use. Built as a technical demonstration of mathematical epidemiology simulation and interactive data visualization.
