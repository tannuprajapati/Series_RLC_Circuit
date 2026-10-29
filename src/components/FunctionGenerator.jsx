import functionGeneratorOnImage from '../assets/FunctionGenerator_ON.png'
import functionGeneratorOffImage from '../assets/FunctionGenerator_OFF.png'
import knobImage from '../assets/knob.png'

import { useEffect, useRef } from 'react'

import {
  getTerminalConnectedClass,
  getTerminalHighlightClass,
  getTerminalNumberHighlightClass,
} from '../utils/terminalHighlight.js'

const FREQUENCY_VALUES_KHZ = [
  1.0,
  2.0,
  3.0,
  4.0,
  5.0,
  6.0,
  7.0,
  8.0,
  9.0,
  10.0
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

  /*
   * Find the exact frequency index.
   *
   * IMPORTANT:
   * Frequencies are now:
   * 1, 2, 3, 4, 5, 6, 7, 8 kHz
   *
   * Do NOT use the old 0.5 step calculation here.
   */
  const foundFrequencyIndex =
    FREQUENCY_VALUES_KHZ.findIndex(
      (value) =>
        Math.abs(value - safeFrequency) < 0.001,
    )

  const frequencyIndex =
    foundFrequencyIndex >= 0
      ? foundFrequencyIndex
      : 0

  const selectedFrequency =
    FREQUENCY_VALUES_KHZ[frequencyIndex]

  /*
   * Physical slider position.
   *
   * 1.0 kHz -> 8%
   * 8.0 kHz -> 75%
   *
   * These values match the physical slider track
   * in the Function Generator image.
   */
  const SLIDER_START_PERCENT = 8
  const SLIDER_END_PERCENT = 75

  const knobPosition =
    SLIDER_START_PERCENT +
    (frequencyIndex /
      (FREQUENCY_VALUES_KHZ.length - 1)) *
      (SLIDER_END_PERCENT - SLIDER_START_PERCENT)

  /*
   * Keep track of the frequency that has actually
   * been displayed.
   */
  const currentFrequencyIndexRef =
    useRef(frequencyIndex)

  /*
   * Keep the latest requested target.
   *
   * If the user quickly drags:
   *
   * 1 -> 8
   *
   * the target becomes 8, but the displayed
   * frequency moves:
   *
   * 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8
   */
  const targetFrequencyIndexRef =
    useRef(frequencyIndex)

  const frequencyTimerRef =
    useRef(null)

  /*
   * Keep the internal index synchronized with
   * the actual frequency coming from the parent.
   */
  useEffect(() => {
    if (!frequencyTimerRef.current) {
      currentFrequencyIndexRef.current =
        frequencyIndex

      targetFrequencyIndexRef.current =
        frequencyIndex
    }
  }, [frequencyIndex])

  /*
   * Cleanup timer when component is removed.
   */
  useEffect(() => {
    return () => {
      if (frequencyTimerRef.current) {
        clearInterval(frequencyTimerRef.current)
        frequencyTimerRef.current = null
      }
    }
  }, [])

  /*
   * Move through every frequency one step at a time.
   */
  const moveFrequencySequentially = (
    targetIndex,
  ) => {
    const clampedTargetIndex = Math.min(
      Math.max(targetIndex, 0),
      FREQUENCY_VALUES_KHZ.length - 1,
    )

    /*
     * Always update the latest requested target.
     */
    targetFrequencyIndexRef.current =
      clampedTargetIndex

    /*
     * Already at target.
     */
    if (
      currentFrequencyIndexRef.current ===
      clampedTargetIndex
    ) {
      return
    }

    /*
     * A timer is already moving toward the target.
     *
     * We don't create another timer.
     * The existing timer will read the latest
     * targetFrequencyIndexRef value.
     */
    if (frequencyTimerRef.current) {
      return
    }

    frequencyTimerRef.current = setInterval(() => {
      const currentIndex =
        currentFrequencyIndexRef.current

      const targetIndex =
        targetFrequencyIndexRef.current

      /*
       * Target reached.
       */
      if (currentIndex === targetIndex) {
        clearInterval(
          frequencyTimerRef.current,
        )

        frequencyTimerRef.current = null

        return
      }

      /*
       * Decide direction.
       */
      const direction =
        targetIndex > currentIndex
          ? 1
          : -1

      /*
       * Move exactly ONE frequency step.
       */
      const nextIndex =
        currentIndex + direction

      currentFrequencyIndexRef.current =
        nextIndex

      const nextFrequency =
        FREQUENCY_VALUES_KHZ[nextIndex]

      if (Number.isFinite(nextFrequency)) {
        onFrequencyChange?.(
          nextFrequency,
        )
      }
    }, 120)
  }

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
        aria-valuemax="8.0"
        aria-valuenow={selectedFrequency}
        aria-valuetext={`${selectedFrequency.toFixed(1)} kHz`}
        onInput={(event) => {
          const targetIndex = Number(
            event.currentTarget.value,
          )

          if (
            Number.isInteger(targetIndex) &&
            targetIndex >= 0 &&
            targetIndex <
              FREQUENCY_VALUES_KHZ.length
          ) {
            moveFrequencySequentially(
              targetIndex,
            )
          }
        }}
      />

      {/* =================================
          PHYSICAL SLIDER KNOB

          This is YOUR knob.png image.
      ================================= */}

      <img
        src={knobImage}
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

     
      {/* =================================
          TERMINAL 15 - RED / PLUS
      ================================= */}

      <span
        id="1-endpoint"
        className={`connection-terminal
          connection-terminal--function-generator
          connection-terminal--function-generator-1
          connection-terminal--endpoint-1
          function-generator-terminal--1
          ${getTerminalConnectedClass(
            connectedTerminalIds,
            '1-endpoint',
          )}
          ${getTerminalHighlightClass(
            highlightedTerminalIds,
            '1-endpoint',
          )}`}
        data-polarity="plus"
        aria-label="Function Generator positive terminal 1"
        title="Drag to connect terminal 1"
      />

      <span
        className={`terminal-number-label
          terminal-number-label--endpoint-1
          ${getTerminalNumberHighlightClass(
            highlightedTerminalIds,
            '1-endpoint',
          )}`}
        data-terminal-id="1-endpoint"
        title="Terminal 1. Click to disconnect."
      >
        1
      </span>

      {/* =================================
          TERMINAL 16 - BLACK / MINUS
      ================================= */}

      <span
        id="2-endpoint"
        className={`connection-terminal
          connection-terminal--function-generator
          connection-terminal--function-generator-2
          connection-terminal--endpoint-2
          function-generator-terminal--2
          ${getTerminalConnectedClass(
            connectedTerminalIds,
            '2-endpoint',
          )}
          ${getTerminalHighlightClass(
            highlightedTerminalIds,
            '2-endpoint',
          )}`}
        data-polarity="minus"
        aria-label="Function Generator negative terminal 2"
        title="Drag to connect terminal 2"
      />

      <span
        className={`terminal-number-label
          terminal-number-label--endpoint-2
          ${getTerminalNumberHighlightClass(
            highlightedTerminalIds,
            '2-endpoint',
          )}`}
        data-terminal-id="2-endpoint"
        title="Terminal 2. Click to disconnect."
      >
        2
      </span>

    </article>
  )
}

export default FunctionGenerator