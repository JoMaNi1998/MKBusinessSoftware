import { useEffect, useMemo, useRef, useState } from 'react';
import { useCustomers } from '../../context/CustomerContext';
import { useProjects } from '../../context/ProjectContext';
import { useBookings } from '../../context/BookingContext';
import { useMaterials } from '../../context/MaterialContext';

// Helper-Funktionen
const toNumber = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

const normalize = (s) => (s || '').toString().toLowerCase();

export const getCustomerName = (c) => c?.firmennameKundenname || c?.name || 'Unbekannter Kunde';

export const getCustomerAddress = (c) => {
  if (!c) return 'Keine Adresse';
  const street = c?.address?.street ?? c?.street ?? '';
  const zip = c?.address?.zipCode ?? c?.postalCode ?? '';
  const city = c?.address?.city ?? c?.city ?? '';
  return [street, [zip, city].filter(Boolean).join(' ')].filter(Boolean).join(', ') || 'Keine Adresse';
};

// BOM-Berechnung aus Buchungen
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

export const useBillOfMaterials = () => {
  const { customers } = useCustomers();
  const { projects } = useProjects();
  const { bookings } = useBookings();
  const { materials } = useMaterials();

  const [selectedProject, setSelectedProject] = useState(null);
  const [projectSearch, setProjectSearch] = useState('');
  const [bomItems, setBomItems] = useState([]);
  const [showProjectSelect, setShowProjectSelect] = useState(true);
  const [rebuildVersion, setRebuildVersion] = useState(0);

  // Memoisierte Hilfen
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

  // Initial/erzwungenes Rebuild der BOM
  const initialBuild = useRef(true);
  useEffect(() => {
    if (!selectedProject) return;
    if (!initialBuild.current && rebuildVersion === 0) return;
    const next = computeBOMFromBookings(selectedProject, bookings, materials);
    setBomItems(next);
    initialBuild.current = false;
  }, [selectedProject, rebuildVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  // Aktionen
  const handleProjectSelect = (project) => {
    setSelectedProject(project);
    setShowProjectSelect(false);
    setRebuildVersion(0);
    initialBuild.current = true;
  };

  const handleRefreshFromBookings = () => {
    setRebuildVersion((v) => v + 1);
    const next = computeBOMFromBookings(selectedProject, bookings, materials);
    setBomItems(next);
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

  // Ableitungen
  const customer = selectedProject ? customersById.get(selectedProject.customerID) : null;

  return {
    // State
    selectedProject,
    projectSearch,
    setProjectSearch,
    bomItems,
    showProjectSelect,
    // Abgeleitete Daten
    projects,
    customersById,
    filteredProjects,
    customer,
    // Aktionen
    handleProjectSelect,
    handleRefreshFromBookings,
    handleRemoveItem,
    handleQuantityChange,
    handlePrint,
    handleNewBOM
  };
};
