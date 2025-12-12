import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Printer,
  Search,
  Trash2,
  FileText,
  User,
  MapPin,
  Building,
  RefreshCw
} from 'lucide-react';
import { useCustomers } from '../context/CustomerContext';
import { useProjects } from '../context/ProjectContext';
import { useBookings } from '../context/BookingContext';
import { useMaterials } from '../context/MaterialContext';

const toNumber = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};
const getCustomerName = (c) => c?.firmennameKundenname || c?.name || 'Unbekannter Kunde';
const getCustomerAddress = (c) => {
  if (!c) return 'Keine Adresse';
  const street = c?.address?.street ?? c?.street ?? '';
  const zip = c?.address?.zipCode ?? c?.postalCode ?? '';
  const city = c?.address?.city ?? c?.city ?? '';
  return [street, [zip, city].filter(Boolean).join(' ')].filter(Boolean).join(', ') || 'Keine Adresse';
};

const normalize = (s) => (s || '').toString().toLowerCase();

const BillOfMaterials = () => {
  const { customers } = useCustomers();
  const { projects } = useProjects();
  const { bookings } = useBookings();
  const { materials } = useMaterials();

  const [selectedProject, setSelectedProject] = useState(null);
  const [projectSearch, setProjectSearch] = useState('');
  const [bomItems, setBomItems] = useState([]);
  const [showProjectSelect, setShowProjectSelect] = useState(true);
  const [rebuildVersion, setRebuildVersion] = useState(0); // manueller Refresh aus Buchungen

  // ---- Memoisierte Hilfen ----
  const customersById = useMemo(() => {
    const map = new Map();
    customers.forEach((c) => map.set(c.id, c));
    return map;
  }, [customers]);

  const filteredProjects = useMemo(() => {
    const q = normalize(projectSearch);
    if (!q) return projects;
    return projects.filter((p) => {
      if (!p) return false;
      const customer = customersById.get(p.customerID);
      return (
        normalize(p.name).includes(q) ||
        normalize(p.status).includes(q) ||
        normalize(p.customerName).includes(q) ||
        normalize(getCustomerName(customer)).includes(q)
      );
    });
  }, [projectSearch, projects, customersById]);

  // ---- Aggregation der BOM aus Buchungen/Materialstamm ----
  const computeBOMFromBookings = (project, bookingsList, materialsList) => {
    if (!project) return [];
    // NUR Buchungen des Projekts vom Typ "Ausgang"
    const projectBookings = bookingsList.filter(
      (b) => b?.projectID === project.id && normalize(b?.type) === 'ausgang'
    );

    const map = new Map();
    for (const b of projectBookings) {
      const mats = Array.isArray(b?.materials) ? b.materials : [];
      for (const bm of mats) {
        // Material im Master finden (robuste Matches)
        const m = materialsList.find(
          (x) =>
            x?.id === bm?.materialID ||
            x?.materialID === bm?.materialID ||
            x?.id === bm?.id ||
            x?.materialID === bm?.id
        );
        if (!m) continue;

        const key = m.id || m.materialID || `${m.description || m.name}`;
        const itemsPerUnit = toNumber(m.itemsPerUnit, 1);
        const unit = m.unit || 'Stück';
        const description = m.description || m.name || m.materialID || 'Material';

        if (map.has(key)) {
          const prev = map.get(key);
          map.set(key, {
            ...prev,
            quantity: prev.quantity + toNumber(bm.quantity, 0),
            totalUnits: itemsPerUnit * (prev.quantity + toNumber(bm.quantity, 0)),
            // isConfigured bleibt true wenn bereits true
            isConfigured: prev.isConfigured || bm.isConfigured || false
          });
        } else {
          const qty = toNumber(bm.quantity, 0);
          map.set(key, {
            key,
            id: m.id || m.materialID || key,
            materialID: m.materialID || '',
            description,
            unit,
            itemsPerUnit,
            quantity: qty,
            totalUnits: itemsPerUnit * qty,
            categoryId: m.categoryId ?? null,
            isConfigured: bm.isConfigured || false,
            category: bm.category || ''
          });
        }
      }
    }

    // sortiert nach Beschreibung, dann nach materialID
    return Array.from(map.values()).sort((a, b) => {
      const da = a.description || '';
      const db = b.description || '';
      const cmp = da.localeCompare(db, 'de', { sensitivity: 'base' });
      if (cmp !== 0) return cmp;
      return (a.materialID || '').localeCompare(b.materialID || '', 'de', { sensitivity: 'base' });
    });
  };

  // initial/erzwungenes Rebuild der BOM (bewahrt deine manuellen Änderungen, solange du nicht aktualisierst)
  const initialBuild = useRef(true);
  useEffect(() => {
    if (!selectedProject) return;
    // nur beim Projektwechsel ODER wenn der Benutzer "Aktualisieren" auslöst
    if (!initialBuild.current && rebuildVersion === 0) return;
    const next = computeBOMFromBookings(selectedProject, bookings, materials);
    setBomItems(next);
    initialBuild.current = false;
  }, [selectedProject, rebuildVersion]); // absichtsvoll NICHT bookings/materials, um manuelle Anpassungen nicht zu überschreiben
  // eslint-disable-next-line react-hooks/exhaustive-deps

  const handleRefreshFromBookings = () => {
    setRebuildVersion((v) => v + 1);
    const next = computeBOMFromBookings(selectedProject, bookings, materials);
    setBomItems(next);
  };

  // ---- Aktionen ----
  const handleProjectSelect = (project) => {
    setSelectedProject(project);
    setShowProjectSelect(false);
    setRebuildVersion(0);
    initialBuild.current = true; // erzwingt initialen Build in useEffect
  };

  const handleRemoveItem = (itemId) => {
    setBomItems((prev) => prev.filter((x) => x.id !== itemId));
  };

  const handleQuantityChange = (itemId, newQuantity) => {
    const q = Math.max(0, toNumber(newQuantity, 0));
    if (q === 0) {
      handleRemoveItem(itemId);
      return;
    }
    setBomItems((prev) =>
      prev.map((x) =>
        x.id === itemId
          ? { ...x, quantity: q, totalUnits: (x.itemsPerUnit || 1) * q }
          : x
      )
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const handleNewBOM = () => {
    setSelectedProject(null);
    setBomItems([]);
    setShowProjectSelect(true);
    setProjectSearch('');
    setRebuildVersion(0);
    initialBuild.current = true;
  };


  // ---- Ableitungen ----
  const customer = selectedProject ? customersById.get(selectedProject.customerID) : null;

  // ---- UI: Projektauswahl ----
  if (showProjectSelect) {
    return (
      <div className="h-full flex flex-col space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="pl-12 sm:pl-0">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Stückliste</h1>
            <p className="mt-1 text-sm text-gray-600 hidden sm:block">
              Wählen Sie ein Projekt für die Stückliste
            </p>
          </div>
        </div>

        {/* Statistik */}
        <div className="bg-white p-2 md:p-4 rounded-lg shadow inline-flex items-center gap-3">
          <FileText className="h-5 w-5 md:h-6 md:w-6 text-primary-600" />
          <div>
            <span className="text-base md:text-xl font-bold text-gray-900">{projects.length}</span>
            <span className="text-xs md:text-sm text-gray-600 ml-2">Projekte</span>
          </div>
        </div>

        {/* Suchleiste */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Projekt suchen (Name, Kunde, Status)..."
              value={projectSearch}
              onChange={(e) => setProjectSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Projektliste */}
        <div className="bg-white rounded-lg shadow overflow-hidden flex-1 flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
            <h3 className="text-lg font-medium text-gray-900">Projekt auswählen</h3>
          </div>

          <div className="flex-1 overflow-auto">
            <div className="divide-y divide-gray-200">
              {filteredProjects.map((project) => {
                const c = customersById.get(project.customerID);
                return (
                  <button
                    key={project.id}
                    onClick={() => handleProjectSelect(project)}
                    className="w-full text-left flex items-center space-x-4 px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <Building className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{project.name}</p>
                      <p className="text-sm text-gray-500 truncate">
                        {getCustomerName(c)} • {project.status}
                      </p>
                    </div>
                  </button>
                );
              })}

              {filteredProjects.length === 0 && (
                <div className="text-center py-12">
                  <Building className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Projekte gefunden</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Versuchen Sie andere Suchbegriffe.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---- UI: Stückliste ----
  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header (nicht druckbar) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div className="pl-12 sm:pl-0">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Stückliste</h1>
          <p className="mt-1 text-sm text-gray-600 hidden sm:block">
            {selectedProject?.name}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleNewBOM}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            title="Neues Projekt wählen"
          >
            Zurück
          </button>
          <button
            onClick={handleRefreshFromBookings}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            title="Aus Buchungen aktualisieren"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Aktualisieren</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            title="Drucken"
          >
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Drucken</span>
          </button>
        </div>
      </div>

      {/* Projekt-Info Card */}
      <div className="bg-white rounded-lg shadow p-4 print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start space-x-3">
            <Building className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Projekt</p>
              <p className="font-medium text-gray-900">{selectedProject?.name || 'Unbekannt'}</p>
              <p className="text-sm text-gray-500">Status: {selectedProject?.status || 'Unbekannt'}</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <User className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Kunde</p>
              <p className="font-medium text-gray-900">{getCustomerName(customer)}</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <MapPin className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Adresse</p>
              <p className="font-medium text-gray-900">{getCustomerAddress(customer)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Druckbarer Inhalt - Kopf */}
      <div className="hidden print:block print:mb-2">
        <div className="text-center mb-4 print:mb-1">
          <h1 className="text-2xl font-bold text-gray-900 print:text-black print:text-lg">
            STÜCKLISTE
          </h1>
        </div>
        <div className="bg-gray-50 print:bg-white print:border print:border-gray-300 rounded-lg p-4 print:p-2">
          <div className="text-sm space-y-1">
            <div>
              <span className="font-semibold">Projekt:</span> {selectedProject?.name || 'Unbekanntes Projekt'} ({selectedProject?.status || 'Unbekannt'})
            </div>
            <div>
              <span className="font-semibold">Kunde:</span> {getCustomerName(customer)}
            </div>
            <div>
              <span className="font-semibold">Adresse:</span> {getCustomerAddress(customer)}
            </div>
          </div>
        </div>
      </div>

      {/* Hauptinhalt - Tabellen */}
      <div className="bg-white rounded-lg shadow overflow-hidden flex-1 flex flex-col print:shadow-none print:rounded-none">
        <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0 print:hidden">
          <h3 className="text-lg font-medium text-gray-900">Materialliste</h3>
          <p className="text-sm text-gray-500">{bomItems.length} Positionen</p>
        </div>

        <div className="flex-1 overflow-auto print:overflow-visible">
          <div className="p-6 print:p-0 space-y-6 print:space-y-4">
            {(() => {
              const configuredItems = bomItems.filter(item => item.isConfigured);
              const autoItems = bomItems.filter(item => !item.isConfigured);

              const renderTable = (items, title, bgColor, borderColor, startIndex = 0) => {
                if (items.length === 0) return null;
                return (
                  <div className={`border ${borderColor} rounded-lg overflow-hidden print:rounded-none print:border-gray-300`}>
                    <div className={`${bgColor} px-4 py-2 border-b ${borderColor} print:bg-gray-100 print:border-gray-300`}>
                      <h4 className="font-semibold text-gray-800 text-sm print:text-black">
                        {title}
                        <span className="ml-2 text-xs font-normal text-gray-500 print:text-gray-600">({items.length} Positionen)</span>
                      </h4>
                    </div>
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50 print:bg-gray-100">
                          <th className="border-b border-gray-200 print:border-gray-300 px-4 py-2 text-left text-xs font-medium text-gray-500 print:text-black uppercase w-16">
                            Pos.
                          </th>
                          <th className="border-b border-gray-200 print:border-gray-300 px-4 py-2 text-left text-xs font-medium text-gray-500 print:text-black uppercase">
                            Material
                          </th>
                          <th className="border-b border-gray-200 print:border-gray-300 px-4 py-2 text-left text-xs font-medium text-gray-500 print:text-black uppercase w-32">
                            Stk/Einheit
                          </th>
                          <th className="border-b border-gray-200 print:border-gray-300 px-4 py-2 text-left text-xs font-medium text-gray-500 print:text-black uppercase w-24">
                            Anzahl
                          </th>
                          <th className="border-b border-gray-200 px-4 py-2 text-center w-16 print:hidden">
                            Aktion
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 print:divide-gray-300">
                        {items.map((item, index) => (
                          <tr key={item.id} className="hover:bg-gray-50 print:hover:bg-white">
                            <td className="px-4 py-2 text-gray-900 print:text-black text-center text-sm">
                              {startIndex + index + 1}
                            </td>
                            <td className="px-4 py-2 align-top">
                              <div>
                                <p className="font-medium text-gray-900 print:text-black text-sm">
                                  {item.description || item.name}
                                </p>
                                <p className="text-xs text-gray-500 print:text-gray-600">{item.materialID}</p>
                              </div>
                            </td>
                            <td className="px-4 py-2 text-gray-900 print:text-black text-center text-sm">
                              {item.itemsPerUnit || 1}
                            </td>
                            <td className="px-4 py-2 text-gray-900 print:text-black">
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                className="print:hidden w-full px-2 py-1 border border-gray-300 rounded text-center text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                min="1"
                              />
                              <span className="hidden print:block text-center text-sm">
                                {item.quantity}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-center print:hidden">
                              <button
                                onClick={() => handleRemoveItem(item.id)}
                                className="text-red-600 hover:text-red-800 transition-colors"
                                title="Position entfernen"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              };

              return (
                <>
                  {renderTable(configuredItems, 'Konfigurierte Komponenten', 'bg-primary-50', 'border-primary-200', 0)}
                  {renderTable(autoItems, 'Automatisch berechnetes Material', 'bg-gray-50', 'border-gray-200', configuredItems.length)}
                </>
              );
            })()}

            {bomItems.length === 0 && (
              <div className="text-center py-12 print:hidden">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Materialien</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Für dieses Projekt wurden noch keine Materialien gebucht.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Print Styles (global, dezent) */}
      <style>
        {`
          @media print {
            @page { size: A4; margin: 12mm; }

            /* Grundlegende Print-Bereinigung, ohne harte Resets */
            html, body { background: #fff !important; }
            .print\\:hidden { display: none !important; }
            .hidden.print\\:block { display: block !important; }

            /* Verstecke alle UI-Elemente außer Druckinhalt */
            nav, header, aside, .sidebar, [role="navigation"], [role="banner"] { display: none !important; }

            /* Verstecke Sidebar und alle Navigations-Buttons */
            .fixed.top-4.left-4, .fixed.inset-0.z-40 { display: none !important; }
            button:not(.print-button), .menu-button, [data-testid*="menu"] { display: none !important; }
            .hamburger, .mobile-menu, .nav-toggle { display: none !important; }

            /* Verstecke speziell das Hamburger-Menü der Sidebar */
            .lg\\:hidden button { display: none !important; }

            /* Entferne Web-Styles von Inputs im Druck */
            input { border: none !important; background: transparent !important; padding: 0 !important; }

            /* Sichere klare Tabellenrahmen */
            table, th, td { border-color: #000 !important; }

            /* Verhindere Layout-Verschiebungen */
            .print\\:overflow-visible { overflow: visible !important; }
            .print\\:p-0 { padding: 0 !important; }
            .print\\:m-0 { margin: 0 !important; }
          }
        `}
      </style>
    </div>
  );
};

export default BillOfMaterials;
