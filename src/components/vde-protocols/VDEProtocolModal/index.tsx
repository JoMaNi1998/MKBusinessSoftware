import React, { useEffect, useMemo, useState, FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, FileText, Printer, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMaterials } from '../../../context/MaterialContext';
import { useNotification } from '../../../context/NotificationContext';
import { FirebaseService } from '../../../services/firebaseService';
import { NotificationType } from '../../../types/enums';

import { SPEC, initialVdeData, pageNames } from './constants';
import { pageComponents } from './pages';
import {
  VDEProtocolModalProps,
  VDEData,
  VDEProtocol,
  ProjectConfiguration,
  Material,
  InverterConfig,
} from './types';

interface FormErrors {
  customerName?: string;
  address?: string;
}

const VDEProtocolModal: React.FC<VDEProtocolModalProps> = ({
  isOpen,
  onClose,
  protocol = null,
  hideActions = false,
}) => {
  const { materials } = useMaterials() as { materials: Material[] };
  const { showNotification } = useNotification();

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [vdeData, setVdeData] = useState<VDEData>(initialVdeData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [printMount, setPrintMount] = useState<HTMLDivElement | null>(null);

  // Einen dedizierten Knoten für den Druck an <body> erzeugen (nur wenn Modal offen)
  useEffect(() => {
    if (!isOpen) return;
    const el = document.createElement('div');
    el.id = 'vde-print-root';
    el.style.display = 'none'; // am Bildschirm versteckt – wird per @media print überschrieben
    document.body.appendChild(el);
    setPrintMount(el);
    return () => {
      document.body.removeChild(el);
      setPrintMount(null);
    };
  }, [isOpen]);

  // Ableitungen aus Projekt- oder Protokolldaten
  useEffect(() => {
    if (!isOpen) return;

    // Gespeichertes Protokoll?
    if ((protocol as VDEProtocol)?.vdeData) {
      setVdeData((prev) => ({ ...prev, ...(protocol as VDEProtocol).vdeData }));
      return;
    }

    // Projektkonfiguration als Quelle
    const cfg = (protocol || {}) as ProjectConfiguration & {
      customerName?: string;
      address?: string;
      projectName?: string;
    };
    const next: VDEData = { ...initialVdeData };

    next.customerName = cfg.customerName || '';
    next.address = cfg.address || '';
    next.projectName = cfg.projectName || '';

    // Module
    if (cfg.modules?.materialID && Array.isArray(materials)) {
      const mat = materials.find((m) => m.id === cfg.modules!.materialID);
      const get = (id: string): string =>
        (mat?.specifications?.[id] ?? '')?.toString().replace(',', '.');

      next.moduleType = cfg.modules?.description || '';
      next.moduleCount = String(cfg.modules?.totalQuantity || '');
      next.modulePmaxDC = get(SPEC.MODULE.PMAX_DC);
      next.moduleUoc = get(SPEC.MODULE.UOC);
      next.moduleIsc = get(SPEC.MODULE.ISC);
      next.moduleUmpp = get(SPEC.MODULE.UMPP);

      const pWp = parseFloat(next.modulePmaxDC || '0');
      const cnt = parseFloat(String(next.moduleCount || '0'));
      if (pWp && cnt) next.installedPower = ((pWp * cnt) / 1000).toFixed(2);
    }

    // Wechselrichter
    if (Array.isArray(cfg.inverters)) {
      next.inverterCount = String(
        cfg.inverters.reduce((sum, i) => sum + (i.quantity || 0), 0) || ''
      );

      // eindeutige materialIDs
      const seen = new Set<string>();
      const unique = cfg.inverters.filter((i) => {
        if (!i.materialID || seen.has(i.materialID)) return false;
        seen.add(i.materialID);
        return true;
      });

      unique.forEach((inv: InverterConfig, idx: number) => {
        const invNum = idx + 1;
        (next as VDEData)[`inverterType${invNum}`] = inv.description || '';
        if (inv.materialID && Array.isArray(materials)) {
          const mat = materials.find((m) => m.id === inv.materialID);
          const get = (id: string): string =>
            (mat?.specifications?.[id] ?? '')?.toString().replace(',', '.');
          (next as VDEData)[`inverterPmaxDC${invNum}`] = get(SPEC.INV.PMAX_DC);
          (next as VDEData)[`inverterPnomAC${invNum}`] = get(SPEC.INV.PNOM_AC);
          (next as VDEData)[`inverterPmaxAC${invNum}`] = get(SPEC.INV.PMAX_AC);

          // Seite 5 Schutzangaben
          (next as VDEData)[`inverter${idx}_isolationMonitoring`] = get(SPEC.INV.ISO_MON);
          (next as VDEData)[`inverter${idx}_dcOvervoltageProtection`] = get(SPEC.INV.SPD_DC);
          (next as VDEData)[`inverter${idx}_acOvervoltageProtection`] = get(SPEC.INV.SPD_AC);
          (next as VDEData)[`inverter${idx}_residualCurrentMonitoring`] = get(SPEC.INV.RCM);
          (next as VDEData)[`inverter${idx}_acOvercurrentProtection`] = get(SPEC.INV.AC_OC);
          (next as VDEData)[`inverter${idx}_acShortCircuitProtection`] = get(SPEC.INV.AC_SC);
          (next as VDEData)[`inverter${idx}_arcFaultDetection`] = get(SPEC.INV.AFCI);
        }
      });
    }

    // GAK
    if (cfg?.generatoranschlusskasten?.materialID && Array.isArray(materials)) {
      const gakMaterial = materials.find((m) => m.id === cfg.generatoranschlusskasten!.materialID);
      if (gakMaterial?.specifications) {
        const getGak = (id: string): string =>
          (gakMaterial.specifications![id] ?? '')?.toString().replace(',', '.');
        if (Array.isArray(cfg.inverters)) {
          const uniqueInverters = cfg.inverters.filter(
            (inv, idx, arr) => arr.findIndex((i) => i.materialID === inv.materialID) === idx
          );
          uniqueInverters.forEach((inv, idx) => {
            (next as VDEData)[`inverter${idx}_spdType`] = getGak(SPEC.GAK.SPD_TYPE);
            (next as VDEData)[`inverter${idx}_ratedCurrent`] = getGak(SPEC.GAK.RATED_CURRENT);
            (next as VDEData)[`inverter${idx}_ratedVoltage`] = getGak(SPEC.GAK.RATED_VOLTAGE);
          });
        }
      }
    }

    // Verdrahtung
    if (cfg?.pvCables?.materialID && Array.isArray(materials)) {
      const pvCableMaterial = materials.find((m) => m.id === cfg.pvCables!.materialID);
      if (pvCableMaterial?.specifications) {
        const getPv = (id: string): string =>
          (pvCableMaterial.specifications![id] ?? '')?.toString().replace(',', '.');
        if (Array.isArray(cfg.inverters)) {
          const uniqueInverters = cfg.inverters.filter(
            (inv, idx, arr) => arr.findIndex((i) => i.materialID === inv.materialID) === idx
          );
          uniqueInverters.forEach((inv, idx) => {
            (next as VDEData)[`inverter${idx}_wiringType`] = getPv(SPEC.WIRING.WIRING_TYPE);
            (next as VDEData)[`inverter${idx}_phaseLeader`] = getPv(SPEC.WIRING.PHASE_LEADER);
          });
        }
      }
    }

    // Potentialausgleich
    if (cfg?.potentialausgleichHESUK?.materialID && Array.isArray(materials)) {
      const hesukMaterial = materials.find((m) => m.id === cfg.potentialausgleichHESUK!.materialID);
      if (hesukMaterial?.specifications) {
        const getPA = (id: string): string =>
          (hesukMaterial.specifications![id] ?? '')?.toString().replace(',', '.');
        if (Array.isArray(cfg.inverters)) {
          const uniqueInverters = cfg.inverters.filter(
            (inv, idx, arr) => arr.findIndex((i) => i.materialID === inv.materialID) === idx
          );
          uniqueInverters.forEach((inv, idx) => {
            (next as VDEData)[`inverter${idx}_earthLeader`] = getPA(SPEC.WIRING.EARTH_LEADER);
          });
        }
      }
    }

    // Strings (Fallback)
    next.strings =
      cfg?.inverters?.[0]?.strings?.map((s, i) => ({
        id: i + 1,
        name: s.stringName || `String ${i + 1}`,
        moduleCount: cfg.modules?.totalQuantity || 0,
      })) || [];

    next.projectConfig = cfg as ProjectConfiguration;
    next.materials = materials;

    setVdeData(next);
  }, [isOpen, protocol, materials]);

  const handleVdeDataChange = (field: string, value: unknown): void => {
    setVdeData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    const errs: FormErrors = {};
    if (!vdeData.customerName) errs.customerName = 'Kundenname ist erforderlich';
    if (!vdeData.address) errs.address = 'Adresse ist erforderlich';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const protocolNumber =
        (protocol as VDEProtocol)?.protocolNumber ||
        `VDE-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

      // Leistung (kWp) berechnen, wenn möglich
      let powerKwp = parseFloat(vdeData.installedPower) || 0;
      if (vdeData.projectConfig?.modules?.materialID && vdeData.materials) {
        const moduleMat = vdeData.materials.find(
          (m) => m.id === vdeData.projectConfig!.modules!.materialID
        );
        const pWp =
          parseFloat(
            String(moduleMat?.specifications?.[SPEC.MODULE.PMAX_DC] ?? '').replace(',', '.')
          ) || 0;
        const cnt = vdeData.projectConfig?.modules?.totalQuantity || 0;
        powerKwp = pWp && cnt ? parseFloat(((pWp * cnt) / 1000).toFixed(2)) : powerKwp;
      }

      const protocolData = {
        protocolNumber,
        projectID: (protocol as ProjectConfiguration & { projectID?: string })?.projectID || '',
        customerName: vdeData.customerName || '',
        address: vdeData.address,
        projectName:
          (protocol as ProjectConfiguration & { projectName?: string })?.projectName ||
          vdeData.projectName ||
          '-',
        vdeData, // vollständiger Zustand
        power: powerKwp,
        moduleCount:
          vdeData.projectConfig?.modules?.totalQuantity ||
          parseInt(vdeData.moduleCount || '0', 10) ||
          0,
        stringCount:
          (vdeData.projectConfig?.inverters || []).reduce(
            (t, inv) => t + (inv.strings?.length || 0),
            0
          ) ||
          vdeData.strings?.length ||
          1,
        inverterModel:
          vdeData.projectConfig?.inverters?.[0]?.description || vdeData.inverterType || 'Unbekannt',
        status: (protocol as VDEProtocol)?.status || 'Erstellt',
        createdDate: (protocol as VDEProtocol)?.createdDate || new Date(),
        updatedDate: new Date(),
      };

      if ((protocol as VDEProtocol)?.id) {
        await FirebaseService.updateDocument(
          'vde-protocols',
          (protocol as VDEProtocol).id,
          protocolData
        );
        showNotification('VDE-Protokoll aktualisiert', NotificationType.SUCCESS);
      } else {
        await FirebaseService.addDocument('vde-protocols', protocolData);
        showNotification('VDE-Protokoll erstellt', NotificationType.SUCCESS);
      }

      onClose();
    } catch (err) {
      console.error('Error saving VDE protocol:', err);
      showNotification('Fehler beim Speichern des Protokolls', NotificationType.ERROR);
    } finally {
      setIsLoading(false);
    }
  };

  /** PRINT: Rendert alle Seiten im Print-Container und ruft den Browser-Dialog auf */
  const handlePrintAll = (): void => {
    // einen Frame warten, damit das Portal sicher gemountet ist
    requestAnimationFrame(() => window.print());
  };

  const CurrentPage = useMemo(
    () => pageComponents[Math.min(Math.max(currentPage, 1), pageComponents.length) - 1],
    [currentPage]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 !m-0 !top-0">
      {/* PRINT STYLES (robust): Keine doppelten Ränder mehr */}
      <style>{`
        @media print {
          /* 1) Keine doppelten Ränder mehr auf @page */
          @page { size: A4 portrait; margin: 0; }

          /* 2) Nur den Portal-Root drucken (wie zuvor) */
          body > *:not(#vde-print-root) { display: none !important; }
          #vde-print-root { display: block !important; }

          /* 3) A4-Layout: Padding = Seitenrand, Höhe exakt A4 (inkl. Padding) */
          #vde-print-root .page {
            width: 210mm !important;
            min-height: calc(297mm - 0.1mm) !important; /* kleine Toleranz gegen Rundungsfehler */
            padding: 12mm !important;                   /* Innenrand statt @page margin */
            box-sizing: border-box !important;          /* Padding in Höhe mitrechnen */
            margin: 0 auto !important;
            break-after: page;                          /* moderner Umbruch */
          }
          #vde-print-root .page:last-child { break-after: auto; }

          /* 4) Tailwind-Padding/-Höhen überschreiben, damit nichts doppelt zählt */
          #vde-print-root .page.p-6,
          #vde-print-root .page.p-8 { padding: 12mm !important; }

          /* 5) Typografie-Margins zurücksetzen */
          #vde-print-root h1,
          #vde-print-root h2,
          #vde-print-root h3 { margin-top: 0; }
        }
      `}</style>

      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col no-print">
        {/* Header mit Titel links und Buttons rechts - wie bei Angebotsvorschau */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <FileText className="h-5 w-5 text-gray-600" />
            <span className="text-lg font-semibold text-gray-900">
              {protocol ? 'VDE-Protokoll bearbeiten' : 'VDE-Protokoll erstellen'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {/* Navigation */}
            <div className="flex items-center space-x-1 mr-4">
              <span className="text-sm text-gray-500">
                Seite {currentPage} von {pageComponents.length}:
              </span>
              <span className="text-sm font-medium text-gray-700">{pageNames[currentPage - 1]}</span>
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Zurück
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(pageComponents.length, p + 1))}
              disabled={currentPage === pageComponents.length}
              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              Weiter
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
            {!hideActions && (
              <button
                type="button"
                onClick={handlePrintAll}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center font-medium ml-2"
                title="Drucken oder als PDF speichern"
              >
                <Printer className="h-4 w-4 mr-2" />
                Drucken
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg ml-2"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollbarer Inhalt - Vorschau mit grauem Hintergrund */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 bg-gray-100">
            <div className="max-w-[210mm] mx-auto">
              {/* A4-Seiten-Vorschau */}
              <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                <CurrentPage vdeData={vdeData} handleVdeDataChange={handleVdeDataChange} />
              </div>
            </div>
          </div>

          {/* Footer mit Buttons */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-white flex-shrink-0">
            {/* Validierungs-Hinweis */}
            {Object.keys(errors).length > 0 && (
              <div className="text-sm text-red-700">
                {errors.customerName && <span>• {errors.customerName} </span>}
                {errors.address && <span>• {errors.address}</span>}
              </div>
            )}
            {Object.keys(errors).length === 0 && <div />}

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 flex items-center space-x-2 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>
                  {isLoading
                    ? 'Speichert…'
                    : (protocol as VDEProtocol)?.id
                      ? 'Aktualisieren'
                      : 'Speichern'}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* PRINT PORTAL: rendert ALLE Seiten direkt an <body> (außerhalb des Modals) */}
      {printMount &&
        createPortal(
          <>
            {pageComponents.map((Comp, idx) => (
              <Comp key={idx} vdeData={vdeData} handleVdeDataChange={handleVdeDataChange} />
            ))}
          </>,
          printMount
        )}
    </div>
  );
};

export default VDEProtocolModal;
