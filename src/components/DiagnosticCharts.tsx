import React, { useRef, useEffect } from 'react';
import { SimulationMetrics, SimulationParams, TimeSeriesPoint } from '../types';
import { LineChart, ShieldCheck, Activity, Layers, Zap } from 'lucide-react';

interface DiagnosticChartsProps {
  metrics: SimulationMetrics;
  params: SimulationParams;
  history: TimeSeriesPoint[];
}

export const DiagnosticCharts: React.FC<DiagnosticChartsProps> = ({
  metrics,
  params,
  history
}) => {
  const energyCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const constraintCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const omegaCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Render Energy Drift Chart
  useEffect(() => {
    const canvas = energyCanvasRef.current;
    if (!canvas || history.length < 2) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const padL = 65;
    const padR = 20;
    const padT = 20;
    const padB = 30;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, w, h);

    // Max/Min for log-scale or linear scale
    const errors = history.map(p => Math.max(1e-12, p.energyError));
    const maxVal = Math.max(1e-4, Math.max(...errors) * 1.5);
    const minVal = 1e-10;

    // Grid lines (orders of magnitude)
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);

    for (let exp = -10; exp <= -3; exp += 2) {
      const val = Math.pow(10, exp);
      if (val > maxVal) continue;
      const normY = 1.0 - (Math.log10(val) - Math.log10(minVal)) / (Math.log10(maxVal) - Math.log10(minVal));
      const y = padT + normY * plotH;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + plotW, y);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '9px monospace';
      ctx.fillText(`10^${exp}`, padL - 45, y + 3);
    }
    ctx.setLineDash([]);

    // Plot Energy Error Curve
    ctx.beginPath();
    history.forEach((pt, idx) => {
      const normX = idx / (history.length - 1);
      const x = padL + normX * plotW;
      const clampedVal = Math.max(minVal, Math.min(maxVal, pt.energyError));
      const normY = 1.0 - (Math.log10(clampedVal) - Math.log10(minVal)) / (Math.log10(maxVal) - Math.log10(minVal));
      const y = padT + normY * plotH;

      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.fillText('0s', padL, h - 10);
    ctx.fillText(`t=${metrics.time.toFixed(1)}s`, padL + plotW - 45, h - 10);
  }, [history, metrics.time]);

  // Render Transverse Constraint Chart
  useEffect(() => {
    const canvas = constraintCanvasRef.current;
    if (!canvas || history.length < 2) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const padL = 60;
    const padR = 20;
    const padT = 20;
    const padB = 30;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, w, h);

    const dists = history.map(p => p.transverseDistance);
    const maxVal = Math.max(0.01, Math.max(...dists) * 1.3);

    // Grid
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);

    for (let k = 0; k <= 3; k++) {
      const val = (maxVal * k) / 3;
      const y = padT + (1 - k / 3) * plotH;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + plotW, y);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '9px monospace';
      ctx.fillText(val.toExponential(1), padL - 50, y + 3);
    }
    ctx.setLineDash([]);

    // Curve
    ctx.beginPath();
    history.forEach((pt, idx) => {
      const normX = idx / (history.length - 1);
      const x = padL + normX * plotW;
      const normY = 1.0 - pt.transverseDistance / maxVal;
      const y = padT + normY * plotH;

      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Theoretical O(Δτ / ω₀) bound reference line
    const bound = (params.dt / params.omega0) * 0.8;
    if (bound < maxVal) {
      const boundY = padT + (1 - bound / maxVal) * plotH;
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.6)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(padL, boundY);
      ctx.lineTo(padL + plotW, boundY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#f43f5e';
      ctx.font = '9px monospace';
      ctx.fillText('Theorem 3.2 Bound O(Δτ/ω₀)', padL + 10, boundY - 4);
    }
  }, [history, params.dt, params.omega0]);

  // Render Adaptive Frequency Chart
  useEffect(() => {
    const canvas = omegaCanvasRef.current;
    if (!canvas || history.length < 2) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const padL = 60;
    const padR = 20;
    const padT = 20;
    const padB = 30;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, w, h);

    const omegas = history.map(p => p.omega);
    const maxVal = Math.max(params.omega0 * 2, Math.max(...omegas) * 1.2);
    const minVal = params.omega0 * 0.8;

    // Grid
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);

    for (let k = 0; k <= 3; k++) {
      const val = minVal + ((maxVal - minVal) * k) / 3;
      const y = padT + (1 - k / 3) * plotH;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + plotW, y);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '9px monospace';
      ctx.fillText(val.toFixed(1), padL - 35, y + 3);
    }
    ctx.setLineDash([]);

    // Curve
    ctx.beginPath();
    history.forEach((pt, idx) => {
      const normX = idx / (history.length - 1);
      const x = padL + normX * plotW;
      const normY = 1.0 - (pt.omega - minVal) / (maxVal - minVal);
      const y = padT + normY * plotH;

      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [history, params.omega0]);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col gap-1 shadow-lg">
          <div className="text-[11px] text-slate-400">Fractional Energy Drift:</div>
          <div className="text-xl font-mono font-bold text-cyan-300">
            {metrics.energyDrift.toExponential(2)}
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            Zero secular drift (Theorem 3.1)
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col gap-1 shadow-lg">
          <div className="text-[11px] text-slate-400">Transverse Separation:</div>
          <div className="text-xl font-mono font-bold text-purple-300">
            {metrics.transverseDistance.toExponential(2)}
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            Bound: O(Δτ / ω₀)
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col gap-1 shadow-lg">
          <div className="text-[11px] text-slate-400">Adaptive Frequency ω:</div>
          <div className="text-xl font-mono font-bold text-amber-300">
            {metrics.adaptiveOmega.toFixed(2)} rad/s
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            Stiffens as R_β → 0
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col gap-1 shadow-lg">
          <div className="text-[11px] text-slate-400">CFL Stability Ratio:</div>
          <div className="text-xl font-mono font-bold text-emerald-400">
            {metrics.cflRatio.toFixed(3)}
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            Constraint: Δτ · ω &lt; π/2 ≈ 1.571
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Energy Drift */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col gap-3 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-semibold text-slate-200">
                Hamiltonian Energy Drift |ΔH(t) / H(0)| (Logarithmic)
              </h3>
            </div>
            <span className="text-[10px] text-cyan-300 font-mono">Symplectic Bounded</span>
          </div>

          <div className="w-full h-56 rounded-lg bg-slate-950 overflow-hidden border border-slate-800/80">
            <canvas ref={energyCanvasRef} className="w-full h-full" />
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            The extended Poincaré symplectic 2-form <span className="font-serif-math italic">Ω<sub>ext</sub> = dq ∧ dp - dt ∧ dE</span> guarantees zero secular energy growth across close periastron encounters, preserving the shadow Hamiltonian indefinitely.
          </p>
        </div>

        {/* Chart 2: Transverse Constraint */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col gap-3 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs font-semibold text-slate-200">
                Transverse Distance ||q - x|| + ||p - y|| (Theorem 3.2)
              </h3>
            </div>
            <span className="text-[10px] text-purple-300 font-mono">Manifold Invariant</span>
          </div>

          <div className="w-full h-56 rounded-lg bg-slate-950 overflow-hidden border border-slate-800/80">
            <canvas ref={constraintCanvasRef} className="w-full h-full" />
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Measures distance between physical coordinates <span className="font-serif-math italic">(q, p)</span> and auxiliary variables <span className="font-serif-math italic">(x, y)</span>. Confined to an <span className="font-serif-math italic">O(Δτ / ω₀)</span> tubular neighborhood around the physical manifold.
          </p>
        </div>

        {/* Chart 3: Adaptive Omega */}
        <div className="lg:col-span-2 p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col gap-3 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-semibold text-slate-200">
                Adaptive Coupling Frequency ω(R<sub>β</sub>(q)) vs Inter-Agent Separation
              </h3>
            </div>
            <span className="text-[10px] text-amber-300 font-mono">Dynamic Restraint</span>
          </div>

          <div className="w-full h-48 rounded-lg bg-slate-950 overflow-hidden border border-slate-800/80">
            <canvas ref={omegaCanvasRef} className="w-full h-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
