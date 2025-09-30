import React, { useState, useEffect, useCallback } from 'react';
import { 
  Package, 
  Zap, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  Search,
  Database,
  Trash2 as TrashIcon
} from 'lucide-react';
import { FirebaseService } from '../services/firebaseService';
import { useNotification } from '../context/NotificationContext';
import { useMaterials } from '../context/MaterialContext';
import BaseModal from './BaseModal';
import BasePage from './BasePage';

const Settings = () => {
  const { showNotification } = useNotification();
  const { materials } = useMaterials();
  const [activeTab, setActiveTab] = useState('pv-configurator');
  const [pvSubTab, setPvSubTab] = useState('komponenten');
  const [settings, setSettings] = useState({});
  
  // PV Configurator Default Settings
  const [pvDefaults, setPvDefaults] = useState({
    // First page defaults (Module + Dachtyp only)
    defaultModule: 'Kein Standard',
    defaultRoofType: 'Kein Standard',
    // Second page defaults (all components)
    defaultPvMountingSystem: 'Kein Standard',
    defaultBefestigungPVMountingSystem: 'Kein Standard',
    defaultModulEndklemmen: 'Kein Standard',
    defaultModulMittelklemmen: 'Kein Standard',
    defaultPvSteckerMale: 'Kein Standard',
    defaultPvSteckerFemale: 'Kein Standard',
    defaultProfile: 'Kein Standard',
    defaultVerbinder: 'Kein Standard',
    defaultEndkappen: 'Kein Standard',
    defaultInverter: 'Kein Standard',
    defaultOptimizer: 'Kein Standard',
    defaultBattery: 'Kein Standard',
    defaultWallbox: 'Kein Standard',
    defaultEnergyManagement: 'Kein Standard',
    defaultSmartDongle: 'Kein Standard',
    defaultBackupBox: 'Kein Standard',
    // Default Material-IDs für Kabelschuhe
    defaultKabelschuh6M8: 'Kein Standard',
    defaultKabelschuh10M6: 'Kein Standard',
    defaultKabelschuh16M6: 'Kein Standard',
    // Default Material-IDs für Aderendhülsen
    defaultAderendhuelsen10mm2: 'Kein Standard',
    defaultAderendhuelsen16mm2: 'Kein Standard',
    // Default Material-IDs für Dübel
    defaultDuebelGeruestanker: 'Kein Standard',
    // Aufkleber Standardkomponenten
    defaultAufkleberPV: 'Kein Standard',
    defaultAufkleberPVMitSpeicher: 'Kein Standard',
    defaultAufkleberPVMitNotstrom: 'Kein Standard',
    // ErdungHES Standardkomponente
    defaultErdungHES: 'Kein Standard',
    // ErdungStaberder Standardkomponente
    defaultErdungStaberder: 'Kein Standard',
  });
  
  // Kategorie- und Spezifikations-Management
  const [categories, setCategories] = useState([]);
  const [specifications, setSpecifications] = useState({});
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categorySpecs, setCategorySpecs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showIds, setShowIds] = useState(false);


  // PV Configurator Functions
  const loadPvDefaults = async () => {
    try {
      const defaultsData = await FirebaseService.getDocuments('pv-defaults');
      if (defaultsData && defaultsData.length > 0) {
        setPvDefaults(defaultsData[0]);
      }
    } catch (error) {
      console.error('Fehler beim Laden der PV-Standardeinstellungen:', error);
    }
  };

  const handlePvDefaultChange = (key, value) => {
    setPvDefaults(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSavePvDefaults = async () => {
    try {
      const existingDefaults = await FirebaseService.getDocuments('pv-defaults');
      
      if (existingDefaults && existingDefaults.length > 0) {
        // Update existing defaults
        await FirebaseService.updateDocument('pv-defaults', existingDefaults[0].id, pvDefaults);
      } else {
        // Create new defaults
        await FirebaseService.addDocument('pv-defaults', pvDefaults);
      }
      
      showNotification('PV-Standardeinstellungen erfolgreich gespeichert', 'success');
    } catch (error) {
      console.error('Fehler beim Speichern der PV-Standardeinstellungen:', error);
      showNotification('Fehler beim Speichern der PV-Standardeinstellungen', 'error');
    }
  };

  // Load PV defaults from Firebase
  useEffect(() => {
    loadPvDefaults();
  }, []);

  // Kategorie- und Spezifikations-Funktionen
  const loadCategoriesAndSpecs = useCallback(async () => {
    try {
      setLoading(true);
      const categoriesData = await FirebaseService.getDocuments('categories');
      const specsData = await FirebaseService.getDocuments('specifications');
      
      setCategories(categoriesData || []);
      
      // Spezifikationen nach Kategorien gruppieren
      const specsMap = {};
      specsData.forEach(spec => {
        if (!specsMap[spec.categoryId]) {
          specsMap[spec.categoryId] = [];
        }
        specsMap[spec.categoryId].push(spec);
      });
      setSpecifications(specsMap);
    } catch (error) {
      console.error('Fehler beim Laden der Kategorien:', error);
      showNotification('Fehler beim Laden der Kategorien', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  // Load categories and specs on component mount
  useEffect(() => {
    loadCategoriesAndSpecs();
  }, [loadCategoriesAndSpecs]);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      showNotification('Bitte Kategoriename eingeben', 'error');
      return;
    }

    // Überprüfung auf doppelte Kategorienamen
    const existingCategory = categories.find(cat => 
      cat.name.toLowerCase() === newCategoryName.trim().toLowerCase()
    );
    
    if (existingCategory) {
      showNotification('Eine Kategorie mit diesem Namen existiert bereits', 'error');
      return;
    }

    try {
      const categoryData = {
        name: newCategoryName,
        createdAt: new Date()
      };

      // Kategorie erst speichern, um die ID zu erhalten
      const savedCategory = await FirebaseService.addDocument('categories', categoryData);
      const categoryId = savedCategory.id || newCategoryName;
      
      // Spezifikationen separat speichern mit der korrekten categoryId
      for (const spec of categorySpecs) {
        const cleanSpec = {
          name: spec.name,
          label: spec.name, // Verwende name auch als label
          type: 'text', // Immer text, wie gewünscht
          required: true, // Alle Spezifikationen sind Pflichtfelder
          unit: spec.unit || '',
          categoryId: categoryId,
          createdAt: new Date()
        };
        await FirebaseService.addDocument('specifications', cleanSpec);
      }

      showNotification('Kategorie erfolgreich hinzugefügt', 'success');
      setIsAddCategoryModalOpen(false);
      setNewCategoryName('');
      setCategorySpecs([]);
      loadCategoriesAndSpecs();
    } catch (error) {
      console.error('Fehler beim Hinzufügen der Kategorie:', error);
      showNotification('Fehler beim Hinzufügen der Kategorie', 'error');
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Kategorie wirklich löschen? Alle zugehörigen Spezifikationen werden ebenfalls gelöscht.')) {
      return;
    }

    try {
      await FirebaseService.deleteDocument('categories', categoryId);
      
      // Alle Spezifikationen dieser Kategorie löschen
      const categorySpecs = specifications[categoryId] || [];
      for (const spec of categorySpecs) {
        await FirebaseService.deleteDocument('specifications', spec.id);
      }

      showNotification('Kategorie erfolgreich gelöscht', 'success');
      loadCategoriesAndSpecs();
    } catch (error) {
      console.error('Fehler beim Löschen der Kategorie:', error);
      showNotification('Fehler beim Löschen der Kategorie', 'error');
    }
  };

  const handleAddSpecification = () => {
    setCategorySpecs([...categorySpecs, {
      name: '',
      unit: ''
    }]);
  };

  const handleUpdateSpecification = (index, field, value) => {
    const updatedSpecs = [...categorySpecs];
    updatedSpecs[index] = {
      ...updatedSpecs[index],
      [field]: value
    };
    setCategorySpecs(updatedSpecs);
  };

  const handleRemoveSpecification = (index) => {
    setCategorySpecs(categorySpecs.filter((_, i) => i !== index));
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    
    // Lade die Spezifikationen für diese Kategorie
    const specs = specifications[category.id] || specifications[category.name] || [];
    setCategorySpecs(specs.map(spec => ({
      name: spec.name,
      unit: spec.unit || ''
    })));
    
    setIsAddCategoryModalOpen(true);
  };

  const handleUpdateCategory = async () => {
    if (!newCategoryName.trim()) {
      showNotification('Bitte Kategoriename eingeben', 'error');
      return;
    }

    // Überprüfung auf doppelte Kategorienamen (außer der aktuell bearbeiteten)
    const existingCategory = categories.find(cat => 
      cat.name.toLowerCase() === newCategoryName.trim().toLowerCase() && 
      cat.id !== editingCategory.id
    );
    
    if (existingCategory) {
      showNotification('Eine Kategorie mit diesem Namen existiert bereits', 'error');
      return;
    }

    try {
      const categoryData = {
        name: newCategoryName,
        updatedAt: new Date()
      };

      // Kategorie aktualisieren
      await FirebaseService.updateDocument('categories', editingCategory.id, categoryData);
      const categoryId = editingCategory.id;
      
      // Alte Spezifikationen abrufen
      const oldSpecs = specifications[categoryId] || [];
      const oldSpecsMap = {};
      oldSpecs.forEach(spec => {
        oldSpecsMap[spec.id] = spec;
      });
      
      // Spezifikationen aktualisieren (bestehende behalten, neue hinzufügen, gelöschte entfernen)
      const updatedSpecIds = new Set();
      
      for (let i = 0; i < categorySpecs.length; i++) {
        const spec = categorySpecs[i];
        const existingSpec = oldSpecs[i];
        
        if (existingSpec && existingSpec.id) {
          // Bestehende Spezifikation aktualisieren (nur Name und Unit ändern)
          const updatedSpec = {
            name: spec.name,
            label: spec.name,
            type: 'text',
            required: true,
            unit: spec.unit || '',
            categoryId: categoryId,
            updatedAt: new Date()
          };
          await FirebaseService.updateDocument('specifications', existingSpec.id, updatedSpec);
          updatedSpecIds.add(existingSpec.id);
        } else {
          // Neue Spezifikation hinzufügen
          const newSpec = {
            name: spec.name,
            label: spec.name,
            type: 'text',
            required: true,
            unit: spec.unit || '',
            categoryId: categoryId,
            createdAt: new Date()
          };
          const savedSpec = await FirebaseService.addDocument('specifications', newSpec);
          updatedSpecIds.add(savedSpec.id);
        }
      }
      
      // Gelöschte Spezifikationen entfernen
      for (const oldSpec of oldSpecs) {
        if (!updatedSpecIds.has(oldSpec.id)) {
          await FirebaseService.deleteDocument('specifications', oldSpec.id);
          
          // Auch aus allen Materialien entfernen
          const allMaterials = await FirebaseService.getDocuments('materials');
          const categoryMaterials = allMaterials.filter(material => 
            material.categoryId === editingCategory.id
          );
          
          for (const material of categoryMaterials) {
            if (material.specifications && material.specifications[oldSpec.id]) {
              const updatedSpecifications = { ...material.specifications };
              delete updatedSpecifications[oldSpec.id];
              await FirebaseService.updateDocument('materials', material.id, {
                specifications: updatedSpecifications,
                updatedAt: new Date()
              });
            }
          }
        }
      }

      showNotification('Kategorie erfolgreich aktualisiert', 'success');
      setIsAddCategoryModalOpen(false);
      setEditingCategory(null);
      setNewCategoryName('');
      setCategorySpecs([]);
      loadCategoriesAndSpecs();
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Kategorie:', error);
      showNotification('Fehler beim Aktualisieren der Kategorie', 'error');
    }
  };

  const tabs = [
    { id: 'pv-configurator', name: 'PV Konfigurator', icon: Zap },
    { id: 'categories', name: 'Kategorien & Spezifikationen', icon: Package }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Einstellungen</h1>
        <p className="mt-1 text-sm text-gray-600">
          Verwalten Sie Ihre Anwendungseinstellungen und Präferenzen
        </p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'pv-configurator' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">PV Konfigurator Standardeinstellungen</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Definieren Sie Standardwerte für den PV Konfigurator. Diese werden beim Start des Konfigurators vorausgewählt.
                </p>

                {/* PV Configurator Sub-tabs */}
                <div className="border-b border-gray-200 mb-6">
                  <nav className="-mb-px flex space-x-8">
                    <button
                      onClick={() => setPvSubTab('komponenten')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        pvSubTab === 'komponenten'
                          ? 'border-primary-500 text-primary-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Standard Komponenten
                    </button>
                    <button
                      onClick={() => setPvSubTab('berechnung')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        pvSubTab === 'berechnung'
                          ? 'border-primary-500 text-primary-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Berechnung
                    </button>
                  </nav>
                </div>

                {/* Standard Komponenten Tab */}
                {pvSubTab === 'komponenten' && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <div className="col-span-2">
                        <h4 className="text-lg font-semibold text-gray-800 mb-4 border-b-2 border-blue-500 pb-2">PV Komponenten</h4>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          PV-Modul
                        </label>
                        <select
                          value={pvDefaults.defaultModule}
                          onChange={(e) => handlePvDefaultChange('defaultModule', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Kein Standard</option>
                          {materials.filter(m => m.categoryId === '1uOB8fBkWQYkPS0LOZxk').map(m => (
                            <option key={m.id} value={m.id}>{m.description}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Dachtyp
                        </label>
                        <select
                          value={pvDefaults.defaultRoofType}
                          onChange={(e) => handlePvDefaultChange('defaultRoofType', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Kein Standard</option>
                          <option value="Ziegel">Ziegeldach</option>
                          <option value="Trapez">Trapezblechdach</option>
                          <option value="Flach">Flachdach</option>
                        </select>
                      </div>
                      
        
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          PV-Stecker Male
                        </label>
                        <select
                          value={pvDefaults.defaultPvSteckerMale}
                          onChange={(e) => handlePvDefaultChange('defaultPvSteckerMale', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Kein Standard</option>
                          {materials.filter(m => m.categoryId === 'bArNeyutPDFXhpPBTsOw').map(m => (
                            <option key={m.id} value={m.id}>{m.description}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          PV-Stecker Female
                        </label>
                        <select
                          value={pvDefaults.defaultPvSteckerFemale}
                          onChange={(e) => handlePvDefaultChange('defaultPvSteckerFemale', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Kein Standard</option>
                          {materials.filter(m => m.categoryId === 'bArNeyutPDFXhpPBTsOw').map(m => (
                            <option key={m.id} value={m.id}>{m.description}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Smart Dongle-WLAN-FE
                        </label>
                        <select
                          value={pvDefaults.defaultSmartDongle}
                          onChange={(e) => handlePvDefaultChange('defaultSmartDongle', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Kein Standard</option>
                          {materials.filter(m => m.categoryId === 'ZlqQZdDkuckVCHmCoU7T').map(m => (
                            <option key={m.id} value={m.id}>{m.description}</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4 border-b-2 border-blue-500 pb-2">Ziegeldach</h4>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Montagesystem
                        </label>
                        <select
                          value={pvDefaults.defaultPvMountingSystem}
                          onChange={(e) => handlePvDefaultChange('defaultPvMountingSystem', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Kein Standard</option>
                          {materials.filter(m => m.categoryId === 'mHvC6RpkDKFFCqoZjZcW').map(m => (
                            <option key={m.id} value={m.id}>{m.description}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Modulendklemmen
                        </label>
                        <select
                          value={pvDefaults.defaultModulEndklemmen}
                          onChange={(e) => handlePvDefaultChange('defaultModulEndklemmen', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Kein Standard</option>
                          {materials.filter(m => m.categoryId === 'WGfZvGlkrPiTDUC3SqL2').map(m => (
                            <option key={m.id} value={m.id}>{m.description}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Modulklemmen
                        </label>
                        <select
                          value={pvDefaults.defaultModulMittelklemmen}
                          onChange={(e) => handlePvDefaultChange('defaultModulMittelklemmen', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Kein Standard</option>
                          {materials.filter(m => m.categoryId === 'WGfZvGlkrPiTDUC3SqL2').map(m => (
                            <option key={m.id} value={m.id}>{m.description}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Profile
                        </label>
                        <select
                          value={pvDefaults.defaultProfile}
                          onChange={(e) => handlePvDefaultChange('defaultProfile', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Kein Standard</option>
                          {materials.filter(m => m.categoryId === 'aAhBqQFaynXXCf42Ws1H').map(m => (
                            <option key={m.id} value={m.id}>{m.description}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Standard Potentialausgleich
                        </label>
                        <select
                          value={pvDefaults.defaultPotentialausgleich}
                          onChange={(e) => handlePvDefaultChange('defaultPotentialausgleich', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Kein Standard</option>
                          {materials.filter(m => m.categoryId === 'YsKVAMcq3UBWfpEUmuYm').map(m => (
                            <option key={m.id} value={m.id}>{m.description}</option>
                          ))}
                        </select>
                      </div>
                      
                      
                      
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Potentialausgleich UK-UK
                        </label>
                        <select
                          value={pvDefaults.defaultPotentialausgleichUKUK}
                          onChange={(e) => handlePvDefaultChange('defaultPotentialausgleichUKUK', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Kein Standard</option>
                          {materials.filter(m => m.categoryId === 'YsKVAMcq3UBWfpEUmuYm' || (m.description && m.description.toLowerCase().includes('potentialausgleich'))).map(m => (
                            <option key={m.id} value={m.id}>{m.description}</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2">
                        <h4 className="text-lg font-semibold text-gray-800 mb-4 border-b-2 border-blue-500 pb-2">Befestigungsmaterial</h4>

                      </div>

                      

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          BefestigungPotentialausgleich UK-UK
                        </label>
                        <select
                          value={pvDefaults.defaultBefestigungPotentialausgleichUKUK}
                          onChange={(e) => handlePvDefaultChange('defaultBefestigungPotentialausgleichUKUK', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Kein Standard</option>
                          {materials.filter(m => m.categoryId === '6Solbg6r30Ms1esXD8Jn').map(m => (
                            <option key={m.id} value={m.id}>{m.description}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Befestigung Leistungsoptimierer
                        </label>
                        <select
                          value={pvDefaults.defaultBefestigungLeistungsoptimierer}
                          onChange={(e) => handlePvDefaultChange('defaultBefestigungLeistungsoptimierer', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Kein Standard</option>
                          {materials.filter(m => m.categoryId === '6Solbg6r30Ms1esXD8Jn').map(m => (
                            <option key={m.id} value={m.id}>{m.description}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Dammstoffdübel
                        </label>
                        <select
                          value={pvDefaults.defaultDammstoffduebel || ''}
                          onChange={(e) => handlePvDefaultChange('defaultDammstoffduebel', e.target.value || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Kein Standard</option>
                          {materials.filter(m => m.categoryId === 'dzWCk1eQz8uIFf71U5VR').map(material => (
                            <option key={material.id} value={material.id}>
                              {material.name} {material.description ? material.description : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Kabelkanal Schrauben
                        </label>
                        <select
                          value={pvDefaults.defaultKabelkanalSchrauben}
                          onChange={(e) => handlePvDefaultChange('defaultKabelkanalSchrauben', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Kein Standard</option>
                          {materials.filter(m => m.categoryId === 'eFnOPVhYKeqBjNhq6Dm0').map(m => (
                            <option key={m.id} value={m.id}>{m.description}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Standard Kabelkanal Dübel
                        </label>
                        <select
                          value={pvDefaults.defaultKabelkanalDuebel}
                          onChange={(e) => handlePvDefaultChange('defaultKabelkanalDuebel', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Kein Standard</option>
                          {materials.filter(m => m.categoryId === 'dzWCk1eQz8uIFf71U5VR').map(m => (
                            <option key={m.id} value={m.id}>{m.description}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Standard PV-Geräte Schrauben
                        </label>
                        <select
                          value={pvDefaults.defaultPvGeraeteSchrauben}
                          onChange={(e) => handlePvDefaultChange('defaultPvGeraeteSchrauben', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Kein Standard</option>
                          {materials.filter(m => m.categoryId === 'NAuknAtWDNE89AM6btz8').map(m => (
                            <option key={m.id} value={m.id}>{m.description}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          PV-Geräte Dübel
                        </label>
                        <select
                          value={pvDefaults.defaultPvGeraeteDuebel || ''}
                          onChange={(e) => handlePvDefaultChange('defaultPvGeraeteDuebel', e.target.value || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Kein Standard</option>
                          {materials.filter(m => m.categoryId === 'dzWCk1eQz8uIFf71U5VR').map(material => (
                            <option key={material.id} value={material.id}>
                              {material.name} {material.description ? material.description : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Schrauben Rohrschelle
                        </label>
                        <select
                          value={pvDefaults.defaultSchraubenRohrschelle || ''}
                          onChange={(e) => handlePvDefaultChange('defaultSchraubenRohrschelle', e.target.value || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Kein Standard</option>
                          {materials.filter(m => m.categoryId === 'uILovgnrVbnz0i8D5lBx').map(material => (
                            <option key={material.id} value={material.id}>
                              {material.name} {material.description ? material.description : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Dübel Rohrschelle
                        </label>
                        <select
                          value={pvDefaults.defaultDuebelRohrschelle || ''}
                          onChange={(e) => handlePvDefaultChange('defaultDuebelRohrschelle', e.target.value || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Kein Standard</option>
                          {materials.filter(m => m.categoryId === 'dzWCk1eQz8uIFf71U5VR').map(material => (
                            <option key={material.id} value={material.id}>
                              {material.name} {material.description ? material.description : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Dübel Gerüstanker
                        </label>
                        <select
                          value={pvDefaults.defaultDuebelGeruestanker}
                          onChange={(e) => handlePvDefaultChange('defaultDuebelGeruestanker', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Kein Standard</option>
                          {materials.filter(m => m.categoryId === 'dzWCk1eQz8uIFf71U5VR').map(m => (
                            <option key={m.id} value={m.id}>{m.description}</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2">
                        <h4 className="text-lg font-semibold text-gray-800 mb-4 border-b-2 border-blue-500 pb-2">Aufkleber Standardkomponenten</h4>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Aufkleber PV (Standard)
                        </label>
                        <select
                          value={pvDefaults.defaultAufkleberPV}
                          onChange={(e) => handlePvDefaultChange('defaultAufkleberPV', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Kein Standard</option>
                          {materials.filter(m => m.categoryId === 'zy6rEAiGDjyG0Ox3CBN8').map(m => (
                            <option key={m.id} value={m.id}>{m.description}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Aufkleber PV mit Speicher
                        </label>
                        <select
                          value={pvDefaults.defaultAufkleberPVMitSpeicher}
                          onChange={(e) => handlePvDefaultChange('defaultAufkleberPVMitSpeicher', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Kein Standard</option>
                          {materials.filter(m => m.categoryId === 'zy6rEAiGDjyG0Ox3CBN8').map(m => (
                            <option key={m.id} value={m.id}>{m.description}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Aufkleber PV mit Notstrom
                        </label>
                        <select
                          value={pvDefaults.defaultAufkleberPVMitNotstrom}
                          onChange={(e) => handlePvDefaultChange('defaultAufkleberPVMitNotstrom', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Kein Standard</option>
                          {materials.filter(m => m.categoryId === 'zy6rEAiGDjyG0Ox3CBN8').map(m => (
                            <option key={m.id} value={m.id}>{m.description}</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2">
                        <h4 className="text-lg font-semibold text-gray-800 mb-4 border-b-2 border-blue-500 pb-2">Rohrschelle Komponenten</h4>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Rohrschelle Standard
                        </label>
                        <select
                          value={pvDefaults.defaultRohrschelleStandard || ''}
                          onChange={(e) => handlePvDefaultChange('defaultRohrschelleStandard', e.target.value || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Kein Standard</option>
                          {materials.filter(m => m.categoryId === 'Lby5LiXgEG5KJTo6NEia').map(material => (
                            <option key={material.id} value={material.id}>
                              {material.name} {material.description ? material.description : ''}
                            </option>
                          ))}
                        </select>
                      </div>


                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Rohrschelle Groß
                        </label>
                        <select
                          value={pvDefaults.defaultRohrschelleGross || ''}
                          onChange={(e) => handlePvDefaultChange('defaultRohrschelleGross', e.target.value || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Kein Standard</option>
                          {materials.filter(m => m.categoryId === 'Lby5LiXgEG5KJTo6NEia').map(material => (
                            <option key={material.id} value={material.id}>
                              {material.name} {material.description ? material.description : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Rohrschelle Outdoor
                        </label>
                        <select
                          value={pvDefaults.defaultRohrschelleOutdoor || ''}
                          onChange={(e) => handlePvDefaultChange('defaultRohrschelleOutdoor', e.target.value || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Kein Standard</option>
                          {materials.filter(m => m.categoryId === 'Lby5LiXgEG5KJTo6NEia').map(material => (
                            <option key={material.id} value={material.id}>
                              {material.name} {material.description ? material.description : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      
                      <div className="col-span-2">
                        <h4 className="text-lg font-semibold text-gray-800 mb-4 border-b-2 border-blue-500 pb-2">Kabelverlegung</h4>

                      </div>

                      

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Kabelmanagement
                        </label>
                        <select
                          value={pvDefaults.defaultKabelmanagement}
                          onChange={(e) => handlePvDefaultChange('defaultKabelmanagement', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Kein Standard</option>
                          {materials.filter(m => m.categoryId === 'QVChNHri0HPhXpHW0spy').map(m => (
                            <option key={m.id} value={m.id}>{m.description}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Installationsrohr
                        </label>
                        <select
                          value={pvDefaults.defaultInstallationsrohr || ''}
                          onChange={(e) => handlePvDefaultChange('defaultInstallationsrohr', e.target.value || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Kein Standard</option>
                          {materials.filter(m => m.categoryId === 'Lby5LiXgEG5KJTo6NEia').map(material => (
                            <option key={material.id} value={material.id}>
                              {material.name} {material.description ? material.description : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Flexrohr
                        </label>
                        <select
                          value={pvDefaults.defaultFlexrohrStandard || ''}
                          onChange={(e) => handlePvDefaultChange('defaultFlexrohrStandard', e.target.value || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Kein Standard</option>
                          {materials.filter(m => m.categoryId === 'Lby5LiXgEG5KJTo6NEia').map(material => (
                            <option key={material.id} value={material.id}>
                              {material.name} {material.description ? material.description : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Flexrohr Groß
                        </label>
                        <select
                          value={pvDefaults.defaultFlexrohrGross || ''}
                          onChange={(e) => handlePvDefaultChange('defaultFlexrohrGross', e.target.value || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Kein Standard</option>
                          {materials.filter(m => m.categoryId === 'Lby5LiXgEG5KJTo6NEia').map(material => (
                            <option key={material.id} value={material.id}>
                              {material.name} {material.description ? material.description : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          InstallationsrohrOutdoor
                        </label>
                        <select
                          value={pvDefaults.defaultInstallationsrohrOutdoor || ''}
                          onChange={(e) => handlePvDefaultChange('defaultInstallationsrohrOutdoor', e.target.value || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Kein Standard</option>
                          {materials.filter(m => m.categoryId === 'Lby5LiXgEG5KJTo6NEia').map(material => (
                            <option key={material.id} value={material.id}>
                              {material.name} {material.description ? material.description : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Muffe Outdoor
                        </label>
                        <select
                          value={pvDefaults.defaultMuffeOutdoor || ''}
                          onChange={(e) => handlePvDefaultChange('defaultMuffeOutdoor', e.target.value || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Kein Standard</option>
                          {materials.filter(m => m.categoryId === 'Lby5LiXgEG5KJTo6NEia').map(material => (
                            <option key={material.id} value={material.id}>
                              {material.name} {material.description ? material.description : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Kabelkanal Standard
                        </label>
                        <select
                          value={pvDefaults.defaultKabelkanalStandard}
                          onChange={(e) => handlePvDefaultChange('defaultKabelkanalStandard', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Kein Standard</option>
                          {materials.filter(m => m.categoryId === 'Lby5LiXgEG5KJTo6NEia').map(m => (
                            <option key={m.id} value={m.id}>{m.description}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Kabelkanal Groß
                        </label>
                        <select
                          value={pvDefaults.defaultKabelkanalGross}
                          onChange={(e) => handlePvDefaultChange('defaultKabelkanalGross', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Kein Standard</option>
                          {materials.filter(m => m.categoryId === 'Lby5LiXgEG5KJTo6NEia').map(m => (
                            <option key={m.id} value={m.id}>{m.description}</option>
                          ))}
                        </select>
                      </div>


                      <div className="col-span-2">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4 border-b-2 border-blue-500 pb-2">Kabel Standardkomponenten</h4>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Kabel 5x1,5mm²
                        </label>
                        <select
                          value={pvDefaults.defaultKabel5x15 || ''}
                          onChange={(e) => handlePvDefaultChange('defaultKabel5x15', e.target.value || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Auswählen...</option>
                          {materials.filter(m => m.categoryId === 'BKL1zeVvHbOvtrD8udg9' || m.categoryId === '9wGooeSxShvDIs2bJAwF').map(material => (
                            <option key={material.id} value={material.id}>
                              {material.name} {material.description ? ` ${material.description}` : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Kabel 5x2,5mm²
                        </label>
                        <select
                          value={pvDefaults.defaultKabel5x25 || ''}
                          onChange={(e) => handlePvDefaultChange('defaultKabel5x25', e.target.value || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Auswählen...</option>
                          {materials.filter(m => m.categoryId === 'BKL1zeVvHbOvtrD8udg9' || m.categoryId === '9wGooeSxShvDIs2bJAwF').map(material => (
                            <option key={material.id} value={material.id}>
                              {material.name} {material.description ? ` ${material.description}` : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Kabel 5x4mm²
                        </label>
                        <select
                          value={pvDefaults.defaultKabel5x4 || ''}
                          onChange={(e) => handlePvDefaultChange('defaultKabel5x4', e.target.value || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Auswählen...</option>
                          {materials.filter(m => m.categoryId === 'BKL1zeVvHbOvtrD8udg9' || m.categoryId === '9wGooeSxShvDIs2bJAwF').map(material => (
                            <option key={material.id} value={material.id}>
                              {material.name} {material.description ? ` ${material.description}` : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Kabel 5x6mm²
                        </label>
                        <select
                          value={pvDefaults.defaultKabel5x6 || ''}
                          onChange={(e) => handlePvDefaultChange('defaultKabel5x6', e.target.value || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Auswählen...</option>
                          {materials.filter(m => m.categoryId === 'BKL1zeVvHbOvtrD8udg9' || m.categoryId === '9wGooeSxShvDIs2bJAwF').map(material => (
                            <option key={material.id} value={material.id}>
                              {material.name} {material.description ? ` ${material.description}` : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Kabel 5x10mm²
                        </label>
                        <select
                          value={pvDefaults.defaultKabel5x10 || ''}
                          onChange={(e) => handlePvDefaultChange('defaultKabel5x10', e.target.value || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Auswählen...</option>
                          {materials.filter(m => m.categoryId === 'BKL1zeVvHbOvtrD8udg9' || m.categoryId === '9wGooeSxShvDIs2bJAwF').map(material => (
                            <option key={material.id} value={material.id}>
                              {material.name} {material.description ? ` ${material.description}` : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Kabel 5x16mm²
                        </label>
                        <select
                          value={pvDefaults.defaultKabel5x16 || ''}
                          onChange={(e) => handlePvDefaultChange('defaultKabel5x16', e.target.value || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Auswählen...</option>
                          {materials.filter(m => m.categoryId === 'BKL1zeVvHbOvtrD8udg9' || m.categoryId === '9wGooeSxShvDIs2bJAwF').map(material => (
                            <option key={material.id} value={material.id}>
                              {material.name} {material.description ? ` ${material.description}` : ''}
                            </option>
                          ))}
                        </select>
                      </div>


                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Adernleitung 10mm² Blau
                        </label>
                        <select
                          value={pvDefaults.defaultAdernleitung10mm2Blau || ''}
                          onChange={(e) => handlePvDefaultChange('defaultAdernleitung10mm2Blau', e.target.value || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Kein Standard</option>
                          {materials.filter(m => m.categoryId === 'fVXEVA2ecyaSx72cgafl').map(material => (
                            <option key={material.id} value={material.id}>
                              {material.name} {material.description ? material.description : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Adernleitung 10mm² Schwarz
                        </label>
                        <select
                          value={pvDefaults.defaultAdernleitung10mm2Schwarz || ''}
                          onChange={(e) => handlePvDefaultChange('defaultAdernleitung10mm2Schwarz', e.target.value || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Kein Standard</option>
                          {materials.filter(m => m.categoryId === 'fVXEVA2ecyaSx72cgafl').map(material => (
                            <option key={material.id} value={material.id}>
                              {material.name} {material.description ? material.description : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Adernleitung 10mm² Grün/Gelb
                        </label>
                        <select
                          value={pvDefaults.defaultAdernleitung10mm2GruenGelb || ''}
                          onChange={(e) => handlePvDefaultChange('defaultAdernleitung10mm2GruenGelb', e.target.value || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Kein Standard</option>
                          {materials.filter(m => m.categoryId === 'fVXEVA2ecyaSx72cgafl').map(material => (
                            <option key={material.id} value={material.id}>
                              {material.name} {material.description ? material.description : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Adernleitung 16mm² Blau
                        </label>
                        <select
                          value={pvDefaults.defaultAdernleitung16mm2Blau || ''}
                          onChange={(e) => handlePvDefaultChange('defaultAdernleitung16mm2Blau', e.target.value || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Kein Standard</option>
                          {materials.filter(m => m.categoryId === 'fVXEVA2ecyaSx72cgafl').map(material => (
                            <option key={material.id} value={material.id}>
                              {material.name} {material.description ? material.description : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Adernleitung 16mm² Schwarz
                        </label>
                        <select
                          value={pvDefaults.defaultAdernleitung16mm2Schwarz || ''}
                          onChange={(e) => handlePvDefaultChange('defaultAdernleitung16mm2Schwarz', e.target.value || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Kein Standard</option>
                          {materials.filter(m => m.categoryId === 'fVXEVA2ecyaSx72cgafl').map(material => (
                            <option key={material.id} value={material.id}>
                              {material.name} {material.description ? material.description : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Adernleitung 16mm² Grün/Gelb
                        </label>
                        <select
                          value={pvDefaults.defaultAdernleitung16mm2GruenGelb || ''}
                          onChange={(e) => handlePvDefaultChange('defaultAdernleitung16mm2GruenGelb', e.target.value || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Kein Standard</option>
                          {materials.filter(m => m.categoryId === 'fVXEVA2ecyaSx72cgafl').map(material => (
                            <option key={material.id} value={material.id}>
                              {material.name} {material.description ? material.description : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          PV-Kabel
                        </label>
                        <select
                          value={pvDefaults.defaultPvKabel}
                          onChange={(e) => handlePvDefaultChange('defaultPvKabel', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Kein Standard</option>
                          {materials.filter(m => m.categoryId === 'b2Bf0YkhAA6x0T65W9hZ' || (m.description && m.description.toLowerCase().includes('pv') && m.description.toLowerCase().includes('kabel'))).map(m => (
                            <option key={m.id} value={m.id}>{m.description}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          ErdungHES
                        </label>
                        <select
                          value={pvDefaults.defaultErdungHES || ''}
                          onChange={(e) => handlePvDefaultChange('defaultErdungHES', e.target.value || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Kein Standard</option>
                          {materials.filter(m => m.categoryId === 'BKL1zeVvHbOvtrD8udg9' || m.categoryId === '9wGooeSxShvDIs2bJAwF').map(material => (
                            <option key={material.id} value={material.id}>
                              {material.name} {material.description ? material.description : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Potentialausgleich HES-UK
                        </label>
                        <select
                          value={pvDefaults.defaultPotentialausgleichHESUK || ''}
                          onChange={(e) => handlePvDefaultChange('defaultPotentialausgleichHESUK', e.target.value || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Kein Standard</option>
                          {materials.filter(m => m.categoryId === '9wGooeSxShvDIs2bJAwF').map(material => (
                            <option key={material.id} value={material.id}>
                              {material.name} {material.description ? material.description : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          SchutzleiterPV
                        </label>
                        <select
                          value={pvDefaults.defaultSchutzleiterPV || ''}
                          onChange={(e) => handlePvDefaultChange('defaultSchutzleiterPV', e.target.value || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Kein Standard</option>
                          {materials.filter(m => m.categoryId === 'BKL1zeVvHbOvtrD8udg9' || m.categoryId === '9wGooeSxShvDIs2bJAwF').map(material => (
                            <option key={material.id} value={material.id}>
                              {material.name} {material.description ? material.description : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          ErdungStaberder
                        </label>
                        <select
                          value={pvDefaults.defaultErdungStaberder || ''}
                          onChange={(e) => handlePvDefaultChange('defaultErdungStaberder', e.target.value || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Kein Standard</option>
                          {materials.filter(m => m.categoryId === '9wGooeSxShvDIs2bJAwF').map(material => (
                            <option key={material.id} value={material.id}>
                              {material.name} {material.description ? material.description : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2">
                        <h4 className="text-lg font-semibold text-gray-800 mb-4 border-b-2 border-blue-500 pb-2">Sicherung Standardkomponenten</h4>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Sicherung 16A
                        </label>
                        <select
                          value={pvDefaults.defaultSicherung16A || ''}
                          onChange={(e) => handlePvDefaultChange('defaultSicherung16A', e.target.value || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Auswählen...</option>
                          {materials.filter(m => m.categoryId === 'mMfrQeYNHrQJVT4hLAZs').map(material => (
                            <option key={material.id} value={material.id}>
                              {material.name} {material.description ? ` ${material.description}` : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Sicherung 20A
                        </label>
                        <select
                          value={pvDefaults.defaultSicherung20A || ''}
                          onChange={(e) => handlePvDefaultChange('defaultSicherung20A', e.target.value || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Auswählen...</option>
                          {materials.filter(m => m.categoryId === 'mMfrQeYNHrQJVT4hLAZs').map(material => (
                            <option key={material.id} value={material.id}>
                              {material.name} {material.description ? ` ${material.description}` : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Sicherung 25A
                        </label>
                        <select
                          value={pvDefaults.defaultSicherung25A || ''}
                          onChange={(e) => handlePvDefaultChange('defaultSicherung25A', e.target.value || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Auswählen...</option>
                          {materials.filter(m => m.categoryId === 'mMfrQeYNHrQJVT4hLAZs').map(material => (
                            <option key={material.id} value={material.id}>
                              {material.name} {material.description ? ` ${material.description}` : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Sicherung 32A
                        </label>
                        <select
                          value={pvDefaults.defaultSicherung32A || ''}
                          onChange={(e) => handlePvDefaultChange('defaultSicherung32A', e.target.value || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Auswählen...</option>
                          {materials.filter(m => m.categoryId === 'mMfrQeYNHrQJVT4hLAZs').map(material => (
                            <option key={material.id} value={material.id}>
                              {material.name} {material.description ? ` ${material.description}` : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Sicherung 50A
                        </label>
                        <select
                          value={pvDefaults.defaultSicherung50A || ''}
                          onChange={(e) => handlePvDefaultChange('defaultSicherung50A', e.target.value || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Auswählen...</option>
                          {materials.filter(m => m.categoryId === 'mMfrQeYNHrQJVT4hLAZs').map(material => (
                            <option key={material.id} value={material.id}>
                              {material.name} {material.description ? ` ${material.description}` : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Sicherung 63A
                        </label>
                        <select
                          value={pvDefaults.defaultSicherung63A || ''}
                          onChange={(e) => handlePvDefaultChange('defaultSicherung63A', e.target.value || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Auswählen...</option>
                          {materials.filter(m => m.categoryId === 'mMfrQeYNHrQJVT4hLAZs').map(material => (
                            <option key={material.id} value={material.id}>
                              {material.name} {material.description ? ` ${material.description}` : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          FI Schutzschalter Wallbox
                        </label>
                        <select
                          value={pvDefaults.defaultFehlerstromschutzschalterWallbox || ''}
                          onChange={(e) => handlePvDefaultChange('defaultFehlerstromschutzschalterWallbox', e.target.value || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Auswählen...</option>
                          {materials.filter(m => m.categoryId === 'cpCa7ZqKiQfX37GvQVQn').map(material => (
                            <option key={material.id} value={material.id}>
                              {material.name} {material.description ? ` ${material.description}` : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2">
                        <h4 className="text-lg font-semibold text-gray-800 mb-4 border-b-2 border-blue-500 pb-2">Elektro</h4>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Potentialausgleichsschiene
                        </label>
                        <select
                          value={pvDefaults.defaultPotentialausgleichsschiene || ''}
                          onChange={(e) => handlePvDefaultChange('defaultPotentialausgleichsschiene', e.target.value || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Kein Standard</option>
                          {materials.filter(m => m.categoryId === 'YUmVpnyibpJVq1Eo3Rf2').map(material => (
                            <option key={material.id} value={material.id}>
                              {material.name} {material.description ? material.description : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Hauptleitungsabzweigklemme
                        </label>
                        <select
                          value={pvDefaults.defaultHauptleitungsabzweigklemme || ''}
                          onChange={(e) => handlePvDefaultChange('defaultHauptleitungsabzweigklemme', e.target.value || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Kein Standard</option>
                          {materials.filter(m => m.categoryId === 'YUmVpnyibpJVq1Eo3Rf2').map(material => (
                            <option key={material.id} value={material.id}>
                              {material.name} {material.description ? material.description : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          RJ45-Stecker
                        </label>
                        <select
                          value={pvDefaults.defaultRJ45Stecker || ''}
                          onChange={(e) => handlePvDefaultChange('defaultRJ45Stecker', e.target.value || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Kein Standard</option>
                          {materials.filter(m => m.categoryId === 'YUmVpnyibpJVq1Eo3Rf2').map(material => (
                            <option key={material.id} value={material.id}>
                              {material.name} {material.description ? material.description : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Sammelschienenklemme
                        </label>
                        <select
                          value={pvDefaults.defaultSammelschienenklemme || ''}
                          onChange={(e) => handlePvDefaultChange('defaultSammelschienenklemme', e.target.value || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Kein Standard</option>
                          {materials.filter(m => m.categoryId === 'YUmVpnyibpJVq1Eo3Rf2').map(material => (
                            <option key={material.id} value={material.id}>
                              {material.name} {material.description ? material.description : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Abdeckstreifen
                        </label>
                        <select
                          value={pvDefaults.defaultAbdeckstreifen || ''}
                          onChange={(e) => handlePvDefaultChange('defaultAbdeckstreifen', e.target.value || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Kein Standard</option>
                          {materials.filter(m => m.categoryId === 'YUmVpnyibpJVq1Eo3Rf2').map(material => (
                            <option key={material.id} value={material.id}>
                              {material.name} {material.description ? material.description : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Kabelschuh 6xM8
                        </label>
                        <select
                          value={pvDefaults.defaultKabelschuh6M8}
                          onChange={(e) => handlePvDefaultChange('defaultKabelschuh6M8', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Kein Standard</option>
                          {materials.filter(m => m.categoryId === 'YUmVpnyibpJVq1Eo3Rf2').map(m => (
                            <option key={m.id} value={m.id}>{m.description}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Kabelschuh 10xM6
                        </label>
                        <select
                          value={pvDefaults.defaultKabelschuh10M6}
                          onChange={(e) => handlePvDefaultChange('defaultKabelschuh10M6', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Kein Standard</option>
                          {materials.filter(m => m.categoryId === 'YUmVpnyibpJVq1Eo3Rf2').map(m => (
                            <option key={m.id} value={m.id}>{m.description}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Kabelschuh 16xM6
                        </label>
                        <select
                          value={pvDefaults.defaultKabelschuh16M6}
                          onChange={(e) => handlePvDefaultChange('defaultKabelschuh16M6', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Kein Standard</option>
                          {materials.filter(m => m.categoryId === 'YUmVpnyibpJVq1Eo3Rf2').map(m => (
                            <option key={m.id} value={m.id}>{m.description}</option>
                          ))}
                        </select>
                      </div>

                   

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Aderendhülsen 10mm²
                        </label>
                        <select
                          value={pvDefaults.defaultAderendhuelsen10mm2}
                          onChange={(e) => handlePvDefaultChange('defaultAderendhuelsen10mm2', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Kein Standard</option>
                          {materials.filter(m => m.categoryId === '5psqw2EUItL72TMhfSfQ').map(m => (
                            <option key={m.id} value={m.id}>{m.description}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Aderendhülsen 16mm²
                        </label>
                        <select
                          value={pvDefaults.defaultAderendhuelsen16mm2}
                          onChange={(e) => handlePvDefaultChange('defaultAderendhuelsen16mm2', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Kein Standard</option>
                          {materials.filter(m => m.categoryId === '5psqw2EUItL72TMhfSfQ').map(m => (
                            <option key={m.id} value={m.id}>{m.description}</option>
                          ))}
                        </select>
                      </div>

            

             

                    </div>

                    
                  </div>
                )}

                {/* Berechnung Tab */}
                {pvSubTab === 'berechnung' && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="space-y-8">
                      
                   
                      <div>
                        <h4 className="text-lg font-semibold text-gray-800 mb-4 border-b-2 border-blue-500 pb-2">PV Komponenten
                        </h4>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Smart Dongle Value
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              value={pvDefaults.smartDongleValue || ''}
                              onChange={(e) => handlePvDefaultChange('smartDongleValue', parseFloat(e.target.value) || null)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                          </div>
                          

                         
                        </div>
                      </div>


                      <div>
                        <h4 className="text-lg font-semibold text-gray-800 mb-4 border-b-2 border-blue-500 pb-2">Ziegeldach</h4>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Modul-Haken Verhältnis
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              value={pvDefaults.modulHakenVerhaeltnis || ''}
                              onChange={(e) => handlePvDefaultChange('modulHakenVerhaeltnis', parseFloat(e.target.value) || null)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                          </div>

                          <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Potentialausgleich UK-UK (m)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={pvDefaults.PotentialausgleichUK || ''}
                          onChange={(e) => handlePvDefaultChange('PotentialausgleichUK', parseFloat(e.target.value) || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>

                          
      
                        </div>
                      </div>

                      
                      {/* Befestigungsmaterial */}
                      <div>
                        <h4 className="text-lg font-semibold text-gray-800 mb-4 border-b-2 border-blue-500 pb-2">Befestigungsmaterial</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              RohrschelleBefestigungsmaterial
                            </label>
                            <input
                              type="number"
                              step="1"
                              min="0"
                              value={pvDefaults.RohrschelleBefestigungsmaterial || ''}
                              onChange={(e) => handlePvDefaultChange('RohrschelleBefestigungsmaterial', parseInt(e.target.value) || null)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              BefestigungPotentialausgleich UK-UK
                            </label>
                            <input
                              type="number"
                              step="1"
                              min="0"
                              value={pvDefaults.BefestigungPotentialausgleichUKUK || ''}
                              onChange={(e) => handlePvDefaultChange('BefestigungPotentialausgleichUKUK', parseInt(e.target.value) || null)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Befestigung Leistungsoptimierer
                            </label>
                            <input
                              type="number"
                              step="1"
                              min="0"
                              value={pvDefaults.BefestigungLeistungsoptimierer || ''}
                              onChange={(e) => handlePvDefaultChange('BefestigungLeistungsoptimierer', parseInt(e.target.value) || null)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Kabelkanal Befestigungsmaterial (Schrauben/Dübel)
                            </label>
                            <input
                              type="number"
                              step="1"
                              min="0"
                              value={pvDefaults.KabelkanalBefestigungsmaterial || ''}
                              onChange={(e) => handlePvDefaultChange('KabelkanalBefestigungsmaterial', parseInt(e.target.value) || null)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              PV-Geräte Befestigungsmaterial
                            </label>
                            <input
                              type="number"
                              step="1"
                              min="0"
                              value={pvDefaults.PvGeraeteBefestigungsmaterial || ''}
                              onChange={(e) => handlePvDefaultChange('PvGeraeteBefestigungsmaterial', parseInt(e.target.value) || null)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Dämmstoffdübel
                            </label>
                            <input
                              type="number"
                              step="1"
                              min="0"
                              value={pvDefaults.Dammstoffduebel || ''}
                              onChange={(e) => handlePvDefaultChange('Dammstoffduebel', parseInt(e.target.value) || null)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Dübel Gerüstanker
                            </label>
                            <input
                              type="number"
                              step="1"
                              min="0"
                              value={pvDefaults.DuebelGeruestanker || ''}
                              onChange={(e) => handlePvDefaultChange('DuebelGeruestanker', parseInt(e.target.value) || null)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                          </div>

                          {/* Aufkleber Brandschutzzeichen Value */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Aufkleber Brandschutzzeichen (Anzahl)
                            </label>
                            <input
                              type="number"
                              step="1"
                              min="0"
                              value={pvDefaults.AufkleberBrandschutzzeichen || ''}
                              onChange={(e) => handlePvDefaultChange('AufkleberBrandschutzzeichen', parseInt(e.target.value) || null)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Rohrschelle */}
                      <div>
                        <h4 className="text-lg font-semibold text-gray-800 mb-4 border-b-2 border-blue-500 pb-2">Rohrschelle</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Rohrschelle Standard
                            </label>
                            <input
                              type="number"
                              step="1"
                              min="0"
                              value={pvDefaults.RohrschelleStandard || ''}
                              onChange={(e) => handlePvDefaultChange('RohrschelleStandard', parseInt(e.target.value) || null)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Rohrschelle Groß
                            </label>
                            <input
                              type="number"
                              step="1"
                              min="0"
                              value={pvDefaults.RohrschelleGross || ''}
                              onChange={(e) => handlePvDefaultChange('RohrschelleGross', parseInt(e.target.value) || null)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Kabelverlegung */}
                      <div>
                        <h4 className="text-lg font-semibold text-gray-800 mb-4 border-b-2 border-blue-500 pb-2">Kabelverlegung</h4>
                        <div className="grid grid-cols-2 gap-4">

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          InstallationsrohrOutdoor Wert
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={pvDefaults.InstallationsrohrOutdoor || ''}
                          onChange={(e) => handlePvDefaultChange('InstallationsrohrOutdoor', parseFloat(e.target.value) || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Kabelkanal Standard Wert
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={pvDefaults.KabelkanalStandard || ''}
                          onChange={(e) => handlePvDefaultChange('KabelkanalStandard', parseFloat(e.target.value) || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Kabelkanal Groß Wert
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={pvDefaults.KabelkanalGross || ''}
                          onChange={(e) => handlePvDefaultChange('KabelkanalGross', parseFloat(e.target.value) || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Muffe Outdoor Wert
                        </label>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={pvDefaults.MuffeOutdoor || ''}
                          onChange={(e) => handlePvDefaultChange('MuffeOutdoor', parseInt(e.target.value) || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                     
                      
                      
                      
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Flexrohr Wert
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={pvDefaults.Flexrohr || ''}
                          onChange={(e) => handlePvDefaultChange('Flexrohr', parseFloat(e.target.value) || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Installationsrohr Wert
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={pvDefaults.Installationsrohr || ''}
                          onChange={(e) => handlePvDefaultChange('Installationsrohr', parseFloat(e.target.value) || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>

                        </div>
                      </div>
                      
                      {/* Kabel */}
                      <div>
                        <h4 className="text-lg font-semibold text-gray-800 mb-4 border-b-2 border-blue-500 pb-2">Kabel</h4>
                        <div className="grid grid-cols-2 gap-4">

                      <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Kabellänge pro Gerät (m)
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="100"
                              value={pvDefaults.defaultCableLength || 10}
                              onChange={(e) => handlePvDefaultChange('defaultCableLength', parseInt(e.target.value) || 10)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                          </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          SchutzleiterPV pro Gerät (m)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={pvDefaults.SchutzleiterPV || ''}
                          onChange={(e) => handlePvDefaultChange('SchutzleiterPV', parseFloat(e.target.value) || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          ErdungHES (m)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={pvDefaults.ErdungHES || ''}
                          onChange={(e) => handlePvDefaultChange('ErdungHES', parseFloat(e.target.value) || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                          </div>   

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Potentialausgleich HES-UK (m)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={pvDefaults.PotentialausgleichHESUK || ''}
                          onChange={(e) => handlePvDefaultChange('PotentialausgleichHESUK', parseFloat(e.target.value) || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          PV-Kabel Wert (m)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={pvDefaults.PvKabel || ''}
                          onChange={(e) => handlePvDefaultChange('PvKabel', parseFloat(e.target.value) || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Kabelmanagement UK Wert
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={pvDefaults.KabelmanagementUK || ''}
                          onChange={(e) => handlePvDefaultChange('KabelmanagementUK', parseFloat(e.target.value) || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Adernleitung16mm²Blau
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={pvDefaults.Adernleitung16mm2Blau || ''}
                          onChange={(e) => handlePvDefaultChange('Adernleitung16mm2Blau', parseFloat(e.target.value) || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Adernleitung16mm²Schwarz
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={pvDefaults.Adernleitung16mm2Schwarz || ''}
                          onChange={(e) => handlePvDefaultChange('Adernleitung16mm2Schwarz', parseFloat(e.target.value) || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Adernleitung16mm²GrünGelb
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={pvDefaults.Adernleitung16mm2GruenGelb || ''}
                          onChange={(e) => handlePvDefaultChange('Adernleitung16mm2GruenGelb', parseFloat(e.target.value) || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Adernleitung10mm²Blau
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={pvDefaults.Adernleitung10mm2Blau || ''}
                          onChange={(e) => handlePvDefaultChange('Adernleitung10mm2Blau', parseFloat(e.target.value) || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Adernleitung10mm²Schwarz
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={pvDefaults.Adernleitung10mm2Schwarz || ''}
                          onChange={(e) => handlePvDefaultChange('Adernleitung10mm2Schwarz', parseFloat(e.target.value) || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Adernleitung10mm²GrünGelb
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={pvDefaults.Adernleitung10mm2GruenGelb || ''}
                          onChange={(e) => handlePvDefaultChange('Adernleitung10mm2GruenGelb', parseFloat(e.target.value) || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              ErdungStaberder Value
                            </label>
                            <input
                              type="number"
                              step="1"
                              min="1"
                              value={pvDefaults.defaultErdungStaberderValue || 1}
                              onChange={(e) => handlePvDefaultChange('defaultErdungStaberderValue', parseInt(e.target.value) || 1)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                          </div>   
                          
                            

                      <div className="col-span-2">

                           {/* PV System Grundwerte */}

                      <div>
                        <h4 className="text-lg font-semibold text-gray-800 mb-4 border-b-2 border-blue-500 pb-2">Strombelastbarkeit Werte</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Strombelastbarkeit 1,5mm² (A)
                            </label>
                            <input
                              type="number"
                              value={pvDefaults.strombelastbarkeit15 || ''}
                              onChange={(e) => handlePvDefaultChange('strombelastbarkeit15', parseInt(e.target.value) || 0)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              min="1"
                              max="100"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Strombelastbarkeit 2,5mm² (A)
                            </label>
                            <input
                              type="number"
                              value={pvDefaults.strombelastbarkeit25 || ''}
                              onChange={(e) => handlePvDefaultChange('strombelastbarkeit25', parseInt(e.target.value) || 0)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              min="1"
                              max="100"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Strombelastbarkeit 4mm² (A)
                            </label>
                            <input
                              type="number"
                              value={pvDefaults.strombelastbarkeit4 || ''}
                              onChange={(e) => handlePvDefaultChange('strombelastbarkeit4', parseInt(e.target.value) || 0)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              min="1"
                              max="100"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Strombelastbarkeit 6mm² (A)
                            </label>
                            <input
                              type="number"
                              value={pvDefaults.strombelastbarkeit6 || ''}
                              onChange={(e) => handlePvDefaultChange('strombelastbarkeit6', parseInt(e.target.value) || 0)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              min="1"
                              max="100"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Strombelastbarkeit 10mm² (A)
                            </label>
                            <input
                              type="number"
                              value={pvDefaults.strombelastbarkeit10 || ''}
                              onChange={(e) => handlePvDefaultChange('strombelastbarkeit10', parseInt(e.target.value) || 0)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              min="1"
                              max="100"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Strombelastbarkeit 16mm² (A)
                            </label>
                            <input
                              type="number"
                              value={pvDefaults.strombelastbarkeit16 || ''}
                              onChange={(e) => handlePvDefaultChange('strombelastbarkeit16', parseInt(e.target.value) || 0)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              min="1"
                              max="100"
                            />
                          </div>
                        </div>
                      </div>

                        <h4 className="text-lg font-semibold text-gray-800 mb-4 border-b-2 border-blue-500 pb-2">Elektro</h4>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Aderendhülsen pro Gerät
                        </label>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={pvDefaults.AderendhuelsenProGeraet || ''}
                          onChange={(e) => handlePvDefaultChange('AderendhuelsenProGeraet', parseInt(e.target.value) || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Kabelschuh 6xM8 Anzahl
                        </label>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={pvDefaults.Kabelschuh6M8 || ''}
                          onChange={(e) => handlePvDefaultChange('Kabelschuh6M8', parseInt(e.target.value) || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Kabelschuh 10xM6 pro Gerät
                        </label>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={pvDefaults.Kabelschuh10M6 || ''}
                          onChange={(e) => handlePvDefaultChange('Kabelschuh10M6', parseInt(e.target.value) || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Kabelschuh 16xM6 pro Notstromlösung
                        </label>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={pvDefaults.Kabelschuh16M6 || ''}
                          onChange={(e) => handlePvDefaultChange('Kabelschuh16M6', parseInt(e.target.value) || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Potentialausgleichsschiene
                        </label>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={pvDefaults.Potentialausgleichsschiene || ''}
                          onChange={(e) => handlePvDefaultChange('Potentialausgleichsschiene', parseInt(e.target.value) || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Hauptleitungsabzweigklemme
                        </label>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={pvDefaults.Hauptleitungsabzweigklemme || ''}
                          onChange={(e) => handlePvDefaultChange('Hauptleitungsabzweigklemme', parseInt(e.target.value) || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          RJ45-Stecker
                        </label>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={pvDefaults.RJ45Stecker || ''}
                          onChange={(e) => handlePvDefaultChange('RJ45Stecker', parseInt(e.target.value) || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Sammelschienenklemme
                        </label>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={pvDefaults.Sammelschienenklemme || ''}
                          onChange={(e) => handlePvDefaultChange('Sammelschienenklemme', parseInt(e.target.value) || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Abdeckstreifen
                        </label>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={pvDefaults.Abdeckstreifen || ''}
                          onChange={(e) => handlePvDefaultChange('Abdeckstreifen', parseInt(e.target.value) || null)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={handleSavePvDefaults}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>PV-Standardeinstellungen speichern</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'categories' && (
            <BasePage
              title="Kategorien & Spezifikationen"
              headerActions={
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Kategorien oder Spezifikationen suchen..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent w-64"
                    />
                  </div>
                  <button
                    onClick={() => setShowIds(!showIds)}
                    className={`px-4 py-2 rounded-lg flex items-center transition-colors ${
                      showIds 
                        ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                        : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    <Database className="h-4 w-4 mr-2" />
                    {showIds ? 'IDs ausblenden' : 'IDs anzeigen'}
                  </button>
                  <button
                    onClick={() => setIsAddCategoryModalOpen(true)}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Neue Kategorie
                  </button>
                </div>
              }
              maxHeight="max-h-[60vh]"
            >

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">Lade Kategorien...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {categories
                    .filter(category => {
                      if (!searchTerm) return true;
                      const searchLower = searchTerm.toLowerCase();
                      
                      // Suche in Kategoriename
                      if (category.name.toLowerCase().includes(searchLower)) {
                        return true;
                      }
                      
                      // Suche in Spezifikationen dieser Kategorie
                      const categorySpecs = specifications[category.id] || [];
                      return categorySpecs.some(spec => 
                        spec.name.toLowerCase().includes(searchLower) ||
                        (spec.unit && spec.unit.toLowerCase().includes(searchLower))
                      );
                    })
                    .map((category) => (
                    <div key={category.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="text-md font-medium text-gray-900">{category.name}</h4>
                          {showIds && (
                            <p className="text-xs text-gray-500 font-mono mt-1">ID: {category.id}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditCategory(category)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        <strong>Spezifikationen:</strong>
                        {specifications[category.id] && specifications[category.id].length > 0 ? (
                          <ul className="mt-2 space-y-1">
                            {specifications[category.id].map((spec, index) => (
                              <li key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                                <span>
                                  <strong>{spec.name}</strong>
                                  {spec.unit && ` (${spec.unit})`}
                                  {showIds && (
                                    <span className="block text-xs text-gray-500 font-mono mt-1">ID: {spec.id}</span>
                                  )}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-2 text-gray-500 italic">Keine Spezifikationen definiert</p>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {categories.length === 0 && (
                    <div className="text-center py-8">
                      <Package className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Kategorien</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Erstellen Sie Ihre erste Kategorie mit spezifischen Feldern.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </BasePage>
          )}


        </div>
      </div>

      {/* Add Category Modal */}
      <BaseModal
        isOpen={isAddCategoryModalOpen}
        onClose={() => {
          setIsAddCategoryModalOpen(false);
          setEditingCategory(null);
          setNewCategoryName('');
          setCategorySpecs([]);
        }}
        title={editingCategory ? 'Kategorie bearbeiten' : 'Neue Kategorie hinzufügen'}
        icon={Package}
        footerButtons={
          <>
            <button
              onClick={() => {
                setIsAddCategoryModalOpen(false);
                setNewCategoryName('');
                setCategorySpecs([]);
              }}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Abbrechen
            </button>
            <button
              onClick={editingCategory ? handleUpdateCategory : handleAddCategory}
              disabled={!newCategoryName.trim()}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{editingCategory ? 'Kategorie aktualisieren' : 'Kategorie erstellen'}</span>
            </button>
          </>
        }
      >

        <div className="space-y-6">
                {/* Kategoriename */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kategoriename *
                  </label>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="z.B. Module, Wechselrichter, Kabel..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {/* Spezifikationen */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Spezifikationen für diese Kategorie
                    </label>
                    <button
                      onClick={handleAddSpecification}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Spezifikation hinzufügen
                    </button>
                  </div>

                  <div className="space-y-4">
                    {categorySpecs.map((spec, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-medium text-gray-900">Spezifikation #{index + 1}</h4>
                          <button
                            onClick={() => handleRemoveSpecification(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Feldname *
                            </label>
                            <input
                              type="text"
                              value={spec.name}
                              onChange={(e) => handleUpdateSpecification(index, 'name', e.target.value)}
                              placeholder="z.B. Leistung, Spannung, Abmessungen"
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-primary-500 focus:border-transparent"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Einheit (optional)
                            </label>
                            <input
                              type="text"
                              value={spec.unit}
                              onChange={(e) => handleUpdateSpecification(index, 'unit', e.target.value)}
                              placeholder="z.B. W, V, mm, kg"
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-primary-500 focus:border-transparent"
                            />
                          </div>
                          

                        </div>
                      </div>
                    ))}
                    
                    {categorySpecs.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <p className="text-sm">Noch keine Spezifikationen definiert.</p>
                        <p className="text-xs mt-1">Klicken Sie auf "Spezifikation hinzufügen" um zu beginnen.</p>
                      </div>
                    )}
                  </div>
                </div>
        </div>
      </BaseModal>
    </div>
  );
};

export default Settings;
