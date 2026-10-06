import { useState } from 'react'
import { formatFixedNumber } from '../utils/numberFormat.js'

const DISPLAY_DECIMAL_PLACES = 2

const INPUT_FIELDS = {
  resonanceFrequency: {
    label: 'fr',
    fullLabel: 'Resonance Frequency',
    min: 0,
    max: 100,
    unit: 'kHz',
  },

  qualityFactor: {
    label: 'Q',
    fullLabel: 'Quality Factor',
    min: 0,
    max: 1000,
    unit: '',
  },
}

const getFrequencyFromObservation = (row) => {
  if (Number.isFinite(Number(row?.frequency))) {
    return Number(row.frequency)
  }

  return NaN
}

const getCurrentFromObservation = (row) => {
  if (Number.isFinite(Number(row?.currentMilliAmperes))) {
    return Number(row.currentMilliAmperes)
  }

  if (Number.isFinite(Number(row?.current))) {
    return Number(row.current) * 1000
  }

  return NaN
}

const preventMouseWheelAdjustment = (event) => {
  event.currentTarget.blur()
}

const CalculationPanel = ({
  calculationDone,
  observations = [],
  onGuideEvent,
  setUserCalculatedResonanceFrequency,
  setVerificationResult,
}) => {
  const [rlcInputs, setRlcInputs] = useState({
    resonanceFrequency: '',
    qualityFactor: '',
  })

  const [calculatedValues, setCalculatedValues] = useState({
    resonanceFrequency: '',
    qualityFactor: '',
  })

  const [invalidInputs, setInvalidInputs] = useState({
    resonanceFrequency: false,
    qualityFactor: false,
  })

  const handleInputChange = (parameter, value) => {
    const field = INPUT_FIELDS[parameter]

    // Allow empty input and maximum 2 digits after decimal.
    if (
      value !== '' &&
      !/^\d*(\.\d{0,2})?$/.test(value)
    ) {
      return
    }

    const numericValue = Number(value)

    if (
      value !== '' &&
      (
        !Number.isFinite(numericValue) ||
        numericValue < field.min ||
        numericValue > field.max
      )
    ) {
      return
    }

    setRlcInputs((current) => ({
      ...current,
      [parameter]: value,
    }))

    setInvalidInputs((current) => ({
      ...current,
      [parameter]: false,
    }))

    setCalculatedValues({
      resonanceFrequency: '',
      qualityFactor: '',
    })

    setUserCalculatedResonanceFrequency?.('')
    setVerificationResult?.('')
  }

  const renderInput = (parameter) => {
    const field = INPUT_FIELDS[parameter]

    return (
      <label className="fill-factor-input">
        <span className="fill-factor-input__symbol">
          {field.label === 'fr' ? (
            <>
              f<sub>r</sub>
            </>
          ) : (
            field.label
          )}
        </span>

        <input
          aria-label={`${field.fullLabel}${
            field.unit ? ` in ${field.unit}` : ''
          }`}
          aria-invalid={invalidInputs[parameter]}
          className={`maximum-power-input${
            invalidInputs[parameter]
              ? ' maximum-power-input--error'
              : ''
          }`}
          disabled={!calculationDone}
          max={field.max}
          min={field.min}
          onChange={(event) =>
            handleInputChange(
              parameter,
              event.target.value,
            )
          }
          onWheel={preventMouseWheelAdjustment}
          placeholder="Enter Value"
          step="any"
          type="number"
          value={rlcInputs[parameter]}
        />
      </label>
    )
  }

  const handleVerify = () => {
    if (!calculationDone) {
      return
    }

    if (observations.length < 8) {
      onGuideEvent?.({
        alertType: 'warning',
        description:
          'Please complete all 8 observations before verifying the calculation.',
        missingCount: 8 - observations.length,
        target: '#calculation-panel',
        title: 'Complete Observations',
        type: 'CALCULATION_OBSERVATIONS_REQUIRED',
      })

      return
    }

    const missingInputKeys = Object.entries(rlcInputs)
      .filter(([, value]) => value.trim() === '')
      .map(([parameter]) => parameter)

    if (missingInputKeys.length > 0) {
      setInvalidInputs((current) => ({
        ...current,
        ...Object.fromEntries(
          missingInputKeys.map((parameter) => [
            parameter,
            true,
          ]),
        ),
      }))

      onGuideEvent?.({
        alertType: 'warning',
        description:
          missingInputKeys.length === 1
            ? 'Please enter the required value, then click the “Verify” button.'
            : 'Please enter both values, then click the “Verify” button.',
        missingCount: missingInputKeys.length,
        target: '#calculation-panel',
        title: 'Input Required',
        type: 'CALCULATION_INPUT_REQUIRED',
      })

      return
    }

    const enteredResonanceFrequency = Number(
      rlcInputs.resonanceFrequency,
    )

    const enteredQualityFactor = Number(
      rlcInputs.qualityFactor,
    )

    if (
      !Number.isFinite(enteredResonanceFrequency) ||
      !Number.isFinite(enteredQualityFactor) ||
      enteredResonanceFrequency <= 0 ||
      enteredQualityFactor <= 0
    ) {
      setInvalidInputs({
        resonanceFrequency:
          !Number.isFinite(enteredResonanceFrequency) ||
          enteredResonanceFrequency <= 0,

        qualityFactor:
          !Number.isFinite(enteredQualityFactor) ||
          enteredQualityFactor <= 0,
      })

      onGuideEvent?.({
        alertType: 'warning',
        description:
          'Resonance frequency and quality factor must be greater than zero.',
        target: '#calculation-panel',
        title: 'Check the Values',
        type: 'CALCULATION_INPUT_INVALID',
      })

      return
    }

    /*
     * RLC experiment values.
     *
     * These values should match the R, L and C values
     * defined in App.jsx.
     *
     * R = 100 ohm
     * L = 0.5 H
     * C = 10 µF
     */
    const resistance = 100
    const inductance = 0.5
    const capacitance = 10e-6

    // Theoretical resonance frequency in Hz.
    const theoreticalFrequencyHz =
      1 /
      (
        2 *
        Math.PI *
        Math.sqrt(
          inductance * capacitance,
        )
      )

    // Convert Hz to kHz for the experiment UI.
    const theoreticalFrequencyKHz =
      theoreticalFrequencyHz / 1000

    // Theoretical quality factor.
    const theoreticalQualityFactor =
      (
        1 / resistance
      ) *
      Math.sqrt(
        inductance / capacitance,
      )

    const frequencyDisplay = formatFixedNumber(
      theoreticalFrequencyKHz,
      DISPLAY_DECIMAL_PLACES,
    )

    const qualityDisplay = formatFixedNumber(
      theoreticalQualityFactor,
      DISPLAY_DECIMAL_PLACES,
    )

    setCalculatedValues({
      resonanceFrequency: frequencyDisplay,
      qualityFactor: qualityDisplay,
    })

    /*
     * Tolerance used for manual verification.
     *
     * Frequency:
     * ±5%
     *
     * Quality factor:
     * ±5%
     */
    const frequencyTolerance =
      Math.max(
        theoreticalFrequencyKHz * 0.05,
        0.01,
      )

    const qualityTolerance =
      Math.max(
        theoreticalQualityFactor * 0.05,
        0.01,
      )

    const frequencyCorrect =
      Math.abs(
        enteredResonanceFrequency -
          theoreticalFrequencyKHz,
      ) <= frequencyTolerance

    const qualityCorrect =
      Math.abs(
        enteredQualityFactor -
          theoreticalQualityFactor,
      ) <= qualityTolerance

    if (frequencyCorrect && qualityCorrect) {
      setInvalidInputs({
        resonanceFrequency: false,
        qualityFactor: false,
      })

      setUserCalculatedResonanceFrequency?.(
        frequencyDisplay,
      )

      setVerificationResult?.(
        `✅ Verified Successfully: Resonance frequency = ${frequencyDisplay} kHz and Quality factor = ${qualityDisplay}.`,
      )

      onGuideEvent?.({
        isCorrect: true,
        calculatedResonanceFrequency:
          enteredResonanceFrequency,
        calculatedQualityFactor:
          enteredQualityFactor,
        theoreticalResonanceFrequency:
          theoreticalFrequencyKHz,
        theoreticalQualityFactor,
          type: 'VERIFICATION_RESULT',
      })

      return
    }

    setInvalidInputs({
      resonanceFrequency: !frequencyCorrect,
      qualityFactor: !qualityCorrect,
    })

    setUserCalculatedResonanceFrequency?.('')

    setVerificationResult?.(
      `Verification Failed. Expected approximately ${frequencyDisplay} kHz resonance frequency and ${qualityDisplay} quality factor.`,
    )

    onGuideEvent?.({
      calculatedResonanceFrequency:
        enteredResonanceFrequency,
      calculatedQualityFactor:
        enteredQualityFactor,
      isCorrect: false,
      theoreticalResonanceFrequency:
        theoreticalFrequencyKHz,
      theoreticalQualityFactor,
      type: 'VERIFICATION_RESULT',
    })
  }

  return (
    <section
      className="maximum-power-results"
      id="maximum-power-results"
    >
      <section
        className="analysis-card theoretical-calculation-panel"
        id="calculation-panel"
      >
        <header className="analysis-card__heading">
          <h2>
            RLC CALCULATION
          </h2>
        </header>

        <div className="theoretical-calculation-panel__body">

          {/* ================= RESONANCE FREQUENCY ================= */}
          <section className="fill-factor-card">

            <div
              aria-label="Resonance frequency formula"
              className="fill-factor-definition"
            >
              <span>
                Resonance Frequency
              </span>

              <span>
                =
              </span>

              <span className="fill-factor-fraction fill-factor-fraction--compact">
                <span>
                  1
                </span>

                <span>
                  2&pi;&radic;(LC)
                </span>
              </span>
            </div>

            <div className="fill-factor-calculation">

              <span className="fill-factor-calculation__equals">
                =
              </span>

              <span className="fill-factor-fraction">

                <span className="fill-factor-expression">
                  {renderInput('resonanceFrequency')}
                </span>

              </span>

              <span className="fill-factor-result__unit">
                kHz
              </span>

              <span>
                =
              </span>

              <output
                className="fill-factor-result"
                aria-label="Calculated resonance frequency"
              >
                {calculatedValues.resonanceFrequency || ' '}
              </output>

              <span className="fill-factor-result__unit">
                kHz
              </span>

            </div>
          </section>

          {/* ================= QUALITY FACTOR ================= */}
          <section className="fill-factor-card">

            <div
              aria-label="Quality factor formula"
              className="fill-factor-definition"
            >
              <span>
                Quality Factor
              </span>

              <span>
                =
              </span>

              <span className="fill-factor-fraction fill-factor-fraction--compact">
                <span>
                  1
                </span>

                <span>
                  R
                </span>
              </span>

              <span>
                &radic;(L/C)
              </span>
            </div>

            <div className="fill-factor-calculation">

              <span className="fill-factor-calculation__equals">
                =
              </span>

              <span className="fill-factor-fraction">

                <span className="fill-factor-expression">
                  {renderInput('qualityFactor')}
                </span>

              </span>

              <span>
                =
              </span>

              <output
                className="fill-factor-result"
                aria-label="Calculated quality factor"
              >
                {calculatedValues.qualityFactor || ' '}
              </output>

            </div>
          </section>

          {/* ================= VERIFY ================= */}
          <div className="maximum-power-verification">

            <button
              className="verify-btn"
              disabled={!calculationDone}
              onClick={handleVerify}
              type="button"
            >
              Verify
            </button>

          </div>

        </div>
      </section>
    </section>
  )
}

export default CalculationPanel