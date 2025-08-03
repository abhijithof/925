import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, addDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useUser } from '../context/UserContext';
import StarRating from './StarRating';

interface Design {
  id: string;
  name: string;
  imageUrl: string;
}

interface Rating {
  designQuality: number;
  buyIntention: number;
}

const RatePage: React.FC = () => {
  const navigate = useNavigate();
  const { userData } = useUser();
  const [designs, setDesigns] = useState<Design[]>([]);
  const [currentDesignIndex, setCurrentDesignIndex] = useState(0);
  const [ratings, setRatings] = useState<{ [key: string]: Rating }>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!userData) {
      navigate('/');
      return;
    }
    fetchDesigns();
  }, [userData, navigate]);

  const fetchDesigns = async () => {
    try {
      const designsQuery = query(collection(db, 'designs'), orderBy('name'));
      const querySnapshot = await getDocs(designsQuery);
      
      const designsData: Design[] = [];
      querySnapshot.forEach((doc) => {
        designsData.push({
          id: doc.id,
          name: doc.data().name,
          imageUrl: doc.data().imageUrl
        });
      });
      
      setDesigns(designsData);
    } catch (error) {
      console.error('Error fetching designs:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateRating = (designId: string, ratingType: 'designQuality' | 'buyIntention', rating: number) => {
    setRatings(prev => ({
      ...prev,
      [designId]: {
        ...prev[designId],
        [ratingType]: rating
      }
    }));
  };

  const isCurrentDesignRated = () => {
    const currentDesign = designs[currentDesignIndex];
    if (!currentDesign) return false;
    
    const currentRating = ratings[currentDesign.id];
    return currentRating?.designQuality && currentRating?.buyIntention;
  };

  const areAllDesignsRated = () => {
    return designs.every(design => {
      const rating = ratings[design.id];
      return rating?.designQuality && rating?.buyIntention;
    });
  };

  const handleNext = () => {
    if (currentDesignIndex < designs.length - 1) {
      setCurrentDesignIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentDesignIndex > 0) {
      setCurrentDesignIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!areAllDesignsRated()) return;

    setSubmitting(true);
    try {
      const responseData = {
        userData,
        ratings,
        submittedAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'responses'), responseData);
      navigate('/thankyou');
    } catch (error) {
      console.error('Error submitting ratings:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="loading-spinner mx-auto mb-6"></div>
          <h2 className="text-display-sm text-gray-900 mb-2">Loading Designs</h2>
          <p className="text-body text-gray-600">Preparing your design evaluation experience...</p>
        </div>
      </div>
    );
  }

  if (designs.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="avatar avatar-xl bg-gray-100 mx-auto mb-6">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-display-sm text-gray-900 mb-3">No Designs Available</h2>
          <p className="text-body text-gray-600 mb-6">We're currently preparing designs for evaluation.</p>
          <button 
            onClick={() => navigate('/')}
            className="btn btn-primary"
          >
            Return to Start
          </button>
        </div>
      </div>
    );
  }

  const currentDesign = designs[currentDesignIndex];
  const progressPercentage = ((currentDesignIndex + 1) / designs.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:py-12 sm:px-6 lg:py-16 lg:px-8">
      <div className="container-app">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="avatar avatar-lg avatar-primary mx-auto mb-6">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <h1 className="text-display-sm text-gray-900 mb-3">Design Evaluation</h1>
          <p className="text-body text-gray-600 mb-6">Rate each design based on quality and your purchase intent</p>

          {/* Progress Section */}
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-900">Progress</span>
              <span className="text-sm font-semibold text-primary-600">
                {currentDesignIndex + 1} of {designs.length}
              </span>
            </div>
            <div className="progress">
              <div
                className="progress-bar"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <p className="text-caption text-gray-500 mt-2">
              {Math.round(progressPercentage)}% complete
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 animate-slide-up">
          {/* Design Display */}
          <div className="card-elevated p-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">{currentDesign.name}</h2>
              <p className="text-caption text-gray-500">Design {currentDesignIndex + 1} of {designs.length}</p>
            </div>

            <div className="relative rounded-xl overflow-hidden shadow-medium">
              <img
                src={currentDesign.imageUrl}
                alt={currentDesign.name}
                className="w-full h-64 lg:h-80 object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://via.placeholder.com/600x400/f3f4f6/9ca3af?text=Design+Image';
                }}
              />
            </div>
          </div>

          {/* Rating Section */}
          <div className="space-y-6">
            <StarRating
              rating={ratings[currentDesign.id]?.designQuality || 0}
              onRatingChange={(rating) => updateRating(currentDesign.id, 'designQuality', rating)}
              label="How would you rate the design quality?"
            />

            <StarRating
              rating={ratings[currentDesign.id]?.buyIntention || 0}
              onRatingChange={(rating) => updateRating(currentDesign.id, 'buyIntention', rating)}
              label="How likely would you be to purchase this?"
            />
          </div>
        </div>

        {/* Navigation */}
        <div className="card p-6 animate-slide-up">
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrevious}
              disabled={currentDesignIndex === 0}
              className={`btn ${
                currentDesignIndex === 0
                  ? 'btn-secondary opacity-50 cursor-not-allowed'
                  : 'btn-outline'
              }`}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>

            {currentDesignIndex === designs.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={!areAllDesignsRated() || submitting}
                className={`btn ${
                  !areAllDesignsRated() || submitting
                    ? 'btn-secondary opacity-50 cursor-not-allowed'
                    : 'btn-success'
                } btn-lg`}
              >
                {submitting ? (
                  <>
                    <div className="loading-spinner w-5 h-5 mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <span>Submit All Ratings</span>
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!isCurrentDesignRated()}
                className={`btn ${
                  !isCurrentDesignRated()
                    ? 'btn-secondary opacity-50 cursor-not-allowed'
                    : 'btn-primary'
                }`}
              >
                <span>Next Design</span>
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>

          {!isCurrentDesignRated() && (
            <div className="mt-6 alert alert-warning">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Please complete both ratings to continue</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RatePage;