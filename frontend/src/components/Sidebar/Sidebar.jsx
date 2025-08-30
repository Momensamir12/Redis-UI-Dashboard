import React, { useState } from 'react';
import { Search, Plus, X } from 'lucide-react';
import './Sidebar.css';
import { redisAPI } from '../services/api';

const Sidebar = ({ keys, onKeySelect, onAddKey, selectedKey, loading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredKeys = keys.filter(key =>
    key.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Keys ({keys.length})</h2>
      </div>

      <div className="search-container">
        <Search size={16} />
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <button className="add-key-btn" onClick={() => setShowAddModal(true)}>
        <Plus size={16} /> Add New Key
      </button>

      <div className="keys-list">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : filteredKeys.length === 0 ? (
          <div className="empty-state">No keys found</div>
        ) : (
          filteredKeys.map((key) => (
            <div
              key={key.name}
              className={`key-item ${selectedKey?.name === key.name ? 'selected' : ''}`}
              onClick={() => onKeySelect(key)}
            >
              <span className="key-name">{key.name}</span>
              <span className="key-type">{key.type}</span>
            </div>
          ))
        )}
      </div>

      {showAddModal && (
        <AddKeyModal 
          onClose={() => setShowAddModal(false)}
          onAdd={onAddKey}
        />
      )}
    </div>
  );
};

const AddKeyModal = ({ onClose, onAdd }) => {
  const [keyName, setKeyName] = useState('');
  const [keyType, setKeyType] = useState('string');
  const [streamId, setStreamId] = useState('*');
  const [values, setValues] = useState([{ id: 1, value: '' }]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let formattedValue;
      
      if (keyType === 'string') {
        formattedValue = values[0].value;
      } else if (keyType === 'list') {
        // Format as array of values
        const listValues = values
          .filter(v => v.value.trim())
          .map(v => v.value);
        formattedValue = JSON.stringify(listValues);
      } else if (keyType === 'stream') {
        // Format as object with field-value pairs
        const fields = {};
        values.forEach(v => {
          const parts = v.value.split(' ');
          if (parts.length >= 2) {
            const key = parts[0];
            const value = parts.slice(1).join(' ');
            fields[key] = value;
          }
        });
        formattedValue = JSON.stringify(fields);
      } else if (keyType === 'zset') {
        // Format as object with member:score pairs
        const members = {};
        values.forEach(v => {
          const parts = v.value.split(' ');
          if (parts.length >= 2) {
            const score = parseFloat(parts[0]);
            const member = parts.slice(1).join(' ');
            if (!isNaN(score) && member) {
              members[member] = score;
            }
          }
        });
        formattedValue = JSON.stringify(members);
      }

      await redisAPI.createKey(keyName, formattedValue, keyType, streamId);
      onAdd({ name: keyName, type: keyType, value: formattedValue });
      onClose();
    } catch (error) {
      console.error('Error adding key:', error);
      alert(`Error adding key: ${error.message}`);
    }
  };

  const addValueField = () => {
    setValues([...values, { id: Date.now(), value: '' }]);
  };

  const removeValueField = (id) => {
    if (values.length > 1) {
      setValues(values.filter(v => v.id !== id));
    }
  };

  const updateValue = (id, value) => {
    setValues(values.map(v => 
      v.id === id ? { ...v, value } : v
    ));
  };

  const getPlaceholder = () => {
    switch(keyType) {
      case 'string':
        return 'Value';
      case 'list':
        return 'List value';
      case 'stream':
        return 'field value (e.g., name John)';
      case 'zset':
        return 'score member (e.g., 1 apple)';
      default:
        return 'Value';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>Add New Key</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Key name"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            required
          />
          
          <select value={keyType} onChange={(e) => {
            setKeyType(e.target.value);
            // Reset values when type changes
            setValues([{ id: 1, value: '' }]);
          }}>
            <option value="string">String</option>
            <option value="list">List</option>
            <option value="stream">Stream</option>
            <option value="zset">Sorted Set</option>
          </select>

          {keyType === 'stream' && (
            <input
              type="text"
              placeholder="Stream ID (default: *)"
              value={streamId}
              onChange={(e) => setStreamId(e.target.value)}
              className="stream-id-input"
            />
          )}

          <div className="values-section">
            <div className="values-header">
              <span>
                {keyType === 'string' ? 'Value' : 'Values'}
                {keyType === 'stream' && ' (field value pairs)'}
                {keyType === 'zset' && ' (score member pairs)'}
              </span>
              {(keyType === 'list' || keyType === 'stream' || keyType === 'zset') && (
                <button
                  type="button"
                  className="add-value-btn"
                  onClick={addValueField}
                  title="Add another value"
                >
                  <Plus size={16} />
                </button>
              )}
            </div>

            <div className="values-list">
              {values.map((val, index) => (
                <div key={val.id} className="value-input-group">
                  {keyType === 'string' ? (
                    <textarea
                      placeholder={getPlaceholder()}
                      value={val.value}
                      onChange={(e) => updateValue(val.id, e.target.value)}
                      required
                    />
                  ) : (
                    <>
                      <input
                        type="text"
                        placeholder={getPlaceholder()}
                        value={val.value}
                        onChange={(e) => updateValue(val.id, e.target.value)}
                        required={index === 0}
                      />
                      {values.length > 1 && (
                        <button
                          type="button"
                          className="remove-value-btn"
                          onClick={() => removeValueField(val.id)}
                          title="Remove this value"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit">Add Key</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Sidebar;