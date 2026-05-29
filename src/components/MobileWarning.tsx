import { useEffect, useState } from 'react';
import { Monitor, X } from 'lucide-react';

const BREAKPOINT = 1024;

export function MobileWarning() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const check = () => setVisible(window.innerWidth < BREAKPOINT);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (!visible || dismissed) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 flex flex-col items-center text-center gap-5 relative">
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Dismiss warning"
        >
          <X size={18} />
        </button>
        <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center">
          <Monitor className="w-8 h-8 text-indigo-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Desktop Required</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            FreeCV is designed for laptop and desktop browsers. Please switch to a larger screen for the best experience.
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
        >
          Continue anyway
        </button>
      </div>
    </div>
  );
}
