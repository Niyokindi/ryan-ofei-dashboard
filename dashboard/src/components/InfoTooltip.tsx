import { useState } from 'react';

interface InfoTooltipProps {
  text: string;
}

export default function InfoTooltip({ text }: InfoTooltipProps) {
  const [show, setShow] = useState(false);

  return (
    <span className="relative inline-flex">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow((s) => !s)}
        className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-white/10 text-[10px] font-medium text-zinc-400 transition-colors hover:bg-white/20 hover:text-zinc-200"
        aria-label="Info"
      >
        ?
      </button>
      {show && (
        <div className="absolute left-1/2 top-full z-50 mt-2 w-72 -translate-x-1/2 rounded-xl border border-white/10 bg-zinc-900 px-4 py-3.5 text-xs leading-loose text-zinc-300 shadow-xl shadow-black/50">
          <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-l border-t border-white/10 bg-zinc-900" />
          {text}
        </div>
      )}
    </span>
  );
}
