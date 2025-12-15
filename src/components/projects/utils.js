/**
 * Project-related utility functions
 */

import { STATUS_OPTIONS, VDE_STATUS_OPTIONS } from './constants';

/**
 * Combine class names, filtering out falsy values
 */
export const cn = (...classes) => classes.filter(Boolean).join(' ');

/**
 * Format a price value to German currency format
 */
export const formatPrice = (price) => {
  if (price === null || price === undefined || price === '') return '0,00 €';
  const num = Number(price);
  if (Number.isNaN(num)) return '0,00 €';
  return `${num.toFixed(2).replace('.', ',')} €`;
};

/**
 * Format a date to German locale (dd.mm.yyyy)
 */
export const formatDate = (date) => {
  if (!date) return 'Nicht gesetzt';
  try {
    let d;
    if (date instanceof Date) d = date;
    else if (typeof date === 'string' || typeof date === 'number') d = new Date(date);
    else if (date?.seconds) d = new Date(date.seconds * 1000);
    else return 'Ungültiges Datum';
    if (isNaN(d.getTime())) return 'Ungültiges Datum';
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return 'Ungültiges Datum';
  }
};

/**
 * Format a date with time to German locale
 */
export const formatDateTime = (date) => {
  if (!date) return 'Unbekannt';
  // ServerTimestamp placeholder (not yet resolved)
  if (date?._methodName === 'serverTimestamp') return 'Gerade eben';
  try {
    let d;
    if (date instanceof Date) d = date;
    else if (typeof date === 'string' || typeof date === 'number') d = new Date(date);
    else if (date?.seconds) d = new Date(date.seconds * 1000);
    else if (date?.toDate && typeof date.toDate === 'function') d = date.toDate();
    else return 'Ungültiges Datum';
    if (isNaN(d.getTime())) return 'Ungültiges Datum';
    return d.toLocaleString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Ungültiges Datum';
  }
};

/**
 * Get the CSS classes for a project status badge
 */
export const getStatusColor = (status) => {
  const statusOption = STATUS_OPTIONS.find(opt => opt.value === status);
  return statusOption?.color || 'bg-gray-100 text-gray-800';
};

/**
 * Get the CSS classes for a VDE status badge
 */
export const getVdeStatusColor = (status) => {
  const statusOption = VDE_STATUS_OPTIONS.find(opt => opt.value === status);
  return statusOption?.color || 'bg-gray-100 text-gray-800';
};

/**
 * Compute the next project ID based on existing projects
 */
export const computeNextProjectId = (projects = []) => {
  const regex = /^PRO-(\d{3,})$/;
  const max = projects.reduce((acc, p) => {
    const id = p?.projectID;
    if (!id || typeof id !== 'string') return acc;
    const m = id.match(regex);
    if (!m) return acc;
    const n = parseInt(m[1], 10);
    return Number.isFinite(n) && n > acc ? n : acc;
  }, 0);
  return `PRO-${String(max + 1).padStart(3, '0')}`;
};

/**
 * Generate a random 4-digit string
 */
export const random4 = () => String(Math.floor(Math.random() * 10000)).padStart(4, '0');

/**
 * Sanitize customer name by removing whitespace
 */
export const sanitizeCustomerName = (s) => (s || '').replace(/\s+/g, '');

/**
 * Build an address string from parts
 */
export const addressFromParts = ({ street, houseNumber, postalCode, city }) =>
  `${(street || '').trim()} ${(houseNumber || '').trim()}, ${(postalCode || '').trim()} ${(city || '').trim()}`
    .replace(/\s+,/g, ',')
    .replace(/,\s*$/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

/**
 * Parse an address string into parts
 */
export const parseAddress = (address) => {
  if (!address || typeof address !== 'string') {
    return { street: '', houseNumber: '', postalCode: '', city: '' };
  }
  const [streetPart = '', cityPart = ''] = address.split(', ');
  const streetMatch = streetPart.match(/^(.+?)\s+(\d+.*)$/);
  const street = streetMatch ? streetMatch[1] : streetPart;
  const houseNumber = streetMatch ? streetMatch[2] : '';
  const cityMatch = cityPart.match(/^(\d+)\s+(.+)$/);
  const postalCode = cityMatch ? cityMatch[1] : '';
  const city = cityMatch ? cityMatch[2] : cityPart;
  return {
    street: street.trim(),
    houseNumber: houseNumber.trim(),
    postalCode: postalCode.trim(),
    city: city.trim()
  };
};

/**
 * Calculate total project costs from bookings
 */
export const calculateProjectCosts = (projectBookings) => {
  if (!projectBookings || projectBookings.length === 0) return 0;

  let totalCost = 0;

  projectBookings.forEach(booking => {
    booking.materials?.forEach(bookingMaterial => {
      if (bookingMaterial.totalCost !== undefined) {
        const cost = Number(bookingMaterial.totalCost);
        if (!isNaN(cost)) {
          totalCost += cost;
        }
      } else if (bookingMaterial.priceAtBooking && bookingMaterial.quantity) {
        const price = Number(bookingMaterial.priceAtBooking);
        const quantity = Number(bookingMaterial.quantity);
        if (!isNaN(price) && !isNaN(quantity)) {
          totalCost += price * quantity;
        }
      }
    });
  });

  return totalCost;
};

/**
 * Get customer display name
 */
export const getCustomerDisplayName = (customer) => {
  if (!customer) return 'Unbekannter Kunde';
  return customer.firmennameKundenname || customer.name || 'Unbekannter Kunde';
};

/**
 * Find customer by ID from customer list
 */
export const findCustomerById = (customers, customerId) => {
  return customers.find(c => c.id === customerId) || null;
};
