import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  AgentState,
  BN_State,
  DFATransitionEvent,
  IntegratorType,
  SimulationMetrics,
  SimulationParams,
  TimeSeriesPoint,
  Vector3D
} from './types';
import { PRESETS } from './data/presets';
import { BraidDFATracker } from './physics/braidDFA';
import { integrateStep } from './physics/integrators';
import { evaluateAgentHamiltonian } from './physics/hamiltonian';

import { Header } from './components/Header';
import { Viewport3D } from './components/Viewport3D';
import { BraidVisualizer } from './components/BraidVisualizer';
import { DFAMachineView } from './components/DFAMachineView';
import { PhaseKuramotoView } from './components/PhaseKuramotoView';
import { DiagnosticCharts } from './components/DiagnosticCharts';
import { PaperInspector } from './components/PaperInspector';
import { ControlPanel } from './components/ControlPanel';
import { CitationModal } from './components/CitationModal';
import { ArchitectureModal } from './components/ArchitectureModal';
import { AlertCircle, X, ShieldAlert, Cpu } from 'lucide-react';

export const App: React.FC = () => {
  // Active Preset
  const [selectedPresetId, setSelectedPresetId] = useState<string>('paper-benchmark-v5');
  const defaultPreset = PRESETS[0];

  const createInitialAgents = (preset: typeof defaultPreset): AgentState[] => {
    return preset.agents.map(a => ({
      ...a,
      x: [...a.q] as Vector3D,
      y: [...a.p] as Vector3D,
      trail: [[...a.q] as Vector3D]
    }));
  };

  // Simulation Parameters
  const [params, setParams] = useState<SimulationParams>(() => ({
    integrator: IntegratorType.V5_POINCARE_ADAPTIVE,
    G: defaultPreset.params.G ?? 1.0,
    c: defaultPreset.params.c ?? 12.0,
    dt: defaultPreset.params.dt ?? 0.008,
    subStepsPerFrame: defaultPreset.params.subStepsPerFrame ?? 4,
    enableLO_SO: defaultPreset.params.enableLO_SO ?? true,
    enable2PN_SS: defaultPreset.params.enable2PN_SS ?? true,
    enableNLO_SO: defaultPreset.params.enableNLO_SO ?? true,
    beta: defaultPreset.params.beta ?? 4.0,
    omega0: defaultPreset.params.omega0 ?? 30.0,
    kappa: defaultPreset.params.kappa ?? 1.8,
    r0: defaultPreset.params.r0 ?? 2.0,
    epsilon: defaultPreset.params.epsilon ?? 0.15,
    criticalRadius: defaultPreset.params.criticalRadius ?? 0.45,
    escapeVelocity: defaultPreset.params.escapeVelocity ?? 5.5,
    enableLangevin: defaultPreset.params.enableLangevin ?? false,
    gamma0: defaultPreset.params.gamma0 ?? 0.15,
    kBTsynth: defaultPreset.params.kBTsynth ?? 0.08,
    Ksync: defaultPreset.params.Ksync ?? 2.5,
    curvatureKmax: defaultPreset.params.curvatureKmax ?? 0.2,
    observerVector: [0, 0, 1]
  }));

  // Stable Reference to Simulation State (Prevents Re-Render Cascades)
  const initialAgents = createInitialAgents(defaultPreset);
  const [agents, setAgents] = useState<AgentState[]>(initialAgents);
  const simAgentsRef = useRef<AgentState[]>(initialAgents);
  const lastValidAgentsRef = useRef<AgentState[]>(initialAgents);
  const paramsRef = useRef<SimulationParams>(params);
  paramsRef.current = params;

  const initialEnergyRef = useRef<number>(1.0);
  const simStepCounterRef = useRef<number>(0);
  const simTimeRef = useRef<number>(0);

  // Topological DFA Tracker
  const dfaTrackerRef = useRef<BraidDFATracker>(new BraidDFATracker(BN_State.S0_HIERARCHICAL));

  // Run Loop State
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const isRunningRef = useRef<boolean>(isRunning);
  isRunningRef.current = isRunning;

  // Modals & Alerts
  const [isCitationOpen, setIsCitationOpen] = useState<boolean>(false);
  const [isArchitectureOpen, setIsArchitectureOpen] = useState<boolean>(false);
  const [numericalAlert, setNumericalAlert] = useState<string | null>(null);

  // Active View Tab
  const [activeTab, setActiveTab] = useState<
    'viewport' | 'braid' | 'dfa' | 'kuramoto' | 'diagnostics' | 'paper'
  >('viewport');

  // Metrics State
  const [metrics, setMetrics] = useState<SimulationMetrics>(() => ({
    time: 0,
    steps: 0,
    totalEnergy: 0,
    initialEnergy: 1.0,
    energyDrift: 0,
    angularMomentum: [0, 0, 0],
    angularMomentumDrift: 0,
    transverseDistance: 0,
    transverseConstraintDistance: 0,
    adaptiveOmega: params.omega0,
    cflRatio: params.dt * params.omega0,
    isCFLViolated: false,
    activeDFAState: BN_State.S0_HIERARCHICAL,
    hierarchyRatio: 5.0,
    braidWord: 'e',
    recentCrossings: [],
    windingNumbers: {},
    isotropicComplexity: 0,
    orderParameterRg: 0.9,
    coherenceVectorZg: [0.9, 0, 0],
    theoreticalConvergenceLimit: 0.05,
    softMinDistance: 2.0,
    trueMinDistance: 2.0
  }));

  // History Buffers for Charts & Transition Logs
  const [history, setHistory] = useState<TimeSeriesPoint[]>([]);
  const [transitionHistory, setTransitionHistory] = useState<DFATransitionEvent[]>([]);

  // Calculate Initial Energy once agents are set
  useEffect(() => {
    const H0 = evaluateAgentHamiltonian(simAgentsRef.current, params).total;
    initialEnergyRef.current = Math.abs(H0) > 1e-6 ? H0 : 1.0;
  }, []);

  // Preset Switcher
  const handleSelectPreset = useCallback((presetId: string) => {
    const preset = PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    setSelectedPresetId(presetId);
    const newAgents = createInitialAgents(preset);
    simAgentsRef.current = newAgents;
    lastValidAgentsRef.current = newAgents;
    simStepCounterRef.current = 0;
    simTimeRef.current = 0;

    const newParams: SimulationParams = {
      ...paramsRef.current,
      ...preset.params
    };

    setParams(newParams);
    paramsRef.current = newParams;
    setAgents(newAgents);

    dfaTrackerRef.current.reset(BN_State.S0_HIERARCHICAL);
    setHistory([]);
    setTransitionHistory([]);
    setNumericalAlert(null);

    const H0 = evaluateAgentHamiltonian(newAgents, newParams).total;
    initialEnergyRef.current = Math.abs(H0) > 1e-6 ? H0 : 1.0;

    setMetrics({
      time: 0,
      steps: 0,
      totalEnergy: H0,
      initialEnergy: initialEnergyRef.current,
      energyDrift: 0,
      angularMomentum: [0, 0, 0],
      angularMomentumDrift: 0,
      transverseDistance: 0,
      transverseConstraintDistance: 0,
      adaptiveOmega: newParams.omega0,
      cflRatio: newParams.dt * newParams.omega0,
      isCFLViolated: false,
      activeDFAState: BN_State.S0_HIERARCHICAL,
      hierarchyRatio: 5.0,
      braidWord: 'e',
      recentCrossings: [],
      windingNumbers: {},
      isotropicComplexity: 0,
      orderParameterRg: 0.9,
      coherenceVectorZg: [0.9, 0, 0],
      theoreticalConvergenceLimit: 0.05,
      softMinDistance: 2.0,
      trueMinDistance: 2.0
    });
  }, []);

  // Reset Simulation with Current Preset
  const handleReset = useCallback(() => {
    handleSelectPreset(selectedPresetId);
  }, [handleSelectPreset, selectedPresetId]);

  // Update Parameters
  const handleUpdateParams = useCallback((newParams: Partial<SimulationParams>) => {
    setParams(prev => {
      const updated = { ...prev, ...newParams };
      paramsRef.current = updated;
      return updated;
    });
  }, []);

  // Update Specific Agent
  const handleUpdateAgent = useCallback((index: number, updated: Partial<AgentState>) => {
    setAgents(prev => {
      const next = [...prev];
      next[index] = { ...next[index], ...updated };
      simAgentsRef.current = next;
      return next;
    });
  }, []);

  // Core Simulation Step Worker
  const stepSimulation = useCallback((stepsToPerform: number) => {
    const currentParams = paramsRef.current;
    let activeAgents = simAgentsRef.current.map(a => ({
      ...a,
      q: [...a.q] as Vector3D,
      p: [...a.p] as Vector3D,
      x: [...a.x] as Vector3D,
      y: [...a.y] as Vector3D,
      spin: [...a.spin] as Vector3D,
      trail: a.trail
    }));

    let latestStepResult = null;
    let isCorrupted = false;

    for (let s = 0; s < stepsToPerform; s++) {
      const stepResult = integrateStep(activeAgents, currentParams);
      activeAgents = stepResult.agents;
      latestStepResult = stepResult;

      // Numerical singularity guard: check finiteness
      for (let i = 0; i < activeAgents.length; i++) {
        const ag = activeAgents[i];
        if (
          !Number.isFinite(ag.q[0]) ||
          !Number.isFinite(ag.q[1]) ||
          !Number.isFinite(ag.q[2]) ||
          !Number.isFinite(ag.p[0]) ||
          !Number.isFinite(ag.p[1]) ||
          !Number.isFinite(ag.p[2])
        ) {
          isCorrupted = true;
          break;
        }
      }
      if (isCorrupted) break;
    }

    // Singularity recovery
    if (isCorrupted) {
      activeAgents = lastValidAgentsRef.current.map(a => ({
        ...a,
        q: [...a.q] as Vector3D,
        p: [a.p[0] * 0.8, a.p[1] * 0.8, a.p[2] * 0.8] as Vector3D,
        x: [...a.x] as Vector3D,
        y: [a.y[0] * 0.8, a.y[1] * 0.8, a.y[2] * 0.8] as Vector3D,
        spin: [...a.spin] as Vector3D,
        trail: a.trail
      }));
      setNumericalAlert('Singularity Safeguard Active: Stabilized non-smooth close approach.');
    } else {
      lastValidAgentsRef.current = activeAgents;
    }

    // Append position trails (capped at 160 points for maximum canvas performance)
    activeAgents.forEach(agent => {
      agent.trail.push([...agent.q]);
      if (agent.trail.length > 160) {
        agent.trail.shift();
      }
    });

    simAgentsRef.current = activeAgents;
    simStepCounterRef.current += stepsToPerform;
    simTimeRef.current += stepsToPerform * currentParams.dt;

    const nextTime = simTimeRef.current;
    const nextSteps = simStepCounterRef.current;

    // Evaluate Hamiltonian and diagnostics
    const evalRes = evaluateAgentHamiltonian(activeAgents, currentParams);
    const currentH = evalRes.total;
    const eDrift =
      Math.abs(currentH - initialEnergyRef.current) /
      Math.max(Math.abs(initialEnergyRef.current), 1e-4);

    // Evaluate Artin Braid & DFA Transitions
    const dfaRes = dfaTrackerRef.current.update(
      activeAgents,
      currentParams.observerVector,
      currentParams.criticalRadius,
      currentParams.escapeVelocity,
      nextTime,
      nextSteps
    );

    if (dfaRes.transitionEvent) {
      const newEvent = dfaRes.transitionEvent;
      setTransitionHistory(prev => [newEvent, ...prev.slice(0, 49)]);
    }

    const updatedMetrics: SimulationMetrics = {
      time: nextTime,
      steps: nextSteps,
      totalEnergy: currentH,
      initialEnergy: initialEnergyRef.current,
      energyDrift: eDrift,
      angularMomentum: [0, 0, 0],
      angularMomentumDrift: 0,
      transverseDistance: latestStepResult ? latestStepResult.transverseDistance : 0,
      transverseConstraintDistance: latestStepResult ? latestStepResult.transverseDistance : 0,
      adaptiveOmega: evalRes.omega,
      cflRatio: latestStepResult ? latestStepResult.cflRatio : currentParams.dt * evalRes.omega,
      isCFLViolated: latestStepResult ? latestStepResult.isCFLViolated : false,
      activeDFAState: dfaRes.nextState,
      hierarchyRatio: dfaRes.hierarchyRatio,
      braidWord: dfaRes.braidWord,
      recentCrossings: dfaRes.newCrossings.length > 0 ? dfaRes.newCrossings : [],
      windingNumbers: dfaRes.windingNumbers,
      isotropicComplexity: dfaRes.isotropicComplexity,
      orderParameterRg: latestStepResult ? latestStepResult.orderParameterRg : 0.9,
      coherenceVectorZg: latestStepResult ? latestStepResult.coherenceVectorZg : [0.9, 0, 0],
      theoreticalConvergenceLimit: 0.05,
      softMinDistance: evalRes.R_beta,
      trueMinDistance: evalRes.r_min
    };

    // Update React State cleanly outside any functional updater
    setAgents([...activeAgents]);
    setMetrics(updatedMetrics);

    // Append to time-series history buffer (throttled to every 3 frames to avoid layout churn)
    if (nextSteps % 3 === 0) {
      setHistory(prev => {
        const nextPoint: TimeSeriesPoint = {
          time: nextTime,
          energyError: Math.max(1e-12, eDrift),
          transverseDistance: updatedMetrics.transverseDistance,
          omega: evalRes.omega,
          orderParameterRg: updatedMetrics.orderParameterRg,
          minDistance: evalRes.r_min
        };
        const nextArr = [...prev, nextPoint];
        return nextArr.length > 150 ? nextArr.slice(nextArr.length - 150) : nextArr;
      });
    }
  }, []);

  // Single Manual Step
  const handleManualStep = useCallback(() => {
    stepSimulation(1);
  }, [stepSimulation]);

  // Robust requestAnimationFrame Loop with Tab Visibility Guard
  useEffect(() => {
    let animId: number;
    let lastTimestamp = performance.now();

    const loop = (timestamp: number) => {
      // Automatic battery & background throttle guard: if tab is hidden, skip physics
      if (document.hidden) {
        animId = requestAnimationFrame(loop);
        return;
      }

      if (isRunningRef.current) {
        // Enforce smooth 60 FPS pacing (at least 14ms between render frames)
        const elapsed = timestamp - lastTimestamp;
        if (elapsed >= 14) {
          lastTimestamp = timestamp;
          stepSimulation(paramsRef.current.subStepsPerFrame);
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [stepSimulation]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* App Header & Real-Time Status Bar */}
      <Header
        isRunning={isRunning}
        onTogglePlay={() => setIsRunning(prev => !prev)}
        onStep={handleManualStep}
        onReset={handleReset}
        metrics={metrics}
        params={params}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onSelectPreset={handleSelectPreset}
        selectedPresetId={selectedPresetId}
        onOpenCitation={() => setIsCitationOpen(true)}
        onOpenArchitecture={() => setIsArchitectureOpen(true)}
      />

      {/* Numerical Alert Banner (if singularity detected) */}
      {numericalAlert && (
        <div className="bg-amber-950/70 border-b border-amber-600/40 px-4 py-2 text-xs text-amber-300 flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{numericalAlert}</span>
            <button
              onClick={() => setNumericalAlert(null)}
              className="ml-auto p-1 text-amber-400 hover:text-amber-100 transition"
              title="Dismiss warning"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-5 flex flex-col gap-6">
        {/* Tab Views */}
        {activeTab === 'viewport' && (
          <div className="flex flex-col gap-6">
            <Viewport3D
              agents={agents}
              metrics={metrics}
              params={params}
              onUpdateParams={handleUpdateParams}
            />
            <ControlPanel
              params={params}
              agents={agents}
              onUpdateParams={handleUpdateParams}
              onUpdateAgent={handleUpdateAgent}
            />
          </div>
        )}

        {activeTab === 'braid' && (
          <BraidVisualizer
            agents={agents}
            metrics={metrics}
            params={params}
            onUpdateParams={handleUpdateParams}
          />
        )}

        {activeTab === 'dfa' && (
          <DFAMachineView
            metrics={metrics}
            params={params}
            transitionHistory={transitionHistory}
          />
        )}

        {activeTab === 'kuramoto' && (
          <PhaseKuramotoView
            agents={agents}
            metrics={metrics}
            params={params}
            onUpdateParams={handleUpdateParams}
          />
        )}

        {activeTab === 'diagnostics' && (
          <DiagnosticCharts
            metrics={metrics}
            params={params}
            history={history}
          />
        )}

        {activeTab === 'paper' && (
          <PaperInspector onOpenCitation={() => setIsCitationOpen(true)} />
        )}
      </main>

      {/* Professional Academic Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-4 px-4 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto w-full gap-2">
        <div className="flex items-center gap-2">
          <span>Phase-Synchronized Trajectory Optimization under Symplectic & Topological Constraints (V5.0)</span>
          <span className="hidden md:inline">&middot;</span>
          <span className="hidden md:inline">BhutaDamaraSena R&D Labs &middot; Aghora Abraham Global</span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px]">
          <button
            onClick={() => setIsCitationOpen(true)}
            className="hover:text-cyan-400 transition cursor-pointer"
            title="Applet Zenodo DOI: 10.5281/zenodo.22851432"
          >
            DOI: 10.5281/zenodo.22851432
          </button>
          <span>&middot;</span>
          <button
            onClick={() => setIsArchitectureOpen(true)}
            className="hover:text-emerald-400 transition cursor-pointer"
          >
            0 API Tokens (100% Local Engine)
          </button>
          <span>&middot;</span>
          <button
            onClick={() => setIsCitationOpen(true)}
            className="hover:text-cyan-400 transition cursor-pointer"
            title="Creative Commons Attribution 4.0 International"
          >
            Zenodo Open Access (CC BY 4.0)
          </button>
        </div>
      </footer>

      {/* Citation & Zenodo DOI Dialog */}
      <CitationModal
        isOpen={isCitationOpen}
        onClose={() => setIsCitationOpen(false)}
      />

      {/* Zero-API Verification Dialog */}
      <ArchitectureModal
        isOpen={isArchitectureOpen}
        onClose={() => setIsArchitectureOpen(false)}
      />
    </div>
  );
};

export default App;
