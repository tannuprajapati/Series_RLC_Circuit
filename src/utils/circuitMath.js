
/**
 * Series RLC circuit calculations.
 * UI frequency: kHz
 * Resistance: ohms
 * Inductance: henries
 * Capacitance: farads
 * Voltage: RMS volts
 * Current returned by calculateRlcReading: mA
 * Power: watts
 * Resistor voltage: volts
 */

const toFiniteNumber = (value) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

export const calculateRlcReading = ({
  frequency,
  voltage,
  resistance,
  inductance,
  capacitance,
  circuitOn = true,
}) => {
  const fKHz = toFiniteNumber(frequency)
  const V = Math.max(toFiniteNumber(voltage), 0)
  const R = Math.max(toFiniteNumber(resistance), 0)
  const L = Math.max(toFiniteNumber(inductance), 0)
  const C = Math.max(toFiniteNumber(capacitance), 0)

  const frequencyHz = Math.max(fKHz, 0) * 1000

  if (!circuitOn || fKHz <= 0 || V <= 0 || R <= 0 || L <= 0 || C <= 0) {
    return {
      frequencyHz,
      xl: 0,
      xc: 0,
      impedance: 0,
      current: 0,
      phaseAngle: 0,
      power: 0,
      resistorVoltage: 0,
    }
  }

  const xl = 2 * Math.PI * frequencyHz * L
  const xc = 1 / (2 * Math.PI * frequencyHz * C)
  const netReactance = xl - xc
  const impedance = Math.hypot(R, netReactance)

  const currentAmps = V / impedance
  const current = currentAmps * 1000

  const phaseAngle =
    Math.atan2(netReactance, R) * (180 / Math.PI)

  const power = currentAmps ** 2 * R
  const resistorVoltage = currentAmps * R

  return {
    frequencyHz,
    xl,
    xc,
    impedance,
    current,
    phaseAngle,
    power,
    resistorVoltage,
  }
}

export const calculateTheoreticalResonanceFrequency = (
  inductance,
  capacitance
) => {
  const L = toFiniteNumber(inductance)
  const C = toFiniteNumber(capacitance)

  if (L <= 0 || C <= 0) return 0

  // Returns frequency in Hz.
  return 1 / (2 * Math.PI * Math.sqrt(L * C))
}

export const calculateQualityFactor = (
  resistance,
  inductance,
  capacitance
) => {
  const R = toFiniteNumber(resistance)
  const L = toFiniteNumber(inductance)
  const C = toFiniteNumber(capacitance)

  if (R <= 0 || L <= 0 || C <= 0) return 0

  return (1 / R) * Math.sqrt(L / C)
}

// Legacy exports retained for compatibility with existing imports.
export const THEVENIN_RESISTANCE_OHMS = 450

export const calculateReadings = ({ voltage, r1, r3, rl }) => {
  const vs = Math.max(toFiniteNumber(voltage), 0)
  const R1 = Math.max(toFiniteNumber(r1), 0)
  const R3 = Math.max(toFiniteNumber(r3), 0)
  const RL = Math.max(toFiniteNumber(rl), 0)

  const rth = THEVENIN_RESISTANCE_OHMS
  const vth =
    R1 + R3 > 0 ? vs * (R3 / (R1 + R3)) : 0
  const il = rth + RL > 0 ? vth / (rth + RL) : 0

  return { rth, vth, il }
}
