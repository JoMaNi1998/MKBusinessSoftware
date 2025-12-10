import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Users,
  Package,
  Edit,
  CheckCircle,
  Plus,
  Trash2,
  Eye,
  TrendingDown,
  Save,
  Send,
  FileText
} from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useInvoices, INVOICE_STATUS } from '../../context/InvoiceContext';
import { useOffers } from '../../context/OfferContext';
import { useCalculation } from '../../context/CalculationContext';
import { useCustomers } from '../../context/CustomerContext';
import { useProjects } from '../../context/ProjectContext';
import { useNotification } from '../../context/NotificationContext';
import { useCompany } from '../../context/CompanyContext';

// Wizard Steps
const STEPS = [
  { id: 0, title: 'Kunde', icon: Users },
  { id: 1, title: 'Positionen', icon: Edit },
  { id: 2, title: 'Vorschau', icon: Eye }
];

const InvoiceConfigurator = () => {
  const navigate = useNavigate();
  const { id: invoiceId } = useParams();
  const location = useLocation();
  const isEditing = !!invoiceId;

  // URL Query Parameter für Angebots-Referenz
  const queryParams = new URLSearchParams(location.search);
  const fromOfferId = queryParams.get('fromOffer');

  const { createInvoice, updateInvoice, getInvoiceById } = useInvoices();
  const { getOfferById } = useOffers();
  const { calculateOfferTotals, settings: calcSettings } = useCalculation();
  const { customers } = useCustomers();
  const { projects } = useProjects();
  const { showNotification } = useNotification();
  const { company, invoiceTexts } = useCompany();

  // State
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Kunde/Projekt
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedProject, setSelectedProject] = useState('');

  // Rechnungsdaten
  const [invoiceData, setInvoiceData] = useState({
    items: [],
    totals: {
      subtotalNet: 0,
      discountPercent: 0,
      discountAmount: 0,
      netTotal: 0,
      taxRate: 19,
      taxAmount: 0,
      grossTotal: 0
    },
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    paymentTerms: '',
    notes: '',
    offerID: null,
    offerNumber: null
  });

  const [validationErrors, setValidationErrors] = useState({});

  // Aus Angebot laden
  useEffect(() => {
    if (fromOfferId && !isEditing) {
      const offer = getOfferById(fromOfferId);
      if (offer) {
        setSelectedCustomer(offer.customerID || '');
        setSelectedProject(offer.projectID || '');

        // Fälligkeitsdatum berechnen
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 14);

        setInvoiceData({
          items: (offer.items || []).map(item => ({
            ...item,
            id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          })),
          totals: offer.totals || {},
          invoiceDate: new Date().toISOString().split('T')[0],
          dueDate: dueDate.toISOString().split('T')[0],
          paymentTerms: calcSettings.offerDefaults?.paymentTerms || '14 Tage netto',
          notes: `Basierend auf Angebot ${offer.offerNumber}`,
          offerID: offer.id,
          offerNumber: offer.offerNumber
        });

        showNotification(`Daten aus Angebot ${offer.offerNumber} übernommen`, 'info');
      }
    }
  }, [fromOfferId, isEditing, getOfferById, calcSettings, showNotification]);

  // Bestehende Rechnung laden
  useEffect(() => {
    if (isEditing && invoiceId) {
      const existingInvoice = getInvoiceById(invoiceId);
      if (existingInvoice) {
        setSelectedCustomer(existingInvoice.customerID || '');
        setSelectedProject(existingInvoice.projectID || '');
        setInvoiceData({
          items: existingInvoice.items || [],
          totals: existingInvoice.totals || {},
          invoiceDate: existingInvoice.invoiceDate || '',
          dueDate: existingInvoice.dueDate || '',
          paymentTerms: existingInvoice.paymentTerms || '',
          notes: existingInvoice.notes || '',
          offerID: existingInvoice.offerID,
          offerNumber: existingInvoice.offerNumber
        });
      }
    } else if (!fromOfferId) {
      // Defaults für neue Rechnung
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);

      setInvoiceData(prev => ({
        ...prev,
        dueDate: dueDate.toISOString().split('T')[0],
        paymentTerms: calcSettings.offerDefaults?.paymentTerms || '14 Tage netto'
      }));
    }
  }, [isEditing, invoiceId, getInvoiceById, fromOfferId, calcSettings]);

  // Projekte für ausgewählten Kunden
  const customerProjects = useMemo(() => {
    if (!selectedCustomer) return [];
    return projects.filter(p => p.customerID === selectedCustomer);
  }, [projects, selectedCustomer]);

  // Totals neu berechnen
  useEffect(() => {
    const totals = calculateOfferTotals(invoiceData.items, invoiceData.totals?.discountPercent || 0);
    setInvoiceData(prev => ({ ...prev, totals }));
  }, [invoiceData.items, invoiceData.totals?.discountPercent, calculateOfferTotals]);

  // Position aktualisieren
  const handleUpdateItem = (itemId, updates) => {
    setInvoiceData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, ...updates };
          updatedItem.totalNet = (updatedItem.quantity || 1) * (updatedItem.unitPriceNet || 0) * (1 - (updatedItem.discount || 0) / 100);
          return updatedItem;
        }
        return item;
      })
    }));
  };

  // Position entfernen
  const handleRemoveItem = (itemId) => {
    setInvoiceData(prev => ({
      ...prev,
      items: prev.items
        .filter(item => item.id !== itemId)
        .map((item, index) => ({ ...item, position: index + 1 }))
    }));
  };

  // Manuelle Position hinzufügen
  const handleAddManualItem = () => {
    const newItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      position: invoiceData.items.length + 1,
      type: 'manual',
      shortText: 'Neue Position',
      longText: '',
      quantity: 1,
      unit: 'Stk',
      unitPriceNet: 0,
      discount: 0,
      totalNet: 0
    };

    setInvoiceData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  // Validierung
  const validateStep = (step) => {
    const errors = {};

    switch (step) {
      case 0:
        if (!selectedCustomer) errors.customer = 'Bitte Kunde auswählen';
        break;
      case 1:
        if (invoiceData.items.length === 0) errors.items = 'Mindestens eine Position erforderlich';
        break;
      default:
        break;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Navigation
  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  // Speichern
  const handleSave = async (status = INVOICE_STATUS.DRAFT) => {
    if (!validateStep(currentStep)) return;

    setSaving(true);
    try {
      const saveData = {
        ...invoiceData,
        customerID: selectedCustomer,
        projectID: selectedProject,
        status
      };

      let result;
      if (isEditing) {
        result = await updateInvoice(invoiceId, saveData, 'Rechnung aktualisiert');
      } else {
        result = await createInvoice(saveData);
      }

      if (result.success) {
        showNotification(
          isEditing ? 'Rechnung aktualisiert' : `Rechnung ${result.invoiceNumber} erstellt`,
          'success'
        );
        navigate('/invoices');
      } else {
        showNotification('Fehler beim Speichern', 'error');
      }
    } catch (err) {
      showNotification('Fehler beim Speichern', 'error');
    } finally {
      setSaving(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(price || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  // Kunde-Step
  const renderCustomerStep = () => {
    const customer = customers.find(c => c.id === selectedCustomer);

    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kunde <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedCustomer}
              onChange={(e) => {
                setSelectedCustomer(e.target.value);
                setSelectedProject('');
                setValidationErrors(prev => ({ ...prev, customer: null }));
              }}
              className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 ${
                validationErrors.customer ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Kunde auswählen...</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.firmennameKundenname || c.name}
                </option>
              ))}
            </select>
            {validationErrors.customer && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.customer}</p>
            )}
          </div>

          {selectedCustomer && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Projekt (optional)
              </label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Kein Projekt ausgewählt</option>
                {customerProjects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.projektname || p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Rechnungsdatum & Fälligkeit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rechnungsdatum
              </label>
              <input
                type="date"
                value={invoiceData.invoiceDate}
                onChange={(e) => setInvoiceData(prev => ({ ...prev, invoiceDate: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fällig am
              </label>
              <input
                type="date"
                value={invoiceData.dueDate}
                onChange={(e) => setInvoiceData(prev => ({ ...prev, dueDate: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Angebots-Referenz */}
          {invoiceData.offerNumber && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-600 mb-1">Basierend auf Angebot:</p>
              <p className="font-medium text-blue-900">{invoiceData.offerNumber}</p>
            </div>
          )}

          {/* Kundeninfo */}
          {customer && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
              <p className="text-sm text-gray-600 mb-1">Rechnungsempfänger:</p>
              <p className="font-medium text-gray-900">{customer.firmennameKundenname || customer.name}</p>
              {customer.strasse && <p className="text-sm text-gray-700">{customer.strasse}</p>}
              {customer.plz && customer.ort && (
                <p className="text-sm text-gray-700">{customer.plz} {customer.ort}</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Positionen-Step (PDF-Layout)
  const renderPositionsStep = () => {
    const customer = customers.find(c => c.id === selectedCustomer);
    const project = projects.find(p => p.id === selectedProject);

    return (
      <div className="bg-gray-100 -m-6 p-6">
        <div className="max-w-[210mm] mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="p-8">
            {/* Header */}
            <div className="flex justify-between items-start mb-8 pb-6 border-b">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">RECHNUNG</h1>
                <p className="text-gray-600 mt-1">{isEditing ? invoiceId : 'Neu'}</p>
                {invoiceData.offerNumber && (
                  <p className="text-sm text-gray-500 mt-1">Ref: {invoiceData.offerNumber}</p>
                )}
              </div>
              <div className="text-right text-sm text-gray-600">
                <p className="font-medium text-gray-900">{company.name}</p>
                <p>{company.street}</p>
                <p>{company.zipCode} {company.city}</p>
              </div>
            </div>

            {/* Kunde & Datum */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Rechnungsempfänger</p>
                <div className="text-sm">
                  <p className="font-medium text-gray-900">
                    {customer?.firmennameKundenname || customer?.name || '-'}
                  </p>
                  {customer?.strasse && <p>{customer.strasse}</p>}
                  {(customer?.plz || customer?.ort) && (
                    <p>{customer?.plz} {customer?.ort}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Rechnungsdatum:</span>
                    <span>{formatDate(invoiceData.invoiceDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Fällig am:</span>
                    <span className="font-medium">{formatDate(invoiceData.dueDate)}</span>
                  </div>
                  {project && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Projekt:</span>
                      <span>{project.projektname || project.name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Editierbare Positionstabelle */}
            <div className="mb-8">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="py-2 text-left font-medium text-gray-700 w-12">Pos.</th>
                    <th className="py-2 text-left font-medium text-gray-700">Beschreibung</th>
                    <th className="py-2 text-right font-medium text-gray-700 w-20">Menge</th>
                    <th className="py-2 text-center font-medium text-gray-700 w-16">Einheit</th>
                    <th className="py-2 text-right font-medium text-gray-700 w-24">EP (netto)</th>
                    <th className="py-2 text-right font-medium text-gray-700 w-28">Gesamt</th>
                    <th className="py-2 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceData.items.map((item, index) => (
                    <tr key={item.id || index} className="border-b border-gray-100 group">
                      <td className="py-3 text-gray-600">{item.position || index + 1}</td>
                      <td className="py-3">
                        <input
                          type="text"
                          value={item.shortText}
                          onChange={(e) => handleUpdateItem(item.id, { shortText: e.target.value })}
                          className="w-full bg-transparent border-0 p-0 focus:ring-0 font-medium text-gray-900"
                        />
                      </td>
                      <td className="py-3">
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                          className="w-full text-right bg-transparent border-0 p-0 focus:ring-0"
                        />
                      </td>
                      <td className="py-3 text-center text-gray-600">{item.unit}</td>
                      <td className="py-3">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPriceNet}
                          onChange={(e) => handleUpdateItem(item.id, { unitPriceNet: parseFloat(e.target.value) || 0 })}
                          className="w-full text-right bg-transparent border-0 p-0 focus:ring-0"
                        />
                      </td>
                      <td className="py-3 text-right font-medium">{formatPrice(item.totalNet)}</td>
                      <td className="py-3">
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Manuelle Position Button */}
              <button
                onClick={handleAddManualItem}
                className="mt-4 w-full py-2 border-2 border-dashed border-gray-200 rounded text-gray-500 hover:border-blue-400 hover:text-blue-600 text-sm flex items-center justify-center transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Manuelle Position hinzufügen
              </button>
            </div>

            {/* Summen */}
            <div className="flex justify-end mb-8">
              <div className="w-72">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Zwischensumme (netto):</span>
                    <span>{formatPrice(invoiceData.totals?.subtotalNet)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Rabatt:</span>
                    <div className="flex items-center">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={invoiceData.totals?.discountPercent || 0}
                        onChange={(e) => setInvoiceData(prev => ({
                          ...prev,
                          totals: { ...prev.totals, discountPercent: parseFloat(e.target.value) || 0 }
                        }))}
                        className="w-12 text-right border border-gray-200 rounded px-1 py-0.5 text-xs"
                      />
                      <span className="text-gray-400 ml-1">%</span>
                      {invoiceData.totals?.discountAmount > 0 && (
                        <span className="ml-2 text-red-600">-{formatPrice(invoiceData.totals?.discountAmount)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-600">Netto:</span>
                    <span>{formatPrice(invoiceData.totals?.netTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">MwSt ({invoiceData.totals?.taxRate || 19}%):</span>
                    <span>{formatPrice(invoiceData.totals?.taxAmount)}</span>
                  </div>
                  <div className="flex justify-between border-t-2 border-gray-900 pt-2 text-lg font-bold">
                    <span>Gesamtbetrag:</span>
                    <span>{formatPrice(invoiceData.totals?.grossTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t pt-6 text-sm text-gray-500">
              <p>
                {invoiceTexts.paymentTerms}
              </p>
              <p className="mt-4">{invoiceTexts.closing}</p>
              <p className="mt-4">{invoiceTexts.signature}</p>
              <p className="mt-2 font-medium text-gray-700">{company.name}</p>
            </div>

          </div>
        </div>
      </div>
    );
  };

  // Vorschau-Step
  const renderPreviewStep = () => {
    const customer = customers.find(c => c.id === selectedCustomer);
    const project = projects.find(p => p.id === selectedProject);

    return (
      <div className="bg-gray-100 -m-6 p-6">
        <div className="max-w-[210mm] mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="p-8">
            {/* Header */}
            <div className="flex justify-between items-start mb-8 pb-6 border-b">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">RECHNUNG</h1>
                <p className="text-gray-600 mt-1">{isEditing ? invoiceId : 'Neu'}</p>
                {invoiceData.offerNumber && (
                  <p className="text-sm text-gray-500 mt-1">Ref: {invoiceData.offerNumber}</p>
                )}
              </div>
              <div className="text-right text-sm text-gray-600">
                <p className="font-medium text-gray-900">{company.name}</p>
                <p>{company.street}</p>
                <p>{company.zipCode} {company.city}</p>
                <p>Tel: {company.phone}</p>
                <p>{company.email}</p>
              </div>
            </div>

            {/* Kunde & Datum */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Rechnungsempfänger</p>
                <div className="text-sm">
                  <p className="font-medium text-gray-900">
                    {customer?.firmennameKundenname || customer?.name || '-'}
                  </p>
                  {customer?.strasse && <p>{customer.strasse}</p>}
                  {(customer?.plz || customer?.ort) && (
                    <p>{customer?.plz} {customer?.ort}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Rechnungsdatum:</span>
                    <span>{formatDate(invoiceData.invoiceDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Fällig am:</span>
                    <span className="font-medium">{formatDate(invoiceData.dueDate)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Positionen */}
            <div className="mb-8">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="py-2 text-left font-medium text-gray-700 w-12">Pos.</th>
                    <th className="py-2 text-left font-medium text-gray-700">Beschreibung</th>
                    <th className="py-2 text-right font-medium text-gray-700 w-16">Menge</th>
                    <th className="py-2 text-center font-medium text-gray-700 w-16">Einheit</th>
                    <th className="py-2 text-right font-medium text-gray-700 w-24">EP (netto)</th>
                    <th className="py-2 text-right font-medium text-gray-700 w-28">Gesamt</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceData.items.map((item, index) => (
                    <tr key={item.id || index} className="border-b border-gray-100">
                      <td className="py-3 text-gray-600">{item.position || index + 1}</td>
                      <td className="py-3">
                        <p className="font-medium text-gray-900">{item.shortText}</p>
                      </td>
                      <td className="py-3 text-right">{item.quantity}</td>
                      <td className="py-3 text-center text-gray-600">{item.unit}</td>
                      <td className="py-3 text-right">{formatPrice(item.unitPriceNet)}</td>
                      <td className="py-3 text-right font-medium">{formatPrice(item.totalNet)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summen */}
            <div className="flex justify-end mb-8">
              <div className="w-64">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Zwischensumme (netto):</span>
                    <span>{formatPrice(invoiceData.totals?.subtotalNet)}</span>
                  </div>
                  {invoiceData.totals?.discountPercent > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Rabatt ({invoiceData.totals?.discountPercent}%):</span>
                      <span>- {formatPrice(invoiceData.totals?.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-600">Netto:</span>
                    <span>{formatPrice(invoiceData.totals?.netTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">MwSt ({invoiceData.totals?.taxRate || 19}%):</span>
                    <span>{formatPrice(invoiceData.totals?.taxAmount)}</span>
                  </div>
                  <div className="flex justify-between border-t-2 border-gray-900 pt-2 text-lg font-bold">
                    <span>Gesamtbetrag:</span>
                    <span>{formatPrice(invoiceData.totals?.grossTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Zahlungsinformationen */}
            {(company.iban || company.bic) && (
              <div className="border-t pt-6 mb-6 text-sm">
                <h3 className="font-medium text-gray-900 mb-3">Zahlungsinformationen</h3>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 mb-1">Bankverbindung:</p>
                  {company.bankName && <p>{company.bankName}</p>}
                  {company.iban && <p>IBAN: {company.iban}</p>}
                  {company.bic && <p>BIC: {company.bic}</p>}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="border-t pt-6 text-sm text-gray-500">
              <p>
                {invoiceTexts.paymentTerms}
              </p>
              <p className="mt-4">{invoiceTexts.closing}</p>
              <p className="mt-4">{invoiceTexts.signature}</p>
              <p className="mt-2 font-medium text-gray-700">{company.name}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderCustomerStep();
      case 1:
        return renderPositionsStep();
      case 2:
        return renderPreviewStep();
      default:
        return null;
    }
  };

  return (
    <div className="h-dvh flex flex-col bg-gray-50">
      {/* Header mit Steps */}
      <div className="flex-shrink-0 bg-white shadow-sm">
        <div className="px-6 py-4">
          <h1 className="text-xl font-bold text-gray-900">
            {isEditing ? 'Rechnung bearbeiten' : 'Neue Rechnung erstellen'}
          </h1>
        </div>

        {/* Step Indicator */}
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;

              return (
                <React.Fragment key={step.id}>
                  <div
                    className={`flex items-center cursor-pointer ${
                      isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                    }`}
                    onClick={() => index < currentStep && setCurrentStep(index)}
                  >
                    <div className={`
                      flex items-center justify-center w-10 h-10 rounded-full border-2
                      ${isActive ? 'border-blue-600 bg-blue-50' : isCompleted ? 'border-green-600 bg-green-50' : 'border-gray-300'}
                    `}>
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    <span className="ml-2 text-sm font-medium hidden md:block">{step.title}</span>
                  </div>

                  {index < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-4 ${
                      index < currentStep ? 'bg-green-600' : 'bg-gray-200'
                    }`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {renderStepContent()}
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex-shrink-0 bg-white border-t px-6 py-4">
        <div className="max-w-4xl mx-auto flex justify-between">
          <button
            onClick={currentStep === 0 ? () => navigate('/invoices') : handleBack}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 flex items-center"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            {currentStep === 0 ? 'Abbrechen' : 'Zurück'}
          </button>

          {currentStep < STEPS.length - 1 ? (
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              Weiter
              <ChevronRight className="h-5 w-5 ml-1" />
            </button>
          ) : (
            <button
              onClick={() => handleSave(INVOICE_STATUS.SENT)}
              disabled={saving || !selectedCustomer}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <Send className="h-5 w-5 mr-2" />
              Rechnung speichern
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceConfigurator;
