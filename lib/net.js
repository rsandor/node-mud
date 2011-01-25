var net = require('net'),
    EventEmitter = require('events').EventEmitter,
    trim = require('./util').trim;

// TEMP: Users Table
var users = {
  ryan: {
    name: 'ryan',
    password: 'ioioio',
    admin: true
  }
};

/**
 * Handles basic network i/o for connected clients and encapsulates related game structures.
 * @author Ryan Sandor Richards
 */
function Connection(id, stream) {
  EventEmitter.call(this);
  
  var conn = this;
  
  // Initialize the connection information
  this.id = id;
  this.stream = stream;
  this.state = null;
  this.user = null;
  this.connected = true;
  
  // Setup the basic stream
  stream.setEncoding('utf8');
  
  /**
   * Emits a 'data' event which contains structured information about the data sent by the client. 
   * The object passed along when the event is fired contains:
   *
   *   connection: A reference to the connection
   *   raw: The raw data sent by the client
   *   command: The parsed command sent by the client
   *   args: Any arguments also sent along with the command.
   *
   */
  stream.on('data',  function(data) {
     var parts = trim(data).split(/\s+/);
     conn.emit('data', {
       connection: conn,
       raw: data,
       command: parts.shift(),
       args: parts
     });
   });
  
  // Initiate the user into game
  this.emit('connect');
}

Connection.prototype = Object.create(EventEmitter.prototype, {
  constructor: {value: Connection, enumerable: false}
});

/** 
 * Closes the connection and send the 'close' event to all listeners.
 */
Connection.prototype.close = function() {
  this.connected = false;
  this.stream.end();
  this.emit('close', this);
};

/**
 * Handles all top level server functions such as connecting clients and managing
 * connections over life of the running program.
 * @author Ryan Sandor Richards
 */
var Server = (function() {
  var options = { host: 'localhost', port: 8000 };
  
  /*
   * Connection Factory.
   */
  var connections = (function() {
    var instances = {},
      currentId = 0;
    
    function close(c) {
      connections.remove(c);
    }
    
    return {
      create: function(stream) {
        var c = new Connection('cid_'+(currentId++), stream);
        instances[c.id] = c;
        c.on('close', close);
      },
      remove: function(c) {
        delete instances[c.id];
      },
      each: function(closure) {
        for (var k in instances) {
          closure(k);
        }
      }
    };
  })();
  
  return {
    connections: connections,
    
    /**
     * Initalizes and starts a new mud server with the given options.
     * @param opts [optional] An object containing the host and port information.
     */
    init: function(opts) {
      // Parse options
      opts = opts || {};
      for (var k in opts)
         options[k] = opts[k];
      
      // Create the server and begin listening
      var server = net.createServer(function(stream) { connections.create(stream); });
      server.listen(options.port, options.host);
    }
  };
})();