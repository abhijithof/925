import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

interface FormData {
  name: string;
  age: number;
  gender: string;
  contact: string;
}

interface FormErrors {
  name?: string;
  age?: string;
  gender?: string;
}

const FormPage: React.FC = () => {
  const navigate = useNavigate();
  const { setUserData } = useUser();
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    age: 0,
    gender: '',
    contact: ''
  });
  
  const [errors, setErrors] = useState<FormErrors>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'age' ? parseInt(value) || 0 : value
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.age || formData.age < 1) {
      newErrors.age = 'Please enter a valid age';
    }

    if (!formData.gender) {
      newErrors.gender = 'Please select your gender';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      setUserData({
        name: formData.name,
        age: formData.age,
        gender: formData.gender,
        contact: formData.contact || undefined
      });
      navigate('/rate');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:py-12 sm:px-6 lg:py-16 lg:px-8">
      <div className="container-form">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="avatar avatar-lg avatar-primary mx-auto mb-6">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-display-sm text-gray-900 mb-3">Welcome to Design Feedback</h1>
          <p className="text-body text-gray-600 max-w-md mx-auto">
            Help us improve our designs by sharing your thoughts. Let's start with a few details about you.
          </p>
        </div>

        {/* Form Card */}
        <div className="card-elevated p-8 animate-slide-up">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="label">
                Full Name <span className="text-error-600">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`input ${errors.name ? 'input-error' : ''}`}
                placeholder="Enter your full name"
                autoComplete="name"
              />
              {errors.name && (
                <div className="mt-2 flex items-center text-sm text-error-600">
                  <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.name}
                </div>
              )}
            </div>

            {/* Age Field */}
            <div>
              <label htmlFor="age" className="label">
                Age <span className="text-error-600">*</span>
              </label>
              <input
                type="number"
                id="age"
                name="age"
                value={formData.age || ''}
                onChange={handleInputChange}
                className={`input ${errors.age ? 'input-error' : ''}`}
                placeholder="Enter your age"
                min="1"
                max="120"
                autoComplete="off"
              />
              {errors.age && (
                <div className="mt-2 flex items-center text-sm text-error-600">
                  <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.age}
                </div>
              )}
            </div>

            {/* Gender Field */}
            <div>
              <label htmlFor="gender" className="label">
                Gender <span className="text-error-600">*</span>
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className={`input ${errors.gender ? 'input-error' : ''}`}
              >
                <option value="">Select your gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>
              {errors.gender && (
                <div className="mt-2 flex items-center text-sm text-error-600">
                  <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.gender}
                </div>
              )}
            </div>

            {/* Contact Field (Optional) */}
            <div>
              <label htmlFor="contact" className="label">
                Phone Number <span className="label-optional">(Optional)</span>
              </label>
              <input
                type="tel"
                id="contact"
                name="contact"
                value={formData.contact}
                onChange={handleInputChange}
                className="input"
                placeholder="+1 (555) 123-4567"
                autoComplete="tel"
              />
              <p className="mt-1 text-caption">
                We'll only use this to contact you about your feedback if needed.
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button type="submit" className="btn btn-primary w-full btn-lg">
                <span>Continue to Design Rating</span>
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-caption text-gray-500">
            Your privacy is important to us. We'll never share your personal information.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FormPage;