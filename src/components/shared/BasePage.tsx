import React from 'react';

interface BasePageProps {
  title: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
  footerActions?: React.ReactNode;
  children: React.ReactNode;
  maxHeight?: string;
}

const BasePage: React.FC<BasePageProps> = ({
  title,
  subtitle,
  headerActions,
  footerActions,
  children,
  maxHeight = "max-h-[calc(100vh-200px)]"
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
          )}
        </div>
        {headerActions && (
          <div className="flex items-center space-x-3">
            {headerActions}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className={`p-6 overflow-y-auto ${maxHeight}`}>
          {children}
        </div>

        {/* Footer */}
        {footerActions && (
          <div className="border-t border-gray-200 px-6 py-4">
            <div className="flex items-center justify-end space-x-3">
              {footerActions}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BasePage;
