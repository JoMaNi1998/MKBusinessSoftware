/**
 * useBookingModal Hook
 * State-Management und Logik für das Buchungs-Modal
 */

import { useState, useEffect, useCallback } from 'react';
import { useMaterials } from '@context/MaterialContext';
import { useCustomers } from '@context/CustomerContext';
import { useProjects } from '@context/ProjectContext';
import { useNotification } from '@context/NotificationContext';
import { useBookings } from '@context/BookingContext';
import { useAutoSelectProject } from './useAutoSelectProject';
import {
  validateBookingForm,
  hasValidationErrors,
  executeStockUpdates,
  resetOrderStatus,
  generateBookingId,
  type BookingValidationErrors
} from '../services/BookingService';
import { validateProjectInBooking } from '../services/BookingAggregationService';
import { WAREHOUSE_BOOKING } from '../utils/bookingHelpers';
import type { SelectedMaterial } from '@app-types/components/booking.types';
import type { Project, Material } from '@app-types';
import { BookingType, NotificationType } from '@app-types/enums';

/**
 * Return-Type für useBookingModal Hook
 */
export interface UseBookingModalReturn {
  // State
  selectedCustomer: string;
  setSelectedCustomer: (customer: string) => void;
  selectedProject: string;
  setSelectedProject: (project: string) => void;
  customerProjects: Project[];
  selectedMaterials: SelectedMaterial[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  errors: BookingValidationErrors;
  showScanner: boolean;
  setShowScanner: (show: boolean) => void;

  // Derived Data
  filteredMaterials: Material[];
  customers: ReturnType<typeof useCustomers>['customers'];
  materials: Material[];

  // Actions
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  addMaterial: (materialId: string) => void;
  removeMaterial: (materialId: string) => void;
  updateQuantity: (materialId: string, quantity: number) => void;
  handleQRScan: (scannedCode: string) => void;
  resetForm: () => void;
}

/**
 * Hook für Buchungs-Modal State und Logik
 *
 * @param type - Buchungstyp (IN oder OUT)
 * @param onClose - Callback zum Schließen des Modals
 * @returns Hook-Return mit State und Aktionen
 */
export const useBookingModal = (
  type: BookingType = BookingType.OUT,
  onClose: () => void
): UseBookingModalReturn => {
  const { materials, updateMaterialStock } = useMaterials();
  const { customers } = useCustomers();
  const { projects, getProjectsByCustomer } = useProjects();
  const { showNotification } = useNotification();
  const { addBooking, bookings } = useBookings();

  // State
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [customerProjects, setCustomerProjects] = useState<Project[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<SelectedMaterial[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [errors, setErrors] = useState<BookingValidationErrors>({});
  const [showScanner, setShowScanner] = useState<boolean>(false);

  // Filtered materials based on search
  const filteredMaterials = materials.filter(material => {
    return material.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.materialID.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Update customer projects when customer changes
  useEffect(() => {
    if (selectedCustomer && selectedCustomer !== WAREHOUSE_BOOKING) {
      const projects = getProjectsByCustomer(selectedCustomer);
      setCustomerProjects(projects);
      setSelectedProject('');
    } else {
      setCustomerProjects([]);
      setSelectedProject('');
    }
  }, [selectedCustomer, getProjectsByCustomer]);

  // Auto-Select Projekt wenn nur eins verfügbar
  useAutoSelectProject({
    customerProjects,
    selectedProject,
    setSelectedProject,
    enabled: selectedCustomer !== WAREHOUSE_BOOKING
  });

  // Reset form when type changes (switching between Einbuchen/Ausbuchen)
  useEffect(() => {
    setSelectedCustomer('');
    setSelectedProject('');
    setCustomerProjects([]);
    setSelectedMaterials([]);
    setSearchTerm('');
    setErrors({});
  }, [type]);

  // Reset form
  const resetForm = useCallback(() => {
    setSelectedCustomer('');
    setSelectedProject('');
    setSelectedMaterials([]);
    setSearchTerm('');
    setErrors({});
  }, []);

  // Add material
  const addMaterial = useCallback((materialId: string) => {
    if (!selectedMaterials.find(item => item.materialId === materialId)) {
      setSelectedMaterials(prev => [...prev, { materialId, quantity: 1 }]);
    }
  }, [selectedMaterials]);

  // Remove material
  const removeMaterial = useCallback((materialId: string) => {
    setSelectedMaterials(prev => prev.filter(item => item.materialId !== materialId));
  }, []);

  // Update quantity
  const updateQuantity = useCallback((materialId: string, quantity: number) => {
    if (quantity <= 0) {
      removeMaterial(materialId);
      return;
    }

    setSelectedMaterials(prev =>
      prev.map(item =>
        item.materialId === materialId ? { ...item, quantity } : item
      )
    );
  }, [removeMaterial]);

  // QR scan handler
  const handleQRScan = useCallback((scannedCode: string) => {
    const material = materials.find(m => m.materialID === scannedCode);

    if (material) {
      if (selectedMaterials.find(item => item.materialId === material.id)) {
        showNotification(`${material.description} ist bereits in der Liste`, NotificationType.WARNING);
      } else {
        addMaterial(material.id);
        showNotification(`${material.description} hinzugefügt`, NotificationType.SUCCESS);
      }
    } else {
      showNotification(`Material "${scannedCode}" nicht gefunden`, NotificationType.ERROR);
    }
  }, [materials, selectedMaterials, addMaterial, showNotification]);

  // Form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    // Validate
    const validationErrors = validateBookingForm(
      selectedCustomer,
      selectedProject,
      selectedMaterials,
      materials,
      type
    );

    setErrors(validationErrors);

    if (hasValidationErrors(validationErrors)) {
      return;
    }

    // Validierung bei IN auf Projekt (Rückbuchung darf nicht mehr als OUT sein)
    if (type === BookingType.IN && selectedProject) {
      const validation = validateProjectInBooking(
        selectedProject,
        selectedMaterials,
        bookings,
        materials
      );

      if (!validation.isValid) {
        const errorMessages = validation.errors.map(e =>
          `${e.materialName}: Max. ${e.maxAllowed} Stk. verfügbar (angefordert: ${e.requested})`
        ).join('\n');

        showNotification(
          `Rückbuchung nicht möglich:\n${errorMessages}`,
          NotificationType.ERROR
        );
        return;
      }
    }

    // Execute stock updates
    const result = await executeStockUpdates(
      selectedMaterials,
      type,
      updateMaterialStock
    );

    if (!result.success) {
      showNotification(result.error || 'Buchung fehlgeschlagen', NotificationType.ERROR);
      return;
    }

    // Reset order status for incoming bookings
    if (type === BookingType.IN) {
      for (const item of selectedMaterials) {
        const material = materials.find(m => m.id === item.materialId);
        if (material?.orderStatus === 'bestellt') {
          await resetOrderStatus(item.materialId);
        }
      }
    }

    // Create booking record
    const selectedCustomerData = customers.find(c => c.customerID === selectedCustomer);
    const selectedProjectData = projects.find(p => p.id === selectedProject);

    const booking = {
      id: generateBookingId(type, selectedProject),
      customerID: selectedCustomer,
      customerName: selectedCustomerData?.firmennameKundenname ||
        (selectedCustomer === WAREHOUSE_BOOKING ? 'Wareneingang' : selectedCustomer),
      projectID: selectedProject,
      projectName: selectedProjectData?.name || '',
      type,
      timestamp: new Date(),
      materials: selectedMaterials.map(item => {
        const material = materials.find(m => m.id === item.materialId);
        const priceAtBooking = material?.price || 0;
        return {
          materialID: material?.materialID || '',
          quantity: item.quantity,
          description: material?.description,
          priceAtBooking,
          totalCost: priceAtBooking * item.quantity
        };
      }),
      notes: `${type} über Lagermanagement-System für Projekt: ${selectedProjectData?.name || ''}`
    };

    addBooking(booking as any);

    showNotification(
      `${type === BookingType.IN ? 'Eingang' : 'Ausgang'} erfolgreich gebucht: ${selectedMaterials.length} Material${selectedMaterials.length !== 1 ? 'ien' : ''}`,
      NotificationType.SUCCESS
    );

    resetForm();
    onClose();
  };

  return {
    // State
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

    // Derived Data
    filteredMaterials,
    customers,
    materials,

    // Actions
    handleSubmit,
    addMaterial,
    removeMaterial,
    updateQuantity,
    handleQRScan,
    resetForm
  };
};

export default useBookingModal;
