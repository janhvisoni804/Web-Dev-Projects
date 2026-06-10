# Gas Law Simulator

> An interactive, high-fidelity thermodynamic laboratory simulator modeling the macroscopic properties of an ideal gas through microscopic particle kinetics.

---

## Thermodynamic Formula Implementations

The simulation is driven by the **Ideal Gas Law**:

$$PV = nRT$$

Where the dependent variable **Pressure (P)** is computed continuously from user-controlled state variables:

$$P = \frac{nRT}{V}$$

- $P$ — System pressure (atm), calculated and displayed in real time
- $V$ — Chamber volume (L), controlled via the Volume slider mapping $0.5\text{ L}$ to $2.5\text{ L}$
- $n$ — Amount of substance (mol), proportional to particle count at $50\text{ particles/mol}$
- $R$ — Ideal gas constant ($0.0821\text{ L·atm·mol}^{-1}\text{K}^{-1}$)
- $T$ — Absolute temperature (K), adjustable from $100\text{ K}$ to $1000\text{ K}$

### Temperature-Velocity Coupling

Particle root-mean-square velocity follows the kinetic theory relation:

$$v_{\text{rms}} \propto \sqrt{T}$$

When temperature changes, all particle velocities are scaled proportionally to $\sqrt{T_{\text{new}} / T_{\text{old}}}$, ensuring the gas thermal energy adjusts correctly without disrupting momentum distribution.

---

## Particle Collision Engine Specifications

| Feature | Implementation | Detail |
|---------|---------------|--------|
| Wall collisions | Rigid reflection | Velocity component inverted on impact, 2% energy loss per bounce |
| Particle collisions | Elastic hard-sphere | Momentum-conserving pairwise exchange along collision normal |
| Collision detection | O(n²) pairwise | Optimized cap at 200 particles for inter-particle checks |
| Piston mechanics | Dynamic right wall | Variable position mapped from Volume slider; particles constrained |
| Collision frequency | Rolling window | Wall impacts counted per frame, averaged over 50-frame window |
| Over-pressure safety | Automatic release | Shake animation + 25% particle venting when P > 14 atm |

### Visual Particle Encoding

- **Temperature color gradient**: Particles transition from deep blue (`#3b82f6`) at cryogenic temperatures through warm tones to bright red (`#ef4444`) at extreme heat
- **Radial glow**: Each particle renders with a soft radial gradient halo proportional to its size

---

## Feature Walkthrough

### State Variable Controls
- **Temperature (T)** — Slider from 100K to 1000K; particle speed scales with $\sqrt{T}$
- **Volume (V)** — Slider from 20% to 100% chamber capacity; piston wall moves dynamically
- **Particle Injector** — ADD (+50) / REMOVE (-50) buttons to adjust particle count ($n$)

### Telemetry Dashboard
- **Pressure card** with live value and progress bar; color-coded thresholds: green (stable), amber (elevated), red (critical)
- **Volume** readout in liters
- **Particle count** with mole equivalent
- **Collision frequency** sparkline graph showing wall impact rate over time

### Simulation Controls
- **PAUSE / RESUME** — Freezes or continues particle motion
- **RESET TO STP** — Resets to Standard Temperature and Pressure (273K, 50% volume, 100 particles)

### Safety Systems
When pressure exceeds 14 atm, the simulator triggers:
1. Visual screen-shake animation
2. Automatic venting of 25% of gas particles
3. Status alert: "CRITICAL PRESSURE OVERLOAD"

---

## File Organization Hierarchy

```
├── index.html        Application shell — sidebar controls, telemetry cards, canvas viewport
├── style.css         Theme system — dark lab palette, telemetry cards, status indicators, shake animation
├── script.js         Thermodynamic engine — particle physics, Ideal Gas Law, collision detection, rendering
├── README.md         This documentation
├── project.json      Project metadata and tags
└── thumbnail.svg     Preview graphic
```

---

## Local Deployment Verification

This application runs entirely client-side with zero build steps or external dependencies.

### Quick Start
1. Open `index.html` directly in any modern browser
2. No web server, package manager, or compilation required

### Requirements
- Modern browser with HTML5 Canvas API
- JavaScript enabled
- No internet connection required

### Performance Notes
- Optimal performance with up to 300 particles
- Particle-particle collision detection capped at 200 particles for frame rate stability
- High-DPI (Retina) displays supported via `devicePixelRatio` scaling
