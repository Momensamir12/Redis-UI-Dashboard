import axios from "axios";

const API_BASE_URL = "http://localhost:3001/api/commands";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

function normalizeKeyItem(item) {
  if (!item) return null;
  if (typeof item === "string") return { name: item, type: "string" };
  if (typeof item === "object") {
    if (item.name) return { name: String(item.name), type: item.type || "string" };
    if (Array.isArray(item) && item.length >= 1) return { name: String(item[0]), type: String(item[1] || "string") };
  }
  return null;
}

export const redisAPI = {
  // Get all keys
  getAllKeys: async () => {
    try {
      const resp = await api.get("/keys");
      const payload = resp.data ?? {};
      // backend shapes: { keys: [...] } or { success: true, keys: [...] } or { data: [...] }
      let raw = payload.keys ?? payload.result ?? payload.data ?? payload;
      // if payload itself is an object with info/server response, bail out
      if (raw && typeof raw === "object" && !Array.isArray(raw) && ("info" in raw || "response" in raw)) {
        return [];
      }
      // if top-level wrapper includes success and keys under another key
      if (!Array.isArray(raw) && typeof raw === "object") {
        // maybe it's { success:true, keys: [...] }
        if (Array.isArray(payload.keys)) raw = payload.keys;
        else if (Array.isArray(payload.result)) raw = payload.result;
        else raw = Object.keys(raw).map(k => ({ name: k, type: "string" }));
      }
      if (!Array.isArray(raw)) return [];
      return raw.map(normalizeKeyItem).filter(Boolean);
    } catch (e) {
      console.error("getAllKeys error", e);
      return [];
    }
  },

  // Get key details
  getKeyDetails: async (key) => {
    const resp = await api.get(`/keys/${encodeURIComponent(key)}`);
    return resp.data ?? {};
  },
  getServerInfo: async () => {
    try {
      const resp = await api.get("/info");
      const payload = resp.data ?? {};
      // backend sample: { success: true, info: [ "# Server", "role:master", ... ] }
      let info = payload.info ?? payload.result ?? payload.data ?? payload;
      // if info is an object with nested shape, try common fields
      if (info && typeof info === "object" && !Array.isArray(info)) {
        if (Array.isArray(info.info)) info = info.info;
        else if (typeof info.response === "string") info = info.response;
        else info = payload.info ?? payload.result ?? "";
      }
      return { response: info };
    } catch (e) {
      console.error("getServerInfo error", e);
      return { response: "" };
    }
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
    const resp = await api.post("/execute", { command });
    const payload = resp.data ?? {};
    return payload.result ?? payload;
  },
};