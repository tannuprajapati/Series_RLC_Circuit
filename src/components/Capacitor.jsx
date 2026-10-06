import capacitorImage from '../assets/Capacitor.png'

import {
  getTerminalConnectedClass,
  getTerminalHighlightClass,
  getTerminalNumberHighlightClass,
} from '../utils/terminalHighlight.js'

const Capacitor = ({
  connectedTerminalIds = [],
  highlightedTerminalIds = [],
}) => {
  return (
    <article
      className="capacitor"
      id="capacitor"
      aria-label="Capacitor"
    >
      {/* Capacitor image */}
      <img
        src={capacitorImage}
        alt="Capacitor"
        className="capacitor__image"
        draggable="false"
      />

      {/* =========================
          TERMINAL 11 - RED / PLUS
      ========================= */}

      <span
        id="11-endpoint"
        className={`connection-terminal
          connection-terminal--capacitor
          connection-terminal--capacitor-11
          connection-terminal--endpoint-11
          ${getTerminalConnectedClass(
            connectedTerminalIds,
            '11-endpoint'
          )}
          ${getTerminalHighlightClass(
            highlightedTerminalIds,
            '11-endpoint'
          )}`}
        data-polarity="plus"
        aria-label="Capacitor positive terminal 11"
        title="Drag to connect terminal 11"
      />

      <span
        className={`terminal-number-label
          terminal-number-label--endpoint-11
          ${getTerminalNumberHighlightClass(
            highlightedTerminalIds,
            '11-endpoint'
          )}`}
        data-terminal-id="11-endpoint"
        title="Terminal 11. Click to disconnect."
      >
        11
      </span>

      {/* =========================
          TERMINAL 12 - BLACK / MINUS
      ========================= */}

      <span
        id="12-endpoint"
        className={`connection-terminal
          connection-terminal--capacitor
          connection-terminal--capacitor-12
          connection-terminal--endpoint-12
          ${getTerminalConnectedClass(
            connectedTerminalIds,
            '12-endpoint'
          )}
          ${getTerminalHighlightClass(
            highlightedTerminalIds,
            '12-endpoint'
          )}`}
        data-polarity="minus"
        aria-label="Capacitor negative terminal 12"
        title="Drag to connect terminal 12"
      />

      <span
        className={`terminal-number-label
          terminal-number-label--endpoint-12
          ${getTerminalNumberHighlightClass(
            highlightedTerminalIds,
            '12-endpoint'
          )}`}
        data-terminal-id="12-endpoint"
        title="Terminal 12. Click to disconnect."
      >
        12
      </span>
    </article>
  )
}

export default Capacitor