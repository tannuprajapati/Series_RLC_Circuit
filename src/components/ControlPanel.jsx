
import ObservationTable from './ObservationTable.jsx'
import ReportControls from './ReportControls.jsx'

const ControlPanel = ({
  observations = [],

  calculationUnlocked = false,
  calculationVerified = false,
  calculationDone = false,

  onGenerateReport,
  reportGenerated,
}) => (
  <>
    {/* =========================
        OBSERVATION TABLE
        Maximum = 10 readings
    ========================= */}

    <ObservationTable
      observations={observations}
    />

    {/* =========================
        FORMULA / REPORT
    ========================= */}

    <ReportControls
      onGenerateReport={onGenerateReport}
      reportGenerated={reportGenerated}
      calculationUnlocked={calculationUnlocked}
      calculationVerified={calculationVerified}
      calculationDone={calculationDone}
    />
  </>
)

export default ControlPanel
