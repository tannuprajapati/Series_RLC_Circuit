import { useEffect, useRef, useState } from 'react'
import SectionCard from './SectionCard.jsx'
import {
  AddIcon,
  AiGuide,
  ButtonIcon,
  CheckIcon,
  CalculateIcon,
  CloseIcon,
  PrintIcon,
  ResetIcon,
  AutoConnectIcon,
} from './Icons.jsx'

const buttons = [
  {
    id: 'instruction-button',
    label: 'INSTRUCTIONS',
    tone: 'action-button--gold',
    Icon: ButtonIcon,
    opensInstructions: true,
  },
  {
    id: 'ai-guide-button',
    label: 'AI GUIDE',
    tone: 'action-button--cyan',
    Icon: AiGuide,
    handlerName: 'onAiGuide',
  },
  {
    id: 'auto-connect-button',
    label: 'AUTO CONNECT',
    tone: 'action-button--blue',
    Icon: AutoConnectIcon,
    handlerName: 'onAutoConnect',
  },
  {
    id: 'check-button',
    label: 'CHECK',
    tone: 'action-button--green',
    Icon: CheckIcon,
    handlerName: 'onCheck',
  },
  {
    id: 'add-reading-button',
    label: 'ADD',
    tone: 'action-button--blue',
    Icon: AddIcon,
    handlerName: 'onAdd',
  },
  {
    id: 'plot-button',
    label: 'PLOT',
    tone: 'action-button--orange',
    Icon: CalculateIcon,
    handlerName: 'onPlot',
  },
  {
    id: 'reset-button',
    label: 'RESET',
    tone: 'action-button--red',
    Icon: ResetIcon,
    handlerName: 'onReset',
  },
  {
    id: 'print-button',
    label: 'PRINT',
    tone: 'action-button--purple',
    Icon: PrintIcon,
    handlerName: 'onPrint',
  },
]

const instructionOrder = [
  'connections',
  'check-connections',
  'mcb',
  'function-generator',
  'frequency',
  'add-reading',
  'repeat-readings',
  'calculation',
  'print',
  'reset',
]

const ActionButtons = ({
  activeButtons = {},
  disabledButtons = {},
  onAdd,
  onAiGuide,
  onCheck,
  onPlot,
  onPrint,
  onReset,
  onAutoConnect,
  activeInstructionStep,
}) => {
  const [instructionsOpen, setInstructionsOpen] = useState(false)
  const instructionsBodyRef = useRef(null)

  const activeInstructionIndex =
    instructionOrder.indexOf(activeInstructionStep)

  const getInstructionProps = (stepId) => {
    const stepIndex = instructionOrder.indexOf(stepId)

    const state =
      stepIndex < activeInstructionIndex
        ? 'completed'
        : stepIndex === activeInstructionIndex
          ? 'active'
          : 'pending'

    return {
      'aria-current': state === 'active' ? 'step' : undefined,
      'aria-disabled': state === 'pending' ? 'true' : undefined,
      className: `action-step action-step--${state}`,
      'data-instruction-step': stepId,
    }
  }

  useEffect(() => {
    if (!instructionsOpen || !instructionsBodyRef.current) {
      return
    }

    const activeStep = instructionsBodyRef.current.querySelector(
      `[data-instruction-step="${activeInstructionStep}"]`,
    )

    const body = instructionsBodyRef.current
    const bodyRect = body.getBoundingClientRect()
    const stepRect = activeStep?.getBoundingClientRect()

    if (!stepRect) {
      return
    }

    const nextScrollTop =
      body.scrollTop +
      stepRect.top -
      bodyRect.top -
      (body.clientHeight - stepRect.height) / 2

    body.scrollTo({
      behavior: 'smooth',
      top: Math.max(0, nextScrollTop),
    })
  }, [activeInstructionStep, instructionsOpen])

  const handlers = {
    onAdd,
    onPlot,
    onCheck,
    onPrint,
    onReset,
    onAiGuide,
    onAutoConnect,
  }

  return (
    <SectionCard
      className={`action-buttons-card h-[160px] ${
        instructionsOpen ? 'action-buttons-card--instructions-open' : ''
      }`}
      icon="buttons"
      id="action-buttons-panel"
      title="ACTION BUTTONS"
    >
      <div className="action-buttons__grid">
        {buttons.map(
          ({
            id,
            label,
            tone,
            Icon,
            handlerName,
            opensInstructions,
          }) => {
            const handler = handlers[handlerName]

            const isActive =
              !opensInstructions && Boolean(activeButtons[handlerName])

            const isDisabled =
              !opensInstructions &&
              (!handler || disabledButtons[handlerName])

            const buttonProps = opensInstructions
              ? {
                  'aria-controls': 'experiment-instructions-panel',
                  'aria-expanded': instructionsOpen,
                  onClick: () =>
                    setInstructionsOpen((current) => !current),
                }
              : {
                  'aria-pressed':
                    handlerName === 'onAiGuide'
                      ? isActive
                      : undefined,
                  onClick: handler,
                }

            return (
              <button
                id={id}
                key={label}
                type="button"
                className={`action-button ${tone} ${
                  isActive ? 'action-button--active' : ''
                }`}
                disabled={isDisabled}
                {...buttonProps}
              >
                <Icon />
                <span>{label}</span>
              </button>
            )
          },
        )}
      </div>

      {instructionsOpen ? (
        <div
          className="action-instructions-panel"
          id="experiment-instructions-panel"
          role="region"
          aria-labelledby="experiment-instructions-title"
        >
          <div className="action-instructions-panel__header">
            <h3 id="experiment-instructions-title">
              Instructions
            </h3>

            <button
              type="button"
              className="action-instructions-panel__close"
              aria-label="Close instructions"
              onClick={() => setInstructionsOpen(false)}
            >
              <CloseIcon />
            </button>
          </div>

          <div
            className="action-instructions-panel__body"
            ref={instructionsBodyRef}
          >
            <ol className="action-instructions-panel__steps">

              <li {...getInstructionProps('connections')}>
                <strong>Step 1:</strong> Make connections as per the
                instructions given below:
                <br />
                <br />

                <strong>(a)</strong> (1-13), (2-14)
                <br />
                <br />

                <strong>(b)</strong> (3-15), (4-16)
                <br />
                <br />

                <strong>(c)</strong> (5-15), (6-7), (8-11)
                <br />
                <br />

                <strong>(d)</strong> (9-12), (10-16)
              </li>

              <li {...getInstructionProps('check-connections')}>
                <strong>Step 2:</strong>
                <br />
                <strong>(a)</strong> Now, Check the connections by
                clicking on <strong>‘CHECK’</strong> button.
                <br />
                <br />

                <strong>(b)</strong> If the connections are
                <strong> ‘Invalid connections’</strong>, click on
                corresponding node to remove the connection.
                <br />
                <br />

                <strong>(c)</strong> And if the connections are
                <strong> ‘Right Connections’</strong> then follow the
                below steps.
              </li>

              <li {...getInstructionProps('mcb')}>
                <strong>Step 3:</strong> Turn on the MCB.
              </li>

              <li {...getInstructionProps('function-generator')}>
                <strong>Step 4:</strong> Click on Function Generator
                <strong> ‘Power’</strong> button.
              </li>

              <li {...getInstructionProps('frequency')}>
                <strong>Step 5:</strong> Now, Vary the frequency by
                moving the slider.
              </li>

              <li {...getInstructionProps('add-reading')}>
                <strong>Step 6:</strong> Now, Click on
                <strong> ‘ADD’</strong> button to add the readings in
                the observation table.
              </li>

              <li {...getInstructionProps('repeat-readings')}>
                <strong>Step 7:</strong> Repeat Step 5 to Step 6 until
                we get the 8th reading in the observation table.
              </li>

              <li {...getInstructionProps('calculation')}>
                <strong>Step 8:</strong> In Calculation section, We
                have to manually calculate the
                <strong> Resonance frequency</strong> and
                <strong> Quality factor</strong> by using the
                formulaes in the <strong>"FORMULA tab"</strong> and
                verify the values with the help of
                <strong> Verify</strong> button.
              </li>

              <li {...getInstructionProps('print')}>
                <strong>Step 9:</strong> Click on
                <strong> ‘PRINT’</strong> button to takeout the print
                of the webpage.
              </li>

              <li {...getInstructionProps('reset')}>
                <strong>Step 10:</strong> Click on
                <strong> ‘RESET’</strong> button to reload the webpage.
              </li>

            </ol>
          </div>
        </div>
      ) : null}
    </SectionCard>
  )
}

export default ActionButtons