/**
 * BioVoice — MSU-IIT Interactive Photosynthesis Simulation & AI Voice Learning Platform
 * Researchers: Abdillah G. Sangcopan & Karen M. Villa
 * Adviser: Prof. Vanjoreeh Madale
 * Mindanao State University – Iligan Institute of Technology (MSU-IIT)
 * Research Site: Iligan City National High School (Grade 11 Biology 1, SY 2026–2027)
 */

(function () {
  "use strict";

  // ==========================================================================
  // 1. SCIENTIFIC CONSTANTS, PLANT PROFILES & ACTIVITY STEP DEFINITIONS
  // ==========================================================================
  const LIGHT_CONDITIONS = [
    {
      key: "10",
      label: "10 cm (High Light)",
      shortLabel: "10 cm",
      lux: 2500,
      lampX: 420,
      coneOpacity: 0.88,
      heatWaveOpacity: 0.78,
      tempC: 26.0,
      // Controlled trial-to-trial variation ranges (saturating curve)
      rangesByPlant: {
        Hydrilla: [39, 45],
        Elodea: [33, 39],
        "Water Hyacinth": [2, 5],
      },
    },
    {
      key: "20",
      label: "20 cm (Med-High Light)",
      shortLabel: "20 cm",
      lux: 625,
      lampX: 310,
      coneOpacity: 0.64,
      heatWaveOpacity: 0.35,
      tempC: 26.0,
      rangesByPlant: {
        Hydrilla: [30, 35],
        Elodea: [25, 30],
        "Water Hyacinth": [1, 4],
      },
    },
    {
      key: "30",
      label: "30 cm (Medium Light)",
      shortLabel: "30 cm",
      lux: 278,
      lampX: 200,
      coneOpacity: 0.42,
      heatWaveOpacity: 0.12,
      tempC: 26.0,
      rangesByPlant: {
        Hydrilla: [13, 17],
        Elodea: [10, 14],
        "Water Hyacinth": [1, 3],
      },
    },
    {
      key: "40",
      label: "40 cm (Low Light)",
      shortLabel: "40 cm",
      lux: 156,
      lampX: 90,
      coneOpacity: 0.24,
      heatWaveOpacity: 0.0,
      tempC: 26.0,
      rangesByPlant: {
        Hydrilla: [6, 10],
        Elodea: [5, 8],
        "Water Hyacinth": [0, 2],
      },
    },
    {
      key: "dark",
      label: "Dark Control (Lamp Off)",
      shortLabel: "Dark",
      lux: 0,
      lampX: 90,
      coneOpacity: 0.0,
      heatWaveOpacity: 0.0,
      tempC: 26.0,
      rangesByPlant: {
        Hydrilla: [0, 2],
        Elodea: [0, 2],
        "Water Hyacinth": [0, 1],
      },
    },
  ];

  const PLANT_PROFILES = {
    Hydrilla: {
      name: "Hydrilla",
      scientific: "Hydrilla verticillata",
      habit: "Submerged Aquatic Macrophyte",
      svgLabel: "Specimen: Hydrilla verticillata (Submerged shoot) · Controlled Water Bath: 26.0 °C",
      description:
        "Submerged stems with whorled serrated leaves (4–8 per node). Oxygen produced during the light-dependent reactions nucleates at the cut stem and leaf nodes as countable rising bubbles.",
      bubbleOriginY: 176,
    },
    Elodea: {
      name: "Elodea",
      scientific: "Elodea canadensis",
      habit: "Submerged Aquatic Macrophyte",
      svgLabel: "Specimen: Elodea canadensis (Submerged shoot) · Controlled Water Bath: 26.0 °C",
      description:
        "Submerged pondweed with thicker stems and dense, broader smooth oval leaves in whorls of 3–4. Releases steady streams of underwater oxygen bubbles from cut stem vessels under illumination.",
      bubbleOriginY: 177,
    },
    "Water Hyacinth": {
      name: "Water Hyacinth",
      scientific: "Eichhornia crassipes",
      habit: "Surface-Floating Aquatic Macrophyte",
      svgLabel:
        "Specimen: Eichhornia crassipes (Floating at water surface; hanging submerged roots)",
      description:
        "Free-floating surface plant with swollen spongy aerenchyma petioles and aerial leaf blades above the waterline, plus dark feathery hanging roots below. Because its photosynthetic leaves are aerial, most oxygen escapes into the air through stomata rather than forming underwater bubbles!",
      bubbleOriginY: 145,
    },
  };

  const ACTIVITY_STEPS = [
    {
      index: 0,
      sp: "sp1",
      spCode: "SP1",
      stepLabel: "Step 1 of 6",
      partTitle: "Part 1: Predict — Support Point SP1",
      lcTag: "Support Point SP1 · LC 1 & LC 2",
      prompt:
        "Before running the trials: Which light condition (10 cm, 20 cm, 30 cm, 40 cm, or Dark) do you predict will produce the most bubbles in 60 seconds, and what gas is inside those bubbles?",
      placeholder:
        "Write your prediction (e.g., 'I predict 10 cm will produce the most oxygen bubbles because light intensity is highest...')",
      minChars: 8,
      requiresTrial: false,
    },
    {
      index: 1,
      sp: "sp2",
      spCode: "SP2",
      stepLabel: "Step 2 of 6",
      partTitle: "Part 2: Plan — Support Point SP2",
      lcTag: "Support Point SP2 · LC 3 (Experimental Design)",
      prompt:
        "Identify your Independent Variable (what you change), Dependent Variable (what you count in 60 seconds), and Constant Variables (plant shoot, 0.2% NaHCO₃, 26.0 °C water bath). Why do we perform 3 trials per condition?",
      placeholder:
        "List the independent, dependent, and constant variables, and explain why 3 trials improve reliability...",
      minChars: 8,
      requiresTrial: false,
    },
    {
      index: 2,
      sp: "sp3",
      spCode: "SP3",
      stepLabel: "Step 3 of 6",
      partTitle: "Part 3: Investigate — Support Point SP3",
      lcTag: "Support Point SP3 · LC 2 & LC 3 (60-Second Observations)",
      prompt:
        "Run 60-second observation trials across the light conditions (10 cm, 20 cm, 30 cm, 40 cm, and Dark). Observe the rising bubbles and record what pattern you notice as the lamp moves farther away.",
      placeholder:
        "Describe your observation from the 60-second trials (complete at least one 60-second trial above)...",
      minChars: 6,
      requiresTrial: true,
    },
    {
      index: 3,
      sp: "sp4",
      spCode: "SP4",
      stepLabel: "Step 4 of 6",
      partTitle: "Part 4: Explain — Support Point SP4",
      lcTag: "Support Point SP4 · LC 3 & LC 4 (Data & Limiting Factors)",
      prompt:
        "Compare your mean bubble counts from 40 cm to 10 cm and the Dark control. Why does the bubble rate increase with closer light, and why does it begin to level off (plateau) at very high light intensity?",
      placeholder:
        "Explain the trend using your mean bubble data and what becomes limiting at high light...",
      minChars: 8,
      requiresTrial: false,
    },
    {
      index: 4,
      sp: "sp5",
      spCode: "SP5",
      stepLabel: "Step 5 of 6",
      partTitle: "Part 5a: Connect — Support Point SP5",
      lcTag: "Support Point SP5 · LC 1, LC 4 & LC 5",
      prompt:
        "Connect your observations to the chloroplast: How do ATP and NADPH from the light-dependent reactions in the thylakoid power the Calvin cycle in the stroma to build glucose? Why is this vital for ecosystems?",
      placeholder:
        "Explain how light reactions (ATP, NADPH, O₂) connect to the Calvin cycle (glucose) and food webs...",
      minChars: 8,
      requiresTrial: false,
    },
    {
      index: 5,
      sp: "sp6",
      spCode: "SP6",
      stepLabel: "Step 6 of 6",
      partTitle: "Part 5b: Revise — Support Point SP6",
      lcTag: "Support Point SP6 · LC 1–LC 5 Synthesis",
      prompt:
        "Review your initial prediction from Step 1 and refine your final scientific conclusion in your own words, citing specific mean bubble counts from your table and graph.",
      placeholder:
        "Write your revised scientific explanation citing your recorded mean bubble counts...",
      minChars: 8,
      requiresTrial: false,
    },
  ];

  const IDEA_CATALOG = {
    I1: "Need for light in photosynthesis",
    I2: "Bubble count as sign of rate",
    I3: "Lamp distance and light strength",
    I4: "Dark setup as comparison",
    I5: "High-light leveling off",
    I6: "Repeated trials and mean",
    I7: "Constant variables / fair test",
    I8: "Light energy to chemical energy (glucose)",
    I9: "Value of photosynthesis to organisms",
  };

  const FIDELITY_ITEMS = [
    "F1. Shared orientation and research code privacy check completed",
    "F2. Printed Student Activity Sheet (Appendix G) distributed to all students",
    "F3. Physical Hydrilla / simulation setup verified at constant 26.0 °C and 0.2% NaHCO₃",
    "F4. 60-second observation timing procedure explained clearly",
    "F5. Intervention/Comparison group condition strictly maintained without cross-contamination",
    "F6. Students completed Part 1 (Predict) and Part 2 (Plan) prior to data collection",
    "F7. Students recorded 3 trials and calculated means across light conditions",
    "F8. BioVoice Hint-First protocol (H → C → E) functioned as intended (Intervention)",
    "F9. Teacher prompted students to verify explanations against their activity sheet",
    "F10. Session concluded on schedule with all worksheet steps reviewed",
  ];

  // Salted SHA-256 digests for static-host fallback (no plaintext credentials in JS)
  const FALLBACK_AUTH_HASHES = {
    adminUser: "researcher_admin",
    adminHash: "8705839f808478279130209c7c8eefef402a084fce22dc03b238c255a68a12a0",
    teacherUser: "biology_teacher",
    teacherHash: "80bc8a54f4146a5770f5de2bb34261668706162104383dd22a2b5886c79f6ab9",
  };

  // ==========================================================================
  // 2. APPLICATION STATE
  // ==========================================================================
  const state = {
    // Active screen: "welcome" | "learning" | "dashboard"
    currentScreen: "welcome",
    sessionCode: "",
    isNightTime: false,
    lastLitDistance: "10",
    liveWaterTemp: 26.0,
    // Role: null | "student" | "admin" | "teacher" | "guest"
    activeRole: null,
    // Pending student verification before group confirmation & terms
    pendingParticipant: null,
    // Confirmed session info
    participantCode: null,
    participantGroup: null, // "Intervention" | "Comparison" | "Guest Sandbox" | "Teacher" | "Admin Preview"
    consentVerified: false,
    assentVerified: false,
    termsAccepted: false,
    isSandbox: false,
    bioVoiceAllowed: false,
    bioVoicePanelVisible: true,

    // Staff auth
    staffToken: null,
    staffUser: null,
    staffRole: null,

    // Study configuration
    studyConfig: {
      studyPhase: "Implementation",
      activeSession: "Session 1",
      requirePin: true,
      strictAssignedOnly: true,
      requireConsentVerification: true,
      classAccessPin: "2026",
      officialPlantSpecies: "Hydrilla",
      teacherPermissions: {
        viewActivityAndGuide: true,
        accessSimulation: true,
        monitorClassroomSession: true,
        recordObservations: true,
        reviewFidelity: true,
        viewAnonymizedLogs: false,
        exportRawData: false,
      },
    },

    // Simulation state
    selectedPlant: "Hydrilla",
    selectedDistance: "10",
    timerMode: "accelerated", // "realtime" (60s) | "accelerated" (60s scaled over 6s)
    timerRunning: false,
    timerPaused: false,
    remainingSeconds: 60,
    elapsedSeconds: 0,
    targetTrialBubbles: 0,
    liveBubblesCounted: 0,
    bubbleSchedule: [], // Seconds at which each bubble is released
    activeSvgBubbles: [],
    timerIntervalId: null,
    swayAnimFrameId: null,
    swayPhase: 0,

    // Action-dependent data tables (Strictly starts empty — "Not yet performed")
    tableMode: "simulated", // "simulated" | "physical"
    officialSimTable: createEmptySimTable(),
    exploratorySimTables: {
      Hydrilla: createEmptySimTable(),
      Elodea: createEmptySimTable(),
      "Water Hyacinth": createEmptySimTable(),
    },
    physicalTable: createEmptyPhysicalTable(),
    trialVariationHistory: {}, // Tracks previous counts per plant+distance to guarantee realistic variation

    // Sequential 1-at-a-time Activity Stepper (Steps 0..5)
    currentStepIndex: 0,
    stepNotes: ["", "", "", "", "", ""],
    stepCompleted: [false, false, false, false, false, false],

    // BioVoice Multi-Turn Conversational AI & Voice State
    languageMode: "auto", // "auto" | "en-PH" | "fil-PH" | "ceb-PH"
    lastDetectedLanguage: "en-PH",
    lastDetectedLanguageLabel: "English",
    supportPoint: "sp1",
    supportType: "hint", // "hint" | "clarification" | "explanation"
    voiceMuted: false,
    voiceSpeed: 1.0,
    voicePersona: "nova", // "nova" | "mentor" | "studio"
    speechSequenceId: 0,
    speechTimers: [],
    activeUtterance: null,
    activeVoiceName: "",
    lastSpokenText: "",
    lastSpokenLang: "en-PH",
    lastInteractionId: null,
    isListening: false,
    recognition: null,
    conversationMemory: {
      turnCount: 0,
      lastIdeaCode: "I1",
      lastTopicKey: "",
      lastSupportPoint: "sp1",
      lastSupportType: "hint",
      simplificationDepth: 0,
      pendingQuiz: null,
      lastQuestion: "",
      lastReply: "",
      messages: [],
    },

    // Researcher Dashboard Data
    dashboardData: {
      participants: [],
      realLogs: [],
      syntheticLogs: [],
      monitoringLogs: [],
      summary: {},
    },
  };

  function createEmptySimTable() {
    const tbl = {};
    LIGHT_CONDITIONS.forEach((cond) => {
      tbl[cond.key] = [null, null, null];
    });
    return tbl;
  }

  function createEmptyPhysicalTable() {
    const tbl = {};
    LIGHT_CONDITIONS.forEach((cond) => {
      tbl[cond.key] = { trials: [null, null, null], temp: "26.0" };
    });
    return tbl;
  }

  // ==========================================================================
  // 3. HELPER UTILITIES & CRYPTO FALLBACK
  // ==========================================================================
  function $(id) {
    return document.getElementById(id);
  }

  function resolveApiUrl(path) {
    try {
      const params = new URLSearchParams(window.location.search);
      const qApi = params.get("api");
      if (qApi) {
        const cleanQ = qApi.replace(/\/+$/, "");
        localStorage.setItem("biovoice_api_base", cleanQ);
        return cleanQ + path;
      }
      const winBase = (window.BIOVOICE_API_BASE || "").trim().replace(/\/+$/, "");
      if (winBase) return winBase + path;
      const savedBase = (localStorage.getItem("biovoice_api_base") || "").trim().replace(/\/+$/, "");
      if (savedBase) return savedBase + path;
      const host = (window.location.hostname || "").toLowerCase();
      if (host.endsWith("github.io") || host.endsWith("web.app") || host.endsWith("firebaseapp.com")) {
        return "https://biovoiceiit.pythonanywhere.com" + path;
      }
    } catch (_) {}
    return path;
  }

  async function sha256Hex(message) {
    if (window.crypto && window.crypto.subtle) {
      const msgBuffer = new TextEncoder().encode(message);
      const hashBuffer = await window.crypto.subtle.digest("SHA-256", msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    }
    return "";
  }

  function deterministicPinForCode(code) {
    // Matches the non-trivial 4-digit PIN logic if running in static fallback mode
    let hash = 2166136261;
    const str = code + "-msuiit-biovoice-pin-2026";
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    let pin = (Math.abs(hash) % 8999) + 1000;
    const last3 = code.split("-")[1] || "000";
    if (String(pin).endsWith(last3)) {
      pin = ((pin + 137) % 8999) + 1000;
    }
    return String(pin);
  }

  function generateFallback200Codes() {
    const list = [];
    for (let i = 1; i <= 200; i++) {
      const code = "BV-" + String(i).padStart(3, "0");
      let group = "Reserve";
      let status = "Unassigned";
      let consentVerified = false;
      let assentVerified = false;
      if (i >= 1 && i <= 54) {
        group = "Intervention";
        status = "Assigned";
        consentVerified = true;
        assentVerified = true;
      } else if (i === 55) {
        group = "Intervention";
        status = "Assigned";
        consentVerified = false;
        assentVerified = false;
      } else if (i >= 56 && i <= 99) {
        group = "Intervention";
        status = "Unassigned";
      } else if (i >= 100 && i <= 154) {
        group = "Comparison";
        status = "Assigned";
        consentVerified = true;
        assentVerified = true;
      } else if (i >= 155 && i <= 180) {
        group = "Comparison";
        status = "Unassigned";
      }
      list.push({
        no: i,
        code,
        group,
        status,
        consentVerified,
        assentVerified,
        accessPin: deterministicPinForCode(code),
        interactionCount: 0,
        notes: "",
      });
    }
    return list;
  }

  function getActiveSimTable() {
    const officialSpecies = state.studyConfig.officialPlantSpecies || "Hydrilla";
    if (state.activeRole === "student" && state.selectedPlant === officialSpecies) {
      return state.officialSimTable;
    }
    if (state.activeRole === "student" && state.selectedPlant !== officialSpecies) {
      return state.exploratorySimTables[state.selectedPlant];
    }
    return state.exploratorySimTables[state.selectedPlant] || state.officialSimTable;
  }

  function computeMean(trials) {
    const valid = (trials || []).filter((v) => typeof v === "number" && !Number.isNaN(v));
    if (!valid.length) return null;
    const sum = valid.reduce((a, b) => a + b, 0);
    return Number((sum / valid.length).toFixed(1));
  }

  function countCompletedTrialsInTable(tbl) {
    let total = 0;
    Object.values(tbl || {}).forEach((arr) => {
      (arr || []).forEach((v) => {
        if (typeof v === "number") total++;
      });
    });
    return total;
  }

  // ==========================================================================
  // 4. SCREEN NAVIGATION & POP-UP MODAL SYSTEM
  // ==========================================================================
  function showScreen(screenName) {
    state.currentScreen = screenName;
    const welcomeEl = $("screen-welcome");
    const learningEl = $("screen-learning");
    const dashEl = $("screen-dashboard");

    if (welcomeEl) welcomeEl.hidden = screenName !== "welcome";
    if (learningEl) learningEl.hidden = screenName !== "learning";
    if (dashEl) dashEl.hidden = screenName !== "dashboard";

    // Condition Equivalence & Role Visibility on Learning Screen
    if (screenName === "learning") {
      const isComparison = state.participantGroup === "Comparison";
      const isGuest = state.activeRole === "guest" || state.isSandbox;
      const isStudent = state.activeRole === "student" && !isGuest;
      const sidebar = $("biovoice-sidebar");
      const toggleBtn = $("toggle-biovoice-btn");
      const compBanner = $("comparison-teacher-banner");
      const groupBadge = $("participant-group-badge");
      const saveBtn = $("topbar-save-progress-btn");
      const speakerBox = $("active-speaker-container");

      // Guest mode cannot save progress or switch participant station codes
      if (saveBtn) {
        saveBtn.hidden = !isStudent;
        saveBtn.disabled = !isStudent;
        saveBtn.style.display = isStudent ? "" : "none";
      }
      if (speakerBox) {
        const showStation = isStudent && !isComparison;
        speakerBox.hidden = !showStation;
        speakerBox.style.display = showStation ? "" : "none";
      }

      if (isGuest) {
        if (sidebar) sidebar.style.display = "";
        if (toggleBtn) toggleBtn.style.display = "";
        if (compBanner) compBanner.style.display = "none";
        if (groupBadge) groupBadge.textContent = "Guest Sandbox (Exploration Only · Not Saved)";
      } else if (isComparison) {
        if (sidebar) sidebar.style.display = "none";
        if (toggleBtn) toggleBtn.style.display = "none";
        if (compBanner) compBanner.style.display = "flex";
        if (groupBadge) groupBadge.textContent = "Group B: Comparison (Standard Teacher-Led Inquiry)";
      } else {
        if (sidebar) sidebar.style.display = "";
        if (toggleBtn) toggleBtn.style.display = "";
        if (compBanner) compBanner.style.display = "none";
        if (groupBadge && state.participantGroup) {
          groupBadge.textContent = `Group A: Intervention (${state.participantGroup})`;
        }
      }

      setDayNightMode(state.isNightTime ? "night" : "day", true);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openModal(modalId) {
    const el = $(modalId);
    if (el) {
      el.hidden = false;
    }
  }

  function closeModal(modalId) {
    const el = $(modalId);
    if (el) {
      el.hidden = true;
    }
  }

  function showAlert(elId, message, isOk) {
    const el = $(elId);
    if (!el) return;
    if (!message) {
      el.hidden = true;
      el.textContent = "";
      return;
    }
    el.hidden = false;
    el.textContent = message;
    el.className = "login-alert" + (isOk ? " ok" : "");
  }

  // ==========================================================================
  // 5. WELCOME SCREEN, 4-ROLE LOGIN, GROUP CONFIRMATION & TERMS POP-UP
  // ==========================================================================
  async function loadPublicConfig() {
    try {
      const res = await fetch(resolveApiUrl("/api/public-config"), { cache: "no-store" });
      if (res.ok) {
        const cfg = await res.json();
        Object.assign(state.studyConfig, cfg);
      }
    } catch (_) {
      // Static fallback uses default studyConfig
    }
  }

  async function handleStudentLoginSubmit(ev) {
    ev.preventDefault();
    showAlert("student-login-alert", "");

    const codeInput = $("student-code-input");
    const pinInput = $("student-pin-input");
    const rawCode = (codeInput ? codeInput.value : "").trim().toUpperCase();
    const rawPin = (pinInput ? pinInput.value : "").trim();

    if (!/^BV-(00[1-9]|0[1-9][0-9]|1[0-9]{2}|200)$/.test(rawCode)) {
      showAlert(
        "student-login-alert",
        "Invalid participant code format. Please enter an official code from BV-001 through BV-200."
      );
      return;
    }

    const lastThree = rawCode.split("-")[1];
    if (!rawPin || rawPin === lastThree) {
      showAlert(
        "student-login-alert",
        "Incorrect Participant PIN. Do not use the last 3 digits of your code; please enter your separate researcher-issued PIN."
      );
      return;
    }

    try {
      const res = await fetch(resolveApiUrl("/api/session"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: rawCode, pin: rawPin }),
      });
      const data = await res.json();
      if (!res.ok || !data.valid) {
        showAlert(
          "student-login-alert",
          data.error || "Unable to verify participant code and PIN."
        );
        return;
      }
      presentGroupConfirmationStep(data);
    } catch (_) {
      // Static-host fallback verification (GitHub Pages / Firebase Hosting)
      const fallbackCodes = generateFallback200Codes();
      const found = fallbackCodes.find((c) => c.code === rawCode);
      if (!found) {
        showAlert("student-login-alert", "Participant code not found in official register.");
        return;
      }
      if (found.status !== "Assigned") {
        showAlert(
          "student-login-alert",
          `Participant code ${rawCode} is currently '${found.status}' and has not been assigned for this research session.`
        );
        return;
      }
      if (rawPin !== state.studyConfig.classAccessPin && rawPin !== found.accessPin) {
        showAlert(
          "student-login-alert",
          "Incorrect Participant PIN. Please enter the separate researcher-issued PIN."
        );
        return;
      }
      if (!found.consentVerified || !found.assentVerified) {
        showAlert(
          "student-login-alert",
          `Participant code ${rawCode} does not yet have verified Parental Consent and Student Assent (Appendix A). Please contact the research team.`
        );
        return;
      }
      presentGroupConfirmationStep({
        valid: true,
        code: found.code,
        group: found.group,
        status: found.status,
        consentVerified: found.consentVerified,
        assentVerified: found.assentVerified,
        studyPhase: state.studyConfig.studyPhase,
        activeSession: state.studyConfig.activeSession,
        officialPlantSpecies: state.studyConfig.officialPlantSpecies,
        bioVoiceAllowed:
          found.group === "Intervention" && state.studyConfig.studyPhase === "Implementation",
      });
    }
  }

  function presentGroupConfirmationStep(sessionData) {
    state.pendingParticipant = sessionData;
    const grid = $("role-cards-grid");
    const panel = $("group-confirm-panel");
    if (grid) grid.hidden = true;
    if (panel) panel.hidden = false;

    showAlert("group-confirm-alert", "");
    if ($("confirm-code-display")) $("confirm-code-display").textContent = sessionData.code;
    if ($("confirm-status-display")) $("confirm-status-display").textContent = sessionData.status;
    if ($("confirm-consent-display")) {
      $("confirm-consent-display").textContent =
        sessionData.consentVerified && sessionData.assentVerified ? "Verified" : "Pending";
    }

    const regName = $("registered-group-name");
    const regDesc = $("registered-group-desc");
    const intBtn = $("confirm-intervention-btn");
    const cmpBtn = $("confirm-comparison-btn");

    if (sessionData.group === "Intervention") {
      if (regName) regName.textContent = "INTERVENTION GROUP";
      if (regDesc) {
        regDesc.textContent =
          "Your participant code is officially registered in the Intervention Group (Interactive Photosynthesis Simulation + BioVoice AI Voice Companion).";
      }
      if (intBtn) intBtn.classList.add("is-recommended");
      if (cmpBtn) cmpBtn.classList.remove("is-recommended");
    } else {
      if (regName) regName.textContent = "COMPARISON GROUP";
      if (regDesc) {
        regDesc.textContent =
          "Your participant code is officially registered in the Comparison Group (Interactive Photosynthesis Simulation + Teacher-Led Investigation).";
      }
      if (cmpBtn) cmpBtn.classList.add("is-recommended");
      if (intBtn) intBtn.classList.remove("is-recommended");
    }
  }

  async function handleGroupConfirmChoice(chosenGroup) {
    if (!state.pendingParticipant) return;
    const expectedGroup = state.pendingParticipant.group;

    // Verify with backend if available
    try {
      const res = await fetch(resolveApiUrl("/api/session/confirm-group"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: state.pendingParticipant.code,
          selectedGroup: chosenGroup,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.confirmed) {
        showAlert(
          "group-confirm-alert",
          data.error ||
            "Your group assignment does not match the registered research record. Please contact the research team."
        );
        return;
      }
    } catch (_) {
      if (chosenGroup !== expectedGroup) {
        showAlert(
          "group-confirm-alert",
          "Your group assignment does not match the registered research record. Please contact the research team."
        );
        return;
      }
    }

    showAlert("group-confirm-alert", "");
    // Open Part 3: Terms and Conditions Pop-Up ("Before You Begin")
    openModal("terms-dialog");
  }

  function handleTermsAgree() {
    if (!state.pendingParticipant) {
      closeModal("terms-dialog");
      return;
    }
    const p = state.pendingParticipant;
    if (!p.consentVerified || !p.assentVerified) {
      closeModal("terms-dialog");
      showAlert(
        "group-confirm-alert",
        "Parental consent and student assent (Appendix A) must be verified by the researcher before research data collection can begin."
      );
      return;
    }

    state.activeRole = "student";
    state.participantCode = p.code;
    state.participantGroup = p.group;
    state.consentVerified = true;
    state.assentVerified = true;
    state.termsAccepted = true;
    state.isSandbox = false;
    state.bioVoiceAllowed =
      p.group === "Intervention" && state.studyConfig.studyPhase === "Implementation";
    state.bioVoicePanelVisible = state.bioVoiceAllowed;
    state.selectedPlant = state.studyConfig.officialPlantSpecies || "Hydrilla";

    closeModal("terms-dialog");
    configureAndEnterLearningEnvironment();
  }

  function handleTermsDecline() {
    closeModal("terms-dialog");
    handleLogout();
  }

  async function handleStaffLogin(ev, roleTarget) {
    ev.preventDefault();
    const isTeacher = roleTarget === "teacher";
    const alertId = isTeacher ? "teacher-login-alert" : "admin-login-alert";
    showAlert(alertId, "");

    const userEl = $(isTeacher ? "teacher-username-input" : "admin-username-input");
    const passEl = $(isTeacher ? "teacher-password-input" : "admin-password-input");
    const username = (userEl ? userEl.value : "").trim();
    const password = (passEl ? passEl.value : "").trim();

    if (!username || !password) {
      showAlert(alertId, "Please enter both username and password.");
      return;
    }

    try {
      const res = await fetch(resolveApiUrl("/api/researcher/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, roleTarget }),
      });
      const data = await res.json();
      if (!res.ok || !data.authenticated) {
        showAlert(alertId, data.error || "Invalid credentials.");
        return;
      }
      completeStaffLogin(data.username, data.role, data.token, data.teacherPermissions);
    } catch (_) {
      // Static-host fallback using salted SHA-256 digest
      const digest = await sha256Hex(`msuiit-biovoice-auth:${username}:${password}`);
      if (
        roleTarget === "admin" &&
        username === FALLBACK_AUTH_HASHES.adminUser &&
        digest === FALLBACK_AUTH_HASHES.adminHash
      ) {
        completeStaffLogin(username, "Researcher/Admin", "static-admin-token", null);
      } else if (
        roleTarget === "teacher" &&
        username === FALLBACK_AUTH_HASHES.teacherUser &&
        digest === FALLBACK_AUTH_HASHES.teacherHash
      ) {
        completeStaffLogin(
          username,
          "Authorized Reviewer/Teacher",
          "static-teacher-token",
          state.studyConfig.teacherPermissions
        );
      } else {
        showAlert(alertId, "Invalid credentials. Please verify your username and password.");
      }
    }
  }

  function completeStaffLogin(username, role, token, teacherPerms) {
    state.staffUser = username;
    state.staffRole = role;
    state.staffToken = token;
    if (teacherPerms) {
      state.studyConfig.teacherPermissions = teacherPerms;
    }

    if (role === "Researcher/Admin") {
      state.activeRole = "admin";
      state.participantCode = "ADMIN-PREVIEW";
      state.participantGroup = "Admin Preview";
      state.isSandbox = true;
      state.bioVoiceAllowed = true;
      state.bioVoicePanelVisible = true;
      loadResearcherDashboard();
      showScreen("dashboard");
    } else {
      state.activeRole = "teacher";
      state.participantCode = "TEACHER-SESSION";
      state.participantGroup = "Teacher Facilitation";
      state.isSandbox = true;
      state.bioVoiceAllowed = true;
      state.bioVoicePanelVisible = true;
      loadResearcherDashboard();
      configureAndEnterLearningEnvironment();
    }
  }

  function handleGuestLogin() {
    state.activeRole = "guest";
    state.participantCode = "GUEST-SANDBOX";
    state.participantGroup = "Guest Sandbox";
    state.consentVerified = false;
    state.assentVerified = false;
    state.termsAccepted = true;
    state.isSandbox = true;
    state.bioVoiceAllowed = true;
    state.bioVoicePanelVisible = true;
    state.selectedPlant = "Hydrilla";

    configureAndEnterLearningEnvironment();
  }

  function handleLogout() {
    stopSimulationTimer();
    stopSpeechOutput();
    state.activeRole = null;
    state.pendingParticipant = null;
    state.participantCode = null;
    state.participantGroup = null;
    state.consentVerified = false;
    state.assentVerified = false;
    state.termsAccepted = false;
    state.isSandbox = false;
    state.bioVoiceAllowed = false;
    state.staffToken = null;
    state.staffUser = null;
    state.staffRole = null;

    if ($("role-cards-grid")) $("role-cards-grid").hidden = false;
    if ($("group-confirm-panel")) $("group-confirm-panel").hidden = true;
    if ($("student-pin-input")) $("student-pin-input").value = "";
    if ($("admin-password-input")) $("admin-password-input").value = "";
    if ($("teacher-password-input")) $("teacher-password-input").value = "";
    showAlert("student-login-alert", "");
    showAlert("admin-login-alert", "");
    showAlert("teacher-login-alert", "");
    showAlert("group-confirm-alert", "");

    showScreen("welcome");
  }

  // ==========================================================================
  // 6. CONFIGURING THE MAIN LEARNING ENVIRONMENT BY ROLE & GROUP
  // ==========================================================================
  function configureAndEnterLearningEnvironment() {
    const modePill = $("active-mode-banner-pill");
    const profileBadge = $("profile-session-badge");
    const ctxTitle = $("role-context-title");
    const ctxDetail = $("role-context-detail");
    const toggleBvBtn = $("toggle-biovoice-panel-btn");
    const bvPanel = $("biovoice-side-panel");
    const bvBadge = $("bv-logging-badge");
    const teacherBtn = $("open-teacher-modal-btn");
    const dashReturnBtn = $("return-dashboard-btn");
    const askStepBtn = $("stepper-ask-biovoice-btn");

    if (teacherBtn) {
      teacherBtn.hidden = !(state.activeRole === "teacher" || state.activeRole === "admin");
    }
    if (dashReturnBtn) {
      dashReturnBtn.hidden = state.activeRole !== "admin";
    }

    if (state.activeRole === "student") {
      if (state.participantGroup === "Intervention") {
        if (modePill) modePill.textContent = "Intervention Group · BioVoice Active";
        if (profileBadge) profileBadge.textContent = `${state.participantCode} · Intervention`;
        if (ctxTitle) ctxTitle.textContent = `Intervention Group (${state.participantCode})`;
        if (ctxDetail) {
          ctxDetail.textContent =
            "Interactive Photosynthesis Simulation + BioVoice AI Voice Companion (Official Appendix I Research Logging Enabled)";
        }
        if (bvBadge) {
          bvBadge.textContent = `Official Logging Active · ${state.participantCode}`;
        }
      } else {
        if (modePill) modePill.textContent = "Comparison Group · Simulation + Teacher Support";
        if (profileBadge) profileBadge.textContent = `${state.participantCode} · Comparison`;
        if (ctxTitle) ctxTitle.textContent = `Comparison Group (${state.participantCode})`;
        if (ctxDetail) {
          ctxDetail.textContent =
            "Interactive Photosynthesis Simulation + Printed Activity Sheet & Teacher-Led Investigation (BioVoice Disabled per Protocol)";
        }
      }
    } else if (state.activeRole === "guest") {
      if (modePill) modePill.textContent = "Guest Demonstration Mode (Sandbox)";
      if (profileBadge) profileBadge.textContent = "Guest · Sandbox Mode";
      if (ctxTitle) ctxTitle.textContent = "Guest Sandbox Exploration";
      if (ctxDetail) {
        ctxDetail.textContent =
          "Demonstration Mode: Explore Hydrilla, Elodea, and Water Hyacinth freely. Sandbox BioVoice interactions are never counted as research data.";
      }
      if (bvBadge) {
        bvBadge.textContent = "Sandbox Demo Mode · Never Logged as Research Data";
      }
    } else if (state.activeRole === "teacher") {
      if (modePill) modePill.textContent = "Teacher Classroom Facilitation Mode";
      if (profileBadge) profileBadge.textContent = `${state.staffUser} · Teacher`;
      if (ctxTitle) ctxTitle.textContent = "Teacher Classroom Portal";
      if (ctxDetail) {
        ctxDetail.textContent =
          "Demonstrate the simulation, preview the Activity Guide, and record Appendix J classroom observations via 'Classroom Monitor'.";
      }
      if (bvBadge) {
        bvBadge.textContent = "Teacher Demonstration Mode · Sandbox Only";
      }
    } else if (state.activeRole === "admin") {
      if (modePill) modePill.textContent = "Researcher / Admin Workspace Preview";
      if (profileBadge) profileBadge.textContent = `${state.staffUser} · Researcher`;
      if (ctxTitle) ctxTitle.textContent = "Researcher Simulation & BioVoice Preview";
      if (ctxDetail) {
        ctxDetail.textContent =
          "Full preview of the learning environment. Click 'Researcher Dashboard' in the top bar to return to the private console.";
      }
      if (bvBadge) {
        bvBadge.textContent = "Researcher Preview · Sandbox Mode";
      }
    }

    // Show/hide BioVoice panel and controls strictly by group & phase
    if (state.bioVoiceAllowed) {
      if (toggleBvBtn) toggleBvBtn.hidden = false;
      if (askStepBtn) askStepBtn.hidden = false;
      setBioVoicePanelVisibility(true);
      initBioVoiceGreeting();
    } else {
      if (toggleBvBtn) toggleBvBtn.hidden = true;
      if (askStepBtn) askStepBtn.hidden = true;
      if (bvPanel) bvPanel.hidden = true;
    }

    updatePlantSelectionUI(state.selectedPlant);
    updateDistanceSelectionUI(state.selectedDistance);
    renderStepperUI();
    renderDataTablesAndGraph();
    showScreen("learning");
    startUnderwaterSwayAnimation();
  }

  function setBioVoicePanelVisibility(visible) {
    state.bioVoicePanelVisible = Boolean(visible);
    const panel = $("biovoice-side-panel");
    const toggleBtn = $("toggle-biovoice-panel-btn");
    const toggleLbl = $("toggle-biovoice-label");
    if (!state.bioVoiceAllowed) {
      if (panel) panel.hidden = true;
      if (toggleBtn) toggleBtn.hidden = true;
      return;
    }
    if (panel) panel.hidden = !state.bioVoicePanelVisible;
    if (toggleBtn) {
      toggleBtn.setAttribute("aria-expanded", String(state.bioVoicePanelVisible));
      toggleBtn.classList.toggle("is-collapsed", !state.bioVoicePanelVisible);
    }
    if (toggleLbl) {
      toggleLbl.textContent = state.bioVoicePanelVisible ? "Hide BioVoice" : "Show BioVoice";
    }
  }

  // ==========================================================================
  // 7. SIMULATION WORKSPACE: 3 AQUATIC PLANTS, SECONDS TIMER & DATA RECORDING
  // ==========================================================================
  function updatePlantSelectionUI(species) {
    if (!PLANT_PROFILES[species]) species = "Hydrilla";
    if (state.timerRunning) {
      stopSimulationTimer();
    }
    state.selectedPlant = species;
    const profile = PLANT_PROFILES[species];
    const officialSpecies = state.studyConfig.officialPlantSpecies || "Hydrilla";

    document.querySelectorAll(".plant-species-btn").forEach((btn) => {
      const sp = btn.getAttribute("data-plant-species");
      btn.classList.toggle("is-active", sp === species);
    });

    // Toggle SVG plant groups
    const hydrillaG = $("plant-visual-hydrilla");
    const elodeaG = $("plant-visual-elodea");
    const hyacinthG = $("plant-visual-hyacinth");
    const funnelEl = $("sim-glass-funnel");
    const tubeEl = $("sim-collection-tube");

    if (hydrillaG) hydrillaG.style.display = species === "Hydrilla" ? "block" : "none";
    if (elodeaG) elodeaG.style.display = species === "Elodea" ? "block" : "none";
    if (hyacinthG) hyacinthG.style.display = species === "Water Hyacinth" ? "block" : "none";

    // Water Hyacinth floats at the water surface, so hide submerged funnel when viewing Water Hyacinth
    if (funnelEl) funnelEl.style.opacity = species === "Water Hyacinth" ? "0.18" : "1";
    if (tubeEl) tubeEl.style.opacity = species === "Water Hyacinth" ? "0.18" : "1";

    if ($("svg-species-label")) $("svg-species-label").textContent = profile.svgLabel;
    if ($("readout-plant-species")) {
      $("readout-plant-species").innerHTML = `<em>${profile.scientific}</em> (${profile.habit.split(" ")[0]})`;
    }

    const noticeBox = $("plant-species-notice");
    const noticeTitle = $("plant-species-title");
    const noticeDesc = $("plant-species-desc");

    if (state.activeRole === "student" && species !== officialSpecies) {
      if (noticeBox) noticeBox.classList.add("exploratory-warning");
      if (noticeTitle) {
        noticeTitle.innerHTML = `Exploratory Comparison Mode — <em>${profile.scientific}</em> (${profile.habit}):`;
      }
      if (noticeDesc) {
        noticeDesc.textContent = `${profile.description} (Note: Official research data for your session uses ${officialSpecies}; exploratory ${species} runs are kept separate so your official table is never mixed.)`;
      }
    } else {
      if (noticeBox) noticeBox.classList.remove("exploratory-warning");
      if (noticeTitle) {
        noticeTitle.innerHTML = `<em>${profile.scientific}</em> (${profile.habit}):`;
      }
      if (noticeDesc) {
        noticeDesc.textContent = profile.description;
      }
    }

    renderDataTablesAndGraph();
  }

  /**
   * Synchronizes thermometer mercury, temperature text, and species water readout.
   */
  function updateSimulationEnvironmentUI(tempC) {
    const temp = typeof tempC === "number" ? tempC : 26.0;
    state.liveWaterTemp = temp;

    if ($("readout-water-temp")) {
      let hint = "Stabilized 0.2% NaHCO₃ · Active Enzymes";
      if (state.isNightTime) {
        hint = "Cold Night · Slower Enzymes (0.2% NaHCO₃)";
      } else if (state.selectedDistance === "dark") {
        hint = "Dark Control · 0.2% NaHCO₃ Buffer";
      } else if (temp > 26.2) {
        hint = "Lamp Warmth · Active Enzymes (0.2% NaHCO₃)";
      }
      $("readout-water-temp").textContent = `${temp.toFixed(1)} °C (${hint})`;
    }

    if ($("svg-temp-text")) {
      $("svg-temp-text").textContent = `${temp.toFixed(1)}°C`;
    }

    if ($("sim-thermo-mercury")) {
      const bottomY = 185;
      const mercuryHeight = Math.max(22, Math.min(165, Math.round(92 + (temp - 26.0) * 6)));
      $("sim-thermo-mercury").setAttribute("y", String(bottomY - mercuryHeight));
      $("sim-thermo-mercury").setAttribute("height", String(mercuryHeight));
    }

    if ($("svg-species-label")) {
      const profile = PLANT_PROFILES[state.selectedPlant] || PLANT_PROFILES.Hydrilla;
      const modeLabel = state.isNightTime ? "Night (Lamp OFF)" : "Day (Lamp ON)";
      $("svg-species-label").textContent =
        `Specimen: ${profile.scientific} · ${modeLabel} · Water Temp: ${temp.toFixed(1)} °C`;
    }
  }

  function updateDistanceSelectionUI(distKey) {
    const cond = LIGHT_CONDITIONS.find((c) => c.key === String(distKey)) || LIGHT_CONDITIONS[0];
    if (state.timerRunning) {
      // Changing condition mid-trial cancels the incomplete run without recording
      stopSimulationTimer();
      if ($("sim-completion-banner")) {
        $("sim-completion-banner").textContent =
          "Light condition changed — timer reset to 60 seconds. Click 'Start 60-Second Observation' to begin.";
        $("sim-completion-banner").classList.remove("is-complete");
      }
    }

    // Choosing an active lamp distance automatically turns Day/Lamp ON; Night keeps Lamp OFF
    if (cond.key !== "dark") {
      state.lastLitDistance = cond.key;
      if (state.isNightTime) {
        setDayNightMode("day", true);
      }
    }

    state.selectedDistance = cond.key;
    const effectiveDark = cond.key === "dark" || state.isNightTime;

    document.querySelectorAll(".distance-btn").forEach((btn) => {
      btn.classList.toggle("is-active", btn.getAttribute("data-distance") === cond.key);
    });

    // Update SVG Lamp position, light beam cone, and visual heat waves
    const lampGroup = $("sim-lamp-group");
    const lightCone = $("sim-light-cone");
    const lampHalo = $("sim-lamp-halo");
    const lampBulb = $("sim-lamp-bulb");
    const lampTag = $("sim-lamp-tag");
    const heatWaves = $("sim-heat-waves");

    if (lampGroup) {
      lampGroup.setAttribute("transform", `translate(${cond.lampX}, 0)`);
    }
    if (lightCone) {
      const startX = cond.lampX + 25;
      lightCone.setAttribute("points", `${startX},185 695,92 695,298`);
      lightCone.style.opacity = effectiveDark ? "0" : String(cond.coneOpacity);
    }
    if (lampHalo) {
      lampHalo.style.opacity = effectiveDark ? "0" : String(cond.coneOpacity);
    }
    if (lampBulb) {
      lampBulb.setAttribute("fill", effectiveDark ? "#475569" : "#fde047");
    }
    if (lampTag) {
      if (state.isNightTime) {
        lampTag.textContent = "Night · Lamp Off (0 lx)";
      } else {
        lampTag.textContent =
          cond.key === "dark" ? "Lamp Off (0 lx)" : `${cond.shortLabel} (${cond.lux.toLocaleString()} lx)`;
      }
    }
    if (heatWaves) {
      heatWaves.style.opacity = effectiveDark ? "0" : String(cond.heatWaveOpacity);
      heatWaves.setAttribute("transform", `translate(${cond.lampX - 420}, 0)`);
    }

    if ($("readout-light-condition")) {
      if (state.isNightTime) {
        $("readout-light-condition").textContent = "Night Darkness · Lamp OFF (0 lx)";
      } else {
        $("readout-light-condition").textContent = `${cond.shortLabel} · ${cond.lux.toLocaleString()} lx`;
      }
    }

    let previewTemp = state.isNightTime ? 18.5 : cond.tempC;
    if (typeof window !== "undefined" && window.PhotosynthesisModel && window.PhotosynthesisModel.calculateLiveTemperature) {
      const previewSec = effectiveDark ? 0 : 25;
      previewTemp = window.PhotosynthesisModel.calculateLiveTemperature(
        cond.key,
        previewSec,
        effectiveDark,
        state.isNightTime
      );
    }
    updateSimulationEnvironmentUI(previewTemp);
  }

  function generateControlledTrialBubbleCount(plantSpecies, distKey) {
    const historyKey = `${plantSpecies}:${distKey}:${state.isNightTime ? "night" : "day"}`;
    const prevCounts = state.trialVariationHistory[historyKey] || [];
    const trialSlot = (prevCounts.length % 3) + 1;

    // Night always keeps the lamp OFF -> 0 photosynthetic oxygen bubbles
    if (state.isNightTime) {
      return 0;
    }

    // Use pure scientific model if available (temperature + distance + species coupled)
    if (typeof window !== "undefined" && window.PhotosynthesisModel && window.PhotosynthesisModel.generateTrialCount) {
      const val = window.PhotosynthesisModel.generateTrialCount(distKey, trialSlot, plantSpecies, {
        species: plantSpecies,
        isNight: state.isNightTime,
        tempC: state.liveWaterTemp,
      });
      prevCounts.push(val);
      if (prevCounts.length > 3) prevCounts.shift();
      state.trialVariationHistory[historyKey] = prevCounts;
      return val;
    }

    const cond = LIGHT_CONDITIONS.find((c) => c.key === String(distKey)) || LIGHT_CONDITIONS[0];
    const range =
      (cond.rangesByPlant && cond.rangesByPlant[plantSpecies]) || cond.rangesByPlant.Hydrilla;
    const [minVal, maxVal] = range;

    let candidate = minVal;
    for (let attempt = 0; attempt < 12; attempt++) {
      candidate = Math.floor(minVal + Math.random() * (maxVal - minVal + 1));
      if (!prevCounts.includes(candidate) || maxVal - minVal <= 1) {
        break;
      }
    }
    prevCounts.push(candidate);
    if (prevCounts.length > 3) prevCounts.shift();
    state.trialVariationHistory[historyKey] = prevCounts;
    return candidate;
  }

  function buildBubbleScheduleFor60Seconds(totalBubbles) {
    // Distributes `totalBubbles` events across seconds 1..60 so live counter & SVG bubbles match 1-to-1
    const schedule = new Array(61).fill(0);
    if (totalBubbles <= 0) return schedule;
    for (let i = 0; i < totalBubbles; i++) {
      const baseSec = Math.min(
        60,
        Math.max(1, Math.round(((i + 0.5) / totalBubbles) * 59) + (i % 2 === 0 ? 0 : 1))
      );
      schedule[baseSec] += 1;
    }
    return schedule;
  }

  function startSimulationTrial() {
    stopSimulationTimer();
    const paceSelect = $("sim-pace-select");
    state.timerMode = paceSelect ? paceSelect.value : "accelerated";

    state.remainingSeconds = 60;
    state.elapsedSeconds = 0;
    state.liveBubblesCounted = 0;
    state.targetTrialBubbles = generateControlledTrialBubbleCount(
      state.selectedPlant,
      state.selectedDistance
    );
    state.bubbleSchedule = buildBubbleScheduleFor60Seconds(state.targetTrialBubbles);
    state.activeSvgBubbles = [];
    clearSvgBubbles();

    state.timerRunning = true;
    state.timerPaused = false;
    updateTimerControlsUI();
    updateTimerDisplayUI();

    const banner = $("sim-completion-banner");
    if (banner) {
      banner.textContent = `Counting oxygen bubbles for ${state.selectedPlant} at ${state.selectedDistance === "dark" ? "Dark Control" : state.selectedDistance + " cm"}...`;
      banner.classList.remove("is-complete");
    }

    const tickMs = state.timerMode === "realtime" ? 1000 : 95;
    state.timerIntervalId = window.setInterval(tickSimulationSecond, tickMs);
  }

  function tickSimulationSecond() {
    if (!state.timerRunning || state.timerPaused) return;

    state.elapsedSeconds += 1;
    state.remainingSeconds = Math.max(0, 60 - state.elapsedSeconds);

    // Live water temperature simulation: Day warms with solar/lamp proximity; Night cools cold
    const isDarkCondition = state.selectedDistance === "dark" || state.isNightTime;
    if (typeof window !== "undefined" && window.PhotosynthesisModel && window.PhotosynthesisModel.calculateLiveTemperature) {
      const nextTemp = window.PhotosynthesisModel.calculateLiveTemperature(
        state.selectedDistance,
        state.elapsedSeconds,
        isDarkCondition,
        state.isNightTime
      );
      updateSimulationEnvironmentUI(nextTemp);
    }

    const scheduledNow = state.bubbleSchedule[state.elapsedSeconds] || 0;
    for (let b = 0; b < scheduledNow; b++) {
      state.liveBubblesCounted += 1;
      spawnSynchronizedSvgBubble();
    }

    updateTimerDisplayUI();

    if (state.remainingSeconds <= 0) {
      completeSixtySecondObservation();
    }
  }

  function pauseSimulationTrial() {
    if (!state.timerRunning || state.timerPaused) return;
    state.timerPaused = true;
    updateTimerControlsUI();
    if ($("sim-timer-state-badge")) {
      $("sim-timer-state-badge").textContent = `Paused at ${state.remainingSeconds} seconds`;
    }
  }

  function resumeSimulationTrial() {
    if (!state.timerRunning || !state.timerPaused) return;
    state.timerPaused = false;
    updateTimerControlsUI();
    if ($("sim-timer-state-badge")) {
      $("sim-timer-state-badge").textContent = "Observation running...";
    }
  }

  function stopSimulationTimer() {
    if (state.timerIntervalId) {
      window.clearInterval(state.timerIntervalId);
      state.timerIntervalId = null;
    }
    state.timerRunning = false;
    state.timerPaused = false;
    state.remainingSeconds = 60;
    state.elapsedSeconds = 0;
    state.liveBubblesCounted = 0;
    clearSvgBubbles();
    updateTimerControlsUI();
    updateTimerDisplayUI();
  }

  function completeSixtySecondObservation() {
    if (state.timerIntervalId) {
      window.clearInterval(state.timerIntervalId);
      state.timerIntervalId = null;
    }
    state.timerRunning = false;
    state.timerPaused = false;
    state.remainingSeconds = 0;
    state.liveBubblesCounted = state.targetTrialBubbles;

    // Record into the active table (Trial 1 -> Trial 2 -> Trial 3)
    const activeTable = getActiveSimTable();
    const row = activeTable[state.selectedDistance] || [null, null, null];
    let recordedTrialSlot = 1;
    const openIdx = row.findIndex((v) => v === null);
    if (openIdx !== -1) {
      row[openIdx] = state.targetTrialBubbles;
      recordedTrialSlot = openIdx + 1;
    } else {
      // Shift or update Trial 3 if all 3 are already filled
      row[0] = row[1];
      row[1] = row[2];
      row[2] = state.targetTrialBubbles;
      recordedTrialSlot = 3;
    }
    activeTable[state.selectedDistance] = row;

    updateTimerControlsUI();
    if ($("sim-seconds-display")) $("sim-seconds-display").textContent = "0 seconds";
    if ($("sim-timer-state-badge")) {
      $("sim-timer-state-badge").textContent = "Observation complete — 60 seconds.";
    }
    if ($("sim-timer-progress-bar")) {
      $("sim-timer-progress-bar").style.width = "100%";
    }
    if ($("sim-live-bubbles")) {
      $("sim-live-bubbles").textContent = String(state.targetTrialBubbles);
    }

    const condLabel =
      state.selectedDistance === "dark" ? "Dark Control" : `${state.selectedDistance} cm`;
    const banner = $("sim-completion-banner");
    if (banner) {
      banner.textContent = `Observation complete — 60 seconds. Recorded ${state.targetTrialBubbles} bubbles in Trial ${recordedTrialSlot} for ${condLabel} (${state.selectedPlant}).`;
      banner.classList.add("is-complete");
    }

    renderDataTablesAndGraph();
  }

  function updateTimerControlsUI() {
    const startBtn = $("sim-start-btn");
    const pauseBtn = $("sim-pause-btn");
    const resumeBtn = $("sim-resume-btn");

    if (startBtn) startBtn.disabled = state.timerRunning;
    if (pauseBtn) {
      pauseBtn.disabled = !state.timerRunning || state.timerPaused;
      pauseBtn.hidden = state.timerPaused;
    }
    if (resumeBtn) {
      resumeBtn.hidden = !state.timerPaused;
    }
  }

  function updateTimerDisplayUI() {
    const secEl = $("sim-seconds-display");
    const badgeEl = $("sim-timer-state-badge");
    const barEl = $("sim-timer-progress-bar");
    const liveEl = $("sim-live-bubbles");

    if (secEl) {
      secEl.textContent = `${state.remainingSeconds} ${state.remainingSeconds === 1 ? "second" : "seconds"}`;
    }
    if (badgeEl && state.timerRunning && !state.timerPaused) {
      badgeEl.textContent = `Observing (${state.elapsedSeconds}s / 60s elapsed)`;
    } else if (badgeEl && !state.timerRunning && state.remainingSeconds === 60) {
      badgeEl.textContent = "Ready to start 60-second run";
    }
    if (barEl) {
      const pct = Math.min(100, Math.round((state.elapsedSeconds / 60) * 100));
      barEl.style.width = `${pct}%`;
    }
    if (liveEl) {
      liveEl.textContent = String(state.liveBubblesCounted);
    }
  }

  // ==========================================================================
  // 8. REALISTIC UNDERWATER SWAY & SYNCHRONIZED BUBBLE ANIMATION
  // ==========================================================================
  function spawnSynchronizedSvgBubble() {
    const layer = $("sim-bubbles-layer");
    if (!layer) return;
    const profile = PLANT_PROFILES[state.selectedPlant] || PLANT_PROFILES.Hydrilla;
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    // Variable bubble size (r = 2.6 to 5.6 px)
    const radius = Number((2.6 + Math.random() * 3.0).toFixed(1));
    const startX = 621 + (Math.random() * 12 - 6);
    const startY = profile.bubbleOriginY;

    circle.setAttribute("cx", String(startX));
    circle.setAttribute("cy", String(startY));
    circle.setAttribute("r", String(radius));
    circle.setAttribute("fill", "url(#o2BubbleGrad)");
    layer.appendChild(circle);

    state.activeSvgBubbles.push({
      el: circle,
      x: startX,
      y: startY,
      r: radius,
      vy: 1.35 + Math.random() * 0.75,
      wobbleOffset: Math.random() * Math.PI * 2,
    });
  }

  function clearSvgBubbles() {
    state.activeSvgBubbles = [];
    const layer = $("sim-bubbles-layer");
    if (layer) layer.innerHTML = "";
  }

  function startUnderwaterSwayAnimation() {
    if (state.swayAnimFrameId) return;

    function stepAnimation() {
      state.swayPhase += 0.035;
      const swayDeg = Math.sin(state.swayPhase) * 1.65;
      const bobY = Math.cos(state.swayPhase * 0.85) * 1.4;

      const hydrillaG = $("plant-visual-hydrilla");
      const elodeaG = $("plant-visual-elodea");
      const hyacinthG = $("plant-visual-hyacinth");

      if (hydrillaG && state.selectedPlant === "Hydrilla") {
        hydrillaG.setAttribute("transform", `rotate(${swayDeg.toFixed(2)} 627 302)`);
      }
      if (elodeaG && state.selectedPlant === "Elodea") {
        elodeaG.setAttribute("transform", `rotate(${(swayDeg * 0.85).toFixed(2)} 627 302)`);
      }
      if (hyacinthG && state.selectedPlant === "Water Hyacinth") {
        hyacinthG.setAttribute(
          "transform",
          `translate(0, ${bobY.toFixed(2)}) rotate(${(swayDeg * 0.45).toFixed(2)} 627 132)`
        );
      }

      // Animate rising synchronized oxygen bubbles
      for (let i = state.activeSvgBubbles.length - 1; i >= 0; i--) {
        const b = state.activeSvgBubbles[i];
        b.y -= b.vy;
        const curX = b.x + Math.sin(state.swayPhase * 2 + b.wobbleOffset) * 2.2;
        if (b.y <= 108) {
          if (b.el && b.el.parentNode) b.el.parentNode.removeChild(b.el);
          state.activeSvgBubbles.splice(i, 1);
        } else if (b.el) {
          b.el.setAttribute("cx", curX.toFixed(1));
          b.el.setAttribute("cy", b.y.toFixed(1));
        }
      }

      state.swayAnimFrameId = window.requestAnimationFrame(stepAnimation);
    }

    state.swayAnimFrameId = window.requestAnimationFrame(stepAnimation);
  }

  // ==========================================================================
  // 9. COMPACT 1-AT-A-TIME SEQUENTIAL ACTIVITY STEPPER (STEPS 1..6)
  // ==========================================================================
  function renderStepperUI() {
    const step = ACTIVITY_STEPS[state.currentStepIndex] || ACTIVITY_STEPS[0];
    if ($("stepper-counter-badge")) $("stepper-counter-badge").textContent = step.stepLabel;
    if ($("stepper-sp-badge")) $("stepper-sp-badge").textContent = step.lcTag;
    if ($("stepper-current-title")) $("stepper-current-title").textContent = step.partTitle;
    if ($("stepper-current-prompt")) $("stepper-current-prompt").textContent = step.prompt;

    const noteInput = $("stepper-response-input");
    if (noteInput) {
      noteInput.placeholder = step.placeholder;
      noteInput.value = state.stepNotes[step.index] || "";
    }

    document.querySelectorAll(".step-dot").forEach((dot) => {
      const idx = Number(dot.getAttribute("data-step-index"));
      dot.classList.toggle("is-active", idx === step.index);
      dot.classList.toggle("is-completed", Boolean(state.stepCompleted[idx]));
    });

    if ($("stepper-prev-btn")) $("stepper-prev-btn").disabled = step.index === 0;
    if ($("stepper-next-btn")) {
      $("stepper-next-btn").disabled = step.index === ACTIVITY_STEPS.length - 1;
    }

    const completeBtn = $("stepper-complete-btn");
    if (completeBtn) {
      completeBtn.textContent = state.stepCompleted[step.index]
        ? `✓ Step ${step.index + 1} Completed`
        : `✓ Mark Step ${step.index + 1} Complete`;
    }

    const askBtn = $("stepper-ask-biovoice-btn");
    if (askBtn) {
      askBtn.textContent = `🎙️ Ask BioVoice about ${step.spCode}`;
    }

    // Sync BioVoice Support Point selector
    state.supportPoint = step.sp;
    const spSelect = $("support-point-select");
    if (spSelect && spSelect.value !== step.sp) {
      spSelect.value = step.sp;
    }
    renderPromptChips();
  }

  function handleMarkStepComplete() {
    const step = ACTIVITY_STEPS[state.currentStepIndex];
    const noteEl = $("stepper-response-input");
    const noteText = (noteEl ? noteEl.value : "").trim();
    state.stepNotes[step.index] = noteText;

    const msgEl = $("stepper-validation-msg");
    if (step.requiresTrial) {
      const completedCount = countCompletedTrialsInTable(getActiveSimTable());
      if (completedCount === 0) {
        if (msgEl) {
          msgEl.hidden = false;
          msgEl.className = "stepper-validation-msg";
          msgEl.textContent =
            "Please run at least one complete 60-second observation trial above before marking Step 3 (Investigate) complete.";
        }
        return;
      }
    }

    if (noteText.length < step.minChars) {
      if (msgEl) {
        msgEl.hidden = false;
        msgEl.className = "stepper-validation-msg";
        msgEl.textContent =
          "Please write a brief scientific note or prediction in the box above before marking this step complete.";
      }
      return;
    }

    state.stepCompleted[step.index] = true;
    if (msgEl) {
      msgEl.hidden = false;
      msgEl.className = "stepper-validation-msg ok";
      msgEl.textContent = `${step.stepLabel} (${step.spCode}) marked complete!`;
    }
    renderStepperUI();
  }

  // ==========================================================================
  // 10. DATA TABLE (BELOW SIMULATION) & GRAPH (BELOW DATA TABLE)
  // ==========================================================================
  function renderDataTablesAndGraph() {
    const simTbody = $("sim-data-tbody");
    const physTbody = $("physical-data-tbody");
    const activeTable = getActiveSimTable();

    if (simTbody) {
      simTbody.innerHTML = LIGHT_CONDITIONS.map((cond) => {
        const trials = activeTable[cond.key] || [null, null, null];
        const mean = computeMean(trials);
        const completed = trials.filter((v) => typeof v === "number").length;
        const statusText =
          completed === 0
            ? '<span class="cell-empty">Not yet performed</span>'
            : completed < 3
            ? `<span class="status-pill">${completed} of 3 trials recorded</span>`
            : `<span class="status-pill assigned">Complete (3/3 trials)</span>`;

        return `
          <tr>
            <td><strong>${cond.label}</strong></td>
            <td>${cond.lux.toLocaleString()} lx</td>
            <td class="${trials[0] === null ? "cell-empty" : "cell-recorded"}">${trials[0] === null ? "—" : trials[0]}</td>
            <td class="${trials[1] === null ? "cell-empty" : "cell-recorded"}">${trials[1] === null ? "—" : trials[1]}</td>
            <td class="${trials[2] === null ? "cell-empty" : "cell-recorded"}">${trials[2] === null ? "—" : trials[2]}</td>
            <td class="${mean === null ? "cell-empty" : "cell-mean"}">${mean === null ? "—" : mean.toFixed(1)}</td>
            <td>${statusText}</td>
          </tr>
        `;
      }).join("");
    }

    if (physTbody) {
      physTbody.innerHTML = LIGHT_CONDITIONS.map((cond) => {
        const row = state.physicalTable[cond.key] || { trials: [null, null, null], temp: "26.0" };
        const mean = computeMean(row.trials);
        return `
          <tr>
            <td><strong>${cond.label}</strong></td>
            ${[0, 1, 2]
              .map(
                (idx) => `
              <td>
                <input
                  type="number"
                  min="0"
                  max="150"
                  class="phys-trial-input"
                  data-cond="${cond.key}"
                  data-trial-idx="${idx}"
                  value="${row.trials[idx] === null ? "" : row.trials[idx]}"
                  placeholder="—"
                  style="width:72px;padding:0.28rem 0.45rem;"
                />
              </td>
            `
              )
              .join("")}
            <td class="${mean === null ? "cell-empty" : "cell-mean"}">${mean === null ? "—" : mean.toFixed(1)}</td>
            <td>26.0 °C</td>
          </tr>
        `;
      }).join("");

      physTbody.querySelectorAll(".phys-trial-input").forEach((inp) => {
        inp.addEventListener("change", (e) => {
          const ck = e.target.getAttribute("data-cond");
          const ti = Number(e.target.getAttribute("data-trial-idx"));
          const raw = e.target.value.trim();
          state.physicalTable[ck].trials[ti] = raw === "" ? null : Math.max(0, Number(raw));
          renderDataTablesAndGraph();
        });
      });
    }

    renderGraphBelowTable();
  }

  function renderGraphBelowTable() {
    const svg = $("sim-graph-svg");
    const statusBadge = $("graph-status-badge");
    if (!svg) return;

    const isPhysical = state.tableMode === "physical";
    const activeTable = getActiveSimTable();
    const points = LIGHT_CONDITIONS.map((cond, idx) => {
      const trials = isPhysical
        ? (state.physicalTable[cond.key] || {}).trials
        : activeTable[cond.key];
      const mean = computeMean(trials);
      return {
        cond,
        idx,
        mean,
      };
    });

    const validPoints = points.filter((p) => p.mean !== null);
    if (statusBadge) {
      statusBadge.textContent =
        validPoints.length === 0
          ? "Complete a 60-second trial to plot data points"
          : `Plotting ${validPoints.length} of 5 conditions (${state.selectedPlant})`;
    }

    const padL = 68;
    const padR = 36;
    const padT = 28;
    const padB = 48;
    const plotW = 760 - padL - padR;
    const plotH = 280 - padT - padB;
    const maxY = 50;

    let gridHtml = "";
    for (let yVal = 0; yVal <= maxY; yVal += 10) {
      const yPos = padT + plotH - (yVal / maxY) * plotH;
      gridHtml += `
        <line x1="${padL}" y1="${yPos}" x2="${760 - padR}" y2="${yPos}" stroke="#e2e8f0" stroke-width="1" />
        <text x="${padL - 10}" y="${yPos + 4}" text-anchor="end" font-size="11" fill="#64748b" font-family="JetBrains Mono, monospace">${yVal}</text>
      `;
    }

    const xPositions = points.map((_, i) => padL + (i * plotW) / (points.length - 1));
    let xLabelsHtml = points
      .map(
        (p, i) => `
        <text x="${xPositions[i]}" y="${280 - 16}" text-anchor="middle" font-size="11.5" font-weight="700" fill="#1e293b">${p.cond.shortLabel}</text>
      `
      )
      .join("");

    let barsAndLineHtml = "";
    const polyCoords = [];

    points.forEach((p, i) => {
      if (p.mean !== null) {
        const x = xPositions[i];
        const y = padT + plotH - (Math.min(maxY, p.mean) / maxY) * plotH;
        const barH = padT + plotH - y;
        polyCoords.push(`${x},${y}`);
        barsAndLineHtml += `
          <rect x="${x - 22}" y="${y}" width="44" height="${barH}" rx="5" fill="rgba(16, 185, 129, 0.22)" stroke="#10b981" stroke-width="1.5" />
          <circle cx="${x}" cy="${y}" r="5.5" fill="#047857" stroke="#ffffff" stroke-width="2" />
          <text x="${x}" y="${y - 10}" text-anchor="middle" font-size="11" font-weight="800" fill="#065f46" font-family="JetBrains Mono, monospace">${p.mean.toFixed(1)}</text>
        `;
      }
    });

    if (polyCoords.length >= 2) {
      barsAndLineHtml =
        `<polyline points="${polyCoords.join(" ")}" fill="none" stroke="#059669" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />` +
        barsAndLineHtml;
    }

    if (validPoints.length === 0) {
      barsAndLineHtml += `
        <text x="395" y="142" text-anchor="middle" font-size="13" font-weight="700" fill="#64748b">
          No trials recorded yet — Run a 60-second observation above to plot your experimental data.
        </text>
      `;
    }

    svg.innerHTML = `
      ${gridHtml}
      <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT + plotH}" stroke="#94a3b8" stroke-width="1.5" />
      <line x1="${padL}" y1="${padT + plotH}" x2="${760 - padR}" y2="${padT + plotH}" stroke="#94a3b8" stroke-width="1.5" />
      <text x="18" y="145" transform="rotate(-90 18 145)" text-anchor="middle" font-size="11" font-weight="700" fill="#475569">
        Mean Bubbles / 60 Seconds
      </text>
      ${xLabelsHtml}
      ${barsAndLineHtml}
    `;
  }

  // ==========================================================================
  // 11. AUTOMATIC LANGUAGE DETECTION (EN / FIL / CEB + CODE-SWITCHING)
  // ==========================================================================
  function detectLanguageUtterance(text, mode) {
    if (mode && mode !== "auto" && ["en-PH", "fil-PH", "ceb-PH"].includes(mode)) {
      const manualLabels = {
        "en-PH": "English (Manual)",
        "fil-PH": "Filipino (Manual)",
        "ceb-PH": "Cebuano / Bisaya (Manual)",
      };
      return { code: mode, label: manualLabels[mode] || "English" };
    }

    const cleaned = String(text || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s\-']/g, " ");
    const tokens = cleaned.split(/\s+/).filter(Boolean);

    const cebMarkers = new Set([
      "ngano", "nganong", "unsa", "unsay", "unsaon", "adunay", "naay", "naa",
      "kaayo", "tanom", "kahayag", "ngitngit", "duol", "layo", "kini", "kana",
      "niini", "gihapon", "diay", "mao", "dili", "wala", "walay", "daghan",
      "daghang", "gamay", "kon", "ug", "nga", "man", "bula", "tubig", "unsaon",
      "mahitabo", "tungod", "kay", "pila", "ipatin-aw", "pasabot"
    ]);
    const filMarkers = new Set([
      "bakit", "paano", "ano", "anong", "kapag", "halaman", "liwanag", "dilim",
      "malapit", "malayo", "dahil", "kasi", "yung", "iyong", "naman", "po",
      "opo", "ba", "kaya", "marami", "maraming", "konti", "kaunti", "walang",
      "ito", "iyan", "nangyayari", "ibig", "sabihin", "tungkol", "nakakaapekto",
      "masyadong", "habang", "para"
    ]);

    let cebScore = 0;
    let filScore = 0;

    tokens.forEach((tok) => {
      if (cebMarkers.has(tok)) {
        cebScore += ["ngano", "nganong", "unsa", "unsay", "unsaon", "adunay", "naay", "tanom", "kahayag", "ngitngit", "dili", "kaayo", "ug"].includes(tok) ? 2 : 1;
      }
      if (/^(mu-|mo-|nag-|mag-|makapahimo)/.test(tok)) {
        cebScore += 2;
      }
      if (filMarkers.has(tok)) {
        filScore += ["bakit", "paano", "anong", "kapag", "halaman", "liwanag", "dilim", "malapit", "malayo", "dahil", "kasi", "yung", "nangyayari"].includes(tok) ? 2 : 1;
      }
    });

    if (cebScore > filScore && cebScore >= 2) {
      return { code: "ceb-PH", label: "Cebuano (Bisaya)" };
    }
    if (filScore > cebScore && filScore >= 2) {
      return { code: "fil-PH", label: "Filipino" };
    }
    if (cebScore >= 2 && cebScore === filScore) {
      return { code: "ceb-PH", label: "Cebuano (Bisaya)" };
    }
    return { code: "en-PH", label: "English" };
  }

  // ==========================================================================
  // 12. MULTI-TURN CONVERSATIONAL BIOVOICE COGNITIVE TUTOR (APPENDIX H)
  // ==========================================================================
  const IDEA_KNOWLEDGE_BASE = {
    I1: {
      title: "Why Plants Need Light",
      en: {
        H: "Think of green chlorophyll like tiny solar panels inside the plant's leaves. When the lamp is switched off, do those solar panels have any energy coming in to split water apart?",
        C: "Here's the simple idea: inside green plant cells, chlorophyll works like tiny solar panels. When light hits them, it gives them the kick of energy needed to snap water molecules apart—and that's what starts the whole food-making process!",
        E: "Think of photosynthesis like a solar-powered kitchen! First, green chlorophyll acts like tiny solar panels inside the leaves. When lamp light hits those panels, it supplies the energy to snap water molecules apart—a step called photolysis, which literally means 'light splitting.' That releases oxygen bubbles you can see, while charging up energy for making glucose sugar. Without light, the solar panels shut off right away!",
      },
      fil: {
        H: "Isipin mong parang maliliit na solar panel ang green chlorophyll sa loob ng dahon. Kapag patay ang lamp, may enerhiya ba itong makukuha para hatiin ang tubig?",
        C: "Ganito lang kasimple: ang chlorophyll ay parang solar panel ng halaman. Kapag tinamaan ito ng liwanag mula sa lamp, nagkakaroon ito ng sapat na enerhiya para hatiin ang tubig—at diyan nagsisimula ang paggawa ng pagkain at oxygen!",
        E: "Isipin mong parang solar-powered na kusina ang photosynthesis! Ang green chlorophyll sa dahon ang nagsisilbing maliliit na solar panel. Kapag tumama ang liwanag ng lamp dito, binibigyan nito ng lakas ang halaman para hatiin ang tubig—ang prosesong tinatawag na photolysis. Dito lumalabas ang nakikita mong oxygen bubbles, habang nag-iipon ito ng enerhiya para makagawa ng glucose!",
      },
      ceb: {
        H: "Hunahunaa nga ang green chlorophyll murag gagmayng solar panel sulod sa dahon. Kon palong ang suga, naa bay enerhiya nga mosulod aron mabahin ang tubig?",
        C: "Ingon ani lang ni kasayon: ang chlorophyll murag solar panel sa tanom. Kon maigo kini sa kahayag gikan sa lamp, makakuha kini og kusog aron mapikas ang tubig—ug diha magsugod ang paghimo og oxygen ug pagkaon!",
        E: "Hunahunaa nga murag solar-powered kitchen ang photosynthesis! Ang green chlorophyll mao ang gagmayng solar panel sa dahon. Kon moigo ang kahayag, gamiton niini ang enerhiya aron pikas-pikason ang tubig—gitawag ni og photolysis. Mao na ang mopagawas og oxygen bubbles nga imong makita, samtang magtigom og kusog para makahimo og asukar nga glucose!",
      },
    },
    I2: {
      title: "Why Counting Bubbles Shows the Rate",
      en: {
        H: "Watch the little gas bubbles floating up from the cut stem! Since the plant releases one specific gas every time it splits water with light, counting them for 60 seconds tells you how fast what process is happening?",
        C: "Every bubble rising from the Hydrilla shoot is oxygen gas escaping as a side product when light splits water inside the leaves. So more bubbles in 60 seconds simply means photosynthesis is running faster!",
        E: "Great question! When chlorophyll captures light, the leaf uses that energy to split water into building blocks it needs—and oxygen gas is left over. Underwater, that leftover oxygen forms tiny visible bubbles rising from the cut stem! By timing exactly 60 seconds and counting those bubbles, we turn an invisible cellular reaction into something easy to measure and compare across lamp distances!",
      },
      fil: {
        H: "Panoorin ang maliliit na bula na umaakyat mula sa pinutol na tangkay! Dahil lumalabas ang gas na ito tuwing hinahati ang tubig gamit ang ilaw, ano ang ipinapakita ng bilang ng bula sa 60 seconds?",
        C: "Bawat bulang umaakyat mula sa Hydrilla ay oxygen gas na nabubuo kapag hinati ng liwanag ang tubig. Kaya mas maraming bula sa 60 seconds, ibig sabihin ay mas mabilis tumatakbo ang photosynthesis!",
        E: "Magandang obserbasyon! Kapag ginagamit ng dahon ang liwanag para hatiin ang tubig, may sobrang oxygen gas na lumalabas. Sa ilalim ng tubig, nagiging maliliit na bula ito mula sa tangkay! Kaya kapag binilang natin ito sa loob ng 60 seconds, madali nating nasusukat kung gaano kabilis nagaganap ang photosynthesis sa bawat distansya.",
      },
      ceb: {
        H: "Tan-awa ang gagmayng bula nga mosaka gikan sa putol nga tangkay! Matag higayon nga mapikas ang tubig tungod sa kahayag, usa ka gas ang mogawas. Unsa man ang gipakita sa kadaghanon sa bula sulod sa 60 seconds?",
        C: "Ang matag bula nga mosaka gikan sa Hydrilla kay oxygen gas nga sobra inig pikas sa tubig. Busa, kon mas daghang bula sulod sa 60 seconds, pasabot ana mas paspas ang photosynthesis!",
        E: "Nindot nga pangutana! Kon gamiton sa tanom ang kahayag aron pikason ang tubig, naay sobrang oxygen gas nga mogawas. Ilawom sa tubig, mahimo kining gagmayng bula sa tangkay! Pinaagi sa pag-ihap sa bula sulod sa 60 seconds, dali nato masukod ug matandi kon unsa kapaspas ang photosynthesis sa matag gilay-on sa suga.",
      },
    },
    I3: {
      title: "Why Lamp Distance Changes Bubble Speed",
      en: {
        H: "Picture a flashlight shining on a wall: when you step back from 10 cm to 40 cm, does the light stay tightly focused on the plant, or does it spread out thinner?",
        C: "Think of a flashlight! At 10 cm (2,500 lx), light hits the plant in a tight, super-bright beam. When you slide the lamp back to 40 cm (156 lx), that same light spreads wide and thin—so fewer light packets hit the leaves each second, making bubbles slow way down!",
        E: "Picture shining a flashlight onto your notebook. Hold it close at 10 cm (2,500 lux), and all the brightness hits one small spot—giving chlorophyll plenty of energy to churn out roughly 39 to 45 bubbles per minute! Now pull that lamp back to 20 cm (625 lux) or all the way to 40 cm (156 lux). Because light spreads outward in two directions—wider AND taller—doubling the distance drops brightness to one-fourth! With way dimmer light hitting the leaf, water splits slower and bubble count drops cleanly.",
      },
      fil: {
        H: "Isipin mong may hawak kang flashlight: kapag inilayo mo ito mula 10 cm papuntang 40 cm, naiipon ba ang liwanag sa dahon o kumakalat ito at humihina?",
        C: "Parang flashlight lang iyan! Sa 10 cm (2,500 lx), tutok na tutok ang malakas na ilaw sa halaman. Pagdating sa 40 cm (156 lx), kumakalat na nang malawak ang ilaw kaya mas kaunting liwanag ang nakakaabot sa dahon—at bumabagal din ang paglabas ng mga bula!",
        E: "Isipin mong tumututok ka ng flashlight sa papel. Kapag malapit sa 10 cm (2,500 lux), siksik ang liwanag sa isang lugar kaya nakakagawa ito ng mga 39 hanggang 45 bubbles kada 60 seconds! Pero kapag inilayo sa 20 cm (625 lux) hanggang 40 cm (156 lux), kumakalat ang liwanag sa mas malaking espasyo kaya nagiging mas mahina ang sikat sa bawat dahon—at bumababa nang malinaw ang bilang ng bula.",
      },
      ceb: {
        H: "Hunahunaa ang flashlight nga gitutok sa bungbong: kon imong ilayo gikan sa 10 cm ngadto sa 40 cm, magpabilin bang kusog ang kahayag o mokatag ug mohinay na?",
        C: "Murag flashlight ra gyud na! Sa 10 cm (2,500 lx), nakapokus kaayo ang hayag sa tanom. Kon ilayo sa 40 cm (156 lx), mokatag ang kahayag sa dako nga lugar maong mas gamay nga hayag ang moigo sa dahon—ug mohinay pud ang bula!",
        E: "Hunahunaa nga nagtutok ka og flashlight sa notebook. Kon duol sa 10 cm (2,500 lux), tipon kaayo ang kahayag sa usa ka lugar maong makahimo og mga 39 hangtod 45 ka bula sa usa ka minuto! Kon ilayo ngadto sa 20 cm (625 lux) o 40 cm (156 lux), mokatag ang kahayag sa gilapdon ug gitas-on maong mokunhod dayon ang kusog niini ngadto sa dahon ug mogamay ang bula.",
      },
    },
    I4: {
      title: "Why We Need the Dark Control",
      en: {
        H: "If everything else—the plant, water temperature, and baking soda water—stays identical when the lamp goes completely off, what does getting 0 bubbles in the dark prove?",
        C: "The Dark Control (0 lx) is our 'just-to-be-sure' baseline check! When the lamp shuts off and bubbles stop right away even though water and carbon dioxide are still there, it proves the bubbles in your lit runs really came from light-driven photosynthesis!",
        E: "Every good science test needs a baseline comparison—that's what our Dark Control (0 lux) does! Here we keep the same Hydrilla shoot, the same 0.2% sodium bicarbonate solution, and the exact same 60-second timer, and ONLY turn off the light. Immediately, bubble production drops to 0 to 2 bubbles per minute! That proves those rising bubbles weren't just random fizzing from the water—they truly depend on light energy.",
      },
      fil: {
        H: "Kung pareho pa rin ang halaman, tubig, at NaHCO₃ pero patay na ang lamp, ano ang pinapatunayan kung biglang maging halos zero ang bubbles?",
        C: "Ang Dark Control (0 lx) ang nagsisilbing baseline comparison natin! Dahil humihinto ang mga bula pagkatay ng ilaw kahit nariyan pa ang tubig at CO₂, siguradong liwanag talaga ang nagpapagana sa paggawa ng oxygen bubbles!",
        E: "Sa anumang eksperimento, kailangan ng baseline comparison—iyon ang trabaho ng Dark Control (0 lux). Pareho pa rin ang halaman, ang 0.2% NaHCO₃ na tubig, at ang 60 seconds, pero pinatay natin ang ilaw. Agad bumabagsak sa 0 hanggang 2 bubbles lang! Pinatutunayan nito na ang nakitang bula ay hindi basta bula ng tubig kundi dulot talaga ng liwanag.",
      },
      ceb: {
        H: "Kon pareho ra gihapon ang tanom, tubig, ug NaHCO₃ pero gipalong ang suga, unsay mapamatud-an kon mohunong o halos mawala ang mga bula?",
        C: "Ang Dark Control (0 lx) mao ang atong baseline test! Tungod kay mohunong man ang bula inig palong sa suga bisan naa gihapon ang tubig ug CO₂, nagpamatuod ni nga kahayag gyud ang nagpadagan sa paghimo og oxygen bubbles!",
        E: "Ang matag maayong eksperimento nanginahanglan og baseline comparison—mao kana ang Dark Control (0 lux). Pareho ra ang Hydrilla, ang 0.2% NaHCO₃ sa tubig, ug ang 60 seconds, apan walay suga. Inig ka ngitngit, mahimong 0 hangtod 2 na lang ang bula—nga nagpamatuod nga gikan gyud sa kahayag ang mga bula nga imong naihap!",
      },
    },
    I5: {
      title: "Why the Graph Levels Off at High Light (Bottleneck)",
      en: {
        H: "Think about a busy burger kitchen: even if you turn on four times brighter ceiling lights, can the cooks flip burgers four times faster if they only have so many buns or hands?",
        C: "Even when light jumps 4 times brighter from 20 cm (625 lx) to 10 cm (2,500 lx), the leaf's food-making workers (enzymes) and carbon dioxide supply already reach top speed! Whatever runs out or hits max capacity first acts as a bottleneck—called a limiting factor.",
        E: "Picture a tiny bakery! Between 20 cm (625 lux) and 10 cm (2,500 lux), light energy becomes four times stronger—yet bubbles don't jump four times higher! Why? Because the chlorophyll 'solar panels' are already working at full blast! Now the overall speed is bottlenecked by other ingredients: how fast dissolved carbon dioxide reaches the cells and how quickly helper enzymes inside the leaf can assemble sugar. Scientists call that flattening plateau 'light saturation,' and the bottleneck item is the limiting factor!",
      },
      fil: {
        H: "Isipin mong parang kusina: kahit gawin mong apat na beses mas maliwanag ang ilaw sa kisame, bibilis din ba nang apat na beses ang luto kung limitado lang ang kamay ng tagaluto at sangkap?",
        C: "Kahit lumakas nang apat na beses ang liwanag mula 20 cm (625 lx) tungong 10 cm (2,500 lx), umaabot na sa pinakamabilis nilang kaya ang mga helper enzymes at suplay ng dissolved CO₂! Iyon ang bottleneck o tinatawag nating limiting factor.",
        E: "Parang panaderya lang iyan! Mula 20 cm (625 lux) papuntang 10 cm (2,500 lux), sobrang dami nang ilaw ang dumating, pero hindi na tumataas nang apat na beses ang bula. Puno na kasi ang kapasidad ng solar panels sa dahon, kaya nagkakaroon ng bottleneck sa dami ng dissolved CO₂ at bilis ng enzymes sa loob—iyan ang tinatawag nating light saturation at limiting factor!",
      },
      ceb: {
        H: "Hunahunaa ang usa ka kusina: bisan pag pil-on nimo og ka-upat kakusog ang suga, mopaspas ba og ka-upat ang pagluto kon limitado ra ang kamot sa kusinero ug ang sagol?",
        C: "Bisan og ni-upat ka pilo ang kahayag gikan 20 cm (625 lx) ngadto sa 10 cm (2,500 lx), puno na sa ilang kinapaspasan ang enzymes sa tanom ug ang suplay sa dissolved CO₂! Kana nga limitasyon mao ang gitawag nga limiting factor.",
        E: "Murag panaderya ra gyud! Gikan sa 20 cm (625 lux) padulong sa 10 cm (2,500 lux), sobra na kadaghan ang kahayag, apan dili mo-upat ka pilo ang bula. Ngano man? Kay abot na sa kinatumyan ang trabaho sa chlorophyll, busa ang suplay sa CO₂ ug ang katulinon sa enzymes na ang mahimong bottleneck—gitawag ni sa science nga light saturation!",
      },
    },
    I6: {
      title: "Why We Repeat 3 Trials & Use the Mean",
      en: {
        H: "If you measure a friend's basketball free throws, would you trust just 1 shot or average 3 rounds? Why might a living Hydrilla plant vary a little from minute to minute?",
        C: "Living plants aren't identical robots—one minute 40 bubbles pop off the stem, the next minute 43 pop off! Taking 3 trials and averaging them (T1 + T2 + T3, divided by 3) smooths out random blips so your graph shows the real pattern.",
        E: "Because Hydrilla is a living plant, tiny random things happen every minute—like a couple of bubbles sticking briefly to a leaf before floating up, giving 40 bubbles once and 43 the next time! If you only trusted 1 trial, you might get fooled by a lucky or slow minute. Running 3 repeated trials and finding the Mean—adding Trial 1 plus Trial 2 plus Trial 3 and dividing by 3—gives a fair, steady score you can trust on your graph!",
      },
      fil: {
        H: "Kung titignan mo ang score ng basketball player, sapat na ba ang 1 tira lang o mas mainam ang average ng 3 subok? Bakit nagbabago nang konti ang bula ng buhay na halaman bawat minuto?",
        C: "Hindi robot ang buhay na Hydrilla—minsan 40 bubbles sa isang minuto, minsan 43! Kaya kumukuha tayo ng 3 trials at kinukwenta ang Mean (T1 + T2 + T3, divided by 3) para mawala ang tsamba at makita ang totoong trend.",
        E: "Dahil buhay na halaman ang Hydrilla, natural lang na magbago nang konti ang labas ng bula—halimbawa, may ilang bulang dumidikit saglit sa dahon bago umakyat! Kaya kung 1 trial lang, pwedeng malinlang tayo ng konting swerte o bagal. Sa pagkuha ng 3 trials at pag-average gamit ang Mean—(T1 + T2 + T3) ÷ 3—mas tumpak at patas ang ipapakita ng ating graph!",
      },
      ceb: {
        H: "Kon mosukod ka og basketball free throws, mosalig ka ba sa 1 ka itsa ra o sa average sa 3 ka suway? Nganong maglahi-lahi man og gamay ang ihap sa bula sa buhing Hydrilla matag minuto?",
        C: "Dili robot ang buhing tanom—usahay 40 ka bula, sunod minuto 43! Mao nga maghimo ta og 3 ka trials ug kuhaon ang Mean (T1 + T2 + T3, divided by 3) aron makuha ang tinuod nga pattern sa imong graph.",
        E: "Tungod kay buhing tanom ang Hydrilla, normal ang gamay nga kalainan matag minuto—pananglitan naay bula nga mopilit una kadiyot sa dahon sa dili pa molutaw! Kon usa ra ka trial, basin matsansingan og taas o ubos ra kaayo. Pero kon 3 ka trials ug kuhaon ang Mean gamit ang (T1 + T2 + T3) ÷ 3, lig-on ug kasaligan ang atong resulta!",
      },
    },
    I7: {
      title: "Understanding Your Experimental Variables (Fair Test)",
      en: {
        H: "Suppose you moved the lamp farther AND made the water way colder at the same time—could you tell which one caused the bubbles to drop? Let's keep only ONE thing changing!",
        C: "Here's an easy way to remember all three variables: Independent = what YOU change (lamp distance); Dependent = what YOU count (bubbles per 60s); Controlled/Constant = everything kept the same (plant, 0.2% sodium bicarbonate water, 60 seconds, and temperature tracking) so the test stays fair!",
        E: "Let's break down the three variables super simply! First, the Independent Variable is the ONE knob you turn on purpose—how far the lamp is (10, 20, 30, 40 cm, or Dark). Second, the Dependent Variable is the outcome you measure—how many oxygen bubbles float up in 60 seconds, because it 'depends' on the light! Third, Controlled Variables are everything kept steady for a fair test: the exact same plant shoot, 0.2% sodium bicarbonate (which supplies steady carbon dioxide), and the 60-second timer. Keeping them fair lets us be 100% sure light caused the change!",
      },
      fil: {
        H: "Isipin mong binago mo na ang distansya ng lamp, tapos pinalamig mo pa ang tubig nang sabay—malalaman mo pa ba kung alin ang nagpababa ng bubbles?",
        C: "Madali lang tandaan ang tatlong variables: Independent Variable = ang BINABAGO mo (distansya ng lamp); Dependent Variable = ang SINUSUKAT mo (bilang ng oxygen bubbles); Constant Variables = ang HINDI PINAPALITAN (halaman, 0.2% NaHCO₃, 60 seconds, at kontroladong temperatura) para patas ang eksperimento!",
        E: "Hatiin natin nang simple ang tatlong variables! Una, Independent Variable ang iisang bagay na ikaw ang pumipili o nagbabago—dito, ang distansya ng lamp (10 hanggang 40 cm o Dark). Pangalawa, Dependent Variable ang resultang binibilang mo—ang oxygen bubbles sa 60 seconds, dahil nakadepende ito sa liwanag! Pangatlo, Constant Variables ang lahat ng pinanatiling pareho tulad ng halaman, 0.2% NaHCO₃ (pinagkukunan ng dissolved CO₂), at 60 seconds timer para maging patas at malinaw ang test.",
      },
      ceb: {
        H: "Hunahunaa kon imong gilayo ang suga UNYA gipabugnaw pa gyud nimo ang tubig sa parehong higayon—mahibal-an pa ba nimo kon asa anang duha ang nakapahinay sa bula?",
        C: "Sayon ra kaayo hinumdoman ang tulo ka variables: Independent = imong GIUSAB (gilay-on sa suga); Dependent = imong GISUKOD (ihap sa oxygen bubbles); Constant = GIPABILIN NGA PAREHO (tanom, 0.2% NaHCO₃, 60 seconds, ug kontroladong temperatura) aron patas ang eksperimento!",
        E: "Atong sabton sa pinakasayon nga paagi ang tulo ka variables! Una, Independent Variable ang usa ra ka butang nga imong tuyoon og usab—ang gilay-on sa suga (10, 20, 30, 40 cm, o Dark). Ikaduha, Dependent Variable ang resulta nga imong giihap—ang kadaghanon sa oxygen bubbles sulod sa 60 seconds. Ikatulo, Constant Variables ang tanang gipabilin nga pareho: ang parehong tanom, 0.2% NaHCO₃ (tinubdan sa CO₂), ug 60 seconds timer aron seguradong kahayag ra ang hinungdan sa kalainan!",
      },
    },
    I8: {
      title: "How Light Turns Into Plant Food (2 Stages)",
      en: {
        H: "Photosynthesis works like a two-room workshop inside the chloroplast! Stage 1 catches light to charge up tiny energy batteries—what happens in Stage 2 inside the surrounding fluid?",
        C: "Think of a chloroplast as a two-part kitchen! Stage 1 (in coin-shaped stacks called thylakoids) catches light, splits water to release oxygen bubbles, and charges up two tiny energy batteries (ATP and NADPH). Stage 2 (Calvin cycle in the surrounding fluid, the stroma) uses those charged batteries to snap carbon dioxide into glucose sugar!",
        E: "Here's the cleanest way to picture what happens inside every green chloroplast cell—it's a two-step workshop! Step 1 happens on stacked green solar discs called thylakoids: light hits chlorophyll, snaps water apart so oxygen bubbles float out, and charges two tiny energy batteries called ATP and NADPH. Step 2 happens in the watery workspace around them—the stroma—and scientists call it the Calvin cycle. There, helper enzymes take those charged batteries plus dissolved carbon dioxide from the water and build real glucose sugar!",
      },
      fil: {
        H: "Parang dalawang kwartong pagawaan ang loob ng chloroplast! Sa Unang Kwarto, nangunguha ng liwanag para mag-charge ng energy batteries—ano naman ang ginagawa sa Pangalawang Kwarto?",
        C: "Isipin mong two-part kitchen ang chloroplast! Sa Stage 1 (sa thylakoids), hinahati ng liwanag ang tubig para lumabas ang oxygen bubbles at mag-charge ng maliliit na energy batteries (ATP at NADPH). Sa Stage 2 (Calvin cycle sa fluid na tinatawag na stroma), ginagamit ang mga batteries na iyon para buuin ang CO₂ tungong glucose sugar!",
        E: "Ganito ang pinakasimpleng kwento ng dalawang yugto sa loob ng chloroplast! Una, sa mga patong-patong na berdeng disc na thylakoids: sinasagap ang ilaw para hatiin ang tubig (kaya may oxygen bubbles!) at mag-charge ng dalawang energy power banks na ATP at NADPH. Pangalawa, sa likidong tinatawag na stroma: ginagamit ng Calvin cycle ang enerhiya ng ATP at NADPH para pagsama-samahin ang carbon dioxide at makabuo ng glucose na pagkain ng halaman!",
      },
      ceb: {
        H: "Murag duha ka kwarto nga factory ang sulod sa chloroplast! Sa Unang Kwarto, nag-charge og gagmayng energy batteries gamit ang kahayag—unsa may buhaton sa Ikaduhang Kwarto?",
        C: "Murag duha ka bahin nga kusina ang chloroplast! Sa Stage 1 (sulod sa thylakoids), gamiton ang kahayag aron pikason ang tubig (ug mogawas ang oxygen bubbles!) samtang mag-charge og energy batteries nga ATP ug NADPH. Sa Stage 2 (Calvin cycle sa likidong stroma), gamiton kadtong batteries ug CO₂ aron makahimo og asukar nga glucose!",
        E: "Ingon ani kasayon sabton ang duha ka lakang sulod sa chloroplast! Una, sa green solar stacks nga thylakoids: kuhaon sa chlorophyll ang kahayag, pikason ang tubig aron mogawas ang oxygen bubbles, ug mag-charge og gagmayng baterya nga ATP ug NADPH. Ikaduha, sa likido palibot niini nga gitawag og stroma: gamiton sa Calvin cycle kadtong baterya ug carbon dioxide gikan sa tubig aron makaluto og tinuod nga glucose sugar!",
      },
    },
    I9: {
      title: "Why Photosynthesis Keeps Earth Alive",
      en: {
        H: "Look outside our little beaker for a moment: what two gifts do plants produce during photosynthesis that fish, humans, and whole ecosystems depend on every single second?",
        C: "Every oxygen bubble you counted in the beaker is part of how plants keep water and air breathable—and the glucose sugar they build becomes the foundation of nearly every food chain on Earth!",
        E: "Each tiny oxygen bubble rising from Hydrilla tells a giant story! Photosynthesis hands almost every living creature on Earth two essential gifts: first, fresh oxygen gas dissolved into rivers for fish and released into the sky for humans and animals to breathe; second, stored chemical food energy (glucose) inside leaves, stems, and fruits that feeds plant-eaters, predators, and entire food webs!",
      },
      fil: {
        H: "Isipin ang labas ng beaker sandali: anong dalawang regalong ibinibigay ng mga halaman mula sa photosynthesis na kailangan ng mga isda, tao, at buong kalikasan?",
        C: "Bawat oxygen bubble na nabilang mo ang nagbibigay ng hininga sa tubig at hangin—at ang glucose na binubuo ng halaman ang pinakapundasyon ng pagkain sa halos lahat ng food webs sa mundo!",
        E: "Ang bawat munting oxygen bubble mula sa Hydrilla ay may napakalaking papel sa buhay! Nagbibigay ang photosynthesis ng dalawang pangunahing biyaya sa buong mundo: una, oxygen na kailangan ng mga isda sa tubig at ng mga tao at hayop sa paghinga; pangalawa, pagkaing glucose na nagiging enerhiya ng lahat ng halaman at hayop sa buong food chain!",
      },
      ceb: {
        H: "Hunahunaa ang kalibutan gawas sa beaker: unsang duha ka kinahanglanon nga gas ug pagkaon ang gihatag sa tanom gikan sa photosynthesis nga gisaligan sa isda, hayop, ug katawhan?",
        C: "Matag oxygen bubble nga imong naihap mao ang naghatag og ginhawa sa tubig ug kahanginan—ug ang glucose nga nahimo sa tanom mao ang sinugdanan sa enerhiya sa halos tanang food chain sa kalibutan!",
        E: "Ang matag gamayng bula gikan sa Hydrilla usa ka dakong regalo sa kinaiyahan! Duha ka kinahanglanon kaayo ang gihatag sa photosynthesis sa kalibutan: una, preskong oxygen nga gihanggab sa mga isda sa tubig ug sa katawhan sa yuta; ikaduha, pagkaon nga glucose nga mosulod sa dahon ug bunga aron pakan-on ang tibuok food web sa ecosystem!",
      },
    },
  };

  // Deep Plain-Language Concept & Variable Tutor Bank (covers specific student pain points!)
  const CONCEPT_TUTOR_TOPICS = {
    variables_all: {
      ideaCode: "I7",
      en: {
        summary: "Let's make experimental variables super easy! Think of running an experiment like testing which shoe makes you run fastest. First, the Independent Variable is the ONE thing YOU change on purpose—in our lab, that's the lamp distance (10 cm, 20 cm, 30 cm, 40 cm, or Dark/Night). Second, the Dependent Variable is what you watch and measure because it depends on what you changed—here, that's how many oxygen bubbles come out in 60 seconds! Third, Constant (Controlled) Variables are everything you lock identical so the test is fair: the exact same Hydrilla shoot, 0.2% baking soda solution (NaHCO₃) for steady carbon dioxide, the 60-second timer, and controlled baseline temperature. Want me to explain any one of those three even more simply?",
        analogy: "Here's an easy everyday picture for variables: imagine baking cookies! If you want to test whether oven temperature changes crunchiness, the Independent Variable is the temperature knob YOU turn; the Dependent Variable is how crunchy the cookie turns out; and Controlled Variables are keeping the exact same dough recipe, tray, and baking time so nothing else tricks your result!"
      },
      fil: {
        summary: "Gawin nating sobrang dali ang tatlong variables! Una, Independent Variable ang iisang bagay na IKAW ang sadyang nagbabago—sa lab natin, iyan ang distansya ng lamp (10 hanggang 40 cm, o Dark/Night). Pangalawa, Dependent Variable ang binabantayan at binibilang mo bilang resulta—ang dami ng oxygen bubbles sa 60 seconds! Pangatlo, Constant o Controlled Variables ang lahat ng pare-pareho para maging fair test: parehong halaman, 0.2% NaHCO₃ na tubig para sa CO₂, 60 seconds timer, at kontroladong baseline na temperatura.",
        analogy: "Isipin mong nagtitimpla ka ng kape! Kung gusto mong i-test kung nakakatamis ang dami ng asukal: Independent Variable ang kutsara ng asukal na binabago mo; Dependent Variable ang lasa; at Constant Variables ang parehong baso, tubig, at kape para patas ang test!"
      },
      ceb: {
        summary: "Atong himuong sayon kaayo sabton ang mga variables! Una, Independent Variable ang usa ra ka butang nga IKAW ang mag-ilis-ilis—diri sa lab, kana ang gilay-on sa suga (10 hangtod 40 cm, o Dark/Night). Ikaduha, Dependent Variable ang imong sukdon o ihapon isip resulta—ang oxygen bubbles sulod sa 60 seconds! Ikatulo, Constant o Controlled Variables ang tanang pareho aron patas: parehong tanom, 0.2% NaHCO₃ para sa CO₂, 60 seconds timer, ug kontroladong temperatura.",
        analogy: "Murag magtimpla ka og juice! Kon i-test nimo ang katam-is depende sa kutsara sa asukar: ang gidaghanon sa asukar nga imong giusab mao ang Independent Variable; ang lasa mao ang Dependent Variable; ug ang parehong tubig ug baso mao ang Constant Variables!"
      }
    },
    independent_variable: {
      ideaCode: "I7",
      en: {
        summary: "The Independent Variable starts with 'I'—think 'I change this!' It's the single condition you purposely adjust in an experiment to see what happens. In our photosynthesis simulation, YOUR Independent Variable is the Light Condition—sliding the lamp to 10 cm, 20 cm, 30 cm, 40 cm, or shutting it off in Dark/Night mode!",
        analogy: "Think of it like adjusting the volume knob on a speaker—you turn the knob (Independent Variable) to see how loud the music gets!"
      }
    },
    dependent_variable: {
      ideaCode: "I2",
      en: {
        summary: "The Dependent Variable is the 'Data' you collect—it DEPENDS on the change you just made! In this Hydrilla experiment, your Dependent Variable is the number of oxygen bubbles released in 60 seconds (your photosynthesis rate). When light gets stronger, that bubble count climbs; when light dims, it drops!",
        analogy: "If Independent is turning the gas pedal in a car, Dependent is watching the speedometer needle react!"
      }
    },
    constant_variable: {
      ideaCode: "I7",
      en: {
        summary: "Controlled—or Constant—Variables are all the conditions we keep steady so nothing else sneaks in and messes up our data! Here we keep the same aquatic plant shoot, the same 0.2% sodium bicarbonate (NaHCO₃) solution supplying carbon dioxide, a stabilized 26.0 °C baseline water bath (with heat tracking), and the exact 60-second counting clock. Why? Because if you changed plant species AND light at once, you wouldn't know which one caused the bubbles to change!",
        analogy: "It's like two runners racing—both start at the exact same line with the same 60-second stopwatch so the race stays 100% fair!"
      }
    },
    nahco3_co2: {
      ideaCode: "I7",
      en: {
        summary: "Great question! Plants need carbon dioxide gas (CO₂) as a raw building block to make glucose sugar—just like you need flour to bake bread! Since Hydrilla lives completely underwater, it can't grab CO₂ from the air. So we mix a small 0.2% pinch of sodium bicarbonate—everyday baking soda!—into the water bath. That dissolves gently to give the plant a steady, unlimited supply of dissolved CO₂ all throughout your trials so CO₂ doesn't run out halfway.",
        analogy: "Think of 0.2% sodium bicarbonate like an underwater pantry stocked with plenty of flour (carbon dioxide), so whenever the plant gets light, it always has ingredients ready to bake sugar!"
      },
      fil: {
        summary: "Magandang tanong! Kailangan ng halaman ng carbon dioxide (CO₂) para makabuo ng pagkaing glucose. Dahil nakalubog sa tubig ang Hydrilla, hindi ito nakakahigop ng CO₂ mula sa hangin—kaya naghahalo tayo ng 0.2% sodium bicarbonate (baking soda!) sa tubig. Nagbibigay ito ng tuloy-tuloy na dissolved CO₂ para hindi maubusan ang halaman habang nag-eeksperimento!",
        analogy: "Parang laging punong pantry ng harina ang 0.2% NaHCO₃ sa ilalim ng tubig—laging handa ang CO₂ na sangkap basta may sikat ng ilaw!"
      },
      ceb: {
        summary: "Maayong pangutana! Kinahanglan sa tanom ang carbon dioxide (CO₂) isip sangkap sa paghimo og pagkaon. Tungod kay nakalubog man ang Hydrilla, dili ni makakuha og CO₂ sa hangin—maong gibutangan nato ang tubig og 0.2% sodium bicarbonate (baking soda!). Kini naghatag og steady nga dissolved CO₂ sulod sa tubig aron dili mahutdan ang tanom samtang mag-ihap ta og bula!",
        analogy: "Murag puno nga kusina sa harina ang 0.2% NaHCO₃—naay kanunay nga suplay sa CO₂ kon moigo na ang kahayag!"
      }
    },
    temperature_enzymes: {
      ideaCode: "I7",
      en: {
        summary: "Awesome observation about temperature! Inside every leaf, tiny helper proteins called enzymes—like RuBisCO—are the workers assembling carbon dioxide into sugar. Here's the trick: those workers are super sensitive to temperature! At Night in our simulation, the lamp turns OFF and the water cools to ~18.5 °C—cold water makes those helper enzymes sluggish and slow, PLUS 0 light means 0 oxygen bubbles! During Day mode, gentle warmth from the lamp (~26.0–28.6 °C inside the 0.2% NaHCO₃ bath) keeps enzymes active and energetic, while the thermometer & water bath prevent overheating so light intensity stays the true star variable.",
        analogy: "Imagine your fingers trying to button a shirt in freezing cold water versus comfortable warm room temperature—helper enzymes work smoothly in mild warmth (~26–28 °C) and slow way down in chilly Night water (~18.5 °C)!"
      },
      fil: {
        summary: "Magandang tanong tungkol sa temperatura! Sa loob ng dahon, may maliliit na helper workers na tinatawag na enzymes (tulad ng RuBisCO) na bumubuo ng glucose. Kapag malamig ang tubig sa Night mode (~18.5 °C) at patay ang lamp, bumabagal ang galaw ng mga enzymes na ito kaya zero bubbles din. Sa Day mode, tinutulungan ng banayad na init ng lamp (~26.0–28.6 °C sa 0.2% NaHCO₃) na manatiling aktibo ang enzymes habang binabantayan ng thermometer para hindi sumobra ang init!",
        analogy: "Parang kamay na giniginaw sa yelo vs kamay sa katamtamang init—mas mabilis gumalaw ang helper enzymes sa banayad na init kaysa sa malamig na tubig!"
      },
      ceb: {
        summary: "Nindot nga pangutana bahin sa temperatura! Sulod sa dahon, naay gagmayng helper workers nga gitawag og enzymes (sama sa RuBisCO) nga naghimo og glucose. Sa bugnaw nga gabii (~18.5 °C, palong ang lamp), mohinay ni sila ug walay bula nga mahimo. Sa adlaw, ang banayad nga init gikan sa lamp (~26.0–28.6 °C sulod sa 0.2% NaHCO₃) makapabaskog sa ilang trabaho samtang gibantayan sa thermometer aron patas gihapon ang eksperimento!",
        analogy: "Murag tudlo nga nikurog sa katugnaw kumpara sa komportableng kainit—mas abtik motrabaho ang enzymes sa 26–28 °C kaysa bugnaw nga 18.5 °C!"
      }
    },
    chloroplast_parts: {
      ideaCode: "I8",
      en: {
        summary: "Let's make the inside of a chloroplast cell super simple—think of it as a two-part solar bakery! Part 1 happens inside green coin stacks called thylakoids: chlorophyll grabs light energy to snap water (H₂O) apart, letting oxygen bubbles escape while charging up two tiny biological batteries named ATP and NADPH. Part 2 happens in the clear surrounding liquid called the stroma (this stage is the Calvin cycle): helper enzymes take those charged ATP and NADPH batteries and combine them with carbon dioxide from the water to bake glucose sugar! Two stages, one connected assembly line.",
        analogy: "Stage 1 (Thylakoids) = Solar panels on the roof charging power banks (ATP & NADPH) and letting spare oxygen vent out. Stage 2 (Calvin cycle in Stroma) = Bakers inside using those charged power banks plus CO₂ flour to make glucose!"
      }
    },
    chlorophyll_green: {
      ideaCode: "I8",
      en: {
        summary: "Sunlight actually carries all the colors of the rainbow mixed together! Inside plant leaves, green chlorophyll a and chlorophyll b pigments are picky light-eaters: they eagerly drink in blue-violet and red light energy to power photosynthesis, while bouncing green light straight off back to your eyes—that's why healthy leaves look green! That also explains why white patches on variegated leaves can't make oxygen or food: they have no chlorophyll solar panels to catch those red and blue rays.",
        analogy: "Think of a red basketball jersey—it absorbs other colors and bounces red back to your eyes! Chlorophyll drinks red and blue energy for work and lets green bounce off."
      }
    },
    inverse_square_lux: {
      ideaCode: "I3",
      en: {
        summary: "Ever wonder why 20 cm gets 625 lux instead of half of 2,500 lux? It's because light doesn't just spread side-to-side when you back a lamp away—it spreads side-to-side AND up-and-down in two dimensions! So when you double the distance from 10 cm to 20 cm, the beam covers 2 × 2 = 4 times more space. Dividing 2,500 lux by 4 gives 625 lux! Triple the distance to 30 cm, and it spreads over 3 × 3 = 9 times more area (~278 lux); four times farther at 40 cm gives 1/16th brightness (~156 lux)!",
        analogy: "Imagine stretching a square piece of stretchy dough twice as wide AND twice as tall—its thickness becomes 1/4 as thick, not 1/2! Light energy thins out the exact same way."
      }
    },
    limiting_factor_plateau: {
      ideaCode: "I5",
      en: {
        summary: "Look at your graph between 20 cm and 10 cm—even though 10 cm is four times brighter (2,500 lux vs 625 lux), bubbles don't jump four times higher (~42 instead of 120)! Why? Think about a cashier line at a store: you can send 4× more shoppers through the door, but if there's only 1 cashier scanning items, checkout speed levels off! Inside Hydrilla at 10 cm, light is already overflowing—so the leaf's carbon dioxide supply (CO₂) and Calvin-cycle enzyme speed (RuBisCO) become the bottleneck, called the limiting factor. Scientists name this flat top 'light saturation.'",
        analogy: "You can plug a toaster into a power plant, but it still only toasts two slices at a time—at 10 cm, the plant's sugar-making machinery is simply running at full speed!"
      }
    },
    dark_night_respiration: {
      ideaCode: "I4",
      en: {
        summary: "Great question—plants don't actually 'sleep' or turn off living at night! Just like animals and humans, plants stay alive 24 hours a day through cellular respiration inside tiny cell powerhouses called mitochondria, which gently use a little oxygen to turn sugar into cell energy. During the Day (Lamp ON), chloroplasts make SO much fresh oxygen that extra O₂ streams out as bubbles. At Night (Lamp OFF, cold ~18.5 °C), photosynthesis stops completely—so 0 oxygen bubbles come out, while cooler mitochondria slowly sip dissolved oxygen in the water!",
        analogy: "Think of photosynthesis like a daytime solar charger pouring extra electricity into the grid, while cellular respiration is the tiny nightlight that stays quietly running 24/7!"
      }
    },
    equation_walkthrough: {
      ideaCode: "I2",
      en: {
        summary: "Let's read the photosynthesis formula without any scary symbols! On the left are the two raw ingredients: Carbon Dioxide (from 0.2% NaHCO₃ in the water) plus Water, powered by Light Energy inside green Chlorophyll. On the right are the two finished goods: Glucose Sugar (plant food!) plus Oxygen Gas—those rising bubbles you count! Put together: Water + Carbon Dioxide + Light inside Chlorophyll makes Glucose + Oxygen.",
        analogy: "Ingredients in the bowl (Water + CO₂) + Stove heat (Light in Chlorophyll) = Fresh baked bread (Glucose) + Steam rising out (Oxygen bubbles)!"
      }
    },
    plant_comparison: {
      ideaCode: "I2",
      en: {
        summary: "Such a cool comparison! Both Hydrilla and Elodea spend their entire lives completely submerged underwater—so when their leaves make oxygen, that gas gets squeezed out underwater from cut stems and leaves as bubbles you can easily count! Water Hyacinth is different: it has swollen air-filled petioles that float it RIGHT on top of the water, holding glossy leaves out in the open air. Because its photosynthetic leaves sit in the air, almost all of its oxygen drifts straight into the sky through microscopic leaf pores called stomata instead of making underwater bubbles!",
        analogy: "Hydrilla and Elodea exhale underwater like scuba divers making bubbles, while floating Water Hyacinth breathes straight into the open air above the pool!"
      }
    },
    ecosystem_value: {
      ideaCode: "I9",
      en: {
        summary: "Every bubble you count shows photosynthesis keeping our planet alive in two huge ways! First, it makes glucose sugar—the stored food energy inside leaves, stems, fruits, and roots that starts almost every food chain on Earth (from pond snails and insects all the way to us!). Second, it continuously refills oxygen in rivers for fish AND in the sky for people and animals to breathe while absorbing carbon dioxide.",
        analogy: "Without photosynthetic plants, Earth would lose both its global grocery store (glucose food) and its oxygen tank at the exact same time!"
      }
    }
  };

  // Super-simple ELIF analogy stories when student says "simpler / I don't understand / analogy"
  const SIMPLER_ANALOGY_BANK = {
    I1: "Let's make it super simple! Imagine a solar-powered fan: shine a bright lamp on its panel, and the fan spins right away; turn the lamp off, and it stops. Chlorophyll inside a green leaf works just like that solar panel—it needs light energy to wake up and split water into oxygen bubbles!",
    I2: "Super simple version: imagine a tiny soda bottle fizzing only when you shine a light on it! Each bubble popping out of the cut Hydrilla stem is pure oxygen gas left over when the leaf makes food—so counting more bubbles in 60 seconds just means the leaf is making food faster!",
    I3: "Imagine standing close to a campfire versus walking ten steps away—the closer you stand, the stronger the warmth hits you! Similarly, at 10 cm the plant gets slammed with bright light (2,500 lux), while at 40 cm the beam spreads way out and gets weak (156 lux), so photosynthesis slows down.",
    I4: "Super simple: the Dark Control is our 'light-off test.' By leaving the plant in the exact same water and temperature with zero light, seeing bubbles drop to 0 proves those bubbles weren't random fizz—light truly caused them!",
    I5: "Imagine pouring water into a bottle through a narrow funnel: pouring 4× faster doesn't make the bottle fill 4× faster if the funnel neck can only let a trickle through! At 10 cm, light is super strong, so CO₂ supply and leaf helper enzymes become that narrow funnel neck!",
    I6: "Think of flipping a coin or shooting 3 basketball free throws! One try can be unusually high or low by chance—taking 3 tries and finding the middle average (Mean) gives a fair score you can rely on.",
    I7: "Easy 3-word trick for variables: YOU change Independent (lamp distance); YOU count Dependent (bubbles); YOU freeze Constant variables (same plant, baking soda water, time, and temp control) so nobody can blame anything else for your results!",
    I8: "Two easy steps inside a leaf cell: Step 1 (Thylakoids) uses sunlight + water to release oxygen bubbles and charge up tiny battery packs. Step 2 (Calvin cycle in Stroma) uses those battery packs + carbon dioxide to build sweet glucose sugar!",
    I9: "Every plant is like nature's free bakery and oxygen pump combined: it creates glucose (food energy for animals and humans) and pumps out fresh oxygen for fish in water and us on land!"
  };

  // Built-in factual knowledge base for instant general Q&A (always available offline)
  const GENERAL_KNOWLEDGE_MINI_KB = {
    "pro bono": "Pro bono comes from the Latin phrase 'pro bono publico,' meaning 'for the public good.' In everyday life, it describes skilled work—like a lawyer helping someone in court or a doctor volunteering at a free clinic—done completely free of charge to help people in need!",
    "pro bono publico": "Pro bono publico is Latin for 'for the public good'—meaning professional services donated voluntarily for free to help the community.",
    "quid pro quo": "Quid pro quo is a Latin expression meaning 'something for something'—basically a fair trade or favor exchanged for another favor!",
    "status quo": "Status quo is a Latin term meaning 'the way things currently are right now'—keeping existing rules or habits unchanged.",
    "carpe diem": "Carpe diem means 'seize the day' in Latin—a friendly reminder to make the most of today!",
    "empathy": "Empathy means stepping into someone else's shoes—truly understanding and feeling what another person is experiencing.",
    "osmosis": "Osmosis is just water molecules naturally moving from a watery area (lots of free water, less salt/sugar) across a cell membrane into a saltier or more crowded area until balanced!",
    "diffusion": "Diffusion is molecules naturally spreading out on their own from a crowded spot into an open spot—just like perfume scent drifting across a whole room!",
    "mitosis": "Mitosis is how one regular body cell copies its DNA and splits cleanly into two identical daughter cells so you can grow or heal a cut!",
    "homeostasis": "Homeostasis is your body's built-in autopilot keeping internal conditions steady—like sweating when you're hot or shivering when you're cold to keep your body near 37 °C!",
    "gravity": "Gravity is the invisible pulling force between objects with mass—Earth's huge mass keeps our feet on the ground and keeps the Moon orbiting safely above us.",
    "dna": "DNA is like a cell's master instruction book written in chemical letters—it holds the recipe for how every living thing grows, looks, and functions.",
    "rna": "RNA is the helpful messenger molecule that copies instructions out of DNA so your cell's factories know which proteins to build!",
    "inflation": "Inflation is when everyday prices for food, fares, and goods gradually go up over time, meaning the same 100 pesos buys slightly less than before.",
    "artificial intelligence": "Artificial intelligence—or AI—is computer software trained to understand human questions, spot patterns, reason through problems, and converse naturally like a helpful partner!",
    "ai": "AI (Artificial Intelligence) is technology that lets computers understand language, analyze data patterns, and assist humans intelligently in real time.",
  };

  function buildFullSimulationSnapshot() {
    const activeTbl = getActiveSimTable();
    const recordedConditions = {};
    LIGHT_CONDITIONS.forEach((c) => {
      const trials = activeTbl[c.key] || [null, null, null];
      recordedConditions[c.key] = {
        label: c.label,
        lux: state.isNightTime ? 0 : c.lux,
        trials: trials.slice(),
        mean: computeMean(trials),
      };
    });

    const physicalConditions = {};
    LIGHT_CONDITIONS.forEach((c) => {
      const entry = (state.physicalTable && state.physicalTable[c.key]) || { trials: [null, null, null], temp: "26.0" };
      physicalConditions[c.key] = {
        trials: (entry.trials || [null, null, null]).slice(),
        mean: computeMean(entry.trials),
        tempC: entry.temp || "26.0",
      };
    });

    const stepObj = ACTIVITY_STEPS[state.currentStepIndex] || ACTIVITY_STEPS[0];
    const currentCond = LIGHT_CONDITIONS.find((c) => c.key === state.selectedDistance) || LIGHT_CONDITIONS[0];

    return {
      participantCode: state.participantCode || "Student",
      selectedPlant: state.selectedPlant,
      selectedDistance: state.selectedDistance,
      currentLux: state.isNightTime ? 0 : currentCond.lux,
      dayNightMode: state.isNightTime ? "Night (Lamp OFF · Cold)" : "Day (Lamp ON · Warm)",
      isNightTime: state.isNightTime,
      liveWaterTemp: Number((state.liveWaterTemp || 26.0).toFixed(1)),
      chemicalBuffer: "0.2% NaHCO3 (Baking Soda / Dissolved CO2 Source)",
      tableMode: state.tableMode,
      recordedConditions,
      physicalConditions,
      currentStep: stepObj.partTitle,
      supportPoint: stepObj.spCode,
      studentStepNotes: (state.stepNotes && state.stepNotes[state.currentStepIndex]) || "",
    };
  }

  function hasBiologyOrLabKeywords(q) {
    return /\b(photosynth|chloroplast|chlorophyll|thylakoid|granum|grana|stroma|calvin|rubisco|photolysis|atp|nadph|glucose|sugar|oxygen|o2|co2|carbon dioxide|h2o|water|light|photon|wavelength|lamp|bulb|lux|dark|night|day|cold|warm|temp|temperature|enzyme|nahco3|bicarbonate|baking soda|buffer|bubble|bubbles|bula|hydrilla|elodea|hyacinth|eichhornia|plant|leaf|leaves|stomata|mitochondria|respiration|limiting|saturat|level off|plateau|trial|mean|average|table|graph|setup|apparatus|variable|independent|dependent|constant|controlled|fair test|control|distance|cm|beaker|thermometer|timer|60 second|ecosystem|food web|food chain|variegated|starch|iodine|cellular|microscopic|experiment|lab|equation|formula|formula|reaction|biovoice|kahayag|liwanag|tubig|init|ngitngit|dilim|tanom|dahon|duol|layo|malapit|malayo|naglutaw|lutang|predict|hypothes|conclu|inverse|square)\b/i.test(
      q
    );
  }

  function detectVariableOrConceptTopic(low) {
    // Specific variable questions
    if (/\b(independent variable|manipulated variable)\b/i.test(low)) return "independent_variable";
    if (/\b(dependent variable|responding variable)\b/i.test(low)) return "dependent_variable";
    if (/\b(constant variable|controlled variable|control variable|variables.*constant|keep.*same|fair test)\b/i.test(low)) {
      return "constant_variable";
    }
    if (/\b(variables|variable|what.*change.*measure|explain.*variable)\b/i.test(low)) return "variables_all";
    if (/\b(nahco3|sodium bicarbonate|baking soda|bicarbonate|dissolved co2|co2 source|carbon dioxide source|why.*co2|need.*co2)\b/i.test(low)) {
      return "nahco3_co2";
    }
    if (/\b(temperature|temp|warm|cold|cool|heat|heat waves|thermometer|enzyme|enzymes|26|18\.5|28)\b/i.test(low)) {
      return "temperature_enzymes";
    }
    if (/\b(thylakoid|stroma|atp|nadph|calvin|rubisco|photolysis|two stages|light[- ]dependent|light[- ]independent|inside.*chloroplast|chloroplast.*work)\b/i.test(low)) {
      return "chloroplast_parts";
    }
    if (/\b(green|wavelength|absorb|reflect|chlorophyll|pigment|variegated|white edge|white patch)\b/i.test(low)) {
      return "chlorophyll_green";
    }
    if (/\b(inverse[- ]square|625|278|156|2,?500|lux|why.*quarter|half.*distance|illuminance)\b/i.test(low)) {
      return "inverse_square_lux";
    }
    if (/\b(level off|plateau|limiting|saturat|bottleneck|why.*not.*quadruple|stop increasing|10 cm and 20 cm|10 cm vs 20 cm)\b/i.test(low)) {
      return "limiting_factor_plateau";
    }
    if (/\b(mitochondria|respiration|breathe|night|dark control|0 lx|lamp off|night time|24[- ]hour)\b/i.test(low)) {
      return "dark_night_respiration";
    }
    if (/\b(equation|formula|6\s*co2|reactant|product|raw material|inputs? and outputs?)\b/i.test(low)) {
      return "equation_walkthrough";
    }
    if (/\b(hyacinth|water hyacinth|eichhornia|floating|elodea|compare plant|three plants|species)\b/i.test(low)) {
      return "plant_comparison";
    }
    if (/\b(ecosystem|food web|food chain|important|humans?|animals?|fish|value of photosynthesis)\b/i.test(low)) {
      return "ecosystem_value";
    }
    return null;
  }

  function classifyQuestionAndConversationalIntent(rawQuestion) {
    const q = String(rawQuestion || "").trim();
    const low = q.toLowerCase();

    // 1. Strict Assessment Guardrail: refuse direct quiz/test answer keys
    if (
      /\b(test answer|quiz answer|form a|form b|pretest|posttest|what is the letter|correct letter|choose a b c d|answer key|sagot sa test|tubag sa test)\b/i.test(
        low
      )
    ) {
      return { intent: "test_refusal", ideaCode: state.conversationMemory.lastIdeaCode || "I1", topicKey: null };
    }

    // 2. Answering an active BioVoice practice quiz
    if (state.conversationMemory.pendingQuiz && !/^(skip|stop|cancel|hint|new topic)/i.test(low)) {
      return {
        intent: "quiz_grade",
        ideaCode: state.conversationMemory.pendingQuiz.ideaCode || "I1",
        topicKey: state.conversationMemory.lastTopicKey,
      };
    }

    // 3. Student asks BioVoice to check/review their draft or hypothesis
    if (
      /\b(check my|is my answer|am i right|review my|is my prediction|check if|tama ba|sakto ba|is this right|what do you think of my)\b/i.test(
        low
      )
    ) {
      return { intent: "check_my_work", ideaCode: state.conversationMemory.lastIdeaCode || "I1", topicKey: null };
    }

    // 4. Student asks for a practice quiz question
    if (/\b(quiz me|test me|ask me a question|practice question|tanungin mo ako|pangutan-a ko)\b/i.test(low)) {
      return { intent: "quiz_request", ideaCode: state.conversationMemory.lastIdeaCode || "I1", topicKey: null };
    }

    // 5. Simplification / Analogy / Beginner Follow-up ("make it simpler", "I don't understand", "give me an analogy")
    const asksSimplerOrFollowUp =
      /\b(simpler|simplify|simple words|easier to understand|easy words|hard to understand|confusing|don't get it|dont get it|don't understand|dont understand|didn't get|analogy|example|like i'm|beginner|layman|tagalog|bisaya|cebuano|in simpler|break it down|elaborate|tell me more|explain more)\b/i.test(
        low
      ) ||
      (low.split(/\s+/).length <= 5 &&
        /^(?:why|why is that|why does that happen|how come|again|what do you mean|ngano man|ngano diay|unsa pasabot|bakit ganun|bakit po|paano yun|mas simple|more detail)[?!.\s]*$/i.test(
          low
        ));
    if (asksSimplerOrFollowUp && state.conversationMemory.turnCount > 0 && !detectVariableOrConceptTopic(low)) {
      return {
        intent: "simplify_follow_up",
        ideaCode: state.conversationMemory.lastIdeaCode || "I1",
        topicKey: state.conversationMemory.lastTopicKey || null,
      };
    }

    // 6. Math calculations ("what is (30+32+31)/3", "average of 40, 42, 41", etc.)
    if (
      /\b(calculate|compute|what is|average of|mean of|plus|minus|times|divided by)\b/i.test(low) &&
      /[0-9]+\s*(?:\+|\-|\*|\/|÷|x|\,|plus|minus|divided|times)/i.test(low) &&
      !/\b(trial|bubble|cm|lux|dark)\b/i.test(low)
    ) {
      return { intent: "math_eval", ideaCode: state.conversationMemory.lastIdeaCode || "I6", topicKey: null };
    }

    // 7. Live Simulation Data & Quantitative Result Queries ("why is my mean in trial 1 30 bubble count", "compare my 10 cm and 40 cm")
    const hasMetricNumber = /\b\d+(?:\.\d+)?\b/.test(low);
    const asksOwnData =
      /\b(my|our|i got|we got|did i|trial\s*[123]|in trial|bubble count|why is my|mean is|mean in|explain my|my table|my graph|my data|compare my|my results|my trend|current temp|water temp right now)\b/i.test(
        low
      ) ||
      (hasMetricNumber && /\b(bubble|bubbles|mean|average|trial|count|rate|temp|celsius)\b/i.test(low) && !/\bwhy does 10 cm\b/i.test(low));
    if (asksOwnData) {
      return { intent: "sim_data_query", ideaCode: "I6", topicKey: "sim_data_query" };
    }

    // 8. Friendly Smalltalk / Greetings / Acknowledgements
    if (
      /^(hi|hello|hey|yo|good morning|good afternoon|good evening|kumusta|kamusta|thank you|thanks|ty|salamat|ok|okay|got it|cool|awesome|who are you|what is your name|how are you|hello biovoice|hi biovoice|hey nova)[!.?,\s]*$/i.test(
        low
      )
    ) {
      return { intent: "conversational_smalltalk", ideaCode: state.conversationMemory.lastIdeaCode || "I1", topicKey: null };
    }

    // 9. Explicit plain-language Concept & Variable deep-dive matching
    const matchedTopic = detectVariableOrConceptTopic(low);
    if (matchedTopic) {
      const topicObj = CONCEPT_TUTOR_TOPICS[matchedTopic];
      return {
        intent: "concept_tutor",
        topicKey: matchedTopic,
        ideaCode: (topicObj && topicObj.ideaCode) || "I1",
      };
    }

    // 10. General/Off-Topic Query OR unfamiliar biology lookup
    if (!hasBiologyOrLabKeywords(low)) {
      return {
        intent: "general_knowledge_redirect",
        ideaCode: state.conversationMemory.lastIdeaCode || "I1",
        topicKey: null,
      };
    }

    // 11. Core Idea Mapping I1–I9
    if (/\b(dark|night|ngitngit|dilim|0 lx|lamp off|palong|patay ang ilaw|control setup)\b/i.test(low)) {
      return { intent: "concept", ideaCode: "I4", topicKey: "dark_night_respiration" };
    }
    if (/\b(level off|plateau|saturat|limiting|double|stop increasing|limit)\b/i.test(low)) {
      return { intent: "concept", ideaCode: "I5", topicKey: "limiting_factor_plateau" };
    }
    if (/\b(trial|3 trials|three trials|mean|average|vary|variation|magkaiba|lahi-lahi)\b/i.test(low)) {
      return { intent: "concept", ideaCode: "I6", topicKey: null };
    }
    if (/\b(constant|fair test|temperature|temp|cold|warm|26|thermometer|heat|nahco3|bicarbonate|buffer|enzyme|init)\b/i.test(low)) {
      return { intent: "concept", ideaCode: "I7", topicKey: "variables_all" };
    }
    if (/\b(calvin|stroma|atp|nadph|glucose|sugar|chemical energy|thylakoid)\b/i.test(low)) {
      return { intent: "concept", ideaCode: "I8", topicKey: "chloroplast_parts" };
    }
    if (/\b(ecosystem|food web|food chain|environment|important|value|organisme|halaga|hinungdanon)\b/i.test(low)) {
      return { intent: "concept", ideaCode: "I9", topicKey: "ecosystem_value" };
    }
    if (/\b(distance|10 cm|20 cm|30 cm|40 cm|farther|closer|duol|layo|malapit|malayo|lux)\b/i.test(low)) {
      return { intent: "concept", ideaCode: "I3", topicKey: "inverse_square_lux" };
    }
    if (/\b(bubble|bula|oxygen|o2|gas|count|rate)\b/i.test(low)) {
      return { intent: "concept", ideaCode: "I2", topicKey: "equation_walkthrough" };
    }
    if (/\b(light|chlorophyll|photon|kahayag|liwanag|predict|photosynthesis)\b/i.test(low)) {
      return { intent: "concept", ideaCode: "I1", topicKey: "chloroplast_parts" };
    }

    const spDefaultMap = { sp1: "I1", sp2: "I7", sp3: "I3", sp4: "I5", sp5: "I8", sp6: "I9" };
    return { intent: "concept", ideaCode: spDefaultMap[state.supportPoint] || "I1", topicKey: null };
  }

  function isDirectExplanationRequest(rawQuestion) {
    const low = String(rawQuestion || "").trim().toLowerCase();
    // If the student clicked the explicit "Hint for Part X" button or literally asks for a hint -> keep H!
    if (/\b(give me a hint|hint for part|just a hint|clue)\b/i.test(low)) {
      return false;
    }
    return /\b(explain|what is|what are|what's|what does|how does|how do|how is|why does|why do|why is|why are|define|meaning of|break down|simpler|simple|analogy|compare|difference|variables?|ano ang|paano|bakit|unsa ang|ngano|giunsa)\b/i.test(
      low
    );
  }

  function tryEvaluateMathQuery(rawQuestion) {
    const q = String(rawQuestion || "").trim();
    const avgMatch = q.match(/(?:average|mean)\s+(?:of\s+)?([0-9.\s,]+(?:and\s+[0-9.]+)?)/i);
    if (avgMatch) {
      const nums = avgMatch[1].match(/\d+(?:\.\d+)?/g);
      if (nums && nums.length >= 2) {
        const vals = nums.map(Number);
        const sum = vals.reduce((a, b) => a + b, 0);
        const mean = (sum / vals.length).toFixed(2).replace(/\.00$/, "");
        return `Sure thing! Adding ${vals.join(" + ")} gives ${sum}, and dividing by ${vals.length} gives a Mean of ${mean}.`;
      }
    }
    // Extract safe arithmetic expression containing only numbers and + - * / ( )
    let expr = q
      .replace(/÷/g, "/")
      .replace(/×/g, "*")
      .replace(/\bplus\b/gi, "+")
      .replace(/\bminus\b/gi, "-")
      .replace(/\btimes\b/gi, "*")
      .replace(/\bdivided by\b/gi, "/");
    const match = expr.match(/([0-9().\s]+(?:[+\-*/][0-9().\s]+)+)/);
    if (!match) return null;
    const cleanExpr = match[1].replace(/\s+/g, "");
    if (!/^[0-9+\-*/().]+$/.test(cleanExpr) || cleanExpr.length > 48) return null;
    try {
      const result = Function(`"use strict"; return (${cleanExpr});`)();
      if (typeof result === "number" && Number.isFinite(result)) {
        const formatted = Number.isInteger(result) ? String(result) : result.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
        return `Quick math check: ${cleanExpr} equals ${formatted}!`;
      }
    } catch (_) {}
    return null;
  }

  function analyzeSimulationDataQuestion(rawQuestion, langKey, snapshot) {
    const q = String(rawQuestion || "").toLowerCase();
    const trialMatch = q.match(/\btrial\s*([123])\b|\bt([123])\b/i);
    const trialNum = trialMatch ? Number(trialMatch[1] || trialMatch[2]) : null;
    const distMatch = q.match(/\b(10|20|30|40)\s*cm\b|\b(dark)\b/i);
    let targetDist = distMatch ? (distMatch[1] || distMatch[2]).toLowerCase() : null;

    // Summarize ALL completed conditions if the student asks about their overall table/results/trend
    const filledEntries = Object.entries(snapshot.recordedConditions).filter(([, info]) => info.mean !== null);
    if (/\b(my table|my data|my results|all my|my trend|compare my|check my data|what does my graph)\b/i.test(q)) {
      if (!filledEntries.length) {
        return `Hey! Looking at your ${snapshot.selectedPlant} table right now, no 60-second runs are saved yet! Pick a light distance like 10 cm, hit 'Start 60-Second Observation', and once your numbers appear, ask me again and I'll walk through your exact trend!`;
      }
      const summaryParts = filledEntries.map(([k, info]) => `${k === "dark" ? "Dark" : k + " cm"} (Mean ${info.mean.toFixed(1)})`);
      const litMeans = filledEntries.filter(([k]) => k !== "dark").map(([k, info]) => ({ k: Number(k), mean: info.mean }));
      let trendNote = "";
      if (litMeans.length >= 2) {
        litMeans.sort((a, b) => a.k - b.k);
        const top = litMeans[0];
        const bottom = litMeans[litMeans.length - 1];
        trendNote = `Notice how moving the lamp closer—from ${bottom.k} cm (${bottom.mean.toFixed(1)} bubbles) to ${top.k} cm (${top.mean.toFixed(1)} bubbles)—pushes your bubble rate up! That's because closer light packs more energy onto every Hydrilla leaf.`;
      }
      return `Let's read your live ${snapshot.selectedPlant} table together! So far you've recorded: ${summaryParts.join(", ")}. ${trendNote} Want to run the remaining distances or talk about why the steepest drop happens as you pull the lamp back?`;
    }

    // Extract any bubble count number mentioned
    const cleanedForNum = q
      .replace(/\btrial\s*[123]\b/g, "")
      .replace(/\b(10|20|30|40)\s*cm\b/g, "")
      .replace(/\b60\s*s(?:ec(?:onds)?)?\b/g, "");
    const numMatch = cleanedForNum.match(/\b(\d+(?:\.\d+)?)\b/);
    const mentionedVal = numMatch ? parseFloat(numMatch[1]) : null;

    // Match recorded condition closest to mentioned number
    if (!targetDist && mentionedVal !== null) {
      let bestKey = null;
      let bestDiff = Infinity;
      Object.entries(snapshot.recordedConditions).forEach(([k, info]) => {
        const candidates = [...info.trials.filter((v) => typeof v === "number"), info.mean].filter((v) => v !== null);
        candidates.forEach((v) => {
          const diff = Math.abs(v - mentionedVal);
          if (diff < bestDiff) {
            bestDiff = diff;
            bestKey = k;
          }
        });
      });
      if (bestKey && bestDiff <= 4) {
        targetDist = bestKey;
      }
    }

    if (!targetDist) {
      if (mentionedVal !== null && snapshot.selectedPlant === "Hydrilla") {
        if (mentionedVal >= 36) targetDist = "10";
        else if (mentionedVal >= 22) targetDist = "20";
        else if (mentionedVal >= 11) targetDist = "30";
        else if (mentionedVal >= 3) targetDist = "40";
        else targetDist = "dark";
      } else {
        targetDist = snapshot.selectedDistance;
      }
    }

    const condData = snapshot.recordedConditions[targetDist] || snapshot.recordedConditions[snapshot.selectedDistance];
    const distLabel = targetDist === "dark" ? "Dark Control (0 lux)" : `${targetDist} cm (${condData.lux.toLocaleString()} lux)`;
    const recordedT1 = condData.trials[0];
    const recordedMean = condData.mean;
    const asksMeanAndTrial = trialNum !== null && /\b(mean|average)\b/i.test(q);
    const activeTemp = snapshot.liveWaterTemp;

    let observedSummary = "";
    if (recordedMean !== null) {
      const doneList = condData.trials
        .map((v, idx) => (typeof v === "number" ? `Trial ${idx + 1}: ${v}` : null))
        .filter(Boolean)
        .join(", ");
      observedSummary = `Ooh, let's check your live numbers! For ${snapshot.selectedPlant} at ${distLabel}, your table has ${doneList}, giving a Mean of ${recordedMean.toFixed(1)} bubbles in 60 seconds. `;
    } else if (mentionedVal !== null) {
      observedSummary = `Good catch! A count around ${mentionedVal} bubbles in 60 seconds matches ${snapshot.selectedPlant} right around ${distLabel}. `;
    } else {
      observedSummary = `Right now your beaker holds ${snapshot.selectedPlant} at ${distLabel} in ${snapshot.dayNightMode}, sitting at ${activeTemp} degrees Celsius. `;
    }

    const trialVsMeanNote = asksMeanAndTrial
      ? `Quick tip on those labels: Trial ${trialNum} is just one single 60-second run, while Mean averages all runs filled in that row—so if only Trial ${trialNum} (${mentionedVal !== null ? mentionedVal : recordedT1 !== null ? recordedT1 : "one run"}) is recorded so far, your Mean stays equal to that single number until Trials 2 and 3 finish! `
      : "";

    let mechanismReason = "";
    if (snapshot.isNightTime || targetDist === "dark") {
      mechanismReason = snapshot.isNightTime
        ? `Because we're in Night mode—lamp switched OFF (0 lux) and water chilled to ${activeTemp} °C—leaf chlorophyll gets zero light energy AND chilly helper enzymes slow down, so oxygen bubbles drop right to zero!`
        : `In the Dark Control, zero light hits the leaves, so the water-splitting reaction pauses completely—leaving only 0 to 2 tiny trapped gas bubbles.`;
    } else if (targetDist === "10") {
      mechanismReason = `Why does it hit around 39 to 45 bubbles here? At 10 cm (2,500 lux), the light is super close and bright, AND the lamp's gentle warmth (${activeTemp} °C in your 0.2% baking soda water) keeps leaf enzymes moving briskly! It doesn't shoot infinitely higher because carbon dioxide uptake and leaf enzymes eventually reach top speed.`;
    } else if (targetDist === "20") {
      mechanismReason = `Here's why ~30 bubbles makes total sense at 20 cm! When you move the lamp twice as far—from 10 cm back to 20 cm—brightness actually drops to one-fourth (625 lux instead of 2,500 lux), because light spreads wider AND taller. That medium-high light at ${activeTemp} °C inside 0.2% sodium bicarbonate gives steady ~30–35 bubbles per minute instead of ~42 at 10 cm!`;
    } else {
      mechanismReason = `At ${distLabel} and ${activeTemp} °C inside 0.2% sodium bicarbonate water, the light beam has spread out thinner, so fewer light packets hit the green leaves every second—making oxygen bubbles pop off more slowly. Repeating 3 trials averages out natural plant fluctuations!`;
    }

    if (langKey === "fil") {
      const filNote = asksMeanAndTrial
        ? `Paalala lang: isang 60-second run pa lang ang Trial ${trialNum}, at average ng lahat ng trials ang Mean. `
        : "";
      return `${observedSummary}${filNote}Sa ${distLabel} at ${activeTemp} °C na may 0.2% NaHCO₃ (pinagkukunan ng CO₂), humihina ang sikat ng ilaw habang lumalayo ang lamp kaya natural na ganyan ang bilang ng bula!`;
    }
    if (langKey === "ceb") {
      const cebNote = asksMeanAndTrial
        ? `Timan-i: usa pa ka 60-second run ang Trial ${trialNum}, ug average sa tanang trials ang Mean. `
        : "";
      return `${observedSummary}${cebNote}Sa ${distLabel} ug ${activeTemp} °C sulod sa 0.2% NaHCO₃, nagdepende ang bula sa kakusgon sa kahayag ug kabaskog sa enzymes—mao nga sakto ra kaayo nang imong resulta!`;
    }

    return `${observedSummary}${trialVsMeanNote}${mechanismReason}`.trim();
  }

  function evaluateStudentWorkDraft(rawQuestion, langKey, snapshot) {
    const inlineClaim = rawQuestion
      .replace(/^(?:check my answer|check my|is my answer|am i right|review my|is this right|check if)[:,\s-]*/i, "")
      .trim();
    const draft = (inlineClaim.length >= 12 ? inlineClaim : "") || String(snapshot.studentStepNotes || "").trim();
    const step = ACTIVITY_STEPS[state.currentStepIndex] || ACTIVITY_STEPS[0];

    if (!draft) {
      return `I'd love to check your answer! Type your idea for ${step.partTitle} inside the Student Activity box—or just write it right here to me—and I'll tell you what's already awesome and how to make it even stronger!`;
    }

    const low = draft.toLowerCase();
    const strengths = [];
    const tips = [];

    if (/10\s*cm|closer|high light|bright/i.test(low)) strengths.push("correctly spotting that 10 cm / brighter light gives the fastest rate");
    if (/oxygen|o2/i.test(low)) strengths.push("identifying the bubble gas correctly as oxygen (O₂)");
    if (/independent|dependent|constant|fair|nahco3|26|60|3 trials|mean/i.test(low)) {
      strengths.push("connecting the experimental variables or repeated trials for a fair test");
    }
    if (/level|plateau|limit|co2|enzyme|calvin|rubisco/i.test(low)) strengths.push("catching why the curve slows down (limiting factors)");
    if (/glucose|food|respir|ecosystem|atp|nadph|thylakoid|stroma/i.test(low)) {
      strengths.push("linking light reactions to glucose and living ecosystems");
    }

    if (step.sp === "sp1" && !/oxygen|o2/i.test(low)) tips.push("make sure you name the gas inside the bubbles—oxygen (O₂)!");
    if (step.sp === "sp2" && !/3 trials|mean|average|constant|nahco3/i.test(low)) {
      tips.push("mention keeping 0.2% sodium bicarbonate, temperature, plant shoot, and 60s constant—and averaging 3 trials to reduce random blips.");
    }
    if (step.sp === "sp4" && !/limit|co2|enzyme|level|saturat/i.test(low)) {
      tips.push("add a line about why 10 cm levels off slightly—because helper enzymes or CO₂ reach max capacity!");
    }
    if (step.sp === "sp5" && !/glucose|sugar|food|respir|ecosystem/i.test(low)) {
      tips.push("connect ATP and NADPH to building glucose sugar for ecosystems!");
    }

    const praiseText = strengths.length
      ? `Nice job—you nailed ${strengths.join(", and ")}!`
      : `Good effort putting your thinking in your own words!`;
    const tipText = tips.length
      ? `One quick polish to level it up: ${tips.join(" Also, ")}`
      : `That explanation hits all the key Grade 11 science ideas cleanly! Ready for the next step?`;

    return `Let's review what you wrote ("${draft.slice(0, 90)}${draft.length > 90 ? "..." : ""}")! ${praiseText} ${tipText}`;
  }

  function generateQuizQuestion(snapshot) {
    const quizzes = {
      sp1: {
        q: "Quick check! If you slide the lamp closer from 40 cm to 10 cm, what happens to the oxygen bubble count in 60 seconds—and WHY?",
        keywords: ["increase", "more", "higher", "faster", "more light", "stronger", "energy", "chlorophyll"],
        ideal: "Bubble count shoots up because closer light gives chlorophyll much more light energy every second to split water and release oxygen!",
      },
      sp2: {
        q: "Pop quiz on variables! In our Hydrilla setup, which one is the Independent Variable (what YOU change), and why do we run 3 trials instead of 1?",
        keywords: ["distance", "lamp", "light", "average", "mean", "reliable", "accurate", "variation", "error"],
        ideal: "Lamp distance is the Independent Variable we change, and 3 trials let us calculate a reliable Mean that smooths out small biological fluctuations!",
      },
      sp3: {
        q: "Think like a scientist: Why did Water Hyacinth produce almost no underwater bubbles compared to Hydrilla even under the same 10 cm lamp?",
        keywords: ["float", "air", "surface", "stomata", "above"],
        ideal: "Because Water Hyacinth's leaves float above water in the air, so its oxygen escapes straight into the air through leaf stomata instead of forming underwater bubbles!",
      },
      sp4: {
        q: "Brain teaser! 10 cm is 4× brighter than 20 cm—so why doesn't Hydrilla make 4× more bubbles at 10 cm?",
        keywords: ["limit", "co2", "enzyme", "saturat", "fast", "bottleneck", "max", "full"],
        ideal: "Because chlorophyll is already at max speed, so dissolved CO₂ or helper enzymes inside the leaf become the limiting factor bottleneck!",
      },
      sp5: {
        q: "Chloroplast check! What are the two energy-carrying 'batteries' made in the thylakoids that power glucose-building in the Calvin cycle?",
        keywords: ["atp", "nadph"],
        ideal: "ATP and NADPH! They carry energy from Stage 1 (thylakoids) to Stage 2 (Calvin cycle in the stroma) to make glucose sugar.",
      },
      sp6: {
        q: "Big-picture check! What happens to net oxygen bubbles if we flip to Night mode (lamp OFF, water ~18.5 °C), and why?",
        keywords: ["0", "zero", "stop", "no light", "respir", "cold", "slow"],
        ideal: "Bubbles drop to zero! Without light, photosynthesis pauses completely—while chilled mitochondria quietly keep doing cellular respiration 24/7.",
      },
    };
    const pick = quizzes[state.supportPoint] || quizzes.sp1;
    state.conversationMemory.pendingQuiz = {
      ideaCode: (ACTIVITY_STEPS[state.currentStepIndex] && ACTIVITY_STEPS[state.currentStepIndex].sp === "sp2") ? "I7" : "I3",
      keywords: pick.keywords,
      ideal: pick.ideal,
      askedAt: Date.now(),
    };
    return `${pick.q} Give me your best shot in a sentence—no pressure!`;
  }

  function gradeStudentQuizReply(rawQuestion) {
    const pq = state.conversationMemory.pendingQuiz;
    state.conversationMemory.pendingQuiz = null;
    if (!pq) return "Awesome curiosity! Let's jump right back into the simulation—what would you like to explore?";
    const low = String(rawQuestion || "").toLowerCase();
    const hits = (pq.keywords || []).filter((kw) => low.includes(kw));
    if (hits.length >= 2 || (hits.length === 1 && low.length >= 16)) {
      return `Spot on!! You hit the core idea (${hits.slice(0, 3).join(", ")})! ${pq.ideal} Want another quick question, or shall we check your simulation?`;
    }
    return `Ooh, good try! Let's sharpen that thought together: ${pq.ideal} Makes more sense now?`;
  }

  function extractSearchTopicFromQuestion(rawQuestion) {
    let clean = String(rawQuestion || "").trim();
    clean = clean
      .replace(/[?!.]+$/g, "")
      .replace(/^(?:hey\s+biovoice|biovoice|nova|please|can\s+you|could\s+you|tell\s+me|explain\s+to\s+me|help\s+me\s+understand)\s+/i, "")
      .replace(/^(?:what\s+is\s+the\s+meaning\s+of|what\s+does\s+|what\s+is|what's|what\s+are|who\s+is|who\s+was|how\s+does|how\s+do|why\s+is|define|meaning\s+of|explain|ano\s+ang|ano\s+ibig\s+sabihin\s+ng|unsa\s+ang|unsay\s+pasabot\s+sa)\s+/i, "")
      .replace(/\b(?:mean|means|meaning|work|works)\s*$/i, "")
      .replace(/^(?:a|an|the)\s+/i, "")
      .trim();
    return clean;
  }

  async function lookupWikipediaSummary(topic) {
    if (!topic || typeof fetch !== "function") return null;
    const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = ctrl ? setTimeout(() => ctrl.abort(), 3500) : null;
    try {
      const slug = encodeURIComponent(topic.replace(/\s+/g, "_"));
      const directRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${slug}`, {
        signal: ctrl ? ctrl.signal : undefined,
      });
      if (directRes.ok) {
        const data = await directRes.json();
        if (data && data.extract && data.type !== "disambiguation") {
          const sentences = data.extract.match(/[^.!?]+[.!?]+/g) || [data.extract];
          return sentences.slice(0, 2).join(" ").trim();
        }
      }
      // Opensearch fallback
      const searchRes = await fetch(
        `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(topic)}&limit=1&namespace=0&format=json&origin=*`,
        { signal: ctrl ? ctrl.signal : undefined }
      );
      if (searchRes.ok) {
        const arr = await searchRes.json();
        const bestTitle = Array.isArray(arr) && Array.isArray(arr[1]) ? arr[1][0] : "";
        if (bestTitle) {
          const sumRes = await fetch(
            `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(bestTitle.replace(/\s+/g, "_"))}`,
            { signal: ctrl ? ctrl.signal : undefined }
          );
          if (sumRes.ok) {
            const sumData = await sumRes.json();
            if (sumData && sumData.extract) {
              const sentences = sumData.extract.match(/[^.!?]+[.!?]+/g) || [sumData.extract];
              return sentences.slice(0, 2).join(" ").trim();
            }
          }
        }
      }
      // DuckDuckGo Instant Answer fallback (clean CORS JSON for definitions & quick facts)
      const ddgRes = await fetch(
        `https://api.duckduckgo.com/?q=${encodeURIComponent(topic)}&format=json&no_html=1&skip_disambig=1`,
        { signal: ctrl ? ctrl.signal : undefined }
      );
      if (ddgRes.ok) {
        const ddg = await ddgRes.json();
        const abs = (ddg && (ddg.AbstractText || ddg.Definition || ddg.Answer)) || "";
        if (abs) {
          const sentences = abs.match(/[^.!?]+[.!?]+/g) || [abs];
          return sentences.slice(0, 2).join(" ").trim();
        }
      }
    } catch (_) {
      // Network offline or timeout
    } finally {
      if (timer) clearTimeout(timer);
    }
    return null;
  }

  async function answerGeneralQuestionWithRedirect(rawQuestion, langKey, snapshot) {
    const topic = extractSearchTopicFromQuestion(rawQuestion);
    const topicLower = topic.toLowerCase();

    let factAnswer = GENERAL_KNOWLEDGE_MINI_KB[topicLower] || "";
    if (!factAnswer) {
      const matchedKey = Object.keys(GENERAL_KNOWLEDGE_MINI_KB).find((k) => topicLower.includes(k));
      if (matchedKey) factAnswer = GENERAL_KNOWLEDGE_MINI_KB[matchedKey];
    }
    if (!factAnswer && topic.length >= 2) {
      factAnswer = (await lookupWikipediaSummary(topic)) || "";
    }

    const distLabel = snapshot.selectedDistance === "dark" ? "Dark Control" : `${snapshot.selectedDistance} cm`;
    const coreRedirect = {
      en: `Now let's jump right back into our lab! We've got ${snapshot.selectedPlant} at ${distLabel} (${snapshot.liveWaterTemp} °C) on ${snapshot.currentStep}—want to check how your variables work or run a trial?`,
      fil: `Ngayon, balik tayo sa ating lab experiment! Naka-setup ang ${snapshot.selectedPlant} sa ${distLabel} (${snapshot.liveWaterTemp} °C) para sa ${snapshot.currentStep}—ano ang gusto mong i-test o itanong sunod?`,
      ceb: `Karon, balik ta sa atong photosynthesis lab! Naa ang ${snapshot.selectedPlant} sa ${distLabel} (${snapshot.liveWaterTemp} °C) sa ${snapshot.currentStep}—unsay gusto nimong sulayan o pangutan-on sunod?`,
    };

    if (factAnswer) {
      return `Ooh, good question! ${factAnswer} ${coreRedirect[langKey] || coreRedirect.en}`;
    }

    const offlineBridges = {
      en: `Love the curiosity! I can't reach a live web dictionary for "${topic || rawQuestion}" right this moment without a Gemini key or internet connection—though if you check back online I'll grab that right away! Meanwhile, let's dive back into ${snapshot.currentStep} with ${snapshot.selectedPlant} at ${distLabel}—any variable or bubble count you'd like broken down simply?`,
      fil: `Magandang tanong! Hindi ko maabot ang live lookup para sa "${topic || rawQuestion}" ngayon, pero habang nandito tayo sa lab—balikan natin ang ${snapshot.selectedPlant} sa ${distLabel}. Aling concept o variable ang gusto mong ipaliwanag ko nang mas simple?`,
      ceb: `Nindot ang imong pagkamausisaon! Dili nako ma-access ang live dictionary alang sa "${topic || rawQuestion}" karon dayon, busa balik usa ta sa ${snapshot.selectedPlant} sa ${distLabel}—unsang variable o parte sa photosynthesis ang gusto nimong pasabton sa pinakasayon nga paagi?`,
    };
    return offlineBridges[langKey] || offlineBridges.en;
  }

  function buildSimulationContextAddendum(langKey) {
    const activeTable = getActiveSimTable();
    const curTrials = activeTable[state.selectedDistance] || [null, null, null];
    const mean = computeMean(curTrials);
    const distLabel =
      state.selectedDistance === "dark" ? "Dark Control (0 lux)" : `${state.selectedDistance} cm`;

    if (mean !== null) {
      if (langKey === "fil") {
        return ` Sa live table mo ngayon para sa ${state.selectedPlant} sa ${distLabel} (${state.liveWaterTemp.toFixed(1)} °C), ang Mean mo ay ${mean.toFixed(1)} bubbles/60s!`;
      }
      if (langKey === "ceb") {
        return ` Sa imong live table karon alang sa ${state.selectedPlant} sa ${distLabel} (${state.liveWaterTemp.toFixed(1)} °C), ang imong Mean kay ${mean.toFixed(1)} bubbles/60s!`;
      }
      return ` Looking at your live table right now for ${state.selectedPlant} at ${distLabel} (${state.liveWaterTemp.toFixed(1)} °C), your current Mean is ${mean.toFixed(1)} bubbles in 60 seconds!`;
    }
    return "";
  }

  async function generateConversationalBioVoiceReply(questionText, langCode) {
    const langKey = langCode === "fil-PH" ? "fil" : langCode === "ceb-PH" ? "ceb" : "en";
    const classification = classifyQuestionAndConversationalIntent(questionText);
    const ideaCode = classification.ideaCode;
    const reqMap = { hint: "H", clarification: "C", explanation: "E" };
    let targetTier = reqMap[state.supportType] || "H";
    if (isDirectExplanationRequest(questionText)) {
      targetTier = "E";
    }
    const snapshot = buildFullSimulationSnapshot();
    const distLabel = snapshot.selectedDistance === "dark" ? "Dark Control" : `${snapshot.selectedDistance} cm`;

    const finishReply = (reply, usedIdeaCode, actualType, topicKey, hintFirst) => {
      state.conversationMemory.turnCount += 1;
      state.conversationMemory.lastIdeaCode = usedIdeaCode || ideaCode;
      if (topicKey !== undefined) state.conversationMemory.lastTopicKey = topicKey;
      state.conversationMemory.lastSupportPoint = state.supportPoint;
      state.conversationMemory.lastSupportType = actualType;
      state.conversationMemory.lastQuestion = questionText;
      state.conversationMemory.lastReply = reply;
      return { reply, ideaCode: usedIdeaCode || ideaCode, actualType, hintFirst: Boolean(hintFirst) };
    };

    // 1. Guardrail: Direct test/quiz answer refusal
    if (classification.intent === "test_refusal") {
      const refusals = {
        en: "I'm cheering for you to earn that score yourself, so I can't reveal Pretest or Posttest letters! Tell me which concept or variable from the question feels fuzzy, and I'll break it down super clearly with a quick example!",
        fil: "Gusto kong makita na ikaw mismo ang nakakaintindi kaya hindi ako makapagbibigay ng sagot sa Pretest o Posttest! Sabihin mo na lang kung aling concept ang nakakalito at ipapaliwanag ko ito nang napakasimple!",
        ceb: "Gusto nako nga makat-on ka mismo maong dili ko makahatag og tubag sa Pretest o Posttest! Ingna lang ko unsang konsepto ang lisod sabton, ug ako ning pasimplehon para nimo!",
      };
      return finishReply(refusals[langKey], ideaCode, "H", state.conversationMemory.lastTopicKey, true);
    }

    // 2. Smalltalk / Greeting (lively Nova personality)
    if (classification.intent === "conversational_smalltalk") {
      const nameTag = state.isSandbox ? "friend" : (state.participantCode || "friend");
      const greetings = {
        en: `Hey ${nameTag}! I'm BioVoice—ready when you are! Right now we've got ${snapshot.selectedPlant} set at ${distLabel} in ${snapshot.dayNightMode} (${snapshot.liveWaterTemp} °C). Want me to break down the variables simply, walk through your numbers, or tackle a tricky concept?`,
        fil: `Kumusta ${nameTag}! Ako si BioVoice, handang tumulong anumang oras! Naka-setup ngayon ang ${snapshot.selectedPlant} sa ${distLabel} (${snapshot.liveWaterTemp} °C). Gusto mo bang ipaliwanag ko nang simple ang mga variables o pag-usapan ang resulta mo?`,
        ceb: `Kumusta ${nameTag}! Ako si BioVoice, andam kanunay motabang! Naa karon ang ${snapshot.selectedPlant} sa ${distLabel} (${snapshot.liveWaterTemp} °C). Gusto ka bang pasabton nako sa pinakasayon ang mga variables o tan-awon nato ang imong datos?`,
      };
      return finishReply(greetings[langKey], ideaCode, "C", state.conversationMemory.lastTopicKey, false);
    }

    // 3. Student Answer / Prediction Draft Checker
    if (classification.intent === "check_my_work") {
      const checkReply = evaluateStudentWorkDraft(questionText, langKey, snapshot);
      return finishReply(checkReply, ideaCode, "C", state.conversationMemory.lastTopicKey, false);
    }

    // 4. Interactive Quiz Mode
    if (classification.intent === "quiz_request") {
      const qReply = generateQuizQuestion(snapshot);
      return finishReply(qReply, ideaCode, "H", state.conversationMemory.lastTopicKey, true);
    }
    if (classification.intent === "quiz_grade") {
      const gReply = gradeStudentQuizReply(questionText);
      return finishReply(gReply, ideaCode, "E", state.conversationMemory.lastTopicKey, false);
    }

    // 5. Safe Arithmetic / Mean Calculator
    if (classification.intent === "math_eval") {
      const mathAns = tryEvaluateMathQuery(questionText);
      if (mathAns) {
        return finishReply(`${mathAns} Now let's hop back to your ${snapshot.selectedPlant} setup at ${distLabel}—any trial numbers you'd like to interpret?`, "I6", "E", "math_eval", false);
      }
    }

    // 6. Live Simulation Data & Quantitative Result Analysis
    if (classification.intent === "sim_data_query") {
      const dataReply = analyzeSimulationDataQuestion(questionText, langKey, snapshot);
      return finishReply(dataReply, "I6", "E", "sim_data_query", false);
    }

    // 7. Simplification / Everyday-Analogy Follow-up (builds dynamically on previous topic!)
    if (classification.intent === "simplify_follow_up") {
      const prevTopicKey = state.conversationMemory.lastTopicKey;
      const prevTopic = prevTopicKey && CONCEPT_TUTOR_TOPICS[prevTopicKey];
      state.conversationMemory.simplificationDepth = (state.conversationMemory.simplificationDepth || 0) + 1;
      if (prevTopic && prevTopic[langKey] && prevTopic[langKey].analogy) {
        return finishReply(
          `Ooh, let's drop all the textbook words and make this crystal clear! ${prevTopic[langKey].analogy} Makes way more sense when you picture it like that, right?`,
          prevTopic.ideaCode || ideaCode,
          "E",
          prevTopicKey,
          false
        );
      }
      if (prevTopic && prevTopic.en && prevTopic.en.analogy) {
        return finishReply(
          `Let's strip out the jargon and use an easy everyday picture! ${prevTopic.en.analogy} Pretty neat when you see it that way, right?`,
          prevTopic.ideaCode || ideaCode,
          "E",
          prevTopicKey,
          false
        );
      }
      const simpleStory = SIMPLER_ANALOGY_BANK[ideaCode] || SIMPLER_ANALOGY_BANK.I1;
      return finishReply(
        `Let's make it super easy with zero complicated words! ${simpleStory} Want to try seeing that happen right in your beaker?`,
        ideaCode,
        "E",
        prevTopicKey,
        false
      );
    }

    // 8. Dedicated Thorough & Plain-Language Concept & Variable Tutor
    if (classification.intent === "concept_tutor" && classification.topicKey) {
      state.conversationMemory.simplificationDepth = 0;
      const topicObj = CONCEPT_TUTOR_TOPICS[classification.topicKey];
      const localized = (topicObj && topicObj[langKey]) || (topicObj && topicObj.en);
      if (localized) {
        const asksForAnalogy = /\b(analogy|example|simple)\b/i.test(questionText);
        const body = asksForAnalogy && localized.analogy
          ? `${localized.summary} ${localized.analogy}`
          : localized.summary;
        const simAdd = classification.topicKey === "plant_comparison" ? "" : buildSimulationContextAddendum(langKey);
        return finishReply(`${body}${simAdd}`.trim(), topicObj.ideaCode || ideaCode, "E", classification.topicKey, false);
      }
    }

    // 9. Off-Topic / General Knowledge -> Accurate Answer + Warm Lab Redirect
    if (classification.intent === "general_knowledge_redirect") {
      const replyText = await answerGeneralQuestionWithRedirect(questionText, langKey, snapshot);
      return finishReply(replyText, ideaCode, "C", state.conversationMemory.lastTopicKey, false);
    }

    // 10. Multi-turn escalation on core Idea I1–I9 (Hint -> Clarification -> Thorough Simple Explanation)
    let followUpPrefix = "";
    if (
      classification.intent === "follow_up_expand" ||
      (state.conversationMemory.turnCount > 0 && state.conversationMemory.lastIdeaCode === ideaCode && targetTier !== "E")
    ) {
      const prevTier = state.conversationMemory.lastSupportType || "H";
      targetTier = prevTier === "H" ? "C" : "E";
      const prefixes = {
        en: "Let's dig a little deeper on that! ",
        fil: "Palalimin natin nang simple iyon! ",
        ceb: "Atong palawman og gamay pero sayon gihapon! ",
      };
      followUpPrefix = prefixes[langKey];
    }

    const entry = IDEA_KNOWLEDGE_BASE[ideaCode] || IDEA_KNOWLEDGE_BASE.I1;
    const baseText = (entry[langKey] && entry[langKey][targetTier]) || entry.en[targetTier];
    const simAddendum = targetTier !== "H" ? buildSimulationContextAddendum(langKey) : "";

    const finalReply = `${followUpPrefix}${baseText}${simAddendum}`.trim();
    return finishReply(finalReply, ideaCode, targetTier, classification.topicKey || state.conversationMemory.lastTopicKey, targetTier === "H");
  }

  function initBioVoiceGreeting() {
    const stream = $("chat-messages");
    if (!stream) return;
    stream.innerHTML = "";
    state.conversationMemory = {
      turnCount: 0,
      lastIdeaCode: "I1",
      lastTopicKey: "",
      lastSupportPoint: state.supportPoint,
      lastSupportType: "hint",
      simplificationDepth: 0,
      pendingQuiz: null,
      lastQuestion: "",
      lastReply: "",
      messages: [],
    };

    const greeting =
      state.isSandbox
        ? "Hey there! I'm BioVoice—your friendly lab partner! Ask me anything in plain words—like breaking down our variables, explaining tough biology terms with simple analogies, checking your trial numbers, or even everyday questions—and I'll talk you right through it!"
        : `Hey ${state.participantCode}! I'm BioVoice, your Grade 11 Biology lab partner! Ask me in English, Filipino, or Cebuano—whether you want variables explained simply, help understanding your bubble counts, or a quick check on your prediction, I've got your back!`;

    appendChatBubble("assistant", greeting, "BioVoice · Nova Companion Ready (Live Sim Aware)");
    renderPromptChips();
  }

  /** Escape HTML special characters so dynamic text renders safely inside templates. */
  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function appendChatBubble(role, text, metaLabel) {
    const stream = $("chat-messages");
    if (!stream) return;
    const div = document.createElement("div");
    div.className = `chat-bubble ${role}`;
    const safeHtml = escapeHtml(text)
      .replace(/\$\\text\{CO\}_2\$/g, "CO₂")
      .replace(/\$\\text\{H\}_2\\text\{O\}\$/g, "H₂O")
      .replace(/\$\\text\{O\}_2\$/g, "O₂")
      .replace(/\$\\text\{C\}_6\\text\{H\}_\{12\}\\text\{O\}_6\$/g, "C₆H₁₂O₆")
      .replace(/\$\\text\{NaHCO\}_3\$/g, "NaHCO₃")
      .replace(/\$26\.0\\text\{ \}\^\\circ\\text\{C\}\$/g, "26.0 °C")
      .replace(/\$0\.2\\%\$/g, "0.2%")
      .replace(/\$0\.2\\%\\text\{ NaHCO\}_3\$/g, "0.2% NaHCO₃")
      .replace(/\$60\\text\{ seconds\}\$/g, "60 seconds")
      .replace(/\$\(\\text\{T1\}\+\\text\{T2\}\+\\text\{T3\}\)\÷ 3\$/g, "(T1+T2+T3) ÷ 3")
      .replace(/\$\(\\text\{T1\}\+\\text\{T2\}\+\\text\{T3\}\)\/3\$/g, "(T1+T2+T3)/3")
      .replace(/\\div/g, "÷");

    div.innerHTML = `<span class="chat-meta-tag">${metaLabel}</span><div>${safeHtml}</div>`;
    stream.appendChild(div);
    stream.scrollTop = stream.scrollHeight;
  }

  function renderPromptChips() {
    const container = $("prompt-chips");
    if (!container) return;

    const chipsBySp = {
      sp1: [
        "Explain photosynthesis in simple everyday words",
        "Why does the plant need light?",
        "Ngano man nga adunay bubbles ang Hydrilla?",
        "Bakit kailangan ng liwanag sa photosynthesis?",
      ],
      sp2: [
        "Explain all 3 variables simply (Independent, Dependent, Constant)",
        "Why do we put 0.2% NaHCO₃ (baking soda) in the water?",
        "Why do we run 3 trials per distance?",
      ],
      sp3: [
        "Compare my results and explain my trend",
        "Why did bubbles drop at 40 cm vs 10 cm?",
        "Why does Water Hyacinth make fewer underwater bubbles?",
      ],
      sp4: [
        "Why doesn't 10 cm make 4× more bubbles than 20 cm?",
        "How does temperature affect enzymes in Day vs Night?",
        "Quiz me on this step!",
      ],
      sp5: [
        "Explain thylakoids, stroma, ATP & NADPH like I'm a beginner",
        "Why is photosynthesis important to ecosystems?",
      ],
      sp6: [
        "Check my answer for this step!",
        "Can you explain that simpler with an analogy?",
      ],
    };

    const chips = chipsBySp[state.supportPoint] || chipsBySp.sp1;
    container.innerHTML = chips
      .map(
        (c) => `<button type="button" class="prompt-chip" data-chip-prompt="${c.replace(/"/g, "&quot;")}">${c}</button>`
      )
      .join("");

    container.querySelectorAll(".prompt-chip").forEach((btn) => {
      btn.addEventListener("click", () => {
        const promptText = btn.getAttribute("data-chip-prompt");
        const input = $("question-input");
        if (input) input.value = promptText;
        submitBioVoiceQuestion(promptText, "typed");
      });
    });
  }

  async function submitBioVoiceQuestion(rawQuestion, inputMode) {
    const question = String(rawQuestion || "").trim();
    if (!question) return;

    if (!state.bioVoiceAllowed) {
      appendChatBubble(
        "assistant",
        "BioVoice is disabled for your current session mode or group assignment.",
        "System Notice"
      );
      return;
    }

    // 1. Detect language automatically (or use manual override)
    const detected = detectLanguageUtterance(question, state.languageMode);
    state.lastDetectedLanguage = detected.code;
    state.lastDetectedLanguageLabel = detected.label;

    const langBadge = $("detected-language-badge");
    if (langBadge) {
      langBadge.textContent = `Detected: ${detected.label}`;
    }

    const stepObj = ACTIVITY_STEPS[state.currentStepIndex] || ACTIVITY_STEPS[0];
    appendChatBubble(
      "user",
      question,
      `${state.participantCode || "You"} · ${stepObj.spCode} · ${inputMode === "voice" ? "🎙️ Spoken" : "⌨️ Typed"}`
    );

    const inputEl = $("question-input");
    if (inputEl) inputEl.value = "";

    state.conversationMemory.messages.push({ role: "user", text: question });

    // 2. Query /api/chat with full live simulation snapshot (supports live Gemini AI + Cognitive Tutor)
    let finalReplyObj = null;
    let activeProviderTag = "Smart Tutor";
    const fullSnapshot = buildFullSimulationSnapshot();
    try {
      const res = await fetch(resolveApiUrl("/api/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantCode: state.participantCode,
          isSandbox: state.isSandbox,
          supportPoint: state.supportPoint,
          supportType: state.supportType,
          languageMode: state.languageMode,
          question,
          messages: state.conversationMemory.messages,
          simulationContext: fullSnapshot,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        appendChatBubble("assistant", data.error || "Access restricted.", "Protocol Guardrail");
        return;
      }
      if (data.detectedLanguage) {
        state.lastDetectedLanguage = data.detectedLanguage;
        state.lastDetectedLanguageLabel = data.detectedLanguageLabel || detected.label;
        if (langBadge) langBadge.textContent = `Detected: ${state.lastDetectedLanguageLabel}`;
      }
      if (data.useCuratedEngine === false && data.reply) {
        const cls = classifyQuestionAndConversationalIntent(question);
        activeProviderTag = data.provider && data.provider.includes("gemini") ? "Gemini AI" : "AI Tutor";
        finalReplyObj = {
          reply: data.reply,
          ideaCode: cls.ideaCode,
          actualType: isDirectExplanationRequest(question)
            ? "E"
            : state.supportType === "explanation"
            ? "E"
            : state.supportType === "clarification"
            ? "C"
            : "H",
          hintFirst: state.supportType === "hint" && !isDirectExplanationRequest(question),
        };
      }
    } catch (_) {
      // Offline / static host uses Cognitive Tutor + Live Knowledge Lookup
    }

    if (!finalReplyObj) {
      finalReplyObj = await generateConversationalBioVoiceReply(question, state.lastDetectedLanguage);
    }

    state.conversationMemory.messages.push({ role: "assistant", text: finalReplyObj.reply });

    const typeLabels = { H: "Hint (H)", C: "Clarification (C)", E: "Explanation (E)" };
    appendChatBubble(
      "assistant",
      finalReplyObj.reply,
      `BioVoice (${activeProviderTag}) · ${stepObj.spCode} · ${typeLabels[finalReplyObj.actualType] || "Explanation"} · ${finalReplyObj.ideaCode} · ${state.lastDetectedLanguageLabel}`
    );

    // 3. Speak response out loud with expressive intonation if voice is enabled
    speakBioVoiceResponse(finalReplyObj.reply, state.lastDetectedLanguage);

    // 4. Show student worksheet/teacher check bar
    const checkBar = $("student-check-bar");
    if (checkBar) checkBar.hidden = false;

    // 5. Log interaction to Appendix I if official Intervention participant (never log Guest/Sandbox)
    if (!state.isSandbox && state.activeRole === "student" && state.participantGroup === "Intervention") {
      await recordAppendixILog({
        participantCode: state.participantCode,
        session: state.studyConfig.activeSession,
        activityPart: stepObj.partTitle.split(" — ")[0],
        supportPoint: stepObj.spCode,
        requestType: finalReplyObj.actualType,
        actualResponseType: finalReplyObj.actualType,
        ideaCode: finalReplyObj.ideaCode,
        topicTitle: IDEA_CATALOG[finalReplyObj.ideaCode] || "",
        inputMode,
        language: state.lastDetectedLanguage,
        detectedLanguageLabel: state.lastDetectedLanguageLabel,
        studentRequestSummary: question.slice(0, 220),
        bioVoiceResponseSummary: finalReplyObj.reply.slice(0, 260),
        hintFirst: finalReplyObj.hintFirst ? "Yes" : "No",
      });
    }
  }

  async function recordAppendixILog(payload) {
    try {
      const res = await fetch(resolveApiUrl("/api/logs"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.interactionId) {
          state.lastInteractionId = data.interactionId;
        }
      }
    } catch (_) {
      // Queue in localStorage if running on static host
      const localLogs = JSON.parse(localStorage.getItem("biovoice_offline_logs") || "[]");
      const id = "BVLOG-LOCAL-" + Date.now();
      state.lastInteractionId = id;
      localLogs.push(Object.assign({ interactionId: id, timestamp: new Date().toISOString() }, payload));
      localStorage.setItem("biovoice_offline_logs", JSON.stringify(localLogs));
    }
  }

  async function handleStudentVerificationCheck(checkType) {
    const checkBar = $("student-check-bar");
    if (checkBar) checkBar.hidden = true;
    if (!state.lastInteractionId) return;
    try {
      await fetch(resolveApiUrl("/api/logs"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interactionId: state.lastInteractionId,
          action: "student_check",
          checkedWithSheetOrTeacher: checkType,
        }),
      });
    } catch (_) {}
  }

  // ==========================================================================
  // 13. NATURAL VOICE INTERACTION (SPEECH SYNTHESIS & RECOGNITION)
  // ==========================================================================
  function cleanTextForNaturalSpeech(rawText) {
    return String(rawText || "")
      .replace(/6\s*CO₂\s*\+\s*6\s*H₂O[^→]*→[^\n]+/gi, "six carbon dioxide plus six water, with light and chlorophyll, make glucose and six oxygen")
      .replace(/CO₂|CO2/g, "carbon dioxide")
      .replace(/H₂O|H2O/g, "water")
      .replace(/O₂|O2/g, "oxygen")
      .replace(/C₆H₁₂O₆|C6H12O6/g, "glucose")
      .replace(/0\.2%\s*NaHCO₃|0\.2%\s*NaHCO3/gi, "0.2 percent sodium bicarbonate")
      .replace(/NaHCO₃|NaHCO3/g, "sodium bicarbonate")
      .replace(/(\d+(?:\.\d+)?)\s*°C/g, "$1 degrees Celsius")
      .replace(/\blx\b/gi, "lux")
      .replace(/(\d+)\s*cm\b/gi, "$1 centimeters")
      .replace(/bubbles\/60s/gi, "bubbles per 60 seconds")
      .replace(/\b60s\b/gi, "60 seconds")
      .replace(/~(\d)/g, "about $1")
      .replace(/\bQ₁₀\b|Q10/g, "temperature Q10 factor")
      .replace(/(\d+(?:\.\d+)?)%/g, "$1 percent")
      .replace(/\be\.g\.,?/gi, "for example,")
      .replace(/\bi\.e\.,?/gi, "that is,")
      .replace(/\\text\{([^}]+)\}/g, "$1")
      .replace(/[\$\\*_`~•]/g, "")
      .replace(/&rarr;|→/g, " makes ")
      .replace(/&uarr;|↑/g, " gas ")
      .replace(/÷/g, " divided by ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function scoreVoiceForPersona(voice, langCode, persona) {
    const name = (voice.name || "").toLowerCase();
    const lang = (voice.lang || "").toLowerCase();
    let score = 0;

    // Penalize legacy/robotic voices strongly
    if (/fred|albert|bad news|bahh|bells|boing|bubbles|cellos|deranged|good news|hysterical|organ|trinoids|whisper|zarvox|kathy|ralph|junior|bruce|victoria|agnes|vicki|espeak|compact/i.test(name)) {
      score -= 120;
    }

    // Huge boost for neural / enhanced / premium natural synthesis voices
    if (/natural|neural|online|wavenet|studio|enhanced|premium|siri/i.test(name)) {
      score += 140;
    }

    // Warm Nova-like expressive voice preferences
    if (/ava|emma|aria|jenny|nova|samantha|serena|zoe|nicky|allison|stephanie|joanna|salli|karen|tessa|moira|google uk english female|google us english/i.test(name)) {
      score += persona === "nova" ? 95 : 75;
    } else if (/google|microsoft|apple|daniel|arthur|oliver|guy|andrew/i.test(name)) {
      score += persona === "studio" ? 75 : 40;
    }

    // Language alignment
    if (langCode === "fil-PH" || langCode === "ceb-PH") {
      if (/fil|tl|ph/.test(lang) || /filipino|tagalog|philippines|blessica|angelo/i.test(name)) {
        score += 110;
      } else if (/en/.test(lang)) {
        score += 20;
      }
    } else {
      if (lang === "en-us" || lang === "en-gb" || lang === "en-ph" || lang === "en-au") {
        score += 80;
      } else if (/^en/.test(lang)) {
        score += 55;
      } else {
        score -= 50;
      }
    }

    if (voice.localService === false) {
      score += 20;
    }
    return score;
  }

  function selectBestVoice(langCode) {
    if (!("speechSynthesis" in window)) return null;
    const voices = window.speechSynthesis.getVoices() || [];
    if (!voices.length) return null;

    const persona = state.voicePersona || "nova";
    let bestVoice = voices[0];
    let bestScore = -Infinity;
    for (let i = 0; i < voices.length; i++) {
      const sc = scoreVoiceForPersona(voices[i], langCode, persona);
      if (sc > bestScore) {
        bestScore = sc;
        bestVoice = voices[i];
      }
    }
    state.activeVoiceName = (bestVoice && bestVoice.name) || "";
    return bestVoice;
  }

  function splitIntoNaturalSentences(text) {
    const raw = String(text || "").trim();
    if (!raw) return [];
    const masked = raw
      .replace(/(\d)\.(?=\d)/g, "$1\uE000")
      .replace(/\.\.\./g, "\uE001")
      .replace(/\b(e\.g|i\.e|vs|etc|approx|dr|mr|ms)\./gi, (m) => m.replace(/\./g, "\uE000"));
    return masked
      .replace(/([.!?]+)(?=\s|$)/g, "$1\uE002")
      .split("\uE002")
      .map((p) => p.replace(/\uE000/g, ".").replace(/\uE001/g, "...").trim())
      .filter(Boolean);
  }

  /**
   * Segments cleaned text into lively 4-12 word breath phrases preserving expressive cues.
   */
  function segmentIntoIntonationPhrases(cleanText) {
    const sentences = splitIntoNaturalSentences(cleanText);
    const phrases = [];

    for (let i = 0; i < sentences.length; i++) {
      const s = sentences[i];
      // Split question tag tails like ", right?" or ", makes sense?" for audible rising inflection
      const qTag = s.match(/^(.{14,}?),\s*((?:right|okay|yeah|no|makes sense|pretty cool|cool)\?)$/i);
      if (qTag) {
        phrases.push({ text: qTag[1].trim(), cue: "pivot" });
        phrases.push({ text: qTag[2].trim(), cue: "question_tag" });
        continue;
      }

      // Split on expressive punctuation (em-dashes, ellipses, colons, semicolons)
      const firstSplit = s
        .replace(/\s*—\s*/g, "—| ")
        .replace(/\.\.\.\s*/g, "...| ")
        .replace(/:\s+/g, ":| ")
        .replace(/;\s+/g, ";| ")
        .split("|")
        .map((c) => c.trim())
        .filter(Boolean);

      const expanded = [];
      for (let j = 0; j < firstSplit.length; j++) {
        let seg = firstSplit[j];
        // Further split long segments cleanly on natural causal/contrast commas
        if (seg.length >= 68) {
          const commaParts = seg.split(/,\s+(?=(?:because|so|while|which|whereas|meaning|and\s+that|making|letting|giving|since|though)\b)/i);
          if (commaParts.length > 1) {
            commaParts.forEach((cp, ci) => {
              expanded.push(ci < commaParts.length - 1 ? cp.trim() + "," : cp.trim());
            });
            continue;
          }
          // Generic mid-comma split if still very long
          const midIdx = seg.indexOf(", ", Math.floor(seg.length * 0.35));
          if (midIdx > 22 && midIdx < seg.length - 20) {
            expanded.push(seg.slice(0, midIdx + 1).trim());
            expanded.push(seg.slice(midIdx + 2).trim());
            continue;
          }
        }
        expanded.push(seg);
      }

      expanded.forEach((part, idxInSent) => {
        const cleanSpoken = part.replace(/\s*—/g, ",").replace(/\.\.\./g, ",").replace(/\s+/g, " ").trim();
        if (!cleanSpoken) return;
        let cue = "body";
        if (/[!]$/.test(part) || /^(ooh|aha|oh|hey|wow|spot on|nice|awesome|picture|imagine|let's|wait)\b/i.test(part)) {
          cue = "hook";
        } else if (/\?$/.test(part)) {
          cue = "question";
        } else if (/[—:]$|\.\.\.$/.test(part)) {
          cue = "pivot";
        } else if (/\(.*\)/.test(part) || /^(for example|like|basically|even|pretty|quick tip|actually)\b/i.test(part)) {
          cue = "aside";
        } else if (
          /\b(independent variable|dependent variable|controlled variable|constant variable|limiting factor|light saturation|bottleneck|photolysis|chlorophyll|slows|stops|speeds|important|key|depends on|turns into|four times|one-fourth)\b/i.test(
            part
          )
        ) {
          cue = "emphasis";
        } else if (i === sentences.length - 1 && idxInSent === expanded.length - 1 && sentences.length > 1) {
          cue = "warm_close";
        }

        // Merge tiny < 10 char fragments except hooks/tags
        if (
          phrases.length > 0 &&
          cleanSpoken.length < 11 &&
          cue !== "hook" &&
          cue !== "question_tag" &&
          cue !== "question"
        ) {
          phrases[phrases.length - 1].text += " " + cleanSpoken;
        } else {
          phrases.push({ text: cleanSpoken, cue });
        }
      });
    }
    return phrases;
  }

  function computePhraseProsody(unit, idx, total, persona) {
    const profile =
      persona === "mentor"
        ? { basePitch: 0.99, swing: 0.75, baseRate: 0.95 }
        : persona === "studio"
        ? { basePitch: 1.03, swing: 0.88, baseRate: 1.08 }
        : { basePitch: 1.07, swing: 1.0, baseRate: 1.02 }; // nova expressive default

    const sw = profile.swing;
    let pitchOffset = 0;
    let rateMult = 1.0;
    let pauseMs = 55;

    switch (unit.cue) {
      case "hook":
        pitchOffset = 0.16 * sw;
        rateMult = 1.06;
        pauseMs = 95;
        break;
      case "question_tag":
        pitchOffset = 0.21 * sw;
        rateMult = 0.93;
        pauseMs = 155;
        break;
      case "question":
        pitchOffset = 0.14 * sw;
        rateMult = 0.96;
        pauseMs = 150;
        break;
      case "pivot":
        pitchOffset = 0.10 * sw;
        rateMult = 1.02;
        pauseMs = 85;
        break;
      case "aside":
        pitchOffset = 0.11 * sw;
        rateMult = 1.07;
        pauseMs = 45;
        break;
      case "emphasis":
        pitchOffset = -0.09 * sw;
        rateMult = 0.90;
        pauseMs = 85;
        break;
      case "warm_close":
        pitchOffset = -0.06 * sw;
        rateMult = 0.96;
        pauseMs = 0;
        break;
      default: {
        // Dynamic undulating conversational contour so body phrases never sound steady-state
        const wavePitch = [0.07, -0.06, 0.09, -0.05][idx % 4];
        const waveRate = [1.04, 0.94, 1.05, 0.97][idx % 4];
        pitchOffset = wavePitch * sw;
        rateMult = waveRate;
        pauseMs = idx === total - 1 ? 0 : 40;
        break;
      }
    }

    return {
      pitch: Math.max(0.84, Math.min(1.34, profile.basePitch + pitchOffset)),
      rateMult: profile.baseRate * rateMult,
      pauseMs,
    };
  }

  function speakBioVoiceResponse(text, langCode) {
    const clean = cleanTextForNaturalSpeech(text);
    state.lastSpokenText = clean;
    state.lastSpokenLang = langCode || "en-PH";

    if (state.voiceMuted || !("speechSynthesis" in window) || !clean) return;

    stopSpeechOutput();
    const seqId = state.speechSequenceId;
    const orb = $("bv-orb-indicator");
    if (orb) orb.classList.add("is-speaking");

    const persona = state.voicePersona || "nova";
    const userRate = Number(state.voiceSpeed) || 1.0;
    const chosenVoice = selectBestVoice(state.lastSpokenLang);
    const units = segmentIntoIntonationPhrases(clean);
    const resolvedLang = chosenVoice && chosenVoice.lang
      ? chosenVoice.lang
      : state.lastSpokenLang === "en-PH"
      ? "en-US"
      : "fil-PH";

    function speakUnitAt(idx) {
      if (seqId !== state.speechSequenceId || state.voiceMuted) return;
      if (idx >= units.length) {
        state.activeUtterance = null;
        if (orb) orb.classList.remove("is-speaking");
        return;
      }

      const unit = units[idx];
      const prosody = computePhraseProsody(unit, idx, units.length, persona);
      const utterance = new SpeechSynthesisUtterance(unit.text);
      state.activeUtterance = utterance; // Prevent Safari GC from dropping mid-speech callbacks
      if (chosenVoice) utterance.voice = chosenVoice;
      utterance.lang = resolvedLang;
      utterance.rate = Math.max(0.76, Math.min(1.40, userRate * prosody.rateMult));
      utterance.pitch = prosody.pitch;
      utterance.volume = 1.0;

      let finished = false;
      const advance = () => {
        if (finished || seqId !== state.speechSequenceId) return;
        finished = true;
        const tid = setTimeout(() => speakUnitAt(idx + 1), prosody.pauseMs);
        state.speechTimers.push(tid);
      };

      utterance.onend = advance;
      utterance.onerror = () => {
        if (seqId === state.speechSequenceId && orb) {
          orb.classList.remove("is-speaking");
        }
        state.activeUtterance = null;
      };

      window.speechSynthesis.speak(utterance);
    }

    speakUnitAt(0);
  }

  function stopSpeechOutput() {
    state.speechSequenceId = (state.speechSequenceId || 0) + 1;
    state.activeUtterance = null;
    if (Array.isArray(state.speechTimers)) {
      state.speechTimers.forEach((tid) => clearTimeout(tid));
      state.speechTimers = [];
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    const orb = $("bv-orb-indicator");
    if (orb) orb.classList.remove("is-speaking");
  }

  function toggleVoiceRecording() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    const statusEl = $("speech-status-text");
    const micBtn = $("mic-btn");
    const micLbl = $("mic-btn-label");
    const orb = $("bv-orb-indicator");

    if (!SpeechRec) {
      if (statusEl) {
        statusEl.textContent = "Browser speech recognition unavailable — please type your question below.";
      }
      return;
    }

    if (state.isListening && state.recognition) {
      state.recognition.stop();
      return;
    }

    stopSpeechOutput();
    const rec = new SpeechRec();
    state.recognition = rec;
    rec.lang =
      state.languageMode === "fil-PH"
        ? "fil-PH"
        : state.languageMode === "ceb-PH"
        ? "ceb-PH"
        : "en-PH";
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      state.isListening = true;
      if (micBtn) micBtn.classList.add("is-listening");
      if (micLbl) micLbl.textContent = "Listening...";
      if (orb) orb.classList.add("is-listening");
      if (statusEl) statusEl.textContent = "Listening now — speak your question clearly...";
    };

    rec.onresult = (event) => {
      const transcript =
        event.results && event.results[0] && event.results[0][0]
          ? event.results[0][0].transcript
          : "";
      if (transcript) {
        if ($("question-input")) $("question-input").value = transcript;
        submitBioVoiceQuestion(transcript, "voice");
      }
    };

    rec.onerror = () => {
      if (statusEl) {
        statusEl.textContent = "Could not hear clearly — tap to speak again or type below.";
      }
    };

    rec.onend = () => {
      state.isListening = false;
      if (micBtn) micBtn.classList.remove("is-listening");
      if (micLbl) micLbl.textContent = "Tap to Speak";
      if (orb) orb.classList.remove("is-listening");
    };

    rec.start();
  }

  // ==========================================================================
  // 14. PRIVATE RESEARCHER DASHBOARD & TEACHER PORTAL
  // ==========================================================================
  async function loadResearcherDashboard() {
    try {
      const res = await fetch(resolveApiUrl("/api/researcher/overview"), {
        headers: { Authorization: `Bearer ${state.staffToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        state.dashboardData = data;
        if (data.studyConfig) {
          Object.assign(state.studyConfig, data.studyConfig);
        }
        renderDashboardUI();
        return;
      }
    } catch (_) {}

    // Fallback when running on static host
    const fallbackParticipants = generateFallback200Codes();
    const localLogs = JSON.parse(localStorage.getItem("biovoice_offline_logs") || "[]");
    state.dashboardData = {
      summary: {
        totalRegisteredCodes: 200,
        assignedCodes: fallbackParticipants.filter((c) => c.status === "Assigned").length,
        consentVerifiedCount: fallbackParticipants.filter(
          (c) => c.consentVerified && c.assentVerified
        ).length,
        interventionAssigned: fallbackParticipants.filter(
          (c) => c.group === "Intervention" && c.status === "Assigned"
        ).length,
        comparisonAssigned: fallbackParticipants.filter(
          (c) => c.group === "Comparison" && c.status === "Assigned"
        ).length,
        totalInteractions: localLogs.length,
        activeBioVoiceUsers: new Set(localLogs.map((r) => r.participantCode)).size,
        pendingReviewCount: localLogs.length,
      },
      participants: fallbackParticipants,
      realLogs: localLogs,
      syntheticLogs: [],
      monitoringLogs: [],
    };
    renderDashboardUI();
  }

  function renderDashboardUI() {
    const sum = state.dashboardData.summary || {};
    if ($("metric-total-codes")) $("metric-total-codes").textContent = String(sum.totalRegisteredCodes || 200);
    if ($("metric-assigned-codes")) $("metric-assigned-codes").textContent = String(sum.assignedCodes || 0);
    if ($("metric-group-breakdown")) {
      $("metric-group-breakdown").textContent = `Intervention: ${sum.interventionAssigned || 0} | Comparison: ${sum.comparisonAssigned || 0}`;
    }
    if ($("metric-consent-verified")) {
      $("metric-consent-verified").textContent = String(sum.consentVerifiedCount || 0);
    }
    if ($("metric-real-logs")) $("metric-real-logs").textContent = String(sum.totalInteractions || 0);
    if ($("metric-active-users")) {
      $("metric-active-users").textContent = `${sum.activeBioVoiceUsers || 0} active Intervention codes`;
    }
    if ($("metric-pending-review")) {
      $("metric-pending-review").textContent = String(sum.pendingReviewCount || 0);
    }

    // Teacher modal readouts
    if ($("teacher-session-readout")) $("teacher-session-readout").textContent = state.studyConfig.activeSession;
    if ($("teacher-assigned-readout")) {
      $("teacher-assigned-readout").textContent = `${sum.interventionAssigned || 54} / ${sum.comparisonAssigned || 55}`;
    }

    // Sync study config controls
    if ($("cfg-study-phase")) $("cfg-study-phase").value = state.studyConfig.studyPhase || "Implementation";
    if ($("cfg-active-session")) $("cfg-active-session").value = state.studyConfig.activeSession || "Session 1";
    if ($("cfg-official-plant")) {
      $("cfg-official-plant").value = state.studyConfig.officialPlantSpecies || "Hydrilla";
    }
    if ($("cfg-class-pin")) $("cfg-class-pin").value = state.studyConfig.classAccessPin || "2026";
    if ($("cfg-require-pin")) $("cfg-require-pin").checked = Boolean(state.studyConfig.requirePin);
    if ($("cfg-strict-assigned")) {
      $("cfg-strict-assigned").checked = Boolean(state.studyConfig.strictAssignedOnly);
    }
    if ($("cfg-require-consent")) {
      $("cfg-require-consent").checked = Boolean(state.studyConfig.requireConsentVerification);
    }

    const perms = state.studyConfig.teacherPermissions || {};
    if ($("perm-teacher-guide")) $("perm-teacher-guide").checked = perms.viewActivityAndGuide !== false;
    if ($("perm-teacher-sim")) $("perm-teacher-sim").checked = perms.accessSimulation !== false;
    if ($("perm-teacher-monitor")) $("perm-teacher-monitor").checked = perms.monitorClassroomSession !== false;
    if ($("perm-teacher-obs")) $("perm-teacher-obs").checked = perms.recordObservations !== false;
    if ($("perm-teacher-fidelity")) $("perm-teacher-fidelity").checked = perms.reviewFidelity !== false;
    if ($("perm-teacher-logs")) $("perm-teacher-logs").checked = Boolean(perms.viewAnonymizedLogs);

    const aiStatus = state.dashboardData && state.dashboardData.aiStatus ? state.dashboardData.aiStatus : null;
    if (aiStatus) {
      if ($("cfg-gemini-model") && aiStatus.model) $("cfg-gemini-model").value = aiStatus.model;
      const badge = $("ai-status-badge");
      if (badge) {
        if (aiStatus.configured) {
          badge.textContent = `Live Gemini Connected (${aiStatus.model || "gemini-2.5-flash"})`;
          badge.style.background = "#dcfce7";
          badge.style.color = "#166534";
        } else {
          badge.textContent = "Smart Built-in Engine (No Key Saved)";
          badge.style.background = "#fef3c7";
          badge.style.color = "#92400e";
        }
      }
      const aiMsg = $("ai-config-status");
      if (aiMsg) {
        if (aiStatus.configured || aiStatus.lastError) {
          aiMsg.hidden = false;
          aiMsg.textContent = aiStatus.configured
            ? `Active provider: Google Gemini (${aiStatus.model || "gemini-2.5-flash"}) via ${aiStatus.source || "server"} (${aiStatus.maskedKey || "key saved"}).${aiStatus.lastError ? ` Last warning: ${aiStatus.lastError}` : ""}`
            : `Fallback active: ${aiStatus.lastError || "No GEMINI_API_KEY configured on the server yet."}`;
        } else {
          aiMsg.hidden = true;
          aiMsg.textContent = "";
        }
      }
    }

    renderParticipantsTable();
    renderInteractionLogsTable();
    renderAnalyticsBreakdown();
  }

  function renderParticipantsTable() {
    const tbody = $("participants-tbody");
    if (!tbody) return;
    const searchVal = ($("participant-search-input") ? $("participant-search-input").value : "")
      .trim()
      .toUpperCase();
    const groupFilter = $("participant-group-filter") ? $("participant-group-filter").value : "ALL";
    const statusFilter = $("participant-status-filter") ? $("participant-status-filter").value : "ALL";

    const list = (state.dashboardData.participants || []).filter((p) => {
      if (groupFilter !== "ALL" && p.group !== groupFilter) return false;
      if (statusFilter !== "ALL" && p.status !== statusFilter) return false;
      if (
        searchVal &&
        !p.code.toUpperCase().includes(searchVal) &&
        !(p.notes || "").toUpperCase().includes(searchVal)
      ) {
        return false;
      }
      return true;
    });

    tbody.innerHTML = list
      .map(
        (p) => `
        <tr>
          <td>${p.no}</td>
          <td><strong>${p.code}</strong></td>
          <td><code>${p.accessPin || "—"}</code></td>
          <td>
            <select class="p-group-sel" data-code="${p.code}">
              <option value="Intervention" ${p.group === "Intervention" ? "selected" : ""}>Intervention</option>
              <option value="Comparison" ${p.group === "Comparison" ? "selected" : ""}>Comparison</option>
              <option value="Reserve" ${p.group === "Reserve" ? "selected" : ""}>Reserve</option>
            </select>
          </td>
          <td>
            <select class="p-status-sel" data-code="${p.code}">
              <option value="Assigned" ${p.status === "Assigned" ? "selected" : ""}>Assigned</option>
              <option value="Unassigned" ${p.status === "Unassigned" ? "selected" : ""}>Unassigned</option>
              <option value="Withdrawn" ${p.status === "Withdrawn" ? "selected" : ""}>Withdrawn</option>
              <option value="Not eligible" ${p.status === "Not eligible" ? "selected" : ""}>Not eligible</option>
            </select>
          </td>
          <td>
            <label class="check-label">
              <input type="checkbox" class="p-consent-chk" data-code="${p.code}" ${p.consentVerified && p.assentVerified ? "checked" : ""} />
              <span>${p.consentVerified && p.assentVerified ? "Verified" : "Pending"}</span>
            </label>
          </td>
          <td>${p.interactionCount || 0}</td>
          <td>
            <input type="text" class="p-notes-inp" data-code="${p.code}" value="${(p.notes || "").replace(/"/g, "&quot;")}" placeholder="Notes..." style="width:120px;padding:0.25rem 0.4rem;" />
          </td>
          <td>
            <button type="button" class="mini-btn p-save-btn" data-code="${p.code}">Save</button>
          </td>
        </tr>
      `
      )
      .join("");

    tbody.querySelectorAll(".p-save-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const code = btn.getAttribute("data-code");
        const row = btn.closest("tr");
        const group = row.querySelector(".p-group-sel").value;
        const status = row.querySelector(".p-status-sel").value;
        const consent = row.querySelector(".p-consent-chk").checked;
        const notes = row.querySelector(".p-notes-inp").value;

        try {
          const res = await fetch(resolveApiUrl("/api/researcher/participants"), {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${state.staffToken}`,
            },
            body: JSON.stringify({
              action: "update_single",
              code,
              group,
              status,
              consentVerified: consent,
              assentVerified: consent,
              notes,
            }),
          });
          const data = await res.json();
          if (!res.ok) {
            alert(data.error || "Update blocked by protocol safeguard.");
          } else {
            await loadResearcherDashboard();
          }
        } catch (_) {}
      });
    });
  }

  function getActiveDashboardLogs() {
    const showSynth = $("toggle-synthetic-logs") && $("toggle-synthetic-logs").checked;
    return showSynth
      ? state.dashboardData.syntheticLogs || []
      : state.dashboardData.realLogs || [];
  }

  function renderInteractionLogsTable() {
    const tbody = $("logs-tbody");
    if (!tbody) return;

    const search = ($("log-search-input") ? $("log-search-input").value : "").trim().toLowerCase();
    const spF = $("log-sp-filter") ? $("log-sp-filter").value : "ALL";
    const typeF = $("log-type-filter") ? $("log-type-filter").value : "ALL";
    const ideaF = $("log-idea-filter") ? $("log-idea-filter").value : "ALL";

    const logs = getActiveDashboardLogs().filter((r) => {
      if (spF !== "ALL" && r.supportPoint !== spF) return false;
      if (typeF !== "ALL" && r.requestType !== typeF) return false;
      if (ideaF !== "ALL" && r.ideaCode !== ideaF) return false;
      if (
        search &&
        !`${r.participantCode} ${r.exchangeSummary} ${r.ideaCode}`.toLowerCase().includes(search)
      ) {
        return false;
      }
      return true;
    });

    if (!logs.length) {
      tbody.innerHTML = `<tr><td colspan="12" class="cell-empty">No matching BioVoice interaction records found.</td></tr>`;
      return;
    }

    tbody.innerHTML = logs
      .map(
        (r) => `
        <tr>
          <td><code>${r.interactionId}</code></td>
          <td><strong>${r.participantCode}</strong></td>
          <td>${r.date || ""} ${r.time || ""}</td>
          <td><span class="status-pill">${r.supportPoint}</span></td>
          <td><strong>${r.requestType}</strong></td>
          <td><span class="status-pill assigned">${r.ideaCode}</span></td>
          <td>${r.inputMode || "typed"} · ${r.language || "en-PH"}</td>
          <td>${(r.exchangeSummary || "").slice(0, 140)}</td>
          <td>${r.hintFirst || "Yes"}</td>
          <td>${r.checkedWithSheetOrTeacher || "Pending"}</td>
          <td>${r.accuracyAndScope || "Pending researcher review"}</td>
          <td>
            <button type="button" class="mini-btn review-log-btn" data-log-id="${r.interactionId}">
              Review
            </button>
          </td>
        </tr>
      `
      )
      .join("");

    tbody.querySelectorAll(".review-log-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const logId = btn.getAttribute("data-log-id");
        const rec = getActiveDashboardLogs().find((x) => x.interactionId === logId);
        if (!rec) return;
        if ($("review-log-id")) $("review-log-id").value = rec.interactionId;
        if ($("review-exchange-preview")) {
          $("review-exchange-preview").textContent = rec.exchangeSummary || "";
        }
        if ($("review-sp-select")) $("review-sp-select").value = rec.supportPoint || "SP1";
        if ($("review-type-select")) $("review-type-select").value = rec.requestType || "H";
        if ($("review-idea-select")) $("review-idea-select").value = rec.ideaCode || "I1";
        if ($("review-accuracy-select")) {
          $("review-accuracy-select").value = rec.accuracyAndScope || "Pending researcher review";
        }
        if ($("review-remarks-input")) $("review-remarks-input").value = rec.remarks || "";
        openModal("review-dialog");
      });
    });
  }

  function renderAnalyticsBreakdown() {
    const grid = $("analytics-breakdown-grid");
    if (!grid) return;
    const logs = getActiveDashboardLogs();

    const spCounts = { SP1: 0, SP2: 0, SP3: 0, SP4: 0, SP5: 0, SP6: 0 };
    const typeCounts = { H: 0, C: 0, E: 0 };
    const ideaCounts = { I1: 0, I2: 0, I3: 0, I4: 0, I5: 0, I6: 0, I7: 0, I8: 0, I9: 0 };

    logs.forEach((r) => {
      if (spCounts[r.supportPoint] !== undefined) spCounts[r.supportPoint]++;
      if (typeCounts[r.requestType] !== undefined) typeCounts[r.requestType]++;
      if (ideaCounts[r.ideaCode] !== undefined) ideaCounts[r.ideaCode]++;
    });

    grid.innerHTML = `
      <div class="breakdown-card">
        <h3>By Support Point (SP1–SP6)</h3>
        ${Object.entries(spCounts)
          .map(([k, v]) => `<div class="breakdown-row"><span>${k}</span><strong>${v}</strong></div>`)
          .join("")}
      </div>
      <div class="breakdown-card">
        <h3>By Request Type (H / C / E)</h3>
        <div class="breakdown-row"><span>Hint (H)</span><strong>${typeCounts.H}</strong></div>
        <div class="breakdown-row"><span>Clarification (C)</span><strong>${typeCounts.C}</strong></div>
        <div class="breakdown-row"><span>Explanation (E)</span><strong>${typeCounts.E}</strong></div>
      </div>
      <div class="breakdown-card">
        <h3>By Idea Code (I1–I9)</h3>
        ${Object.entries(ideaCounts)
          .map(
            ([k, v]) =>
              `<div class="breakdown-row"><span>${k} · ${IDEA_CATALOG[k]}</span><strong>${v}</strong></div>`
          )
          .join("")}
      </div>
    `;
  }

  // ==========================================================================
  // 15. CSV & EXCEL (.XLS) EXPORTS
  // ==========================================================================
  function downloadBlobFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function exportCsvFile(filename, headers, rows) {
    const escapeCsv = (val) => `"${String(val === null || val === undefined ? "" : val).replace(/"/g, '""')}"`;
    const csvContent =
      "\uFEFF" +
      [headers.map(escapeCsv).join(","), ...rows.map((r) => r.map(escapeCsv).join(","))].join("\r\n");
    downloadBlobFile(filename, csvContent, "text/csv;charset=utf-8");
  }

  function handleExportLogsCsv() {
    const logs = getActiveDashboardLogs();
    const headers = [
      "Interaction_ID",
      "Participant_Code",
      "Date",
      "Time",
      "Session",
      "Activity_Part",
      "Support_Point",
      "Request_Type",
      "Idea_Code",
      "Input_Mode",
      "Language",
      "Student_Request_Summary",
      "BioVoice_Response_Summary",
      "Hint_First",
      "Checked_With_Sheet_Or_Teacher",
      "Accuracy_And_Scope",
      "Remarks",
    ];
    const rows = logs.map((r) => [
      r.interactionId,
      r.participantCode,
      r.date,
      r.time,
      r.session,
      r.activityPart,
      r.supportPoint,
      r.requestType,
      r.ideaCode,
      r.inputMode,
      r.language,
      r.studentRequestSummary,
      r.bioVoiceResponseSummary,
      r.hintFirst,
      r.checkedWithSheetOrTeacher,
      r.accuracyAndScope,
      r.remarks,
    ]);
    exportCsvFile("BioVoice_Appendix_I_Interaction_Log.csv", headers, rows);
  }

  function handleExportParticipantsCsv() {
    const list = state.dashboardData.participants || [];
    const headers = [
      "No",
      "Participant_Code",
      "Assigned_Group",
      "Status",
      "Consent_Assent_Verified",
      "Interaction_Count",
      "Notes",
    ];
    const rows = list.map((p) => [
      p.no,
      p.code,
      p.group,
      p.status,
      p.consentVerified && p.assentVerified ? "Yes" : "No",
      p.interactionCount || 0,
      p.notes || "",
    ]);
    exportCsvFile("BioVoice_Participant_Register_BV001-BV200.csv", headers, rows);
  }

  function handleExportExcelWorkbook() {
    const logs = getActiveDashboardLogs();
    const participants = state.dashboardData.participants || [];
    const htmlTable = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head><meta charset="UTF-8"><title>BioVoice Research Export</title></head>
      <body>
        <h2>Sheet 1: Appendix I — BioVoice Use and Prompt Log</h2>
        <table border="1">
          <tr>
            <th>Interaction ID</th><th>Participant Code</th><th>Date</th><th>Time</th>
            <th>Support Point</th><th>Request Type</th><th>Idea Code</th><th>Language</th>
            <th>Exchange Summary</th><th>Hint First</th><th>Sheet/Teacher Check</th><th>Accuracy &amp; Scope</th>
          </tr>
          ${logs
            .map(
              (r) => `
            <tr>
              <td>${r.interactionId}</td><td>${r.participantCode}</td><td>${r.date || ""}</td><td>${r.time || ""}</td>
              <td>${r.supportPoint}</td><td>${r.requestType}</td><td>${r.ideaCode}</td><td>${r.language || ""}</td>
              <td>${r.exchangeSummary || ""}</td><td>${r.hintFirst}</td><td>${r.checkedWithSheetOrTeacher}</td><td>${r.accuracyAndScope}</td>
            </tr>`
            )
            .join("")}
        </table>
        <h2>Sheet 2: Official 200-Code Register (BV-001 to BV-200)</h2>
        <table border="1">
          <tr><th>No</th><th>Code</th><th>Group</th><th>Status</th><th>Consent Verified</th><th>Interactions</th></tr>
          ${participants
            .map(
              (p) => `
            <tr>
              <td>${p.no}</td><td>${p.code}</td><td>${p.group}</td><td>${p.status}</td>
              <td>${p.consentVerified && p.assentVerified ? "Verified" : "Pending"}</td><td>${p.interactionCount || 0}</td>
            </tr>`
            )
            .join("")}
        </table>
      </body></html>
    `;
    downloadBlobFile(
      "BioVoice_Complete_Research_Workbook.xls",
      htmlTable,
      "application/vnd.ms-excel"
    );
  }

  // ==========================================================================
  // 16. EVENT BINDINGS & INITIALIZATION
  // ==========================================================================
  function renderFidelityChecklist() {
    const container = $("fidelity-checklist-container");
    if (!container) return;
    container.innerHTML = FIDELITY_ITEMS.map(
      (item, idx) => `
        <div class="breakdown-row">
          <span>${item}</span>
          <select class="fidelity-item-sel" data-fidelity-idx="${idx}">
            <option value="Yes" selected>Yes</option>
            <option value="Partial">Partial</option>
            <option value="No">No</option>
          </select>
        </div>
      `
    ).join("");
  }


  // ==========================================================================
  // 15. NEW THESIS UPGRADES (BIOVOICE 2026-2027)
  // ==========================================================================

  // --- Upgrade: Save Student Progress to Server & LocalStorage ---
  async function handleSaveStudentProgress() {
    if (state.activeRole === "guest" || state.isSandbox) {
      return;
    }

    const saveBtn = $("topbar-save-progress-btn");
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = "💾 Saving...";
    }

    // Gather active step text
    const activeText = $("stepper-response-input") ? $("stepper-response-input").value.trim() : "";
    if (activeText && state.stepNotes) {
      state.stepNotes[state.currentStepIndex] = activeText;
    }

    const payload = {
      participantCode: state.participantCode || "",
      participantGroup: state.participantGroup || "",
      sessionCode: state.sessionCode || "",
      activeStepIndex: state.currentStepIndex,
      stepNotes: state.stepNotes || [],
      stepCompleted: state.stepCompleted || [],
      simTable: state.officialSimTable || {},
      physicalTable: state.physicalTable || {},
      timestamp: new Date().toISOString()
    };

    try {
      localStorage.setItem(`biovoice_saved_progress_${payload.participantCode}`, JSON.stringify(payload));
    } catch (_) {}

    try {
      const res = await fetch(resolveApiUrl("/api/session/save-progress"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showSaveToast("✓ Progress successfully saved to research server!");
      } else {
        showSaveToast("✓ Saved locally in browser storage.");
      }
    } catch (err) {
      showSaveToast("✓ Saved locally in browser storage.");
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = "💾 Save Progress";
      }
    }
  }

  function showSaveToast(msg) {
    let toast = $("bv-save-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "bv-save-toast";
      toast.style.cssText = "position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#065f46;color:#ffffff;padding:10px 20px;border-radius:24px;font-weight:600;font-size:0.9rem;box-shadow:0 4px 12px rgba(0,0,0,0.2);z-index:9999;transition:opacity 0.3s ease;";
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = "1";
    setTimeout(() => {
      if (toast) toast.style.opacity = "0";
    }, 2800);
  }

  // --- Upgrade: Active Speaker Switcher ---
  function handleSwitchActiveSpeaker() {
    if (state.activeRole === "guest" || state.isSandbox) return;
    const select = $("lab-station-select");
    if (!select || !select.value) return;
    const newCode = select.value;
    state.participantCode = newCode;
    const speakerBadge = $("active-speaker-badge");
    if (speakerBadge) speakerBadge.textContent = newCode;
    const headerBadge = $("participant-code-badge");
    if (headerBadge) headerBadge.textContent = newCode;

    if (state.bioVoiceAllowed) {
      appendChatBubble(
        "assistant",
        `Switched active speaker to ${newCode}. You may now record your ideas or ask BioVoice for guidance!`,
        "BioVoice · Speaker Switch"
      );
    }
  }

  // --- Cellular Level Exploration: Clickable Structure Explanations ---
  const MICRO_STRUCTURE_DATA = {
    thylakoid: {
      title: "Thylakoid Grana — The Solar Panels That Split Water",
      body: "Think of the stacked green discs like tiny solar panels. What variables act here? Light Intensity (Lamp Distance) is the Independent Variable: moving the Day lamp closer (10 cm = 2,500 lx) sends more light energy into chlorophyll, splitting more water (H₂O) into Oxygen (O₂) bubbles—our Dependent Variable. At Night (Lamp OFF, 0 lx), the solar panels shut off and O₂ splitting stops immediately."
    },
    stroma: {
      title: "Stroma Fluid — The Sugar Kitchen & Active Enzymes",
      body: "Picture the clear fluid around the discs as the leaf's sugar kitchen, where active enzymes assemble CO₂ into glucose. Two Controlled Variables work together here: dissolved CO₂ from 0.2% NaHCO₃ provides the carbon ingredient, while Water Temperature controls kitchen speed—warm Day lamp water (~26.0–28.6 °C) keeps enzymes active and steady, whereas cold Night water (~18.5 °C) slows them down."
    },
    photons: {
      title: "Light Photons & Chlorophyll — The Green Light Catchers",
      body: "Imagine light as tiny energy packets hitting a green net (chlorophyll). Light Brightness (Lamp ON during Day vs. OFF at Night) and Pigment Presence decide how much energy gets caught. Green chlorophyll absorbs red and blue light best; white leaf patches without chlorophyll or Night darkness (0 lx) catch zero energy and produce 0 O₂ bubbles."
    },
    membrane: {
      title: "Chloroplast Envelope & Aquatic Leaves — Underwater Doors",
      body: "Unlike land leaves with thick wax, submerged Hydrilla leaves act like thin underwater sponges. Here, Dissolved CO₂ (kept constant with 0.2% NaHCO₃) and Water Temperature team up: bicarbonate slips straight through the thin cell and chloroplast doors, and warmer Day water lets molecules move inside faster than cold Night water."
    },
    oxygen: {
      title: "Oxygen (O₂) Output — Chloroplasts Making vs. Mitochondria Using",
      body: "Two organelles share a tug-of-war: Chloroplasts make O₂ when the Light is ON, while Mitochondria quietly use a tiny amount of O₂ all day and night for cellular respiration. The bubbles you count (our Dependent Variable) show NET Oxygen left over: in warm Day light, chloroplasts make far more O₂ than mitochondria use so bubbles stream up; at cold Night (Lamp OFF), net O₂ bubbles drop to zero."
    }
  };

  function selectMicroStructure(structureKey) {
    const info = MICRO_STRUCTURE_DATA[structureKey] || MICRO_STRUCTURE_DATA.thylakoid;
    document.querySelectorAll(".micro-hotspot, .micro-pill-btn").forEach((el) => {
      el.classList.toggle("is-selected", el.getAttribute("data-micro-structure") === structureKey);
    });
    const detail = $("micro-structure-detail");
    if (detail) {
      detail.innerHTML = `<strong class="micro-detail-title">${escapeHtml(info.title)}</strong><p class="micro-detail-body">${escapeHtml(info.body)}</p>`;
    }
  }

  function setVariegatedLeafZone(zone) {
    const greenBtn = $("test-green-leaf-btn");
    const whiteBtn = $("test-white-leaf-btn");
    const resEl = $("variegated-result-text");
    const isGreen = zone !== "white";

    if (greenBtn) greenBtn.classList.toggle("is-active", isGreen);
    if (whiteBtn) whiteBtn.classList.toggle("is-active", !isGreen);
    if (resEl) {
      resEl.innerHTML = isGreen
        ? "<strong>Green Center:</strong> Contains abundant chlorophyll inside chloroplasts &rarr; Captures light energy &rarr; Splits water &rarr; High glucose synthesis (turns dark blue-black in starch test)."
        : "<strong>White Edge (No Chlorophyll):</strong> Lacks chlorophyll inside plastids &rarr; Cannot absorb light photons even under bright light &rarr; Photolysis and starch synthesis do not occur (remains yellow-brown in iodine test).";
    }
  }

  // --- Day & Night Explorer (Day = Light Bg + Lamp ON + Warm; Night = Dark Bg + Lamp OFF + Cold) ---
  function setDayNightMode(mode, skipDistanceUpdate) {
    const isNight = mode === "night";
    const strip = document.querySelector(".day-night-strip");
    const dayBtn = $("dn-day-btn");
    const nightBtn = $("dn-night-btn");
    const expEl = $("day-night-explanation");
    const bgRect = $("sim-bg-rect");
    const dayCue = $("sim-sky-day-cue");
    const nightCue = $("sim-sky-night-cue");
    const titleEl = $("svg-chamber-title");
    const speciesEl = $("svg-species-label");
    const benchEl = $("sim-bench-rect");
    const rulerLabelsEl = $("svg-ruler-labels");
    const beakerGlassEl = $("svg-beaker-glass");
    const beakerLipEl = $("svg-beaker-lip");
    const beakerTicksEl = $("svg-beaker-ticks");
    const lampTagEl = $("sim-lamp-tag");
    const lampRadiantEl = $("sim-lamp-radiant-text");

    if (isNight && state.selectedDistance !== "dark") {
      state.lastLitDistance = state.selectedDistance;
    }
    state.isNightTime = isNight;

    if (strip) strip.classList.toggle("is-night-active", isNight);
    if (dayBtn) dayBtn.classList.toggle("is-active", !isNight);
    if (nightBtn) nightBtn.classList.toggle("is-active", isNight);

    // Light Day background vs Dark Night background on #sim-svg
    if (bgRect) bgRect.setAttribute("fill", isNight ? "url(#nightBgGrad)" : "url(#dayBgGrad)");
    if (dayCue) dayCue.setAttribute("opacity", isNight ? "0" : "1");
    if (nightCue) nightCue.setAttribute("opacity", isNight ? "1" : "0");
    if (titleEl) titleEl.setAttribute("fill", isNight ? "#a7f3d0" : "#065f46");
    if (speciesEl) speciesEl.setAttribute("fill", isNight ? "#cbd5e1" : "#334155");
    if (benchEl) {
      benchEl.setAttribute("fill", isNight ? "#1e293b" : "#cbd5e1");
      benchEl.setAttribute("stroke", isNight ? "#334155" : "#94a3b8");
    }
    if (rulerLabelsEl) rulerLabelsEl.setAttribute("fill", isNight ? "#cbd5e1" : "#334155");
    if (beakerGlassEl) {
      beakerGlassEl.setAttribute("fill", isNight ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.45)");
      beakerGlassEl.setAttribute("stroke", isNight ? "#94a3b8" : "#64748b");
    }
    if (beakerLipEl) beakerLipEl.setAttribute("stroke", isNight ? "#cbd5e1" : "#475569");
    if (beakerTicksEl) {
      beakerTicksEl.setAttribute("fill", isNight ? "#cbd5e1" : "#334155");
      beakerTicksEl.setAttribute("stroke", isNight ? "rgba(226,232,240,0.42)" : "rgba(15,23,42,0.35)");
    }
    if (lampTagEl) lampTagEl.setAttribute("fill", isNight ? "#fef08a" : "#92400e");
    if (lampRadiantEl) lampRadiantEl.setAttribute("fill", isNight ? "#fed7aa" : "#9a3412");

    if (expEl) {
      if (isNight) {
        expEl.innerHTML =
          "<strong>Night Condition (Lamp OFF · Cold Water ~18.5 °C):</strong> At night the lamp is turned OFF (0 lx) and cold water temperatures slow enzyme activity. Photolysis ceases completely (0 O₂ bubbles) while cooler mitochondria still consume dissolved O₂ in cellular respiration.";
      } else {
        expEl.innerHTML =
          "<strong>Day Condition (Lamp ON · Warm Water ~26.0–28.6 °C):</strong> Lamp light &amp; radiant warmth energize active enzymes inside the 0.2% NaHCO₃ water bath. Photosynthesis produces oxygen bubbles &amp; glucose while mitochondria respire 24/7. <em>Net oxygen balance is positive!</em>";
      }
    }

    if (!skipDistanceUpdate) {
      if (isNight) {
        updateDistanceSelectionUI("dark");
      } else {
        const restoreDist = state.selectedDistance === "dark" ? (state.lastLitDistance || "10") : state.selectedDistance;
        updateDistanceSelectionUI(restoreDist);
      }
    }
  }

  // --- Upgrade: Digital Auto-Scorers in Researcher Dashboard ---
  const APPENDIX_F_ANSWER_KEY = [
    "A", "B", "C", "A", "B", "C", "D", "A", "B", "C",
    "B", "A", "D", "C", "B", "A", "C", "D", "A", "B"
  ];

  function runConceptTestScorer() {
    const preText = $("pre-test-responses-input") ? $("pre-test-responses-input").value.trim().toUpperCase() : "";
    const postText = $("post-test-responses-input") ? $("post-test-responses-input").value.trim().toUpperCase() : "";

    const preAnswers = preText.split(/[^A-D]/).filter(Boolean);
    const postAnswers = postText.split(/[^A-D]/).filter(Boolean);

    let preScore = 0;
    let postScore = 0;

    for (let i = 0; i < 20; i++) {
      if (preAnswers[i] === APPENDIX_F_ANSWER_KEY[i]) preScore++;
      if (postAnswers[i] === APPENDIX_F_ANSWER_KEY[i]) postScore++;
    }

    const prePct = ((preScore / 20) * 100).toFixed(1);
    const postPct = ((postScore / 20) * 100).toFixed(1);

    // Hake's normalized gain g
    let g = 0;
    if (20 - preScore > 0) {
      g = ((postScore - preScore) / (20 - preScore)).toFixed(2);
    }

    let level = "Low (<50%)";
    if (postPct >= 75) level = "High (≥75%)";
    else if (postPct >= 50) level = "Moderate (50%–74%)";

    if ($("concept-score-result")) {
      $("concept-score-result").innerHTML = `
        <div style="background:#ecfdf5;border:1px solid #10b981;border-radius:8px;padding:12px;margin-top:10px;">
          <strong>Pre-Test:</strong> ${preScore}/20 (${prePct}%) &nbsp;|&nbsp;
          <strong>Post-Test:</strong> ${postScore}/20 (${postPct}%) &nbsp;|&nbsp;
          <strong>Hake's Gain (g):</strong> ${g} &nbsp;|&nbsp;
          <strong>Mastery Level (Table 4):</strong> <span class="badge" style="background:#065f46;color:#fff;">${level}</span>
        </div>
      `;
    }
  }

  function runPerceptionScorer() {
    const raw = $("perception-responses-input") ? $("perception-responses-input").value.trim() : "";
    const nums = raw.split(/[^1-5]/).filter(Boolean).map(Number);
    if (!nums.length) return;

    const mean = (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2);
    const variance = (nums.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / nums.length);
    const sd = Math.sqrt(variance).toFixed(2);

    let interp = "Positive (Strong Agreement)";
    if (mean < 2.5) interp = "Low / Disagree";
    else if (mean < 3.5) interp = "Neutral / Moderate";

    if ($("perception-score-result")) {
      $("perception-score-result").innerHTML = `
        <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:12px;margin-top:10px;">
          <strong>Items Count:</strong> ${nums.length} &nbsp;|&nbsp;
          <strong>Composite Mean:</strong> ${mean} / 5.00 &nbsp;|&nbsp;
          <strong>SD:</strong> ${sd} &nbsp;|&nbsp;
          <strong>Verbal Interpretation (Appendix K):</strong> <span class="badge" style="background:#047857;color:#fff;">${interp}</span>
        </div>
      `;
    }
  }

  function runICVICalculator() {
    const experts = $("icvi-experts-input") ? parseInt($("icvi-experts-input").value) || 5 : 5;
    const agreeing = $("icvi-agreeing-input") ? parseInt($("icvi-agreeing-input").value) || 5 : 5;

    const icvi = (agreeing / experts).toFixed(2);
    const isValid = parseFloat(icvi) >= 0.83;

    if ($("icvi-calc-result")) {
      $("icvi-calc-result").innerHTML = `
        <div style="background:${isValid ? '#ecfdf5' : '#fef2f2'};border:1px solid ${isValid ? '#10b981' : '#ef4444'};border-radius:8px;padding:12px;margin-top:10px;">
          <strong>I-CVI:</strong> ${icvi} &nbsp;|&nbsp;
          <strong>Lynn (1986) Criterion (≥0.83):</strong> ${isValid ? "<span style='color:#065f46;font-weight:700;'>✓ Content Valid</span>" : "<span style='color:#dc2626;font-weight:700;'>✗ Needs Revision</span>"}
        </div>
      `;
    }
  }

  async function handleGenerateSessionCode() {
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const code = `BV-S1-${randomSuffix}`;

    try {
      await fetch(resolveApiUrl("/api/session/generate-code"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionCode: code, createdBy: "Researcher Console" })
      });
    } catch (_) {}

    if ($("generated-session-code-display")) {
      $("generated-session-code-display").textContent = code;
    }
  }

  async function handleRefreshActiveProgress() {
    const tbody = $("active-progress-tbody");
    if (!tbody) return;
    tbody.innerHTML = "<tr><td colspan='5' style='text-align:center;'>Loading live student records...</td></tr>";

    try {
      const res = await fetch(resolveApiUrl("/api/session/active-codes"));
      if (!res.ok) throw new Error("Fetch failed");
      const data = await res.json();
      const records = data.savedProgress || [];

      if (!records.length) {
        tbody.innerHTML = "<tr><td colspan='5' style='text-align:center;'>No saved student records found yet.</td></tr>";
        return;
      }

      tbody.innerHTML = records.map((r) => `
        <tr>
          <td><strong>${r.participantCode || "-"}</strong></td>
          <td>${r.participantGroup || "-"}</td>
          <td>${r.sessionCode || "-"}</td>
          <td>Part ${Number(r.activeStepIndex || 0) + 1}</td>
          <td><span class="badge" style="background:#10b981;color:#fff;">Active</span></td>
        </tr>
      `).join("");
    } catch (err) {
      tbody.innerHTML = "<tr><td colspan='5' style='text-align:center;color:#ef4444;'>Unable to connect to live server. Displaying local data.</td></tr>";
    }
  }

  function bindAllEvents() {
    // Save Progress, Active Speaker, Day/Night & Cellular Exploration Listeners
    if ($("topbar-save-progress-btn")) {
      $("topbar-save-progress-btn").addEventListener("click", handleSaveStudentProgress);
    }
    if ($("switch-speaker-btn")) {
      $("switch-speaker-btn").addEventListener("click", handleSwitchActiveSpeaker);
    }
    if ($("toggle-ilo-btn")) {
      $("toggle-ilo-btn").addEventListener("click", () => {
        const panel = $("ilo-content-collapse");
        const icon = $("ilo-toggle-icon");
        const btn = $("toggle-ilo-btn");
        if (!panel) return;
        const nextHidden = !panel.hidden;
        panel.hidden = nextHidden;
        if (btn) btn.setAttribute("aria-expanded", String(!nextHidden));
        if (icon) icon.textContent = nextHidden ? "▼ View Objectives" : "▲ Hide Objectives";
      });
    }
    if ($("toggle-micro-btn")) {
      $("toggle-micro-btn").addEventListener("click", () => {
        const body = $("micro-card-body");
        const btn = $("toggle-micro-btn");
        if (!body || !btn) return;
        const nextHidden = !body.hidden;
        body.hidden = nextHidden;
        btn.setAttribute("aria-expanded", String(!nextHidden));
        btn.textContent = nextHidden ? "Show Microscopic View" : "Hide Microscopic View";
      });
    }
    document.querySelectorAll(".micro-hotspot, .micro-pill-btn, .micro-clickable-card").forEach((el) => {
      const trigger = () => {
        const key = el.getAttribute("data-micro-structure");
        if (key) selectMicroStructure(key);
      };
      el.addEventListener("click", trigger);
      el.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          trigger();
        }
      });
    });
    if ($("test-green-leaf-btn")) {
      $("test-green-leaf-btn").addEventListener("click", () => setVariegatedLeafZone("green"));
    }
    if ($("test-white-leaf-btn")) {
      $("test-white-leaf-btn").addEventListener("click", () => setVariegatedLeafZone("white"));
    }
    if ($("dn-day-btn")) {
      $("dn-day-btn").addEventListener("click", () => setDayNightMode("day"));
    }
    if ($("dn-night-btn")) {
      $("dn-night-btn").addEventListener("click", () => setDayNightMode("night"));
    }

    // Researcher Dashboard Scorer Tabs & Runners
    const scorerTabs = [
      { btnId: "tab-scorer-f", panelId: "scorer-f-panel" },
      { btnId: "tab-scorer-k", panelId: "scorer-k-panel" },
      { btnId: "tab-scorer-b", panelId: "scorer-b-panel" },
      { btnId: "tab-class-sessions", panelId: "class-sessions-panel" }
    ];
    scorerTabs.forEach((tab) => {
      if ($(tab.btnId)) {
        $(tab.btnId).addEventListener("click", () => {
          scorerTabs.forEach((t) => {
            if ($(t.btnId)) $(t.btnId).classList.toggle("is-active", t.btnId === tab.btnId);
            if ($(t.panelId)) $(t.panelId).hidden = t.panelId !== tab.panelId;
          });
        });
      }
    });
    if ($("btn-run-scorer-f")) {
      $("btn-run-scorer-f").addEventListener("click", runConceptTestScorer);
    }
    if ($("btn-run-scorer-k")) {
      $("btn-run-scorer-k").addEventListener("click", runPerceptionScorer);
    }
    if ($("btn-run-scorer-b")) {
      $("btn-run-scorer-b").addEventListener("click", runICVICalculator);
    }
    if ($("score-concept-test-btn")) {
      $("score-concept-test-btn").addEventListener("click", runConceptTestScorer);
    }
    if ($("score-perception-btn")) {
      $("score-perception-btn").addEventListener("click", runPerceptionScorer);
    }
    if ($("calc-icvi-btn")) {
      $("calc-icvi-btn").addEventListener("click", runICVICalculator);
    }
    if ($("gen-session-code-btn")) {
      $("gen-session-code-btn").addEventListener("click", handleGenerateSessionCode);
    }
    if ($("refresh-progress-btn")) {
      $("refresh-progress-btn").addEventListener("click", handleRefreshActiveProgress);
    }

    // Welcome & 4-Role Login Forms
    const studentForm = $("student-login-form");
    if (studentForm) studentForm.addEventListener("submit", handleStudentLoginSubmit);

    const adminForm = $("admin-login-form");
    if (adminForm) adminForm.addEventListener("submit", (e) => handleStaffLogin(e, "admin"));

    const teacherForm = $("teacher-login-form");
    if (teacherForm) teacherForm.addEventListener("submit", (e) => handleStaffLogin(e, "teacher"));

    const guestBtn = $("guest-login-btn");
    if (guestBtn) guestBtn.addEventListener("click", handleGuestLogin);

    // Group Confirmation Step
    const intConfirmBtn = $("confirm-intervention-btn");
    if (intConfirmBtn) {
      intConfirmBtn.addEventListener("click", () => handleGroupConfirmChoice("Intervention"));
    }
    const cmpConfirmBtn = $("confirm-comparison-btn");
    if (cmpConfirmBtn) {
      cmpConfirmBtn.addEventListener("click", () => handleGroupConfirmChoice("Comparison"));
    }
    const cancelConfirmBtn = $("group-confirm-cancel-btn");
    if (cancelConfirmBtn) {
      cancelConfirmBtn.addEventListener("click", () => {
        state.pendingParticipant = null;
        if ($("group-confirm-panel")) $("group-confirm-panel").hidden = true;
        if ($("role-cards-grid")) $("role-cards-grid").hidden = false;
      });
    }

    // Terms & Conditions Modal ("Before You Begin")
    if ($("terms-agree-btn")) $("terms-agree-btn").addEventListener("click", handleTermsAgree);
    if ($("terms-decline-btn")) $("terms-decline-btn").addEventListener("click", handleTermsDecline);

    // Activity Guide & About BioVoice Pop-Up Modals
    ["welcome-guide-btn", "open-guide-modal-btn"].forEach((id) => {
      if ($(id)) $(id).addEventListener("click", () => openModal("guide-dialog"));
    });
    ["close-guide-modal-btn", "guide-modal-done-btn"].forEach((id) => {
      if ($(id)) $(id).addEventListener("click", () => closeModal("guide-dialog"));
    });

    ["welcome-about-btn", "open-about-modal-btn"].forEach((id) => {
      if ($(id)) $(id).addEventListener("click", () => openModal("about-dialog"));
    });
    ["close-about-modal-btn", "about-modal-done-btn"].forEach((id) => {
      if ($(id)) $(id).addEventListener("click", () => closeModal("about-dialog"));
    });

    // Teacher Classroom Monitor Modal
    if ($("open-teacher-modal-btn")) {
      $("open-teacher-modal-btn").addEventListener("click", () => openModal("teacher-dialog"));
    }
    if ($("close-teacher-modal-btn")) {
      $("close-teacher-modal-btn").addEventListener("click", () => closeModal("teacher-dialog"));
    }

    // Review Dialog Modal
    if ($("close-review-modal-btn")) {
      $("close-review-modal-btn").addEventListener("click", () => closeModal("review-dialog"));
    }

    // Close modals on backdrop click or Escape key
    document.querySelectorAll(".modal-backdrop").forEach((backdrop) => {
      backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop && backdrop.id !== "terms-dialog") {
          backdrop.hidden = true;
        }
      });
    });
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        ["guide-dialog", "about-dialog", "teacher-dialog", "review-dialog"].forEach(closeModal);
      }
    });

    // Hideable BioVoice Panel Toggles
    if ($("toggle-biovoice-panel-btn")) {
      $("toggle-biovoice-panel-btn").addEventListener("click", () => {
        setBioVoicePanelVisibility(!state.bioVoicePanelVisible);
      });
    }
    if ($("close-biovoice-panel-btn")) {
      $("close-biovoice-panel-btn").addEventListener("click", () => {
        setBioVoicePanelVisibility(false);
      });
    }

    // Logout & Dashboard Navigation
    ["logout-btn", "dashboard-logout-btn"].forEach((id) => {
      if ($(id)) $(id).addEventListener("click", handleLogout);
    });
    if ($("return-dashboard-btn")) {
      $("return-dashboard-btn").addEventListener("click", () => {
        loadResearcherDashboard();
        showScreen("dashboard");
      });
    }
    if ($("dashboard-preview-sim-btn")) {
      $("dashboard-preview-sim-btn").addEventListener("click", () => {
        configureAndEnterLearningEnvironment();
      });
    }
    if ($("dashboard-refresh-btn")) {
      $("dashboard-refresh-btn").addEventListener("click", loadResearcherDashboard);
    }

    // Aquatic Plant Species Buttons (Hydrilla, Elodea, Water Hyacinth)
    document.querySelectorAll(".plant-species-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        updatePlantSelectionUI(btn.getAttribute("data-plant-species"));
      });
    });

    // Lamp Distance Buttons (10 cm, 20 cm, 30 cm, 40 cm, Dark)
    document.querySelectorAll(".distance-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        updateDistanceSelectionUI(btn.getAttribute("data-distance"));
      });
    });

    // Simulation Timer Controls
    if ($("sim-start-btn")) $("sim-start-btn").addEventListener("click", startSimulationTrial);
    if ($("sim-pause-btn")) $("sim-pause-btn").addEventListener("click", pauseSimulationTrial);
    if ($("sim-resume-btn")) $("sim-resume-btn").addEventListener("click", resumeSimulationTrial);
    if ($("sim-reset-btn")) {
      $("sim-reset-btn").addEventListener("click", () => {
        stopSimulationTimer();
        if ($("sim-completion-banner")) {
          $("sim-completion-banner").textContent =
            "Timer reset to 60 seconds. Click 'Start 60-Second Observation' to begin a new run.";
          $("sim-completion-banner").classList.remove("is-complete");
        }
      });
    }
    if ($("sim-clear-table-btn")) {
      $("sim-clear-table-btn").addEventListener("click", () => {
        stopSimulationTimer();
        const tbl = getActiveSimTable();
        LIGHT_CONDITIONS.forEach((c) => {
          tbl[c.key] = [null, null, null];
        });
        renderDataTablesAndGraph();
      });
    }

    // Dataset Mode Tabs (Simulated vs Physical Classroom)
    document.querySelectorAll(".dataset-tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.tableMode = btn.getAttribute("data-table-mode");
        document.querySelectorAll(".dataset-tab-btn").forEach((b) => {
          b.classList.toggle("is-active", b === btn);
        });
        if ($("simulated-table-container")) {
          $("simulated-table-container").hidden = state.tableMode !== "simulated";
        }
        if ($("physical-table-container")) {
          $("physical-table-container").hidden = state.tableMode !== "physical";
        }
        renderDataTablesAndGraph();
      });
    });

    // Compact 1-at-a-Time Activity Stepper Controls
    if ($("stepper-prev-btn")) {
      $("stepper-prev-btn").addEventListener("click", () => {
        if ($("stepper-response-input")) {
          state.stepNotes[state.currentStepIndex] = $("stepper-response-input").value;
        }
        if (state.currentStepIndex > 0) {
          state.currentStepIndex -= 1;
          if ($("stepper-validation-msg")) $("stepper-validation-msg").hidden = true;
          renderStepperUI();
        }
      });
    }
    if ($("stepper-next-btn")) {
      $("stepper-next-btn").addEventListener("click", () => {
        if ($("stepper-response-input")) {
          state.stepNotes[state.currentStepIndex] = $("stepper-response-input").value;
        }
        if (state.currentStepIndex < ACTIVITY_STEPS.length - 1) {
          state.currentStepIndex += 1;
          if ($("stepper-validation-msg")) $("stepper-validation-msg").hidden = true;
          renderStepperUI();
        }
      });
    }
    document.querySelectorAll(".step-dot").forEach((dot) => {
      dot.addEventListener("click", () => {
        if ($("stepper-response-input")) {
          state.stepNotes[state.currentStepIndex] = $("stepper-response-input").value;
        }
        state.currentStepIndex = Number(dot.getAttribute("data-step-index"));
        if ($("stepper-validation-msg")) $("stepper-validation-msg").hidden = true;
        renderStepperUI();
      });
    });
    if ($("stepper-complete-btn")) {
      $("stepper-complete-btn").addEventListener("click", handleMarkStepComplete);
    }
    if ($("stepper-ask-biovoice-btn")) {
      $("stepper-ask-biovoice-btn").addEventListener("click", () => {
        if (!state.bioVoiceAllowed) return;
        setBioVoicePanelVisibility(true);
        const step = ACTIVITY_STEPS[state.currentStepIndex];
        submitBioVoiceQuestion(`Can you give me a hint for ${step.partTitle}?`, "typed");
      });
    }

    // BioVoice Controls
    if ($("language-select")) {
      $("language-select").addEventListener("change", (e) => {
        state.languageMode = e.target.value;
        const badge = $("detected-language-badge");
        if (badge) {
          badge.textContent =
            state.languageMode === "auto"
              ? "Auto Detect Ready"
              : `Mode: ${e.target.options[e.target.selectedIndex].text}`;
        }
      });
    }
    if ($("support-point-select")) {
      $("support-point-select").addEventListener("change", (e) => {
        state.supportPoint = e.target.value;
        const idx = ACTIVITY_STEPS.findIndex((s) => s.sp === state.supportPoint);
        if (idx !== -1 && idx !== state.currentStepIndex) {
          state.currentStepIndex = idx;
          renderStepperUI();
        } else {
          renderPromptChips();
        }
      });
    }
    document.querySelectorAll(".support-type-pill").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.supportType = btn.getAttribute("data-support-type");
        document.querySelectorAll(".support-type-pill").forEach((b) => {
          b.classList.toggle("is-active", b === btn);
        });
      });
    });

    // Voice Playback Controls
    if ($("voice-mute-btn")) {
      $("voice-mute-btn").addEventListener("click", () => {
        state.voiceMuted = !state.voiceMuted;
        $("voice-mute-btn").textContent = state.voiceMuted ? "🔇 Muted" : "🔊 Voice On";
        if (state.voiceMuted) stopSpeechOutput();
      });
    }
    if ($("voice-replay-btn")) {
      $("voice-replay-btn").addEventListener("click", () => {
        if (state.lastSpokenText) {
          state.voiceMuted = false;
          if ($("voice-mute-btn")) $("voice-mute-btn").textContent = "🔊 Voice On";
          speakBioVoiceResponse(state.lastSpokenText, state.lastSpokenLang);
        }
      });
    }
    if ($("voice-stop-btn")) {
      $("voice-stop-btn").addEventListener("click", stopSpeechOutput);
    }
    if ($("voice-persona-select")) {
      $("voice-persona-select").addEventListener("change", (e) => {
        state.voicePersona = e.target.value || "nova";
        if (state.lastSpokenText && !state.voiceMuted) {
          speakBioVoiceResponse(state.lastSpokenText, state.lastSpokenLang);
        }
      });
    }
    if ($("voice-speed-select")) {
      $("voice-speed-select").addEventListener("change", (e) => {
        state.voiceSpeed = Number(e.target.value) || 1.0;
      });
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }

    if ($("mic-btn")) $("mic-btn").addEventListener("click", toggleVoiceRecording);
    if ($("chat-form")) {
      $("chat-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const q = $("question-input") ? $("question-input").value : "";
        submitBioVoiceQuestion(q, "typed");
      });
    }
    if ($("mark-checked-sheet-btn")) {
      $("mark-checked-sheet-btn").addEventListener("click", () =>
        handleStudentVerificationCheck("Yes — checked with Activity Sheet")
      );
    }
    if ($("mark-checked-teacher-btn")) {
      $("mark-checked-teacher-btn").addEventListener("click", () =>
        handleStudentVerificationCheck("Yes — checked with Teacher")
      );
    }

    // Researcher Dashboard Controls
    if ($("save-study-config-btn")) {
      $("save-study-config-btn").addEventListener("click", async () => {
        const body = {
          studyPhase: $("cfg-study-phase").value,
          activeSession: $("cfg-active-session").value,
          officialPlantSpecies: $("cfg-official-plant").value,
          classAccessPin: $("cfg-class-pin").value.trim(),
          requirePin: $("cfg-require-pin").checked,
          strictAssignedOnly: $("cfg-strict-assigned").checked,
          requireConsentVerification: $("cfg-require-consent").checked,
          teacherPermissions: {
            viewActivityAndGuide: $("perm-teacher-guide").checked,
            accessSimulation: $("perm-teacher-sim").checked,
            monitorClassroomSession: $("perm-teacher-monitor").checked,
            recordObservations: $("perm-teacher-obs").checked,
            reviewFidelity: $("perm-teacher-fidelity").checked,
            viewAnonymizedLogs: $("perm-teacher-logs").checked,
          },
        };
        try {
          const res = await fetch(resolveApiUrl("/api/researcher/study-config"), {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${state.staffToken}`,
            },
            body: JSON.stringify(body),
          });
          if (res.ok) {
            const data = await res.json();
            Object.assign(state.studyConfig, data.studyConfig);
            const st = $("study-config-status");
            if (st) {
              st.hidden = false;
              st.textContent = "Study configuration and Teacher permissions saved.";
            }
          }
        } catch (_) {}
      });
    }

    const submitAiConfigAction = async (action) => {
      const st = $("ai-config-status");
      const keyInput = $("cfg-gemini-key");
      const modelSelect = $("cfg-gemini-model");
      const geminiApiKey = keyInput ? keyInput.value.trim() : "";
      const geminiModel = modelSelect ? modelSelect.value : "gemini-2.5-flash";

      if (st) {
        st.hidden = false;
        st.textContent = action === "clear" ? "Removing saved runtime Gemini key..." : "Saving Gemini AI configuration...";
      }

      try {
        const res = await fetch(resolveApiUrl("/api/researcher/ai-config"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${state.staffToken}`
          },
          body: JSON.stringify({ action, geminiApiKey, geminiModel })
        });
        const data = await res.json();
        if (!res.ok) {
          if (st) {
            st.hidden = false;
            st.textContent = data.error || "Unable to update AI provider settings.";
          }
          return;
        }
        if (keyInput) keyInput.value = "";
        if (data.aiStatus) {
          if (!state.dashboardData) state.dashboardData = {};
          state.dashboardData.aiStatus = data.aiStatus;
          renderDashboardUI();
        }
        if (st) {
          st.hidden = false;
          st.textContent = action === "clear"
            ? "Runtime Gemini key cleared. Built-in tutor engine is active unless an environment key is set."
            : `Gemini AI connected (${(data.aiStatus && data.aiStatus.model) || geminiModel}). Live student queries will now use Gemini.`;
        }
      } catch (_) {
        if (st) {
          st.hidden = false;
          st.textContent = "Could not reach the backend server to update AI settings.";
        }
      }
    };

    if ($("save-ai-config-btn")) {
      $("save-ai-config-btn").addEventListener("click", () => submitAiConfigAction("save"));
    }
    if ($("clear-ai-config-btn")) {
      $("clear-ai-config-btn").addEventListener("click", () => submitAiConfigAction("clear"));
    }

    if ($("validate-codes-btn")) {
      $("validate-codes-btn").addEventListener("click", async () => {
        try {
          const res = await fetch(resolveApiUrl("/api/researcher/validate-codes"), {
            method: "POST",
            headers: { Authorization: `Bearer ${state.staffToken}` },
          });
          if (res.ok) {
            const rep = await res.json();
            const b = $("code-validation-banner");
            if (b) {
              b.hidden = false;
              b.textContent = `200-Code Register Validated: ${rep.total} total codes | BV-001: ${rep.hasBV001} | BV-200: ${rep.hasBV200} | Duplicates: ${rep.duplicates} | Missing: ${rep.missingCount}`;
            }
          }
        } catch (_) {}
      });
    }

    ["participant-search-input", "participant-group-filter", "participant-status-filter"].forEach(
      (id) => {
        if ($(id)) $(id).addEventListener("input", renderParticipantsTable);
        if ($(id)) $(id).addEventListener("change", renderParticipantsTable);
      }
    );

    if ($("bulk-apply-btn")) {
      $("bulk-apply-btn").addEventListener("click", async () => {
        const startNo = Number($("bulk-start-no").value);
        const endNo = Number($("bulk-end-no").value);
        const status = $("bulk-status-select").value;
        try {
          const res = await fetch(resolveApiUrl("/api/researcher/participants"), {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${state.staffToken}`,
            },
            body: JSON.stringify({
              action: "bulk_assign",
              startNo,
              endNo,
              status,
              consentVerified: status === "Assigned",
              assentVerified: status === "Assigned",
            }),
          });
          if (res.ok) await loadResearcherDashboard();
        } catch (_) {}
      });
    }

    [
      "log-search-input",
      "log-sp-filter",
      "log-type-filter",
      "log-idea-filter",
      "toggle-synthetic-logs",
    ].forEach((id) => {
      if ($(id)) $(id).addEventListener("input", renderInteractionLogsTable);
      if ($(id)) {
        $(id).addEventListener("change", () => {
          renderInteractionLogsTable();
          renderAnalyticsBreakdown();
        });
      }
    });

    if ($("review-log-form")) {
      $("review-log-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const interactionId = $("review-log-id").value;
        const isSynthetic = $("toggle-synthetic-logs") && $("toggle-synthetic-logs").checked;
        try {
          const res = await fetch(resolveApiUrl("/api/logs"), {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${state.staffToken}`,
            },
            body: JSON.stringify({
              interactionId,
              isSynthetic,
              supportPoint: $("review-sp-select").value,
              requestType: $("review-type-select").value,
              ideaCode: $("review-idea-select").value,
              accuracyAndScope: $("review-accuracy-select").value,
              remarks: $("review-remarks-input").value,
              reason: "Researcher verification review",
            }),
          });
          if (res.ok) {
            closeModal("review-dialog");
            await loadResearcherDashboard();
          }
        } catch (_) {}
      });
    }

    if ($("monitoring-form")) {
      $("monitoring-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const fidelityItems = Array.from(document.querySelectorAll(".fidelity-item-sel")).map(
          (sel, i) => ({
            item: FIDELITY_ITEMS[i],
            rating: sel.value,
          })
        );
        try {
          const res = await fetch(resolveApiUrl("/api/researcher/monitoring"), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${state.staffToken}`,
            },
            body: JSON.stringify({
              sessionNo: $("mon-session-no").value,
              groupCondition: $("mon-group-condition").value,
              studentsPresent: $("mon-students-present").value,
              teacherFacilitator: $("mon-teacher-name").value,
              fidelityItems,
              issuesAndAdjustments: $("mon-issues-notes").value,
            }),
          });
          if (res.ok && $("monitoring-save-status")) {
            $("monitoring-save-status").textContent = "✓ Saved Appendix J observation record.";
          }
        } catch (_) {}
      });
    }

    if ($("export-logs-csv-btn")) {
      $("export-logs-csv-btn").addEventListener("click", handleExportLogsCsv);
    }
    if ($("export-participants-csv-btn")) {
      $("export-participants-csv-btn").addEventListener("click", handleExportParticipantsCsv);
    }
    if ($("export-summary-csv-btn")) {
      $("export-summary-csv-btn").addEventListener("click", handleExportParticipantsCsv);
    }
    if ($("export-excel-workbook-btn")) {
      $("export-excel-workbook-btn").addEventListener("click", handleExportExcelWorkbook);
    }
  }

  function initApp() {
    renderFidelityChecklist();
    bindAllEvents();
    loadPublicConfig();
    renderDataTablesAndGraph();
    showScreen("welcome");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
  } else {
    initApp();
  }
})();
