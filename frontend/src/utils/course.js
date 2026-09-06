// Shared constants and small pure helpers for building/validating the
// course object against the locked schema.

export const BLOOM_LEVELS = [
  { value: 1, label: "1 · Remember" },
  { value: 2, label: "2 · Understand" },
  { value: 3, label: "3 · Apply" },
  { value: 4, label: "4 · Analyze" },
  { value: 5, label: "5 · Evaluate" },
  { value: 6, label: "6 · Create" },
];

export function bloomLabel(level) {
  return BLOOM_LEVELS.find((b) => b.value === Number(level))?.label ?? `Level ${level}`;
}

/**
 * Builds a fresh CLO row with an id that won't collide with existing
 * rows, based on the highest "CLO<n>" id currently in use — safer than
 * a module-level counter, which would drift after loading sample data.
 */
export function emptyCLO(existingClos = []) {
  const usedNumbers = existingClos
    .map((c) => Number(String(c.id).replace(/[^0-9]/g, "")))
    .filter((n) => !Number.isNaN(n));
  const next = usedNumbers.length ? Math.max(...usedNumbers) + 1 : 1;
  return { id: `CLO${next}`, text: "", po: "", bloom_level: 1 };
}

export function emptyWeek() {
  return { weeks: "", topics: "", clos: [] };
}

export function emptyCourse() {
  return {
    code: "",
    title: "",
    credit_hours: 3,
    prerequisites: [],
    objectives: "",
    clos: [emptyCLO()],
    weekly_plan: [emptyWeek()],
    assessment_breakdown: {
      class_performance: 10,
      quizzes: 20,
      mid: 20,
      final: 50,
    },
  };
}

/** Sum of the four assessment fields; used for the live 100-mark check. */
export function assessmentTotal(breakdown) {
  return Object.values(breakdown).reduce(
    (sum, v) => sum + (Number(v) || 0),
    0
  );
}

/** Splits a comma-separated prerequisites string into a clean array. */
export function parsePrerequisites(raw) {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Pre-filled example so the team can demo without typing the whole form. */
export function sampleCourse() {
  return {
    code: "CSE 4197",
    title: "Embedded Systems for IoT",
    credit_hours: 3,
    prerequisites: ["CSE 3117"],
    objectives:
      "Introduce students to embedded architectures, sensor interfacing, and real-time constraints for IoT applications, building on microcontroller fundamentals.",
    clos: [
      { id: "CLO1", text: "Explain the architecture of embedded IoT platforms and sensor networks.", po: "1(a)", bloom_level: 2 },
      { id: "CLO2", text: "Design low-power firmware for sensor data acquisition tasks.", po: "3(a)", bloom_level: 3 },
      { id: "CLO3", text: "Evaluate trade-offs between wireless protocols for a given IoT deployment.", po: "2(b)", bloom_level: 5 },
    ],
    weekly_plan: [
      { weeks: "1-2", topics: "IoT architecture overview; embedded platform survey", clos: ["CLO1"] },
      { weeks: "3-5", topics: "Sensor interfacing, ADC/DAC, low-power firmware design", clos: ["CLO2"] },
      { weeks: "6-8", topics: "Wireless protocols: BLE, LoRa, Zigbee comparison", clos: ["CLO3"] },
      { weeks: "9-10", topics: "Edge processing and power budgeting", clos: ["CLO2", "CLO3"] },
      { weeks: "11-13", topics: "Capstone mini-project: end-to-end IoT sensor node", clos: ["CLO2", "CLO3"] },
      { weeks: "14", topics: "Review and project presentations", clos: ["CLO1", "CLO2", "CLO3"] },
    ],
    assessment_breakdown: {
      class_performance: 10,
      quizzes: 20,
      mid: 20,
      final: 50,
    },
  };
}
