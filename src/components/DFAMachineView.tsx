import React from 'react';
import { BN_State, DFATransitionEvent, SimulationMetrics, SimulationParams } from '../types';
import { GitCommit, ShieldAlert, ArrowRight, CheckCircle2, History, AlertCircle, Info } from 'lucide-react';

interface DFAMachineViewProps {
  metrics: SimulationMetrics;
  params: SimulationParams;
  transitionHistory: DFATransitionEvent[];
}

export const DFAMachineView: React.FC<DFAMachineViewProps> = ({
  metrics,
  params,
  transitionHistory
}) => {
  const currentState = metrics.activeDFAState;
  const H_ratio = metrics.hierarchyRatio;

  // State node definitions with canvas positions
  const states = [
    {
      id: BN_State.S0_HIERARCHICAL,
      name: 'S0 · Hierarchical',
      subtitle: 'Bound Planetary/Hierarchical Orbit',
      color: '#10b981', // Emerald
      bgColor: 'bg-emerald-500/15',
      borderColor: 'border-emerald-500/40',
      activeColor: 'text-emerald-400',
      x: 160,
      y: 110
    },
    {
      id: BN_State.S1_RESONANT,
      name: 'S1 · Resonant Chaos',
      subtitle: 'Chaotic 3-Body Periastron Dynamics',
      color: '#f59e0b', // Amber
      bgColor: 'bg-amber-500/15',
      borderColor: 'border-amber-500/40',
      activeColor: 'text-amber-400',
      x: 440,
      y: 110
    },
    {
      id: BN_State.S2_EXCHANGE,
      name: 'S2 · Topological Swap',
      subtitle: 'Partner Exchange (Odd-Parity Braid)',
      color: '#a855f7', // Purple
      bgColor: 'bg-purple-500/15',
      borderColor: 'border-purple-500/40',
      activeColor: 'text-purple-400',
      x: 720,
      y: 110
    },
    {
      id: BN_State.S3_ESCAPE,
      name: 'S3 · Escape Channel',
      subtitle: 'Asymptotically Unbound (v ≥ v_esc)',
      color: '#3b82f6', // Blue
      bgColor: 'bg-blue-500/15',
      borderColor: 'border-blue-500/40',
      activeColor: 'text-blue-400',
      x: 300,
      y: 290
    },
    {
      id: BN_State.S4_COALESCENCE,
      name: 'S4 · Coalescence Sink',
      subtitle: 'Critical Boundary (r ≤ r_c)',
      color: '#f43f5e', // Rose
      bgColor: 'bg-rose-500/15',
      borderColor: 'border-rose-500/40',
      activeColor: 'text-rose-400',
      x: 580,
      y: 290
    }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Visual State Diagram & Hysteresis Gauge (Left 2 cols) */}
      <div className="lg:col-span-2 bg-slate-950 rounded-xl border border-slate-800 p-4 flex flex-col gap-5 shadow-xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-800 gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <GitCommit className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <span>Topological Automaton State Machine</span>
                <span className="font-serif-math italic text-xs text-cyan-300">
                  A_braid = (Q, Σ_in, δ, q₀, F)
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                5-State Deterministic Finite Automaton with strict non-chattering hysteresis gap (2.5, 8.0)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300">
              Theorem 4.1: <span className="text-emerald-400 font-semibold">Deterministic & Complete</span>
            </span>
          </div>
        </div>

        {/* SVG State Machine Graph */}
        <div className="relative w-full h-[370px] bg-slate-900/60 rounded-xl border border-slate-800/80 p-2 overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 880 370">
            {/* Background Grid Pattern */}
            <defs>
              <pattern id="grid-dfa" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(51, 65, 85, 0.15)" strokeWidth="1" />
              </pattern>
              <marker id="arrow" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
              </marker>
              <marker id="arrow-active" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8" />
              </marker>
              <marker id="arrow-rose" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#f43f5e" />
              </marker>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-dfa)" />

            {/* Transition Arcs */}
            {/* S0 -> S1 (Collapse) */}
            <path
              d="M 230 100 Q 300 70 370 100"
              fill="none"
              stroke={currentState === BN_State.S1_RESONANT ? '#38bdf8' : '#475569'}
              strokeWidth="2"
              markerEnd="url(#arrow)"
            />
            <text x="300" y="70" fill="#94a3b8" fontSize="10" textAnchor="middle" fontFamily="monospace">
              H_ratio &lt; 2.5
            </text>

            {/* S1 -> S0 (Stabilize) */}
            <path
              d="M 370 120 Q 300 150 230 120"
              fill="none"
              stroke={currentState === BN_State.S0_HIERARCHICAL ? '#38bdf8' : '#475569'}
              strokeWidth="2"
              markerEnd="url(#arrow)"
            />
            <text x="300" y="155" fill="#94a3b8" fontSize="10" textAnchor="middle" fontFamily="monospace">
              H_ratio ≥ 8.0
            </text>

            {/* S1 -> S2 (Topological Swap) */}
            <path
              d="M 510 100 Q 580 70 650 100"
              fill="none"
              stroke={currentState === BN_State.S2_EXCHANGE ? '#a855f7' : '#475569'}
              strokeWidth="2"
              markerEnd="url(#arrow)"
            />
            <text x="580" y="70" fill="#c084fc" fontSize="10" textAnchor="middle" fontFamily="monospace">
              Odd Swap σ_k
            </text>

            {/* S2 -> S1 (Swap resolves) */}
            <path
              d="M 650 120 Q 580 150 510 120"
              fill="none"
              stroke={currentState === BN_State.S1_RESONANT ? '#a855f7' : '#475569'}
              strokeWidth="2"
              markerEnd="url(#arrow)"
            />
            <text x="580" y="155" fill="#c084fc" fontSize="10" textAnchor="middle" fontFamily="monospace">
              Even Parity
            </text>

            {/* S1 -> S4 (Coalescence Sink) */}
            <path
              d="M 460 150 L 560 250"
              fill="none"
              stroke={currentState === BN_State.S4_COALESCENCE ? '#f43f5e' : '#475569'}
              strokeWidth="2"
              markerEnd="url(#arrow-rose)"
            />
            <text x="525" y="195" fill="#fb7185" fontSize="10" fontFamily="monospace">
              r ≤ r_c
            </text>

            {/* S1 -> S3 (Escape) */}
            <path
              d="M 420 150 L 320 250"
              fill="none"
              stroke={currentState === BN_State.S3_ESCAPE ? '#3b82f6' : '#475569'}
              strokeWidth="2"
              markerEnd="url(#arrow)"
            />
            <text x="345" y="195" fill="#60a5fa" fontSize="10" fontFamily="monospace">
              v ≥ v_esc
            </text>

            {/* State Nodes */}
            {states.map(state => {
              const isActive = currentState === state.id;
              return (
                <g key={state.id} transform={`translate(${state.x}, ${state.y})`}>
                  {/* Pulsing halo when active */}
                  {isActive && (
                    <circle
                      r="48"
                      fill="none"
                      stroke={state.color}
                      strokeWidth="2"
                      opacity="0.4"
                      className="animate-ping"
                    />
                  )}

                  {/* Main Node Circle */}
                  <circle
                    r="40"
                    fill={isActive ? '#0f172a' : '#090d16'}
                    stroke={isActive ? state.color : '#334155'}
                    strokeWidth={isActive ? '3' : '1.5'}
                    className="transition-all duration-300"
                  />

                  {/* Node Label */}
                  <text
                    y="-6"
                    textAnchor="middle"
                    fill={isActive ? '#ffffff' : '#94a3b8'}
                    fontSize="13"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {state.id}
                  </text>
                  <text
                    y="14"
                    textAnchor="middle"
                    fill={isActive ? state.color : '#64748b'}
                    fontSize="10"
                    fontWeight="500"
                  >
                    {state.name.split('·')[1].trim()}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Hysteresis Bar Gauge */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-slate-200">
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              <span>Hierarchy Ratio H<sub>ratio</sub> = r<sub>out</sub> / r<sub>in</sub></span>
            </div>
            <div className="font-mono text-cyan-300 font-bold">
              Current: {H_ratio.toFixed(2)}
            </div>
          </div>

          {/* Bar Diagram with Hysteresis Gap */}
          <div className="relative w-full h-8 bg-slate-950 rounded-lg overflow-hidden border border-slate-800 p-1 flex">
            {/* Zone 1: Resonant Chaos [0, 2.5) */}
            <div
              className="h-full bg-amber-500/20 border-r border-amber-500/40 flex items-center justify-center text-[10px] font-mono text-amber-300"
              style={{ width: '25%' }}
              title="Collapsed Hierarchy (H_ratio < 2.5) triggers S1 Resonant Chaos"
            >
              Chaos &lt; 2.5
            </div>

            {/* Zone 2: Hysteresis Deadband [2.5, 8.0) */}
            <div
              className="h-full bg-slate-800/60 border-r border-slate-700 flex items-center justify-center text-[10px] font-mono text-slate-400"
              style={{ width: '55%' }}
              title="Hysteresis Boundary Gap (2.5, 8.0): State invariant, zero Zeno chatter!"
            >
              ★ Hysteresis Gap (2.5 — 8.0) [Zero Zeno Chatter]
            </div>

            {/* Zone 3: Stable Hierarchy [8.0, 10+) */}
            <div
              className="h-full bg-emerald-500/20 flex items-center justify-center text-[10px] font-mono text-emerald-300"
              style={{ width: '20%' }}
              title="Stable Hierarchy (H_ratio ≥ 8.0) restores S0"
            >
              Stable ≥ 8.0
            </div>

            {/* Current Ratio Cursor */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-cyan-400 shadow-md shadow-cyan-500/50 transition-all duration-150"
              style={{
                left: `${Math.min(98, Math.max(2, (H_ratio / 10) * 100))}%`
              }}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 -translate-x-[3.5px] -translate-y-[2px]" />
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>0.0 (Extreme Proximity)</span>
            <span>2.5 (Collapse Threshold)</span>
            <span>8.0 (Stabilization Threshold)</span>
            <span>10.0+ (Separated Binary)</span>
          </div>
        </div>
      </div>

      {/* Right Col: Active State Detail & Transition Event Log */}
      <div className="flex flex-col gap-5">
        {/* Active State Card */}
        <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-4 flex flex-col gap-3 shadow-xl">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Current Automaton State
          </div>

          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center font-mono text-xl font-bold border"
              style={{
                backgroundColor: states.find(s => s.id === currentState)?.color + '22',
                borderColor: states.find(s => s.id === currentState)?.color + '66',
                color: states.find(s => s.id === currentState)?.color
              }}
            >
              {currentState}
            </div>
            <div>
              <div className="text-base font-bold text-slate-100">
                {states.find(s => s.id === currentState)?.name}
              </div>
              <div className="text-xs text-slate-400">
                {states.find(s => s.id === currentState)?.subtitle}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-xs text-slate-300 space-y-1.5 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">r_in (Core Cluster):</span>
              <span className="text-cyan-300">{metrics.trueMinDistance.toFixed(3)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">r_c (Coalescence limit):</span>
              <span className="text-rose-400">{params.criticalRadius.toFixed(3)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">v_esc (Escape limit):</span>
              <span className="text-blue-400">{params.escapeVelocity.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Transition Event Log */}
        <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-4 flex flex-col gap-3 shadow-xl flex-1">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
              <History className="w-4 h-4 text-cyan-400" />
              <span>DFA Transition Event History</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              {transitionHistory.length} events
            </span>
          </div>

          <div className="space-y-2 max-h-[310px] overflow-y-auto pr-1">
            {transitionHistory.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 italic">
                No state transitions logged yet. System operating stably in {currentState}.
              </div>
            ) : (
              transitionHistory.map(evt => (
                <div
                  key={evt.id}
                  className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex flex-col gap-1 text-xs font-mono"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold">
                      <span className="text-slate-400">{evt.fromState}</span>
                      <ArrowRight className="w-3 h-3 text-cyan-400" />
                      <span className="text-cyan-300">{evt.toState}</span>
                    </div>
                    <span className="text-[10px] text-slate-500">t={evt.timestamp.toFixed(2)}s</span>
                  </div>
                  <div className="text-[11px] text-amber-300 font-medium">{evt.trigger}</div>
                  <div className="text-[10px] text-slate-400 font-sans leading-tight">
                    {evt.details}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
