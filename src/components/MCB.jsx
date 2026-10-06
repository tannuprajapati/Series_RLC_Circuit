import mcbOffImage from '../assets/MCB_OFF.jpeg'
import mcbOnImage from '../assets/MCB_ON.jpeg'

import {
  getTerminalConnectedClass,
  getTerminalHighlightClass,
  getTerminalNumberHighlightClass,
} from '../utils/terminalHighlight.js'

const MCB = ({
  mcbOn = false,
  connectedTerminalIds = [],
  highlightedTerminalIds = [],
  onToggleMcb,
}) => {
  return (
    <article
      className="equipment-panel__mcb"
      id="mcb"
      aria-label={mcbOn ? 'MCB is ON' : 'MCB is OFF'}
    >

      {/* MCB image */}
      <button
        type="button"
        id="mcb-button"
        className="mcb__button"
        aria-label={mcbOn ? 'MCB is ON' : 'Turn MCB ON'}
        aria-pressed={mcbOn}
        disabled={mcbOn}
        onClick={onToggleMcb}
      >
        <img
          src={mcbOn ? mcbOnImage : mcbOffImage}
          alt={mcbOn ? 'MCB ON' : 'MCB OFF'}
          className="mcb__image"
          draggable="false"
        />
      </button>

      {/* =========================
          TERMINAL 1
      ========================= */}

      <span
        id="1-endpoint"
        className={`connection-terminal connection-terminal--mcb connection-terminal--endpoint-1${getTerminalConnectedClass(
          connectedTerminalIds,
          '1-endpoint'
        )}${getTerminalHighlightClass(
          highlightedTerminalIds,
          '1-endpoint'
        )}`}
        data-polarity="plus"
        aria-label="MCB positive terminal 1"
      />
      <span
        className={`terminal-number-label 
          terminal-number-label--mcb 
          terminal-number-label--endpoint-1
          ${getTerminalNumberHighlightClass(
          highlightedTerminalIds,
          '1-endpoint'
        )}`}
        data-terminal-id="1-endpoint"
      >
        1
      </span>

      {/* =========================
          TERMINAL 2
      ========================= */}

      <span
        id="2-endpoint"
        className={`connection-terminal connection-terminal--mcb connection-terminal--mcb-minus connection-terminal--endpoint-2${getTerminalConnectedClass(
          connectedTerminalIds,
          '2-endpoint'
        )}${getTerminalHighlightClass(
          highlightedTerminalIds,
          '2-endpoint'
        )}`}
        data-polarity="minus"
        aria-label="MCB negative terminal 2"
      />

      <span
        className={`terminal-number-label terminal-number-label--mcb terminal-number-label--endpoint-2${getTerminalNumberHighlightClass(
          highlightedTerminalIds,
          '2-endpoint'
        )}`}
        data-terminal-id="2-endpoint"
      >
        2
      </span>

    </article>
  )
}

export default MCB