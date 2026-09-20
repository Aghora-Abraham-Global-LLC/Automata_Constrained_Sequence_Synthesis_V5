import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, Bookmark, ShieldCheck, FileText } from 'lucide-react';

interface CitationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CitationModal: React.FC<CitationModalProps> = ({ isOpen, onClose }) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);

  if (!isOpen) return null;

  const appletDoi = '10.5281/zenodo.22851432';
  const paperDoi = '10.5281/zenodo.22851183';

  const bibtexSoftware = `@software{ghulam2026phasesync_applet,
  author       = {Ghulam-e-Shah-e-Unmani, Arya Arunachala Ananda},
  title        = {Phase-Synchronized Trajectory Optimization in Synthetic Multi-Agent Systems: Adaptive Extended Symplectic Control and Planar Braid Complexity (Version 5.0 Reference Implementation)},
  howpublished = {Zenodo Reference Computational Applet},
  year         = {2026},
  month        = {September},
  publisher    = {Zenodo},
  version      = {v5.0.0},
  doi          = {${appletDoi}},
  url          = {https://doi.org/${appletDoi}},
  note         = {Open Access under Creative Commons Attribution 4.0 International}
}`;

  const bibtexPaper = `@article{ghulam2026phasesync_paper,
  author       = {Ghulam-e-Shah-e-Unmani, Arya Arunachala Ananda},
  title        = {Phase-Synchronized Trajectory Optimization in Synthetic Multi-Agent Systems: Adaptive Extended Symplectic Control and Planar Braid Complexity (Version 5.0)},
  journal      = {Preprint · BhutaDamaraSena R&D Labs · Aghora Abraham Global LLC},
  year         = {2026},
  month        = {September},
  publisher    = {Zenodo},
  doi          = {${paperDoi}},
  url          = {https://doi.org/${paperDoi}}
}`;

  const apaSoftware = `Ghulam-e-Shah-e-Unmani, A. A. A. (2026). Phase-Synchronized Trajectory Optimization in Synthetic Multi-Agent Systems: Adaptive Extended Symplectic Control and Planar Braid Complexity (Version 5.0) [Computer software · Official Reference Implementation]. Zenodo. https://doi.org/${appletDoi}`;

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
              <h2 className="text-base font-bold text-slate-100">Zenodo Research Applet & Academic Citation</h2>
              <p className="text-xs text-slate-400 font-mono">Applet DOI: {appletDoi} &middot; Paper DOI: {paperDoi}</p>
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
          {/* Dual DOI Banners */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Applet Software DOI */}
            <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex flex-col justify-between gap-2.5">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block mb-1">
                  Applet Software Zenodo DOI
                </span>
                <span className="font-mono text-xs font-semibold text-slate-100 select-all">
                  {appletDoi}
                </span>
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-cyan-500/20">
                <button
                  onClick={() => handleCopy(`https://doi.org/${appletDoi}`, 'applet-doi')}
                  className="px-2.5 py-1 rounded-md bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-mono text-[11px] flex items-center gap-1 transition"
                >
                  {copiedType === 'applet-doi' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedType === 'applet-doi' ? 'Copied' : 'Copy URL'}</span>
                </button>
                <a
                  href={`https://doi.org/${appletDoi}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] flex items-center gap-1 transition"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Zenodo</span>
                </a>
              </div>
            </div>

            {/* Theoretical Monograph Paper DOI */}
            <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex flex-col justify-between gap-2.5">
              <div>
                <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider block mb-1">
                  Monograph Preprint DOI
                </span>
                <span className="font-mono text-xs font-semibold text-slate-100 select-all">
                  {paperDoi}
                </span>
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-indigo-500/20">
                <button
                  onClick={() => handleCopy(`https://doi.org/${paperDoi}`, 'paper-doi')}
                  className="px-2.5 py-1 rounded-md bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 font-mono text-[11px] flex items-center gap-1 transition"
                >
                  {copiedType === 'paper-doi' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedType === 'paper-doi' ? 'Copied' : 'Copy URL'}</span>
                </button>
                <a
                  href={`https://doi.org/${paperDoi}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] flex items-center gap-1 transition"
                >
                  <FileText className="w-3 h-3" />
                  <span>Paper</span>
                </a>
              </div>
            </div>
          </div>

          {/* Software Applet BibTeX Entry */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200">Software Applet BibTeX Entry</span>
              <button
                onClick={() => handleCopy(bibtexSoftware, 'bibtex-applet')}
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px] transition font-mono"
              >
                {copiedType === 'bibtex-applet' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedType === 'bibtex-applet' ? 'Copied' : 'Copy Software BibTeX'}</span>
              </button>
            </div>
            <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto leading-relaxed whitespace-pre-wrap select-all">
              {bibtexSoftware}
            </pre>
          </div>

          {/* APA Format */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200">APA 7th Edition Citation</span>
              <button
                onClick={() => handleCopy(apaSoftware, 'apa')}
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px] transition font-mono"
              >
                {copiedType === 'apa' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedType === 'apa' ? 'Copied' : 'Copy APA'}</span>
              </button>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-serif italic text-slate-300 select-all leading-relaxed">
              {apaSoftware}
            </div>
          </div>

          {/* Zenodo Research License Notice */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Zenodo Open Access Academic License (CC BY 4.0)</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              This applet is published as open-access research software under the <strong className="text-slate-200">Creative Commons Attribution 4.0 International (CC BY 4.0)</strong> license. Any academic, educational, or computational reproduction must provide attribution to author <strong className="text-slate-200">Arya Arunachala Ananda Ghulam-e-Shah-e-Unmani</strong> and cite Zenodo DOI <code className="text-cyan-300 bg-slate-900 px-1 py-0.5 rounded">{appletDoi}</code>.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono text-[11px] text-cyan-400">Zenodo DOI: {appletDoi} &middot; CC BY 4.0</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
