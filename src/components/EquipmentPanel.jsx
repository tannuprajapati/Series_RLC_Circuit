import Ammeter from './Ammeter.jsx'
import Voltmeter from './Voltmeter.jsx'
import MCB from './MCB.jsx'
import Resistor from './Resistor.jsx'
import FunctionGenerator from './FunctionGenerator.jsx'
import Inductor from './Inductor.jsx'
import Capacitor from './Capacitor.jsx'

const EquipmentPanel = ({
  mcbOn = false,
  generatorOn = false,

  // RLC frequency
  frequency = 1.0,

  connectedTerminalIds = [],
  highlightedTerminalIds = [],

  meterCurrentAmperes = 0,
  meterVoltage = 0,

  onToggleMcb,
  onToggleGenerator,
  onFrequencyChange,

  powerOn,
}) => {
  const voltmeterConnected = [
    '3-endpoint',
    '4-endpoint',
  ].every(
    (terminalId) =>
      connectedTerminalIds.includes(terminalId)
  )

  const ammeterConnected = [
    '5-endpoint',
    '6-endpoint',
  ].every(
    (terminalId) =>
      connectedTerminalIds.includes(terminalId)
  )

  const resistorConnected = [
    '7-endpoint',
    '8-endpoint',
  ].every(
    (terminalId) =>
      connectedTerminalIds.includes(terminalId)
  )

  const inductorConnected = [
    '9-endpoint',
    '10-endpoint',
  ].every(
    (terminalId) =>
      connectedTerminalIds.includes(terminalId)
  )

  const capacitorConnected = [
    '11-endpoint',
    '12-endpoint',
  ].every(
    (terminalId) =>
      connectedTerminalIds.includes(terminalId)
  )

  /*
   * The actual meter values will come from App.jsx.
   *
   * We intentionally do not calculate RLC values here.
   * EquipmentPanel is responsible only for displaying
   * the instruments and forwarding controls.
   */

  return (
    <section
      className="equipment-panel"
      id="equipment-panel"
    >
      {/* =========================
          MCB
      ========================= */}

      <MCB
        mcbOn={mcbOn}
        connectedTerminalIds={
          connectedTerminalIds
        }
        highlightedTerminalIds={
          highlightedTerminalIds
        }
        onToggleMcb={onToggleMcb}
      />

      {/* =========================
          VOLTMETER + AMMETER
      ========================= */}

      <div className="equipment-panel__meters">

        <Voltmeter
          connectedTerminalIds={
            connectedTerminalIds
          }
          highlightedTerminalIds={
            highlightedTerminalIds
          }
          value={
            voltmeterConnected && mcbOn && generatorOn
              ? meterVoltage
              : 0
          }
        />

        <Ammeter
          connectedTerminalIds={
            connectedTerminalIds
          }
          highlightedTerminalIds={
            highlightedTerminalIds
          }
          label="A1"
          value={
            ammeterConnected && mcbOn && generatorOn
              ? meterCurrentAmperes
              : 0
          }
        />

      </div>

      {/* =========================
          FUNCTION GENERATOR
      ========================= */}

      <div className="equipment-panel__functionGenerator">
        <FunctionGenerator
          generatorOn={generatorOn}

          frequency={frequency}

          connectedTerminalIds={
            connectedTerminalIds
          }

          highlightedTerminalIds={
            highlightedTerminalIds
          }

          onToggleGenerator={
            onToggleGenerator
          }

          onFrequencyChange={
            onFrequencyChange
          }
        />
      </div>

      {/* =========================
          RESISTOR
      ========================= */}

      <div className="equipment-panel__resistor">
        <Resistor
          connectedTerminalIds={
            connectedTerminalIds
          }
          highlightedTerminalIds={
            highlightedTerminalIds
          }
        />
      </div>

      {/* =========================
          INDUCTOR
      ========================= */}

      <div className="equipment-panel__inductor">
        <Inductor
          connectedTerminalIds={
            connectedTerminalIds
          }
          highlightedTerminalIds={
            highlightedTerminalIds
          }
        />
      </div>

      {/* =========================
          CAPACITOR
      ========================= */}

      <div className="equipment-panel__capacitor">
        <Capacitor
          connectedTerminalIds={
            connectedTerminalIds
          }
          highlightedTerminalIds={
            highlightedTerminalIds
          }
          connected={capacitorConnected}
        />
      </div>
    </section>
  )
}

export default EquipmentPanel