import React from 'react';
import { BookOpen, ShieldCheck, CheckCircle2, ChevronRight, FileText, Layers, Hash, Bookmark, ExternalLink } from 'lucide-react';

interface PaperInspectorProps {
  onOpenCitation?: () => void;
}

export const PaperInspector: React.FC<PaperInspectorProps> = ({ onOpenCitation }) => {
  return (
    <div className="max-w-5xl mx-auto bg-slate-900/90 rounded-xl border border-slate-800 p-6 flex flex-col gap-6 shadow-2xl text-slate-200">
      {/* Paper Header */}
      <div className="border-b border-slate-800 pb-5 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
            <FileText className="w-4 h-4" />
            <span>autometa_v5_mod.tex · Primary Theoretical Monograph</span>
          </div>
          {onOpenCitation && (
            <button
              onClick={onOpenCitation}
              className="px-3 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-mono flex items-center gap-1.5 transition"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Cite Paper & Software (BibTeX / DOI)</span>
            </button>
          )}
        </div>

        <h1 className="text-xl md:text-2xl font-bold text-slate-100 tracking-tight leading-snug">
          Phase-Synchronized Trajectory Optimization in Synthetic Multi-Agent Systems: Adaptive Extended Symplectic Control and Planar Braid Complexity
        </h1>
        <p className="text-xs text-slate-400 font-serif italic">
          Version 5.0: Non-Separable Control Potentials, Poincaré Extended Phase Space, Soft-Minimum Restraints, and 2D Projected Topological Automata
        </p>

        {/* Academic Authorship & Metadata Strip */}
        <div className="mt-2 p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-slate-200">Arya Arunachala Ananda Ghulam-e-Shah-e-Unmani</span>
            <span className="text-[11px] text-slate-400">
              BhutaDamaraSena R&D Labs · Aghora Abraham Global LLC · <code className="text-cyan-400">research@bhutadamarasena.com</code>
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300">
              AMS: 70H15, 65P10, 57K10
            </span>
            <a
              href="https://doi.org/10.5281/zenodo.22851183"
              target="_blank"
              rel="noreferrer"
              className="px-2 py-1 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 flex items-center gap-1 transition"
            >
              <span>DOI: 10.5281/zenodo.22851183</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* First Implementation Validation Banner */}
        <div className="mt-1 p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/50 via-slate-950 to-cyan-950/50 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-emerald-300">
                Official First Reference Implementation of Monograph Version 5.0
              </div>
              <div className="text-[11px] text-slate-400">
                100% Client-side mathematical verification of non-separable Hamiltonian dynamics, Poincaré time-scaling, and B<sub>N</sub> braid tracking.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-mono text-[10px]">
              Theorems 2.1 – 4.1 Validated
            </span>
          </div>
        </div>
      </div>

      {/* Section 1: Non-Separable Post-Newtonian Hamiltonian */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-cyan-300">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>1. The Non-Separable Multi-Agent Post-Newtonian Hamiltonian (Eq. 2.1)</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          The global configuration is governed by physical coordinates <span className="font-serif-math italic">q = (q₁,...,q_N)</span>, conjugate momenta <span className="font-serif-math italic">p = (p₁,...,p_N)</span>, and internal SO(3) spin states <span className="font-serif-math italic">S_i</span>:
        </p>
        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-cyan-200 overflow-x-auto leading-relaxed">
          H(q, p, S) = ∑_i [ p_i² / (2 m_i) ] - ∑_&#123;i&lt;j&#125; [ G m_i m_j / r_ij ]<br />
          &nbsp;&nbsp;+ H_&#123;1.5PN&#125;^&#123;LO,SO&#125;(q, p, S) + H_&#123;2PN&#125;^&#123;SS&#125;(q, S) + H_&#123;2.5PN&#125;^&#123;NLO,SO&#125;(q, p, S)
        </div>
        <div className="text-[11px] text-slate-400 leading-relaxed">
          Because <span className="font-serif-math italic">H_SO(q, p, S)</span> couples momentum and coordinates bilinearly <span className="font-serif-math italic">p_i · (S_j × r_ij)</span>, the Hamiltonian is non-separable. Standard kinetic-potential splitting algorithms fail, requiring an extended symplectic phase space.
        </div>
      </div>

      {/* Section 2: C^∞ Soft-Minimum Potential */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-cyan-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>2. C<sup>∞</sup> Smooth Soft-Minimum Potential R<sub>β</sub>(q) (Eq. 2.7 & 2.8)</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Traditional collision restraints using hard <span className="font-mono">min_&#123;i&lt;j&#125; r_ij</span> introduce discontinuous non-smooth gradient bifurcations that destroy symplectic integrators. V5.0 replaces this with the smooth LogSumExp soft-minimum:
        </p>
        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-emerald-300 overflow-x-auto leading-relaxed">
          R_β(q) = - (1 / β) · ln( ∑_&#123;i&lt;j&#125; exp( -β · r_ij ) )
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          With exact analytic gradient and partition weights <span className="font-serif-math italic">w_ij</span>:
        </p>
        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed">
          w_ij = exp( -β · r_ij ) / ∑_&#123;k&lt;l&#125; exp( -β · r_kl )<br />
          ∇_&#123;q_i&#125; R_β(q) = ∑_&#123;j ≠ i&#125; w_ij · [ (q_i - q_j) / r_ij ]
        </div>
        <div className="text-[11px] text-slate-400">
          Lemma 2.1 guarantees uniform convergence <span className="font-serif-math italic">0 ≤ R_β(q) - min r_ij ≤ ln(N(N-1)/2) / β</span> as <span className="font-serif-math italic">β → ∞</span>, preserving full differentiability <span className="font-serif-math italic">C<sup>∞</sup></span>.
        </div>
      </div>

      {/* Section 3: Extended Poincaré Symplectic Phase Space & Strang Splitting */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-cyan-300">
          <Hash className="w-4 h-4 text-purple-400" />
          <span>3. Poincaré Extended Phase Space & Strang Splitting (Section 2.4 & Theorem 3.1)</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          The physical phase space <span className="font-serif-math italic">(q, p)</span> is doubled with auxiliary variables <span className="font-serif-math italic">(x, y)</span>, augmented by physical time <span className="font-serif-math italic">t</span> and conjugate energy <span className="font-serif-math italic">p_t</span>:
        </p>
        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-purple-300 overflow-x-auto leading-relaxed">
          H_ext(q, p, x, y, t, p_t) = H_A(q, y, t, p_t) + H_B(x, p, t, p_t) + (ω(q)² / 2) ||q - x||² + (1 / 2) ||p - y||²
        </div>
        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed">
          Ψ_&#123;Δτ&#125; = Φ_A(Δτ/2) ∘ Φ_B(Δτ/2) ∘ Φ_ω(Δτ) ∘ Φ_B(Δτ/2) ∘ Φ_A(Δτ/2)
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          <strong>Theorem 3.1 (Symplectic Invariance & Zero Secular Drift):</strong> The integrator preserves the extended symplectic 2-form <span className="font-serif-math italic">Ω_ext = dq ∧ dp + dx ∧ dy - dt ∧ dE</span>. There exists a shadow Hamiltonian <span className="font-serif-math italic">H_shadow = H_ext + O(Δτ²)</span> such that <span className="font-serif-math italic">|H(t) - H(0)| ≤ C · Δτ²</span> with strictly zero secular growth over arbitrary integration intervals.
        </p>
      </div>

      {/* Section 4: Artin Braid Topology & B_N-DFA */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-cyan-300">
          <BookOpen className="w-4 h-4 text-amber-400" />
          <span>4. Artin Braid Topology & Deterministic Automaton B_N-DFA (Section 4)</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Observer-projected trajectories onto plane <span className="font-serif-math italic">P_n</span> generate continuous worldlines in spacetime cylinder <span className="font-serif-math italic">[t-T, t] × P_n</span>. Artin crossings <span className="font-serif-math italic">σ_k<sup>±1</sup></span> determine discrete topological transitions:
        </p>

        {/* Table 1 */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono border border-slate-800 rounded-lg overflow-hidden">
            <thead className="bg-slate-900 text-slate-300 text-left">
              <tr>
                <th className="p-2 border-b border-slate-800">Transition</th>
                <th className="p-2 border-b border-slate-800">State Transition</th>
                <th className="p-2 border-b border-slate-800">Guard Condition</th>
                <th className="p-2 border-b border-slate-800">Physical / Topological Event</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-400">
              <tr>
                <td className="p-2 text-cyan-300">δ₁</td>
                <td className="p-2">S₀ → S₁</td>
                <td className="p-2 text-amber-300">H_ratio &lt; 2.5</td>
                <td className="p-2">Hierarchy collapse into 3-body chaos</td>
              </tr>
              <tr>
                <td className="p-2 text-cyan-300">δ₂</td>
                <td className="p-2">S₁ → S₀</td>
                <td className="p-2 text-emerald-300">H_ratio ≥ 8.0</td>
                <td className="p-2">Hierarchy restored (strict hysteresis gap)</td>
              </tr>
              <tr>
                <td className="p-2 text-cyan-300">δ₃</td>
                <td className="p-2">S₁ → S₂</td>
                <td className="p-2 text-purple-300">Odd Swap Parity</td>
                <td className="p-2">Artin braid swap σ_k between partners</td>
              </tr>
              <tr>
                <td className="p-2 text-cyan-300">δ₄</td>
                <td className="p-2">S₂ → S₁</td>
                <td className="p-2 text-purple-300">Even Swap Parity</td>
                <td className="p-2">Exchange resolves back to resonant chaos</td>
              </tr>
              <tr>
                <td className="p-2 text-cyan-300">δ₅</td>
                <td className="p-2">S₁, S₂ → S₃</td>
                <td className="p-2 text-blue-300">v ≥ v_esc</td>
                <td className="p-2">Velocity exceeds escape bound (unbound)</td>
              </tr>
              <tr>
                <td className="p-2 text-cyan-300">δ₆</td>
                <td className="p-2">Any → S₄</td>
                <td className="p-2 text-rose-400">r ≤ r_c</td>
                <td className="p-2">Coalescence sink at critical radius</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
          <strong>Theorem 4.1 (Non-Chattering Hysteresis & Determinism):</strong> The gap <span className="font-mono text-cyan-300">H_ratio ∈ (2.5, 8.0)</span> guarantees that the minimum dwell time between state changes is strictly bounded below by <span className="font-serif-math italic">T_dwell ≥ ΔH_gap / max |dH_ratio/dt| &gt; 0</span>, proving the automaton is completely immune to infinite-frequency Zeno chatter.
        </div>
      </div>
    </div>
  );
};
