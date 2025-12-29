/**
 * ProjectDateEditModal Component
 *
 * Modal for editing project start and end dates.
 */

import React, { useState, useEffect } from 'react';
import { Calendar, Save } from 'lucide-react';
import { BaseModal } from '@components/shared';
import type { ProjectDateEditModalProps } from '@app-types/components/calendar.types';

const ProjectDateEditModal: React.FC<ProjectDateEditModalProps> = ({
  isOpen,
  project,
  onClose,
  onSave
}) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Initialize dates when project changes
  useEffect(() => {
    if (project) {
      setStartDate(project.startDate || '');
      setEndDate(project.endDate || '');
      setError('');
    }
  }, [project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate) {
      setError('Bitte geben Sie ein Startdatum ein');
      return;
    }

    if (endDate && new Date(endDate) < new Date(startDate)) {
      setError('Das Enddatum muss nach dem Startdatum liegen');
      return;
    }

    if (!project) return;

    setIsSaving(true);
    setError('');

    try {
      await onSave(project.id, startDate, endDate || undefined);
    } catch (err) {
      setError('Fehler beim Speichern der Termine');
    } finally {
      setIsSaving(false);
    }
  };

  const footerButtons = (
    <>
      <button
        type="button"
        onClick={onClose}
        className="px-4 py-2 text-gray-600 hover:text-gray-800"
        disabled={isSaving}
      >
        Abbrechen
      </button>
      <button
        type="submit"
        form="date-edit-form"
        disabled={isSaving || !startDate}
        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        <Save className="h-4 w-4" />
        {isSaving ? 'Speichert...' : 'Speichern'}
      </button>
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Projekttermine bearbeiten"
      icon={Calendar}
      footerButtons={footerButtons}
      maxWidth="max-w-md"
    >
      <form id="date-edit-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Project Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">Projekt</p>
          <p className="font-medium text-gray-900">
            {project?.name || project?.projectName || 'Unbenanntes Projekt'}
          </p>
          {project?.customerName && (
            <p className="text-sm text-gray-500 mt-1">{project.customerName}</p>
          )}
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Startdatum *
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Enddatum
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Optional - leer lassen für eintägige Projekte
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </form>
    </BaseModal>
  );
};

export default ProjectDateEditModal;
