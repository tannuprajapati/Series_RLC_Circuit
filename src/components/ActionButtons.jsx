
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
  'function-generator',
  'frequency',
  'add-reading',
  'repeat-readings',
  'calculation',
  'print',
  'reset',
]

const MAX_OBSERVATIONS = 10

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
        instructionsOpen
          ? 'action-buttons-card--instructions-open'
          : ''
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
              !opensInstructions &&
              Boolean(activeButtons[handlerName])

            const existingDisabled =
              !handler || Boolean(disabledButtons[handlerName])

            const isDisabled = opensInstructions
              ? false
              : handlerName === 'onPlot'
                ? existingDisabled ||
                  Boolean(disabledButtons.onPlot)
                : existingDisabled

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
                <br /><br />
                <strong>(a)</strong> (1-3), (2-4)
                <br /><br />
                <strong>(b)</strong> (5-1), (6-7)
                <br /><br />
                <strong>(c)</strong> (8-11)
                <br /><br />
                <strong>(d)</strong> (9-12), (10-2)
              </li>

              <li {...getInstructionProps('check-connections')}>
                <strong>Step 2:</strong>
                <br />
                 Now, check the connections by
                clicking on <strong>‘CHECK’</strong> button.
                <br />
              
              </li>

              <li {...getInstructionProps('function-generator')}>
                <strong>Step 3:</strong> Click on Function Generator
                <strong> ‘Power’</strong> button.
              </li>

              <li {...getInstructionProps('frequency')}>
                <strong>Step 4:</strong> Vary the frequency by
                moving the slider.
              </li>

              <li {...getInstructionProps('add-reading')}>
                <strong>Step 5:</strong> Click on
                <strong> ‘ADD’</strong> to add the reading to the
                observation table.
              </li>

              <li {...getInstructionProps('repeat-readings')}>
                <strong>Step 6:</strong> Repeat Steps 4 and 5 until all
                <strong> 10 readings </strong>
                have been added to the observation table.
              </li>

              <li {...getInstructionProps('calculation')}>
                <strong>Step 7:</strong> Review the calculated
                resonance frequency and quality factor, click
                <strong> Verify</strong>, and then click
                <strong> PLOT</strong> to display Curve 1.
              </li>

              <li {...getInstructionProps('print')}>
                <strong>Step 8:</strong> Click
                <strong> ‘PRINT’</strong> to print the webpage.
              </li>

              <li {...getInstructionProps('reset')}>
                <strong>Step 9:</strong> Click
                <strong> ‘RESET’</strong> to restart the experiment.
              </li>
            </ol>
          </div>
        </div>
      ) : null}
    </SectionCard>
  )
}

export default ActionButtons
