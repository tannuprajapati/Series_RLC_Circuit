
import React from 'react'

const FREQUENCIES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

export default function ResonancePlot({ observations = [] }) {
  const width = 760
  const height = 500

  const margin = {
    top: 35,
    right: 35,
    bottom: 75,
    left: 75,
  }

  const plotWidth = width - margin.left - margin.right
  const plotHeight = height - margin.top - margin.bottom

  const x = (frequency) =>
    margin.left + (frequency / 10.5) * plotWidth

  const y = (current) =>
    margin.top + ((11 - current) / 11) * plotHeight

  // Use only readings actually recorded in the Observation Table.
  const curve1 = observations
    .map((item) => {
      const frequency = Number(item.frequency)

      const current = Number(
        item.currentMilliAmperes ??
          (item.current != null
            ? Number(item.current) * 1000
            : NaN)
      )

      return { frequency, current }
    })
    .filter(
      (point) =>
        Number.isFinite(point.frequency) &&
        Number.isFinite(point.current) &&
        point.frequency > 0 &&
        point.current >= 0
    )
    .sort((a, b) => a.frequency - b.frequency)

  const makePath = (points) =>
    points
      .map((point, index) => {
        const px = x(point.frequency)
        const py = y(point.current)

        return `${index === 0 ? 'M' : 'L'} ${px} ${py}`
      })
      .join(' ')

  // Find the recorded reading with the highest current.
  const resonancePoint = curve1.reduce(
    (best, point) =>
      !best || point.current > best.current ? point : best,
    null
  )

  const resonanceX = resonancePoint
    ? x(resonancePoint.frequency)
    : null

  return (
    <section className="resonance-plot">
      <h2>Series RLC Resonance Characteristic</h2>

      {curve1.length < 2 ? (
        <p role="status">
          Add at least two readings to display the graph.
        </p>
      ) : (
        <svg
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="Frequency versus current graph using recorded observations"
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
          }}
        >
          <defs>
            <pattern
              id="rlcMinorGrid"
              width={plotWidth / 42}
              height={plotHeight / 44}
              patternUnits="userSpaceOnUse"
            >
              <path
                d={`M ${plotWidth / 42} 0 L 0 0 0 ${plotHeight / 44}`}
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="0.7"
              />
            </pattern>
          </defs>

          {/* Graph-paper background */}
          <rect
            x={margin.left}
            y={margin.top}
            width={plotWidth}
            height={plotHeight}
            fill="url(#rlcMinorGrid)"
          />

          {/* Y-axis grid and labels */}
          {Array.from({ length: 11 }, (_, i) => i + 1).map(
            (value) => (
              <g key={`y-${value}`}>
                <line
                  x1={margin.left}
                  y1={y(value)}
                  x2={width - margin.right}
                  y2={y(value)}
                  stroke="#cbd5e1"
                  strokeWidth="1"
                />

                <text
                  x={margin.left - 12}
                  y={y(value) + 5}
                  fontSize="13"
                  textAnchor="end"
                  fill="#374151"
                >
                  {value}
                </text>
              </g>
            )
          )}

          {/* X-axis grid and labels */}
          {FREQUENCIES.map((frequency) => (
            <g key={`x-${frequency}`}>
              <line
                x1={x(frequency)}
                y1={margin.top}
                x2={x(frequency)}
                y2={height - margin.bottom}
                stroke="#cbd5e1"
                strokeWidth="1"
              />

              <text
                x={x(frequency)}
                y={height - margin.bottom + 22}
                fontSize="13"
                textAnchor="middle"
                fill="#374151"
              >
                {frequency}
              </text>
            </g>
          ))}

          {/* X and Y axes */}
          <line
            x1={margin.left}
            y1={margin.top}
            x2={margin.left}
            y2={height - margin.bottom}
            stroke="#111827"
            strokeWidth="2"
          />

          <line
            x1={margin.left}
            y1={height - margin.bottom}
            x2={width - margin.right}
            y2={height - margin.bottom}
            stroke="#111827"
            strokeWidth="2"
          />

          {/* Dynamic resonance-frequency guide */}
          {resonancePoint && (
            <line
              x1={resonanceX}
              y1={margin.top}
              x2={resonanceX}
              y2={height - margin.bottom}
              stroke="#6b7280"
              strokeWidth="1.5"
              strokeDasharray="7 6"
            />
          )}

          {/* Recorded current curve */}
          <path
            d={makePath(curve1)}
            fill="none"
            stroke="#374151"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Recorded measurement markers */}
          {curve1.map((point) => (
            <circle
              key={`curve1-${point.frequency}`}
              cx={x(point.frequency)}
              cy={y(point.current)}
              r="5"
              fill="#ffffff"
              stroke="#374151"
              strokeWidth="2"
            />
          ))}

          {/* Curve label */}
          <text
            x={x(curve1[Math.min(3, curve1.length - 1)].frequency)}
            y={y(curve1[Math.min(3, curve1.length - 1)].current) - 12}
            fontSize="16"
            fill="#374151"
            fontWeight="600"
          >
            Curve 1
          </text>

          {/* Dynamic resonance label */}
          {resonancePoint && (
            <text
              x={Math.min(
                resonanceX + 8,
                width - margin.right - 145
              )}
              y={margin.top + 15}
              fontSize="12"
              fill="#4b5563"
            >
              Resonance ≈ {resonancePoint.frequency.toFixed(1)} kHz
            </text>
          )}

          {/* X-axis title */}
          <text
            x={margin.left + plotWidth / 2}
            y={height - 20}
            fontSize="16"
            textAnchor="middle"
            fill="#111827"
            fontWeight="600"
          >
            Frequency (kHz)
          </text>

          {/* Y-axis title */}
          <text
            transform={`translate(22 ${
              margin.top + plotHeight / 2
            }) rotate(-90)`}
            fontSize="16"
            textAnchor="middle"
            fill="#111827"
            fontWeight="600"
          >
            Current (mA)
          </text>
        </svg>
      )}
    </section>
  )
}
