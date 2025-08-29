const redisClient = require('../clients/redisClient');

class DashboardService {
  async executeCommand(command) {
    try {
      // Parse the command string into parts
      const commandParts = this.parseCommandString(command);
      
      // Execute the command
      const response = await redisClient.sendCommand(commandParts);
      
      return {
        command: command,
        commandParts: commandParts,
        response: response,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Command execution failed: ${error.message}`);
    }
  }

  async executeBatch(commands) {
    const results = [];
    
    for (const command of commands) {
      try {
        const result = await this.executeCommand(command);
        results.push(result);
      } catch (error) {
        results.push({
          command: command,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    return results;
  }

  async getServerInfo() {
    try {
      const info = await redisClient.sendCommand(['INFO']);
      return this.parseInfoResponse(info);
    } catch (error) {
      throw new Error(`Failed to get server info: ${error.message}`);
    }
  }

  parseCommandString(command) {
    // Handle quoted strings properly
    const parts = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';
    
    for (let i = 0; i < command.length; i++) {
      const char = command[i];
      
      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else if (char === quoteChar && inQuotes) {
        inQuotes = false;
        quoteChar = '';
      } else if (char === ' ' && !inQuotes) {
        if (current) {
          parts.push(current);
          current = '';
        }
      } else {
        current += char;
      }
    }
    
    if (current) {
      parts.push(current);
    }
    
    return parts;
  }

  parseInfoResponse(info) {
    if (typeof info !== 'string') {
      return info;
    }

    const sections = {};
    let currentSection = 'general';
    
    const lines = info.split('\r\n').filter(line => line.trim());
    
    for (const line of lines) {
      if (line.startsWith('#')) {
        currentSection = line.substring(1).trim().toLowerCase();
        sections[currentSection] = {};
      } else if (line.includes(':')) {
        const [key, value] = line.split(':');
        if (!sections[currentSection]) {
          sections[currentSection] = {};
        }
        sections[currentSection][key] = value;
      }
    }
    
    return sections;
  }
}

module.exports = new DashboardService();