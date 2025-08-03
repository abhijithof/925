import React, { useState } from 'react';
import { writeBatch, doc } from 'firebase/firestore';
import { db } from '../firebase/config';

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

interface DesignAnalyticsProps {
  responses: Response[];
  designs: Design[];
  loading: boolean;
  onRefresh: () => void;
}

interface SortConfig {
  key: 'designName' | 'avgQuality' | 'avgPurchase' | 'totalRatings' | 'uploadedAt';
  direction: 'asc' | 'desc';
}

const DesignAnalytics: React.FC<DesignAnalyticsProps> = ({ responses, designs, loading, onRefresh }) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'avgQuality', direction: 'desc' });
  const [filterDesign, setFilterDesign] = useState('');
  const [filterRating, setFilterRating] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetPassword, setResetPassword] = useState('');

  const ADMIN_PASSWORD = '9252025';

  const handleSort = (key: SortConfig['key']) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleResetResponses = async () => {
    if (resetPassword !== ADMIN_PASSWORD) {
      alert('Invalid admin password');
      return;
    }

    if (!confirm('Are you sure you want to delete ALL responses? This action cannot be undone.')) {
      return;
    }

    try {
      const batch = writeBatch(db);
      
      responses.forEach(response => {
        const docRef = doc(db, 'responses', response.id);
        batch.delete(docRef);
      });

      await batch.commit();
      alert('All responses have been deleted successfully');
      setShowResetModal(false);
      setResetPassword('');
      onRefresh();
    } catch (error) {
      console.error('Error deleting responses:', error);
      alert('Failed to delete responses');
    }
  };

  const calculateDesignStats = (designId: string) => {
    const designRatings = responses
      .flatMap(response => Object.entries(response.ratings))
      .filter(([id]) => id === designId)
      .map(([, rating]) => rating);

    if (designRatings.length === 0) {
      return {
        avgQuality: 0,
        avgPurchase: 0,
        totalRatings: 0,
        qualityDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        purchaseDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }

    const avgQuality = designRatings.reduce((sum, rating) => sum + rating.designQuality, 0) / designRatings.length;
    const avgPurchase = designRatings.reduce((sum, rating) => sum + rating.buyIntention, 0) / designRatings.length;

    const qualityDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const purchaseDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    designRatings.forEach(rating => {
      qualityDistribution[rating.designQuality as 1 | 2 | 3 | 4 | 5]++;
      purchaseDistribution[rating.buyIntention as 1 | 2 | 3 | 4 | 5]++;
    });

    return {
      avgQuality: avgQuality.toFixed(1),
      avgPurchase: avgPurchase.toFixed(1),
      totalRatings: designRatings.length,
      qualityDistribution,
      purchaseDistribution
    };
  };

  const getFilteredAndSortedDesigns = () => {
    let designStats = designs.map(design => {
      const stats = calculateDesignStats(design.id);
      return {
        ...design,
        stats
      };
    });

    // Apply filters
    designStats = designStats.filter(design => {
      const designMatch = !filterDesign || design.name.toLowerCase().includes(filterDesign.toLowerCase());
      const ratingMatch = !filterRating || 
        parseFloat(design.stats.avgQuality.toString()) >= parseFloat(filterRating) ||
        parseFloat(design.stats.avgPurchase.toString()) >= parseFloat(filterRating);
      
      return designMatch && ratingMatch;
    });

    // Apply sorting
    designStats.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortConfig.key) {
        case 'designName':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'avgQuality':
          aValue = parseFloat(a.stats.avgQuality.toString());
          bValue = parseFloat(b.stats.avgQuality.toString());
          break;
        case 'avgPurchase':
          aValue = parseFloat(a.stats.avgPurchase.toString());
          bValue = parseFloat(b.stats.avgPurchase.toString());
          break;
        case 'totalRatings':
          aValue = a.stats.totalRatings;
          bValue = b.stats.totalRatings;
          break;
        case 'uploadedAt':
          aValue = a.uploadedAt;
          bValue = b.uploadedAt;
          break;
        default:
          aValue = parseFloat(a.stats.avgQuality.toString());
          bValue = parseFloat(b.stats.avgQuality.toString());
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return designStats;
  };

  const exportToPDF = () => {
    const designStats = getFilteredAndSortedDesigns();
    
    // Create PDF content
    const pdfContent = `
      <html>
        <head>
          <title>Design Analytics Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            h1 { color: #333; }
            .header { margin-bottom: 20px; }
            .rating-bar { background-color: #e5e7eb; height: 8px; border-radius: 4px; overflow: hidden; }
            .rating-fill { height: 100%; background-color: #3b82f6; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Design Analytics Report</h1>
            <p>Generated on: ${new Date().toLocaleString()}</p>
            <p>Total Designs: ${designStats.length}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Design Name</th>
                <th>Avg Quality Rating</th>
                <th>Avg Purchase Rating</th>
                <th>Total Ratings</th>
                <th>Quality Distribution</th>
                <th>Purchase Distribution</th>
                <th>Uploaded</th>
              </tr>
            </thead>
            <tbody>
              ${designStats.map(design => `
                <tr>
                  <td>${design.name}</td>
                  <td>${design.stats.avgQuality}/5</td>
                  <td>${design.stats.avgPurchase}/5</td>
                  <td>${design.stats.totalRatings}</td>
                  <td>
                    ${Object.entries(design.stats.qualityDistribution).map(([rating, count]) => 
                      `${rating}★: ${count}`
                    ).join(', ')}
                  </td>
                  <td>
                    ${Object.entries(design.stats.purchaseDistribution).map(([rating, count]) => 
                      `${rating}★: ${count}`
                    ).join(', ')}
                  </td>
                  <td>${new Date(design.uploadedAt).toLocaleDateString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    // Create blob and download
    const blob = new Blob([pdfContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `design-analytics-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const designStats = getFilteredAndSortedDesigns();

  return (
    <div className="card-elevated p-8 animate-slide-up">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-display-sm text-gray-900 mb-2">Design Analytics</h2>
          <p className="text-body text-gray-600">
            Performance metrics for {designStats.length} design{designStats.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="btn btn-outline"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          <button
            onClick={exportToPDF}
            className="btn btn-primary"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export PDF
          </button>
          <button
            onClick={() => setShowResetModal(true)}
            className="btn btn-error"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Reset All
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="label">Filter by Design</label>
          <input
            type="text"
            value={filterDesign}
            onChange={(e) => setFilterDesign(e.target.value)}
            className="input"
            placeholder="Search by design name..."
          />
        </div>
        <div>
          <label className="label">Filter by Min Rating</label>
          <input
            type="number"
            min="0"
            max="5"
            step="0.1"
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value)}
            className="input"
            placeholder="Minimum rating (0-5)"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="loading-spinner w-12 h-12 mb-6"></div>
          <p className="text-lg text-gray-600">Loading design analytics...</p>
        </div>
      ) : designStats.length === 0 ? (
        <div className="text-center py-16">
          <div className="avatar avatar-xl bg-gray-100 mx-auto mb-6">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">No designs found</h3>
          <p className="text-body text-gray-600">No designs match your current filters</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th 
                  className="text-left py-3 px-4 font-semibold text-gray-900 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('designName')}
                >
                  <div className="flex items-center">
                    Design Name
                    <svg className={`w-4 h-4 ml-1 ${sortConfig.key === 'designName' ? 'text-primary-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </div>
                </th>
                <th 
                  className="text-left py-3 px-4 font-semibold text-gray-900 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('avgQuality')}
                >
                  <div className="flex items-center">
                    Avg Quality
                    <svg className={`w-4 h-4 ml-1 ${sortConfig.key === 'avgQuality' ? 'text-primary-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </div>
                </th>
                <th 
                  className="text-left py-3 px-4 font-semibold text-gray-900 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('avgPurchase')}
                >
                  <div className="flex items-center">
                    Avg Purchase
                    <svg className={`w-4 h-4 ml-1 ${sortConfig.key === 'avgPurchase' ? 'text-primary-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </div>
                </th>
                <th 
                  className="text-left py-3 px-4 font-semibold text-gray-900 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('totalRatings')}
                >
                  <div className="flex items-center">
                    Total Ratings
                    <svg className={`w-4 h-4 ml-1 ${sortConfig.key === 'totalRatings' ? 'text-primary-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </div>
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Rating Distribution</th>
                <th 
                  className="text-left py-3 px-4 font-semibold text-gray-900 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('uploadedAt')}
                >
                  <div className="flex items-center">
                    Uploaded
                    <svg className={`w-4 h-4 ml-1 ${sortConfig.key === 'uploadedAt' ? 'text-primary-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {designStats.map((design) => (
                <tr key={design.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-3">
                      <img
                        src={design.imageUrl}
                        alt={design.name}
                        className="w-12 h-12 rounded-lg object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://via.placeholder.com/48x48/f3f4f6/9ca3af?text=D';
                        }}
                      />
                      <div className="font-semibold text-gray-900">{design.name}</div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-lg font-bold text-primary-600">
                      {design.stats.avgQuality}/5
                    </div>
                    <div className="text-xs text-gray-500">
                      {design.stats.qualityDistribution[5]} 5★, {design.stats.qualityDistribution[4]} 4★
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-lg font-bold text-green-600">
                      {design.stats.avgPurchase}/5
                    </div>
                    <div className="text-xs text-gray-500">
                      {design.stats.purchaseDistribution[5]} 5★, {design.stats.purchaseDistribution[4]} 4★
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-lg font-bold text-gray-600">
                      {design.stats.totalRatings}
                    </div>
                    <div className="text-xs text-gray-500">
                      {design.stats.totalRatings > 0 ? 'rated' : 'no ratings'}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="space-y-1">
                      <div className="text-xs text-gray-600">
                        Quality: {Object.entries(design.stats.qualityDistribution).map(([rating, count]) => 
                          count > 0 ? `${rating}★(${count})` : ''
                        ).filter(Boolean).join(', ')}
                      </div>
                      <div className="text-xs text-gray-600">
                        Purchase: {Object.entries(design.stats.purchaseDistribution).map(([rating, count]) => 
                          count > 0 ? `${rating}★(${count})` : ''
                        ).filter(Boolean).join(', ')}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-sm text-gray-600">
                      {new Date(design.uploadedAt).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(design.uploadedAt).toLocaleTimeString()}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card-elevated p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Reset All Responses</h3>
            <p className="text-body text-gray-600 mb-6">
              This will permanently delete all user responses. This action cannot be undone.
            </p>
            
            <div className="mb-6">
              <label className="label">Admin Password</label>
              <input
                type="password"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                className="input"
                placeholder="Enter admin password to confirm"
              />
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setShowResetModal(false);
                  setResetPassword('');
                }}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleResetResponses}
                className="btn btn-error flex-1"
              >
                Reset All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DesignAnalytics; 