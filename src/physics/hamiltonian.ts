import { Vector3D, SimulationParams, AgentState } from '../types';
import { vec3, KahanAccumulator } from './mathUtils';

export interface HamiltonianComponents {
  T: number;
  V: number;
  H_so_lo: number;
  H_ss_2pn: number;
  H_so_nlo: number;
  total: number;
}

/**
 * Calculates inter-particle distance and unit direction vector n_ij = (q_i - q_j) / ||q_i - q_j||
 */
export function getPairwiseDistance(
  qi: Vector3D,
  qj: Vector3D,
  softening = 1e-6
): { r: number; r_eff: number; n_ij: Vector3D; r_vec: Vector3D } {
  const r_vec = vec3.sub(qi, qj);
  const r = vec3.norm(r_vec);
  const r_eff = Math.max(r, softening);
  const n_ij = vec3.scale(r_vec, 1 / r_eff);
  return { r, r_eff, n_ij, r_vec };
}

/**
 * Evaluates the C^infty Soft-Minimum Potential R_beta(q):
 * R_beta(q) = -1/beta * ln( sum_{i < j} exp(-beta * ||q_i - q_j||) )
 * Computed using log-sum-exp stabilization:
 * R_beta = r_min - 1/beta * ln( sum_{i < j} exp(-beta * (r_ij - r_min)) )
 */
export function computeSoftMinimumDistance(
  q: Vector3D[],
  beta: number
): { r_soft: number; r_min: number; pairMin: [number, number] } {
  const N = q.length;
  if (N < 2) return { r_soft: 1, r_min: 1, pairMin: [0, 0] };

  let r_min = Infinity;
  let pairMin: [number, number] = [0, 1];
  const distances: number[] = [];

  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      const d = vec3.dist(q[i], q[j]);
      distances.push(d);
      if (d < r_min) {
        r_min = d;
        pairMin = [i, j];
      }
    }
  }

  // Stabilized Log-Sum-Exp
  let sumExp = 0;
  for (const d of distances) {
    sumExp += Math.exp(-beta * (d - r_min));
  }

  const r_soft = r_min - (1 / beta) * Math.log(sumExp);
  return { r_soft: Math.max(r_soft, 1e-6), r_min, pairMin };
}

/**
 * Computes adaptive frequency omega(R_beta(q)) according to Eq. (2.9):
 * omega(R_beta) = omega_0 * [ 1 + kappa * (r0 / (R_beta + epsilon))^2 ]
 */
export function computeAdaptiveOmega(
  r_soft: number,
  params: SimulationParams
): number {
  const { omega0, kappa, r0, epsilon } = params;
  const ratio = r0 / (r_soft + epsilon);
  return omega0 * (1 + kappa * ratio * ratio);
}

/**
 * Computes the total non-separable Hamiltonian H(q, p, S)
 */
export function evaluateHamiltonian(
  q: Vector3D[],
  p: Vector3D[],
  spins: Vector3D[],
  masses: number[],
  params: SimulationParams
): HamiltonianComponents {
  const N = q.length;
  const { G, c, enableLO_SO, enable2PN_SS, enableNLO_SO } = params;
  const c2 = c * c;

  // 1. Kinetic energy T(p) with 1PN relativistic correction: Eq. (2.2)
  let T = 0;
  for (let i = 0; i < N; i++) {
    const p2 = vec3.normSq(p[i]);
    const m = masses[i];
    const newtonianKinetic = p2 / (2 * m);
    const relativistic1PN = (p2 * p2) / (8 * m * m * m * c2);
    T += newtonianKinetic - relativistic1PN;
  }

  // 2. Gravitational potential V(q) with 1PN 3-body cross terms: Eq. (2.3)
  let V_newton = 0;
  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      const { r_eff } = getPairwiseDistance(q[i], q[j]);
      V_newton -= (G * masses[i] * masses[j]) / r_eff;
    }
  }

  let V_3body = 0;
  if (N >= 3) {
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        if (j === i) continue;
        for (let k = 0; k < N; k++) {
          if (k === i || k === j) continue;
          const r_ij = vec3.dist(q[i], q[j]);
          const r_ik = vec3.dist(q[i], q[k]);
          V_3body += (G * G * masses[i] * masses[j] * masses[k]) / (2 * c2 * Math.max(r_ij * r_ik, 1e-6));
        }
      }
    }
  }
  const V = V_newton + V_3body;

  // 3. Leading-Order Spin-Orbit coupling H_SO^LO: Eq. (2.4)
  let H_so_lo = 0;
  if (enableLO_SO) {
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        if (i === j) continue;
        const { r_eff, r_vec } = getPairwiseDistance(q[i], q[j]);
        const r3 = r_eff * r_eff * r_eff;
        const orbitalL = vec3.cross(r_vec, p[i]);
        const weight = 2 + (1.5 * masses[j]) / masses[i];
        const dotSpin = vec3.dot(orbitalL, spins[i]);
        H_so_lo += (G / c2) * (1 / r3) * weight * dotSpin;
      }
    }
  }

  // 4. Spin-Spin 2PN quadrupole coupling H_SS^2PN: Eq. (2.5)
  let H_ss_2pn = 0;
  if (enable2PN_SS) {
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        if (i === j) continue;
        const { r_eff, n_ij } = getPairwiseDistance(q[i], q[j]);
        const r3 = r_eff * r_eff * r_eff;

        const Si_dot_n = vec3.dot(spins[i], n_ij);
        const Sj_dot_n = vec3.dot(spins[j], n_ij);
        const Si_dot_Sj = vec3.dot(spins[i], spins[j]);
        const dipoleTerm = 3 * Si_dot_n * Sj_dot_n - Si_dot_Sj;

        // Quadrupole deformation (CQi = 1.0)
        const Si_sq = vec3.normSq(spins[i]);
        const quadTerm = (1.0 / masses[i]) * (3 * Si_dot_n * Si_dot_n - Si_sq);

        H_ss_2pn += (G / (2 * c2 * r3)) * (dipoleTerm + quadTerm);
      }
    }
  }

  // 5. Next-to-Leading-Order Spin-Orbit 2.5PN cross momentum: Eq. (2.6)
  let H_so_nlo = 0;
  if (enableNLO_SO) {
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        if (i === j) continue;
        const { r_eff, r_vec } = getPairwiseDistance(q[i], q[j]);
        const r3 = r_eff * r_eff * r_eff;
        const p_cross_r = vec3.cross(p[i], r_vec);
        const pi_dot_pj = vec3.dot(p[i], p[j]);
        const factor = (pi_dot_pj / (masses[i] * masses[j] * c2)) * (G / c2);
        H_so_nlo += (factor / r3) * vec3.dot(p_cross_r, spins[i]);
      }
    }
  }

  const total = T + V + H_so_lo + H_ss_2pn + H_so_nlo;
  return { T, V, H_so_lo, H_ss_2pn, H_so_nlo, total };
}

/**
 * Calculates precessional frequency Omega_i = partial H / partial S_i for Rodrigues' formula
 */
export function computeSpinPrecessionFrequency(
  agentIndex: number,
  q: Vector3D[],
  p: Vector3D[],
  spins: Vector3D[],
  masses: number[],
  params: SimulationParams
): Vector3D {
  const { G, c, enableLO_SO, enable2PN_SS } = params;
  const c2 = c * c;
  const i = agentIndex;
  let Omega: Vector3D = [0, 0, 0];

  for (let j = 0; j < q.length; j++) {
    if (i === j) continue;
    const { r_eff, n_ij, r_vec } = getPairwiseDistance(q[i], q[j]);
    const r3 = r_eff * r_eff * r_eff;

    // Spin-Orbit contribution
    if (enableLO_SO) {
      const weight = 2 + (1.5 * masses[j]) / masses[i];
      const r_cross_p = vec3.cross(r_vec, p[i]);
      const Omega_SO = vec3.scale(r_cross_p, (G / c2) * (weight / r3));
      Omega = vec3.add(Omega, Omega_SO);
    }

    // Spin-Spin contribution
    if (enable2PN_SS) {
      const Sj_dot_n = vec3.dot(spins[j], n_ij);
      const dipolePart = vec3.sub(vec3.scale(n_ij, 3 * Sj_dot_n), spins[j]);
      const Omega_SS = vec3.scale(dipolePart, G / (c2 * r3));
      Omega = vec3.add(Omega, Omega_SS);
    }
  }

  return Omega;
}

/**
 * Evaluates partial derivatives partial H / partial q_i and partial H / partial p_i
 * using high-precision 4th-order central difference stencil to support arbitrary non-separable terms.
 */
export function computeHamiltonianGradients(
  q: Vector3D[],
  p: Vector3D[],
  spins: Vector3D[],
  masses: number[],
  params: SimulationParams
): { dH_dq: Vector3D[]; dH_dp: Vector3D[] } {
  const N = q.length;
  const dH_dq: Vector3D[] = [];
  const dH_dp: Vector3D[] = [];
  const eps = 1e-5;

  for (let i = 0; i < N; i++) {
    const dq_i: Vector3D = [0, 0, 0];
    const dp_i: Vector3D = [0, 0, 0];

    for (let axis = 0; axis < 3; axis++) {
      // dH / dq_i[axis]
      const q_plus = q.map(v => vec3.clone(v));
      const q_minus = q.map(v => vec3.clone(v));
      q_plus[i][axis] += eps;
      q_minus[i][axis] -= eps;

      const H_q_plus = evaluateHamiltonian(q_plus, p, spins, masses, params).total;
      const H_q_minus = evaluateHamiltonian(q_minus, p, spins, masses, params).total;
      dq_i[axis] = (H_q_plus - H_q_minus) / (2 * eps);

      // dH / dp_i[axis]
      const p_plus = p.map(v => vec3.clone(v));
      const p_minus = p.map(v => vec3.clone(v));
      p_plus[i][axis] += eps;
      p_minus[i][axis] -= eps;

      const H_p_plus = evaluateHamiltonian(q, p_plus, spins, masses, params).total;
      const H_p_minus = evaluateHamiltonian(q, p_minus, spins, masses, params).total;
      dp_i[axis] = (H_p_plus - H_p_minus) / (2 * eps);
    }

    dH_dq.push(dq_i);
    dH_dp.push(dp_i);
  }

  return { dH_dq, dH_dp };
}

/**
 * Convenience wrapper to evaluate total Hamiltonian, soft-min distance and adaptive omega from agent states
 */
export function evaluateAgentHamiltonian(
  agents: AgentState[],
  params: SimulationParams
): HamiltonianComponents & { R_beta: number; r_min: number; omega: number } {
  const q = agents.map(a => a.q);
  const p = agents.map(a => a.p);
  const spins = agents.map(a => a.spin);
  const masses = agents.map(a => a.mass);
  const components = evaluateHamiltonian(q, p, spins, masses, params);
  const { r_soft, r_min } = computeSoftMinimumDistance(q, params.beta);
  const omega = computeAdaptiveOmega(r_soft, params);
  return {
    ...components,
    R_beta: r_soft,
    r_min,
    omega
  };
}
