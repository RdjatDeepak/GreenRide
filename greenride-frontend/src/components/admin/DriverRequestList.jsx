import React, { useState, useEffect, useCallback } from 'react';
import { getAllDriverRequests, approveDriverRequest, rejectDriverRequest } from '../../services/driverService';
import './AdminComponents.css';

const DriverRequestList = ({ onStatusChanged }) => {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [processingId, setProcessingId] = useState(null);

  const loadDriverRequests = useCallback(async () => {
    setIsLoading(true);
    const result = await getAllDriverRequests();
    if (result.success) {
      setRequests(result.data || []);
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to load driver requests' });
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadDriverRequests();
  }, [loadDriverRequests]);

  const handleApprove = async (requestId) => {
    setProcessingId(requestId);
    setMessage({ type: '', text: '' });
    
    const result = await approveDriverRequest(requestId);
    if (result.success) {
      setMessage({ type: 'success', text: 'Driver request approved successfully!' });
      loadDriverRequests();
      onStatusChanged?.();
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to approve request' });
    }
    setProcessingId(null);
  };

  const handleReject = async (requestId) => {
    setProcessingId(requestId);
    setMessage({ type: '', text: '' });
    
    const result = await rejectDriverRequest(requestId);
    if (result.success) {
      setMessage({ type: 'success', text: 'Driver request rejected successfully!' });
      loadDriverRequests();
      onStatusChanged?.();
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to reject request' });
    }
    setProcessingId(null);
  };

  const deriveStatus = (request) => {
    if (request.status) return request.status.toUpperCase();
    if (request.approved === true || request.enabled === true) return 'APPROVED';
    if (request.rejected === true) return 'REJECTED';
    return 'PENDING';
  };

  const getStatusBadge = (request) => {
    const status = deriveStatus(request);
    if (status === 'PENDING') {
      return <span className="status-badge pending">Pending</span>;
    }
    if (status === 'APPROVED') {
      return <span className="status-badge approved">Approved</span>;
    }
    if (status === 'REJECTED') {
      return <span className="status-badge rejected">Rejected</span>;
    }
    return <span className="status-badge">Unknown</span>;
  };

  if (isLoading) {
    return <div className="loading">Loading driver requests...</div>;
  }

  return (
    <div className="admin-section">
      <div className="section-header">
        <h3>Driver Requests</h3>
        <button onClick={loadDriverRequests} className="refresh-btn">Refresh</button>
      </div>

      {message.text && (
        <div className={`message-alert ${message.type}`}>
          {message.text}
          <button onClick={() => setMessage({ type: '', text: '' })} className="close-message">×</button>
        </div>
      )}

      {requests.length === 0 ? (
        <div className="empty-state">No driver requests found.</div>
      ) : (
        <div className="requests-list">
          {requests.map((request) => {
            const status = deriveStatus(request);
            const requestKey = request.id || request.userId || request.user?.id || request.email;
            const actionTargetId = request.id || request.userId || request.user?.id;
            return (
              <div key={requestKey} className="request-card">
                <div className="request-info">
                  <div className="request-header">
                    <div>
                      <h4>{request.name || request.fullName || request.user?.name || request.user?.fullName || request.user?.email || request.email || 'Unknown Applicant'}</h4>
                      <p className="request-subtitle">{request.email || request.user?.email || 'Email not provided'}</p>
                    </div>
                    {getStatusBadge(request)}
                  </div>
                  <div className="request-details">
                    <div className="detail-item">
                      <span className="detail-label">Aadhar Number:</span>
                      <span className="detail-value">
                        {request.aadharNumber || request.aadhar || request.driverDetails?.aadharNumber || 'N/A'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">License Number:</span>
                      <span className="detail-value">
                        {request.licenseNumber || request.license || request.driverDetails?.licenseNumber || 'N/A'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Request Date:</span>
                      <span className="detail-value">
                        {request.requestDate ? new Date(request.requestDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="request-actions">
                  <button
                    onClick={() => handleApprove(actionTargetId)}
                    className="btn-approve"
                    disabled={!actionTargetId || processingId === actionTargetId || status === 'APPROVED'}
                  >
                    {processingId === actionTargetId ? 'Processing...' : status === 'APPROVED' ? 'Approved' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleReject(actionTargetId)}
                    className="btn-reject"
                    disabled={!actionTargetId || processingId === actionTargetId || status === 'APPROVED'}
                  >
                    {processingId === actionTargetId ? 'Processing...' : 'Reject'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DriverRequestList;

