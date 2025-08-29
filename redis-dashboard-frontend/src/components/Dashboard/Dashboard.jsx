import React, { useState, useEffect } from "react";
import Sidebar from "../Sidebar/Sidebar";
import KeyDetails from "../KeyDetails/KeyDetails";
import Terminal from "../Terminal/Terminal";
import { redisAPI } from "../services/api";
import "./Dashboard.css";
import redisLogo from "../../assets/redis.png";

const Dashboard = () => {
  const [keys, setKeys] = useState([]);
  const [selectedKey, setSelectedKey] = useState(null);
  const [showTerminal, setShowTerminal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Server info
  const [serverInfo, setServerInfo] = useState(null);
  const [showFullInfo, setShowFullInfo] = useState(false);

  useEffect(() => {
    fetchKeys();
    fetchServerInfo();
    const interval = setInterval(fetchServerInfo, 5000); // auto-refresh every 5s
    return () => clearInterval(interval);
  }, []);

  const fetchKeys = async () => {
    try {
      setLoading(true);
      const data = await redisAPI.getAllKeys();
      setKeys(data);
    } catch (error) {
      console.error("Error fetching keys:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchServerInfo = async () => {
    try {
      const info = await redisAPI.getServerInfo();
      setServerInfo(info);
    } catch (err) {
      console.error("Error fetching server info:", err);
    }
  };

  const handleKeySelect = (key) => setSelectedKey(key);

  const handleAddKey = async (newKey) => {
    await fetchKeys();
    setSelectedKey(newKey);
  };

  // Parse INFO response into a map
  const parseInfo = (response) => {
    const map = {};
    response.forEach((line) => {
      if (!line.startsWith("#") && line.includes(":")) {
        const [k, v] = line.split(":");
        map[k] = v;
      }
    });
    return map;
  };

  const parsedInfo = serverInfo ? parseInfo(serverInfo.response) : {};
  const usedMemory = parsedInfo.used_memory
    ? parseInt(parsedInfo.used_memory, 10)
    : 0;
  const totalMemory = 1024 * 1024 * 100; // assume 100MB for demo, or fetch from INFO if available
  const memoryPercent = totalMemory ? (usedMemory / totalMemory) * 100 : 0;

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <img src={redisLogo} alt="Redis Logo" className="redis-logo" />

          {serverInfo && (
            <div
              className="server-info-bar"
              onClick={() => setShowFullInfo(!showFullInfo)}
            >
              <div className="server-stat">
                <span className="label">Role:</span> {parsedInfo.role}
              </div>
              <div className="server-stat">
                <span className="label">Memory:</span>{" "}
                {parsedInfo.used_memory_human}
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${memoryPercent}%` }}
                  ></div>
                </div>
              </div>
              <div className="server-stat">
                <span className="label">Slaves:</span>{" "}
                {parsedInfo.connected_slaves}
              </div>
            </div>
          )}
        </div>

        <button
          className="terminal-toggle"
          onClick={() => setShowTerminal(!showTerminal)}
        >
          [Terminal]
        </button>
      </header>

      {showFullInfo && serverInfo && (
  <div className="server-info-expanded">
    {(() => {
      const sections = {};
      const ignoreKeys = ["master_replid", "used_memory"]; // ignore noisy/duplicate

      serverInfo.response.forEach(line => {
        if (line.startsWith("#")) {
          const section = line.replace("#", "").trim();
          sections[section] = [];
        } else if (line.includes(":")) {
          let [key, value] = line.split(":");
          key = key.trim();
          value = value.trim();

          if (!ignoreKeys.includes(key)) {
            // prettify key
            let prettyKey = key.replace(/_/g, " ");
            prettyKey = prettyKey
              .split(" ")
              .map(w => w.charAt(0).toUpperCase() + w.slice(1))
              .join(" ");

            // special rename
            if (key === "used_memory_human") {
              prettyKey = "Used Memory (MB)";
            }

            const currentSection = Object.keys(sections).pop();
            if (currentSection) {
              sections[currentSection].push({ key: prettyKey, value });
            }
          }
        }
      });

      return Object.entries(sections).map(([section, items]) => (
        <div key={section} className="info-section">
          <h3>{section}</h3>
          <div className="info-grid">
            {items.map(({ key, value }) => (
              <div key={key} className="info-card">
                <span className="info-key">{key}</span>
                <span className="info-value">{value}</span>
              </div>
            ))}
          </div>
        </div>
      ));
    })()}
  </div>
)}


      <div className="dashboard-content">
        <Sidebar
          keys={keys}
          onKeySelect={handleKeySelect}
          onAddKey={handleAddKey}
          selectedKey={selectedKey}
          loading={loading}
        />
        <KeyDetails selectedKey={selectedKey} onRefresh={fetchKeys} />
      </div>

      {showTerminal && <Terminal onClose={() => setShowTerminal(false)} />}
    </div>
  );
};

export default Dashboard;
