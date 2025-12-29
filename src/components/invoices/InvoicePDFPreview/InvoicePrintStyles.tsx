import React from 'react';

const InvoicePrintStyles: React.FC = () => {
  return (
    <style>{`
      @media print {
        @page {
          size: A4 portrait;
          margin: 10mm 12mm 5mm 12mm;
        }

        /* Nur den Print-Portal-Root drucken */
        body > *:not(#invoice-print-root) { display: none !important; }
        #invoice-print-root { display: block !important; }

        /* Hauptseite */
        #invoice-print-root .page {
          width: 100% !important;
          padding: 0 !important;
          margin: 0 !important;
          box-sizing: border-box !important;
          position: relative;
          overflow: visible !important;
        }

        /* Seiten-Container */
        #invoice-print-root .page-content {
          display: block !important;
          padding: 0 !important;
        }

        /* Hauptinhalt - Überlauf erlauben */
        #invoice-print-root .page-body {
          overflow: visible !important;
        }

        /* Tabellen ohne implizite Borders - nur äußere Wrapper-Tabelle */
        #invoice-print-root > .page > .page-content > .page-body > table {
          border-collapse: collapse;
          border: none !important;
        }

        #invoice-print-root > .page > .page-content > .page-body > table > tbody,
        #invoice-print-root > .page > .page-content > .page-body > table > tbody > tr,
        #invoice-print-root > .page > .page-content > .page-body > table > tbody > tr > td {
          border: none !important;
        }

        /* Innere Tabellen (Positionen) behalten ihre Borders */
        #invoice-print-root table table {
          border-collapse: collapse;
        }

        /* Tabellen-Zeilen nicht umbrechen */
        #invoice-print-root table tr {
          break-inside: avoid;
          page-break-inside: avoid;
        }

        /* tfoot als unsichtbarer Spacer - wiederholt sich auf jeder Seite */
        #invoice-print-root .footer-spacer {
          display: table-footer-group !important;
          visibility: hidden !important;
        }

        /* Footer-Spacer komplett ohne Borders */
        #invoice-print-root .footer-spacer,
        #invoice-print-root .footer-spacer tr,
        #invoice-print-root .footer-spacer td {
          border: none !important;
        }

        /* Summenbereich nicht umbrechen */
        #invoice-print-root .summary-section {
          break-inside: avoid;
          page-break-inside: avoid;
        }

        /* Footer auf allen Seiten fixiert */
        #invoice-print-root .page-footer {
          position: fixed !important;
          bottom: 0 !important;
          left: 0 !important;
          right: 0 !important;
          height: 25mm !important;
          padding: 6px 0 !important;
          background: white !important;
          z-index: 500 !important;
          border: none !important;
        }

      }
    `}</style>
  );
};

export default InvoicePrintStyles;
