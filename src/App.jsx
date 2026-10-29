import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import ResonancePlot from './components/ResonancePlot.jsx'
import './App.css'
import './ConnectionEndpoints.css'

import ConnectionLab from './components/ConnectionLab.jsx'
import ActionButtons from './components/ActionButtons.jsx'
import ControlPanel from './components/ControlPanel.jsx'
import HeaderBoard from './components/HeaderBoard.jsx'
import WalkthroughStartButton from './walkthrough/components/WalkthroughStartButton.jsx'

import { useLabAlerts } from './alerts/useLabAlerts.js'
import { useAiGuideController } from './aiGuide/useAiGuideController.js'
import CalculationPanel from './components/CalculationPanel.jsx'
import { useWalkthrough } from './walkthrough/useWalkthrough.js'


/* =========================================================
   RLC EXPERIMENT CONFIGURATION
   ========================================================= */

const BASE_WIDTH = 1152
const DEFAULT_CONTENT_HEIGHT = 1440
const PANEL_VIEWPORT_GUTTER = 0

// Series RLC values.
// Change these later if your experiment requires different
// component values.
const RLC_VALUES = {
  resistance: 100,
  inductance: 12.47e-3,  // 12.47 mH
  capacitance: 0.22e-6,  // 0.22 µF
  supplyVoltage: 20,
}


// Frequency range for the experiment.
const FREQUENCY_VALUES = [
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

// Maximum number of observation rows.
const MAX_OBSERVATIONS = 10


/* =========================================================
   LAYOUT HELPERS
   ========================================================= */

const getAvailableWidth = () => {
  if (typeof window === 'undefined') {
    return BASE_WIDTH
  }

  return (
    document.body?.clientWidth
    || document.documentElement.clientWidth
    || window.innerWidth
  ) - (PANEL_VIEWPORT_GUTTER * 2)
}

const getScale = () => Math.min(
  Math.max(getAvailableWidth() / BASE_WIDTH, 0.1),
  1,
)


/* =========================================================
   RLC CALCULATIONS
*/



const EXPECTED_CURRENT_READINGS = [
  { frequency: 1, currentMilliAmperes: 3.6 },
  { frequency: 2, currentMilliAmperes: 7.0 },
  { frequency: 3, currentMilliAmperes: 10.0 },
  { frequency: 4, currentMilliAmperes: 8.8 },
  { frequency: 5, currentMilliAmperes: 7.2 },
  { frequency: 6, currentMilliAmperes: 6.0 },
  { frequency: 7, currentMilliAmperes: 5.2 },
  { frequency: 8, currentMilliAmperes: 4.6 },
  { frequency: 9, currentMilliAmperes: 4.2 },
  { frequency: 10, currentMilliAmperes: 3.8 },
]

const calculateRlcReading = ({
  frequency,
  voltage,
  resistance,
  inductance,
  capacitance,
  circuitOn,
}) => {
  const emptyReading = {
    xl: 0,
    xc: 0,
    impedance: 0,
    current: 0,
    phaseAngle: 0,
    power: 0,
    resistorVoltage: 0,
  }

  if (
    !circuitOn ||
    frequency <= 0 ||
    voltage <= 0 ||
    resistance <= 0 ||
    inductance <= 0 ||
    capacitance <= 0
  ) {
    return emptyReading
  }

  const frequencyHz = frequency * 1000

  const XL = 2 * Math.PI * frequencyHz * inductance
  const XC = 1 / (2 * Math.PI * frequencyHz * capacitance)
  const reactanceDifference = XL - XC

  const impedance = Math.sqrt(
    resistance ** 2 + reactanceDifference ** 2
  )

  // Find the adjacent reference readings.
  const readings = EXPECTED_CURRENT_READINGS
  const boundedFrequency = Math.min(
    Math.max(frequency, readings[0].frequency),
    readings[readings.length - 1].frequency,
  )

  let lower = readings[0]
  let upper = readings[readings.length - 1]

  for (let i = 0; i < readings.length - 1; i += 1) {
    if (
      boundedFrequency >= readings[i].frequency &&
      boundedFrequency <= readings[i + 1].frequency
    ) {
      lower = readings[i]
      upper = readings[i + 1]
      break
    }
  }

  const fraction =
    upper.frequency === lower.frequency
      ? 0
      : (boundedFrequency - lower.frequency) /
      (upper.frequency - lower.frequency)

  // Smoothly interpolate current between reference points.
  const currentMilliAmperes =
    lower.currentMilliAmperes +
    fraction *
    (upper.currentMilliAmperes - lower.currentMilliAmperes)

  // Keep current in amperes for the existing ammeter.
  const current = currentMilliAmperes / 1000

  const phaseAngle =
    Math.atan2(reactanceDifference, resistance) *
    (180 / Math.PI)

  const power = current ** 2 * resistance
  const resistorVoltage = current * resistance

  return {
    xl: XL,
    xc: XC,
    impedance,
    current,
    phaseAngle,
    power,
    resistorVoltage,
  }
}



const calculateTheoreticalResonanceFrequency = (
  inductance,
  capacitance,
) => {
  if (
    !Number.isFinite(inductance)
    || !Number.isFinite(capacitance)
    || inductance <= 0
    || capacitance <= 0
  ) {
    return 0
  }

  return 1 / (
    2 * Math.PI * Math.sqrt(inductance * capacitance)
  )
}


/* =========================================================
   APP
   ========================================================= */

const App = () => {
  /* -------------------------------------------------------
     Existing application services
     ------------------------------------------------------- */

  const {
    clearAlerts,
    confirmAlert,
    dismissAlert,
    showStepAlert,
  } = useLabAlerts()

  const { completionCount } = useWalkthrough()

  const {
    activeInstructionId,
    notify: notifyGuide,
    replayCurrentInstruction,
    state: guideState,
  } = useAiGuideController({
    clearAlerts,
    confirmAlert,
    dismissAlert,
    onAudioError: () => {
      setStatus(
        'AI Guide could not play its configured audio file.',
      )
    },
    showStepAlert,
  })


  /* -------------------------------------------------------
     Layout state
     ------------------------------------------------------- */

  const [scale, setScale] = useState(getScale)

  const [contentHeight, setContentHeight] = useState(
    DEFAULT_CONTENT_HEIGHT,
  )

  const postSimulationContentRef = useRef(null)

  const walkthroughCompletionRef = useRef(0)

  const viewportMetricsRef = useRef({
    devicePixelRatio:
      typeof window === 'undefined'
        ? 1
        : window.devicePixelRatio,

    outerWidth:
      typeof window === 'undefined'
        ? BASE_WIDTH
        : window.outerWidth,
  })


  /* -------------------------------------------------------
     RLC experiment state
     ------------------------------------------------------- */


  // Function generator
  const [generatorOn, setGeneratorOn] = useState(false)

  // Frequency control
  const [frequency, setFrequency] = useState(1.0)
  const [frequencyChanged, setFrequencyChanged] = useState(false)

  // Supply voltage
  const [voltage, setVoltage] = useState(
    RLC_VALUES.supplyVoltage,
  )


  // Circuit connection state.
  const [connectionsMade, setConnectionsMade] = useState(false)

  // CHECK button result.
  const [checkCompleted, setCheckCompleted] = useState(false)

  // Final verified circuit state.
  const [connectionsVerified, setConnectionsVerified] =
    useState(false)

  // Observation table.
  const [observations, setObservations] = useState([])

  // Plot/calculation state.
  const [calculationDone, setCalculationDone] = useState(false)

  const [
    calculationVerified,
    setCalculationVerified,
  ] = useState(false)

  const [calculatedValues, setCalculatedValues] =
    useState(null)

  const [, setUserCalculatedFillFactor] = useState('')

  // Report state.
  const [reportGenerated, setReportGenerated] = useState(false)

  const [reportPrinted, setReportPrinted] = useState(false)

  // Request counters used by ConnectionLab.
  const [checkRequest, setCheckRequest] = useState(0)

  const [resetRequest, setResetRequest] = useState(0)

  const [autoConnectRequest, setAutoConnectRequest] =
    useState(0)


  const [status, setStatus] = useState(
    'Make all 7 required RLC circuit connections.',
  )
  const [sessionStart, setSessionStart] = useState(
    () => Date.now(),
  )

  /* -------------------------------------------------------
     Theoretical resonance frequency
     ------------------------------------------------------- */

  const theoreticalResonanceFrequency =
    calculateTheoreticalResonanceFrequency(
      RLC_VALUES.inductance,
      RLC_VALUES.capacitance,
    )


  /* -------------------------------------------------------
     Current RLC reading
     ------------------------------------------------------- */

  const currentReading = calculateRlcReading({
    frequency,
    voltage,
    resistance: RLC_VALUES.resistance,
    inductance: RLC_VALUES.inductance,
    capacitance: RLC_VALUES.capacitance,
    circuitOn: (
      connectionsVerified &&
      checkCompleted &&
      generatorOn
    ),
  })

  /* -------------------------------------------------------
     CHECK
     ------------------------------------------------------- */

  const handleCheckConnections = useCallback(
    (result) => {
      void notifyGuide({
        result,
        type: 'CHECK_RESULT',
      })

      if (result?.isCorrect) {
        setConnectionsMade(true)
        setCheckCompleted(true)
        setConnectionsVerified(true)
        setStatus(
          'Right Connections! Now turn ON the Function Generator.',
        )
        return
      }

      setCheckCompleted(false)
      setConnectionsVerified(false)

      if (!result?.totalConnections) {
        setStatus(
          'Make all 7 required connections before CHECK.',
        )

        return
      }

      setStatus(
        'Invalid connections. Check the terminal labels and try again.',
      )
    },
    [notifyGuide],
  )


  const handleCheck = useCallback(() => {
    if (!connectionsMade) {
      setStatus(
        'Make all 7 required connections before CHECK.',
      )

      return
    }

    setCheckRequest((current) => current + 1)
  }, [connectionsMade])


  /* -------------------------------------------------------
     AUTO CONNECT
     ------------------------------------------------------- */

  const handleAutoConnect = useCallback(() => {
    setAutoConnectRequest((current) => current + 1)
  }, [])


  const handleAutoConnectCompleted = useCallback(() => {
    setConnectionsMade(true)

    // Auto-connect does not verify the circuit.
    setCheckCompleted(false)
    setConnectionsVerified(false)

    setStatus(
      'Auto Connect completed. Click CHECK to verify the circuit.',
    )
  }, [])





  /* -------------------------------------------------------
     FUNCTION GENERATOR
     ------------------------------------------------------- */

  const handleToggleGenerator = useCallback(() => {
    // Once ON, the generator stays ON until RESET.
    if (generatorOn) {
      return
    }

    if (!connectionsMade || !checkCompleted || !connectionsVerified) {
      setStatus(
        'First make the required connections and click CHECK.',
      )
      return
    }

    setGeneratorOn(true)

    setStatus(
      'Function Generator is ON. Set the frequency and click ADD.',
    )

    void notifyGuide({
      type: 'FUNCTION_GENERATOR_ON',
    })
  }, [
    generatorOn,
    connectionsMade,
    checkCompleted,
    connectionsVerified,
    notifyGuide,
  ])



  /* -------------------------------------------------------
     Frequency
     ------------------------------------------------------- */

  const handleFrequencyChange = useCallback(
    (nextFrequency) => {
      const value = Number(nextFrequency)

      if (!Number.isFinite(value)) {
        return
      }

      if (!generatorOn) {
        setStatus(
          'Turn ON the Function Generator before changing frequency.',
        )

        return
      }

      setFrequency(value)
      setFrequencyChanged(true)

      setCalculationDone(false)
      setCalculationVerified(false)
      setCalculatedValues(null)
      setReportGenerated(false)

      setStatus(
        `Frequency set to ${value.toFixed(1)} kHz.`,
      )
    },
    [generatorOn],
  )


  /* -------------------------------------------------------
     ADD OBSERVATION
     ------------------------------------------------------- */

  const recordObservation = useCallback(() => {
    if (
      !connectionsVerified
      || !checkCompleted
    ) {
      setStatus(
        'Verify the RLC circuit connections before adding a reading.',
      )

      return
    }
    if (!generatorOn) {
      setStatus(
        'Turn ON the Function Generator before adding a reading.',
      )

      return
    }

    if (observations.length >= MAX_OBSERVATIONS) {
      setStatus(
        'Observation table is full. Click RESET for a new run.',
      )

      return
    }

    const duplicate = observations.some(
      (row) => row.frequency === frequency,
    )

    if (duplicate) {
      setStatus(
        `${frequency.toFixed(1)} kHz is already recorded. Choose another frequency.`
      )

      return
    }

    const nextObservation = {
      id: observations.length + 1,

      frequency,

      voltage,

      current: currentReading.current,

      currentMilliAmperes:
        currentReading.current * 1000,

      xl: currentReading.xl,

      xc: currentReading.xc,

      impedance: currentReading.impedance,

      phaseAngle: currentReading.phaseAngle,

      power: currentReading.power,
    }

    setObservations((current) => [
      ...current,
      nextObservation,
    ])

    setFrequencyChanged(false)
    setCalculationDone(false)
    setReportGenerated(false)
    setReportPrinted(false)

    setStatus(
      `Reading added at ${frequency.toFixed(1)} kHz.`,
    )
    void notifyGuide({
      type: 'READING_ADDED',
      frequency,
      readingCount: observations.length + 1,
    })
  }, [
    checkCompleted,
    connectionsVerified,
    currentReading,
    frequency,
    generatorOn,
    notifyGuide,
    observations,
    voltage,
  ])
  /* -------------------------------------------------------
     PLOT / CALCULATE
     ------------------------------------------------------- */


  const handlePlot = useCallback(() => {
    if (!calculationVerified) {
      setStatus('Please click Verify before plotting the graph.')
      return
    }

    if (observations.length < 10) {
      setStatus('Complete all 10 observations before plotting.')
      return
    }

    const resonanceObservation = observations.reduce(
      (best, row) =>
        !best || Number(row.current) > Number(best.current)
          ? row
          : best,
      null
    )

    const calculated = {
      resistance: RLC_VALUES.resistance,
      inductance: RLC_VALUES.inductance,
      capacitance: RLC_VALUES.capacitance,
      supplyVoltage: voltage,
      theoreticalResonanceFrequency,
      observedResonanceFrequency:
        resonanceObservation?.frequency ?? null,
      maximumCurrent: resonanceObservation?.current ?? 0,
      observations: [...observations],
    }

    setCalculatedValues(calculated)
    setCalculationDone(true)
    setReportGenerated(false)

    setStatus(
      `Graph generated. Observed resonance frequency: ${resonanceObservation?.frequency?.toFixed(1) ?? '-'
      } kHz.`
    )

    void notifyGuide({ type: 'PLOT' })
  }, [
    calculationVerified,
    observations,
    theoreticalResonanceFrequency,
    voltage,
    notifyGuide,
  ])



  /* -------------------------------------------------------
     RESET
     ------------------------------------------------------- */


  const resetSimulation = useCallback(() => {
    // Reset function generator
    setGeneratorOn(false)

    // Reset frequency and voltage
    setFrequency(FREQUENCY_VALUES[0])
    setFrequencyChanged(false)
    setVoltage(RLC_VALUES.supplyVoltage)

    // Reset connections
    setConnectionsMade(false)
    setCheckCompleted(false)
    setConnectionsVerified(false)

    // Reset observations
    setObservations([])

    // Reset calculation
    setCalculationDone(false)
    setCalculatedValues(null)

    // Reset report
    setReportGenerated(false)
    setReportPrinted(false)

    // Reset connection requests
    setCheckRequest(0)
    setAutoConnectRequest(0)

    // Hide panels
    setShowRth(false)
    setShowMultimeter(false)

    // Reset circuit wiring in ConnectionLab
    setResetRequest((current) => current + 1)

    // Reset session
    setSessionStart(Date.now())

    setStatus(
      'Simulation reset. Make all required RLC connections.',
    )

    walkthroughCompletionRef.current = completionCount

    void notifyGuide({
      type: 'RESET',
    })
  }, [
    completionCount,
    notifyGuide,
    setShowMultimeter,
    setShowRth,
  ])


  const handleReset = useCallback(() => {
    resetSimulation()
  }, [resetSimulation])


  /* -------------------------------------------------------
     PRINT
     ------------------------------------------------------- */

  const handlePrint = useCallback(async () => {
    await notifyGuide({
      type: 'PRINT',
    })

    window.print()
  }, [notifyGuide])


  useEffect(() => {
    const handleAfterPrint = () => {
      setReportPrinted(true)
    }

    window.addEventListener(
      'afterprint',
      handleAfterPrint,
    )

    return () => {
      window.removeEventListener(
        'afterprint',
        handleAfterPrint,
      )
    }
  }, [])


  /* -------------------------------------------------------
     REPORT
     
     Temporary compatibility implementation.
     The old Thevenin report generator is intentionally NOT
     used here. A proper RLC report will be handled later.
     ------------------------------------------------------- */


  const handleGenerateReport = useCallback(async () => {
    if (!calculationDone || !calculationVerified) {
      setStatus('Please verify the calculation and plot the graph before generating the report.')
      return
    }

    if (observations.length < 10) {
      setStatus('Complete all 10 observations before generating the report.')
      return
    }

    const resonanceObservation = observations.reduce(
      (best, row) =>
        !best || Number(row.current) > Number(best.current)
          ? row
          : best,
      null
    )

    const theoreticalFrequency =
      calculatedValues?.theoreticalResonanceFrequency ??
      theoreticalResonanceFrequency

    const observedFrequency =
      resonanceObservation?.frequency ?? null

    const qualityFactor =
      (1 / RLC_VALUES.resistance) *
      Math.sqrt(RLC_VALUES.inductance / RLC_VALUES.capacitance)

    const rows = observations
      .map((item, index) => {
        const currentMilliAmperes =
          item.currentMilliAmperes ??
          Number(item.current) * 1000

        return `
        <tr>
          <td>${index + 1}</td>
          <td>${Number(item.frequency).toFixed(1)}</td>
          <td>${Number(item.voltage ?? voltage).toFixed(2)}</td>
          <td>${Number(currentMilliAmperes).toFixed(2)}</td>
          <td>${Number(item.xl ?? 0).toFixed(2)}</td>
          <td>${Number(item.xc ?? 0).toFixed(2)}</td>
        </tr>
      `
      })
      .join('')

    const reportHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>Series RLC Resonance Experiment Report</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 32px;
          color: #111827;
        }
        h1, h2 { text-align: center; }
        .details {
          margin: 24px 0;
          line-height: 1.9;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th, td {
          border: 1px solid #9ca3af;
          padding: 8px;
          text-align: center;
        }
        th { background: #e5e7eb; }
        @media print {
          body { margin: 15mm; }
        }
      </style>
    </head>
    <body>
      <h1>Series RLC Resonance Circuit Experiment</h1>
      <h2>Observation and Calculation Report</h2>

      <div class="details">
        <strong>Resistance:</strong> ${RLC_VALUES.resistance} Ω<br />
        <strong>Inductance:</strong> ${(RLC_VALUES.inductance * 1000).toFixed(2)} mH<br />
        <strong>Capacitance:</strong> ${(RLC_VALUES.capacitance * 1e6).toFixed(2)} µF<br />
        <strong>Supply Voltage:</strong> ${Number(voltage).toFixed(2)} V<br />
        <strong>Theoretical Resonance Frequency:</strong> ${(theoreticalFrequency / 1000).toFixed(2)} kHz<br />
        <strong>Observed Resonance Frequency:</strong> ${observedFrequency == null ? 'N/A' : Number(observedFrequency).toFixed(2) + ' kHz'}<br />
        <strong>Maximum Recorded Current:</strong> ${resonanceObservation ? (Number(resonanceObservation.current) * 1000).toFixed(2) + ' mA' : 'N/A'}<br />
        <strong>Quality Factor:</strong> ${qualityFactor.toFixed(2)}
      </div>

      <h2>Observation Table</h2>
      <table>
        <thead>
          <tr>
            <th>No.</th>
            <th>Frequency (kHz)</th>
            <th>Voltage (V)</th>
            <th>Current (mA)</th>
            <th>XL (Ω)</th>
            <th>XC (Ω)</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <p style="margin-top: 28px">
        <strong>Note:</strong> Resonance is identified from the recorded
        observation with the highest current.
      </p>
    </body>
    </html>
  `

    const reportWindow = window.open('', '_blank')

    if (!reportWindow) {
      setStatus('The report window was blocked. Allow pop-ups and try again.')
      return
    }

    reportWindow.document.open()
    reportWindow.document.write(reportHtml)
    reportWindow.document.close()

    setReportGenerated(true)
    setStatus('Report generated successfully. Use Print to save it as PDF.')

    await notifyGuide({ type: 'REPORT_GENERATED' })
  }, [
    calculationDone,
    calculationVerified,
    observations,
    calculatedValues,
    theoreticalResonanceFrequency,
    voltage,
    notifyGuide,
  ])



  /* -------------------------------------------------------
     Compatibility handlers for existing ConnectionLab
     ------------------------------------------------------- */
  const handleCircuitSwitchRejected = useCallback(() => {
    setStatus(
      'First verify all required RLC connections using CHECK.',
    )
  }, [])


  const handleBulbSwitchToggle = useCallback(() => {
    // Compatibility handler.
    // The old bulb switch is no longer part of the experiment.
    handleToggleGenerator()
  }, [handleToggleGenerator])

  /* -------------------------------------------------------
     Walkthrough completion
     ------------------------------------------------------- */

  useEffect(() => {
    if (
      completionCount === 0
      || completionCount ===
      walkthroughCompletionRef.current
    ) {
      return
    }

    walkthroughCompletionRef.current =
      completionCount

    if (!guideState.guideStarted) {
      return
    }

    void notifyGuide({
      type: 'WALKTHROUGH_COMPLETED',
    })
  }, [
    completionCount,
    guideState.guideStarted,
    notifyGuide,
  ])


  /* -------------------------------------------------------
     AI GUIDE
     ------------------------------------------------------- */

  const handleAiGuide = useCallback(() => {
    if (guideState.guideStarted) {
      setStatus(
        'AI Guide is replaying the current instruction.',
      )

      if (guideState.startupCompleted) {
        void replayCurrentInstruction()
      } else {
        void notifyGuide({
          type: 'START_GUIDE',
        })
      }

      return
    }

    setStatus(
      'AI Guide narration started.',
    )

    void notifyGuide({
      type: 'START_GUIDE',
    })
  }, [
    guideState.guideStarted,
    guideState.startupCompleted,
    notifyGuide,
    replayCurrentInstruction,
  ])


  /* -------------------------------------------------------
     Resize handling
     ------------------------------------------------------- */

  useEffect(() => {
    let resizeTimer = 0

    const handleResize = () => {
      window.clearTimeout(resizeTimer)

      resizeTimer = window.setTimeout(() => {
        const previousMetrics =
          viewportMetricsRef.current

        const nextMetrics = {
          devicePixelRatio:
            window.devicePixelRatio,

          outerWidth:
            window.outerWidth,
        }

        const pixelRatioChanged =
          Math.abs(
            nextMetrics.devicePixelRatio
            - previousMetrics.devicePixelRatio,
          ) > 0.001

        const outerWidthChanged =
          nextMetrics.outerWidth
          !== previousMetrics.outerWidth

        viewportMetricsRef.current =
          nextMetrics

        if (
          !pixelRatioChanged
          || outerWidthChanged
        ) {
          setScale(getScale())
        }
      }, 100)
    }

    window.addEventListener(
      'resize',
      handleResize,
    )

    return () => {
      window.clearTimeout(resizeTimer)

      window.removeEventListener(
        'resize',
        handleResize,
      )
    }
  }, [])


  /* -------------------------------------------------------
     Content height
     ------------------------------------------------------- */

  useEffect(() => {
    const content =
      postSimulationContentRef.current

    if (!content) {
      return undefined
    }

    const updateContentHeight = () => {
      const nextHeight = Math.ceil(
        content.offsetTop
        + content.offsetHeight,
      )

      setContentHeight((currentHeight) => (
        currentHeight === nextHeight
          ? currentHeight
          : nextHeight
      ))
    }

    updateContentHeight()

    const resizeObserver =
      new ResizeObserver(
        updateContentHeight,
      )

    resizeObserver.observe(content)

    window.addEventListener(
      'load',
      updateContentHeight,
    )

    return () => {
      resizeObserver.disconnect()

      window.removeEventListener(
        'load',
        updateContentHeight,
      )
    }
  }, [])


  /* -------------------------------------------------------
     Guide highlighting
     ------------------------------------------------------- */

  const guideHighlights = {
    1: [
      '1-endpoint',
      '3-endpoint',
    ],

    2: [
      '1-endpoint',
      '5-endpoint',
    ],

    3: [
      '2-endpoint',
      '4-endpoint',
    ],

    4: [
      '6-endpoint',
      '7-endpoint',
    ],

    5: [
      '8-endpoint',
      '11-endpoint',
    ],

    6: [
      '12-endpoint',
      '9-endpoint',
    ],

    7: [
      '10-endpoint',
      '2-endpoint',
    ],
  }
  const highlightedTerminalIds =
    guideHighlights[
    Number(activeInstructionId)
    ] ?? []


  /* -------------------------------------------------------
     Active walkthrough step
     ------------------------------------------------------- */
  const activeInstructionStep =
    !connectionsMade
      ? 'connections'
      : !checkCompleted
        ? 'check-connections'
        : !generatorOn
          ? 'function-generator'
          : observations.length === 0
            ? frequencyChanged
              ? 'add-reading'
              : 'frequency'
            : observations.length < MAX_OBSERVATIONS
              ? frequencyChanged
                ? 'add-reading'
                : 'repeat-readings'
              : !calculationDone
                ? 'calculation'
                : !reportPrinted
                  ? 'print'
                  : 'reset'
  /*-----------------------------------
Layout
------------------------------------------------------- */

  const scaledWidth =
    Math.ceil(BASE_WIDTH * scale)

  const scaledHeight =
    Math.ceil(contentHeight * scale)


  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <div id="app-wrapper">
      <div
        id="app-viewport"
        style={{
          height: `${scaledHeight}px`,
          width: `${scaledWidth}px`,
        }}
      >
        <div
          id="app-scale"
          style={{
            height: `${contentHeight}px`,
            zoom: scale,
          }}
        >
          <main
            className="simulation-shell"
            id="walkthrough-demo-experiment"
          >
            <HeaderBoard />

            <WalkthroughStartButton
              highlighted={
                guideState.startupCompleted
                && !guideState.walkthroughCompleted
              }
              variant="side-tab"
            />

            <span
              className="sr-only"
              role="status"
              aria-live="polite"
            >
              {status}
            </span>

            <section className="workspace-grid">

              {/* =================================================
                  LEFT PANEL
                  ================================================= */}

              <aside className="left-panel">

                <ActionButtons
                  activeInstructionStep={
                    activeInstructionStep
                  }

                  activeButtons={{
                    onAiGuide:
                      guideState.guideStarted,
                  }}

                  disabledButtons={{
                    onAdd: (
                      !connectionsVerified
                      || !checkCompleted
                      || !generatorOn
                      || observations.length >=
                      MAX_OBSERVATIONS
                    ),

                    onPlot:
                      observations.length < 2,

                    onCheck:
                      !connectionsMade,

                    onPrint: false,
                  }}

                  onAdd={
                    recordObservation
                  }

                  onAiGuide={
                    handleAiGuide
                  }

                  onAutoConnect={
                    handleAutoConnect
                  }

                  onPlot={
                    handlePlot
                  }

                  onCheck={
                    handleCheck
                  }

                  onPrint={
                    handlePrint
                  }

                  onReset={
                    handleReset
                  }
                />

                {/*
                  TEMPORARY:
                  The existing ControlPanel still expects RL
                  props. We pass frequency through the same
                  interface for now.

                  We will convert ControlPanel to a real
                  Frequency Control in the next step.
                */}

                <ControlPanel
                  locked={!generatorOn}

                  maxResistancePosition={
                    FREQUENCY_VALUES.length - 1
                  }

                  minResistancePosition={0}

                  observations={observations}

                  onGenerateReport={
                    handleGenerateReport
                  }

                  onResistanceLocked={() => {
                    setStatus(
                      'Turn ON the Function Generator before changing frequency.',
                    )
                  }}

                  onGuideEvent={
                    notifyGuide
                  }

                  reportGenerated={
                    reportGenerated
                  }

                  rl={frequency}

                  setRl={
                    handleFrequencyChange
                  }

                  theoremVerified={
                    calculationDone
                  }
                  calculationDone={calculationDone}
                  calculationVerified={calculationVerified}
                />
              </aside>


              {/* =================================================
                  RIGHT PANEL
                  ================================================= */}

              <section className="right-panel">

                <ConnectionLab
                  autoConnectRequest={autoConnectRequest}
                  checkRequest={checkRequest}
                  resetRequest={resetRequest}
                  connectionsVerified={connectionsVerified}

                  generatorOn={generatorOn}

                  frequency={frequency}
                  onFrequencyChange={handleFrequencyChange}

                  highlightedTerminalIds={highlightedTerminalIds}

                  meterCurrentAmperes={currentReading.current}
                  meterVoltage={voltage}

                  onAutoConnectCompleted={handleAutoConnectCompleted}
                  onCheckConnections={handleCheckConnections}
                  onGuideEvent={notifyGuide}

                  onToggleGenerator={handleToggleGenerator}
                />
              </section>
            </section>
          </main>


          {/* =====================================================
              CALCULATION SECTION

              The existing CalculationPanel is still the old
              Solar/Thevenin panel.

              We leave it mounted for now so the project does
              not lose its existing structure.

              NEXT STEP:
              Replace it with the RLC calculation panel.
              ===================================================== */}

          <div
            className="post-simulation-content"
            ref={postSimulationContentRef}
          >


            <div className="calculation-plot-layout">
              <div className="calculation-panel-column">

                <CalculationPanel
                  calculationDone={calculationDone}
                  observations={observations}
                  onGuideEvent={notifyGuide}
                  onVerify={setCalculationVerified}
                />

              </div>


              {calculationDone && calculationVerified && (
                <div className="resonance-plot-column">
                  <ResonancePlot observations={observations} />
                </div>
              )}

            </div>

            <footer className="site-footer">
              © 2026 Virtual Labs, IIT Roorkee
            </footer>
          </div>

        </div>
      </div>
    </div>
  )
}

export default App