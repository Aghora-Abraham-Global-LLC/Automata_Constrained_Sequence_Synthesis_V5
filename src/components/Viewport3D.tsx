import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  AgentState,
  SimulationMetrics,
  SimulationParams,
  Vector3D
} from '../types';
import { vec3, getProjectionBasis } from '../physics/mathUtils';
import {
  Eye,
  Maximize2,
  RefreshCw,
  Sliders,
  Sparkles,
  Compass,
  Layers
} from 'lucide-react';

interface Viewport3DProps {
  agents: AgentState[];
  metrics: SimulationMetrics;
  params: SimulationParams;
  onUpdateParams: (newParams: Partial<SimulationParams>) => void;
}

export const Viewport3D: React.FC<Viewport3DProps> = ({
  agents,
  metrics,
  params,
  onUpdateParams
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Camera State
  const [rotX, setRotX] = useState<number>(0.45); // Pitch
  const [rotY, setRotY] = useState<number>(-0.6); // Yaw
  const [zoom, setZoom] = useState<number>(55);   // Pixels per simulation unit
  const [pan, setPan] = useState<[number, number]>([0, 0]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<[number, number]>([0, 0]);

  // Visual toggles
  const [showTrails, setShowTrails] = useState<boolean>(true);
  const [showVectors, setShowVectors] = useState<boolean>(true);
  const [showSpins, setShowSpins] = useState<boolean>(true);
  const [showBarycenter, setShowBarycenter] = useState<boolean>(true);
  const [showProjectionPlane, setShowProjectionPlane] = useState<boolean>(true);
  const [followBarycenter, setFollowBarycenter] = useState<boolean>(false);

  // Compute Karcher barycenter
  const barycenter = React.useMemo(() => {
    let sumPos: Vector3D = [0, 0, 0];
    let totalM = 0;
    agents.forEach(a => {
      sumPos = vec3.add(sumPos, vec3.scale(a.q, a.mass));
      totalM += a.mass;
    });
    return vec3.scale(sumPos, 1 / Math.max(totalM, 1e-6));
  }, [agents]);

  // Handle Mouse Interactions
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart([e.clientX, e.clientY]);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart[0];
    const dy = e.clientY - dragStart[1];

    if (e.shiftKey || e.buttons === 2) {
      // Pan
      setPan(prev => [prev[0] + dx, prev[1] + dy]);
    } else {
      // Orbit
      setRotY(prev => prev + dx * 0.008);
      setRotX(prev => Math.max(-1.5, Math.min(1.5, prev + dy * 0.008)));
    }
    setDragStart([e.clientX, e.clientY]);
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom(prev => Math.max(10, Math.min(250, prev * factor)));
  };

  // 3D Projection Pipeline
  const project3Dto2D = useCallback(
    (
      p: Vector3D | [number, number, number] | number[],
      width: number,
      height: number,
      centerOffset: Vector3D | [number, number, number] | number[] = [0, 0, 0]
    ): { x: number; y: number; z: number } => {
      // Offset by pan or center
      const rx = (p[0] ?? 0) - (centerOffset[0] ?? 0);
      const ry = (p[1] ?? 0) - (centerOffset[1] ?? 0);
      const rz = (p[2] ?? 0) - (centerOffset[2] ?? 0);

      // Rotate around Y axis (Yaw)
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const x1 = cosY * rx - sinY * rz;
      const z1 = sinY * rx + cosY * rz;
      const y1 = ry;

      // Rotate around X axis (Pitch)
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const y2 = cosX * y1 - sinX * z1;
      const z2 = sinX * y1 + cosX * z1;
      const x2 = x1;

      // Screen coordinates (Orthographic with depth sorting)
      const screenX = width / 2 + pan[0] + x2 * zoom;
      const screenY = height / 2 + pan[1] - y2 * zoom; // Invert Y for screen

      return { x: screenX, y: screenY, z: z2 };
    },
    [rotX, rotY, zoom, pan]
  );

  // Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high-DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Clear background
    ctx.fillStyle = '#090d16'; // Deep space slate
    ctx.fillRect(0, 0, width, height);

    const centerOffset = followBarycenter ? barycenter : [0, 0, 0];

    // 1. Draw 3D Ambient Coordinate Grid (XY plane)
    ctx.lineWidth = 1;
    const gridRange = 8;
    const gridStep = 2;
    for (let i = -gridRange; i <= gridRange; i += gridStep) {
      // Lines parallel to X
      const p1 = project3Dto2D([-gridRange, i, 0], width, height, centerOffset);
      const p2 = project3Dto2D([gridRange, i, 0], width, height, centerOffset);
      ctx.strokeStyle = i === 0 ? 'rgba(56, 189, 248, 0.25)' : 'rgba(71, 85, 105, 0.15)';
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      // Lines parallel to Y
      const q1 = project3Dto2D([i, -gridRange, 0], width, height, centerOffset);
      const q2 = project3Dto2D([i, gridRange, 0], width, height, centerOffset);
      ctx.strokeStyle = i === 0 ? 'rgba(56, 189, 248, 0.25)' : 'rgba(71, 85, 105, 0.15)';
      ctx.beginPath();
      ctx.moveTo(q1.x, q1.y);
      ctx.lineTo(q2.x, q2.y);
      ctx.stroke();
    }

    // 2. Draw Observer Projection Plane P_n (if enabled)
    if (showProjectionPlane) {
      const basis = getProjectionBasis(params.observerVector);
      const planeRadius = 5;
      const corners: Vector3D[] = [
        vec3.add(vec3.scale(basis.e1, -planeRadius), vec3.scale(basis.e2, -planeRadius)),
        vec3.add(vec3.scale(basis.e1, planeRadius), vec3.scale(basis.e2, -planeRadius)),
        vec3.add(vec3.scale(basis.e1, planeRadius), vec3.scale(basis.e2, planeRadius)),
        vec3.add(vec3.scale(basis.e1, -planeRadius), vec3.scale(basis.e2, planeRadius))
      ];

      const projCorners = corners.map(c => project3Dto2D(c, width, height, centerOffset));
      ctx.beginPath();
      ctx.moveTo(projCorners[0].x, projCorners[0].y);
      for (let k = 1; k < 4; k++) ctx.lineTo(projCorners[k].x, projCorners[k].y);
      ctx.closePath();
      ctx.fillStyle = 'rgba(6, 182, 212, 0.04)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw normal vector n
      const nCenter = project3Dto2D([0, 0, 0], width, height, centerOffset);
      const nTip = project3Dto2D(vec3.scale(params.observerVector, 2.5), width, height, centerOffset);
      ctx.beginPath();
      ctx.moveTo(nCenter.x, nCenter.y);
      ctx.lineTo(nTip.x, nTip.y);
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#06b6d4';
      ctx.font = '10px monospace';
      ctx.fillText('n (Observer vector)', nTip.x + 6, nTip.y);
    }

    // 3. Draw Soft-Minimum Inter-Agent Interaction Links
    for (let i = 0; i < agents.length; i++) {
      for (let j = i + 1; j < agents.length; j++) {
        const d = vec3.dist(agents[i].q, agents[j].q);
        const pi = project3Dto2D(agents[i].q, width, height, centerOffset);
        const pj = project3Dto2D(agents[j].q, width, height, centerOffset);

        // Intensity increases as d approaches soft-min radius r0
        if (d < params.r0 * 2.5) {
          const proximityAlpha = Math.max(0, Math.min(0.8, (params.r0 * 2.5 - d) / (params.r0 * 2)));
          ctx.beginPath();
          ctx.moveTo(pi.x, pi.y);
          ctx.lineTo(pj.x, pj.y);
          ctx.strokeStyle = `rgba(244, 63, 94, ${proximityAlpha})`;
          ctx.lineWidth = d <= params.criticalRadius ? 2.5 : 1;
          ctx.setLineDash(d <= params.criticalRadius ? [] : [3, 3]);
          ctx.stroke();
          ctx.setLineDash([]);

          // Distance label in middle
          const midX = (pi.x + pj.x) / 2;
          const midY = (pi.y + pj.y) / 2;
          ctx.fillStyle = 'rgba(254, 205, 211, 0.8)';
          ctx.font = '9px monospace';
          ctx.fillText(`r=${d.toFixed(2)}`, midX + 4, midY - 4);
        }
      }
    }

    // 4. Draw Orbital Trails
    if (showTrails) {
      agents.forEach(agent => {
        if (agent.trail.length < 2) return;
        ctx.beginPath();
        for (let k = 0; k < agent.trail.length; k++) {
          const pt = project3Dto2D(agent.trail[k], width, height, centerOffset);
          if (k === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.strokeStyle = agent.color + '55'; // semi-transparent
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
    }

    // 5. Draw Karcher Barycenter q0 and Geodesics
    if (showBarycenter) {
      const pBary = project3Dto2D(barycenter, width, height, centerOffset);

      // Barycenter marker
      ctx.beginPath();
      ctx.arc(pBary.x, pBary.y, 4, 0, 2 * Math.PI);
      ctx.fillStyle = '#f8fafc';
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Geodesic dashed lines to each agent
      agents.forEach(agent => {
        const pAgent = project3Dto2D(agent.q, width, height, centerOffset);
        ctx.beginPath();
        ctx.moveTo(pBary.x, pBary.y);
        ctx.lineTo(pAgent.x, pAgent.y);
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
        ctx.setLineDash([2, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px monospace';
      ctx.fillText('q₀ (Barycenter)', pBary.x + 8, pBary.y + 3);
    }

    // 6. Draw Agents with 3D Depth Sorting
    // Sort agents from furthest to closest (z order)
    const sortedAgents = [...agents]
      .map(agent => ({
        agent,
        proj: project3Dto2D(agent.q, width, height, centerOffset)
      }))
      .sort((a, b) => a.proj.z - b.proj.z);

    sortedAgents.forEach(({ agent, proj }) => {
      const radius = Math.max(5, Math.min(18, Math.cbrt(agent.mass) * 3));

      // Glowing halo
      const gradient = ctx.createRadialGradient(
        proj.x,
        proj.y,
        radius * 0.2,
        proj.x,
        proj.y,
        radius * 2.2
      );
      gradient.addColorStop(0, agent.color);
      gradient.addColorStop(0.6, agent.color + '66');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.beginPath();
      ctx.arc(proj.x, proj.y, radius * 2.2, 0, 2 * Math.PI);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Agent Core Sphere
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = agent.color;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Phase Indicator Tick on Agent Perimeter
      const phaseX = proj.x + radius * Math.cos(agent.phase);
      const phaseY = proj.y + radius * Math.sin(agent.phase);
      ctx.beginPath();
      ctx.arc(phaseX, phaseY, 2.5, 0, 2 * Math.PI);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // Vector: Momentum p_i (Green)
      if (showVectors) {
        const vel = vec3.scale(agent.p, 1 / agent.mass);
        const pTip = project3Dto2D(
          vec3.add(agent.q, vec3.scale(vel, 0.4)),
          width,
          height,
          centerOffset
        );
        ctx.beginPath();
        ctx.moveTo(proj.x, proj.y);
        ctx.lineTo(pTip.x, pTip.y);
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Vector: Internal Spin S_i (Gold/Amber)
      if (showSpins) {
        const spinNorm = vec3.norm(agent.spin);
        if (spinNorm > 0) {
          const spinUnit = vec3.scale(agent.spin, 1 / spinNorm);
          const sTip = project3Dto2D(
            vec3.add(agent.q, vec3.scale(spinUnit, 1.2)),
            width,
            height,
            centerOffset
          );
          ctx.beginPath();
          ctx.moveTo(proj.x, proj.y);
          ctx.lineTo(sTip.x, sTip.y);
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      // Agent Label
      ctx.fillStyle = '#f1f5f9';
      ctx.font = '11px Plus Jakarta Sans, sans-serif';
      ctx.fillText(agent.label, proj.x + radius + 4, proj.y - 2);

      // Mass & Velocity text
      const vMag = vec3.norm(agent.p) / agent.mass;
      ctx.fillStyle = '#94a3b8';
      ctx.font = '9px monospace';
      ctx.fillText(`m=${agent.mass} · v=${vMag.toFixed(2)}`, proj.x + radius + 4, proj.y + 10);
    });
  }, [
    agents,
    metrics,
    params,
    project3Dto2D,
    barycenter,
    showTrails,
    showVectors,
    showSpins,
    showBarycenter,
    showProjectionPlane,
    followBarycenter
  ]);

  return (
    <div className="relative w-full h-[620px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col">
      {/* HUD Top Bar Overlay */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between pointer-events-none gap-2">
        <div className="flex items-center gap-2 bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/70 text-xs font-mono pointer-events-auto shadow-md">
          <span className="text-slate-400">Physical t:</span>
          <span className="text-cyan-300 font-semibold">{metrics.time.toFixed(2)}s</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">Steps:</span>
          <span className="text-slate-200">{metrics.steps}</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">ω(R<sub>β</sub>):</span>
          <span className="text-amber-300 font-semibold">{metrics.adaptiveOmega.toFixed(2)} rad/s</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">Soft-Min R<sub>β</sub>:</span>
          <span className="text-rose-300 font-semibold">{metrics.softMinDistance.toFixed(3)}</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">True r<sub>min</sub>:</span>
          <span className="text-slate-200">{metrics.trueMinDistance.toFixed(3)}</span>
        </div>

        {/* Camera Preset Quick Buttons */}
        <div className="flex items-center gap-1 bg-slate-900/85 backdrop-blur-md p-1 rounded-lg border border-slate-700/70 pointer-events-auto text-xs shadow-md">
          <button
            onClick={() => {
              setRotX(0.45);
              setRotY(-0.6);
              setPan([0, 0]);
            }}
            className="px-2 py-1 rounded hover:bg-slate-800 text-slate-300 hover:text-cyan-300 transition"
            title="Standard Isometric View"
          >
            3D Orbit
          </button>
          <button
            onClick={() => {
              setRotX(1.57); // 90 deg down
              setRotY(0);
              setPan([0, 0]);
            }}
            className="px-2 py-1 rounded hover:bg-slate-800 text-slate-300 hover:text-cyan-300 transition"
            title="Top-Down XY Plane"
          >
            Top (XY)
          </button>
          <button
            onClick={() => {
              setRotX(0);
              setRotY(0);
              setPan([0, 0]);
            }}
            className="px-2 py-1 rounded hover:bg-slate-800 text-slate-300 hover:text-cyan-300 transition"
            title="Frontal XZ Plane"
          >
            Front (XZ)
          </button>
          <button
            onClick={() => {
              setRotX(0.45);
              setRotY(-0.6);
              setZoom(55);
              setPan([0, 0]);
            }}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100"
            title="Reset Camera View"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main 3D Canvas */}
      <canvas
        id="viewport-3d-canvas"
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Bottom Visual Controls Toolbar */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between pointer-events-none gap-2">
        <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md px-2 py-1.5 rounded-lg border border-slate-700/70 text-xs pointer-events-auto shadow-lg">
          <label className="flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer hover:bg-slate-800 text-slate-300">
            <input
              type="checkbox"
              checked={showTrails}
              onChange={e => setShowTrails(e.target.checked)}
              className="accent-cyan-500 rounded"
            />
            <span>Trails</span>
          </label>
          <label className="flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer hover:bg-slate-800 text-slate-300">
            <input
              type="checkbox"
              checked={showVectors}
              onChange={e => setShowVectors(e.target.checked)}
              className="accent-emerald-500 rounded"
            />
            <span className="text-emerald-400">p Vectors</span>
          </label>
          <label className="flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer hover:bg-slate-800 text-slate-300">
            <input
              type="checkbox"
              checked={showSpins}
              onChange={e => setShowSpins(e.target.checked)}
              className="accent-amber-500 rounded"
            />
            <span className="text-amber-400">S Spins</span>
          </label>
          <label className="flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer hover:bg-slate-800 text-slate-300">
            <input
              type="checkbox"
              checked={showBarycenter}
              onChange={e => setShowBarycenter(e.target.checked)}
              className="accent-sky-500 rounded"
            />
            <span>q₀ Barycenter</span>
          </label>
          <label className="flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer hover:bg-slate-800 text-slate-300">
            <input
              type="checkbox"
              checked={showProjectionPlane}
              onChange={e => setShowProjectionPlane(e.target.checked)}
              className="accent-cyan-500 rounded"
            />
            <span>P<sub>n</sub> Plane</span>
          </label>
          <label className="flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer hover:bg-slate-800 text-slate-300">
            <input
              type="checkbox"
              checked={followBarycenter}
              onChange={e => setFollowBarycenter(e.target.checked)}
              className="accent-purple-500 rounded"
            />
            <span>Center Lock</span>
          </label>
        </div>

        {/* Legend / Key */}
        <div className="hidden md:flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/70 text-[11px] font-mono text-slate-400 pointer-events-auto">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Velocity p</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Precessing Spin S</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-0.5 bg-rose-500" />
            <span>Soft-Min Link</span>
          </div>
        </div>
      </div>
    </div>
  );
};
