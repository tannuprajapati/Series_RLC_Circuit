
import SectionCard from './SectionCard.jsx'
import { formatCompactNumber } from '../utils/numberFormat.js'

const OBSERVATION_ROW_COUNT = 10
const DISPLAY_DECIMAL_PLACES = 2

const emptyRows = Array.from({
  length: OBSERVATION_ROW_COUNT,
})

const ObservationTable = ({
  observations = [],
}) => {
  return (
    <SectionCard
      className="observation-table-card"
      icon="table"
      id="observation-table-panel"
      title="OBSERVATION TABLE"
    >
      <div className="observation-table-wrap">
        <table className="observation-table observation-table--rlc">
          <caption className="sr-only">
            Frequency and current readings for the
            series RLC resonance experiment
          </caption>

          <thead>
            <tr>
              <th>S.No</th>
              <th>Frequency (kHz)</th>
              <th>Current (mA)</th>
            </tr>
          </thead>

          <tbody>
            {emptyRows.map((_, index) => {
              const row = observations[index]

              const frequency =
                typeof row?.frequency === 'number' &&
                Number.isFinite(row.frequency)
                  ? row.frequency
                  : null

              const current =
                typeof row?.currentMilliAmperes === 'number' &&
                Number.isFinite(row.currentMilliAmperes)
                  ? row.currentMilliAmperes
                  : typeof row?.current === 'number' &&
                      Number.isFinite(row.current)
                    ? row.current * 1000
                    : null

              const isReading =
                frequency !== null &&
                current !== null

              return (
                <tr
                  key={index}
                  className={
                    isReading
                      ? 'observation-table__reading-row'
                      : undefined
                  }
                >
                  <td>
                    {isReading ? index + 1 : ''}
                  </td>

                  <td>
                    {frequency !== null
                      ? formatCompactNumber(
                          frequency,
                          DISPLAY_DECIMAL_PLACES,
                        )
                      : ''}
                  </td>

                  <td>
                    {current !== null
                      ? formatCompactNumber(
                          current,
                          DISPLAY_DECIMAL_PLACES,
                        )
                      : ''}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </SectionCard>
  )
}

export default ObservationTable
