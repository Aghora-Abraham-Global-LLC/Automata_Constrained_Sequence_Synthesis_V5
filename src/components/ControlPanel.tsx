import React from 'react';
import {
  AgentState,
  IntegratorType,
  SimulationParams
} from '../types';
import {
  Sliders,
  Cpu,
  Shield,
  Activity,
  User,
  Plus,
  Trash2,
  HelpCircle,
  Zap
} from 'lucide-react';

interface ControlPanelProps {
  params: SimulationParams;
  agents: AgentState[];
  onUpdateParams: (newParams: Partial<SimulationParams>) => void;
  onUpdateAgent: (agentIndex: number, updatedAgent: Partial<AgentState>) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  params,
  agents,
  onUpdateParams,
  onUpdateAgent
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Col 1: Symplectic Integrator & Time Step */}
      <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-4 flex flex-col gap-4 shadow-xl">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-sm font-semibold text-slate-200">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span>Symplectic Integration Engine</span>
        </div>

        {/* Integrator Selection */}
        <div className="space-y-2 text-xs">
          <label className="text-slate-300 font-medium">Integration Algorithm:</label>
          <div className="space-y-1.5">
            {[
              {
                id: IntegratorType.V5_POINCARE_ADAPTIVE,
                name: 'V5.0 Poincaré Adaptive Symplectic',
                desc: 'Strang splitting on extended phase space with dynamic CFL adaptation. Zero secular energy drift.'
              },
              {
                id: IntegratorType.TAO_RIGID,
                name: 'Tao Rigid Extended Hamiltonian (v2.0)',
                desc: 'Harmonic coupling with fixed frequency omega0. Exhibits drift when r << r0.'
              },
              {
                id: IntegratorType.CLASSICAL_RK4,
                name: 'Explicit Runge-Kutta 4th Order (RK4)',
                desc: 'Standard non-symplectic benchmark. Rapid energy accumulation and secular blowup.'
              },
              {
                id: IntegratorType.LEAPFROG_15PN,
                name: '1.5PN Symplectic Leapfrog',
                desc: 'Separable kinetic-potential drift-kick with post-Newtonian correction.'
              }
            ].map(intg => (
              <div
                key={intg.id}
                onClick={() => onUpdateParams({ integrator: intg.id })}
                className={`p-2.5 rounded-lg border cursor-pointer transition ${
                  params.integrator === intg.id
                    ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300'
                    : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="font-semibold text-xs text-slate-100 flex items-center justify-between">
                  <span>{intg.name}</span>
                  {params.integrator === intg.id && (
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  )}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 leading-snug">{intg.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Fictitious Time Step Delta Tau */}
        <div className="space-y-2 text-xs pt-2 border-t border-slate-800">
          <div className="flex justify-between font-mono text-slate-300">
            <span>Extended Time Step Δτ:</span>
            <span className="text-cyan-300">{params.dt.toFixed(4)}</span>
          </div>
          <input
            type="range"
            min="0.001"
            max="0.02"
            step="0.001"
            value={params.dt}
            onChange={e => onUpdateParams({ dt: Number(e.target.value) })}
            className="w-full accent-cyan-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>0.001 (Ultra-Fine)</span>
            <span>0.02 (CFL Boundary)</span>
          </div>
        </div>

        {/* Sub-steps per frame */}
        <div className="space-y-2 text-xs">
          <div className="flex justify-between font-mono text-slate-300">
            <span>Sub-Steps Per Frame:</span>
            <span className="text-cyan-300">{params.subStepsPerFrame}</span>
          </div>
          <input
            type="range"
            min="1"
            max="12"
            step="1"
            value={params.subStepsPerFrame}
            onChange={e => onUpdateParams({ subStepsPerFrame: Number(e.target.value) })}
            className="w-full accent-cyan-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Col 2: Relativistic & Soft-Min Parameters */}
      <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-4 flex flex-col gap-4 shadow-xl">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-sm font-semibold text-slate-200">
          <Shield className="w-4 h-4 text-cyan-400" />
          <span>Relativistic & Soft-Min Restraints</span>
        </div>

        {/* Post-Newtonian Switches */}
        <div className="space-y-2 text-xs">
          <label className="text-slate-300 font-medium">Post-Newtonian Couplings:</label>
          <div className="space-y-1.5">
            <label className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
              <span className="text-slate-300">1.5PN Leading Spin-Orbit (LO SO):</span>
              <input
                type="checkbox"
                checked={params.enableLO_SO}
                onChange={e => onUpdateParams({ enableLO_SO: e.target.checked })}
                className="accent-cyan-500 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
              <span className="text-slate-300">2PN Spin-Spin Dipole (2PN SS):</span>
              <input
                type="checkbox"
                checked={params.enable2PN_SS}
                onChange={e => onUpdateParams({ enable2PN_SS: e.target.checked })}
                className="accent-cyan-500 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
              <span className="text-slate-300">2.5PN Next-to-Leading Spin-Orbit (NLO SO):</span>
              <input
                type="checkbox"
                checked={params.enableNLO_SO}
                onChange={e => onUpdateParams({ enableNLO_SO: e.target.checked })}
                className="accent-cyan-500 rounded"
              />
            </label>
          </div>
        </div>

        {/* Speed of Light c */}
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between font-mono text-slate-300">
            <span>Speed of Light c:</span>
            <span className="text-cyan-300">{params.c.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="6.0"
            max="30.0"
            step="0.5"
            value={params.c}
            onChange={e => onUpdateParams({ c: Number(e.target.value) })}
            className="w-full accent-cyan-500 cursor-pointer"
          />
        </div>

        {/* Soft-Min Sharpness Beta */}
        <div className="space-y-1.5 text-xs pt-2 border-t border-slate-800">
          <div className="flex justify-between font-mono text-slate-300">
            <span>Soft-Min Sharpness β:</span>
            <span className="text-cyan-300">{params.beta.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="1.0"
            max="12.0"
            step="0.5"
            value={params.beta}
            onChange={e => onUpdateParams({ beta: Number(e.target.value) })}
            className="w-full accent-cyan-500 cursor-pointer"
          />
          <div className="text-[10px] text-slate-500">
            Controls exponential steepness of LogSumExp minimum function
          </div>
        </div>

        {/* Base Frequency omega0 */}
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between font-mono text-slate-300">
            <span>Base Frequency ω₀:</span>
            <span className="text-cyan-300">{params.omega0.toFixed(1)} rad/s</span>
          </div>
          <input
            type="range"
            min="10.0"
            max="60.0"
            step="1.0"
            value={params.omega0}
            onChange={e => onUpdateParams({ omega0: Number(e.target.value) })}
            className="w-full accent-cyan-500 cursor-pointer"
          />
        </div>

        {/* Restraint Radius r0 */}
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between font-mono text-slate-300">
            <span>Restraint Radius r₀:</span>
            <span className="text-cyan-300">{params.r0.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0.8"
            max="4.0"
            step="0.1"
            value={params.r0}
            onChange={e => onUpdateParams({ r0: Number(e.target.value) })}
            className="w-full accent-cyan-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Col 3: Agent Multi-Body State Inspector */}
      <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-4 flex flex-col gap-4 shadow-xl">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            <User className="w-4 h-4 text-cyan-400" />
            <span>N-Body Agent Inspector ({agents.length})</span>
          </div>
        </div>

        <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
          {agents.map((agent, idx) => (
            <div
              key={agent.id}
              className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex flex-col gap-2.5 text-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full border border-white/50"
                    style={{ backgroundColor: agent.color }}
                  />
                  <span className="font-semibold text-slate-100">{agent.label}</span>
                </div>
                <span className="text-[11px] font-mono text-cyan-400">Node #{idx + 1}</span>
              </div>

              {/* Mass Control */}
              <div className="flex items-center justify-between font-mono">
                <span className="text-slate-400">Mass m:</span>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={agent.mass}
                  onChange={e => onUpdateAgent(idx, { mass: Math.max(1, Number(e.target.value)) })}
                  className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-right text-slate-200"
                />
              </div>

              {/* Natural Frequency */}
              <div className="flex items-center justify-between font-mono">
                <span className="text-slate-400">Natural Freq ν:</span>
                <input
                  type="number"
                  step="0.1"
                  value={agent.naturalFrequency}
                  onChange={e => onUpdateAgent(idx, { naturalFrequency: Number(e.target.value) })}
                  className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-right text-slate-200"
                />
              </div>

              {/* Position and Momentum Readouts */}
              <div className="p-2 rounded bg-slate-900/60 font-mono text-[11px] text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>q:</span>
                  <span className="text-slate-300">
                    [{agent.q[0].toFixed(2)}, {agent.q[1].toFixed(2)}, {agent.q[2].toFixed(2)}]
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>p:</span>
                  <span className="text-emerald-400">
                    [{agent.p[0].toFixed(1)}, {agent.p[1].toFixed(1)}, {agent.p[2].toFixed(1)}]
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Spin:</span>
                  <span className="text-amber-400">
                    [{agent.spin[0].toFixed(1)}, {agent.spin[1].toFixed(1)}, {agent.spin[2].toFixed(1)}]
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
