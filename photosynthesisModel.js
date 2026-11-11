/**
 * photosynthesisModel.js
 * Pure mathematical simulation model for BioVoice (MSU-IIT / ICNHS Grade 11 Biology 1)
 * Computes:
 *  - Inverse-square illuminance E(d)
 *  - Dynamic live water temperature T(t) responding to lamp distance and thermal radiation
 *  - Photosynthetic rate (bubbles/min) via non-linear light saturation & limiting factors (CO2, Temp, Light Wavelength)
 *  - Seeded reproducible trial counts
 *  - Day / Night 24-hour cellular respiration & net oxygen balance
 * Note: Model values are educational simulation representations, not physical measurements.
 */

(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.PhotosynthesisModel = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const DEFAULTS = {
    lampType: "LED", // "LED" | "incandescent"
    heatFilter: true,
    extraClosePosition: true, // 5 cm enabled in factor tester
    baselineTemp: 26.0,
    baselineNaHCO3: 0.2, // percent
    baselineE10: 2500, // lux at 10 cm
    tauTemp: 180, // thermal relaxation time constant in seconds
  };

  /**
   * Illuminance E(d) in lux using inverse-square relation:
   * E(d) = E10 * (10 / d)^2
   * For d=0 or dark, returns 0.
   */
  function calculateIlluminance(distanceCm, baselineE10) {
    const e10 = baselineE10 || DEFAULTS.baselineE10;
    if (distanceCm === "dark" || distanceCm === 0 || distanceCm === "0" || distanceCm === "covered") {
      return 0;
    }
    const d = parseFloat(distanceCm);
    if (isNaN(d) || d <= 0) return 0;
    if (d === 5) return 6000; // Capped close-range measurement
    if (d === 10) return 2500;
    if (d === 20) return 625;
    if (d === 30) return 278;
    if (d === 40) return 156;
    return Math.round(e10 * Math.pow(10 / d, 2));
  }

  /**
   * Equilibrium temperature rise dT_eq(d) = H * (10 / d)^2
   */
  function getHeatConstant(lampType, heatFilter) {
    const isLED = (lampType || "LED").toUpperCase() === "LED";
    if (isLED) {
      return heatFilter ? 0.6 : 1.2;
    }
    // Incandescent
    return heatFilter ? 2.0 : 4.0;
  }

  /**
   * Water temperature T(t) given elapsed time, distance, and starting temp:
   * T(t) = T_start + (T_target - T_start) * (1 - exp(-t / tau))
   */
  function calculateWaterTemperature(tSec, distanceCm, startTemp, lampType, heatFilter) {
    const tStart = typeof startTemp === "number" ? startTemp : DEFAULTS.baselineTemp;
    const isDark = distanceCm === "dark" || distanceCm === 0 || distanceCm === "covered";
    let targetTemp = DEFAULTS.baselineTemp;

    if (!isDark) {
      const d = Math.max(5, parseFloat(distanceCm) || 10);
      const H = getHeatConstant(lampType, heatFilter);
      const dTe = H * Math.pow(10 / d, 2);
      targetTemp = DEFAULTS.baselineTemp + dTe;
    }

    const tau = DEFAULTS.tauTemp;
    const t = Math.max(0, parseFloat(tSec) || 0);
    const temp = tStart + (targetTemp - tStart) * (1 - Math.exp(-t / tau));
    return parseFloat(temp.toFixed(1));
  }

  /**
   * Temperature factor f_T(T)
   * Q10 = 2 up to 35 C, then falls linearly to 0.2 at 42 C (enzyme denaturation)
   */
  function getTemperatureFactor(tempC) {
    const T = typeof tempC === "number" ? tempC : 26.0;
    if (T <= 35.0) {
      return Math.pow(2.0, (T - 26.0) / 10.0);
    }
    if (T >= 42.0) {
      return 0.2;
    }
    // Linear drop from 35 C (approx 1.866) down to 0.2 at 42 C
    const f35 = Math.pow(2.0, 0.9); // ~1.866
    const slope = (0.2 - f35) / (42.0 - 35.0);
    return Math.max(0.2, f35 + slope * (T - 35.0));
  }

  /**
   * CO2 factor f_CO2(c) where c is NaHCO3 percent.
   * At c = 0.2%, f_CO2 = 1.0.
   */
  function getCO2Factor(cPercent) {
    const c = typeof cPercent === "number" ? cPercent : 0.2;
    if (c <= 0.001) {
      return 0.10; // Floor for trace dissolved CO2
    }
    const val = (c / (c + 0.05)) / 0.8;
    return Math.max(0.10, Math.min(1.45, val));
  }

  /**
   * Light Wavelength / Color factor
   * Chlorophyll a & b absorb blue and red, reflect green
   */
  function getWavelengthFactor(color) {
    const col = (color || "white").toLowerCase();
    if (col === "blue") return 1.15; // High absorption
    if (col === "red") return 1.08;  // High absorption
    if (col === "green") return 0.12; // Green reflected, minimal photosynthesis
    return 1.0; // White / broad spectrum
  }

  /**
   * Smooth minimum function:
   * smoothMin(x, y) = -ln(exp(-k*x) + exp(-k*y)) / k
   */
  function smoothMin(x, y, k) {
    const paramK = typeof k === "number" ? k : 0.35;
    const termX = Math.exp(-paramK * x);
    const termY = Math.exp(-paramK * y);
    return -Math.log(termX + termY) / paramK;
  }

  /**
   * Mean photosynthetic rate R (bubbles per minute):
   * In Dark or Night without lamp: R = 0.
   */
  function calculateMeanRate(distanceCm, options) {
    const opts = options || {};
    const isDark = distanceCm === "dark" || distanceCm === 0 || distanceCm === "covered";
    const isNight = opts.isNight === true && opts.lampOnAtNight !== true;

    if (isDark || isNight) {
      return 0;
    }

    const lux = calculateIlluminance(distanceCm, opts.baselineE10);
    const tempC = typeof opts.tempC === "number" ? opts.tempC : DEFAULTS.baselineTemp;
    const cPercent = typeof opts.nahco3Percent === "number" ? opts.nahco3Percent : DEFAULTS.baselineNaHCO3;
    const color = opts.lightColor || "white";
    const species = opts.species || "Hydrilla";

    // Species scaling
    let speciesScalar = 1.0;
    if (species === "Elodea") speciesScalar = 0.82;
    else if (species === "Water Hyacinth") speciesScalar = 0.08; // Aerial stomata

    // Light-limited linear rate
    const a = 0.052;
    const R_light = a * lux * speciesScalar;

    // Saturation cap: enzymatic Calvin cycle capacity
    const Rcap0 = 43.5 * speciesScalar;
    const fT = getTemperatureFactor(tempC);
    const fCO2 = getCO2Factor(cPercent);
    const fColor = getWavelengthFactor(color);

    const R_cap = Rcap0 * fT * fCO2 * fColor;
    const R = Math.max(0, smoothMin(R_light, R_cap, 0.32));
    return parseFloat(R.toFixed(1));
  }

  /**
   * Deterministic seed for reproducible trial counts
   */
  function hashString(str) {
    let hash = 2166136261;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return Math.abs(hash);
  }

  /**
   * Generates integer bubble count for a 60-second trial
   * Adds ~10% controlled biological variation while maintaining exact order
   */
  function generateTrialCount(distanceCm, trialIndex, participantCode, options) {
    const isDark = distanceCm === "dark" || distanceCm === 0 || distanceCm === "covered";
    if (isDark) {
      // In dark, occasional 0 or 1 dissolved gas release, mean = 0
      const seed = hashString(`${participantCode || "BV"}-${distanceCm}-t${trialIndex}`);
      return seed % 7 === 0 ? 1 : 0;
    }

    const meanRate = calculateMeanRate(distanceCm, options);
    if (meanRate <= 0.5) return 0;

    const seedKey = `${participantCode || "BV"}-${distanceCm}-trial${trialIndex}-${options ? JSON.stringify(options) : ""}`;
    const seed = hashString(seedKey);
    // Variation offset between -10% and +10%
    const normOffset = ((seed % 2001) / 1000.0) - 1.0; // -1.0 to +1.0
    const spread = meanRate * 0.10 * normOffset;
    const count = Math.max(0, Math.round(meanRate + spread));
    return count;
  }

  /**
   * Educational simulation alias for live temperature
   */
  function calculateLiveTemperature(distanceCm, tSec, isDark) {
    if (isDark) {
      return calculateWaterTemperature(tSec, "dark", DEFAULTS.baselineTemp, "LED", true);
    }
    return calculateWaterTemperature(tSec, distanceCm, DEFAULTS.baselineTemp, "LED", true);
  }

  /**
   * Educational simulation alias for Factor Explorer ("Test Your Idea")
   */
  function calculateBubbleRate(params) {
    const p = params || {};
    const lux = typeof p.lux === "number" ? p.lux : 2500;
    const co2Pct = typeof p.co2Pct === "number" ? p.co2Pct : 0.2;
    const tempC = typeof p.tempC === "number" ? p.tempC : 26.0;
    const wave = p.wavelength || "white";
    const species = p.species || "Hydrilla";

    // Distance corresponding to lux
    let dist = 10;
    if (lux <= 0) dist = "dark";
    else if (lux >= 5000) dist = 5;
    else if (lux >= 2000) dist = 10;
    else if (lux >= 550) dist = 20;
    else if (lux >= 200) dist = 30;
    else dist = 40;

    const rate = calculateMeanRate(dist, {
      species: species,
      co2Percent: co2Pct,
      temperatureC: tempC,
      wavelength: wave
    });

    let limiter = "Light Intensity (Illuminance)";
    let explanation = "Light energy is driving electron transport in the thylakoid membranes.";

    if (dist === "dark" || lux <= 0) {
      limiter = "Absence of Light (Photons)";
      explanation = "Without light photons, photolysis of water stops completely. No oxygen bubbles are generated.";
    } else if (tempC >= 40.0) {
      limiter = "Thermal Denaturation of Enzymes";
      explanation = "Extreme heat (>40 °C) denatures rubisco and thylakoid membrane proteins, sharply dropping bubble release.";
    } else if (co2Pct <= 0.05) {
      limiter = "Carbon Dioxide Concentration (NaHCO₃)";
      explanation = "Low dissolved CO₂ starves the Calvin cycle. Even with bright light, the light reactions stall from lack of NADP+ regeneration.";
    } else if (wave.toLowerCase() === "green") {
      limiter = "Action Spectrum (Wavelength)";
      explanation = "Chlorophyll a and b reflect green light (500–550 nm) rather than absorbing it, resulting in minimal photochemical energy.";
    } else if (lux >= 2500 && co2Pct >= 0.2) {
      limiter = "Light Saturation Reached";
      explanation = "All photosystem reaction centers are working at capacity. Further increasing light yields diminishing returns unless CO₂ and temperature increase.";
    }

    return {
      bubbleRate: rate,
      limitingFactor: limiter,
      scientificExplanation: explanation
    };
  }

  /**
   * Net oxygen balance (display only; arbitrary units):
   * Photosynthesis oxygen made vs cellular respiration oxygen used
   */
  function getOxygenBalance(distanceCm, options) {
    const opts = options || {};
    const meanRate = calculateMeanRate(distanceCm, opts);
    const respRate = 2.4; // Constant baseline cellular respiration by mitochondria
    const grossMade = parseFloat((meanRate * 1.05).toFixed(1));
    const netRelease = parseFloat((grossMade - respRate).toFixed(1));
    return {
      grossOxygenMade: grossMade,
      respirationUsed: respRate,
      netOxygenRelease: netRelease, // Can be negative in the dark / at night!
      inDeficit: netRelease < 0,
    };
  }

  return {
    DEFAULTS: DEFAULTS,
    calculateIlluminance: calculateIlluminance,
    calculateWaterTemperature: calculateWaterTemperature,
    calculateLiveTemperature: calculateLiveTemperature,
    calculateBubbleRate: calculateBubbleRate,
    getTemperatureFactor: getTemperatureFactor,
    getCO2Factor: getCO2Factor,
    getWavelengthFactor: getWavelengthFactor,
    calculateMeanRate: calculateMeanRate,
    generateTrialCount: generateTrialCount,
    getOxygenBalance: getOxygenBalance,
  };
});
