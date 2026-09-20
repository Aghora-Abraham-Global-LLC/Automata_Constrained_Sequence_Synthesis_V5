import { AgentState, BN_State, BraidCrossing, DFATransitionEvent, Vector3D } from '../types';
import { vec3, getProjectionBasis } from './mathUtils';

export interface BraidAnalysisResult {
  nextState: BN_State;
  transitionEvent: DFATransitionEvent | null;
  hierarchyRatio: number;
  r_in: number;
  r_out: number;
  newCrossings: BraidCrossing[];
  braidWord: string;
  windingNumbers: Record<string, number>;
  isotropicComplexity: number;
}

export class BraidDFATracker {
  private currentState: BN_State = BN_State.S0_HIERARCHICAL;
  private prevProjectedPositions: [number, number][] = [];
  private accumulatedCrossings: BraidCrossing[] = [];
  private windingAccumulators: Record<string, number> = {};
  private crossingCounter = 0;
  private swapParity = 0;

  constructor(initialState: BN_State = BN_State.S0_HIERARCHICAL) {
    this.currentState = initialState;
  }

  reset(initialState: BN_State = BN_State.S0_HIERARCHICAL) {
    this.currentState = initialState;
    this.prevProjectedPositions = [];
    this.accumulatedCrossings = [];
    this.windingAccumulators = {};
    this.crossingCounter = 0;
    this.swapParity = 0;
  }

  getState(): BN_State {
    return this.currentState;
  }

  getCrossings(): BraidCrossing[] {
    return this.accumulatedCrossings;
  }

  /**
   * Evaluates the multi-agent geometry, Artin braid crossings, winding numbers,
   * and steps the Deterministic Finite Automaton (B_N-DFA) with strict hysteresis (2.5, 8.0)
   */
  update(
    agents: AgentState[],
    observerVector: Vector3D,
    criticalRadius: number,
    escapeVelocity: number,
    currentTime: number,
    stepIndex: number
  ): BraidAnalysisResult {
    const N = agents.length;
    let transitionEvent: DFATransitionEvent | null = null;
    const newCrossings: BraidCrossing[] = [];

    // 1. Calculate Pairwise Distances and Hierarchy Ratio
    let r_min = Infinity;
    let corePair: [number, number] = [0, 1];
    const distMatrix: number[][] = Array.from({ length: N }, () => Array(N).fill(0));

    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        const d = vec3.dist(agents[i].q, agents[j].q);
        distMatrix[i][j] = d;
        distMatrix[j][i] = d;
        if (d < r_min) {
          r_min = d;
          corePair = [i, j];
        }
      }
    }

    const r_in = r_min;
    let r_out = Infinity;
    let tertiaryAgent = -1;

    for (let k = 0; k < N; k++) {
      if (k !== corePair[0] && k !== corePair[1]) {
        const dCore = 0.5 * (distMatrix[k][corePair[0]] + distMatrix[k][corePair[1]]);
        if (dCore < r_out) {
          r_out = dCore;
          tertiaryAgent = k;
        }
      }
    }

    if (tertiaryAgent === -1) {
      r_out = r_in * 3.0; // fallback for N=2
    }

    const hierarchyRatio = Math.max(0.1, r_out / Math.max(r_in, 1e-5));

    // 2. Observer Projection onto P_n
    const basis = getProjectionBasis(observerVector);
    const currentProjected: [number, number][] = agents.map(a => [
      vec3.dot(a.q, basis.e1),
      vec3.dot(a.q, basis.e2)
    ]);

    // 3. Winding Number increments & Crossing Detection
    if (this.prevProjectedPositions.length === N) {
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const key = `${i}-${j}`;
          // Relative coordinates at previous step and current step
          const dx0 = this.prevProjectedPositions[i][0] - this.prevProjectedPositions[j][0];
          const dy0 = this.prevProjectedPositions[i][1] - this.prevProjectedPositions[j][1];
          const dx1 = currentProjected[i][0] - currentProjected[j][0];
          const dy1 = currentProjected[i][1] - currentProjected[j][1];

          // Equation (3.3): Phase-unwrapped azimuth increment
          const cross2D = dx0 * dy1 - dy0 * dx1;
          const dot2D = dx0 * dx1 + dy0 * dy1;
          const dTheta = Math.atan2(cross2D, dot2D);

          const currentWinding = (this.windingAccumulators[key] || 0) + dTheta / (2 * Math.PI);
          this.windingAccumulators[key] = currentWinding;

          // Detect crossing when relative 1D coordinate changes sign
          // (strands cross in projection cylinder)
          const sign0 = Math.sign(dx0);
          const sign1 = Math.sign(dx1);
          if (sign0 !== 0 && sign1 !== 0 && sign0 !== sign1 && Math.abs(dy1) < 2.5 * r_in) {
            // Determine over/under crossing using line-of-sight depth (dot product with observer n)
            const depthI = vec3.dot(agents[i].q, observerVector);
            const depthJ = vec3.dot(agents[j].q, observerVector);
            const sign = depthI > depthJ ? 1 : -1;
            const strandIndex = Math.min(i, j) + 1;
            const symbol = sign > 0 ? `σ${strandIndex}` : `σ${strandIndex}⁻¹`;

            const crossing: BraidCrossing = {
              step: stepIndex,
              time: currentTime,
              strandA: i,
              strandB: j,
              sign,
              symbol
            };

            this.accumulatedCrossings.push(crossing);
            if (this.accumulatedCrossings.length > 50) this.accumulatedCrossings.shift();
            newCrossings.push(crossing);
            this.crossingCounter++;
            this.swapParity = (this.swapParity + 1) % 2;
          }
        }
      }
    }
    this.prevProjectedPositions = currentProjected;

    // 4. Calculate Maximum Agent Velocity for Escape Bound
    let maxVelocity = 0;
    for (let i = 0; i < N; i++) {
      const v = vec3.norm(agents[i].p) / agents[i].mass;
      if (v > maxVelocity) maxVelocity = v;
    }

    // 5. DFA Transition Logic (Table 1 of paper)
    const oldState = this.currentState;
    let targetState = oldState;
    let trigger = '';
    let details = '';

    // Condition 1: Critical Coalescence Sink S4 (r_in <= r_c)
    if (r_in <= criticalRadius && oldState !== BN_State.S4_COALESCENCE) {
      targetState = BN_State.S4_COALESCENCE;
      trigger = 'Critical Boundary r ≤ r_c';
      details = `Core inter-agent distance r_in = ${r_in.toFixed(3)} ≤ critical threshold ${criticalRadius.toFixed(3)}. Converged to Coalescence Sink.`;
    }
    // Condition 2: Escape Bound S3 (v >= v_esc while in resonant/exchange)
    else if (
      maxVelocity >= escapeVelocity &&
      r_out > 2.5 * criticalRadius &&
      (oldState === BN_State.S1_RESONANT || oldState === BN_State.S2_EXCHANGE)
    ) {
      targetState = BN_State.S3_ESCAPE;
      trigger = 'Escape Bound v ≥ v_esc';
      details = `Agent velocity ${maxVelocity.toFixed(2)} exceeded escape velocity ${escapeVelocity.toFixed(2)}. Trajectory is asymptotically unbound.`;
    }
    // Normal Hysteresis and Braid Transitions:
    else if (oldState === BN_State.S0_HIERARCHICAL) {
      if (hierarchyRatio < 2.5) {
        targetState = BN_State.S1_RESONANT;
        trigger = 'Hierarchy Collapse (H_ratio < 2.5)';
        details = `Hierarchy ratio collapsed to ${hierarchyRatio.toFixed(2)} (< 2.5 threshold). Entering resonant 3-body chaos.`;
      }
    } else if (oldState === BN_State.S1_RESONANT) {
      if (hierarchyRatio >= 8.0) {
        targetState = BN_State.S0_HIERARCHICAL;
        trigger = 'Stable Hierarchy Restored (H_ratio ≥ 8.0)';
        details = `Hierarchy ratio expanded to ${hierarchyRatio.toFixed(2)} (≥ 8.0 hysteresis threshold). Restored stable hierarchical orbit.`;
      } else if (newCrossings.length > 0 && this.swapParity === 1) {
        targetState = BN_State.S2_EXCHANGE;
        trigger = 'Topological Swap (Odd Parity Crossing)';
        details = `Detected Artin crossing ${newCrossings[0].symbol}. Agent core swap initiated.`;
      }
    } else if (oldState === BN_State.S2_EXCHANGE) {
      if (hierarchyRatio >= 8.0) {
        targetState = BN_State.S0_HIERARCHICAL;
        trigger = 'Stable Hierarchy Restored';
        details = `Swapped configuration settled into stable hierarchy (H_ratio = ${hierarchyRatio.toFixed(2)}).`;
      } else if (newCrossings.length > 0 && this.swapParity === 0) {
        targetState = BN_State.S1_RESONANT;
        trigger = 'Topological Swap Resolved';
        details = `Even parity crossing restored exchange channel to resonant chaos.`;
      }
    }

    if (targetState !== oldState) {
      this.currentState = targetState;
      transitionEvent = {
        id: `trans-${stepIndex}-${Date.now()}`,
        timestamp: currentTime,
        fromState: oldState,
        toState: targetState,
        trigger,
        details
      };
    }

    // Build Braid Word representation
    const braidWord = this.accumulatedCrossings.length === 0
      ? 'e'
      : this.accumulatedCrossings.map(c => c.symbol).join(' · ');

    // Isotropic Orientation Complexity Estimate
    let sumWinding = 0;
    let countWinding = 0;
    for (const key in this.windingAccumulators) {
      sumWinding += Math.abs(this.windingAccumulators[key]);
      countWinding++;
    }
    const isotropicComplexity = countWinding > 0 ? sumWinding / countWinding : 0;

    return {
      nextState: this.currentState,
      transitionEvent,
      hierarchyRatio,
      r_in,
      r_out,
      newCrossings,
      braidWord,
      windingNumbers: { ...this.windingAccumulators },
      isotropicComplexity
    };
  }
}
