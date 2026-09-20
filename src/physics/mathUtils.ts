import { Vector3D } from '../types';

export const vec3 = {
  create: (x = 0, y = 0, z = 0): Vector3D => [x, y, z],
  
  clone: (v: Vector3D): Vector3D => [v[0], v[1], v[2]],

  add: (a: Vector3D, b: Vector3D): Vector3D => [
    a[0] + b[0],
    a[1] + b[1],
    a[2] + b[2]
  ],

  sub: (a: Vector3D, b: Vector3D): Vector3D => [
    a[0] - b[0],
    a[1] - b[1],
    a[2] - b[2]
  ],

  scale: (v: Vector3D, s: number): Vector3D => [
    v[0] * s,
    v[1] * s,
    v[2] * s
  ],

  dot: (a: Vector3D, b: Vector3D): number => 
    a[0] * b[0] + a[1] * b[1] + a[2] * b[2],

  cross: (a: Vector3D, b: Vector3D): Vector3D => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ],

  normSq: (v: Vector3D): number => 
    v[0] * v[0] + v[1] * v[1] + v[2] * v[2],

  norm: (v: Vector3D): number => 
    Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]),

  dist: (a: Vector3D, b: Vector3D): number => {
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];
    const dz = a[2] - b[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  },

  normalize: (v: Vector3D): Vector3D => {
    const n = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    if (n < 1e-12) return [0, 0, 1];
    return [v[0] / n, v[1] / n, v[2] / n];
  },

  lerp: (a: Vector3D, b: Vector3D, t: number): Vector3D => [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t
  ]
};

/**
 * Rodrigues' rotation formula for SO(3) Lie-group internal spin precession:
 * S(t + dt) = cos(theta) * S + sin(theta) * (Omega_hat x S) + (1 - cos(theta)) * (Omega_hat . S) * Omega_hat
 * Exactly preserves ||S|| = const to machine precision.
 */
export function rodriguesRotation(S: Vector3D, Omega: Vector3D, dt: number): Vector3D {
  const omegaNorm = vec3.norm(Omega);
  if (omegaNorm < 1e-14) return vec3.clone(S);

  const theta = omegaNorm * dt;
  const omegaHat = vec3.scale(Omega, 1 / omegaNorm);
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);

  const term1 = vec3.scale(S, cosT);
  const crossTerm = vec3.cross(omegaHat, S);
  const term2 = vec3.scale(crossTerm, sinT);
  const dotTerm = vec3.dot(omegaHat, S);
  const term3 = vec3.scale(omegaHat, (1 - cosT) * dotTerm);

  return vec3.add(vec3.add(term1, term2), term3);
}

/**
 * Orthonormal basis {e1, e2} spanning the plane orthogonal to observer projection vector n in S^2.
 */
export function getProjectionBasis(n: Vector3D): { e1: Vector3D; e2: Vector3D } {
  const normN = vec3.normalize(n);
  // Pick an arbitrary vector not collinear with n
  const aux: Vector3D = Math.abs(normN[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
  const e1 = vec3.normalize(vec3.cross(normN, aux));
  const e2 = vec3.cross(normN, e1);
  return { e1, e2 };
}

/**
 * Project 3D coordinate onto 2D plane P_n defined by observer vector n.
 */
export function projectToPlane(pos: Vector3D, n: Vector3D, basis?: { e1: Vector3D; e2: Vector3D }): [number, number] {
  const { e1, e2 } = basis || getProjectionBasis(n);
  return [vec3.dot(pos, e1), vec3.dot(pos, e2)];
}

/**
 * Kahan compensated summation accumulator to eliminate O(N) catastrophic floating-point cancellation.
 */
export class KahanAccumulator {
  private sum: number = 0;
  private c: number = 0;

  add(val: number): void {
    const y = val - this.c;
    const t = this.sum + y;
    this.c = (t - this.sum) - y;
    this.sum = t;
  }

  get value(): number {
    return this.sum;
  }

  reset(): void {
    this.sum = 0;
    this.c = 0;
  }
}
