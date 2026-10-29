export const POSITIVE_TERMINALS = [
  '1-endpoint',
  '3-endpoint',
  '5-endpoint',
]

export const NEGATIVE_TERMINALS = [
  '2-endpoint',
  '4-endpoint',
  '6-endpoint',

]

export const CIRCUIT_POSITIVE_TERMINALS = [
  '7-endpoint',
  '9-endpoint',
  '11-endpoint',
]

export const CIRCUIT_NEGATIVE_TERMINALS = [
  '8-endpoint',
  '10-endpoint',
  '12-endpoint',
]

/*
 * REQUIRED RLC SERIES RESONANCE CONNECTIONS
 *
 * 1.  1 -> 3
 * 2.  2 -> 4
 * 3.  
 * 4.  5 -> 1
 * 5.  
 * 6.  6 -> 7
 * 7.  8 -> 11
 * 8.  9 -> 12
 * 9.  10 -> 2
 */
export const REQUIRED_CONNECTION_PAIRS = [
  ['1-endpoint', '3-endpoint'],
  ['1-endpoint', '5-endpoint'],
  ['2-endpoint', '4-endpoint'],
  ['6-endpoint', '7-endpoint'],
  ['8-endpoint', '11-endpoint'],
  ['12-endpoint', '9-endpoint'],
  ['10-endpoint', '2-endpoint'],
]

export const resolveJsPlumb = (module) => (
  module?.jsPlumb
  || module?.default?.jsPlumb
  || module?.default
  || window.jsPlumb
)

const getAllConnections = (instance) => {
  if (!instance) {
    return []
  }

  if (typeof instance.getAllConnections === 'function') {
    return instance.getAllConnections()
  }

  if (typeof instance.getConnections === 'function') {
    return instance.getConnections()
  }

  return []
}

export const deleteConnectionsForTerminal = (
  instance,
  terminalId,
) => {
  const matchingConnections = getAllConnections(instance).filter(
    (connection) => {
      const sourceId =
        connection.sourceId ||
        connection.source?.id

      const targetId =
        connection.targetId ||
        connection.target?.id

      return (
        sourceId === terminalId ||
        targetId === terminalId
      )
    },
  )

  matchingConnections.forEach((connection) => {
    if (
      typeof instance.deleteConnection === 'function'
    ) {
      instance.deleteConnection(connection)
      return
    }

    connection.detach?.()
  })

  return matchingConnections.length
}

const isNegativeTerminal = (terminalId) => (
  NEGATIVE_TERMINALS.includes(terminalId)
  || CIRCUIT_NEGATIVE_TERMINALS.includes(terminalId)
)

const terminalPaintStyles = {
  positive: {
    fill: '#e33024',
    outlineStroke: '#fff8f6',
    outlineWidth: 1.6,
    stroke: '#8f140e',
    strokeWidth: 1.12,
  },

  negative: {
    fill: '#151515',
    outlineStroke: '#f5f5f5',
    outlineWidth: 1.6,
    stroke: '#000000',
    strokeWidth: 1.12,
  },
}

const terminalHoverPaintStyles = {
  positive: {
    fill: '#ff4a3d',
    outlineStroke: '#ffffff',
    outlineWidth: 1.92,
    stroke: '#81130f',
    strokeWidth: 1.28,
  },

  negative: {
    fill: '#303030',
    outlineStroke: '#ffffff',
    outlineWidth: 1.92,
    stroke: '#000000',
    strokeWidth: 1.28,
  },
}

const getTerminalNumber = (terminalId) => (
  terminalId.replace('-endpoint', '')
)

const getCssValue = (
  styles,
  propertyName,
  fallback,
) => {
  const value = styles
    .getPropertyValue(propertyName)
    .trim()

  return value || fallback
}

const getCssNumber = (
  styles,
  propertyName,
  fallback,
) => {
  const value = Number.parseFloat(
    styles.getPropertyValue(propertyName),
  )

  return Number.isFinite(value)
    ? value
    : fallback
}

const getEndpointPaintStyle = (
  element,
  type,
  state = 'default',
) => {
  const styles = window.getComputedStyle(element)

  const prefix =
    state === 'hover'
      ? '--jtk-endpoint-hover'
      : '--jtk-endpoint'

  const defaults =
    state === 'hover'
      ? terminalHoverPaintStyles[type]
      : terminalPaintStyles[type]

  return {
    fill: getCssValue(
      styles,
      `${prefix}-fill`,
      defaults.fill,
    ),

    outlineStroke: getCssValue(
      styles,
      `${prefix}-outline-stroke`,
      defaults.outlineStroke,
    ),

    outlineWidth: getCssNumber(
      styles,
      `${prefix}-outline-width`,
      defaults.outlineWidth,
    ),

    stroke: getCssValue(
      styles,
      `${prefix}-stroke`,
      defaults.stroke,
    ),

    strokeWidth: getCssNumber(
      styles,
      `${prefix}-stroke-width`,
      defaults.strokeWidth,
    ),
  }
}

const getEndpointRadius = (element) => (
  getCssNumber(
    window.getComputedStyle(element),
    '--jtk-endpoint-radius',
    4,
  )
)

const getEndpointCssClass = (
  terminalId,
  type,
) => {
  const terminalNumber =
    getTerminalNumber(terminalId)

  return [
    'jtk-endpoint--terminal',
    `jtk-endpoint--terminal-${terminalNumber}`,
    `jtk-endpoint--${terminalId}`,
    `jtk-endpoint--${type}`,
  ].join(' ')
}

export const wirePaintStyles = {
  positive: {
    outlineStroke: '#771914',
    outlineWidth: 0.92,
    stroke: '#dd342d',
    strokeWidth: 3.68,
  },

  negative: {
    outlineStroke: '#000000',
    outlineWidth: 0.92,
    stroke: '#111111',
    strokeWidth: 3.68,
  },
}

export const wireHoverPaintStyles = {
  positive: {
    outlineStroke: '#5d110d',
    outlineWidth: 1.08,
    stroke: '#f04a42',
    strokeWidth: 4,
  },

  negative: {
    outlineStroke: '#000000',
    outlineWidth: 1.08,
    stroke: '#292929',
    strokeWidth: 4,
  },
}

export const getConnectionBetween = (
  instance,
  firstId,
  secondId,
) => {
  const connections = getAllConnections(instance)

  return connections.find((connection) => {
    const sourceId =
      connection.sourceId ||
      connection.source?.id

    const targetId =
      connection.targetId ||
      connection.target?.id

    return (
      (sourceId === firstId &&
        targetId === secondId)
      ||
      (sourceId === secondId &&
        targetId === firstId)
    )
  })
}

export const hasConnectionBetween = (
  instance,
  firstId,
  secondId,
) => (
  Boolean(
    getConnectionBetween(
      instance,
      firstId,
      secondId,
    ),
  )
)

export const addTerminalEndpoint = (
  instance,
  terminalId,
  type,
) => {
  const element =
    document.getElementById(terminalId)


  if (!element) {
    console.warn(
      `jsPlumb: terminal ${terminalId} not found in DOM`,
    )

    return false
  }

  /*
   * Prevent duplicate endpoints.
   */
  const existingEndpoint =
    instance.getEndpoint?.(terminalId)

  if (existingEndpoint) {
    return true
  }

  const endpoint = instance.addEndpoint(
    element,
    {
      uuid: terminalId,

      endpoint: [
        'Dot',
        {
          radius:
            getEndpointRadius(element),
        },
      ],

      cssClass: getEndpointCssClass(
        terminalId,
        type,
      ),

      anchor: ['Center'],

      isSource: true,
      isTarget: true,

      connectionType: type,

      connectionsDetachable: true,

      connectorStyle:
        wirePaintStyles[type],

      connectorHoverStyle:
        wireHoverPaintStyles[type],

      /*
       * Terminals 15 and 16 are junctions.
       * Each accepts two connections.
       */
      maxConnections:
        terminalId === '1-endpoint' ||
        terminalId === '2-endpoint'
          ? 2
          : 1,

      paintStyle:
        getEndpointPaintStyle(
          element,
          type,
        ),

      hoverPaintStyle:
        getEndpointPaintStyle(
          element,
          type,
          'hover',
        ),
    },
  )

  const terminalTitle =
    element.getAttribute('title') ||
    element.getAttribute('aria-label')

  if (
    terminalTitle &&
    endpoint?.canvas
  ) {
    endpoint.canvas.setAttribute(
      'aria-label',
      terminalTitle,
    )
  }

  return true
}

/*
 * Add every endpoint required by the RLC experiment.
 *
 * There is NO resistance configuration check here.
 */
export const addAllEndpoints = (instance) => {
  POSITIVE_TERMINALS.forEach(
    (terminalId) => {
      addTerminalEndpoint(
        instance,
        terminalId,
        'positive',
      )
    },
  )

  NEGATIVE_TERMINALS.forEach(
    (terminalId) => {
      addTerminalEndpoint(
        instance,
        terminalId,
        'negative',
      )
    },
  )

  CIRCUIT_POSITIVE_TERMINALS.forEach(
    (terminalId) => {
      addTerminalEndpoint(
        instance,
        terminalId,
        'positive',
      )
    },
  )

  CIRCUIT_NEGATIVE_TERMINALS.forEach(
    (terminalId) => {
      addTerminalEndpoint(
        instance,
        terminalId,
        'negative',
      )
    },
  )
}

export const lockJsPlumbCircuit = (
  instance,
  containerElement,
) => {
  getAllConnections(instance).forEach(
    (connection) => {
      connection.setDetachable?.(false)

      connection.endpoints?.forEach(
        (endpoint) => {
          endpoint.setEnabled?.(false)
        },
      )
    },
  )

  containerElement?.classList.add(
    'connection-lab--locked',
  )
}

export const unlockJsPlumbCircuit = (
  instance,
  containerElement,
) => {
  getAllConnections(instance).forEach(
    (connection) => {
      connection.setDetachable?.(true)

      connection.endpoints?.forEach(
        (endpoint) => {
          endpoint.setEnabled?.(true)
        },
      )
    },
  )

  containerElement?.classList.remove(
    'connection-lab--locked',
  )
}

/*
 * =========================================================
 * RLC CONNECTION VALIDATION
 * =========================================================
 *
 * The circuit is correct ONLY when:
 *
 * 1-13
 * 2-14
 * 3-15
 * 4-16
 * 5-15
 * 6-7
 * 8-11
 * 9-12
 * 10-16
 *
 * No missing connections.
 * No extra/wrong connections.
 */
export const validateRlcConnections = (
  instance,
) => {
  const connections =
    getAllConnections(instance)

  const totalConnections =
    connections.length

  const missingPairs =
    REQUIRED_CONNECTION_PAIRS.filter(
      ([firstId, secondId]) => (
        !hasConnectionBetween(
          instance,
          firstId,
          secondId,
        )
      ),
    )

  const wrongPairs =
    connections
      .map((connection) => [
        connection.sourceId ||
          connection.source?.id,

        connection.targetId ||
          connection.target?.id,
      ])
      .filter(
        ([sourceId, targetId]) => (
          sourceId &&
          targetId &&
          !REQUIRED_CONNECTION_PAIRS.some(
            ([firstId, secondId]) => (
              (
                sourceId === firstId &&
                targetId === secondId
              )
              ||
              (
                sourceId === secondId &&
                targetId === firstId
              )
            ),
          )
        ),
      )

  const matchedCount =
    REQUIRED_CONNECTION_PAIRS.length -
    missingPairs.length

  const isCorrect =
    missingPairs.length === 0 &&
    wrongPairs.length === 0 &&
    totalConnections ===
      REQUIRED_CONNECTION_PAIRS.length

  return {
    isCorrect,

    matchedCount,

    missingPairs,

    totalConnections,

    wrongPairs,
  }
}

/*
 * =========================================================
 * RLC AUTO CONNECT
 * =========================================================
 *
 * Auto Connect creates ONLY the nine required connections.
 *
 * IMPORTANT:
 * Auto Connect does NOT perform verification.
 * The user must still click CHECK.
 */
export const autoConnectRlcCircuit = (
  instance,
) => {
  if (!instance) {
    return {
      success: false,
      reason: 'NO_INSTANCE',
    }
  }

  /*
   * Remove every existing connection first.
   */
  const existingConnections = [
    ...getAllConnections(instance),
  ]

  let removedCount = 0

  existingConnections.forEach(
    (connection) => {
      if (
        typeof instance.deleteConnection ===
        'function'
      ) {
        instance.deleteConnection(
          connection,
        )
      } else {
        connection.detach?.()
      }

      removedCount += 1
    },
  )

  /*
   * Create the required nine connections.
   */
  let addedCount = 0

  const connectPair = (
    firstId,
    secondId,
  ) => {
    if (
      hasConnectionBetween(
        instance,
        firstId,
        secondId,
      )
    ) {
      return
    }

    const type =
      isNegativeTerminal(firstId)
        ? 'negative'
        : 'positive'

    instance.connect({
      uuids: [
        firstId,
        secondId,
      ],

      type,
    })

    addedCount += 1
  }

  REQUIRED_CONNECTION_PAIRS.forEach(
    ([firstId, secondId]) => {
      connectPair(
        firstId,
        secondId,
      )
    },
  )

  /*
   * Auto Connect is considered successful when the
   * nine required connections were created correctly.
   *
   * It does NOT mean CHECK has been completed.
   */
  const validation =
    validateRlcConnections(instance)

  return {
    addedCount,
    removedCount,

    success: validation.isCorrect,

    validation,
  }
}