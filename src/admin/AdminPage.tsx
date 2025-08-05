import React, { useState, useEffect } from 'react';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, updateDoc } from 'firebase/firestore';
import { storage, db } from '../firebase/config';
import UserAnalytics from './UserAnalytics';
import DesignAnalytics from './DesignAnalytics';

interface Design {
  id: string;
  name: string;
  imageUrl: string;
  filename: string;
  uploadedAt: string;
}

interface Response {
  id: string;
  userData: {
    name: string;
    age: number;
    gender: string;
    contact?: string;
  };
  ratings: {
    [designId: string]: {
      designQuality: number;
      buyIntention: number;
    };
  };
  submittedAt: string;
}

type TabType = 'designs' | 'users' | 'design-analytics';

const AdminPage: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [designName, setDesignName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingFile, setEditingFile] = useState<File | null>(null);
  const [updating, setUpdating] = useState(false);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('designs');

  const ADMIN_PASSWORD = '9252025';

  useEffect(() => {
    if (isAuthenticated) {
      fetchDesigns();
      fetchResponses();
    }
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setMessage(null);
    } else {
      setMessage({ type: 'error', text: 'Invalid password' });
    }
  };

  const fetchDesigns = async () => {
    setLoading(true);
    try {
      const designsQuery = query(collection(db, 'designs'), orderBy('name'));
      const querySnapshot = await getDocs(designsQuery);
      
      const designsData: Design[] = [];
      querySnapshot.forEach((doc) => {
        designsData.push({
          id: doc.id,
          name: doc.data().name,
          imageUrl: doc.data().imageUrl,
          filename: doc.data().filename,
          uploadedAt: doc.data().uploadedAt
        });
      });
      
      setDesigns(designsData);
    } catch (error) {
      console.error('Error fetching designs:', error);
      setMessage({ type: 'error', text: 'Failed to fetch designs' });
    } finally {
      setLoading(false);
    }
  };

  const fetchResponses = async () => {
    setLoadingResponses(true);
    try {
      const responsesQuery = query(collection(db, 'responses'), orderBy('submittedAt', 'desc'));
      const querySnapshot = await getDocs(responsesQuery);
      
      const responsesData: Response[] = [];
      querySnapshot.forEach((doc) => {
        responsesData.push({
          id: doc.id,
          ...doc.data()
        } as Response);
      });
      
      setResponses(responsesData);
    } catch (error) {
      console.error('Error fetching responses:', error);
      setMessage({ type: 'error', text: 'Failed to fetch responses' });
    } finally {
      setLoadingResponses(false);
    }
  };

  const handleDeleteDesign = async (design: Design) => {
    if (!confirm(`Are you sure you want to delete "${design.name}"? This action cannot be undone.`)) {
      return;
    }

    setDeleting(design.id);
    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'designs', design.id));
      
      // Delete from Storage
      if (design.filename) {
        const storageRef = ref(storage, design.filename);
        await deleteObject(storageRef);
      }
      
      // Update local state
      setDesigns(prev => prev.filter(d => d.id !== design.id));
      setMessage({ type: 'success', text: `Design "${design.name}" deleted successfully` });
    } catch (error) {
      console.error('Error deleting design:', error);
      setMessage({ type: 'error', text: 'Failed to delete design' });
    } finally {
      setDeleting(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log('File selected:', file);
    
    if (file) {
      console.log('File details:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      });
      
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
        setMessage(null);
        console.log('Valid image file selected');
      } else {
        console.log('Invalid file type:', file.type);
        setMessage({ type: 'error', text: 'Please select an image file' });
      }
    } else {
      console.log('No file selected');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile || !designName.trim()) {
      setMessage({ type: 'error', text: 'Please provide both a design name and an image file' });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      console.log('Starting upload process...');
      console.log('File:', selectedFile);
      console.log('Design name:', designName);

      // Create a unique filename
      const timestamp = Date.now();
      const filename = `designs/${timestamp}_${selectedFile.name}`;
      console.log('Generated filename:', filename);
      
      // Upload file to Firebase Storage
      console.log('Uploading to Firebase Storage...');
      const storageRef = ref(storage, filename);
      const snapshot = await uploadBytes(storageRef, selectedFile);
      console.log('Upload successful, snapshot:', snapshot);
      
      // Get the download URL
      console.log('Getting download URL...');
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('Download URL:', downloadURL);
      
      // Save design document to Firestore
      console.log('Saving to Firestore...');
      const docData = {
        name: designName.trim(),
        imageUrl: downloadURL,
        filename: filename,
        uploadedAt: new Date().toISOString()
      };
      console.log('Document data:', docData);
      
      await addDoc(collection(db, 'designs'), docData);
      console.log('Firestore save successful');

      setMessage({ type: 'success', text: 'Design uploaded successfully!' });
      setSelectedFile(null);
      setDesignName('');
      
      // Reset the file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }

      // Refresh the designs list
      fetchDesigns();
    } catch (error) {
      console.error('Error uploading design:', error);
      setMessage({ 
        type: 'error', 
        text: `Failed to upload design: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword('');
    setSelectedFile(null);
    setDesignName('');
    setMessage(null);
  };

  const handleEditDesign = (design: Design) => {
    setEditing(design.id);
    setEditingName(design.name);
    setEditingFile(null);
    setMessage(null);
  };

  const handleCancelEdit = () => {
    setEditing(null);
    setEditingName('');
    setEditingFile(null);
    setMessage(null);
  };

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (file) {
      if (file.type.startsWith('image/')) {
        setEditingFile(file);
        setMessage(null);
      } else {
        setMessage({ type: 'error', text: 'Please select an image file' });
      }
    }
  };

  const handleUpdateDesign = async (design: Design) => {
    if (!editingName.trim()) {
      setMessage({ type: 'error', text: 'Please provide a design name' });
      return;
    }

    setUpdating(true);
    setMessage(null);

    try {
      const updateData: any = {
        name: editingName.trim()
      };

      // If a new image is selected, upload it first
      if (editingFile) {
        // Delete old image if it exists
        if (design.filename) {
          try {
            const oldStorageRef = ref(storage, design.filename);
            await deleteObject(oldStorageRef);
          } catch (error) {
            console.log('Old image not found or already deleted');
          }
        }

        // Upload new image
        const timestamp = Date.now();
        const filename = `designs/${timestamp}_${editingFile.name}`;
        const storageRef = ref(storage, filename);
        const snapshot = await uploadBytes(storageRef, editingFile);
        const downloadURL = await getDownloadURL(snapshot.ref);

        updateData.imageUrl = downloadURL;
        updateData.filename = filename;
      }

      // Update the design document in Firestore
      await updateDoc(doc(db, 'designs', design.id), updateData);

      setMessage({ type: 'success', text: 'Design updated successfully!' });
      handleCancelEdit();
      fetchDesigns(); // Refresh the designs list
    } catch (error) {
      console.error('Error updating design:', error);
      setMessage({ 
        type: 'error', 
        text: `Failed to update design: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    } finally {
      setUpdating(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full card-elevated p-8 animate-fade-in">
          <div className="text-center mb-8">
            <div className="avatar avatar-lg avatar-primary mx-auto mb-6">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-display-sm text-gray-900 mb-2">Admin Access</h1>
            <p className="text-body text-gray-600">Enter your admin credentials to continue</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="password" className="label">
                Admin Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="Enter admin password"
                required
              />
            </div>

            {message && (
              <div className={`alert ${message.type === 'error' ? 'alert-error' : 'alert-success'}`}>
                <div className="flex items-center">
                  <svg className={`w-5 h-5 mr-3 ${message.type === 'error' ? 'text-error-500' : 'text-success-500'}`} fill="currentColor" viewBox="0 0 20 20">
                    {message.type === 'error' ? (
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    ) : (
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    )}
                  </svg>
                  <span className="font-medium">{message.text}</span>
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary w-full btn-lg">
              <span>Login to Admin Panel</span>
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:py-12 sm:px-6 lg:py-16 lg:px-8">
      <div className="container-app">
        {/* Header */}
        <div className="card-elevated p-8 mb-8 animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="flex items-center space-x-6 mb-6 sm:mb-0">
              <div className="avatar avatar-xl avatar-primary">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-display-md text-gray-900">Admin Dashboard</h1>
                <p className="text-body text-gray-600">Design management & analytics</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <div className="text-3xl font-bold text-primary-600">{designs.length}</div>
                <div className="text-sm text-gray-600">Total Designs</div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-green-600">{responses.length}</div>
                <div className="text-sm text-gray-600">Total Responses</div>
              </div>
              <button onClick={handleLogout} className="btn btn-outline">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="card-elevated p-2 mb-8">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('designs')}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'designs'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Designs</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'users'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <span>Users</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('design-analytics')}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'design-analytics'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Design Analytics</span>
              </div>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'designs' && (
          <>
            {/* Upload Form */}
            <div className="card-elevated p-8 mb-8 animate-slide-up">
              <div className="mb-8">
                <h2 className="text-display-sm text-gray-900 mb-3">Upload New Design</h2>
                <p className="text-body text-gray-600">Add a new design for user evaluation</p>
              </div>

              <form onSubmit={handleUpload} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Design Name */}
                  <div>
                    <label htmlFor="design-name" className="label">
                      Design Name <span className="text-error-600">*</span>
                    </label>
                    <input
                      type="text"
                      id="design-name"
                      value={designName}
                      onChange={(e) => setDesignName(e.target.value)}
                      className="input"
                      placeholder="Enter design name"
                      required
                    />
                  </div>

                  {/* File Upload */}
                  <div>
                    <label htmlFor="file-input" className="label">
                      Design Image <span className="text-error-600">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        id="file-input"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        required
                      />
                      <div className="border-2 border-dashed border-gray-300 rounded-xl px-8 py-12 text-center hover:border-primary-400 transition-colors cursor-pointer">
                        <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-lg font-semibold text-gray-900 mb-2">
                          {selectedFile ? selectedFile.name : "Click to upload image"}
                        </p>
                        <p className="text-caption text-gray-500">
                          JPG, PNG, GIF, WebP up to 10MB
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Image Preview */}
                {selectedFile && (
                  <div className="card p-6 bg-gray-50">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
                    <div className="relative rounded-xl overflow-hidden shadow-medium">
                      <img
                        src={URL.createObjectURL(selectedFile)}
                        alt="Design preview"
                        className="w-full max-w-lg mx-auto h-64 object-contain bg-gray-100"
                      />
                    </div>
                  </div>
                )}

                {/* Message */}
                {message && (
                  <div className={`alert ${message.type === 'error' ? 'alert-error' : 'alert-success'}`}>
                    <div className="flex items-center">
                      <svg className={`w-5 h-5 mr-3 ${message.type === 'error' ? 'text-error-500' : 'text-success-500'}`} fill="currentColor" viewBox="0 0 20 20">
                        {message.type === 'error' ? (
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        ) : (
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        )}
                      </svg>
                      <span className="font-medium">{message.text}</span>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={uploading || !selectedFile || !designName.trim()}
                    className={`btn ${
                      uploading || !selectedFile || !designName.trim()
                        ? 'btn-secondary opacity-50 cursor-not-allowed'
                        : 'btn-primary'
                    } btn-lg flex items-center space-x-2`}
                  >
                    {uploading ? (
                      <>
                        <div className="loading-spinner w-5 h-5 mr-2"></div>
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <span>Upload Design</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Design Management */}
            <div className="card-elevated p-8 animate-slide-up">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-display-sm text-gray-900 mb-2">Design Gallery</h2>
                  <p className="text-body text-gray-600">
                    {designs.length} design{designs.length !== 1 ? 's' : ''} uploaded
                  </p>
                </div>
                <button
                  onClick={fetchDesigns}
                  disabled={loading}
                  className="btn btn-outline disabled:opacity-50"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {loading ? 'Loading...' : 'Refresh'}
                </button>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="loading-spinner w-12 h-12 mb-6"></div>
                  <p className="text-lg text-gray-600">Loading designs...</p>
                </div>
              ) : designs.length === 0 ? (
                <div className="text-center py-16">
                  <div className="avatar avatar-xl bg-gray-100 mx-auto mb-6">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">No designs yet</h3>
                  <p className="text-body text-gray-600">Upload your first design above to get started</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {designs.map((design) => (
                    <div key={design.id} className="card-interactive p-6 group">
                      {editing === design.id ? (
                        // Edit Mode
                        <div className="space-y-4">
                          <div className="relative overflow-hidden rounded-xl mb-4">
                            <img
                              src={editingFile ? URL.createObjectURL(editingFile) : design.imageUrl}
                              alt={design.name}
                              className="w-full h-48 object-contain bg-gray-100"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'https://via.placeholder.com/300x200/f3f4f6/9ca3af?text=Design+Image';
                              }}
                            />
                          </div>
                          
                          <div className="space-y-4">
                            <div>
                              <label className="label text-sm">Design Name</label>
                              <input
                                type="text"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                className="input text-sm"
                                placeholder="Enter design name"
                              />
                            </div>
                            
                            <div>
                              <label className="label text-sm">Update Image (Optional)</label>
                              <div className="relative">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleEditFileChange}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div className="border-2 border-dashed border-gray-300 rounded-lg px-4 py-3 text-center hover:border-primary-400 transition-colors cursor-pointer">
                                  <p className="text-sm font-medium text-gray-900">
                                    {editingFile ? editingFile.name : "Click to change image"}
                                  </p>
                                  <p className="text-xs text-gray-500">JPG, PNG, GIF, WebP</p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleUpdateDesign(design)}
                                disabled={updating || !editingName.trim()}
                                className={`btn flex-1 ${
                                  updating || !editingName.trim()
                                    ? 'btn-secondary opacity-50 cursor-not-allowed'
                                    : 'btn-primary'
                                }`}
                              >
                                {updating ? (
                                  <>
                                    <div className="loading-spinner w-4 h-4 mr-2"></div>
                                    <span>Updating...</span>
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span>Save</span>
                                  </>
                                )}
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                disabled={updating}
                                className="btn btn-outline flex-1"
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                <span>Cancel</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        // View Mode
                        <>
                          <div className="relative overflow-hidden rounded-xl mb-4">
                            <img
                              src={design.imageUrl}
                              alt={design.name}
                              className="w-full h-48 object-contain bg-gray-100 group-hover:scale-105 transition-transform duration-200"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'https://via.placeholder.com/300x200/f3f4f6/9ca3af?text=Design+Image';
                              }}
                            />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-2 truncate" title={design.name}>
                              {design.name}
                            </h3>
                            <p className="text-caption text-gray-500 mb-4">
                              {new Date(design.uploadedAt).toLocaleDateString()}
                            </p>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditDesign(design)}
                                className="btn btn-primary flex-1"
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteDesign(design)}
                                disabled={deleting === design.id}
                                className={`btn ${
                                  deleting === design.id
                                    ? 'btn-secondary opacity-50 cursor-not-allowed'
                                    : 'btn-error'
                                }`}
                              >
                                {deleting === design.id ? (
                                  <>
                                    <div className="loading-spinner w-4 h-4 mr-2"></div>
                                    <span>Deleting...</span>
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    <span>Delete</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'users' && (
          <UserAnalytics 
            responses={responses} 
            designs={designs}
            loading={loadingResponses}
            onRefresh={fetchResponses}
          />
        )}

        {activeTab === 'design-analytics' && (
          <DesignAnalytics 
            responses={responses} 
            designs={designs}
            loading={loadingResponses}
            onRefresh={fetchResponses}
          />
        )}
      </div>
    </div>
  );
};

export default AdminPage;
