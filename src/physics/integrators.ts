import { AgentState, SimulationParams, IntegratorType, Vector3D } from '../types';
import { vec3, rodriguesRotation } from './mathUtils';
import {
  computeSoftMinimumDistance,
  computeAdaptiveOmega,
  evaluateHamiltonian,
  computeHamiltonianGradients,
  computeSpinPrecessionFrequency
} from './hamiltonian';

export interface StepResult {
  agents: AgentState[];
  dt_physical: number;
  dtau_fictitious: number;
  omega: number;
  cflRatio: number;
  isCFLViolated: boolean;
  transverseDistance: number;
  softMinDistance: number;
  trueMinDistance: number;
  orderParameterRg: number;
  coherenceVectorZg: Vector3D;
}

/**
 * Executes a single integration step according to chosen integrator mode
 */
export function integrateStep(
  agents: AgentState[],
  params: SimulationParams
): StepResult {
  switch (params.integrator) {
    case IntegratorType.V5_POINCARE_ADAPTIVE:
      return stepV5PoincareAdaptive(agents, params, true);
    case IntegratorType.TAO_RIGID:
      return stepV5PoincareAdaptive(agents, params, false);
    case IntegratorType.CLASSICAL_RK4:
      return stepClassicalRK4(agents, params);
    case IntegratorType.LEAPFROG_15PN:
      return stepLeapfrog15PN(agents, params);
    default:
      return stepV5PoincareAdaptive(agents, params, true);
  }
}

export const stepIntegrator = integrateStep;

/**
 * V5.0 Poincaré Adaptive Extended Symplectic Integrator (or Rigid Tao if adaptive=false)
 * Strang Splitting: phi_A(dt/2) o phi_B(dt/2) o phi_omega(dt) o phi_B(dt/2) o phi_A(dt/2)
 */
function stepV5PoincareAdaptive(
  initialAgents: AgentState[],
  params: SimulationParams,
  adaptive: boolean
): StepResult {
  const N = initialAgents.length;
  const masses = initialAgents.map(a => a.mass);
  const spins = initialAgents.map(a => vec3.clone(a.spin));
  
  // Clone extended coordinates (q, p, x, y)
  let q = initialAgents.map(a => vec3.clone(a.q));
  let p = initialAgents.map(a => vec3.clone(a.p));
  let x = initialAgents.map(a => vec3.clone(a.x));
  let y = initialAgents.map(a => vec3.clone(a.y));

  // Compute soft-minimum distance and adaptive omega
  const { r_soft, r_min } = computeSoftMinimumDistance(q, params.beta);
  const omega = adaptive ? computeAdaptiveOmega(r_soft, params) : params.omega0;

  const dtau = params.dt;
  const cflRatio = dtau * omega;
  const isCFLViolated = cflRatio >= Math.PI / 2;

  // Physical time step dt = dtau / omega (Poincaré transformation)
  const dt_physical = adaptive ? dtau / omega : dtau;

  // 1. Sub-Flow phi_A(dtau / 2) on (q, y)
  // p <- p - (dtau/2) * dH_A/dq
  // x <- x + (dtau/2) * dH_A/dy
  const half_tau = dtau * 0.5;
  const gradA1 = computeHamiltonianGradients(q, y, spins, masses, params);
  for (let i = 0; i < N; i++) {
    p[i] = vec3.sub(p[i], vec3.scale(gradA1.dH_dq[i], half_tau));
    x[i] = vec3.add(x[i], vec3.scale(gradA1.dH_dp[i], half_tau));
  }

  // 2. Sub-Flow phi_B(dtau / 2) on (x, p)
  // q <- q + (dtau/2) * dH_B/dp
  // y <- y - (dtau/2) * dH_B/dx
  const gradB1 = computeHamiltonianGradients(x, p, spins, masses, params);
  for (let i = 0; i < N; i++) {
    q[i] = vec3.add(q[i], vec3.scale(gradB1.dH_dp[i], half_tau));
    y[i] = vec3.sub(y[i], vec3.scale(gradB1.dH_dq[i], half_tau));
  }

  // 3. Sub-Flow phi_omega(dtau) Harmonic Rotation
  // Difference variables (Q_-, P_-) rotated by angle theta = 2 * omega * dtau
  const theta = 2 * omega * dtau;
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);
  const invSqrt2 = 1 / Math.SQRT2;

  for (let i = 0; i < N; i++) {
    for (let axis = 0; axis < 3; axis++) {
      const Q_plus = (q[i][axis] + x[i][axis]) * invSqrt2;
      const P_plus = (p[i][axis] + y[i][axis]) * invSqrt2;
      const Q_minus = (q[i][axis] - x[i][axis]) * invSqrt2;
      const P_minus = (p[i][axis] - y[i][axis]) * invSqrt2;

      // Exact Symplectic Rotation
      const Q_minus_new = cosT * Q_minus + sinT * P_minus;
      const P_minus_new = -sinT * Q_minus + cosT * P_minus;

      // Reconstruct
      q[i][axis] = (Q_plus + Q_minus_new) * invSqrt2;
      x[i][axis] = (Q_plus - Q_minus_new) * invSqrt2;
      p[i][axis] = (P_plus + P_minus_new) * invSqrt2;
      y[i][axis] = (P_plus - P_minus_new) * invSqrt2;
    }
  }

  // 4. Sub-Flow phi_B(dtau / 2) on (x, p)
  const gradB2 = computeHamiltonianGradients(x, p, spins, masses, params);
  for (let i = 0; i < N; i++) {
    q[i] = vec3.add(q[i], vec3.scale(gradB2.dH_dp[i], half_tau));
    y[i] = vec3.sub(y[i], vec3.scale(gradB2.dH_dq[i], half_tau));
  }

  // 5. Sub-Flow phi_A(dtau / 2) on (q, y)
  const gradA2 = computeHamiltonianGradients(q, y, spins, masses, params);
  for (let i = 0; i < N; i++) {
    p[i] = vec3.sub(p[i], vec3.scale(gradA2.dH_dq[i], half_tau));
    x[i] = vec3.add(x[i], vec3.scale(gradA2.dH_dp[i], half_tau));
  }

  // 6. Precession of internal spins S_i via Rodrigues SO(3) formula
  const updatedSpins: Vector3D[] = [];
  for (let i = 0; i < N; i++) {
    const Omega_i = computeSpinPrecessionFrequency(i, q, p, spins, masses, params);
    const S_next = rodriguesRotation(spins[i], Omega_i, dt_physical);
    updatedSpins.push(S_next);
  }

  // 7. Langevin Thermostat & Covariant Kuramoto updates (if enabled)
  const { updatedMomenta, updatedPhases, orderParameterRg, coherenceVectorZg } = 
    applyLangevinAndKuramoto(q, p, initialAgents, params, dt_physical);

  // Measure transverse distance ||q - x|| + ||p - y||
  let transverseDistance = 0;
  for (let i = 0; i < N; i++) {
    transverseDistance += vec3.dist(q[i], x[i]) + vec3.dist(updatedMomenta[i], y[i]);
  }

  // Build updated agents with trail
  const updatedAgents: AgentState[] = initialAgents.map((agent, i) => {
    const newTrail = [...agent.trail, vec3.clone(q[i])];
    if (newTrail.length > 250) newTrail.shift();

    return {
      ...agent,
      q: q[i],
      p: updatedMomenta[i],
      x: x[i],
      y: y[i],
      spin: updatedSpins[i],
      phase: updatedPhases[i],
      trail: newTrail
    };
  });

  return {
    agents: updatedAgents,
    dt_physical,
    dtau_fictitious: dtau,
    omega,
    cflRatio,
    isCFLViolated,
    transverseDistance,
    softMinDistance: r_soft,
    trueMinDistance: r_min,
    orderParameterRg,
    coherenceVectorZg
  };
}

/**
 * Classical Runge-Kutta 4th-Order (RK4) for non-separable Hamiltonian system
 * Benchmark demonstrating rapid dephasing and non-symplectic secular energy drift
 */
function stepClassicalRK4(
  initialAgents: AgentState[],
  params: SimulationParams
): StepResult {
  const N = initialAgents.length;
  const masses = initialAgents.map(a => a.mass);
  const spins = initialAgents.map(a => vec3.clone(a.spin));
  const dt = params.dt;

  const q0 = initialAgents.map(a => vec3.clone(a.q));
  const p0 = initialAgents.map(a => vec3.clone(a.p));

  // k1 = f(q0, p0)
  const g1 = computeHamiltonianGradients(q0, p0, spins, masses, params);
  const dq1 = g1.dH_dp;
  const dp1 = g1.dH_dq.map(v => vec3.scale(v, -1));

  // k2 = f(q0 + 0.5*dt*dq1, p0 + 0.5*dt*dp1)
  const q1 = q0.map((q, i) => vec3.add(q, vec3.scale(dq1[i], dt * 0.5)));
  const p1 = p0.map((p, i) => vec3.add(p, vec3.scale(dp1[i], dt * 0.5)));
  const g2 = computeHamiltonianGradients(q1, p1, spins, masses, params);
  const dq2 = g2.dH_dp;
  const dp2 = g2.dH_dq.map(v => vec3.scale(v, -1));

  // k3 = f(q0 + 0.5*dt*dq2, p0 + 0.5*dt*dp2)
  const q2 = q0.map((q, i) => vec3.add(q, vec3.scale(dq2[i], dt * 0.5)));
  const p2 = p0.map((p, i) => vec3.add(p, vec3.scale(dp2[i], dt * 0.5)));
  const g3 = computeHamiltonianGradients(q2, p2, spins, masses, params);
  const dq3 = g3.dH_dp;
  const dp3 = g3.dH_dq.map(v => vec3.scale(v, -1));

  // k4 = f(q0 + dt*dq3, p0 + dt*dp3)
  const q3 = q0.map((q, i) => vec3.add(q, vec3.scale(dq3[i], dt)));
  const p3 = p0.map((p, i) => vec3.add(p, vec3.scale(dp3[i], dt)));
  const g4 = computeHamiltonianGradients(q3, p3, spins, masses, params);
  const dq4 = g4.dH_dp;
  const dp4 = g4.dH_dq.map(v => vec3.scale(v, -1));

  // Combine RK4: q_next = q0 + (dt/6)*(dq1 + 2*dq2 + 2*dq3 + dq4)
  const q_next: Vector3D[] = [];
  const p_next: Vector3D[] = [];
  for (let i = 0; i < N; i++) {
    const dq_total = vec3.scale(
      vec3.add(vec3.add(dq1[i], vec3.scale(dq2[i], 2)), vec3.add(vec3.scale(dq3[i], 2), dq4[i])),
      dt / 6
    );
    const dp_total = vec3.scale(
      vec3.add(vec3.add(dp1[i], vec3.scale(dp2[i], 2)), vec3.add(vec3.scale(dp3[i], 2), dp4[i])),
      dt / 6
    );
    q_next.push(vec3.add(q0[i], dq_total));
    p_next.push(vec3.add(p0[i], dp_total));
  }

  // Precession
  const updatedSpins: Vector3D[] = [];
  for (let i = 0; i < N; i++) {
    const Omega_i = computeSpinPrecessionFrequency(i, q_next, p_next, spins, masses, params);
    updatedSpins.push(rodriguesRotation(spins[i], Omega_i, dt));
  }

  const { r_soft, r_min } = computeSoftMinimumDistance(q_next, params.beta);
  const { updatedMomenta, updatedPhases, orderParameterRg, coherenceVectorZg } = 
    applyLangevinAndKuramoto(q_next, p_next, initialAgents, params, dt);

  const updatedAgents: AgentState[] = initialAgents.map((agent, i) => {
    const newTrail = [...agent.trail, vec3.clone(q_next[i])];
    if (newTrail.length > 250) newTrail.shift();
    return {
      ...agent,
      q: q_next[i],
      p: updatedMomenta[i],
      x: q_next[i],
      y: updatedMomenta[i],
      spin: updatedSpins[i],
      phase: updatedPhases[i],
      trail: newTrail
    };
  });

  return {
    agents: updatedAgents,
    dt_physical: dt,
    dtau_fictitious: dt,
    omega: params.omega0,
    cflRatio: dt * params.omega0,
    isCFLViolated: false,
    transverseDistance: 0,
    softMinDistance: r_soft,
    trueMinDistance: r_min,
    orderParameterRg,
    coherenceVectorZg
  };
}

/**
 * Standard Leapfrog + 1.5PN Analog
 */
function stepLeapfrog15PN(
  initialAgents: AgentState[],
  params: SimulationParams
): StepResult {
  const N = initialAgents.length;
  const masses = initialAgents.map(a => a.mass);
  const spins = initialAgents.map(a => vec3.clone(a.spin));
  const dt = params.dt;
  const half_dt = dt * 0.5;

  let q = initialAgents.map(a => vec3.clone(a.q));
  let p = initialAgents.map(a => vec3.clone(a.p));

  // Kick 1/2
  const g1 = computeHamiltonianGradients(q, p, spins, masses, params);
  for (let i = 0; i < N; i++) {
    p[i] = vec3.sub(p[i], vec3.scale(g1.dH_dq[i], half_dt));
  }

  // Drift full dt
  for (let i = 0; i < N; i++) {
    const v = vec3.scale(p[i], 1 / masses[i]);
    q[i] = vec3.add(q[i], vec3.scale(v, dt));
  }

  // Kick 2/2
  const g2 = computeHamiltonianGradients(q, p, spins, masses, params);
  for (let i = 0; i < N; i++) {
    p[i] = vec3.sub(p[i], vec3.scale(g2.dH_dq[i], half_dt));
  }

  // Spin precession
  const updatedSpins: Vector3D[] = [];
  for (let i = 0; i < N; i++) {
    const Omega_i = computeSpinPrecessionFrequency(i, q, p, spins, masses, params);
    updatedSpins.push(rodriguesRotation(spins[i], Omega_i, dt));
  }

  const { r_soft, r_min } = computeSoftMinimumDistance(q, params.beta);
  const { updatedMomenta, updatedPhases, orderParameterRg, coherenceVectorZg } = 
    applyLangevinAndKuramoto(q, p, initialAgents, params, dt);

  const updatedAgents: AgentState[] = initialAgents.map((agent, i) => {
    const newTrail = [...agent.trail, vec3.clone(q[i])];
    if (newTrail.length > 250) newTrail.shift();
    return {
      ...agent,
      q: q[i],
      p: updatedMomenta[i],
      x: q[i],
      y: updatedMomenta[i],
      spin: updatedSpins[i],
      phase: updatedPhases[i],
      trail: newTrail
    };
  });

  return {
    agents: updatedAgents,
    dt_physical: dt,
    dtau_fictitious: dt,
    omega: params.omega0,
    cflRatio: dt * params.omega0,
    isCFLViolated: false,
    transverseDistance: 0,
    softMinDistance: r_soft,
    trueMinDistance: r_min,
    orderParameterRg,
    coherenceVectorZg
  };
}

/**
 * Applies BAOAB stochastic Langevin friction/exploration and Covariant Kuramoto Phase dynamics
 * with Levi-Civita parallel transport holonomy phase shift delta_ij^g.
 */
function applyLangevinAndKuramoto(
  q: Vector3D[],
  p: Vector3D[],
  initialAgents: AgentState[],
  params: SimulationParams,
  dt: number
): {
  updatedMomenta: Vector3D[];
  updatedPhases: number[];
  orderParameterRg: number;
  coherenceVectorZg: Vector3D;
} {
  const N = q.length;
  const { enableLangevin, gamma0, kBTsynth, Ksync, curvatureKmax } = params;

  // 1. Covariant Kuramoto Phase Synchronization: Theorem 2.1
  // Local phasors u_i = (cos Phi_i, sin Phi_i) parallel transported to Karcher barycenter q0
  let barycenter: Vector3D = [0, 0, 0];
  let totalMass = 0;
  for (let i = 0; i < N; i++) {
    barycenter = vec3.add(barycenter, vec3.scale(q[i], initialAgents[i].mass));
    totalMass += initialAgents[i].mass;
  }
  barycenter = vec3.scale(barycenter, 1 / Math.max(totalMass, 1e-6));

  // Compute swarm diameter to bound holonomy: delta_max^g = 1/6 * K_max * diam^2
  let maxDist = 0;
  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      const d = vec3.dist(q[i], q[j]);
      if (d > maxDist) maxDist = d;
    }
  }
  const deltaMax = Math.min(Math.PI / 4, (1 / 6) * curvatureKmax * maxDist * maxDist);

  // Compute Order Parameter R_g and coherence vector Z_g
  let sumCos = 0;
  let sumSin = 0;
  for (let i = 0; i < N; i++) {
    sumCos += Math.cos(initialAgents[i].phase);
    sumSin += Math.sin(initialAgents[i].phase);
  }
  const orderParameterRg = Math.sqrt(sumCos * sumCos + sumSin * sumSin) / N;
  const avgPhase = Math.atan2(sumSin, sumCos);
  const coherenceVectorZg: Vector3D = [
    orderParameterRg * Math.cos(avgPhase),
    orderParameterRg * Math.sin(avgPhase),
    0
  ];

  // Update phases
  const updatedPhases: number[] = [];
  for (let i = 0; i < N; i++) {
    const omega_i = initialAgents[i].naturalFrequency;
    let couplingTorque = 0;

    for (let j = 0; j < N; j++) {
      if (i === j) continue;
      // Geometric holonomy phase shift delta_ij^g from Levi-Civita connection (Eq. 2.15)
      // Triangle area approximated by cross product with barycenter
      const v_qi = vec3.sub(q[i], barycenter);
      const v_qj = vec3.sub(q[j], barycenter);
      const triArea = vec3.norm(vec3.cross(v_qi, v_qj)) * 0.5;
      const delta_ij = Math.min(deltaMax, curvatureKmax * triArea);

      // Frustrated Kuramoto interaction: sin(Phi_j - Phi_i - delta_ij^g)
      couplingTorque += Math.sin(initialAgents[j].phase - initialAgents[i].phase - delta_ij);
    }

    const dPhi = omega_i + (Ksync / N) * couplingTorque;
    let newPhase = initialAgents[i].phase + dPhi * dt;
    // Keep in [0, 2*pi)
    newPhase = ((newPhase % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    updatedPhases.push(newPhase);
  }

  // 2. BAOAB Langevin Thermostat (if enabled)
  const updatedMomenta: Vector3D[] = [];
  for (let i = 0; i < N; i++) {
    if (!enableLangevin || gamma0 <= 0) {
      updatedMomenta.push(p[i]);
      continue;
    }

    // gamma(R_g): increases damping when synchronized to lock trajectory
    const gammaEff = gamma0 * (1 + 0.5 * orderParameterRg);
    const c1 = Math.exp(-gammaEff * dt);
    const c2 = Math.sqrt(1 - c1 * c1) * Math.sqrt(2 * initialAgents[i].mass * kBTsynth);

    // Standard Gaussian random numbers (Box-Muller)
    const u1 = Math.max(1e-10, Math.random());
    const u2 = Math.random();
    const u3 = Math.max(1e-10, Math.random());
    const u4 = Math.random();
    const z1 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const z2 = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2);
    const z3 = Math.sqrt(-2 * Math.log(u3)) * Math.cos(2 * Math.PI * u4);

    const noise: Vector3D = [z1 * c2, z2 * c2, z3 * c2];
    const p_damped = vec3.scale(p[i], c1);
    updatedMomenta.push(vec3.add(p_damped, noise));
  }

  return {
    updatedMomenta,
    updatedPhases,
    orderParameterRg,
    coherenceVectorZg
  };
}
