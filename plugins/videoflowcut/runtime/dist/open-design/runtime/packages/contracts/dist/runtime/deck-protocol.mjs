// src/runtime/deck-protocol.ts
var DECK_PROTOCOL_VERSION = 1;
var DECK_NAVIGATE_MESSAGE_TYPE = "od:slide";
var DECK_STATE_MESSAGE_TYPE = "od:slide-state";
var DECK_READY_MESSAGE_TYPE = "od:deck-ready";
var DECK_PROTOCOL_V1_CAPABILITIES = [
  "absolute-navigation",
  "state-events"
];
var DECK_PROTOCOL_V1_INLINE_RUNTIME = `      var OD_DECK_PROTOCOL_VERSION = ${DECK_PROTOCOL_VERSION};
      function postDeckState() {
        try {
          window.parent.postMessage({
            type: '${DECK_STATE_MESSAGE_TYPE}',
            protocolVersion: OD_DECK_PROTOCOL_VERSION,
            active: idx,
            count: slides.length
          }, '*');
        } catch (_) {}
      }
      function announceDeckProtocol() {
        try {
          window.parent.postMessage({
            type: '${DECK_READY_MESSAGE_TYPE}',
            protocolVersion: OD_DECK_PROTOCOL_VERSION,
            capabilities: ${JSON.stringify(DECK_PROTOCOL_V1_CAPABILITIES)}
          }, '*');
        } catch (_) {}
      }
      window.addEventListener('message', function (event) {
        var data = event && event.data;
        if (!data || data.type !== '${DECK_NAVIGATE_MESSAGE_TYPE}') return;
        if (data.protocolVersion != null && data.protocolVersion !== OD_DECK_PROTOCOL_VERSION) return;
        var target = idx;
        if (data.action === 'go') {
          if (typeof data.index !== 'number' || !isFinite(data.index)) return;
          target = Math.floor(data.index);
        } else if (data.action === 'next') target = idx + 1;
        else if (data.action === 'prev') target = idx - 1;
        else if (data.action === 'first') target = 0;
        else if (data.action === 'last') target = slides.length - 1;
        else return;
        go(target);
      });`;
export {
  DECK_NAVIGATE_MESSAGE_TYPE,
  DECK_PROTOCOL_V1_CAPABILITIES,
  DECK_PROTOCOL_V1_INLINE_RUNTIME,
  DECK_PROTOCOL_VERSION,
  DECK_READY_MESSAGE_TYPE,
  DECK_STATE_MESSAGE_TYPE
};
