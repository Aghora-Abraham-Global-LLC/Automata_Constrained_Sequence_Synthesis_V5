import { PresetScenario, Vector3D } from '../types';

export const PRESETS: PresetScenario[] = [
  {
    id: 'paper-benchmark-v5',
    name: 'Section 5.1 Paper Benchmark (3-Body Resonance)',
    subtitle: 'N=3 Relativistic Non-Separable System at CFL Stability Margin',
    description: 'Exact setup from Section 5.1 of the paper: masses m1=50, m2=30, m3=10 with spin couplings chi=(0.6, 0.85, 0.95). Demonstrates zero secular energy drift over close encounters with C^∞ soft-min restraints.',
    category: 'benchmark',
    params: {
      G: 1.0,
      c: 12.0,
      dt: 0.008,
      subStepsPerFrame: 4,
      enableLO_SO: true,
      enable2PN_SS: true,
      enableNLO_SO: true,
      beta: 4.0,
      omega0: 30.0,
      kappa: 1.8,
      r0: 2.0,
      epsilon: 0.15,
      criticalRadius: 0.45,
      escapeVelocity: 5.5,
      enableLangevin: false
    },
    agents: [
      {
        id: 0,
        label: 'Node Alpha (m=50)',
        color: '#38bdf8', // Cyan
        mass: 50.0,
        q: [-1.8, -0.6, 0.1],
        p: [0.0, 14.5, -1.2],
        spin: [0.0, 0.0, 0.6 * 50.0],
        phase: 0.0,
        naturalFrequency: 1.2
      },
      {
        id: 1,
        label: 'Node Beta (m=30)',
        color: '#a855f7', // Purple
        mass: 30.0,
        q: [2.2, 0.4, -0.2],
        p: [-4.0, -18.0, 1.8],
        spin: [0.2 * 30.0, 0.0, 0.85 * 30.0],
        phase: 1.8,
        naturalFrequency: 1.5
      },
      {
        id: 2,
        label: 'Node Gamma (m=10)',
        color: '#f59e0b', // Amber
        mass: 10.0,
        q: [0.2, 3.2, 0.4],
        p: [12.0, -8.0, -2.5],
        spin: [0.3 * 10.0, -0.2 * 10.0, 0.95 * 10.0],
        phase: 3.6,
        naturalFrequency: 0.9
      }
    ]
  },
  {
    id: 'figure-eight-braid',
    name: 'Figure-Eight Choreography & Periodic Braid',
    subtitle: 'Equal Mass 3-Body Braid Word in B3 Generator',
    description: 'Remarkable periodic 3-body solution discovered by Moore & Chenciner. The agents chase each other along a planar figure-eight, generating a strictly deterministic alternating Artin braid word σ₁ · σ₂⁻¹ · σ₁ · σ₂⁻¹ in B₃.',
    category: 'topological',
    params: {
      G: 1.0,
      c: 25.0,
      dt: 0.005,
      subStepsPerFrame: 4,
      enableLO_SO: true,
      enable2PN_SS: false,
      enableNLO_SO: false,
      beta: 6.0,
      omega0: 25.0,
      kappa: 1.2,
      r0: 1.5,
      epsilon: 0.1,
      criticalRadius: 0.25,
      escapeVelocity: 8.0,
      enableLangevin: false
    },
    agents: [
      {
        id: 0,
        label: 'Agent 1',
        color: '#34d399', // Emerald
        mass: 25.0,
        q: [-2.4277, -0.6094, 0.0],
        p: [25.0 * 0.4662, 25.0 * 0.4323, 0.0],
        spin: [0.0, 0.0, 15.0],
        phase: 0.0,
        naturalFrequency: 1.0
      },
      {
        id: 1,
        label: 'Agent 2',
        color: '#f43f5e', // Rose
        mass: 25.0,
        q: [2.4277, 0.6094, 0.0],
        p: [25.0 * 0.4662, 25.0 * 0.4323, 0.0],
        spin: [0.0, 0.0, 15.0],
        phase: (2 * Math.PI) / 3,
        naturalFrequency: 1.0
      },
      {
        id: 2,
        label: 'Agent 3',
        color: '#38bdf8', // Sky
        mass: 25.0,
        q: [0.0, 0.0, 0.0],
        p: [25.0 * -0.9324, 25.0 * -0.8647, 0.0],
        spin: [0.0, 0.0, 15.0],
        phase: (4 * Math.PI) / 3,
        naturalFrequency: 1.0
      }
    ]
  },
  {
    id: 'chaotic-coalescence',
    name: 'Destabilization to Coalescence Sink (S0 → S1 → S4)',
    subtitle: 'Hysteresis Collapse and Critical Encounter r ≤ r_c',
    description: 'Initial hierarchical binary subjected to close perturbation. The hierarchy ratio collapses below 2.5 (S0 → S1), followed by an intense periastron passage where the soft-min potential activates and agents merge into sink S4.',
    category: 'chaotic',
    params: {
      G: 1.0,
      c: 10.0,
      dt: 0.006,
      subStepsPerFrame: 4,
      enableLO_SO: true,
      enable2PN_SS: true,
      enableNLO_SO: true,
      beta: 5.0,
      omega0: 35.0,
      kappa: 2.2,
      r0: 1.8,
      epsilon: 0.1,
      criticalRadius: 0.5,
      escapeVelocity: 7.0,
      enableLangevin: false
    },
    agents: [
      {
        id: 0,
        label: 'Core Primary (m=40)',
        color: '#38bdf8',
        mass: 40.0,
        q: [-0.9, 0.1, 0.0],
        p: [0.0, 16.0, 0.0],
        spin: [0.0, 0.0, 24.0],
        phase: 0.0,
        naturalFrequency: 1.0
      },
      {
        id: 1,
        label: 'Core Companion (m=25)',
        color: '#ec4899',
        mass: 25.0,
        q: [0.9, -0.1, 0.0],
        p: [0.0, -25.6, 0.0],
        spin: [0.0, 0.0, 15.0],
        phase: 1.5,
        naturalFrequency: 1.2
      },
      {
        id: 2,
        label: 'Infalling Perturber (m=15)',
        color: '#fbbf24',
        mass: 15.0,
        q: [5.2, -3.5, 0.3],
        p: [-18.0, 12.0, -1.0],
        spin: [0.0, 0.0, 9.0],
        phase: 3.1,
        naturalFrequency: 0.8
      }
    ]
  },
  {
    id: 'topological-exchange',
    name: 'Topological Partner Exchange (S1 ⇌ S2)',
    subtitle: 'Odd-Parity Artin Crossing and Core Partner Swapping',
    description: 'Three bodies in resonant interaction where the outer agent dives through the binary, ejecting one partner and binding with the other. Demonstrates the DFA S2 (Exchange) state and Artin swap parity.',
    category: 'topological',
    params: {
      G: 1.0,
      c: 14.0,
      dt: 0.007,
      subStepsPerFrame: 4,
      enableLO_SO: true,
      enable2PN_SS: true,
      enableNLO_SO: false,
      beta: 4.5,
      omega0: 28.0,
      kappa: 1.5,
      r0: 2.0,
      epsilon: 0.12,
      criticalRadius: 0.35,
      escapeVelocity: 8.5,
      enableLangevin: false
    },
    agents: [
      {
        id: 0,
        label: 'Alpha (m=35)',
        color: '#38bdf8',
        mass: 35.0,
        q: [-1.2, 0.0, 0.0],
        p: [0.0, 12.0, 0.5],
        spin: [0.0, 0.0, 20.0],
        phase: 0.2,
        naturalFrequency: 1.1
      },
      {
        id: 1,
        label: 'Beta (m=35)',
        color: '#10b981',
        mass: 35.0,
        q: [1.2, 0.0, 0.0],
        p: [0.0, -12.0, -0.5],
        spin: [0.0, 0.0, 20.0],
        phase: 2.1,
        naturalFrequency: 1.1
      },
      {
        id: 2,
        label: 'Intruder Gamma (m=35)',
        color: '#f97316',
        mass: 35.0,
        q: [0.0, 4.2, 0.0],
        p: [1.5, -16.0, 0.0],
        spin: [0.0, 0.0, 20.0],
        phase: 4.2,
        naturalFrequency: 1.3
      }
    ]
  },
  {
    id: 'curved-kuramoto-swarm',
    name: 'Curved Manifold Covariant Kuramoto Swarm (N=6)',
    subtitle: 'Levi-Civita Parallel Transport and Frustrated Phase Synchronization',
    description: 'Six agents navigating on curved pseudo-Riemannian manifold. Incorporates Ambrose-Singer connection holonomy phase shift δ_ij^g, demonstrating Theorem 2.1 exponential phase convergence with BAOAB Langevin thermostat.',
    category: 'synchronization',
    params: {
      G: 0.6,
      c: 18.0,
      dt: 0.008,
      subStepsPerFrame: 3,
      enableLO_SO: true,
      enable2PN_SS: false,
      enableNLO_SO: false,
      beta: 3.5,
      omega0: 20.0,
      kappa: 1.0,
      r0: 2.5,
      epsilon: 0.2,
      criticalRadius: 0.4,
      escapeVelocity: 9.0,
      enableLangevin: true,
      gamma0: 0.15,
      kBTsynth: 0.08,
      Ksync: 2.8,
      curvatureKmax: 0.25
    },
    agents: [
      {
        id: 0,
        label: 'Node 1',
        color: '#ef4444',
        mass: 20.0,
        q: [2.0, 0.0, 0.0],
        p: [0.0, 7.0, 1.0],
        spin: [0.0, 0.0, 10.0],
        phase: 0.2,
        naturalFrequency: 1.05
      },
      {
        id: 1,
        label: 'Node 2',
        color: '#f97316',
        mass: 20.0,
        q: [1.0, 1.732, 0.2],
        p: [-6.0, 3.5, -0.5],
        spin: [0.0, 0.0, 10.0],
        phase: 1.4,
        naturalFrequency: 0.95
      },
      {
        id: 2,
        label: 'Node 3',
        color: '#eab308',
        mass: 20.0,
        q: [-1.0, 1.732, -0.2],
        p: [-6.0, -3.5, 0.8],
        spin: [0.0, 0.0, 10.0],
        phase: 2.7,
        naturalFrequency: 1.10
      },
      {
        id: 3,
        label: 'Node 4',
        color: '#10b981',
        mass: 20.0,
        q: [-2.0, 0.0, 0.0],
        p: [0.0, -7.0, -1.0],
        spin: [0.0, 0.0, 10.0],
        phase: 3.8,
        naturalFrequency: 0.90
      },
      {
        id: 4,
        label: 'Node 5',
        color: '#06b6d4',
        mass: 20.0,
        q: [-1.0, -1.732, 0.3],
        p: [6.0, -3.5, 0.5],
        spin: [0.0, 0.0, 10.0],
        phase: 4.9,
        naturalFrequency: 1.02
      },
      {
        id: 5,
        label: 'Node 6',
        color: '#a855f7',
        mass: 20.0,
        q: [1.0, -1.732, -0.3],
        p: [6.0, 3.5, -0.8],
        spin: [0.0, 0.0, 10.0],
        phase: 5.8,
        naturalFrequency: 0.98
      }
    ]
  }
];
