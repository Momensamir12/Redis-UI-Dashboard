const RedisParser = require('redis-parser');

function encode(value) {
  if (Array.isArray(value)) {
    let resp = `*${value.length}\r\n`;
    for (const item of value) {
      resp += encode(item);
    }
    return resp;
  } else if (typeof value === 'string') {
    return `$${Buffer.byteLength(value)}\r\n${value}\r\n`;
  } else if (typeof value === 'number') {
    return `:${value}\r\n`;
  } else if (value === null) {
    return '$-1\r\n';
  } else if (value instanceof Error) {
    return `-${value.message}\r\n`;
  } else {
    const str = String(value);
    return `$${Buffer.byteLength(str)}\r\n${str}\r\n`;
  }
}

function decode(buffer) {
  let result;
  let hasResult = false;
  
  const parser = new RedisParser({
    returnReply: (reply) => {
      console.log('RedisParser returnReply:', reply, 'Type:', typeof reply);
      if (!hasResult) { 
        result = reply;
        hasResult = true;
      }
    },
    returnError: (err) => {
      console.log('RedisParser returnError:', err);
      if (!hasResult) {
        throw err;
      }
    }
  });

  try {
    parser.execute(buffer);
    
    if (result !== undefined) {
      return { result, remainingBuffer: Buffer.alloc(0) };
    }
    
    throw new Error('Incomplete RESP data');
  } catch (error) {
    if (error.message.includes('Incomplete') || error.message.includes('Protocol error')) {
      return { result: undefined, remainingBuffer: buffer };
    }
    throw error;
  }
}

module.exports = {
  encode,
  decode,
};