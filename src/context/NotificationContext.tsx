import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import type { NotificationContextValue, Notification } from '../types/contexts/notification.types';
import { NotificationType } from '../types/enums';

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export const useNotification = (): NotificationContextValue => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

let notificationCounter = 0;

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map()); // Speichert Timeout-IDs pro Notification

  const removeNotification = useCallback((id: string): void => {
    // Timeout löschen falls vorhanden
    if (timeoutRefs.current.has(id)) {
      const timeoutId = timeoutRefs.current.get(id);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutRefs.current.delete(id);
    }
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const showNotification = useCallback((
    message: string,
    type: NotificationType = NotificationType.SUCCESS,
    duration: number = 3000
  ): string => {
    notificationCounter += 1;
    const id = `${Date.now()}-${notificationCounter}`;
    const notification: Notification = {
      id,
      message,
      type,
      timestamp: new Date()
    };

    setNotifications(prev => [...prev, notification]);

    if (duration > 0) {
      const timeoutId = setTimeout(() => {
        removeNotification(id);
      }, duration);
      timeoutRefs.current.set(id, timeoutId);
    }

    return id;
  }, [removeNotification]);

  const clearAllNotifications = useCallback((): void => {
    // Alle Timeouts löschen
    timeoutRefs.current.forEach((timeoutId) => clearTimeout(timeoutId));
    timeoutRefs.current.clear();
    setNotifications([]);
  }, []);

  const getIcon = (type: NotificationType): React.ReactElement => {
    switch (type) {
      case NotificationType.SUCCESS:
        return <CheckCircle className="h-5 w-5" />;
      case NotificationType.ERROR:
        return <AlertCircle className="h-5 w-5" />;
      case NotificationType.WARNING:
        return <AlertCircle className="h-5 w-5" />;
      case NotificationType.INFO:
        return <Info className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getColors = (type: NotificationType): string => {
    switch (type) {
      case NotificationType.SUCCESS:
        return 'bg-green-500 text-white';
      case NotificationType.ERROR:
        return 'bg-red-500 text-white';
      case NotificationType.WARNING:
        return 'bg-yellow-500 text-white';
      case NotificationType.INFO:
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const value: NotificationContextValue = {
    notifications,
    showNotification,
    removeNotification,
    clearAllNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}

      {/* Notification Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`flex items-center p-4 rounded-lg shadow-lg max-w-md ${getColors(notification.type)} fade-in`}
          >
            <div className="flex-shrink-0 mr-3">
              {getIcon(notification.type)}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{notification.message}</p>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="flex-shrink-0 ml-3 text-white hover:text-gray-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};
