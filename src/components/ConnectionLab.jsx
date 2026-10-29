import { useEffect, useRef, useState } from 'react'

import EquipmentPanel from './EquipmentPanel.jsx'

import {
  addAllEndpoints,
  autoConnectRlcCircuit,
  deleteConnectionsForTerminal,
  lockJsPlumbCircuit,
  REQUIRED_CONNECTION_PAIRS,
  resolveJsPlumb,
  unlockJsPlumbCircuit,
  validateRlcConnections,
  wireHoverPaintStyles,
  wirePaintStyles,
} from '../utils/jsPlumbWiring.js'

const getJsPlumbZoom = (scale) => (
  Number.isFinite(scale) && scale > 0 ? scale : 1
)

/*
 * Check whether a connection belongs to the required RLC circuit.
 */
const isRequiredConnection = (connection) => {
  const source = connection.sourceId || connection.source?.id
  const target = connection.targetId || connection.target?.id

  return REQUIRED_CONNECTION_PAIRS.some(([firstId, secondId]) => (
    (source === firstId && target === secondId) ||
    (source === secondId && target === firstId)
  ))
}

/*
 * Terminal IDs used by the ammeter.
 *
 * Kept here only for identifying the meter terminals.
 * There is no longer any special Thevenin/ammeter-removal workflow.
 */
const AMMETER_TERMINAL_IDS = [
  '5-endpoint',
  '6-endpoint',
]

const ConnectionLab = ({
  autoConnectRequest = 0,
  checkRequest = 0,
  resetRequest = 0,

  connectionsVerified = false,

  
  generatorOn = false,

  /*
   * RLC frequency.
   *
   * These two props are important because the frequency slider
   * lives inside FunctionGenerator.
   */
  frequency = 1.0,
  onFrequencyChange,

  highlightedTerminalIds = [],

  meterCurrentAmperes = 0,
  meterVoltage = 0,

  onAutoConnectCompleted,
  onCheckConnections,
  onGuideEvent,

  onToggleMcb,
  onToggleGenerator,

  scale = 1,
}) => {
  const containerRef = useRef(null)
  const instanceRef = useRef(null)

  const onAutoConnectCompletedRef = useRef(
    onAutoConnectCompleted,
  )

  const onCheckConnectionsRef = useRef(
    onCheckConnections,
  )

  const onGuideEventRef = useRef(onGuideEvent)

  const scaleRef = useRef(getJsPlumbZoom(scale))

  const autoConnectingRef = useRef(false)
  const lastAutoConnectRequestRef = useRef(0)

  const [isLocked, setIsLocked] = useState(false)
  const [connectedTerminalIds, setConnectedTerminalIds] =
    useState([])

  /*
   * Keep callback references current.
   */
  useEffect(() => {
    onAutoConnectCompletedRef.current =
      onAutoConnectCompleted
  }, [onAutoConnectCompleted])

  useEffect(() => {
    onCheckConnectionsRef.current =
      onCheckConnections
  }, [onCheckConnections])

  useEffect(() => {
    onGuideEventRef.current = onGuideEvent
  }, [onGuideEvent])

  /*
   * Collect all currently connected terminal IDs.
   */
  const refreshConnectedTerminalIds = () => {
    const instance = instanceRef.current

    if (!instance) {
      setConnectedTerminalIds([])
      return
    }

    const terminals = new Set()

    instance.getAllConnections().forEach((connection) => {
      const sourceId =
        connection.sourceId ||
        connection.source?.id

      const targetId =
        connection.targetId ||
        connection.target?.id

      if (sourceId) {
        terminals.add(sourceId)
      }

      if (targetId) {
        terminals.add(targetId)
      }
    })

    setConnectedTerminalIds([...terminals])
  }

  /*
   * Initialize jsPlumb.
   *
   * IMPORTANT:
   * No resistance configuration is required anymore.
   * The RLC components are fixed equipment.
   */
  useEffect(() => {
    let cancelled = false

    const initJsPlumb = async () => {
      const jsPlumbModule = await import('jsplumb')
      const jsPlumb = resolveJsPlumb(jsPlumbModule)

      if (
        cancelled ||
        !containerRef.current ||
        !jsPlumb?.getInstance
      ) {
        return
      }

      /*
       * Clean up an existing instance before rebuilding.
       */
      instanceRef.current?.reset()

      containerRef.current.classList.remove(
        'connection-lab--locked',
      )

      setIsLocked(false)
      setConnectedTerminalIds([])

      const instance = jsPlumb.getInstance({
        ConnectionsDetachable: true,

        Connector: [
          'Bezier',
          {
            curviness: 57.6,
          },
        ],

        Container: containerRef.current,

        Endpoint: [
          'Dot',
          {
            radius: 4,
          },
        ],

        HoverPaintStyle: {
          ...wireHoverPaintStyles.positive,
        },

        PaintStyle: {
          ...wirePaintStyles.positive,
        },

        ReattachConnections: true,
      })

      instanceRef.current = instance

      instance.setZoom?.(scaleRef.current)

      /*
       * Register positive and negative wire styles.
       */
      instance.registerConnectionTypes({
        negative: {
          hoverPaintStyle: {
            ...wireHoverPaintStyles.negative,
          },

          paintStyle: {
            ...wirePaintStyles.negative,
          },
        },

        positive: {
          hoverPaintStyle: {
            ...wireHoverPaintStyles.positive,
          },

          paintStyle: {
            ...wirePaintStyles.positive,
          },
        },
      })

      /*
       * Create all 16 circuit endpoints.
       *
       * The second and third arguments are kept compatible
       * with the current addAllEndpoints API, but there is
       * no resistance requirement anymore.
       */
      instance.setSuspendDrawing(true)

      addAllEndpoints(
        instance,
        () => true,
        () => {},
      )

      instance.setSuspendDrawing(false, true)

      /*
       * New connection.
       */
      instance.bind('connection', (info) => {
        const sourceId = info.sourceId
        const targetId = info.targetId

        setConnectedTerminalIds((current) => [
          ...new Set([
            ...current,
            sourceId,
            targetId,
          ]),
        ])

        /*
         * Do not create guide events while Auto Connect
         * is creating the connections.
         */
        if (autoConnectingRef.current) {
          return
        }

        onGuideEventRef.current?.({
          sourceId,
          targetId,
          type: 'MANUAL_CONNECTION',
        })
      })

      /*
       * Connection detached by dragging/removal.
       */
      instance.bind('connectionDetached', () => {
        refreshConnectedTerminalIds()
      })

      /*
       * Repaint after initialization.
       */
      window.setTimeout(() => {
        if (!cancelled) {
          instance.repaintEverything?.()
        }
      }, 100)
    }

    initJsPlumb()

    /*
     * Keep wires correctly positioned when the browser resizes.
     */
    const handleResize = () => {
      window.setTimeout(() => {
        instanceRef.current?.repaintEverything?.()
      }, 100)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      cancelled = true

      window.removeEventListener(
        'resize',
        handleResize,
      )

      instanceRef.current?.reset()
      instanceRef.current = null
    }
  }, [resetRequest])

  /*
   * Update jsPlumb zoom.
   */
  useEffect(() => {
    const instance = instanceRef.current
    const zoom = getJsPlumbZoom(scale)

    scaleRef.current = zoom

    if (!instance?.setZoom) {
      return
    }

    instance.setZoom(zoom, true)

    window.setTimeout(() => {
      instance.repaintEverything?.()
    }, 0)
  }, [scale])

  /*
   * CHECK button.
   *
   * Only the exact nine required RLC connections are accepted.
   *
   * Correct:
   *   1-13
   *   2-14
   *   3-15
   *   4-16
   *   5-15
   *   6-7
   *   8-11
   *   9-12
   *   10-16
   */
  useEffect(() => {
    if (
      checkRequest === 0 ||
      !instanceRef.current
    ) {
      return
    }

    const result = validateRlcConnections(
      instanceRef.current,
    )

    if (result?.isCorrect) {
      lockJsPlumbCircuit(
        instanceRef.current,
        containerRef.current,
      )

      setIsLocked(true)

      onGuideEventRef.current?.({
        type: 'CONNECTIONS_VERIFIED',
      })
    } else {
      /*
       * Incorrect circuit must remain editable so the user
       * can click terminal labels and remove wrong connections.
       */
      unlockJsPlumbCircuit(
        instanceRef.current,
        containerRef.current,
      )

      setIsLocked(false)

      onGuideEventRef.current?.({
        type: 'CONNECTIONS_INVALID',
        result,
      })
    }

    onCheckConnectionsRef.current?.(result)
  }, [checkRequest])

  /*
   * When the verified circuit becomes available, keep it
   * locked until the application explicitly allows changes.
   *
   * In the RLC experiment we do NOT have the old
   * Thevenin "case 1 / case 2 / case 3" workflow.
   */
  useEffect(() => {
    const instance = instanceRef.current

    if (!instance) {
      return
    }

    if (connectionsVerified) {
      lockJsPlumbCircuit(
        instance,
        containerRef.current,
      )

      setIsLocked(true)
    }
  }, [connectionsVerified])

  /*
   * Handle clicking a terminal number.
   *
   * The user requirement is:
   *
   * "Click corresponding node label to delete its connection."
   *
   * Connections can only be removed while the circuit is editable.
   */
  const handleLabelClick = (event) => {
    const label = event.target.closest(
      '.terminal-number-label',
    )

    if (
      !label ||
      !containerRef.current?.contains(label)
    ) {
      return
    }

    event.preventDefault()
    event.stopPropagation()

    if (
      isLocked ||
      containerRef.current.classList.contains(
        'connection-lab--locked',
      )
    ) {
      return
    }

    const terminalId = label.dataset.terminalId

    if (!terminalId || !instanceRef.current) {
      return
    }

  

    /*
     * Delete every connection attached to the selected
     * terminal.
     */
    deleteConnectionsForTerminal(
      instanceRef.current,
      terminalId,
    )

    refreshConnectedTerminalIds()

    instanceRef.current.repaintEverything?.()

    onGuideEventRef.current?.({
      terminalId,
      type: 'CONNECTION_REMOVED',
    })
  }

  /*
   * AUTO CONNECT.
   *
   * Auto Connect is only a convenience for creating the
   * nine required connections.
   *
   * IMPORTANT:
   * Auto Connect does NOT bypass CHECK.
   * The user must still click CHECK afterward.
   */
  useEffect(() => {
    if (
      autoConnectRequest === 0 ||
      autoConnectRequest ===
        lastAutoConnectRequestRef.current ||
      !instanceRef.current
    ) {
      return
    }

    lastAutoConnectRequestRef.current =
      autoConnectRequest

    if (generatorOn) {
      onGuideEventRef.current?.({
        type: 'AUTO_CONNECT_REJECTED',
        description:
          'Turn OFF the MCB and Function Generator before connecting the circuit.',
      })

      return
    }

    autoConnectingRef.current = true

    const result = autoConnectRlcCircuit(
      instanceRef.current,
    )

    if (!result?.success) {
      autoConnectingRef.current = false

      onGuideEventRef.current?.({
        type: 'AUTO_CONNECT_UNAVAILABLE',
      })

      return
    }

    refreshConnectedTerminalIds()

    instanceRef.current.repaintEverything?.()

    /*
     * Auto Connect does NOT verify the circuit.
     */
    onAutoConnectCompletedRef.current?.()

    onGuideEventRef.current?.({
      type: 'AUTO_CONNECT_COMPLETED',
    })

    window.setTimeout(() => {
      autoConnectingRef.current = false
    }, 500)
  }, [
    autoConnectRequest,
    generatorOn,
  ])

  /*
   * Keep the circuit editable whenever reset occurs.
   */
  useEffect(() => {
    if (resetRequest === 0) {
      return
    }

    setIsLocked(false)
    setConnectedTerminalIds([])

    if (containerRef.current) {
      containerRef.current.classList.remove(
        'connection-lab--locked',
      )
    }
  }, [resetRequest])

  /*
   * Determine whether the component has the complete
   * required RLC topology.
   */
  const requiredTerminalIds =
    REQUIRED_CONNECTION_PAIRS.flat()

  const allRequiredTerminalsConnected =
    requiredTerminalIds.every(
      (terminalId) =>
        connectedTerminalIds.includes(terminalId),
    )

  /*
   * The equipment panel receives the RLC-specific props.
   *
   * IMPORTANT:
   * frequency and onFrequencyChange are passed here so
   * the Function Generator slider can update App.jsx state.
   */
  return (
    <div
      className="connection-lab"
      onClick={handleLabelClick}
      ref={containerRef}
    >
      <EquipmentPanel
       
        generatorOn={generatorOn}

        /*
         * RLC frequency slider props
         */
        frequency={frequency}
        onFrequencyChange={onFrequencyChange}

        connectedTerminalIds={
          connectedTerminalIds
        }

        highlightedTerminalIds={
          highlightedTerminalIds
        }

        meterCurrentAmperes={
          meterCurrentAmperes
        }

        meterVoltage={meterVoltage}

        onToggleMcb={onToggleMcb}
        onToggleGenerator={
          onToggleGenerator
        }
      />

      {/*
       * Keep these values available for future UI/guide
       * integrations without bringing back the old
       * Thevenin circuit diagram.
       */}
      <span
        className="sr-only"
        data-required-connections-complete={
          allRequiredTerminalsConnected
        }
      >
        RLC circuit connection status
      </span>
    </div>
  )
}

export default ConnectionLab