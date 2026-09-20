import React, { useRef, useEffect, useState } from 'react';
import {
  AgentState,
  BraidCrossing,
  SimulationMetrics,
  SimulationParams,
  Vector3D
} from '../types';
import { vec3, getProjectionBasis } from '../physics/mathUtils';
import { Layers, Eye, RotateCw, Sparkles, Hash, Compass } from 'lucide-react';

interface BraidVisualizerProps {
  agents: AgentState[];
  metrics: SimulationMetrics;
  params: SimulationParams;
  onUpdateParams: (newParams: Partial<SimulationParams>) => void;
}

export const BraidVisualizer: React.FC<BraidVisualizerProps> = ({
  agents,
  metrics,
  params,
  onUpdateParams
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Observer orientation angles (Spherical coordinates)
  const [elevation, setElevation] = useState<number>(30); // degrees
  const [azimuth, setAzimuth] = useState<number>(45);     // degrees

  // Update observer vector n in S^2 when angles change
  const handleAngleChange = (newElev: number, newAzim: number) => {
    setElevation(newElev);
    setAzimuth(newAzim);
    const theta = (newElev * Math.PI) / 180;
    const phi = (newAzim * Math.PI) / 180;
    const nx = Math.cos(theta) * Math.cos(phi);
    const ny = Math.cos(theta) * Math.sin(phi);
    const nz = Math.sin(theta);
    onUpdateParams({ observerVector: vec3.normalize([nx, ny, nz]) });
  };

  // Render the 2D projected space-time braid diagram
  useEffect(() => {
    const canvas = canvasRef.current;
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

    // Background
    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, width, height);

    // Padding
    const padX = 60;
    const padY = 50;
    const plotW = width - 2 * padX;
    const plotH = height - 2 * padY;

    // Projection basis for plane P_n
    const basis = getProjectionBasis(params.observerVector);

    // Time Axis (Vertical, flowing downwards from past to present)
    // Draw Time Guidelines
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);

    for (let k = 0; k <= 5; k++) {
      const y = padY + (plotH * k) / 5;
      ctx.beginPath();
      ctx.moveTo(padX, y);
      ctx.lineTo(padX + plotW, y);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '10px monospace';
      const labelT = (metrics.time - (5 - k) * 0.4).toFixed(1);
      ctx.fillText(`${labelT}s`, padX - 45, y + 3);
    }
    ctx.setLineDash([]);

    // Draw central spatial axis (x_proj = 0)
    const midX = padX + plotW / 2;
    ctx.beginPath();
    ctx.moveTo(midX, padY);
    ctx.lineTo(midX, padY + plotH);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = '10px monospace';
    ctx.fillText('Projected Axis x_proj (P_n)', midX - 60, padY - 15);
    ctx.fillText('Time t ↓', padX - 45, padY - 15);

    // Collect 2D Projected Strands from Agent History
    // Each agent's trail contains up to 250 past positions
    const maxTrailLen = Math.max(...agents.map(a => a.trail.length));
    if (maxTrailLen < 2) return;

    // Calculate horizontal scale
    let maxProjectedX = 3.5;
    agents.forEach(agent => {
      agent.trail.forEach(pos => {
        const x_proj = Math.abs(vec3.dot(pos, basis.e1));
        if (x_proj > maxProjectedX) maxProjectedX = x_proj;
      });
    });
    maxProjectedX = Math.max(3.0, maxProjectedX * 1.15);

    // Draw Strands
    agents.forEach((agent, agentIdx) => {
      const trail = agent.trail;
      if (trail.length < 2) return;

      ctx.beginPath();
      for (let k = 0; k < trail.length; k++) {
        const pos = trail[k];
        const x_proj = vec3.dot(pos, basis.e1);

        // Screen coordinates
        const screenX = midX + (x_proj / maxProjectedX) * (plotW / 2);
        // k = 0 is oldest, k = trail.length - 1 is current
        const normTime = k / (trail.length - 1);
        const screenY = padY + normTime * plotH;

        if (k === 0) ctx.moveTo(screenX, screenY);
        else ctx.lineTo(screenX, screenY);
      }

      ctx.strokeStyle = agent.color;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Current Head Node
      const currentPos = trail[trail.length - 1];
      const currX = midX + (vec3.dot(currentPos, basis.e1) / maxProjectedX) * (plotW / 2);
      const currY = padY + plotH;

      ctx.beginPath();
      ctx.arc(currX, currY, 5, 0, 2 * Math.PI);
      ctx.fillStyle = agent.color;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Strand label at bottom
      ctx.fillStyle = '#f8fafc';
      ctx.font = '10px Plus Jakarta Sans, sans-serif';
      ctx.fillText(agent.label, currX - 15, currY + 18);
    });

    // Draw Artin Crossing Badges (σ_k) on the cylinder
    metrics.recentCrossings.forEach((crossing, idx) => {
      // Estimate vertical position based on timestamp
      const timeDiff = metrics.time - crossing.time;
      if (timeDiff < 0 || timeDiff > 2.0) return;

      const normY = 1.0 - timeDiff / 2.0;
      const screenY = padY + normY * plotH;

      // Draw badge in center or near crossing
      ctx.save();
      const badgeText = crossing.symbol;
      ctx.font = 'bold 11px monospace';
      const textMetrics = ctx.measureText(badgeText);
      const badgeW = textMetrics.width + 12;
      const badgeH = 20;
      const badgeX = midX - badgeW / 2 + (idx % 2 === 0 ? -40 : 40);

      // Badge pill
      ctx.fillStyle = crossing.sign > 0 ? 'rgba(16, 185, 129, 0.85)' : 'rgba(239, 68, 68, 0.85)';
      ctx.beginPath();
      ctx.roundRect(badgeX, screenY - badgeH / 2, badgeW, badgeH, 6);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Text
      ctx.fillStyle = '#ffffff';
      ctx.fillText(badgeText, badgeX + 6, screenY + 4);
      ctx.restore();
    });
  }, [agents, metrics, params.observerVector]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 2D Spacetime Braid Canvas (Left 2 Cols) */}
      <div className="lg:col-span-2 bg-slate-950 rounded-xl border border-slate-800 p-4 flex flex-col shadow-xl">
        <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-800 gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <span>Observer-Projected Artin Braid Cylinder</span>
                <span className="font-serif-math italic text-xs text-cyan-300">
                  [t - T, t] × P<sub>n</sub>
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Spacetime worldlines projected onto observer plane <span className="font-serif-math italic">P<sub>n</sub></span> with Artin generators <span className="font-serif-math italic">σ<sub>k</sub><sup>±1</sup></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300">
              <span className="text-slate-400">Orientation:</span>
              <span className="text-cyan-300 font-semibold">
                θ={elevation}°, φ={azimuth}°
              </span>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="relative w-full h-[520px] my-3 rounded-lg overflow-hidden border border-slate-800/80 bg-slate-950">
          <canvas id="braid-diagram-canvas" ref={canvasRef} className="w-full h-full" />
        </div>

        {/* Active Braid Word Box */}
        <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-mono">Active Artin Braid Word w<sub>n</sub> ∈ B<sub>N</sub>:</span>
            <span className="text-cyan-400 font-mono text-[11px]">
              {metrics.recentCrossings.length} Crossings Detected
            </span>
          </div>
          <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800 text-cyan-300 font-mono text-sm tracking-wider overflow-x-auto whitespace-nowrap">
            {metrics.braidWord || 'e (Identity / No Crossings)'}
          </div>
        </div>
      </div>

      {/* Right Column: Observer Controls & Topological Metrics */}
      <div className="flex flex-col gap-5">
        {/* Observer Vector Controls */}
        <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-4 flex flex-col gap-4 shadow-xl">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-sm font-semibold text-slate-200">
            <Compass className="w-4 h-4 text-cyan-400" />
            <span>Observer Vector n ∈ S²</span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Rotate the observer projection normal <span className="font-serif-math italic">n</span>. Remark 4.1 proves the DFA state <span className="font-serif-math italic">Q</span> is orientation-invariant away from a measure-zero set of singular caustic projections.
          </p>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between text-slate-300 font-mono mb-1">
                <span>Elevation Angle θ:</span>
                <span className="text-cyan-300">{elevation}°</span>
              </div>
              <input
                type="range"
                min="-85"
                max="85"
                value={elevation}
                onChange={e => handleAngleChange(Number(e.target.value), azimuth)}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 font-mono mb-1">
                <span>Azimuthal Angle φ:</span>
                <span className="text-cyan-300">{azimuth}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                value={azimuth}
                onChange={e => handleAngleChange(elevation, Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-xs font-mono flex flex-col gap-1">
            <div className="text-slate-400">Unit Normal Vector n:</div>
            <div className="text-cyan-300">
              [{params.observerVector[0].toFixed(3)}, {params.observerVector[1].toFixed(3)}, {params.observerVector[2].toFixed(3)}]
            </div>
          </div>
        </div>

        {/* Winding Numbers & Isotropic Complexity */}
        <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-4 flex flex-col gap-4 shadow-xl">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-sm font-semibold text-slate-200">
            <Hash className="w-4 h-4 text-cyan-400" />
            <span>Planar Winding Complexity</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-[11px] text-slate-400 mb-1">Isotropic Complexity:</div>
              <div className="text-lg font-mono font-bold text-cyan-300">
                ⟨W<sub>ij</sub>⟩ = {metrics.isotropicComplexity.toFixed(2)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">S² orientation average</div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-[11px] text-slate-400 mb-1">DFA Active State:</div>
              <div className="text-lg font-mono font-bold text-amber-300">
                {metrics.activeDFAState}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Automaton channel</div>
            </div>
          </div>

          {/* Pairwise Winding Table */}
          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-slate-300">Pairwise Winding Numbers W<sub>ij</sub><sup>n</sup>:</div>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {Object.entries(metrics.windingNumbers).map(([pairKey, val]) => {
                const [i, j] = pairKey.split('-');
                const agentA = agents[Number(i)];
                const agentB = agents[Number(j)];
                if (!agentA || !agentB) return null;

                return (
                  <div
                    key={pairKey}
                    className="flex items-center justify-between p-2 rounded bg-slate-950/70 border border-slate-800 text-xs font-mono"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: agentA.color }} />
                      <span className="text-slate-300">{agentA.label.split(' ')[0]}</span>
                      <span className="text-slate-500">↔</span>
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: agentB.color }} />
                      <span className="text-slate-300">{agentB.label.split(' ')[0]}</span>
                    </div>
                    <span className="text-cyan-300 font-semibold">{val.toFixed(2)} turns</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
