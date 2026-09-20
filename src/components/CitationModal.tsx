import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, Bookmark, ShieldCheck, Download } from 'lucide-react';

interface CitationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CitationModal: React.FC<CitationModalProps> = ({ isOpen, onClose }) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);

  if (!isOpen) return null;

  const bibtex = `@software{ghulam2026phasesync,
  author       = {Ghulam-e-Shah-e-Unmani, Arya Arunachala Ananda},
  title        = {Phase-Synchronized Trajectory Optimization in Synthetic Multi-Agent Systems: Adaptive Extended Symplectic Control and Planar Braid Complexity (Version 5.0)},
  howpublished = {Official Reference Software Implementation},
  year         = {2026},
  month        = {September},
  publisher    = {Zenodo},
  version      = {v5.0.0},
  doi          = {10.5281/zenodo.22851183},
  url          = {https://doi.org/10.5281/zenodo.22851183}
}`;

  const apa = `Ghulam-e-Shah-e-Unmani, A. A. A. (2026). Phase-Synchronized Trajectory Optimization in Synthetic Multi-Agent Systems: Adaptive Extended Symplectic Control and Planar Braid Complexity (Version 5.0) [Computer software · Official Reference Implementation]. Zenodo. https://doi.org/10.5281/zenodo.22851183`;

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Cite this Software & Zenodo DOI</h2>
              <p className="text-xs text-slate-400 font-mono">Permanent Research Identifier: 10.5281/zenodo.22851183</p>
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
          {/* DOI Banner */}
          <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider block mb-1">
                Zenodo Registered DOI
              </span>
              <span className="font-mono text-sm font-semibold text-slate-100 selection:bg-cyan-500 selection:text-slate-950">
                10.5281/zenodo.22851183
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy('https://doi.org/10.5281/zenodo.22851183', 'doi')}
                className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-mono flex items-center gap-1.5 transition"
              >
                {copiedType === 'doi' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedType === 'doi' ? 'Copied' : 'Copy URL'}</span>
              </button>
              <a
                href="https://doi.org/10.5281/zenodo.22851183"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Visit Zenodo</span>
              </a>
            </div>
          </div>

          {/* BibTeX Entry */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200">BibTeX Format</span>
              <button
                onClick={() => handleCopy(bibtex, 'bibtex')}
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px] transition font-mono"
              >
                {copiedType === 'bibtex' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedType === 'bibtex' ? 'Copied to Clipboard' : 'Copy BibTeX'}</span>
              </button>
            </div>
            <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto leading-relaxed whitespace-pre-wrap select-all">
              {bibtex}
            </pre>
          </div>

          {/* APA Format */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200">APA 7th Edition</span>
              <button
                onClick={() => handleCopy(apa, 'apa')}
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px] transition font-mono"
              >
                {copiedType === 'apa' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedType === 'apa' ? 'Copied' : 'Copy APA'}</span>
              </button>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-serif italic text-slate-300 select-all leading-relaxed">
              {apa}
            </div>
          </div>

          {/* Zenodo GitHub Live Integration Checklist */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Automated GitHub & Zenodo Release Integration</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              This repository includes native <code className="text-cyan-300 bg-slate-900 px-1 py-0.5 rounded">CITATION.cff</code> and <code className="text-cyan-300 bg-slate-900 px-1 py-0.5 rounded">.zenodo.json</code> definitions. When you enable the Zenodo GitHub webhook and publish a tag release (e.g. <code className="text-cyan-300 bg-slate-900 px-1 py-0.5 rounded">v5.0.0</code>), Zenodo automatically mints your permanent DOI snapshot with complete author attribution.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>Licensed under MIT Open Source</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
