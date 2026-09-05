import { useEffect, useState } from 'react';
import { Monitor } from 'lucide-react';

const BREAKPOINT = 1024;

const isSmall = () => typeof window !== 'undefined' && window.innerWidth < BREAKPOINT;

export function MobileWarning() {
  const [visible, setVisible] = useState(isSmall);

  useEffect(() => {
    const check = () => setVisible(window.innerWidth < BREAKPOINT);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    document.body.style.overflow = visible ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 flex flex-col items-center text-center gap-5">
        <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center">
          <Monitor className="w-8 h-8 text-indigo-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Desktop Required</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            FreeCV is designed for laptop and desktop browsers. Please switch to a larger screen for the best experience.
          </p>
        </div>
      </div>
    </div>
  );
}
