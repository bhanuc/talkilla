/* jshint unused:false */

var ports;

function sendAjax(url, data, cb) {
  var xhr = new XMLHttpRequest();

  xhr.onload = function(event) {
    // sinon.js can call us with a null event a second time, so just ignore it.
    if (event) {
      if (xhr.readyState === 4 && xhr.status === 200)
        cb(null, xhr.responseText);
      else
        cb(xhr.statusText);
    }
  };

  xhr.onerror = function(event) {
    if (event && event.target)
      cb(event.target.status ? event.target.statusText : "We are offline");
  };
  xhr.open('POST', url, true);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.send(JSON.stringify(data));
}

var handlers = {
  'talkilla.login': function(msg) {
    if (!msg.data || !msg.data.username) {
      this.postEvent("talkilla.login-failure",
                     "no username specified");
      return;
    }

    this.postEvent("talkilla.login-pending", null);

    sendAjax('/signin', {nick: msg.data.username},
      function(err, responseText) {
        if (err)
          return this.postEvent('talkilla.login-failure', err);
        return this.postEvent('talkilla.login-success',
                              {username: JSON.parse(responseText).nick});
      }.bind(this));
  }
};

function PortCollection(ports) {
  this.ports = ports || [];
}

PortCollection.prototype = {
  /**
   * Configures and add a port to the stack.
   * @param  {Port} port
   */
  add: function(port) {
    if (this.findPort(port._portid))
      return;
    // configures this port
    port.onmessage = function(event) {
      var msg = event.data;
      if (msg && msg.topic && msg.topic in handlers)
        handlers[msg.topic].call(this, msg);
      else
        this.error('Topic is missing or unknown');
    }.bind(this);

    // add it to the stack
    this.ports.push(port);
  },

  /**
   * Retrieves a port from the collection by its id.
   * @param  {String} id
   * @return {Port}
   */
  findPort: function(id) {
    return this.ports.filter(function(port) {
      return port._portid === id;
    })[0];
  },

  /**
   * Broadcasts a message to all ports.
   * @param  {String} topic
   * @param  {Mixed}  data
   */
  broadcastEvent: function(topic, data) {
    this.ports.forEach(function(port) {
      port.postMessage({topic: topic, data: data});
    });
  },

  /**
   * Broadcasts a message to a given port.
   * @param  {String} id
   * @param  {String} topic
   * @param  {Mixed}  data
   */
  postEvent: function(id, topic, data) {
    this.findPort(id).postMessage({topic: topic, data: data});
  },

  /**
   * Broadcasts an error message to all ports.
   * @param  {String} message
   */
  error: function(message) {
    this.broadcastEvent("talkilla.error", message);
  }
};

function onconnect(event) {
  ports = new PortCollection(event.ports);
}
