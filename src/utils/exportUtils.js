/**
 * exportUtils.js
 * Premium HD PDF Export Engine with Multi-page Support.
 * Optimized for Dark Mode UI with Glassmorphism.
 */

import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Premium Export to PDF with HD scaling and Multi-page splitting
 * @param {string} elementId - Target ID (e.g., 'report')
 * @param {string} filename - Output name
 */
export async function exportToPDF(elementId, filename = 'relationship-report.pdf') {
  const element = document.getElementById(elementId);
  if (!element) throw new Error(`Target #${elementId} not found`);

  // Original state backup
  const originalScrollY = window.scrollY;
  
  try {
    // 1. Prepare for capture (scroll to top)
    window.scrollTo(0, 0);
    
    // Brief delay to allow UI to settle and ensure all animations are finished
    await new Promise(r => setTimeout(r, 600));

    // 2. Capture high-resolution canvas
    const canvas = await html2canvas(element, {
      scale: 2, // HD Scaling
      useCORS: true,
      backgroundColor: '#050510', // Match deep dark background
      logging: false,
      windowWidth: 1200, // Desktop layout reference
      onclone: (clonedDoc) => {
        const clonedEl = clonedDoc.getElementById(elementId);
        if (clonedEl) {
          // Force layout properties for PDF consistency
          clonedEl.style.width = '1200px';
          clonedEl.style.padding = '40px';
          clonedEl.style.margin = '0 auto';
          clonedEl.style.background = '#050510';
          
          // Ensure glassmorphism is preserved but legible
          clonedDoc.querySelectorAll('.glass').forEach(el => {
            el.style.background = 'rgba(255, 255, 255, 0.05)';
            el.style.borderColor = 'rgba(255, 255, 255, 0.15)';
          });

          // Hide UI-only elements
          clonedDoc.querySelectorAll('.no-print').forEach(el => {
            el.style.display = 'none';
          });
        }
      }
    });

    const imgData = canvas.toDataURL('image/png', 1.0);
    
    // 3. Initialize jsPDF (A4 dimensions)
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth  = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // Calculate image dimensions to fit PDF width
    const imgWidth  = pdfWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // 4. Handle Multi-page Splitting
    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pdfHeight;

    // Add subsequent pages if content overflows
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;
    }

    // 5. Finalize — Capacitor/mobile safe download
    // In Android WebView, pdf.save() (which uses <a>.click()) is blocked.
    // Instead, output as blob and use Web Share API if available, else fallback.
    const pdfBlob = pdf.output('blob');
    const pdfFilename = filename;

    if (navigator.canShare && navigator.canShare({ files: [new File([pdfBlob], pdfFilename, { type: 'application/pdf' })] })) {
      // Mobile / Capacitor: share sheet
      try {
        await navigator.share({
          files: [new File([pdfBlob], pdfFilename, { type: 'application/pdf' })],
          title: 'BondIQ Report',
          text: 'Your BondIQ Relationship Report',
        });
      } catch (shareErr) {
        // User cancelled — not an error
        console.log('[BondIQ] PDF share cancelled:', shareErr);
      }
    } else {
      // Web browser fallback: anchor download
      const blobUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = pdfFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    }

    return true;
    
  } catch (err) {
    console.error('[ExportService] Export failed:', err);
    throw err;
  } finally {
    // Restore scroll position
    window.scrollTo(0, originalScrollY);
  }
}
