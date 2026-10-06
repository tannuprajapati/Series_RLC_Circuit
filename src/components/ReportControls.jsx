import { useState } from 'react'
import { FormulaIcon, PdfIcon } from './Icons.jsx'

const ResonanceFrequencyFormula = () => (
  <div
    aria-label="Resonance frequency equals one divided by two pi square root of L C"
    className="floating-formula-panel__equation-row"
  >
    <span className="floating-formula-panel__symbol">
      f<sub>r</sub>
    </span>

    <span aria-hidden="true">=</span>

    <span
      className="floating-formula-panel__fraction"
      aria-hidden="true"
    >
      <span className="floating-formula-panel__numerator">
        1
      </span>

      <span className="floating-formula-panel__denominator">
        2&pi;&radic;(LC)
      </span>
    </span>
  </div>
)

const QualityFactorFormula = () => (
  <div
    aria-label="Quality factor equals one divided by R multiplied by square root of L divided by C"
    className="floating-formula-panel__equation-row"
  >
    <span className="floating-formula-panel__symbol">
      Q
    </span>

    <span aria-hidden="true">=</span>

    <span
      className="floating-formula-panel__fraction"
      aria-hidden="true"
    >
      <span className="floating-formula-panel__numerator">
        1
      </span>

      <span className="floating-formula-panel__denominator">
        R
      </span>
    </span>

    <span aria-hidden="true">
      &radic;
      <span className="floating-formula-panel__radicand">
        L/C
      </span>
    </span>
  </div>
)

const ReportControls = ({
  onGenerateReport,
  reportGenerated,
  theoremVerified,
}) => {
  const [formulasOpen, setFormulasOpen] = useState(false)

  return (
    <div className="report-controls">

      {/* FORMULA POPUP */}
      {formulasOpen && (
        <aside
          aria-labelledby="formula-panel-title"
          aria-modal="true"
          className="floating-formula-panel"
          id="equations-panel"
          role="dialog"
        >
          <div className="floating-formula-panel__header">
            <h3 id="formula-panel-title">
              FORMULA
            </h3>

            <button
              aria-label="Close formula panel"
              className="floating-formula-panel__close"
              type="button"
              onClick={() => setFormulasOpen(false)}
            >
              &times;
            </button>
          </div>

          <div className="floating-formula-panel__content">

            {/* Resonance Frequency */}
            <section className="floating-formula-panel__section">
              <h4>
                Resonance Frequency
              </h4>

              <p className="floating-formula-panel__description">
                The resonance frequency of a series RLC circuit
                is the frequency at which the inductive reactance
                and capacitive reactance are equal.
              </p>

              <div className="floating-formula-panel__formula">
                <strong className="floating-formula-panel__formula-label">
                  Formula
                </strong>

                <ResonanceFrequencyFormula />
              </div>
            </section>

            {/* Quality Factor */}
            <section className="floating-formula-panel__section">
              <h4>
                Quality Factor
              </h4>

              <p className="floating-formula-panel__description">
                The quality factor represents the sharpness of
                resonance in the series RLC circuit.
              </p>

              <div className="floating-formula-panel__formula">
                <strong className="floating-formula-panel__formula-label">
                  Formula
                </strong>

                <QualityFactorFormula />
              </div>
            </section>

            {/* Symbols */}
            <section className="floating-formula-panel__section">
              <h4>
                Symbols
              </h4>

              <div className="floating-formula-panel__description">
                <p>
                  <strong>
                    f<sub>r</sub>
                  </strong>{' '}
                  = Resonance frequency
                </p>

                <p>
                  <strong>R</strong>{' '}
                  = Resistance
                </p>

                <p>
                  <strong>L</strong>{' '}
                  = Inductance
                </p>

                <p>
                  <strong>C</strong>{' '}
                  = Capacitance
                </p>

                <p>
                  <strong>Q</strong>{' '}
                  = Quality factor
                </p>
              </div>
            </section>

          </div>
        </aside>
      )}

      {/* GENERATE REPORT BUTTON */}
      <button
        id="generate-report-button"
        type="button"
        className="report-button"
        disabled={!theoremVerified}
        aria-label="Generate Report"
        data-report-generated={
          reportGenerated ? 'true' : 'false'
        }
        onClick={onGenerateReport}
      >
        <PdfIcon />
        <span>
          Generate Report
        </span>
      </button>

      {/* FORMULA BUTTON */}
      <button
        id="formula-button"
        type="button"
        className="formula-button"
        aria-controls="equations-panel"
        aria-expanded={formulasOpen}
        onClick={() =>
          setFormulasOpen((current) => !current)
        }
      >
        <FormulaIcon />
        <span>
          Formula
        </span>
      </button>

    </div>
  )
}

export default ReportControls