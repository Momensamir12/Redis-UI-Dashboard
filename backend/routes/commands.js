const express = require('express');
const router = express.Router();
const dashboardService = require('../services/dashboardService');

// Execute a Redis command
router.post('/execute', async (req, res) => {
  try {
    const { command } = req.body;
    
    if (!command || !command.trim()) {
      return res.status(400).json({ error: 'Command is required' });
    }

    const result = await dashboardService.executeCommand(command);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Execute multiple commands (batch)
router.post('/execute-batch', async (req, res) => {
  try {
    const { commands } = req.body;
    
    if (!commands || !Array.isArray(commands)) {
      return res.status(400).json({ error: 'Commands array is required' });
    }

    const results = await dashboardService.executeBatch(commands);
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get server info
router.get('/info', async (req, res) => {
  try {
    const info = await dashboardService.getServerInfo();
    res.json({ success: true, info });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

router.get('/keys', async (req, res) => {
  try {
    const keysResult = await dashboardService.executeCommand('keys *');
    
    // Extract the actual response
    const keysResponse = keysResult.response;
    
    console.log('Keys result:', keysResult);
    console.log('Keys response:', keysResponse);
    console.log('Response type:', typeof keysResponse);
    
    let keyNames = [];
    
    if (Array.isArray(keysResponse)) {
      keyNames = keysResponse;
    } else if (typeof keysResponse === 'string' && keysResponse) {
      keyNames = keysResponse.includes('\n') 
        ? keysResponse.split('\n').filter(k => k.trim())
        : [keysResponse];
    } else if (keysResponse === null || keysResponse === undefined) {
      keyNames = [];
    } else {
      keyNames = String(keysResponse).split('\n').filter(k => k.trim());
    }
    
    keyNames = keyNames.filter(key => key && key.trim());
    
    const keysWithTypes = [];
    
    for (const keyName of keyNames) {
      try {
        const typeCommand = `type ${keyName}`;
        console.log(`Executing command: ${typeCommand}`);
        
        const typeResult = await dashboardService.executeCommand(typeCommand);
        console.log(`Type result for ${keyName}:`, typeResult);
        
        let typeResponse = typeResult.response;
        
        if (Array.isArray(typeResponse) && typeResponse.length > 0) {
          typeResponse = typeResponse[0];
        }
        
        let type = typeof typeResponse === 'string' 
          ? typeResponse.toLowerCase().trim() 
          : String(typeResponse).toLowerCase().trim();
        
        type = type.replace(/[\r\n]+/g, '').trim();
        
        const validTypes = ['string', 'list', 'set', 'zset', 'hash', 'stream'];
        if (!validTypes.includes(type)) {
          console.warn(`Invalid type "${type}" for key "${keyName}", defaulting to string`);
          type = 'string';
        }
        
        keysWithTypes.push({
          name: keyName,
          type: type
        });
      } catch (error) {
        console.error(`Error getting type for key ${keyName}:`, error);
        keysWithTypes.push({ name: keyName, type: 'unknown' });
      }
    }
    
    res.json({ success: true, keys: keysWithTypes });
  } catch (error) {
    console.error('Error in /keys endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get key details with proper command based on type
router.get('/keys/:key', async (req, res) => {
  try {
    const { key } = req.params;
    
    // Get key type first
    const typeResult = await dashboardService.executeCommand(`type ${key}`);
    const typeStr = (typeResult.response || '').trim();
    
    let value;
    
    // Use appropriate command based on type
    switch(typeStr) {
      case 'string':
        const getResult = await dashboardService.executeCommand(`get ${key}`);
        value = getResult.response;
        break;
      case 'hash':
        const hgetallResult = await dashboardService.executeCommand(`hgetall ${key}`);
        value = hgetallResult.response;
        break;
      case 'list':
        const lrangeResult = await dashboardService.executeCommand(`lrange ${key} 0 -1`);
        value = lrangeResult.response;
        break;
      case 'zset':
        const zrangeResult = await dashboardService.executeCommand(`zrange ${key} 0 -1 withscores`);
        value = zrangeResult.response;
        break;
      case 'stream':
        const xrangeResult = await(dashboardService).executeCommand(`xrange ${key}  0 99999999999999999999`)
        value = xrangeResult.response 
        break; 
      default:
        value = null;
    }
    
    res.json({
      success: true,
      key: key,
      type: typeStr,
      value: value,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete key
router.delete('/keys/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const result = await dashboardService.executeCommand(`del ${key}`);
    res.json({ success: true, result: result.response });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;