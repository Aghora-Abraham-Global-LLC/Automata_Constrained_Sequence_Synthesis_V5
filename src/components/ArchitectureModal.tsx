import React from 'react';
import { X, CheckCircle2, ShieldAlert, Cpu, Network, Zap, Lock } from 'lucide-react';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Zero-API Architecture & Offline Compute Verification</h2>
              <p className="text-xs text-emerald-400 font-mono">100% Client-Side TypeScript/Wasm · 0 Network Egress</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex flex-col gap-5 text-xs text-slate-300">
          {/* Guaranteed Zero Cost Card */}
          <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-emerald-300 font-semibold text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Zero External API Tokens or Billing Consumption</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              This application does <strong>NOT make any API calls</strong> to Google Gemini, OpenAI, Claude, or any cloud LLM service during continuous simulation. The entire physical integration, soft-minimum computation, Poincaré splitting, Kuramoto synchronization, and Artin braid extraction run <strong>exclusively inside your local browser thread</strong>.
            </p>
          </div>

          {/* Metric Comparison Table */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                <Network className="w-3.5 h-3.5 text-cyan-400" />
                <span>API Calls Made</span>
              </div>
              <span className="text-lg font-bold font-mono text-emerald-400">0 (Zero)</span>
              <span className="text-[10px] text-slate-500">No background polling</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Cloud Quota Used</span>
              </div>
              <span className="text-lg font-bold font-mono text-emerald-400">0 Tokens / $0.00</span>
              <span className="text-[10px] text-slate-500">Free unlimited execution</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                <Cpu className="w-3.5 h-3.5 text-purple-400" />
                <span>Execution Engine</span>
              </div>
              <span className="text-lg font-bold font-mono text-purple-300">Local V8/Wasm</span>
              <span className="text-[10px] text-slate-500">Hardware accelerated</span>
            </div>
          </div>

          {/* Verification Steps */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
            <span className="font-semibold text-slate-200">How to Verify in Your Browser</span>
            <ol className="list-decimal list-inside text-slate-400 flex flex-col gap-1 leading-relaxed">
              <li>Open your browser Developer Tools (<kbd className="bg-slate-800 px-1 rounded">F12</kbd> or <kbd className="bg-slate-800 px-1 rounded">Ctrl+Shift+I</kbd>).</li>
              <li>Navigate to the <strong>Network</strong> tab.</li>
              <li>Filter by <strong>Fetch/XHR</strong>.</li>
              <li>Notice that as the simulation runs continuously for minutes or hours, <strong>zero HTTP or WebSocket requests</strong> are emitted.</li>
            </ol>
          </div>

          {/* Lifecycle & Battery Protections */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
            <span className="font-semibold text-slate-200">Automatic Resource & Background Guards</span>
            <ul className="text-slate-400 flex flex-col gap-1 leading-relaxed">
              <li>&bull; <strong className="text-slate-200">Tab Inactivity Detection:</strong> Uses the HTML5 Page Visibility API to automatically pause or throttle physics when you switch tabs, eliminating battery drain and runaway background CPU.</li>
              <li>&bull; <strong className="text-slate-200">Bounded Ring-Buffers:</strong> Trails and history series are capped to fixed memory buffers with zero uncollected allocations.</li>
              <li>&bull; <strong className="text-slate-200">NaN Singularity Protection:</strong> Trajectory coordinates are verified every sub-step with automatic regularizer safeguards.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>Safe for 24/7 continuous autonomous execution</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
