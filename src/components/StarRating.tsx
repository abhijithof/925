import React from 'react';

interface StarRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  label: string;
}

const StarRating: React.FC<StarRatingProps> = ({ rating, onRatingChange, label }) => {
  const getRatingText = (rating: number): string => {
    if (rating === 0) return 'Not rated';
    if (rating === 5) return 'Excellent';
    if (rating >= 4) return 'Very Good';
    if (rating >= 3) return 'Good';
    if (rating >= 2) return 'Fair';
    return 'Poor';
  };

  const getRatingColor = (rating: number): string => {
    if (rating === 0) return 'text-gray-300';
    if (rating >= 4) return 'text-success-500';
    if (rating >= 3) return 'text-warning-500';
    return 'text-error-500';
  };

  return (
    <div className="card p-6">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">{label}</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Rating:</span>
            <span className={`text-lg font-bold ${getRatingColor(rating)}`}>
              {rating}/5
            </span>
          </div>
        </div>
        <p className="text-caption text-gray-500">Click the stars to rate this design</p>
      </div>

      <div className="flex items-center justify-center space-x-2 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRatingChange(star)}
            className={`w-12 h-12 rounded-lg transition-all duration-200 ease-in-out 
                       transform hover:scale-110 focus:outline-none focus:ring-2 
                       focus:ring-primary-500/20 focus:ring-offset-2
                       ${star <= rating
                         ? 'text-warning-500 hover:text-warning-600'
                         : 'text-gray-300 hover:text-warning-400'
                       }`}
            aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
          >
            <svg
              className="w-full h-full"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>

      {rating > 0 && (
        <div className="text-center">
          <span className={`badge ${rating >= 4 ? 'badge-success' : rating >= 3 ? 'badge-warning' : 'badge-error'}`}>
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            {getRatingText(rating)}
          </span>
        </div>
      )}
    </div>
  );
};

export default StarRating;