import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  StepForward,
  Activity,
  Layers,
  GitCommit,
  Compass,
  LineChart,
  BookOpen,
  ShieldCheck,
  AlertTriangle,
  Zap,
  Bookmark,
  Lock,
  Cpu
} from 'lucide-react';
import { BN_State, IntegratorType, SimulationMetrics, SimulationParams } from '../types';

interface HeaderProps {
  isRunning: boolean;
  onTogglePlay: () => void;
  onStep: () => void;
  onReset: () => void;
  metrics: SimulationMetrics;
  params: SimulationParams;
  activeTab: 'viewport' | 'braid' | 'dfa' | 'kuramoto' | 'diagnostics' | 'paper';
  onSelectTab: (tab: 'viewport' | 'braid' | 'dfa' | 'kuramoto' | 'diagnostics' | 'paper') => void;
  onSelectPreset: (presetId: string) => void;
  selectedPresetId: string;
  onOpenCitation: () => void;
  onOpenArchitecture: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isRunning,
  onTogglePlay,
  onStep,
  onReset,
  metrics,
  params,
  activeTab,
  onSelectTab,
  onSelectPreset,
  selectedPresetId,
  onOpenCitation,
  onOpenArchitecture
}) => {
  const getDFAColor = (state: BN_State) => {
    switch (state) {
      case BN_State.S0_HIERARCHICAL:
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case BN_State.S1_RESONANT:
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case BN_State.S2_EXCHANGE:
        return 'bg-purple-500/20 text-purple-400 border-purple-500/40';
      case BN_State.S3_ESCAPE:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
      case BN_State.S4_COALESCENCE:
        return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
    }
  };

  const getDFALabel = (state: BN_State) => {
    switch (state) {
      case BN_State.S0_HIERARCHICAL:
        return 'S0 · Hierarchical';
      case BN_State.S1_RESONANT:
        return 'S1 · Resonant Chaos';
      case BN_State.S2_EXCHANGE:
        return 'S2 · Topological Swap';
      case BN_State.S3_ESCAPE:
        return 'S3 · Escape Channel';
      case BN_State.S4_COALESCENCE:
        return 'S4 · Coalescence Sink';
    }
  };

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-50">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-4">
        {/* Title & Paper Reference */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-sm shadow-cyan-500/20">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-slate-100 text-sm md:text-base tracking-tight">
                Phase-Synchronized Trajectory Optimization
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                1st Reference Implementation · v5.0
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Adaptive Extended Symplectic Control & Planar Braid Complexity · Official Validation of Monograph v5.0
            </p>
          </div>
        </div>

        {/* Live Status Indicators */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Zero API Offline Guarantee Badge */}
          <button
            id="btn-offline-badge"
            onClick={onOpenArchitecture}
            className="px-2.5 py-1 rounded-full text-xs font-mono bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 transition flex items-center gap-1.5 cursor-pointer"
            title="Click to inspect: 100% Client-Side TypeScript/Wasm · Zero External API Tokens · No Cloud Cost"
          >
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">0 API Calls · Offline Symplectic</span>
            <span className="sm:hidden">0 API</span>
          </button>

          {/* Zenodo DOI Badge */}
          <button
            id="btn-doi-badge"
            onClick={onOpenCitation}
            className="px-2.5 py-1 rounded-full text-xs font-mono bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 transition flex items-center gap-1.5 cursor-pointer"
            title="Click to view permanent Zenodo DOI & BibTeX citation"
          >
            <Bookmark className="w-3.5 h-3.5 text-cyan-400" />
            <span>DOI: 10.5281/zenodo.22851432</span>
          </button>

          {/* DFA State Badge */}
          <div
            id="dfa-badge"
            className={`px-2.5 py-1 rounded-full text-xs font-mono font-semibold border flex items-center gap-1.5 ${getDFAColor(
              metrics.activeDFAState
            )}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            <span>{getDFALabel(metrics.activeDFAState)}</span>
          </div>

          {/* CFL Stability Badge */}
          <div
            id="cfl-badge"
            className={`px-2.5 py-1 rounded-full text-xs font-mono border flex items-center gap-1.5 ${
              metrics.cflRatio < Math.PI / 2
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
            }`}
            title="CFL stability: Δτ · ω(R_β) must remain < 2 (strictly ≤ π/2)"
          >
            {metrics.cflRatio < Math.PI / 2 ? (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            )}
            <span>CFL: {metrics.cflRatio.toFixed(3)}</span>
          </div>

          {/* Energy Drift Badge */}
          <div
            id="energy-badge"
            className="px-2.5 py-1 rounded-full text-xs font-mono bg-slate-800/80 border border-slate-700 text-slate-300 hidden md:flex items-center gap-1.5"
            title="Energy fractional error |ΔH / H0|"
          >
            <span className="text-slate-400">|ΔH/H₀|:</span>
            <span
              className={
                metrics.energyDrift < 1e-5
                  ? 'text-cyan-300 font-semibold'
                  : 'text-amber-300 font-semibold'
              }
            >
              {metrics.energyDrift.toExponential(2)}
            </span>
          </div>

          {/* Controls: Play, Step, Reset */}
          <div className="flex items-center bg-slate-800/90 border border-slate-700 rounded-lg p-0.5">
            <button
              id="btn-play-toggle"
              onClick={onTogglePlay}
              className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition ${
                isRunning
                  ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
              }`}
              title={isRunning ? 'Pause Simulation' : 'Run Simulation'}
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            </button>
            <button
              id="btn-step"
              onClick={onStep}
              disabled={isRunning}
              className="p-1.5 rounded-md text-slate-300 hover:text-slate-100 hover:bg-slate-700/50 disabled:opacity-40 transition"
              title="Single Symplectic Sub-Step"
            >
              <StepForward className="w-4 h-4" />
            </button>
            <button
              id="btn-reset"
              onClick={onReset}
              className="p-1.5 rounded-md text-slate-300 hover:text-rose-300 hover:bg-slate-700/50 transition"
              title="Reset Initial Conditions"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between border-t border-slate-800/80 text-xs overflow-x-auto">
        <nav className="flex space-x-1 py-1">
          <button
            id="tab-viewport"
            onClick={() => onSelectTab('viewport')}
            className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition whitespace-nowrap ${
              activeTab === 'viewport'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>3D Orbital Viewport</span>
          </button>

          <button
            id="tab-braid"
            onClick={() => onSelectTab('braid')}
            className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition whitespace-nowrap ${
              activeTab === 'braid'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>2D Braid Cylinder (B<sub>N</sub>)</span>
          </button>

          <button
            id="tab-dfa"
            onClick={() => onSelectTab('dfa')}
            className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition whitespace-nowrap ${
              activeTab === 'dfa'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <GitCommit className="w-3.5 h-3.5" />
            <span>Topological Automaton (DFA)</span>
          </button>

          <button
            id="tab-kuramoto"
            onClick={() => onSelectTab('kuramoto')}
            className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition whitespace-nowrap ${
              activeTab === 'kuramoto'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Covariant Kuramoto & Holonomy</span>
          </button>

          <button
            id="tab-diagnostics"
            onClick={() => onSelectTab('diagnostics')}
            className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition whitespace-nowrap ${
              activeTab === 'diagnostics'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <LineChart className="w-3.5 h-3.5" />
            <span>Symplectic Benchmarks</span>
          </button>

          <button
            id="tab-paper"
            onClick={() => onSelectTab('paper')}
            className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition whitespace-nowrap ${
              activeTab === 'paper'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Paper Theorems & Formulations</span>
          </button>
        </nav>

        {/* Quick Preset Selector */}
        <div className="hidden lg:flex items-center gap-2 py-1 pl-4">
          <span className="text-slate-400 text-[11px] whitespace-nowrap">Benchmark Scenario:</span>
          <select
            id="preset-select"
            value={selectedPresetId}
            onChange={e => onSelectPreset(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-md px-2 py-1 focus:outline-none focus:border-cyan-500"
          >
            <option value="paper-benchmark-v5">Section 5.1 3-Body Resonance (m=50,30,10)</option>
            <option value="figure-eight-braid">Figure-Eight Periodic Braid (B3 Word)</option>
            <option value="chaotic-coalescence">Destabilization to Coalescence (S0→S1→S4)</option>
            <option value="topological-exchange">Topological Exchange Dance (S1⇌S2)</option>
            <option value="curved-kuramoto-swarm">Curved Manifold Frustrated Swarm (N=6)</option>
          </select>
        </div>
      </div>
    </header>
  );
};
