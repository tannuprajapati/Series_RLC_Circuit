export const FREQUENCY_VALUES = [
  50,
  100,
  150,
  200,
  250,
  300,
  350,
  400,
  450,
  500,
  550,
  600,
  650,
  700,
  750,
  800,
  850,
  900,
  950,
  1000,
]

export const FREQUENCY_SLIDER_CONFIG = {
  frequency: {
    initial: FREQUENCY_VALUES[0],
    max: FREQUENCY_VALUES.at(-1),
    min: FREQUENCY_VALUES[0],
    step: 1,
    values: FREQUENCY_VALUES,
  },
}