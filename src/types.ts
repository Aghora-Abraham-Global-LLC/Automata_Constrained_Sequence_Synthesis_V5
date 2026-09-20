export type Vector3D = [number, number, number];

export interface AgentState {
  id: number;
  label: string;
  color: string;
  mass: number;
  // Physical coordinates
  q: Vector3D;
  p: Vector3D;
  // Auxiliary extended-space coordinates (Tao extended phase space)
  x: Vector3D;
  y: Vector3D;
  // Internal spin vector S_i
  spin: Vector3D;
  // Synthetic phase for Kuramoto synchronization
  phase: number;
  naturalFrequency: number;
  // Trail history for rendering
  trail: Vector3D[];
}

export enum IntegratorType {
  V5_POINCARE_ADAPTIVE = 'v5_poincare_adaptive',
  TAO_RIGID = 'tao_rigid',
  CLASSICAL_RK4 = 'classical_rk4',
  LEAPFROG_15PN = 'leapfrog_15pn'
}

export enum BN_State {
  S0_HIERARCHICAL = 'S0',
  S1_RESONANT = 'S1',
  S2_EXCHANGE = 'S2',
  S3_ESCAPE = 'S3',
  S4_COALESCENCE = 'S4'
}

export interface DFATransitionEvent {
  id: string;
  timestamp: number;
  fromState: BN_State;
  toState: BN_State;
  trigger: string;
  details: string;
}

export interface BraidCrossing {
  step: number;
  time: number;
  strandA: number;
  strandB: number;
  sign: 1 | -1; // +1 for over-crossing, -1 for under-crossing
  symbol: string; // e.g. "σ₁", "σ₁⁻¹"
}

export interface SimulationParams {
  // Integrator
  integrator: IntegratorType;
  dt: number; // Base fictitious step size Δτ
  subStepsPerFrame: number;

  // Physical constants
  G: number;
  c: number; // Speed of light analog for PN scaling

  // Post-Newtonian couplings toggle
  enableLO_SO: boolean;
  enable2PN_SS: boolean;
  enableNLO_SO: boolean;

  // Soft-Minimum Potential R_beta(q) parameters
  beta: number;       // mollifier parameter in soft-min
  omega0: number;     // baseline coupling frequency
  kappa: number;      // adaptive stiffness coefficient
  r0: number;         // characteristic interaction radius
  epsilon: number;    // collision regularizer

  // Langevin & Phase Synchronization parameters
  enableLangevin: boolean;
  gamma0: number;     // dissipation damping
  kBTsynth: number;   // synthetic exploration noise temperature
  Ksync: number;      // Kuramoto coupling strength
  curvatureKmax: number; // Riemannian sectional curvature bound

  // Observer projection for Braid Group B_N
  observerVector: Vector3D; // n in S^2

  // Thresholds for DFA
  criticalRadius: number; // r_c for S4 coalescence sink
  escapeVelocity: number; // v_esc for S3 escape bound
}

export interface SimulationMetrics {
  time: number;
  steps: number;
  totalEnergy: number;
  initialEnergy: number;
  energyDrift: number; // |(H - H0) / H0|
  angularMomentum: Vector3D;
  angularMomentumDrift: number;
  
  // Constraint manifold distance ||q - x|| + ||p - y||
  transverseDistance: number;
  transverseConstraintDistance: number;
  
  // Proximity metrics
  trueMinDistance: number;
  softMinDistance: number; // R_beta(q)
  adaptiveOmega: number;   // omega(R_beta)
  cflRatio: number;        // Delta_tau * omega (must be < 2, ideally < pi/2)
  isCFLViolated: boolean;

  // Kuramoto Order Parameter
  orderParameterRg: number; // R_g in [0, 1]
  coherenceVectorZg: Vector3D;
  theoreticalConvergenceLimit: number;

  // Braid & Topology metrics
  hierarchyRatio: number; // r_out / r_in
  activeDFAState: BN_State;
  recentCrossings: BraidCrossing[];
  braidWord: string;
  windingNumbers: Record<string, number>;
  isotropicComplexity: number;
}

export interface TimeSeriesPoint {
  time: number;
  energyError: number;
  transverseDistance: number;
  omega: number;
  orderParameterRg: number;
  minDistance: number;
}

export interface PresetScenario {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  category: 'benchmark' | 'chaotic' | 'topological' | 'synchronization';
  params: Partial<SimulationParams>;
  agents: Omit<AgentState, 'trail' | 'x' | 'y'>[];
}
