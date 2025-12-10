import html2pdf from 'html2pdf.js';

/**
 * Generiert ein PDF aus einem HTML-Element mit Footer auf jeder Seite
 * @param {HTMLElement} element - Das HTML-Element das als PDF exportiert werden soll
 * @param {string} filename - Der Dateiname für das PDF (ohne .pdf Endung)
 * @param {Object} options - Optionale Konfiguration
 * @param {Object} footerData - Footer-Daten (column1, column2, column3)
 * @returns {Promise} - Promise das resolved wenn PDF fertig ist
 */
export const generatePDF = async (element, filename, options = {}, footerData = null) => {
  const defaultOptions = {
    margin: [10, 10, 28, 10], // [top, right, bottom, left] in mm - mehr Platz unten für Footer
    filename: `${filename}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      letterRendering: true,
      logging: false,
      backgroundColor: '#ffffff'
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait'
    },
    pagebreak: {
      mode: ['avoid-all', 'css', 'legacy'],
      before: '.pdf-page-break',
      avoid: ['.print-no-break', 'tr', 'h2', 'h3']
    }
  };

  const mergedOptions = { ...defaultOptions, ...options };

  try {
    const worker = html2pdf().set(mergedOptions).from(element);

    // PDF generieren und jsPDF-Instanz erhalten
    const pdf = await worker.toPdf().get('pdf');

    // Footer auf jeder Seite hinzufügen
    if (footerData && (footerData.column1 || footerData.column2 || footerData.column3)) {
      const totalPages = pdf.internal.getNumberOfPages();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);

        // Linie über dem Footer
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.3);
        pdf.line(10, pageHeight - 20, pageWidth - 10, pageHeight - 20);

        // Footer Text
        pdf.setFontSize(7);
        pdf.setTextColor(100, 100, 100);

        const footerY = pageHeight - 15;
        const colWidth = (pageWidth - 20) / 3;

        // Spalte 1 - links
        if (footerData.column1) {
          const lines1 = footerData.column1.split('\n');
          lines1.forEach((line, idx) => {
            pdf.text(line, 10, footerY + (idx * 3));
          });
        }

        // Spalte 2 - mitte
        if (footerData.column2) {
          const lines2 = footerData.column2.split('\n');
          lines2.forEach((line, idx) => {
            pdf.text(line, pageWidth / 2, footerY + (idx * 3), { align: 'center' });
          });
        }

        // Spalte 3 - rechts
        if (footerData.column3) {
          const lines3 = footerData.column3.split('\n');
          lines3.forEach((line, idx) => {
            pdf.text(line, pageWidth - 10, footerY + (idx * 3), { align: 'right' });
          });
        }
      }
    }

    // PDF speichern
    pdf.save(`${filename}.pdf`);

    return { success: true };
  } catch (error) {
    console.error('PDF-Generierung fehlgeschlagen:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Generiert ein PDF und gibt es als Blob zurück
 * @param {HTMLElement} element - Das HTML-Element
 * @param {Object} options - Optionale Konfiguration
 * @param {Object} footerData - Footer-Daten
 * @returns {Promise<Blob>} - PDF als Blob
 */
export const generatePDFBlob = async (element, options = {}, footerData = null) => {
  const defaultOptions = {
    margin: [10, 10, 28, 10],
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      letterRendering: true,
      logging: false,
      backgroundColor: '#ffffff'
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait'
    },
    pagebreak: {
      mode: ['avoid-all', 'css', 'legacy'],
      before: '.pdf-page-break',
      avoid: ['.print-no-break', 'tr', 'h2', 'h3']
    }
  };

  const mergedOptions = { ...defaultOptions, ...options };

  try {
    const worker = html2pdf().set(mergedOptions).from(element);
    const pdf = await worker.toPdf().get('pdf');

    // Footer auf jeder Seite hinzufügen
    if (footerData && (footerData.column1 || footerData.column2 || footerData.column3)) {
      const totalPages = pdf.internal.getNumberOfPages();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);

        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.3);
        pdf.line(10, pageHeight - 20, pageWidth - 10, pageHeight - 20);

        pdf.setFontSize(7);
        pdf.setTextColor(100, 100, 100);

        const footerY = pageHeight - 15;

        if (footerData.column1) {
          const lines1 = footerData.column1.split('\n');
          lines1.forEach((line, idx) => {
            pdf.text(line, 10, footerY + (idx * 3));
          });
        }

        if (footerData.column2) {
          const lines2 = footerData.column2.split('\n');
          lines2.forEach((line, idx) => {
            pdf.text(line, pageWidth / 2, footerY + (idx * 3), { align: 'center' });
          });
        }

        if (footerData.column3) {
          const lines3 = footerData.column3.split('\n');
          lines3.forEach((line, idx) => {
            pdf.text(line, pageWidth - 10, footerY + (idx * 3), { align: 'right' });
          });
        }
      }
    }

    return pdf.output('blob');
  } catch (error) {
    console.error('PDF-Generierung fehlgeschlagen:', error);
    throw error;
  }
};
