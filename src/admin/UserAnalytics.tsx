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

interface UserAnalyticsProps {
  responses: Response[];
  designs: Design[];
  loading: boolean;
  onRefresh: () => void;
}

interface SortConfig {
  key: 'userName' | 'avgQuality' | 'avgPurchase' | 'totalRatings' | 'submittedAt';
  direction: 'asc' | 'desc';
}

const UserAnalytics: React.FC<UserAnalyticsProps> = ({ responses, loading, onRefresh }) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'submittedAt', direction: 'desc' });
  const [filterUser, setFilterUser] = useState('');
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



  const calculateUserStats = (response: Response) => {
    const ratings = Object.values(response.ratings);
    const totalRatings = ratings.length;
    
    const avgQuality = ratings.reduce((sum, rating) => sum + rating.designQuality, 0) / totalRatings;
    const avgPurchase = ratings.reduce((sum, rating) => sum + rating.buyIntention, 0) / totalRatings;
    
    return {
      avgQuality: avgQuality.toFixed(1),
      avgPurchase: avgPurchase.toFixed(1),
      totalRatings
    };
  };

  const getFilteredAndSortedUsers = () => {
    // Group responses by user (using name as identifier)
    const userMap = new Map<string, Response[]>();
    
    responses.forEach(response => {
      const userName = response.userData.name || 'Anonymous';
      if (!userMap.has(userName)) {
        userMap.set(userName, []);
      }
      userMap.get(userName)!.push(response);
    });

    // Convert to array and calculate stats
    let users = Array.from(userMap.entries()).map(([userName, userResponses]) => {
      const latestResponse = userResponses[0]; // Most recent response
      const stats = calculateUserStats(latestResponse);
      
      return {
        userName,
        userData: latestResponse.userData,
        stats,
        submittedAt: latestResponse.submittedAt,
        responses: userResponses
      };
    });

    // Apply filters
    users = users.filter(user => {
      const userMatch = !filterUser || user.userName.toLowerCase().includes(filterUser.toLowerCase());
      const ratingMatch = !filterRating || 
        parseFloat(user.stats.avgQuality) >= parseFloat(filterRating) ||
        parseFloat(user.stats.avgPurchase) >= parseFloat(filterRating);
      
      return userMatch && ratingMatch;
    });

    // Apply sorting
    users.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortConfig.key) {
        case 'userName':
          aValue = a.userName;
          bValue = b.userName;
          break;
        case 'avgQuality':
          aValue = parseFloat(a.stats.avgQuality);
          bValue = parseFloat(b.stats.avgQuality);
          break;
        case 'avgPurchase':
          aValue = parseFloat(a.stats.avgPurchase);
          bValue = parseFloat(b.stats.avgPurchase);
          break;
        case 'totalRatings':
          aValue = a.stats.totalRatings;
          bValue = b.stats.totalRatings;
          break;
        case 'submittedAt':
          aValue = a.submittedAt;
          bValue = b.submittedAt;
          break;
        default:
          aValue = a.submittedAt;
          bValue = b.submittedAt;
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return users;
  };

  const exportToPDF = () => {
    const users = getFilteredAndSortedUsers();
    
    // Create PDF content
    const pdfContent = `
      <html>
        <head>
          <title>User Analytics Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            h1 { color: #333; }
            .header { margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>User Analytics Report</h1>
            <p>Generated on: ${new Date().toLocaleString()}</p>
            <p>Total Users: ${users.length}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>User Name</th>
                <th>Age</th>
                <th>Gender</th>
                <th>Avg Quality Rating</th>
                <th>Avg Purchase Rating</th>
                <th>Total Ratings</th>
                <th>Contact</th>
                <th>Last Submitted</th>
              </tr>
            </thead>
            <tbody>
              ${users.map(user => `
                <tr>
                  <td>${user.userName}</td>
                  <td>${user.userData.age}</td>
                  <td>${user.userData.gender}</td>
                  <td>${user.stats.avgQuality}/5</td>
                  <td>${user.stats.avgPurchase}/5</td>
                  <td>${user.stats.totalRatings}</td>
                  <td>${user.userData.contact || 'N/A'}</td>
                  <td>${new Date(user.submittedAt).toLocaleDateString()}</td>
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
    link.download = `user-analytics-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const users = getFilteredAndSortedUsers();

  return (
    <div className="card-elevated p-8 animate-slide-up">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-display-sm text-gray-900 mb-2">User Analytics</h2>
          <p className="text-body text-gray-600">
            {users.length} registered user{users.length !== 1 ? 's' : ''} from {responses.length} total responses
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
          <label className="label">Filter by User</label>
          <input
            type="text"
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className="input"
            placeholder="Search by user name..."
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
          <p className="text-lg text-gray-600">Loading users...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16">
          <div className="avatar avatar-xl bg-gray-100 mx-auto mb-6">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">No users found</h3>
          <p className="text-body text-gray-600">No registered users match your current filters</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th 
                  className="text-left py-3 px-4 font-semibold text-gray-900 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('userName')}
                >
                  <div className="flex items-center">
                    User Name
                    <svg className={`w-4 h-4 ml-1 ${sortConfig.key === 'userName' ? 'text-primary-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </div>
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">User Info</th>
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
                <th 
                  className="text-left py-3 px-4 font-semibold text-gray-900 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('submittedAt')}
                >
                  <div className="flex items-center">
                    Last Submitted
                    <svg className={`w-4 h-4 ml-1 ${sortConfig.key === 'submittedAt' ? 'text-primary-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="font-semibold text-gray-900">{user.userName}</div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-sm text-gray-600">
                      <div>Age: {user.userData.age}</div>
                      <div>Gender: {user.userData.gender}</div>
                      {user.userData.contact && (
                        <div>Contact: {user.userData.contact}</div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-lg font-bold text-primary-600">
                      {user.stats.avgQuality}/5
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-lg font-bold text-green-600">
                      {user.stats.avgPurchase}/5
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-lg font-bold text-gray-600">
                      {user.stats.totalRatings}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-sm text-gray-600">
                      {new Date(user.submittedAt).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(user.submittedAt).toLocaleTimeString()}
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

export default UserAnalytics; 