import functionGeneratorOnImage from '../assets/FunctionGenerator_ON.png'
import functionGeneratorOffImage from '../assets/FunctionGenerator_OFF.png'
import noobImage from '../assets/noob.png'

import {
  getTerminalConnectedClass,
  getTerminalHighlightClass,
  getTerminalNumberHighlightClass,
} from '../utils/terminalHighlight.js'

const FREQUENCY_VALUES_KHZ = [
  1.0,
  1.5,
  2.0,
  2.5,
  3.0,
  3.5,
  4.0,
  4.5,
  5.0,
  5.5,
  6.0,
  6.5,
  7.0,
  7.5,
  8.0,
  8.5,
  9.0,
  9.5,
  10.0,
]

const FunctionGenerator = ({
  generatorOn = false,
  frequency = 1.0,
  connectedTerminalIds = [],
  highlightedTerminalIds = [],
  onToggleGenerator,
  onFrequencyChange,
}) => {
  const safeFrequency = Number.isFinite(Number(frequency))
    ? Number(frequency)
    : 1.0

  const frequencyIndex = Math.min(
    Math.max(
      Math.round(
        (safeFrequency - 1.0) / 0.5,
      ),
      0,
    ),
    FREQUENCY_VALUES_KHZ.length - 1,
  )

  const selectedFrequency =
    FREQUENCY_VALUES_KHZ[frequencyIndex]

  /*
   * Percentage used to move the physical knob.
   *
   * 1.0 kHz  -> 0%
   * 10.0 kHz -> 100%
   */
  const knobPosition =
  8 +
  (frequencyIndex /
    (FREQUENCY_VALUES_KHZ.length - 1)) *
    84

  return (
    <article
      className="function-generator"
      id="function-generator"
      aria-label={
        generatorOn
          ? `Function Generator is ON at ${selectedFrequency.toFixed(1)} kHz`
          : 'Function Generator is OFF'
      }
    >
      {/* =================================
          FUNCTION GENERATOR IMAGE
      ================================= */}

      <button
        type="button"
        className="function-generator__button"
        id="function-generator-button"
        aria-label={
          generatorOn
            ? 'Function Generator is ON'
            : 'Turn Function Generator ON'
        }
        aria-pressed={generatorOn}
        onClick={onToggleGenerator}
      >
        <img
          src={
            generatorOn
              ? functionGeneratorOnImage
              : functionGeneratorOffImage
          }
          alt={
            generatorOn
              ? 'Function Generator ON'
              : 'Function Generator OFF'
          }
          className="function-generator__image"
          draggable="false"
        />
      </button>

      {/* =================================
          FREQUENCY DISPLAY
          Positioned over the existing
          display area of the image.
      ================================= */}

      <div
        className={`function-generator__frequency-display ${
          generatorOn
            ? 'function-generator__frequency-display--on'
            : ''
        }`}
        aria-live="polite"
      >
        Fq ={' '}
        {generatorOn
          ? `${selectedFrequency.toFixed(1)} kHz`
          : '0 kHz'}
      </div>

      {/* =================================
          INVISIBLE RANGE CONTROL
          
          The actual visible slider line
          already exists inside the PNG.
          
          This input is only the interaction
          layer.
      ================================= */}

      <input
        id="function-generator-frequency"
        className="function-generator__frequency-input"
        type="range"
        min="0"
        max={FREQUENCY_VALUES_KHZ.length - 1}
        step="1"
        value={frequencyIndex}
        disabled={!generatorOn}
        aria-label="Function Generator frequency"
        aria-valuemin="1.0"
        aria-valuemax="10.0"
        aria-valuenow={selectedFrequency}
        aria-valuetext={`${selectedFrequency.toFixed(1)} kHz`}
        onChange={(event) => {
          const index = Number(event.target.value)

          const newFrequency =
            FREQUENCY_VALUES_KHZ[index]

          if (
            Number.isFinite(newFrequency)
          ) {
            onFrequencyChange?.(
              newFrequency,
            )
          }
        }}
      />

      {/* =================================
          PHYSICAL SLIDER KNOB
          
          This is YOUR noob.png image.
      ================================= */}

      <img
        src={noobImage}
        alt=""
        aria-hidden="true"
        draggable="false"
        className={`function-generator__slider-knob ${
          generatorOn
            ? 'function-generator__slider-knob--active'
            : 'function-generator__slider-knob--disabled'
        }`}
        style={{
          left: `${knobPosition}%`,
        }}
      />

      {/* =================================
          TERMINAL 13 - RED / PLUS
      ================================= */}

      <span
        id="13-endpoint"
        className={`connection-terminal
          connection-terminal--function-generator
          connection-terminal--function-generator-13
          connection-terminal--endpoint-13
          function-generator-terminal--13
          ${getTerminalConnectedClass(
            connectedTerminalIds,
            '13-endpoint',
          )}
          ${getTerminalHighlightClass(
            highlightedTerminalIds,
            '13-endpoint',
          )}`}
        data-polarity="plus"
        aria-label="Function Generator positive terminal 13"
        title="Drag to connect terminal 13"
      />

      <span
        className={`terminal-number-label
          terminal-number-label--endpoint-13
          ${getTerminalNumberHighlightClass(
            highlightedTerminalIds,
            '13-endpoint',
          )}`}
        data-terminal-id="13-endpoint"
        title="Terminal 13. Click to disconnect."
      >
        13
      </span>

      {/* =================================
          TERMINAL 14 - BLACK / MINUS
      ================================= */}

      <span
        id="14-endpoint"
        className={`connection-terminal
          connection-terminal--function-generator
          connection-terminal--function-generator-14
          connection-terminal--endpoint-14
          function-generator-terminal--14
          ${getTerminalConnectedClass(
            connectedTerminalIds,
            '14-endpoint',
          )}
          ${getTerminalHighlightClass(
            highlightedTerminalIds,
            '14-endpoint',
          )}`}
        data-polarity="minus"
        aria-label="Function Generator negative terminal 14"
        title="Drag to connect terminal 14"
      />

      <span
        className={`terminal-number-label
          terminal-number-label--endpoint-14
          ${getTerminalNumberHighlightClass(
            highlightedTerminalIds,
            '14-endpoint',
          )}`}
        data-terminal-id="14-endpoint"
        title="Terminal 14. Click to disconnect."
      >
        14
      </span>

      {/* =================================
          TERMINAL 15 - RED / PLUS
      ================================= */}

      <span
        id="15-endpoint"
        className={`connection-terminal
          connection-terminal--function-generator
          connection-terminal--function-generator-15
          connection-terminal--endpoint-15
          function-generator-terminal--15
          ${getTerminalConnectedClass(
            connectedTerminalIds,
            '15-endpoint',
          )}
          ${getTerminalHighlightClass(
            highlightedTerminalIds,
            '15-endpoint',
          )}`}
        data-polarity="plus"
        aria-label="Function Generator positive terminal 15"
        title="Drag to connect terminal 15"
      />

      <span
        className={`terminal-number-label
          terminal-number-label--endpoint-15
          ${getTerminalNumberHighlightClass(
            highlightedTerminalIds,
            '15-endpoint',
          )}`}
        data-terminal-id="15-endpoint"
        title="Terminal 15. Click to disconnect."
      >
        15
      </span>

      {/* =================================
          TERMINAL 16 - BLACK / MINUS
      ================================= */}

      <span
        id="16-endpoint"
        className={`connection-terminal
          connection-terminal--function-generator
          connection-terminal--function-generator-16
          connection-terminal--endpoint-16
          function-generator-terminal--16
          ${getTerminalConnectedClass(
            connectedTerminalIds,
            '16-endpoint',
          )}
          ${getTerminalHighlightClass(
            highlightedTerminalIds,
            '16-endpoint',
          )}`}
        data-polarity="minus"
        aria-label="Function Generator negative terminal 16"
        title="Drag to connect terminal 16"
      />

      <span
        className={`terminal-number-label
          terminal-number-label--endpoint-16
          ${getTerminalNumberHighlightClass(
            highlightedTerminalIds,
            '16-endpoint',
          )}`}
        data-terminal-id="16-endpoint"
        title="Terminal 16. Click to disconnect."
      >
        16
      </span>
    </article>
  )
}

export default FunctionGenerator