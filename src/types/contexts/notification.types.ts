/**
 * Type Definitions für den NotificationContext
 *
 * Types für Toast-Notifications, Benachrichtigungen
 * und Notification-spezifische Operationen.
 */

import { NotificationType } from '../enums';

// ============================================
// NOTIFICATION INTERFACE
// ============================================

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  timestamp: Date;
}

// ============================================
// NOTIFICATION CONTEXT VALUE
// ============================================

export interface NotificationContextValue {
  // State
  notifications: Notification[];

  // Operations
  showNotification: (message: string, type?: NotificationType, duration?: number) => string;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
}
