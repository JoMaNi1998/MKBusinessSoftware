import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { Shield, CheckCircle, AlertCircle, Loader } from 'lucide-react';

const AdminSetup = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const { user } = useAuth();

  const setupFirstAdmin = async () => {
    if (!user) {
      setMessage('Sie müssen angemeldet sein, um Admin zu werden.');
      setSuccess(false);
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // Firebase Function aufrufen
      const setupAdmin = httpsCallable(functions, 'setupFirstAdmin');
      const result = await setupAdmin();
      
      setMessage(result.data.message);
      setSuccess(true);
      
      // Nach 3 Sekunden Seite neu laden, damit die neuen Claims geladen werden
      setTimeout(() => {
        window.location.reload();
      }, 3000);
      
    } catch (error) {
      console.error('Fehler beim Admin-Setup:', error);
      setMessage(error.message || 'Fehler beim Einrichten des Admins');
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="text-center mb-6">
          <Shield className="mx-auto h-12 w-12 text-blue-600 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Admin einrichten
          </h2>
          <p className="text-gray-600">
            Richten Sie sich als ersten Administrator ein
          </p>
        </div>

        {user && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Angemeldet als:</strong> {user.email}
            </p>
          </div>
        )}

        {message && (
          <div className={`mb-4 p-4 rounded-lg flex items-center ${
            success 
              ? 'bg-green-50 text-green-800' 
              : 'bg-red-50 text-red-800'
          }`}>
            {success ? (
              <CheckCircle className="h-5 w-5 mr-2" />
            ) : (
              <AlertCircle className="h-5 w-5 mr-2" />
            )}
            {message}
          </div>
        )}

        <button
          onClick={setupFirstAdmin}
          disabled={loading || !user}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
            loading || !user
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <Loader className="animate-spin h-5 w-5 mr-2" />
              Admin wird eingerichtet...
            </div>
          ) : (
            'Als Admin einrichten'
          )}
        </button>

        <div className="mt-6 text-sm text-gray-500">
          <p className="mb-2">
            <strong>Was passiert:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Sie erhalten Admin-Berechtigung</li>
            <li>Vollzugriff auf alle Module</li>
            <li>Können weitere Benutzer verwalten</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminSetup;
