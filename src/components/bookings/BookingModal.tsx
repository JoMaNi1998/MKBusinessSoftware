import React from 'react';
import { X, Save, Package, User, Plus, Minus, Search, Building, QrCode } from 'lucide-react';
import { useBookingModal } from '@hooks';
import { WAREHOUSE_BOOKING } from '@utils';
import { BaseModal, QRScannerModal } from '@components/shared';
import type { BookingModalProps } from '@app-types/components/booking.types';
import { BookingType } from '@app-types/enums';

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, type = BookingType.OUT }) => {
  const {
    selectedCustomer,
    setSelectedCustomer,
    selectedProject,
    setSelectedProject,
    customerProjects,
    selectedMaterials,
    searchTerm,
    setSearchTerm,
    errors,
    showScanner,
    setShowScanner,
    filteredMaterials,
    customers,
    materials,
    handleSubmit,
    addMaterial,
    removeMaterial,
    updateQuantity,
    handleQRScan
  } = useBookingModal(type, onClose);

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
          type === BookingType.IN
            ? 'bg-green-600 hover:bg-green-700'
            : 'bg-red-600 hover:bg-red-700'
        }`}
      >
        <Save className="h-4 w-4" />
        <span>{type === BookingType.IN ? 'Einbuchen' : 'Ausbuchen'}</span>
      </button>
    </>
  );

  return (
    <>
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Material ${type === BookingType.IN ? 'einbuchen' : 'ausbuchen'}`}
      icon={Package}
      footerButtons={footerButtons}
      maxWidth="max-w-4xl"
    >
      <form id="booking-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Kunde auswählen */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {type === BookingType.IN ? 'Lieferant / Quelle' : 'Kunde'} *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <select
                value={selectedCustomer}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedCustomer(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.customer ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">
                  {type === BookingType.IN ? 'Lieferant auswählen...' : 'Kunde auswählen...'}
                </option>
                {type === BookingType.IN && (
                  <option value={WAREHOUSE_BOOKING}>Wareneingang (Lager)</option>
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
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedProject(e.target.value)}
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
          {selectedCustomer && selectedCustomer !== WAREHOUSE_BOOKING && customerProjects.length === 0 && (
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
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Material suchen..."
                />
              </div>
              <button
                type="button"
                onClick={() => setShowScanner(true)}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                title="QR-Code scannen"
              >
                <QrCode className="h-5 w-5" />
                <span className="hidden sm:inline">Scannen</span>
              </button>
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
                      {material.materialID} | Lager: {material.stock} {material.einheit}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => addMaterial(material.id)}
                    disabled={selectedMaterials.find(item => item.materialId === material.id) !== undefined}
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
                            {material?.materialID} | Verfügbar: {material?.stock} {material?.einheit || 'Stück'}
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
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateQuantity(item.materialId, parseInt(e.target.value) || 0)}
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

    {/* QR-Code Scanner Modal */}
    <QRScannerModal
      isOpen={showScanner}
      onClose={() => setShowScanner(false)}
      onScan={handleQRScan}
    />
    </>
  );
};

export default BookingModal;
