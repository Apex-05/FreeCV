/**
 * PDF export via the browser's native print API.
 *
 * Why not html2pdf / html2canvas?
 *   - html2canvas rasterises the DOM to a bitmap JPEG → blurry text, broken gradients
 *   - Browser print produces a true vector PDF (Chrome/Edge): every font glyph,
 *     gradient, and shadow renders identically to the editor view.
 *
 * Flow:
 *   1. Blur active element → commits any pending contenteditable edits to the store
 *   2. setIsPrinting(true) → React re-renders templates to clean print layout
 *      (static text from store, no edit buttons/toolbars)
 *   3. Clone #resume-canvas (now in clean state) → append as #pdf-print-root
 *   4. Set body[data-pdf-printing] → CSS hides entire app shell, shows only the clone
 *   5. window.print() → browser opens print dialog (select "Save as PDF")
 *   6. afterprint fires → clean up, restore editor
 */

import { useResumeStore } from '../store/resumeStore';

const PRINT_ATTR = 'data-pdf-printing';
const PRINT_ROOT_ID = 'pdf-print-root';

async function preparePrint(): Promise<() => void> {
  const store = useResumeStore.getState();

  // Step 1: commit any in-progress edit by blurring the focused element
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
  // Give the blur's onChange handlers time to write to the store
  await new Promise(r => setTimeout(r, 80));

  // Step 2: switch to print layout
  store.setIsPrinting(true);

  // Step 3: wait for React to flush the re-render (isPrinting → static text, no edit UI)
  await new Promise(r => setTimeout(r, 280));
  // One more animation frame to ensure paint is complete
  await new Promise(r => requestAnimationFrame(r));

  const source = document.getElementById('resume-canvas');
  if (!source) {
    store.setIsPrinting(false);
    throw new Error('Resume canvas element not found');
  }

  // Step 4: deep-clone the clean print-layout DOM
  const clone = source.cloneNode(true) as HTMLElement;
  // Strip the id so there's no collision with the live element
  clone.removeAttribute('id');
  // Remove any residual screen-only shadow/margin from the wrapper
  clone.style.boxShadow = 'none';
  clone.style.margin = '0';

  // Step 5: mount print root as a direct sibling of #root (outside React tree)
  const printRoot = document.createElement('div');
  printRoot.id = PRINT_ROOT_ID;
  printRoot.appendChild(clone);
  document.body.appendChild(printRoot);

  // Step 6: activate print-mode CSS (hides #root and all other body children)
  document.body.setAttribute(PRINT_ATTR, '1');

  // Returns a cleanup function
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

// savePDFDirect kept for backwards compatibility — same flow
export { downloadPDF as savePDFDirect };
