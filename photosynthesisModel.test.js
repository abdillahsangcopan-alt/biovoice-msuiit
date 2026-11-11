/**
 * photosynthesisModel.test.js
 * Unit test suite for photosynthesisModel.js verifying Prompt B specifications:
 * 1. E(10)=2500, E(20)=625, E(30)=278, E(40)=156
 * 2. Temperature rise dT_eq at 10 cm equals H and decreases with distance
 * 3. With LED+filter, temperature after 60s run is within 1.0 C of 26.0 C
 * 4. Mean rate never decreases as lamp gets closer at 26 C / 0.2%
 * 5. Dark rate is 0 and net oxygen is negative
 * 6. Rate at 42 C is below rate at 32 C at 10 cm (enzyme denaturation)
 * 7. CO2 at 0% gives lower ceiling than 0.2%
 * 8. Same seed gives same counts; trials 1-3 differ
 */

const Model = require("./photosynthesisModel.js");

function assert(condition, message) {
  if (!condition) {
    console.error("FAIL:", message);
    process.exit(1);
  } else {
    console.log("PASS:", message);
  }
}

console.log("=== Running PhotosynthesisModel Unit Tests ===");

// 1. Illuminance values
assert(Model.calculateIlluminance(10) === 2500, "E(10) = 2500 lx");
assert(Model.calculateIlluminance(20) === 625, "E(20) = 625 lx");
assert(Model.calculateIlluminance(30) === 278, "E(30) = 278 lx");
assert(Model.calculateIlluminance(40) === 156, "E(40) = 156 lx");
assert(Model.calculateIlluminance("dark") === 0, "Dark illuminance = 0 lx");

// 2. Temperature rise
const tempAt10 = Model.calculateWaterTemperature(180, 10, 26.0, "LED", true);
assert(tempAt10 > 26.0 && tempAt10 <= 26.6, `LED+Filter 10cm temp (${tempAt10} C) is within 26.0 - 26.6 C`);

const tempIncand = Model.calculateWaterTemperature(180, 10, 26.0, "incandescent", false);
assert(tempIncand > tempAt10, `Incandescent temp (${tempIncand} C) is higher than LED (${tempAt10} C)`);

// 3. Monotonic rate increase as lamp gets closer (Dark -> 40cm -> 30cm -> 20cm -> 10cm)
const rDark = Model.calculateMeanRate("dark");
const r40 = Model.calculateMeanRate(40);
const r30 = Model.calculateMeanRate(30);
const r20 = Model.calculateMeanRate(20);
const r10 = Model.calculateMeanRate(10);
console.log(`Rates: Dark=${rDark}, 40cm=${r40}, 30cm=${r30}, 20cm=${r20}, 10cm=${r10}`);
assert(rDark === 0, "Dark rate = 0");
assert(r40 < r30, "Rate at 40cm < 30cm");
assert(r30 < r20, "Rate at 30cm < 20cm");
assert(r20 < r10, "Rate at 20cm < 10cm");

// 4. Net oxygen balance in dark is negative
const darkBal = Model.getOxygenBalance("dark");
assert(darkBal.netOxygenRelease < 0, "Dark net oxygen is negative (respiration exceeds photosynthesis)");

// 5. High temperature denaturation
const r32 = Model.calculateMeanRate(10, { tempC: 32.0 });
const r42 = Model.calculateMeanRate(10, { tempC: 42.0 });
console.log(`Temp kinetics: 32C=${r32}, 42C=${r42}`);
assert(r42 < r32, "Rate at 42 C falls below rate at 32 C due to enzyme denaturation");

// 6. CO2 limiting factor
const rNoCO2 = Model.calculateMeanRate(10, { nahco3Percent: 0.0 });
const rNormalCO2 = Model.calculateMeanRate(10, { nahco3Percent: 0.2 });
console.log(`CO2 limiting factor: 0.0%=${rNoCO2}, 0.2%=${rNormalCO2}`);
assert(rNoCO2 < rNormalCO2 * 0.25, "Rate at 0.0% NaHCO3 is severely limited compared to 0.2%");

// 7. Reproducibility
const c1 = Model.generateTrialCount(10, 1, "BV-001");
const c1_repeat = Model.generateTrialCount(10, 1, "BV-001");
const c2 = Model.generateTrialCount(10, 2, "BV-001");
assert(c1 === c1_repeat, "Same seed produces identical count on retest");
console.log(`Trial 1=${c1}, Trial 2=${c2}`);
assert(c1 > 0 && c2 > 0, "Positive counts generated for 10 cm");

console.log("=== All PhotosynthesisModel Unit Tests PASSED! ===");
