/**
 * PDF export via the browser's native print API.
 *
 * html2canvas rasterises the DOM to a bitmap (blurry text, broken gradients);
 * browser print produces a true vector PDF instead. We clone the resume canvas
 * into a print-only root, hide the app shell with CSS, then call window.print().
 */
import { useResumeStore } from '../store/resumeStore';

const PRINT_ATTR = 'data-pdf-printing';
const PRINT_ROOT_ID = 'pdf-print-root';

async function preparePrint(): Promise<() => void> {
  const store = useResumeStore.getState();

  // Commit any in-progress edit by blurring the focused element
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
  // Give the blur's onChange handlers time to write to the store
  await new Promise(r => setTimeout(r, 80));

  // Switch to print layout
  store.setIsPrinting(true);

  // Wait for React to flush the re-render, then for paint to complete
  await new Promise(r => setTimeout(r, 280));
  await new Promise(r => requestAnimationFrame(r));

  const source = document.getElementById('resume-canvas');
  if (!source) {
    store.setIsPrinting(false);
    throw new Error('Resume canvas element not found');
  }

  // Deep-clone the clean print-layout DOM, stripping screen-only styling
  const clone = source.cloneNode(true) as HTMLElement;
  clone.removeAttribute('id');
  clone.style.boxShadow = 'none';
  clone.style.margin = '0';

  // Mount the print root outside the React tree
  const printRoot = document.createElement('div');
  printRoot.id = PRINT_ROOT_ID;
  printRoot.appendChild(clone);
  document.body.appendChild(printRoot);

  // Activate print-mode CSS (hides #root and all other body children)
  document.body.setAttribute(PRINT_ATTR, '1');

  const cleanup = () => {
    document.body.removeAttribute(PRINT_ATTR);
    printRoot.remove();
    store.setIsPrinting(false);
  };

  return cleanup;
}

let _printInProgress = false;

export async function downloadPDF(_filename = 'resume.pdf') {
  if (_printInProgress) return;
  _printInProgress = true;
  let cleanup: (() => void) | null = null;
  try {
    cleanup = await preparePrint();
  } catch (e) {
    _printInProgress = false;
    throw e;
  }

  await new Promise<void>((resolve, reject) => {
    let settled = false;
    let safetyTimer: ReturnType<typeof setTimeout>;

    const done = () => {
      if (settled) return;
      settled = true;
      clearTimeout(safetyTimer);
      window.removeEventListener('afterprint', done);
      cleanup!();
      _printInProgress = false;
      resolve();
    };

    window.addEventListener('afterprint', done);
    safetyTimer = setTimeout(done, 5 * 60 * 1000);

    setTimeout(() => {
      try { window.print(); }
      catch (e) { done(); reject(e); }
    }, 60);
  });
}

// savePDFDirect kept for backwards compatibility; same flow
export { downloadPDF as savePDFDirect };
