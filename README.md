# Series RLC Circuit Resonance Experiment

An interactive virtual laboratory experiment to study series RLC circuit resonance, calculate resonance frequency, observe current variations with frequency, and visualize the resonance curve.

## Overview

This project simulates a series RLC circuit containing a resistor, inductor, and capacitor. Users can connect circuit components, configure the experiment, take readings, and plot the relationship between frequency and current.

## Features

- Interactive circuit component connections
- Virtual MCB, voltmeter, ammeter, resistor, inductor, capacitor, and function generator
- Dynamic series RLC circuit calculations
- Frequency-dependent current measurement
- Observation table for experimental readings
- Resonance curve plotting
- Circuit verification before plotting
- Interactive virtual laboratory interface

## Circuit Parameters

| Parameter | Value |
|---|---:|
| Resistance (R) | 100 Ω |
| Inductance (L) | 12.47 mH |
| Capacitance (C) | 0.22 µF |
| Supply voltage | 20 V RMS |

## Theory

In a series RLC circuit, the impedance is:

`Z = √(R² + (XL − XC)²)`

where:

- `XL = 2πfL` is inductive reactance.
- `XC = 1 / (2πfC)` is capacitive reactance.
- `R` is resistance.
- `f` is the supply frequency.

The circuit current is:

`I = V / Z`

At resonance, inductive and capacitive reactances are equal:

`XL = XC`

The theoretical resonance frequency is:

`fr = 1 / (2π√(LC))`

For the configured component values, the theoretical resonance frequency is approximately **3.04 kHz**.

## Technology Stack

- React
- JavaScript
- Vite
- CSS
- jsPlumb
- HTML5

## Getting Started

### Prerequisites

- Node.js
- npm

### Installation

1. Clone the repository.

   ```bash
   git clone YOUR_GITHUB_REPOSITORY_URL
   ```

2. Navigate to the project directory.

   ```bash
   cd YOUR_PROJECT_DIRECTORY
   ```

3. Install dependencies.

   ```bash
   npm install
   ```

4. Start the development server.

   ```bash
   npm run dev
   ```

5. Open the local URL displayed in your terminal.

## How to Use

1. Open the experiment simulation.
2. Connect the circuit components in the prescribed order.
3. Verify the circuit connections.
4. Adjust the frequency.
5. Observe the calculated current and voltage readings.
6. Record readings in the observation table.
7. Generate the resonance graph after verification.

## Learning Outcomes

- Understand resonance in a series RLC circuit.
- Calculate inductive and capacitive reactance.
- Analyze circuit impedance and current.
- Determine theoretical resonance frequency.
- Interpret the current-versus-frequency resonance curve.

## Future Improvements

- Add more circuit configurations.
- Improve measurement instrument calibration.
- Add downloadable observation tables.
- Enhance accessibility and mobile responsiveness.

## License

This project is intended for educational and academic use. Add an appropriate open-source license before redistributing it.
