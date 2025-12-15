import React from 'react';
import { Settings, Package, Car, Shield, Trash2 } from 'lucide-react';
import { formatDateTime } from '../../utils';

const PVConfigurationSection = ({
  configurations,
  loading,
  deletingConfigId,
  onDeleteConfiguration
}) => {
  if (configurations.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
        PV-Konfigurationen ({configurations.length})
      </h3>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Lade Konfigurationen...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {configurations.map((configWrapper, index) => {
            const config = configWrapper.pvConfiguration || configWrapper;
            const configId = configWrapper.id;

            return (
              <div key={index} className="bg-white border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Settings className="h-5 w-5 text-yellow-500" />
                    <span className="text-lg font-medium text-gray-900">PV-Konfiguration</span>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      v{config.configurationVersion || '1.0'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      {formatDateTime(configWrapper.createdAt || config.timestamp)}
                    </span>
                    <button
                      onClick={() => onDeleteConfiguration(configId)}
                      disabled={deletingConfigId === configId}
                      className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded disabled:opacity-50"
                      title="Konfiguration löschen"
                    >
                      {deletingConfigId === configId ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Wechselrichter */}
                {config.inverters?.length > 0 && (
                  <ConfigSection title="Wechselrichter" icon={Settings}>
                    {config.inverters.map((inv, idx) => (
                      <div key={idx} className="bg-gray-50 rounded p-3">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-gray-900">{inv.description}</span>
                          <span className="text-sm text-gray-600">{inv.quantity}x</span>
                        </div>

                        {(inv.recommendedBreaker || inv.recommendedCable) && (
                          <RecommendedComponents
                            breaker={inv.recommendedBreaker}
                            cable={inv.recommendedCable}
                          />
                        )}

                        {inv.strings?.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-xs font-medium text-gray-600">Strings:</span>
                            {inv.strings.map((s, si) => (
                              <div key={si} className="text-xs text-gray-600 ml-2">
                                {s.stringName}: {s.moduleCount}x {s.moduleDescription}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </ConfigSection>
                )}

                {/* Module */}
                {config.modules && (
                  <ConfigSection title="Module" icon={Package}>
                    <div className="bg-gray-50 rounded p-3">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900">{config.modules.description}</span>
                        <span className="text-sm text-gray-600">{config.modules.totalQuantity}x</span>
                      </div>
                    </div>
                  </ConfigSection>
                )}

                {/* Wallbox */}
                {config.wallbox && (
                  <ConfigSection title="Wallbox" icon={Car}>
                    <div className="bg-gray-50 rounded p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-900">{config.wallbox.description}</span>
                        <span className="text-sm text-gray-600">{config.wallbox.quantity}x</span>
                      </div>
                      {(config.wallbox.recommendedBreaker || config.wallbox.recommendedCable || config.wallbox.recommendedRCD) && (
                        <RecommendedComponents
                          breaker={config.wallbox.recommendedBreaker}
                          cable={config.wallbox.recommendedCable}
                          rcd={config.wallbox.recommendedRCD}
                        />
                      )}
                    </div>
                  </ConfigSection>
                )}

                {/* Notstromlösungen */}
                {config.backupSolutions && (
                  <ConfigSection title="Notstromlösungen" icon={Shield}>
                    <div className="bg-gray-50 rounded p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-900">{config.backupSolutions.description}</span>
                        <span className="text-sm text-gray-600">{config.backupSolutions.quantity}x</span>
                      </div>
                      {(config.backupSolutions.recommendedBreaker || config.backupSolutions.recommendedCable) && (
                        <RecommendedComponents
                          breaker={config.backupSolutions.recommendedBreaker}
                          cable={config.backupSolutions.recommendedCable}
                        />
                      )}
                    </div>
                  </ConfigSection>
                )}

                {/* PV-Kabel */}
                {config.pvCables && (
                  <ConfigSection title="PV-Kabel" icon={Package}>
                    <div className="bg-gray-50 rounded p-3">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900">{config.pvCables.description}</span>
                        <span className="text-sm text-gray-600">{config.pvCables.quantity}m</span>
                      </div>
                    </div>
                  </ConfigSection>
                )}

                {/* Potentialausgleich HES-UK */}
                {config.potentialausgleichHESUK && (
                  <ConfigSection title="Potentialausgleich HES-UK" icon={Settings}>
                    <div className="bg-gray-50 rounded p-3">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900">{config.potentialausgleichHESUK.description}</span>
                        <span className="text-sm text-gray-600">{config.potentialausgleichHESUK.quantity}m</span>
                      </div>
                    </div>
                  </ConfigSection>
                )}

                {/* Generatoranschlusskasten */}
                {config.generatoranschlusskasten && (
                  <ConfigSection title="Generatoranschlusskasten" icon={Settings}>
                    <div className="bg-gray-50 rounded p-3">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900">{config.generatoranschlusskasten.description}</span>
                        <span className="text-sm text-gray-600">{config.generatoranschlusskasten.quantity}x</span>
                      </div>
                    </div>
                  </ConfigSection>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Helper component for config sections
const ConfigSection = ({ title, icon: Icon, children }) => (
  <div className="mb-4">
    <div className="flex items-center space-x-2 mb-2">
      <Icon className="h-4 w-4 text-gray-400" />
      <span className="text-sm font-medium text-gray-700">{title}</span>
    </div>
    <div className="ml-6 space-y-2">{children}</div>
  </div>
);

// Helper component for recommended components
const RecommendedComponents = ({ breaker, cable, rcd }) => (
  <div className="p-2 bg-blue-50 rounded">
    <span className="text-xs font-medium text-blue-800">Empfohlene Komponenten:</span>
    <div className="text-xs text-blue-700 mt-1 space-y-1">
      {breaker && <div>• Leitungsschutzschalter: {breaker}</div>}
      {cable && <div>• Mantelleitung: {cable}</div>}
      {rcd && <div>• FI-Schutzschalter: {rcd}</div>}
    </div>
  </div>
);

export default PVConfigurationSection;
