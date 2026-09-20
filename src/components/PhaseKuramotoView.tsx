import React, { useRef, useEffect } from 'react';
import { AgentState, SimulationMetrics, SimulationParams } from '../types';
import { Compass, Zap, Activity, ShieldCheck, Thermometer, Sliders } from 'lucide-react';

interface PhaseKuramotoViewProps {
  agents: AgentState[];
  metrics: SimulationMetrics;
  params: SimulationParams;
  onUpdateParams: (newParams: Partial<SimulationParams>) => void;
}

export const PhaseKuramotoView: React.FC<PhaseKuramotoViewProps> = ({
  agents,
  metrics,
  params,
  onUpdateParams
}) => {
  const phasorCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const Rg = metrics.orderParameterRg;
  const Zg = metrics.coherenceVectorZg;

  // Render Phasor Circle on S^1
  useEffect(() => {
    const canvas = phasorCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 35;

    // Clear
    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, width, height);

    // Outer Unit Circle S^1
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Concentric guideline circles (0.25, 0.5, 0.75)
    [0.25, 0.5, 0.75].forEach(rFrac => {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * rFrac, 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.2)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Angle axes (0, pi/2, pi, 3pi/2)
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX - radius - 10, centerY);
    ctx.lineTo(centerX + radius + 10, centerY);
    ctx.moveTo(centerX, centerY - radius - 10);
    ctx.lineTo(centerX, centerY + radius + 10);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '10px monospace';
    ctx.fillText('0', centerX + radius + 8, centerY + 3);
    ctx.fillText('π/2', centerX - 8, centerY - radius - 8);
    ctx.fillText('π', centerX - radius - 18, centerY + 3);
    ctx.fillText('3π/2', centerX - 12, centerY + radius + 18);

    // Individual Agent Phasors u_i = (cos Phi_i, sin Phi_i)
    agents.forEach(agent => {
      const px = centerX + radius * Math.cos(agent.phase);
      const py = centerY - radius * Math.sin(agent.phase); // minus for canvas Y

      // Vector ray from center
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(px, py);
      ctx.strokeStyle = agent.color + '77';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Phasor node on circumference
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, 2 * Math.PI);
      ctx.fillStyle = agent.color;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Phase label
      const deg = Math.round((agent.phase * 180) / Math.PI);
      ctx.fillStyle = '#f8fafc';
      ctx.font = '10px monospace';
      ctx.fillText(`${deg}°`, px + (px > centerX ? 8 : -28), py + (py > centerY ? 12 : -8));
    });

    // Resultant Covariant Coherence Vector Z_g
    const zx = centerX + radius * Zg[0];
    const zy = centerY - radius * Zg[1];

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(zx, zy);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // Coherence Head
    ctx.beginPath();
    ctx.arc(zx, zy, 7, 0, 2 * Math.PI);
    ctx.fillStyle = '#38bdf8';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`Z_g (R_g=${Rg.toFixed(3)})`, zx + 10, zy - 10);
  }, [agents, Rg, Zg]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left 2 Cols: Phasor Circle & Geometric Kuramoto Theory */}
      <div className="lg:col-span-2 bg-slate-950 rounded-xl border border-slate-800 p-4 flex flex-col gap-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-800 gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <span>Covariant Kuramoto Dynamics on Riemannian Manifold</span>
                <span className="font-serif-math italic text-xs text-cyan-300">
                  (Σ, g)
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Levi-Civita parallel transport to Karcher barycenter <span className="font-serif-math italic">q₀</span> with geometric holonomy <span className="font-serif-math italic">δ<sub>ij</sub><sup>g</sup></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300">
              Order Parameter: <span className="text-cyan-300 font-bold">R<sub>g</sub> = {Rg.toFixed(3)}</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          {/* Phasor Canvas */}
          <div className="relative w-full h-[360px] bg-slate-900/60 rounded-xl border border-slate-800 p-2 flex items-center justify-center">
            <canvas id="kuramoto-phasor-canvas" ref={phasorCanvasRef} className="w-full h-full" />
          </div>

          {/* Theoretical Sync Theorem Box */}
          <div className="flex flex-col gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col gap-2">
              <div className="flex items-center gap-1.5 font-semibold text-cyan-300">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>Theorem 2.1: Exponential Convergence</span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Under sectional curvature bounds <span className="font-serif-math italic">K(Σ) ≤ K<sub>max</sub></span>, the Riemann connection holonomy along the geodesic triangle satisfies <span className="font-serif-math italic">|δ<sub>ij</sub><sup>g</sup>| ≤ δ<sub>max</sub><sup>g</sup></span>.
              </p>
              <div className="p-2 rounded bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-200">
                E[1 - R<sub>g</sub>(t)] ≤ (1 - R<sub>g</sub>(0)) · exp(-λ<sub>g</sub> t) + O(k_B T<sub>synth</sub> / N)
              </div>
              <div className="text-[10px] text-slate-400">
                Covariant decay rate: <span className="text-emerald-400 font-mono font-semibold">λ<sub>g</sub> = {Math.max(0.01, params.Ksync * Math.cos(0.15) - 0.2).toFixed(3)} &gt; 0</span>
              </div>
            </div>

            {/* Sync Progress Gauge */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col gap-2">
              <div className="flex justify-between font-mono text-xs">
                <span className="text-slate-400">Phase Coherence:</span>
                <span className="text-cyan-300 font-bold">{(Rg * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-200"
                  style={{ width: `${Math.min(100, Math.max(0, Rg * 100))}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Incoherent (0.0)</span>
                <span>Partially Locked (0.5)</span>
                <span>Synchronized (1.0)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Col: Langevin Thermostat & Curvature Controls */}
      <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-4 flex flex-col gap-4 shadow-xl">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-sm font-semibold text-slate-200">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <span>Curved BAOAB Langevin Thermostat</span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Synthetic dissipative damping <span className="font-serif-math italic">F<sub>damp</sub></span> and exploration noise <span className="font-serif-math italic">T<sub>synth</sub></span> operate strictly via symmetric BAOAB operator splitting to prevent local-minimum stalling.
        </p>

        <div className="space-y-3.5 text-xs">
          {/* Toggle Langevin */}
          <label className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer">
            <span className="font-medium text-slate-300">Enable Langevin Thermostat:</span>
            <input
              type="checkbox"
              checked={params.enableLangevin}
              onChange={e => onUpdateParams({ enableLangevin: e.target.checked })}
              className="accent-cyan-500 w-4 h-4 rounded"
            />
          </label>

          {/* Kuramoto Coupling K_sync */}
          <div>
            <div className="flex justify-between font-mono text-slate-300 mb-1">
              <span>Kuramoto Gain K<sub>sync</sub>:</span>
              <span className="text-cyan-300">{params.Ksync.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="6.0"
              step="0.1"
              value={params.Ksync}
              onChange={e => onUpdateParams({ Ksync: Number(e.target.value) })}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>

          {/* Damping gamma_0 */}
          <div>
            <div className="flex justify-between font-mono text-slate-300 mb-1">
              <span>Dissipation Damping γ₀:</span>
              <span className="text-cyan-300">{params.gamma0.toFixed(3)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.5"
              step="0.01"
              value={params.gamma0}
              onChange={e => onUpdateParams({ gamma0: Number(e.target.value) })}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>

          {/* Synthetic Temperature T_synth */}
          <div>
            <div className="flex justify-between font-mono text-slate-300 mb-1">
              <span>Exploration Noise k_B T<sub>synth</sub>:</span>
              <span className="text-cyan-300">{params.kBTsynth.toFixed(3)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.3"
              step="0.005"
              value={params.kBTsynth}
              onChange={e => onUpdateParams({ kBTsynth: Number(e.target.value) })}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>

          {/* Sectional Curvature K_max */}
          <div>
            <div className="flex justify-between font-mono text-slate-300 mb-1">
              <span>Manifold Curvature K<sub>max</sub>:</span>
              <span className="text-cyan-300">{params.curvatureKmax.toFixed(3)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1.0"
              step="0.05"
              value={params.curvatureKmax}
              onChange={e => onUpdateParams({ curvatureKmax: Number(e.target.value) })}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
