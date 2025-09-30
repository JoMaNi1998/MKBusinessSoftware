import React, { useState, useEffect } from 'react';
import { X, Save, Package, User, Plus, Minus, Search, Building } from 'lucide-react';
import { useMaterials } from '../context/MaterialContext';
import { useCustomers } from '../context/CustomerContext';
import { useProjects } from '../context/ProjectContext';
import { useNotification } from '../context/NotificationContext';
import { useBookings } from '../context/BookingContext';
import BaseModal from './BaseModal';

const BookingModal = ({ isOpen, onClose, type = 'Ausgang' }) => {
  const { materials, updateMaterialStock } = useMaterials();
  const { customers } = useCustomers();
  const { projects, getProjectsByCustomer } = useProjects();
  const { showNotification } = useNotification();
  const { addBooking } = useBookings();
  
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [customerProjects, setCustomerProjects] = useState([]);
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [errors, setErrors] = useState({});

  const filteredMaterials = materials.filter(material => {
    return material.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.materialID.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Update customer projects when customer changes
  useEffect(() => {
    if (selectedCustomer) {
      const projects = getProjectsByCustomer(selectedCustomer);
      setCustomerProjects(projects);
      setSelectedProject(''); // Reset project selection
    } else {
      setCustomerProjects([]);
      setSelectedProject('');
    }
  }, [selectedCustomer, getProjectsByCustomer]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!selectedCustomer) {
      newErrors.customer = 'Bitte wählen Sie einen Kunden aus';
    }
    
    if (!selectedProject && selectedCustomer !== 'Lagerbuchung') {
      newErrors.project = 'Bitte wählen Sie ein Projekt aus';
    }
    
    if (selectedMaterials.length === 0) {
      newErrors.materials = 'Bitte wählen Sie mindestens ein Material aus';
    }

    // Prüfe Lagerbestand bei Ausgängen
    if (type === 'Ausgang') {
      selectedMaterials.forEach((item, index) => {
        const material = materials.find(m => m.id === item.materialId);
        if (material && item.quantity > material.stock) {
          newErrors[`quantity_${index}`] = `Nicht genügend Lagerbestand (verfügbar: ${material.stock})`;
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Führe Buchung durch
    for (const item of selectedMaterials) {
      const stockChange = type === 'Eingang' ? item.quantity : -item.quantity;
      await updateMaterialStock(item.materialId, stockChange);
      
      // Bei Wareneingang: Bestellstatus zurücksetzen falls Material bestellt war
      if (type === 'Eingang') {
        const material = materials.find(m => m.id === item.materialId);
        if (material && material.orderStatus === 'bestellt') {
          try {
            const { FirebaseService } = await import('../services/firebaseService');
            await FirebaseService.updateDocument('materials', item.materialId, {
              orderStatus: null,
              orderDate: null,
              updatedAt: new Date()
            });
          } catch (error) {
            console.error('Fehler beim Zurücksetzen des Bestellstatus:', error);
          }
        }
      }
    }

    // Speichere Buchung in der Historie
    const selectedCustomerData = customers.find(c => c.customerID === selectedCustomer);
    const selectedProjectData = projects.find(p => p.id === selectedProject);
    
    // Eindeutige ID für jede Buchung generieren
    const bookingId = `${type}-${selectedProject}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const booking = {
      id: bookingId,
      customerID: selectedCustomer,
      customerName: selectedCustomerData?.firmennameKundenname || (selectedCustomer === 'Lagerbuchung' ? 'Wareneingang' : selectedCustomer),
      projectID: selectedProject,
      projectName: selectedProjectData?.name || '',
      type,
      timestamp: new Date(),
      materials: selectedMaterials.map(item => {
        const material = materials.find(m => m.id === item.materialId);
        const priceAtBooking = material?.price || 0;
        const totalCost = priceAtBooking * item.quantity;
        
        return {
          materialID: material?.materialID,
          quantity: item.quantity,
          description: material?.description,
          priceAtBooking: priceAtBooking,
          totalCost: totalCost
        };
      }),
      notes: `${type} über Lagermanagement-System für Projekt: ${selectedProjectData?.name || ''}`
    };

    addBooking(booking);
    
    showNotification(
      `${type} erfolgreich gebucht: ${selectedMaterials.length} Material${selectedMaterials.length !== 1 ? 'ien' : ''}`,
      'success'
    );

    // Reset form
    setSelectedCustomer('');
    setSelectedProject('');
    setSelectedMaterials([]);
    setSearchTerm('');
    setErrors({});
    
    onClose();
  };

  const addMaterial = (materialId) => {
    if (!selectedMaterials.find(item => item.materialId === materialId)) {
      setSelectedMaterials(prev => [...prev, { materialId, quantity: 1 }]);
    }
  };

  const removeMaterial = (materialId) => {
    setSelectedMaterials(prev => prev.filter(item => item.materialId !== materialId));
  };

  const updateQuantity = (materialId, quantity) => {
    if (quantity <= 0) {
      removeMaterial(materialId);
      return;
    }
    
    setSelectedMaterials(prev =>
      prev.map(item =>
        item.materialId === materialId ? { ...item, quantity } : item
      )
    );
  };

  if (!isOpen) return null;

  const footerButtons = (
    <>
      <button
        type="button"
        onClick={onClose}
        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
      >
        Abbrechen
      </button>
      <button
        type="submit"
        form="booking-form"
        className={`px-4 py-2 text-white rounded-lg flex items-center space-x-2 ${
          type === 'Eingang' 
            ? 'bg-green-600 hover:bg-green-700' 
            : 'bg-red-600 hover:bg-red-700'
        }`}
      >
        <Save className="h-4 w-4" />
        <span>{type === 'Eingang' ? 'Einbuchen' : 'Ausbuchen'}</span>
      </button>
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Material ${type === 'Eingang' ? 'einbuchen' : 'ausbuchen'}`}
      icon={Package}
      footerButtons={footerButtons}
      maxWidth="max-w-4xl"
    >
      <form id="booking-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Kunde auswählen */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {type === 'Eingang' ? 'Lieferant / Quelle' : 'Kunde'} *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.customer ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">
                  {type === 'Eingang' ? 'Lieferant auswählen...' : 'Kunde auswählen...'}
                </option>
                {type === 'Eingang' && (
                  <option value="Lagerbuchung">Wareneingang (Lager)</option>
                )}
                {customers.map(customer => (
                  <option key={customer.id} value={customer.customerID}>
                    {customer.firmennameKundenname}
                  </option>
                ))}
              </select>
            </div>
            {errors.customer && (
              <p className="mt-1 text-sm text-red-600">{errors.customer}</p>
            )}
          </div>

          {/* Projekt auswählen */}
          {selectedCustomer && customerProjects.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Projekt *
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.project ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Projekt auswählen...</option>
                  {customerProjects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name} ({project.status})
                    </option>
                  ))}
                </select>
              </div>
              {errors.project && (
                <p className="mt-1 text-sm text-red-600">{errors.project}</p>
              )}
            </div>
          )}

          {/* Hinweis wenn keine Projekte vorhanden */}
          {selectedCustomer && selectedCustomer !== 'Lagerbuchung' && customerProjects.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <div className="text-yellow-800">
                  <p className="text-sm">
                    Für diesen Kunden sind noch keine Projekte angelegt. 
                    Bitte erstellen Sie zuerst ein Projekt in der Projektverwaltung.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Material suchen */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Material hinzufügen
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Material suchen..."
              />
            </div>
          </div>

          {/* Verfügbare Materialien */}
          {searchTerm && (
            <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
              {filteredMaterials.map(material => (
                <div
                  key={material.id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {material.description}
                    </div>
                    <div className="text-xs text-gray-500">
                      {material.materialID} | Lager: {material.currentStock} {material.unit}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => addMaterial(material.id)}
                    disabled={selectedMaterials.find(item => item.materialId === material.id)}
                    className="p-1 text-primary-600 hover:text-primary-700 disabled:text-gray-400"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Ausgewählte Materialien */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ausgewählte Materialien *
            </label>
            {selectedMaterials.length === 0 ? (
              <div className="border border-gray-200 rounded-lg p-4 text-center text-gray-500">
                Keine Materialien ausgewählt
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
                {selectedMaterials.map((item, index) => {
                  const material = materials.find(m => m.id === item.materialId);
                  return (
                    <div key={item.materialId} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {material?.description}
                          </div>
                          <div className="text-xs text-gray-500">
                            {material?.materialID} | Verfügbar: {material?.stock} {material?.unit || 'Stück'}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.materialId, item.quantity - 1)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.materialId, parseInt(e.target.value) || 0)}
                            className={`w-16 px-2 py-1 text-center border rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                              errors[`quantity_${index}`] ? 'border-red-300' : 'border-gray-300'
                            }`}
                            min="1"
                          />
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.materialId, item.quantity + 1)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeMaterial(item.materialId)}
                            className="p-1 text-red-400 hover:text-red-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      {errors[`quantity_${index}`] && (
                        <p className="mt-1 text-sm text-red-600">{errors[`quantity_${index}`]}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {errors.materials && (
              <p className="mt-1 text-sm text-red-600">{errors.materials}</p>
            )}
          </div>

        </form>
    </BaseModal>
  );
};

export default BookingModal;
