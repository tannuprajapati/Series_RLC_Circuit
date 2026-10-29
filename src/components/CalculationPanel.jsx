
import { useMemo } from 'react'
import { useLabAlerts } from '../alerts/useLabAlerts.js'
import { formatFixedNumber } from '../utils/numberFormat.js'
import {
  calculateTheoreticalResonanceFrequency,
  calculateQualityFactor,
} from '../utils/circuitMath.js'
import { RLC_DEFAULTS } from '../utils/resistance.js'

const DISPLAY_DECIMAL_PLACES = 2
const REQUIRED_OBSERVATIONS = 10

const CalculationPanel = ({
  calculationDone,
  observations = [],
  onGuideEvent,
  onVerify,
}) => {
  const { showAlert } = useLabAlerts()

  const calculatedValues = useMemo(() => {
    const resonanceFrequencyHz =
      calculateTheoreticalResonanceFrequency(
        RLC_DEFAULTS.inductance,
        RLC_DEFAULTS.capacitance,
      )

    const resonanceFrequencyKHz = resonanceFrequencyHz / 1000

    const qualityFactor = calculateQualityFactor(
      RLC_DEFAULTS.resistance,
      RLC_DEFAULTS.inductance,
      RLC_DEFAULTS.capacitance,
    )

    return {
      resonanceFrequency: formatFixedNumber(
        resonanceFrequencyKHz,
        DISPLAY_DECIMAL_PLACES,
      ),
      qualityFactor: formatFixedNumber(
        qualityFactor,
        DISPLAY_DECIMAL_PLACES,
      ),
    }
  }, [])

  const handleVerify = () => {
    if (observations.length < REQUIRED_OBSERVATIONS) {
      const description =
        `Please complete all ${REQUIRED_OBSERVATIONS} observations before verifying the calculation.`

      showAlert({
        type: 'warning',
        title: 'Complete Observations',
        description,
        requiresConfirmation: true,
      })

      onGuideEvent?.({
        alertType: 'warning',
        title: 'Complete Observations',
        description,
        target: '#calculation-panel',
        type: 'CALCULATION_OBSERVATIONS_REQUIRED',
      })

      return
    }

    onVerify?.(true)

    const description =
      `Resonance Frequency: ${calculatedValues.resonanceFrequency} kHz\n` +
      `Quality Factor: ${calculatedValues.qualityFactor}`

    showAlert({
      type: 'success',
      title: 'Values Verified',
      description,
      requiresConfirmation: true,
      dedupeKey: 'rlc-values-verified',
      target: '#calculation-panel',
    })

    onGuideEvent?.({
      alertType: 'success',
      title: 'Values Verified',
      description:
        `Resonance frequency is ${calculatedValues.resonanceFrequency} kHz and quality factor is ${calculatedValues.qualityFactor}.`,
      target: '#calculation-panel',
      type: 'CALCULATION_VERIFIED',
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
          <h2>RLC CALCULATION</h2>
        </header>

        <div className="theoretical-calculation-panel__body">
          <section className="fill-factor-card">
            <div
              aria-label="Resonance frequency formula"
              className="fill-factor-definition"
            >
              <span>Resonance Frequency</span>
              <span>=</span>

              <span className="fill-factor-fraction fill-factor-fraction--compact">
                <span>1</span>
                <span>2&pi;&radic;(LC)</span>
              </span>
            </div>

            <div className="fill-factor-calculation">
              <span className="fill-factor-calculation__equals">
                =
              </span>

              <span className="fill-factor-expression">
                f<sub>r</sub>
              </span>

              <span className="fill-factor-result__unit">
                kHz
              </span>

              <span>=</span>

              <output
                className="fill-factor-result"
                aria-label="Calculated resonance frequency"
              >
                {calculatedValues.resonanceFrequency}
              </output>

              <span className="fill-factor-result__unit">
                kHz
              </span>
            </div>
          </section>

          <section className="fill-factor-card">
            <div
              aria-label="Quality factor formula"
              className="fill-factor-definition"
            >
              <span>Quality Factor</span>
              <span>=</span>

              <span className="fill-factor-fraction fill-factor-fraction--compact">
                <span>1</span>
                <span>R</span>
              </span>

              <span>&radic;(L/C)</span>
            </div>

            <div className="fill-factor-calculation">
              <span className="fill-factor-calculation__equals">
                =
              </span>

              <span className="fill-factor-expression">
                Q
              </span>

              <span>=</span>

              <output
                className="fill-factor-result"
                aria-label="Calculated quality factor"
              >
                {calculatedValues.qualityFactor}
              </output>
            </div>
          </section>

          <div className="maximum-power-verification">
            <button
              className="verify-btn"
              disabled={observations.length < REQUIRED_OBSERVATIONS}
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
