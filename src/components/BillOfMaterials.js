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

const cn = (...c) => c.filter(Boolean).join(' ');
const toNumber = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

const getCustomerById = (customers, id) => customers.find((c) => c.id === id);
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
            totalUnits: itemsPerUnit * (prev.quantity + toNumber(bm.quantity, 0))
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
            categoryId: m.categoryId ?? null
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
  const summary = useMemo(
    () => ({
      positions: bomItems.length,
      totalUnits: bomItems.reduce((s, x) => s + toNumber(x.totalUnits, 0), 0)
    }),
    [bomItems]
  );

  // ---- UI: Projektauswahl ----
  if (showProjectSelect) {
    return (
      <div className="h-full flex flex-col bg-white">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <FileText className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">Stückliste</h1>
          </div>
        </div>

        {/* Projektauswahl */}
        <div className="flex-1 p-6">
          <div className="max-w-2xl mx-auto">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Projekt suchen…"
                value={projectSearch}
                onChange={(e) => setProjectSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="space-y-1 max-h-72 overflow-y-auto">
              {filteredProjects.map((project) => {
                const c = customersById.get(project.customerID);
                return (
                  <button
                    key={project.id}
                    onClick={() => handleProjectSelect(project)}
                    className="w-full text-left flex items-center space-x-3 p-2 hover:bg-gray-50 cursor-pointer transition-colors rounded"
                  >
                    <Building className="h-4 w-4 text-gray-400" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{project.name}</p>
                      <p className="text-xs text-gray-600">
                        {getCustomerName(c)} • {project.status}
                      </p>
                    </div>
                  </button>
                );
              })}

              {filteredProjects.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">Keine Projekte gefunden</p>
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
    <div className="h-full flex flex-col bg-white">
      {/* Header (nicht druckbar) */}
      <div className="flex-shrink-0 border-b border-gray-200 p-6 print:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileText className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Stückliste</h1>
              <p className="text-gray-600">{selectedProject?.name}</p>
            </div>
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
              className="flex items-center space-x-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
              title="Aus Buchungen aktualisieren"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Aktualisieren</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              title="Drucken"
            >
              <Printer className="h-4 w-4" />
              <span>Drucken</span>
            </button>
          </div>
        </div>
      </div>

      {/* Druckbarer Inhalt */}
      <div className="flex-1 overflow-auto print:overflow-visible">
        <div className="p-8 print:p-0 print:m-0">
          {/* Kopf */}
          <div className="mb-6 print:mb-2">
            <div className="text-center mb-4 print:mb-1">
              <h1 className="text-2xl font-bold text-gray-900 print:text-black print:text-lg">
                STÜCKLISTE
              </h1>
            </div>

            <div className="bg-gray-50 print:bg-white print:border print:border-gray-300 rounded-lg p-4 print:p-2">
              {/* App-Ansicht */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Building className="h-4 w-4 text-gray-600" />
                    <span className="font-semibold text-gray-900">Projekt:</span>
                  </div>
                  <p className="text-base font-medium text-gray-900">
                    {selectedProject?.name || 'Unbekanntes Projekt'}
                  </p>
                  <p className="text-sm text-gray-600">Status: {selectedProject?.status || 'Unbekannt'}</p>
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <User className="h-4 w-4 text-gray-600" />
                    <span className="font-semibold text-gray-900">Kunde:</span>
                  </div>
                  <p className="text-gray-900">{getCustomerName(customer)}</p>
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <MapPin className="h-4 w-4 text-gray-600" />
                    <span className="font-semibold text-gray-900">Adresse:</span>
                  </div>
                  <p className="text-gray-900">{getCustomerAddress(customer)}</p>
                </div>
              </div>

              {/* Druck-Ansicht */}
              <div className="hidden print:block text-sm space-y-1">
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

          {/* Tabelle */}
          <div className="bg-white print:bg-white">
            <table className="w-full border-collapse border border-gray-300 print:border-black">
              <thead>
                <tr className="bg-gray-100 print:bg-gray-200">
                  <th className="border border-gray-300 print:border-black px-4 py-3 text-left font-semibold text-gray-900 print:text-black w-16">
                    Pos.
                  </th>
                  <th className="border border-gray-300 print:border-black px-4 py-3 text-left font-semibold text-gray-900 print:text-black">
                    Material
                  </th>
                  <th className="border border-gray-300 print:border-black px-4 py-3 text-left font-semibold text-gray-900 print:text-black w-40">
                    Stück pro Einheit
                  </th>
                  <th className="border border-gray-300 print:border-black px-4 py-3 text-left font-semibold text-gray-900 print:text-black w-28">
                    Anzahl
                  </th>
                  <th className="border border-gray-300 print:border-black px-4 py-3 text-center w-16 print:hidden">
                    Aktion
                  </th>
                </tr>
              </thead>
              <tbody>
                {bomItems.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50 print:hover:bg-white">
                    <td className="border border-gray-300 print:border-black px-4 py-3 text-gray-900 print:text-black text-center">
                      {index + 1}
                    </td>
                    <td className="border border-gray-300 print:border-black px-4 py-3 align-top">
                      <div>
                        <p className="font-medium text-gray-900 print:text-black">
                          {item.description || item.name}
                        </p>
                        <p className="text-sm text-gray-500 print:text-gray-700">{item.materialID}</p>
                      </div>
                    </td>
                    <td className="border border-gray-300 print:border-black px-4 py-3 text-gray-900 print:text-black text-center">
                      {item.itemsPerUnit || 1}
                    </td>
                    <td className="border border-gray-300 print:border-black px-4 py-3 text-gray-900 print:text-black">
                      {/* Screen: Input | Print: Klartext */}
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                        className="print:hidden w-full px-2 py-1 border border-gray-300 rounded text-center"
                        min="1"
                      />
                      <span className="hidden print:block text-center">
                        {item.quantity}
                      </span>
                    </td>
                    <td className="border border-gray-300 print:border-black px-4 py-3 text-center print:hidden">
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

            {bomItems.length === 0 && (
              <div className="text-center py-8 text-gray-500 print:hidden">
                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Keine Materialien für dieses Projekt gebucht</p>
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
