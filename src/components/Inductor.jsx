import inductorImage from '../assets/inductor.png'

import {
  getTerminalConnectedClass,
  getTerminalHighlightClass,
  getTerminalNumberHighlightClass,
} from '../utils/terminalHighlight.js'

const Inductor = ({
  connectedTerminalIds = [],
  highlightedTerminalIds = [],
}) => {
  return (
    <article
      className="inductor"
      id="inductor"
      aria-label="Inductor"
    >
      {/* =========================
          INDUCTOR IMAGE
      ========================= */}

      <img
        src={inductorImage}
        alt="Inductor"
        className="inductor__image"
        draggable="false"
      />

      {/* =========================
          TERMINAL 9 - RED / PLUS
      ========================= */}

      <span
        id="9-endpoint"
        className={`connection-terminal
          connection-terminal--inductor
          connection-terminal--inductor-9
          connection-terminal--endpoint-9
          ${getTerminalConnectedClass(
            connectedTerminalIds,
            '9-endpoint'
          )}
          ${getTerminalHighlightClass(
            highlightedTerminalIds,
            '9-endpoint'
          )}`}
        data-polarity="plus"
        aria-label="Inductor positive terminal 9"
        title="Drag to connect terminal 9"
      />

      <span
        className={`terminal-number-label
          terminal-number-label--endpoint-9
          ${getTerminalNumberHighlightClass(
            highlightedTerminalIds,
            '9-endpoint'
          )}`}
        data-terminal-id="9-endpoint"
        title="Terminal 9. Click to disconnect."
      >
        9
      </span>

      {/* =========================
          TERMINAL 10 - BLACK / MINUS
      ========================= */}

      <span
        id="10-endpoint"
        className={`connection-terminal
          connection-terminal--inductor
          connection-terminal--inductor-10
          connection-terminal--endpoint-10
          ${getTerminalConnectedClass(
            connectedTerminalIds,
            '10-endpoint'
          )}
          ${getTerminalHighlightClass(
            highlightedTerminalIds,
            '10-endpoint'
          )}`}
        data-polarity="minus"
        aria-label="Inductor negative terminal 10"
        title="Drag to connect terminal 10"
      />

      <span
        className={`terminal-number-label
          terminal-number-label--endpoint-10
          ${getTerminalNumberHighlightClass(
            highlightedTerminalIds,
            '10-endpoint'
          )}`}
        data-terminal-id="10-endpoint"
        title="Terminal 10. Click to disconnect."
      >
        10
      </span>
    </article>
  )
}

export default Inductor