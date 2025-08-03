import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Lottie from 'lottie-react';
import confettiAnimation from '../assets/confetti.json';

const ThankYouPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-success-50 via-blue-50 to-purple-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Confetti Animation */}
      <div className="absolute inset-0 z-0">
        <Lottie
          animationData={confettiAnimation}
          className="w-full h-full"
          loop={true}
          autoplay={true}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center max-w-lg mx-auto animate-fade-in">
        <div className="card-elevated p-8">
          {/* Success Icon */}
          <div className="mb-8">
            <div className="avatar avatar-xl avatar-success mx-auto shadow-large">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          {/* Thank You Text */}
          <h1 className="text-display-md text-gray-900 mb-4">
            Thank You!
          </h1>

          <p className="text-body text-gray-600 mb-8">
            Your valuable feedback helps us create better designs and improve our products. 
            We appreciate you taking the time to share your thoughts with us.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="text-center p-4 bg-success-50 rounded-xl">
              <div className="text-2xl font-bold text-success-600 mb-2">✓</div>
              <div className="text-sm font-semibold text-gray-900">Ratings Saved</div>
              <div className="text-xs text-gray-500">Successfully recorded</div>
            </div>
            <div className="text-center p-4 bg-primary-50 rounded-xl">
              <div className="text-2xl font-bold text-primary-600 mb-2">🎯</div>
              <div className="text-sm font-semibold text-gray-900">Data Analyzed</div>
              <div className="text-xs text-gray-500">Insights generated</div>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center justify-center space-x-4 text-gray-600">
            <div className="loading-dots">
              <div className="loading-dot"></div>
              <div className="loading-dot"></div>
              <div className="loading-dot"></div>
            </div>
            <span className="text-sm font-medium">Redirecting to start in 5 seconds...</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-caption text-gray-500">
            Your feedback makes a difference. Thank you for helping us improve!
          </p>
        </div>
      </div>
    </div>
  );
};

export default ThankYouPage;