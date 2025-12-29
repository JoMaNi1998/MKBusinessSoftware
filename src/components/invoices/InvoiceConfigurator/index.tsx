import React from 'react';
import { ChevronLeft, ChevronRight, Send } from 'lucide-react';
import { useInvoiceConfigurator } from '@hooks/useInvoiceConfigurator';
import StepIndicator from './StepIndicator';
import CustomerStep from './steps/CustomerStep';
import ServicesStep from './steps/ServicesStep';
import PositionsStep from './steps/PositionsStep';
import PreviewStep from './steps/PreviewStep';

const InvoiceConfigurator: React.FC = () => {
  const hook = useInvoiceConfigurator();

  const renderStepContent = (): React.ReactNode => {
    switch (hook.currentStep) {
      case 0:
        return (
          <CustomerStep
            selectedCustomer={hook.selectedCustomer}
            setSelectedCustomer={hook.setSelectedCustomer}
            selectedProject={hook.selectedProject}
            setSelectedProject={hook.setSelectedProject}
            customers={hook.customers}
            customerProjects={hook.customerProjects}
            invoiceData={hook.invoiceData}
            validationErrors={hook.validationErrors}
            setValidationErrors={hook.setValidationErrors}
          />
        );
      case 1:
        return (
          <ServicesStep
            laborFactorSelections={hook.laborFactorSelections}
            setLaborFactorSelections={hook.setLaborFactorSelections}
            calcSettings={hook.calcSettings}
            validationErrors={hook.validationErrors}
            dropdownCategories={hook.dropdownCategories}
            activeServices={hook.activeServices}
            selectedServices={hook.selectedServices}
            serviceQuantities={hook.serviceQuantities}
            handleServiceSelection={hook.handleServiceSelection}
            handleQuantityChange={hook.handleQuantityChange}
            getSelectedService={hook.getSelectedService}
            getServiceById={hook.getServiceById}
            invoiceData={hook.invoiceData}
            serviceSearchTerm={hook.serviceSearchTerm}
            setServiceSearchTerm={hook.setServiceSearchTerm}
            filteredServicesByCategory={hook.filteredServicesByCategory}
            handleAddService={hook.handleAddService}
          />
        );
      case 2:
        return (
          <PositionsStep
            invoiceData={hook.invoiceData}
            setInvoiceData={hook.setInvoiceData}
            handleUpdateItem={hook.handleUpdateItem}
            handleRemoveItem={hook.handleRemoveItem}
            handleAddManualItem={hook.handleAddManualItem}
            customers={hook.customers}
            projects={hook.projects}
            selectedCustomer={hook.selectedCustomer}
            selectedProject={hook.selectedProject}
            company={hook.company}
            invoiceTexts={hook.invoiceTexts}
            footer={hook.footer}
          />
        );
      case 3:
        return (
          <PreviewStep
            invoiceData={hook.invoiceData}
            customers={hook.customers}
            projects={hook.projects}
            selectedCustomer={hook.selectedCustomer}
            selectedProject={hook.selectedProject}
            company={hook.company}
            invoiceTexts={hook.invoiceTexts}
            footer={hook.footer}
          />
        );
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
            {hook.isEditing ? 'Rechnung bearbeiten' : 'Neue Rechnung erstellen'}
          </h1>
        </div>

        {/* Step Indicator */}
        <div className="px-6 pb-4">
          <StepIndicator
            currentStep={hook.currentStep}
            setCurrentStep={hook.setCurrentStep}
          />
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
            onClick={hook.currentStep === 0 ? hook.handleCancel : hook.handleBack}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 flex items-center"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            {hook.currentStep === 0 ? 'Abbrechen' : 'Zurück'}
          </button>

          {hook.currentStep < 3 ? (
            <button
              onClick={hook.handleNext}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              Weiter
              <ChevronRight className="h-5 w-5 ml-1" />
            </button>
          ) : (
            <button
              onClick={() => hook.handleSave()}
              disabled={hook.saving || !hook.selectedCustomer}
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
