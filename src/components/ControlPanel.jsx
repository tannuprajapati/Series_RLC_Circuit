import ObservationTable from './ObservationTable.jsx'
import ReportControls from './ReportControls.jsx'

const ControlPanel = ({
  observations = [],

  calculationUnlocked = false,
  calculationVerified = false,

  onGenerateReport,
  reportGenerated,
}) => (
  <>
    {/* =========================
        OBSERVATION TABLE
        Maximum = 8 readings
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
    />
  </>
)

export default ControlPanel