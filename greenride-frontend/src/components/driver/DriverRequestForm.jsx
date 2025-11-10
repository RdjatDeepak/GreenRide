import React, { useState } from 'react';
import './DriverRequestForm.css';

const DriverRequestForm = ({ onSubmit, onCancel, isSubmitting }) => {
  const [formData, setFormData] = useState({
    aadharNumber: '',
    licenseNumber: '',
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    // Aadhar number validation (12 digits)
    if (!formData.aadharNumber) {
      newErrors.aadharNumber = 'Aadhar number is required';
    } else if (!/^\d{12}$/.test(formData.aadharNumber)) {
      newErrors.aadharNumber = 'Aadhar number must be 12 digits';
    }
    
    // License number validation
    if (!formData.licenseNumber) {
      newErrors.licenseNumber = 'License number is required';
    } else if (formData.licenseNumber.length < 5) {
      newErrors.licenseNumber = 'License number must be at least 5 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  return (
    <div className="driver-request-modal">
      <div className="driver-request-overlay" onClick={onCancel}></div>
      <div className="driver-request-content">
        <div className="driver-request-header">
          <h2>Request to Become a Driver</h2>
          <p className="driver-request-subtitle">
            Submit your details to become a GreenRide driver. Admin will review your request.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="driver-request-form">
          <div className="form-group">
            <label htmlFor="aadharNumber">
              Aadhar Number <span className="required">*</span>
            </label>
            <input
              type="text"
              id="aadharNumber"
              name="aadharNumber"
              value={formData.aadharNumber}
              onChange={handleChange}
              placeholder="Enter 12-digit Aadhar number"
              maxLength="12"
              className={errors.aadharNumber ? 'input-error' : ''}
              disabled={isSubmitting}
            />
            {errors.aadharNumber && (
              <span className="error-message">{errors.aadharNumber}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="licenseNumber">
              Driving License Number <span className="required">*</span>
            </label>
            <input
              type="text"
              id="licenseNumber"
              name="licenseNumber"
              value={formData.licenseNumber}
              onChange={handleChange}
              placeholder="Enter your driving license number"
              className={errors.licenseNumber ? 'input-error' : ''}
              disabled={isSubmitting}
            />
            {errors.licenseNumber && (
              <span className="error-message">{errors.licenseNumber}</span>
            )}
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={onCancel}
              className="btn-cancel"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DriverRequestForm;

