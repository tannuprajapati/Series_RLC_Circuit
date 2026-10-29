
import React, { useMemo, useState } from 'react'

const FREQUENCIES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
const Y_AXIS_INTERVALS = 5
const MIN_Y_AXIS_MAX = 200

export default function ResonancePlot({
  observations = [],
  calculationDone = false,
}) {
  const [showCurve, setShowCurve] = useState(false)

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

  const curve1 = useMemo(() => {
    return observations
      .map((item) => {
        const frequency = Number(item?.frequency)

        const current =
          item?.currentMilliAmperes != null
            ? Number(item.currentMilliAmperes)
            : item?.current != null
              ? Number(item.current) * 1000
              : NaN

        return { frequency, current }
      })
      .filter(
        (point) =>
          Number.isFinite(point.frequency) &&
          Number.isFinite(point.current) &&
          point.frequency > 0 &&
          point.frequency <= 10 &&
          point.current >= 0
      )
      .sort((a, b) => a.frequency - b.frequency)
  }, [observations])

  const maxObservedCurrent = Math.max(
    0,
    ...curve1.map((point) => point.current),
  )

  const yAxisMax = Math.max(
    MIN_Y_AXIS_MAX,
    Math.ceil(maxObservedCurrent / Y_AXIS_INTERVALS) *
      Y_AXIS_INTERVALS,
  )

  const yAxisStep = yAxisMax / Y_AXIS_INTERVALS

  const x = (frequency) =>
    margin.left + (frequency / 10) * plotWidth

  const y = (current) =>
    margin.top +
    ((yAxisMax - current) / yAxisMax) * plotHeight

  const makePath = (points) =>
    points
      .map((point, index) => {
        const px = x(point.frequency)
        const py = y(point.current)

        return `${index === 0 ? 'M' : 'L'} ${px} ${py}`
      })
      .join(' ')

  const resonancePoint = curve1.reduce(
    (best, point) =>
      !best || point.current > best.current ? point : best,
    null,
  )

  const canPlot = calculationDone && curve1.length >= 2

  const handlePlot = () => {
    if (!canPlot) return
    setShowCurve(true)
  }

  return (
    <section className="resonance-plot">
      <h2>Series RLC Resonance Characteristic</h2>

      <div className="resonance-plot__controls">
        <button
          type="button"
          className="plot-btn"
          disabled={!canPlot}
          onClick={handlePlot}
        >
          Plot
        </button>
      </div>

      {!calculationDone && (
        <p role="status">
          Verify the circuit and calculations to enable plotting.
        </p>
      )}

      {calculationDone && curve1.length < 2 && (
        <p role="status">
          Record at least two observations to plot the curve.
        </p>
      )}

      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={
          showCurve
            ? 'Frequency versus current graph with recorded RLC observations'
            : 'Empty frequency versus current graph, ready for plotting'
        }
        style={{
          width: '100%',
          height: 'auto',
          display: 'block',
        }}
      >
        <defs>
          <pattern
            id="rlcMinorGrid"
            width={plotWidth / 50}
            height={plotHeight / 50}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${plotWidth / 50} 0 L 0 0 0 ${plotHeight / 50}`}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="0.7"
            />
          </pattern>
        </defs>

        {/* Always-visible graph background */}
        <rect
          x={margin.left}
          y={margin.top}
          width={plotWidth}
          height={plotHeight}
          fill="url(#rlcMinorGrid)"
        />

        {/* Y-axis grid and labels */}
        {Array.from(
          { length: Y_AXIS_INTERVALS + 1 },
          (_, index) => index,
        ).map((index) => {
          const value = index * yAxisStep

          return (
            <g key={`y-${index}`}>
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
                fill="currentColor"
              >
                {Number(value.toFixed(2))}
              </text>
            </g>
          )
        })}

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
              fill="currentColor"
            >
              {frequency}
            </text>
          </g>
        ))}

        {/* Always-visible axes */}
        <line
          x1={margin.left}
          y1={margin.top}
          x2={margin.left}
          y2={height - margin.bottom}
          stroke="currentColor"
          strokeWidth="2"
        />

        <line
          x1={margin.left}
          y1={height - margin.bottom}
          x2={width - margin.right}
          y2={height - margin.bottom}
          stroke="currentColor"
          strokeWidth="2"
        />

        {/* Curve and measurement markers appear after Plot */}
        {showCurve && curve1.length >= 2 && (
          <>
            {resonancePoint && (
              <line
                x1={x(resonancePoint.frequency)}
                y1={margin.top}
                x2={x(resonancePoint.frequency)}
                y2={height - margin.bottom}
                stroke="#6b7280"
                strokeWidth="1.5"
                strokeDasharray="7 6"
              />
            )}

            <path
              d={makePath(curve1)}
              fill="none"
              stroke="#2563eb"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {curve1.map((point, index) => (
              <circle
                key={`reading-${index}`}
                cx={x(point.frequency)}
                cy={y(point.current)}
                r="4.5"
                fill="#ffffff"
                stroke="#2563eb"
                strokeWidth="2"
              >
                <title>
                  {`Frequency: ${point.frequency} kHz, Current: ${point.current.toFixed(2)} mA`}
                </title>
              </circle>
            ))}

            {resonancePoint && (
              <text
                x={Math.min(
                  x(resonancePoint.frequency) + 8,
                  width - margin.right - 155,
                )}
                y={margin.top + 15}
                fontSize="12"
                fill="currentColor"
              >
                Maximum current: {resonancePoint.current.toFixed(2)} mA
              </text>
            )}
          </>
        )}

        {/* Axis titles are always visible */}
        <text
          x={margin.left + plotWidth / 2}
          y={height - 20}
          fontSize="16"
          textAnchor="middle"
          fill="currentColor"
          fontWeight="600"
        >
          Frequency (kHz)
        </text>

        <text
          transform={`translate(22 ${
            margin.top + plotHeight / 2
          }) rotate(-90)`}
          fontSize="16"
          textAnchor="middle"
          fill="currentColor"
          fontWeight="600"
        >
          Current (mA)
        </text>
      </svg>
    </section>
  )
}
