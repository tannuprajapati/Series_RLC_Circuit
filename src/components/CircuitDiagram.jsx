import {
  getTerminalConnectedClass,
  getTerminalHighlightClass,
  getTerminalNumberHighlightClass,
} from '../utils/terminalHighlight.js'

import resistorImage from '../assets/Resistor.png'

const CircuitDiagram = ({
  connectedTerminalIds = [],
  highlightedTerminalIds = [],
}) => {
  return (
    <section className="circuit-panel" id="circuit-panel">
      <div className="circuit-panel__stage">

        {/* RESISTOR */}
        <div className="circuit-component circuit-component--resistor">

          <img
            src={resistorImage}
            alt="Resistor"
            className="circuit-component__resistor-image"
            draggable="false"
          />

          {/* Terminal 7 */}
          <span
            id="7-endpoint"
            className={`connection-terminal connection-terminal--resistor connection-terminal--endpoint-7
              ${getTerminalConnectedClass(connectedTerminalIds, '7-endpoint')}
              ${getTerminalHighlightClass(highlightedTerminalIds, '7-endpoint')}`}
            data-polarity="plus"
            aria-label="Resistor terminal 7"
            title="Drag to connect terminal 7"
          />

          <span
            className={`terminal-number-label terminal-number-label--resistor
              terminal-number-label--endpoint-7
              ${getTerminalNumberHighlightClass(highlightedTerminalIds, '7-endpoint')}`}
            data-terminal-id="7-endpoint"
            title="Terminal 7. Click to disconnect."
          >
            7
          </span>

          {/* Terminal 8 */}
          <span
            id="8-endpoint"
            className={`connection-terminal connection-terminal--resistor connection-terminal--endpoint-8
              ${getTerminalConnectedClass(connectedTerminalIds, '8-endpoint')}
              ${getTerminalHighlightClass(highlightedTerminalIds, '8-endpoint')}`}
            data-polarity="minus"
            aria-label="Resistor terminal 8"
            title="Drag to connect terminal 8"
          />

          <span
            className={`terminal-number-label terminal-number-label--resistor
              terminal-number-label--endpoint-8
              ${getTerminalNumberHighlightClass(highlightedTerminalIds, '8-endpoint')}`}
            data-terminal-id="8-endpoint"
            title="Terminal 8. Click to disconnect."
          >
            8
          </span>

        </div>

      </div>
    </section>
  )
}

export default CircuitDiagram