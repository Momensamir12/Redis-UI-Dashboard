import React, { useState, useEffect } from 'react';
import { redisAPI } from '../services/api';
import './KeyDetails.css';

const KeyDetails = ({ selectedKey, onRefresh }) => {
  const [keyData, setKeyData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (selectedKey) {
      fetchKeyDetails();
    }
  }, [selectedKey]);

  const fetchKeyDetails = async () => {
    try {
      setLoading(true);
      const data = await redisAPI.getKeyDetails(selectedKey.name);
      setKeyData(data);
      // Format value based on type
      if (typeof data.value === 'object') {
        setEditValue(JSON.stringify(data.value, null, 2));
      } else {
        setEditValue(String(data.value));
      }
    } catch (error) {
      console.error('Error fetching key details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      setUpdating(true);
      
      // Use the createKey API to update the key value
      await redisAPI.createKey(
        selectedKey.name, 
        editValue, 
        selectedKey.type
      );
      
      setEditMode(false);
      fetchKeyDetails(); // Refresh the data
      onRefresh(); // Notify parent to refresh the key list
    } catch (error) {
      console.error('Error updating key:', error);
      alert(`Error updating key: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  // Check if the key type is editable (only strings should be editable)
  const isEditable = selectedKey && selectedKey.type === 'string';

  if (!selectedKey) {
    return (
      <div className="key-details empty">
        <div className="empty-state">
          <h2>Key Details</h2>
          <p>Select a key to view its contents</p>
          <div className="empty-icon">[Empty State]</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="key-details">
        <div className="loading">Loading key details...</div>
      </div>
    );
  }

  return (
    <div className="key-details">
      <div className="key-details-header">
        <h2>Key Details</h2>
        {isEditable && (
          <div className="key-actions">
            <button 
              onClick={() => setEditMode(!editMode)}
              disabled={updating}
            >
              {editMode ? 'Cancel' : 'Edit'}
            </button>
          </div>
        )}
      </div>

      <div className="key-info">
        <div className="info-row">
          <span className="label">Key:</span>
          <span className="value">{selectedKey.name}</span>
        </div>
        <div className="info-row">
          <span className="label">Type:</span>
          <span className="value">{selectedKey.type}</span>
        </div>
        {keyData?.ttl && (
          <div className="info-row">
            <span className="label">TTL:</span>
            <span className="value">{keyData.ttl} seconds</span>
          </div>
        )}
      </div>

      <div className="key-value-section">
        <h3>Value:</h3>
        {editMode && isEditable ? (
          <div className="edit-section">
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              rows={10}
              disabled={updating}
            />
            <button 
              onClick={handleUpdate} 
              className="save-btn"
              disabled={updating}
            >
              {updating ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        ) : (
          <pre className="key-value">
            {JSON.stringify(keyData?.value, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
};

export default KeyDetails;