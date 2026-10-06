export const psiToBar = (psi: number): number => psi * 0.0689476;
export const barToPsi = (bar: number): number => bar / 0.0689476;
export const celsiusToKelvin = (celsius: number): number => Number(celsius) + 273.15;
export const kelvinToCelsius = (kelvin: number): number => Number(kelvin) - 273.15;
