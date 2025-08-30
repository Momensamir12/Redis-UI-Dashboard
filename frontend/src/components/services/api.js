import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api/commands';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const redisAPI = {
  // Get all keys
  getAllKeys: async () => {
    const response = await api.get('/keys');
    return response.data.keys; // Return the keys array
  },

  // Get key details
  getKeyDetails: async (key) => {
    const response = await api.get(`/keys/${encodeURIComponent(key)}`);
    return response.data;
  },
  getServerInfo: async () => {
    const response = await api.post('/execute', { command: 'info' });
    return response.data.result;
  },

  // Create key
  createKey: async (key, value, type, streamId = '*') => {
    let command;

    switch(type) {
      case 'string':
        command = `set ${key} "${value}"`;
        break;
      case 'list': {
        // Parse value as array or split by newlines
        let values;
        try {
          values = JSON.parse(value);
        } catch {
          // If not JSON, split by newlines
          values = value.split('\n').filter(v => v.trim());
        }
        
        const quotedValues = values.map(v => `"${v}"`).join(' ');
        command = `lpush ${key} ${quotedValues}`;
        break;
      }
      case 'stream': {
        // Parse stream fields
        let fields;
        try {
          fields = JSON.parse(value);
        } catch {
          // If not JSON, parse as key value pairs
          const lines = value.split('\n').filter(v => v.trim());
          fields = {};
          lines.forEach(line => {
            const [k, ...vParts] = line.split(' ');
            const v = vParts.join(' ');
            if (k && v) fields[k] = v;
          });
        }
        
        const fieldPairs = Object.entries(fields)
          .map(([k, v]) => `${k} "${v}"`)
          .join(' ');
        command = `xadd ${key} ${streamId} ${fieldPairs}`;
        break;
      }
      case 'zset': {
        let members;
        try {
          members = JSON.parse(value);
        } catch {
          const lines = value.split('\n').filter(v => v.trim());
          members = {};
          lines.forEach(line => {
            const parts = line.split(' ');
            const score = parts[0];
            const member = parts.slice(1).join(' ');
            if (score && member) members[member] = parseFloat(score);
          });
        }
        
        const scoreMemberPairs = Object.entries(members)
          .map(([member, score]) => `${score} "${member}"`)
          .join(' ');
        command = `zadd ${key} ${scoreMemberPairs}`;
        break;
      }
      default:
        throw new Error(`Unsupported key type: ${type}`);
    }

    const result = await redisAPI.executeCommand(command);
    return result;
  },

  executeCommand: async (command) => {
    const response = await api.post('/execute', { command });
    return response.data.result;
  },
};