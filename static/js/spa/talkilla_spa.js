/* global payloads */
/* jshint unused:false */

var TalkillaSPA = (function() {
  function TalkillaSPA(port, server) {
    this.port = port;
    this.server = server;
    this.credentials = undefined;

    this.port.on("connect", this._onConnect.bind(this));

    this.port.on("offer", this._onCallOffer.bind(this));
    this.port.on("answer", this._onCallAnswer.bind(this));
    this.port.on("hangup", this._onCallHangup.bind(this));
    this.port.on("presence:request", this._onPresenceRequest.bind(this));

    this.server.on("connected", this._onServerEvent.bind(this, "connected"));
    this.server.on("unauthorized",
                   this._onServerEvent.bind(this, "unauthorized"));
    this.server.on("disconnected",
                   this._onServerEvent.bind(this, "disconnected"));
    this.server.on("message", this._onServerMessage.bind(this));
  }

  TalkillaSPA.prototype = {
    _onServerEvent: function(type, event) {
      if (type === "unauthorized")
        this.port.post("reauth-needed");
      else
        this.port.post(type, event);
    },

    _onServerMessage: function(type, event) {
      // XXX: For now we just translate the server messages to the
      // documented SPA interface. We have to update the server to
      // reflect these events.
      if (type === "offer")
        this.port.post("offer", (new payloads.Offer(event)).toJSON());
      else if (type === "answer")
        this.port.post("answer", (new payloads.Answer(event)).toJSON());
      else if (type === "hangup")
        this.port.post("hangup", (new payloads.Hangup(event)).toJSON());
      else
        this.port.post("message", [type, event]);
    },

    _onConnect: function(credentials) {
      this.server.connect(credentials);
    },

    /**
     * Called when initiating a call.
     *
     * @param {Object} offerData a data structure representation of a
     * payloads.Offer.
     */
    _onCallOffer: function(offerData) {
      var offerMsg = new payloads.Offer(offerData);
      this.server.callOffer(offerMsg);
    },

    /**
     * Called when accepting a call.
     *
     * @param {Object} answerData a data structure representation of a
     * payloads.Answer.
     */
    _onCallAnswer: function(answerData) {
      var answerMsg = new payloads.Answer(answerData);
      this.server.callAccepted(answerMsg);
    },

    /**
     * Called when hanging up a call.
     *
     * @param {Object} hangupData a data structure representation of a
     * payloads.Hangup.
     */
    _onCallHangup: function(hangupData) {
      var hangupMsg = new payloads.Hangup(hangupData);
      this.server.callHangup(hangupMsg);
    },

    _onPresenceRequest: function(data) {
      this.server.presenceRequest(data.nick);
    }
  };

  return TalkillaSPA;
}());
