import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

const SetupChecker: React.FC = () => {
  const [firebaseStatus, setFirebaseStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [designCount, setDesignCount] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    checkFirebaseConnection();
  }, []);

  const checkFirebaseConnection = async () => {
    try {
      setFirebaseStatus('checking');
      
      // Test Firestore connection by fetching designs
      const designsQuery = collection(db, 'designs');
      const querySnapshot = await getDocs(designsQuery);
      
      setDesignCount(querySnapshot.size);
      setFirebaseStatus('connected');
    } catch (err) {
      console.error('Firebase connection error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setFirebaseStatus('error');
    }
  };

  if (firebaseStatus === 'checking') {
    return (
      <div className="fixed top-4 right-4 z-50 animate-fade-in">
        <div className="card p-4 max-w-xs shadow-medium">
          <div className="flex items-center space-x-3">
            <div className="loading-spinner w-4 h-4"></div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Checking Connection</p>
              <p className="text-xs text-gray-500">Verifying Firebase setup...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (firebaseStatus === 'error') {
    return (
      <div className="fixed top-4 right-4 z-50 animate-fade-in">
        <div className="alert alert-error max-w-xs shadow-medium">
          <div className="flex items-start space-x-3">
            <div className="w-4 h-4 bg-error-500 rounded-full flex-shrink-0 mt-0.5"></div>
            <div>
              <p className="text-sm font-semibold text-error-800">Connection Error</p>
              <p className="text-xs text-error-600 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-50 animate-fade-in">
      <div className="alert alert-success max-w-xs shadow-medium">
        <div className="flex items-center space-x-3">
          <div className="w-4 h-4 bg-success-500 rounded-full"></div>
          <div>
            <p className="text-sm font-semibold text-success-800">System Ready</p>
            <p className="text-xs text-success-600">
              {designCount} design{designCount !== 1 ? 's' : ''} available
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupChecker;