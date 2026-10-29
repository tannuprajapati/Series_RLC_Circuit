
import resistorImage from '../assets/Resistor.png'
import resistorConnectedImage from '../assets/resistor1.png'

import {
  getTerminalConnectedClass,
  getTerminalHighlightClass,
  getTerminalNumberHighlightClass,
} from '../utils/terminalHighlight.js'

const Resistor = ({
  connectedTerminalIds = [],
  highlightedTerminalIds = [],
}) => {
  const resistorConnected = [
    '7-endpoint',
    '8-endpoint',
  ].every((terminalId) =>
    connectedTerminalIds.includes(terminalId)
  )

  const currentResistorImage = resistorConnected
    ? resistorConnectedImage
    : resistorImage

  return (
    <article
      className="resistor"
      id="resistor"
      aria-label="Resistor"
    >
      {/* Resistor Image */}
      <img
        src={currentResistorImage}
        alt="Resistor"
        className="resistor__image"
        draggable="false"
      />

      {/* TERMINAL 7 - RED / PLUS */}
      <span
        id="7-endpoint"
        className={`connection-terminal
          connection-terminal--resistor-7
          connection-terminal--endpoint-7
          resistor-terminal--7
          ${getTerminalConnectedClass(
            connectedTerminalIds,
            '7-endpoint'
          )}
          ${getTerminalHighlightClass(
            highlightedTerminalIds,
            '7-endpoint'
          )}`}
        data-polarity="plus"
        aria-label="Resistor positive terminal 7"
        title="Drag to connect terminal 7"
      />

      <span
        className={`terminal-number-label
          terminal-number-label--endpoint-7
          ${getTerminalNumberHighlightClass(
            highlightedTerminalIds,
            '7-endpoint'
          )}`}
        data-terminal-id="7-endpoint"
        title="Terminal 7. Click to disconnect."
      >
        7
      </span>

      {/* TERMINAL 8 - BLACK / MINUS */}
      <span
        id="8-endpoint"
        className={`connection-terminal
          connection-terminal--resistor
          connection-terminal--resistor-8
          connection-terminal--endpoint-8
          resistor-terminal--8
          ${getTerminalConnectedClass(
            connectedTerminalIds,
            '8-endpoint'
          )}
          ${getTerminalHighlightClass(
            highlightedTerminalIds,
            '8-endpoint'
          )}`}
        data-polarity="minus"
        aria-label="Resistor negative terminal 8"
        title="Drag to connect terminal 8"
      />

      <span
        className={`terminal-number-label
          terminal-number-label--endpoint-8
          ${getTerminalNumberHighlightClass(
            highlightedTerminalIds,
            '8-endpoint'
          )}`}
        data-terminal-id="8-endpoint"
        title="Terminal 8. Click to disconnect."
      >
        8
      </span>
    </article>
  )
}

export default Resistor
