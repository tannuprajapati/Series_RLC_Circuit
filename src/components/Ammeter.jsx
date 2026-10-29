
import ammeterImg from '../assets/Ammeter.png'
import needleImg from '../assets/needle.png'
import {
  getTerminalConnectedClass,
  getTerminalHighlightClass,
  getTerminalNumberHighlightClass,
} from '../utils/terminalHighlight.js'
import { getMeterNeedleAngle } from '../utils/meterScale.js'

// Effective needle scale for the experiment.
const METER_MAX_CURRENT_MILLIAMPERES = 10

const ammeterImages = {
  A1: ammeterImg,
}

const terminalNumbers = {
  A1: { positive: 5, negative: 6 },
}

const Ammeter = ({
  connectedTerminalIds = [],
  highlightedTerminalIds = [],
  label,
  value = 0,
}) => {
  const terminals = terminalNumbers[label]

  // The current supplied by App.jsx is in amperes.
  const numericValue = Number(value)
  const currentAmperes =
    Number.isFinite(numericValue) && numericValue > 0
      ? numericValue
      : 0

  const currentMilliamperes = currentAmperes * 1000

  const displayCurrentMilliamperes = Math.min(
    currentMilliamperes,
    METER_MAX_CURRENT_MILLIAMPERES,
  )

  const angle = getMeterNeedleAngle({
    maxValue: METER_MAX_CURRENT_MILLIAMPERES,
    value: displayCurrentMilliamperes,
  })

  return (
    <article
      className={`ammeter ammeter--${label}`}
      id={`ammeter-${label.toLowerCase()}`}
      aria-label={`${label} ammeter reading ${currentMilliamperes.toFixed(2)} mA`}
    >
      <img
        src={ammeterImages[label]}
        alt={`${label} ammeter`}
        className="ammeter__image"
      />

      <span
        aria-hidden="true"
        className="meter-walkthrough-target meter-walkthrough-target--ammeter"
        id="ammeter-walkthrough-target"
      />

      <span
        id={`${terminals.positive}-endpoint`}
        className={`connection-terminal connection-terminal--meter connection-terminal--meter-plus connection-terminal--endpoint-${terminals.positive}${getTerminalConnectedClass(
          connectedTerminalIds,
          `${terminals.positive}-endpoint`,
        )}${getTerminalHighlightClass(
          highlightedTerminalIds,
          `${terminals.positive}-endpoint`,
        )}`}
        data-polarity="plus"
        aria-label={`${label} positive terminal ${terminals.positive}`}
      />

      <span
        className={`terminal-number-label terminal-number-label--meter-plus terminal-number-label--endpoint-${terminals.positive}${getTerminalNumberHighlightClass(
          highlightedTerminalIds,
          `${terminals.positive}-endpoint`,
        )}`}
        data-terminal-id={`${terminals.positive}-endpoint`}
      >
        {terminals.positive}
      </span>

      <span
        id={`${terminals.negative}-endpoint`}
        className={`connection-terminal connection-terminal--meter connection-terminal--meter-minus connection-terminal--endpoint-${terminals.negative}${getTerminalConnectedClass(
          connectedTerminalIds,
          `${terminals.negative}-endpoint`,
        )}${getTerminalHighlightClass(
          highlightedTerminalIds,
          `${terminals.negative}-endpoint`,
        )}`}
        data-polarity="minus"
        aria-label={`${label} negative terminal ${terminals.negative}`}
      />

      <span
        className={`terminal-number-label terminal-number-label--meter-minus terminal-number-label--endpoint-${terminals.negative}${getTerminalNumberHighlightClass(
          highlightedTerminalIds,
          `${terminals.negative}-endpoint`,
        )}`}
        data-terminal-id={`${terminals.negative}-endpoint`}
      >
        {terminals.negative}
      </span>

      <div
        className="ammeter__needle"
        style={{
          transform: `rotate(${angle}deg)`,
          transition: 'transform 0.15s linear',
        }}
      >
        <img
          src={needleImg}
          alt=""
          className="ammeter__needle-image"
        />
      </div>
    </article>
  )
}

export default Ammeter
