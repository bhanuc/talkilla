/* global sinon, SPA, expect, payloads */
/* jshint unused:false */

describe("SPA", function() {
  var sandbox, worker, spa;

  beforeEach(function() {
    worker = {postMessage: sinon.spy()};
    sandbox = sinon.sandbox.create();
    sandbox.stub(window, "Worker").returns(worker);
    spa = new SPA({src: "example.com"});
    sandbox.stub(spa.http, "post");
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe("constructor", function() {

    it("should instantiate a worker with the src option", function() {
      sinon.assert.calledOnce(window.Worker);
      sinon.assert.calledWithExactly(window.Worker, "example.com");
    });

    it("should throw an error if the src option is missing", function() {
      function shouldExplode() { new SPA(); }
      expect(shouldExplode).to.Throw(Error, /missing parameter: src/);
    });

  });

  describe("#on", function(done) {

    it("should trigger an event when receiving a message", function(done) {
      spa.on("foo", function(data) {
        expect(data).to.equal("bar");
        done();
      });

      worker.onmessage({data: {topic: "foo", data: "bar"}});
    });

    it("should trigger an ice:candidate event when receiving ice:candidate",
      function(done) {
        spa.on("ice:candidate", function(iceCandidateMsg) {
          expect(iceCandidateMsg.peer).to.equal("lloyd");
          expect(iceCandidateMsg.candidate).to.equal("dummy");
          done();
        });

        worker.onmessage({
          data: {
            topic: "ice:candidate",
            data: {
              peer: "lloyd",
              candidate: "dummy"
            }
          }
        });
      });

  });

  describe("#signin", function() {

    it("should send a signin event to the worker", function() {
      var callback = function() {};
      spa.signin("fake assertion", callback);

      sinon.assert.calledOnce(spa.http.post);
      sinon.assert.calledWithExactly(spa.http.post, "/signin", {
        assertion: "fake assertion"
      }, callback);
    });

  });

  describe("#signout", function() {

    it("should send a signout event to the worker", function() {
      var callback = function() {};
      spa.signout(callback);

      sinon.assert.calledOnce(spa.http.post);
      sinon.assert.calledWithExactly(spa.http.post, "/signout", {}, callback);
    });

  });

  describe("#connect", function() {

    it("should send a connect event to the worker", function() {
      spa.worker.postMessage.reset();
      spa.connect();

      sinon.assert.calledOnce(spa.worker.postMessage);
      sinon.assert.calledWithExactly(spa.worker.postMessage, {
        topic: "connect",
        data: {}
      });
    });

  });

  describe("#callOffer", function() {

    it("should send a call:offer event to the worker", function() {
      var offerMsg = new payloads.Offer({offer: "fake offer", peer: "lucy"});

      spa.callOffer(offerMsg);

      sinon.assert.calledOnce(spa.worker.postMessage);
      sinon.assert.calledWithExactly(spa.worker.postMessage, {
        topic: "offer",
        data: offerMsg.toJSON()
      });
    });

  });

  describe("#callAnswer", function() {

    it("should send a answer event to the worker", function() {
      var answerMsg = new payloads.Answer({
        answer: "fake answer",
        peer: "lisa"
      });

      spa.callAnswer(answerMsg);

      sinon.assert.calledOnce(spa.worker.postMessage);
      sinon.assert.calledWithExactly(spa.worker.postMessage, {
        topic: "answer",
        data: answerMsg.toJSON()
      });
    });

  });

  describe("#callHangup", function() {

    it("should send a call:hangup event to the worker", function() {
      var hangupMsg = new payloads.Hangup({peer: "foo"});
      spa.callHangup(hangupMsg);

      sinon.assert.calledOnce(spa.worker.postMessage);
      sinon.assert.calledWithExactly(spa.worker.postMessage, {
        topic: "hangup",
        data: hangupMsg.toJSON()
      });
    });

  });

  describe("#iceCandidate", function() {

    it("should send an ice:candidate event to the worker", function() {
      var iceCandidateMsg = new payloads.IceCandidate({
        candidate: "dummy",
        peer: "lloyd"
      });
      spa.iceCandidate(iceCandidateMsg);

      sinon.assert.calledOnce(spa.worker.postMessage);
      sinon.assert.calledWithExactly(spa.worker.postMessage, {
        topic: "ice:candidate",
        data: {
          peer: "lloyd",
          candidate: "dummy"
        }
      });
    });

  });
});
