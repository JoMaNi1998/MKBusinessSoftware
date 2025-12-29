/**
 * Type Definitions für Settings-Komponenten
 */

import type React from 'react';
import type { CompanySettingsData } from '../contexts/company.types';
import { UserRole } from '../enums';

// ============================================
// COMPANY SETTINGS COMPONENT PROPS
// ============================================

export interface CompanySettingsProps {
  companySettings: CompanySettingsData;
  companyData: CompanySettingsData | null;
  setCompanyData: React.Dispatch<React.SetStateAction<CompanySettingsData | null>>;
  saveCompanySettings: (data: CompanySettingsData) => Promise<{ success: boolean; error?: string }>;
  savingCompany: boolean;
}

// ============================================
// USER TYPES
// ============================================

// Re-export UserRole from enums
export { UserRole };

export interface User {
  id: string;
  displayName?: string;
  email: string;
  role: UserRole;
}
