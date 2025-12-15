import { FirebaseService } from '../../../services/firebaseService';

/**
 * Berechnet die Gesamtkosten eines Kunden basierend auf seinen Projekten und Buchungen
 */
export const calculateCustomerTotalCosts = async (customerProjects, bookings) => {
  if (!customerProjects || customerProjects.length === 0) return 0;

  let totalCost = 0;

  // Sammle alle Material-IDs aus allen Projekten des Kunden
  const materialIds = new Set();
  const projectBookingsMap = {};

  customerProjects.forEach(project => {
    const projectBookings = bookings.filter(booking => booking.projectID === project.id);
    projectBookingsMap[project.id] = projectBookings;

    projectBookings.forEach(booking => {
      booking.materials?.forEach(material => {
        if (material.materialID) {
          materialIds.add(material.materialID);
        }
      });
    });
  });

  // Lade alle Materialien mit Preisen
  const materials = {};
  try {
    const allMaterials = await FirebaseService.getDocuments('materials');
    allMaterials.forEach(material => {
      if (materialIds.has(material.materialID)) {
        materials[material.materialID] = material;
      }
    });
  } catch (error) {
    console.error('Fehler beim Laden der Materialien für Kundenkostenberechnung:', error);
    return 0;
  }

  // Berechne Gesamtkosten für alle Projekte des Kunden
  Object.values(projectBookingsMap).forEach(projectBookings => {
    projectBookings.forEach(booking => {
      booking.materials?.forEach(bookingMaterial => {
        const material = materials[bookingMaterial.materialID];
        if (material && material.price && bookingMaterial.quantity) {
          const price = Number(material.price);
          const quantity = Number(bookingMaterial.quantity);
          if (!isNaN(price) && !isNaN(quantity)) {
            totalCost += price * quantity;
          }
        }
      });
    });
  });

  return totalCost;
};
