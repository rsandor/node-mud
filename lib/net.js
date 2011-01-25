// TEMP: Users Table
var users = {
  ryan: {
    name: 'ryan',
    password: 'ioioio',
    admin: true
  }
};

// Include required libraries
var net = require('net'),
    EventEmitter = require('events').EventEmitter,
    trim = require('./util').trim, 
    override = require('./util').override,
    log = require('sys').log;

// Constants
var IDLE_TIMEOUT = 30 * 60 * 1000;

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

    if (trim(data) == "quit") {
      conn.close();
    }
    else if (trim(data) == "c") {
      var s = '';
      Server.connections.each(function(c) {
        s += c.id + "\r\n";
      });
      stream.write([
        'Current Connections:', s
      ].join("\r\n"));
    }
    else {
      stream.write("You said: " + trim(data) + "\r\n");
      Server.connections.each(function(c) {
        c.stream.write(conn.id + " says: " + trim(data) + "\r\n");
      });
    }
  });
  
  /**
   * Handles idling timeouts for connections.
   */
  stream.setTimeout(IDLE_TIMEOUT);
  stream.on('timeout', function() {
    log("Connection " + conn.id + " has timed out.");
    this.end();
  });
  
  /** 
   * Closes out the connection and informs listeners.
   */
  stream.on('end', function() {
    log("Closing connection " + conn.id);
    conn.emit('close', conn);
  });
  
  // Initiate the user into game
  this.emit('connect');
}

Connection.prototype = Object.create(EventEmitter.prototype, {
  constructor: {value: Connection, enumerable: false}
});

/**
 * Closes the connection.
 */
Connection.prototype.close = function() {
  this.stream.end();
};

/**
 * Handles all top level server functions such as connecting clients and managing
 * connections over life of the running program.
 * @author Ryan Sandor Richards
 */
var Server = exports.Server = (function() {
  var server = null,
      options = { host: 'localhost', port: 8000 },
      connections = {},
      currentId = 0;
  
  /** 
   * Creates a new connection and adds it to the connections table.
   * @param stream Incoming client stream.
   */
  function connect(stream) {
    log("Incoming connection from " + stream.remoteAddress);
    
    var c = new Connection('cid_'+(currentId++), stream);
    connections[c.id] = c;
    c.on('close', remove);
    
    log("Connection initialized and assigned id: " + c.id);
  }
  
  /**
   * Removes an existing connection from the connections table.
   * @param c Connection to close.
   */
  function remove(c) {
    delete connections[c.id];
  }
  
  /**
   * Public server interface.
   */
  return {
    /**
     * Interface for dealing with connected clients.
     */
    connections: {
      /**
       * Applies the given closure to each connection.
       * @param cl Closure to execute on the connections.
       */
      each: function(cl) {
        for (var k in connections)
          cl(connections[k]);
      }
    },
    
    /**
     * Initalizes and starts a new mud server with the given options.
     * @param opts [optional] An object containing the host and port information.
     */
    init: function(opts) {
      // Parse options
      override(options, opts || {});
      
      // Create the server and begin listening
      (server = net.createServer(function(stream) { connect(stream); })).listen(options.port, options.host);
      log('Game server listening on port ' + options.port);
    }
  };
})();