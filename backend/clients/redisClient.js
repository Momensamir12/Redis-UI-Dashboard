const net = require('net');
const { encode, decode, simpleDecoder } = require('../utils/respHandler.js');

class RedisClient {
  constructor() {
    this.host = process.env.REDIS_HOST || 'localhost';
    this.port = process.env.REDIS_PORT || 6379;
    this.client = null;
    this.connected = false;
  }

  connect() {
    return new Promise((resolve, reject) => {
      if (this.connected) {
        return resolve();
      }

      this.client = new net.Socket();
      
      this.client.connect(this.port, this.host, () => {
        console.log(`Connected to Redis server at ${this.host}:${this.port}`);
        this.connected = true;
        resolve();
      });

      this.client.on('error', (err) => {
        console.error('Redis connection error:', err);
        this.connected = false;
        reject(err);
      });

      this.client.on('close', () => {
        console.log('Connection to Redis server closed');
        this.connected = false;
      });
    });
  }

  // In redisClient.js, replace the sendCommand method:
async sendCommand(commandArray) {
  if (!this.connected) {
    await this.connect();
  }

  return new Promise((resolve, reject) => {
    try {
      // Encode command to RESP format
      const respCommand = encode(commandArray);
      
      // Send command
      this.client.write(respCommand);

      // Handle response
      let buffer = Buffer.alloc(0);
      let resolved = false; // Add flag to prevent multiple resolutions
      
      const handleData = (data) => {
        if (resolved) return; // Prevent multiple resolutions
        
        buffer = Buffer.concat([buffer, data]);
        
        try {
          const { result, remainingBuffer } = decode(buffer);
          
          if (result !== undefined) {
            this.client.removeListener('data', handleData);
            resolved = true; // Set flag
            resolve(result);
          } else {
            // Wait for more data
            buffer = remainingBuffer || buffer;
          }
        } catch (err) {
          // If decode fails, wait for more data
          if (err.message.includes('Incomplete')) {
            return; // Wait for more data
          }
          this.client.removeListener('data', handleData);
          resolved = true; // Set flag
          reject(err);
        }
      };

      this.client.on('data', handleData);

      // Timeout after 5 seconds
      setTimeout(() => {
        if (!resolved) {
          this.client.removeListener('data', handleData);
          reject(new Error('Command timeout'));
        }
      }, 5000);

    } catch (error) {
      reject(error);
    }
  });
}

  disconnect() {
    if (this.client) {
      this.client.destroy();
      this.connected = false;
    }
  }
}

module.exports = new RedisClient();