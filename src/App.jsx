import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

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
  resistance: 100,       // Ω
  inductance: 0.5,       // H
  capacitance: 10e-6,    // F
  supplyVoltage: 5,      // V
}

// Frequency range for the experiment.
const FREQUENCY_VALUES = [
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

// Maximum number of observation rows.
const MAX_OBSERVATIONS = 8


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
   ========================================================= */
const calculateRlcReading = ({
  frequency,
  voltage,
  resistance,
  inductance,
  capacitance,
  circuitOn,
}) => {
  if (
    !circuitOn ||
    frequency <= 0 ||
    voltage <= 0
  ) {
    return {
      xl: 0,
      xc: 0,
      impedance: 0,
      current: 0,
      phaseAngle: 0,
      power: 0,
    }
  }

  const frequencyHz = frequency * 1000

  const xl =
    2 * Math.PI * frequencyHz * inductance

  const xc =
    1 / (
      2 *
      Math.PI *
      frequencyHz *
      capacitance
    )

  const reactanceDifference = xl - xc

  const impedance = Math.sqrt(
    resistance ** 2 +
    reactanceDifference ** 2,
  )

  const current =
    voltage / impedance

  const phaseAngle =
    Math.atan2(
      reactanceDifference,
      resistance,
    ) *
    (180 / Math.PI)

  const power =
    current ** 2 *
    resistance

  return {
    xl,
    xc,
    impedance,
    current,
    phaseAngle,
    power,
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

  // MCB
  const [mcbOn, setMcbOn] = useState(false)

  // Function generator
  const [generatorOn, setGeneratorOn] = useState(false)

  // Used by old child components as a compatibility flag.
  const [powerOn, setPowerOn] = useState(false)

  // The old circuit-switch prop is retained for compatibility
  // with ConnectionLab.
  const [circuitSwitchOn, setCircuitSwitchOn] = useState(false)

  // Old bulb prop is retained temporarily because the existing
  // ConnectionLab interface still accepts it.
  const [bulbSwitchOn, setBulbSwitchOn] = useState(false)

  // Frequency replaces the old RL experiment variable.
  const [frequency, setFrequency] = useState(
    FREQUENCY_VALUES[0],
  )

  // Supply voltage.
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

  const [calculatedValues, setCalculatedValues] =
    useState(null)

  // Verification compatibility with the current
  // CalculationPanel. This will be removed when that panel
  // is converted to RLC.
  const [verificationResult, setVerificationResult] =
    useState('')

  const [, setUserCalculatedFillFactor] = useState('')

  // Report state.
  const [reportGenerated, setReportGenerated] = useState(false)

  const [reportPrinted, setReportPrinted] = useState(false)

  // Request counters used by ConnectionLab.
  const [checkRequest, setCheckRequest] = useState(0)

  const [resetRequest, setResetRequest] = useState(0)

  const [autoConnectRequest, setAutoConnectRequest] =
    useState(0)

  const [autoConnectedCase, setAutoConnectedCase] =
    useState(null)

  const [status, setStatus] = useState(
    'Make all 9 required RLC circuit connections.',
  )

  const [sessionStart, setSessionStart] = useState(
    () => Date.now(),
  )


  /* -------------------------------------------------------
     Compatibility state for existing ConnectionLab
     ------------------------------------------------------- */

  const [ammeterRemovalRequired, setAmmeterRemovalRequired] =
    useState(false)

  const [ammeterConnectionsRemoved, setAmmeterConnectionsRemoved] =
    useState(false)

  const [case1ConnectionsRemoved, setCase1ConnectionsRemoved] =
    useState(false)

  const [case2ConnectionsRemoved, setCase2ConnectionsRemoved] =
    useState(false)

  const [, setShowRth] = useState(false)

  const [, setShowMultimeter] = useState(false)

  const [experimentCase, setExperimentCase] = useState(1)


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
      connectionsVerified
      && checkCompleted
      && mcbOn
      && generatorOn
    ),
  })


  /* -------------------------------------------------------
     Connection-state callback
     ------------------------------------------------------- */

  const handleConnectionStateChange = useCallback(
    (connectionCount) => {
      const count = Number(connectionCount)

      // Your required circuit has 9 connection pairs.
      const complete = count >= 9

      setConnectionsMade(complete)

      if (!complete) {
        setCheckCompleted(false)
        setConnectionsVerified(false)
      }

      if (complete) {
        setStatus(
          'All required connections are made. Click CHECK.',
        )
      }
    },
    [],
  )


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
          'Right Connections! Now turn ON the MCB.',
        )

        return
      }

      setCheckCompleted(false)
      setConnectionsVerified(false)

      if (!result?.totalConnections) {
        setStatus(
          'Please make all 9 required connections first.',
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
        'Make all 9 required connections before CHECK.',
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

    // Auto-connect does NOT verify the circuit.
    setCheckCompleted(false)
    setConnectionsVerified(false)

    setAutoConnectedCase(1)

    setStatus(
      'Auto Connect completed. Click CHECK to verify the circuit.',
    )
  }, [])


  /* -------------------------------------------------------
     MCB
     ------------------------------------------------------- */

  const handleToggleMcb = useCallback(() => {
    if (mcbOn) {
      return
    }

    if (
      !connectionsMade
      || !checkCompleted
      || !connectionsVerified
    ) {
      setStatus(
        'First make the required connections and click CHECK.',
      )

      return
    }

    setMcbOn(true)
    setCircuitSwitchOn(true)

    setStatus(
      'MCB is ON. Now turn ON the Function Generator.',
    )

    void notifyGuide({
      type: 'MCB_ON',
    })
  }, [
    checkCompleted,
    connectionsMade,
    connectionsVerified,
    mcbOn,
    notifyGuide,
  ])


  /* -------------------------------------------------------
     FUNCTION GENERATOR
     ------------------------------------------------------- */

  const handleToggleGenerator = useCallback(() => {
    if (generatorOn) {
      return
    }

    if (!mcbOn) {
      setStatus(
        'Turn ON the MCB before turning ON the Function Generator.',
      )

      return
    }

    setGeneratorOn(true)
    setBulbSwitchOn(true)
    setPowerOn(true)

    setStatus(
      'Function Generator is ON. Set the frequency and click ADD.',
    )

    void notifyGuide({
      type: 'FUNCTION_GENERATOR_ON',
    })
  }, [
    generatorOn,
    mcbOn,
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

      setCalculationDone(false)
      setReportGenerated(false)

      setStatus(
        setStatus(
          `Frequency set to ${value.toFixed(1)} kHz.`,
        ),
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

    if (!mcbOn) {
      setStatus(
        'Turn ON the MCB before adding a reading.',
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
        `${frequency} Hz is already recorded. Choose another frequency.`,
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

    setCalculationDone(false)
    setReportGenerated(false)
    setReportPrinted(false)

    setStatus(
      `Reading added at ${frequency} Hz. Set another frequency and click ADD.`,
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
    mcbOn,
    notifyGuide,
    observations,
    voltage,
  ])


  /* -------------------------------------------------------
     PLOT / CALCULATE
     ------------------------------------------------------- */

  const handlePlot = useCallback(() => {
    if (observations.length < 2) {
      setStatus(
        'Add at least two frequency readings before plotting.',
      )

      return
    }

    const resonanceObservation =
      observations.reduce(
        (best, row) => (
          !best
            || row.current > best.current
            ? row
            : best
        ),
        null,
      )

    const calculated = {
      resistance: RLC_VALUES.resistance,

      inductance: RLC_VALUES.inductance,

      capacitance: RLC_VALUES.capacitance,

      supplyVoltage: voltage,

      theoreticalResonanceFrequency,

      observedResonanceFrequency:
        resonanceObservation?.frequency ?? null,

      maximumCurrent:
        resonanceObservation?.current ?? 0,

      observations,
    }

    setCalculatedValues(calculated)
    setCalculationDone(true)

    setStatus(
      `Plot ready. Observed resonance frequency: ${resonanceObservation?.frequency ?? '-'
      } Hz.`,
    )

    void notifyGuide({
      type: 'CALCULATE',
    })
  }, [
    observations,
    theoreticalResonanceFrequency,
    voltage,
    notifyGuide,
  ])


  /* -------------------------------------------------------
     RESET
     ------------------------------------------------------- */

  const resetSimulation = useCallback(() => {
    setMcbOn(false)
    setGeneratorOn(false)
    setPowerOn(false)

    setCircuitSwitchOn(false)
    setBulbSwitchOn(false)

    setFrequency(FREQUENCY_VALUES[0])
    setVoltage(RLC_VALUES.supplyVoltage)

    setConnectionsMade(false)
    setCheckCompleted(false)
    setConnectionsVerified(false)

    setObservations([])

    setCalculationDone(false)
    setCalculatedValues(null)

    setVerificationResult('')
    setUserCalculatedFillFactor('')

    setReportGenerated(false)
    setReportPrinted(false)

    setCheckRequest(0)
    setAutoConnectRequest(0)
    setAutoConnectedCase(null)

    setExperimentCase(1)

    setAmmeterRemovalRequired(false)
    setAmmeterConnectionsRemoved(false)

    setCase1ConnectionsRemoved(false)
    setCase2ConnectionsRemoved(false)

    setShowRth(false)
    setShowMultimeter(false)

    setResetRequest((current) => current + 1)

    setSessionStart(Date.now())

    setStatus(
      'Simulation reset. Make all 9 required RLC connections.',
    )

    walkthroughCompletionRef.current =
      completionCount

    void notifyGuide({
      type: 'RESET',
    })
  }, [
    completionCount,
    notifyGuide,
    setShowMultimeter,
    setShowRth,
  ])


  const handleReset = useCallback(async () => {
    const shouldReset =
      await notifyGuide({
        type: 'RESET_REQUEST',
      })

    if (shouldReset) {
      resetSimulation()
    }
  }, [
    notifyGuide,
    resetSimulation,
  ])


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
    if (!calculationDone) {
      setStatus(
        'Click PLOT before generating the report.',
      )

      return
    }

    setReportGenerated(true)

    setStatus(
      'RLC calculation is complete. Report generation will use the RLC format after the calculation panel is converted.',
    )

    await notifyGuide({
      type: 'REPORT_GENERATED',
    })
  }, [
    calculationDone,
    notifyGuide,
  ])


  /* -------------------------------------------------------
     Compatibility handlers for existing ConnectionLab
     ------------------------------------------------------- */

  const handleCircuitSwitchChange = useCallback(
    (nextSwitchOn) => {
      setCircuitSwitchOn(nextSwitchOn)

      if (!nextSwitchOn) {
        setPowerOn(false)
        setGeneratorOn(false)
        setMcbOn(false)
        setBulbSwitchOn(false)

        setStatus('MCB is OFF.')

        return
      }

      setMcbOn(true)

      setStatus(
        'MCB is ON. Turn ON the Function Generator.',
      )
    },
    [],
  )


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


  const handleAmmeterConnectionsRemoved =
    useCallback(() => {
      setAmmeterConnectionsRemoved(true)
      setAmmeterRemovalRequired(false)

      setStatus(
        'Ammeter connection state updated.',
      )
    }, [])


  /* -------------------------------------------------------
     Compatibility voltage handlers
     ------------------------------------------------------- */

  const handleVoltageChange = useCallback(
    (nextVoltage) => {
      const value = Number(nextVoltage)

      if (!Number.isFinite(value)) {
        return
      }

      setVoltage(value)
      setCalculationDone(false)
    },
    [],
  )


  const handleVoltageSet = useCallback(
    (nextVoltage) => {
      const value = Number(nextVoltage)

      if (Number.isFinite(value)) {
        setVoltage(value)
      }
    },
    [],
  )


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
      '13-endpoint',
    ],

    2: [
      '2-endpoint',
      '14-endpoint',
    ],

    3: [
      '3-endpoint',
      '15-endpoint',
    ],

    4: [
      '4-endpoint',
      '16-endpoint',
    ],

    5: [
      '5-endpoint',
      '15-endpoint',
    ],

    6: [
      '6-endpoint',
      '7-endpoint',
    ],

    7: [
      '8-endpoint',
      '11-endpoint',
    ],

    8: [
      '9-endpoint',
      '12-endpoint',
    ],

    9: [
      '10-endpoint',
      '16-endpoint',
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
        : !mcbOn
          ? 'mcb'
          : !generatorOn
            ? 'function-generator'
            : observations.length < 8
              ? (
                observations.length === 0
                  ? 'frequency'
                  : 'add-reading'
              )
              : !calculationDone
                ? 'calculation'
                : !reportPrinted
                  ? 'print'
                  : 'reset'
  /* -------------------------------------------------------
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
                      || !mcbOn
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
                />
              </aside>


              {/* =================================================
                  RIGHT PANEL
                  ================================================= */}

              <section className="right-panel">

                <ConnectionLab
                  key={`connection-lab-${resetRequest}`}

                  ammeterRemovalRequired={
                    ammeterRemovalRequired
                  }

                  autoConnectRequest={
                    autoConnectRequest
                  }

                  bulbSwitchOn={
                    bulbSwitchOn
                  }

                  case1ConnectionsRemoved={
                    case1ConnectionsRemoved
                  }

                  case2ConnectionsRemoved={
                    case2ConnectionsRemoved
                  }

                  checkRequest={
                    checkRequest
                  }

                  circuitSwitchOn={
                    circuitSwitchOn
                  }

                  connectionsVerified={
                    connectionsVerified
                  }

                  experimentCase={
                    experimentCase
                  }

                  highlightedTerminalIds={
                    highlightedTerminalIds
                  }

                  meterCurrentAmperes={
                    currentReading.current
                  }

                  meterVoltage={
                    voltage
                  }

                  observationIl={
                    currentReading.current
                  }

                  observationVth={
                    voltage
                  }

                  powerOn={
                    powerOn
                  }

                  resetRequest={
                    resetRequest
                  }

                  resistancesConfigured={
                    true
                  }

                  rl={
                    frequency
                  }

                  scale={
                    scale
                  }

                  r1={
                    RLC_VALUES.resistance
                  }

                  r2={0}

                  r3={0}

                  voltage={
                    voltage
                  }

                  voltageLocked={
                    false
                  }

                  mcbOn={
                    mcbOn
                  }

                  generatorOn={
                    generatorOn
                  }

                  onToggleMcb={
                    handleToggleMcb
                  }

                  onToggleGenerator={
                    handleToggleGenerator
                  }

                  onConnectionStateChange={
                    handleConnectionStateChange
                  }

                  onAmmeterConnectionsRemoved={
                    handleAmmeterConnectionsRemoved
                  }

                  onAutoConnectCompleted={
                    handleAutoConnectCompleted
                  }

                  onBulbSwitchToggle={
                    handleBulbSwitchToggle
                  }

                  onCheckConnections={
                    handleCheckConnections
                  }

                  onCircuitSwitchChange={
                    handleCircuitSwitchChange
                  }

                  onCircuitSwitchRejected={
                    handleCircuitSwitchRejected
                  }

                  onGuideEvent={
                    notifyGuide
                  }

                  setCase1ConnectionsRemoved={
                    setCase1ConnectionsRemoved
                  }

                  setCase2ConnectionsRemoved={
                    setCase2ConnectionsRemoved
                  }

                  setShowMultimeter={
                    setShowMultimeter
                  }

                  setShowRth={
                    setShowRth
                  }

                  setVoltage={
                    handleVoltageChange
                  }

                  onVoltageSet={
                    handleVoltageSet
                  }
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
            <CalculationPanel
              calculatedValues={
                calculatedValues
              }

              calculationDone={
                calculationDone
              }

              key={
                calculationDone
                  ? 'calculation-ready'
                  : 'calculation-reset'
              }

              observations={
                observations
              }

              onGuideEvent={
                notifyGuide
              }

              setUserCalculatedFillFactor={
                setUserCalculatedFillFactor
              }

              setVerificationResult={
                setVerificationResult
              }
            />

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