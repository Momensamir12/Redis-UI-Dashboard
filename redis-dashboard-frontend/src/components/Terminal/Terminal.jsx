import React, { useState } from 'react';
import { X } from 'lucide-react';
import { redisAPI } from '../services/api';
import './Terminal.css';

const Terminal = ({ onClose }) => {
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState([
    { type: 'info', content: 'Redis Terminal - Type your commands below' }
  ]);

  const handleCommand = async (e) => {
    e.preventDefault();
    if (!command.trim()) return;

    // Add command to history
    setHistory(prev => [...prev, { type: 'command', content: `> ${command}` }]);

    try {
      const result = await redisAPI.executeCommand(command);
      
      // Extract only the response field from the result
      const responseData = result.response;
      
      // Format the result properly
      const formattedResult = typeof responseData === 'object' 
        ? JSON.stringify(responseData, null, 2) 
        : String(responseData);
      
      setHistory(prev => [...prev, { type: 'response', content: formattedResult }]);
    } catch (error) {
      setHistory(prev => [...prev, { 
        type: 'error', 
        content: error.response?.data?.error || error.message 
      }]);
    }

    setCommand('');
  };

  return (
    <div className="terminal-overlay">
      <div className="terminal">
        <div className="terminal-header">
          <h3>Terminal</h3>
          <button onClick={onClose} className="close-btn">
            <X size={20} />
          </button>
        </div>
        
        <div className="terminal-body">
          <div className="terminal-output">
            {history.map((entry, index) => (
              <div key={index} className={`terminal-line ${entry.type}`}>
                {entry.content}
              </div>
            ))}
          </div>
          
          <form onSubmit={handleCommand} className="terminal-input">
            <span className="prompt">&gt;</span>
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="Enter Redis command..."
              autoFocus
            />
          </form>
        </div>
      </div>
    </div>
  );
};

export default Terminal;