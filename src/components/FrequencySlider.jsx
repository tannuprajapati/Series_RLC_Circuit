// import { FREQUENCY_SLIDER_CONFIG } from '../utils/frequency.js'

// const FrequencySlider = ({
//   disabled = false,
//   label = 'Frequency',
//   onChange,
//   onDisabledInteraction,
//   value,
// }) => {
//   const config = FREQUENCY_SLIDER_CONFIG.frequency
//   const discreteValues = config.values ?? null

//   const normalizeFrequency = (inputValue) => {
//     const number = Number(inputValue)

//     if (discreteValues) {
//       return discreteValues.reduce(
//         (closest, option) => (
//           Math.abs(option - number) <
//           Math.abs(closest - number)
//             ? option
//             : closest
//         ),
//         discreteValues[0],
//       )
//     }

//     return Math.min(
//       Math.max(
//         Number.isFinite(number)
//           ? number
//           : config.min,
//         config.min,
//       ),
//       config.max,
//     )
//   }

//   const sliderValue = normalizeFrequency(value)

//   const sliderPosition = discreteValues
//     ? discreteValues.indexOf(
//         normalizeFrequency(sliderValue),
//       )
//     : sliderValue

//   const sliderMin = discreteValues
//     ? 0
//     : config.min

//   const sliderMax = discreteValues
//     ? discreteValues.length - 1
//     : config.max

//   const sliderStep = discreteValues
//     ? 1
//     : config.step

//   const getValueAtPosition = (inputPosition) => {
//     const numericPosition = Number(inputPosition)

//     const boundedPosition = Math.min(
//       Math.max(
//         Number.isFinite(numericPosition)
//           ? numericPosition
//           : sliderMin,
//         sliderMin,
//       ),
//       sliderMax,
//     )

//     return discreteValues
//       ? discreteValues[boundedPosition]
//       : normalizeFrequency(boundedPosition)
//   }

//   return (
//     <div
//       className={`resistance-slider ${
//         disabled
//           ? 'resistance-slider--locked'
//           : ''
//       }`}
//     >
//       {disabled && onDisabledInteraction ? (
//         <button
//           aria-label={`${label} is locked`}
//           className="resistance-slider__lock-overlay"
//           onClick={onDisabledInteraction}
//           type="button"
//         />
//       ) : null}

//       <label
//         className="resistance-slider__label"
//         htmlFor="frequency-slider"
//       >
//         Frequency (Hz)
//       </label>

//       <div className="resistance-slider__control">
//         <input
//           aria-label="Frequency"
//           aria-valuetext={`${sliderValue} Hz`}
//           className="resistance-slider__input"
//           disabled={disabled}
//           id="frequency-slider"
//           max={sliderMax}
//           min={sliderMin}
//           onChange={(event) => {
//             const newValue =
//               getValueAtPosition(
//                 event.target.value,
//               )

//             onChange(newValue)
//           }}
//           step={sliderStep}
//           type="range"
//           value={sliderPosition}
//         />
//       </div>

//       <span className="resistance-slider__value">
//         {sliderValue} Hz
//       </span>
//     </div>
//   )
// }

// export default FrequencySlider