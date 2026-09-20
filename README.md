# Automata Constrained Sequence Synthesis (Version 5.0)

[![Applet DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.22851432.svg)](https://doi.org/10.5281/zenodo.22851432)
[![Monograph DOI](https://img.shields.io/badge/Preprint%20DOI-10.5281%2Fzenodo.22851183-blue)](https://doi.org/10.5281/zenodo.22851183)
[![CI & Build Verification](https://github.com/bhutadamarasena/automata-constrained-sequence-synthesis/actions/workflows/ci.yml/badge.svg)](https://github.com/bhutadamarasena/automata-constrained-sequence-synthesis/actions/workflows/ci.yml)
[![License: CC BY 4.0](https://img.shields.io/badge/License-CC_BY_4.0-lightgrey.svg)](https://creativecommons.org/licenses/by/4.0/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript%205-blue)](https://www.typescriptlang.org/)
[![Symplectic Conservation](https://img.shields.io/badge/Energy%20Drift-%7C%CE%94H%2FH₀%7C%20%3C%2010%E2%81%BB%E2%81%B5-emerald)](https://doi.org/10.5281/zenodo.22851432)
[![API Overhead](https://img.shields.io/badge/External%20API%20Calls-0%20(100%25%20Local)-brightgreen)](https://doi.org/10.5281/zenodo.22851432)

> **Official Reference Software Implementation** for the theoretical monograph:  
> **"Phase-Synchronized Trajectory Optimization in Synthetic Multi-Agent Systems: Adaptive Extended Symplectic Control and Planar Braid Complexity" (Version 5.0)**  
> **Author**: Arya Arunachala Ananda Ghulam-e-Shah-e-Unmani  
> **Institutions**: *BhutaDamaraSena R&D Labs* &middot; *Aghora Abraham Global LLC*  
> **Applet Software DOI**: [10.5281/zenodo.22851432](https://doi.org/10.5281/zenodo.22851432)  
> **Theoretical Monograph DOI**: [10.5281/zenodo.22851183](https://doi.org/10.5281/zenodo.22851183)  
> **Primary AMS Classifications**: `70H15`, `65P10`, `57K10`, `37N05`, `49M30` &middot; **PACS**: `05.45.Xt`, `02.60.Cb`

---

## Abstract & Theoretical Scope

Autonomous multi-agent swarms operating in coupled dynamical fields (relativistic astrodynamics, micro-robotic magnetic manipulation, formation flying) require trajectory synthesis that simultaneously guarantees long-term energy conservation, collision non-violation, and topological order stability. Traditional numeric integrators (e.g., standard Runge-Kutta or non-symplectic boundary methods) suffer from artificial secular energy dissipation, coordinate-singularity blowups at close-approach, and discontinuous gradient chatter when hard distance constraints are enforced.

This repository provides the primary computational suite and interactive reference platform executing the full **Version 5.0** mathematical framework:

1. **Poincaré Extended Phase Space Symplectic Integrator**: Non-separable Post-Newtonian physical phase space $(\bm{q}, \bm{p})$ is doubled with auxiliary variables $(\bm{x}, \bm{y})$ and parameterized by fictitious time $\tau$, executing a symmetric 2nd-order Strang splitting scheme:
   $$\Psi_{\Delta\tau} = \Phi_A(\Delta\tau/2) \circ \Phi_B(\Delta\tau/2) \circ \Phi_\omega(\Delta\tau) \circ \Phi_B(\Delta\tau/2) \circ \Phi_A(\Delta\tau/2)$$
   guaranteeing strict preservation of the extended symplectic 2-form $\Omega_{\mathrm{ext}}$ with zero secular energy drift ($\vert \Delta H / H_0 \vert \le C \Delta\tau^2$).
2. **$\mathcal{C}^\infty$ Smooth Soft-Minimum Potential $\mathcal{R}_\beta(\bm{q})$**: Eliminates non-smooth gradient bifurcations using log-sum-exp mollification with analytic partition gradients $w_{ij}$:
   $$\mathcal{R}_\beta(\bm{q}) = -\frac{1}{\beta}\ln \sum_{i<j} \exp(-\beta r_{ij}), \quad w_{ij} = \frac{e^{-\beta r_{ij}}}{\sum_{k<l} e^{-\beta r_{kl}}}$$
3. **Adaptive Coupling Frequency $\omega(\mathcal{R}_\beta)$ & CFL Criterion**: Dynamically stiffens the harmonic constraint frequency during close encounters while strictly preserving the Courant-Friedrichs-Lewy stability boundary:
   $$\Delta\tau \cdot \omega(\mathcal{R}_\beta) < \pi/2$$
4. **Relativistic Post-Newtonian Couplings**: Computes full non-separable $H_{\mathrm{1.5PN}}^{\mathrm{LO,SO}}$ (Spin-Orbit), $H_{\mathrm{2PN}}^{\mathrm{SS}}$ (Spin-Spin dipole/quadrupole), and $H_{\mathrm{2.5PN}}^{\mathrm{NLO,SO}}$ interactions, evolving internal spins $\bm{S}_i$ via exact Lie-algebraic Rodrigues rotation $\|\bm{S}_i\| = \mathrm{const}$.
5. **Covariant Kuramoto Dynamics & Ambrose-Singer Holonomy**: Synchronizes synthetic agent phases $\theta_i$ on curved Riemannian manifolds $(\Sigma, g)$ via Levi-Civita parallel transport to the Karcher barycenter $\bm{q}_0$, incorporating geometric curvature bounds:
   $$\kappa_{\max} = \sup_{p \in \Sigma} |K(p)| \le \frac{K_{\mathrm{sync}}}{2 D^2}$$
6. **Projected Artin Braid Group $\mathcal{B}_N$ and 5-State Automaton ($B_N$-DFA)**: Evaluates spacetime cylinder worldlines projected along observer unit vector $\mathbf{n} \in \mathbb{S}^2$, classifying topological braid words $w_{\mathbf{n}} \in \mathcal{B}_N$ and proving non-chattering finite-state transitions across a strict hysteresis gap $\mathcal{H}_{\mathrm{ratio}} \in (2.5, 8.0)$.

---

## Architectural & Execution Guarantees

### Zero External API Calls & Offline Computational Independence
The entire computational engine is written in pure, high-performance TypeScript and executes **100% locally in the browser or Node.js runtime**.
- **0 External API Requests**: Does **not** communicate with remote language models, external cloud APIs, or metered endpoints.
- **Zero Token Usage / Zero Quota Charges**: Completely immune to API consumption or rate limits.
- **Deterministic & Reproducible**: Produces identical machine-precision symplectic trajectories from defined initial seeds.

### Numerical Stability & Resource Protection
- **Page Visibility Guard**: Automatically throttles or suspends continuous integration when the browser tab is hidden, preventing background CPU runaway or battery drain.
- **Singularity Sanitizer**: Floating-point checks prevent $\mathrm{NaN}$ poisoning during ultra-close encounters, engaging mollified regularizer $\epsilon$ and bounded velocity restitution.
- **CFL Auto-Clamp**: Enforces $\Delta\tau \cdot \omega(\mathcal{R}_\beta) < \pi/2$, guaranteeing that high-curvature encounters do not violate symplectic stability.

---

## Repository Structure

```
.
├── CITATION.cff               # GitHub & Zenodo Citation metadata
├── .zenodo.json               # Zenodo automated archival & DOI registration
├── LICENSE                    # Zenodo Open Access Academic License (CC BY 4.0)
├── autometa_v5_mod.tex        # Primary mathematical LaTeX manuscript
├── .github/
│   └── workflows/
│       ├── ci.yml             # CI: Typecheck, lint, production build verification
│       └── release-zenodo.yml # Release automation for Zenodo DOI integration
├── src/
│   ├── types.ts               # Strict mathematical domain models & state types
│   ├── physics/
│   │   ├── mathUtils.ts       # SO(3) Rodrigues rotation, Kahan summation, projection
│   │   ├── hamiltonian.ts     # Post-Newtonian couplings & soft-minimum gradients
│   │   ├── integrators.ts     # V5 Poincaré adaptive Strang splitting & RK4 benchmark
│   │   └── braidDFA.ts        # Artin braid word extraction & hysteresis DFA
│   ├── data/
│   │   └── presets.ts         # Pre-configured benchmarks (Section 5.1 3-body, etc.)
│   ├── components/
│   │   ├── Header.tsx         # System status, offline badge, & control bar
│   │   ├── Viewport3D.tsx     # 3D orbital canvas with momentum & spin vectors
│   │   ├── BraidVisualizer.tsx# 2D spacetime cylinder & braid crossing generator
│   │   ├── DFAMachineView.tsx # Interactive 5-state topological automaton
│   │   ├── PhaseKuramotoView.tsx # Phasor circle on S¹ & Karcher holonomy
│   │   ├── DiagnosticCharts.tsx # Logarithmic energy drift & CFL verification
│   │   ├── PaperInspector.tsx # Formal mathematical theorems & proof outlines
│   │   ├── ControlPanel.tsx   # Parameter tuning & physical constant controls
│   │   └── CitationModal.tsx  # Zenodo DOI & BibTeX export dialog
│   ├── App.tsx                # Main simulation shell & robust RAF animation loop
│   └── main.tsx               # Entrypoint mounting
├── package.json               # Scripts & dependencies
└── vite.config.ts             # Vite configuration with Tailwind CSS
```

---

## Quickstart & Local Execution

### Prerequisites
- Node.js `18.x` or `20.x`
- `npm` or `pnpm` / `bun`

### Installation & Launch
```bash
# Clone repository
git clone https://github.com/bhutadamarasena/automata-constrained-sequence-synthesis.git
cd automata-constrained-sequence-synthesis

# Install dependencies
npm install

# Start local interactive platform (Port 3000)
npm run dev

# Run type-check & lint validation
npm run lint

# Build standalone production bundle
npm run build
```

---

## Reproducing Paper Benchmarks

### Section 5.1 Benchmark: 3-Body Resonance with Close Encounter
1. Open the platform and select **Section 5.1 3-Body Resonance ($m_1=50, m_2=30, m_3=10$)** from the scenario dropdown.
2. Select **V5.0 Poincaré Adaptive** as the integrator.
3. Observe:
   - Energy drift remains bounded $|\Delta H / H_0| < 10^{-5}$ over thousands of steps.
   - Soft-minimum potential $\mathcal{R}_\beta(q)$ smoothly stiffens $\omega$, keeping $\Delta\tau \cdot \omega < 1.5 < \pi/2$.
   - Switch to **Classical RK4** to view immediate secular dissipation and catastrophic energy explosion at close encounter ($r_{ij} < 0.2$).

---

## Citation & Zenodo DOI

If you use this software, algorithm implementations, or benchmark models in your research, please cite:

```bibtex
@article{ghulam2026phase,
  title={Phase-Synchronized Trajectory Optimization in Synthetic Multi-Agent Systems: Adaptive Extended Symplectic Control and Planar Braid Complexity},
  author={Ghulam-e-Shah-e-Unmani, Arya Arunachala Ananda},
  journal={Preprint},
  year={2026},
  doi={10.5281/zenodo.22851183},
  url={https://doi.org/10.5281/zenodo.22851183}
}
```

Or reference the software computational applet directly:

```bibtex
@software{ghulam2026software,
  author={Ghulam-e-Shah-e-Unmani, Arya Arunachala Ananda},
  title={Automata Constrained Sequence Synthesis: Reference Computational Platform (Version 5.0)},
  year={2026},
  publisher={Zenodo},
  version={5.0.0},
  doi={10.5281/zenodo.22851432},
  url={https://doi.org/10.5281/zenodo.22851432}
}
```

---

## License

Released under the **Zenodo Academic Open-Access License (Creative Commons Attribution 4.0 International - CC BY 4.0)**. See `LICENSE` for details.  
Academic research attribution to **Arya Arunachala Ananda Ghulam-e-Shah-e-Unmani** and citation of Zenodo DOI `10.5281/zenodo.22851432` is required.

