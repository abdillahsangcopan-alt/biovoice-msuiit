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
      lux: 1100,
      lampX: 310,
      coneOpacity: 0.64,
      heatWaveOpacity: 0.35,
      tempC: 26.0,
      rangesByPlant: {
        Hydrilla: [28, 34],
        Elodea: [23, 29],
        "Water Hyacinth": [1, 4],
      },
    },
    {
      key: "30",
      label: "30 cm (Medium Light)",
      shortLabel: "30 cm",
      lux: 550,
      lampX: 200,
      coneOpacity: 0.42,
      heatWaveOpacity: 0.12,
      tempC: 26.0,
      rangesByPlant: {
        Hydrilla: [15, 20],
        Elodea: [12, 17],
        "Water Hyacinth": [1, 3],
      },
    },
    {
      key: "40",
      label: "40 cm (Low Light)",
      shortLabel: "40 cm",
      lux: 280,
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
    "F2. Printed Student Activity Sheet (Appendix F) distributed to all students",
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
    lastSpokenText: "",
    lastSpokenLang: "en-PH",
    lastInteractionId: null,
    isListening: false,
    recognition: null,
    conversationMemory: {
      turnCount: 0,
      lastIdeaCode: "I1",
      lastSupportPoint: "sp1",
      lastSupportType: "hint",
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
    const phasePill = $("welcome-phase-pill");
    if (phasePill) {
      phasePill.textContent = `Phase: ${state.studyConfig.studyPhase} · ${state.studyConfig.activeSession}`;
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
    state.selectedDistance = cond.key;

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
      lightCone.style.opacity = String(cond.coneOpacity);
    }
    if (lampHalo) {
      lampHalo.style.opacity = cond.key === "dark" ? "0" : String(cond.coneOpacity);
    }
    if (lampBulb) {
      lampBulb.setAttribute("fill", cond.key === "dark" ? "#475569" : "#fde047");
    }
    if (lampTag) {
      lampTag.textContent =
        cond.key === "dark" ? "Lamp Off (0 lx)" : `${cond.shortLabel} (${cond.lux.toLocaleString()} lx)`;
    }
    if (heatWaves) {
      heatWaves.style.opacity = String(cond.heatWaveOpacity);
      heatWaves.setAttribute("transform", `translate(${cond.lampX - 420}, 0)`);
    }

    if ($("readout-light-condition")) {
      $("readout-light-condition").textContent = `${cond.shortLabel} · ${cond.lux.toLocaleString()} lx`;
    }
    if ($("readout-water-temp")) {
      $("readout-water-temp").textContent = `${cond.tempC.toFixed(1)} °C (Stabilized Buffer)`;
    }
  }

  function generateControlledTrialBubbleCount(plantSpecies, distKey) {
    const cond = LIGHT_CONDITIONS.find((c) => c.key === String(distKey)) || LIGHT_CONDITIONS[0];
    const range =
      (cond.rangesByPlant && cond.rangesByPlant[plantSpecies]) || cond.rangesByPlant.Hydrilla;
    const [minVal, maxVal] = range;
    const historyKey = `${plantSpecies}:${distKey}`;
    const prevCounts = state.trialVariationHistory[historyKey] || [];

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
  // 12. MULTI-TURN CONVERSATIONAL BIOVOICE DIALOGUE MANAGER (APPENDIX H)
  // ==========================================================================
  const IDEA_KNOWLEDGE_BASE = {
    I1: {
      title: "Need for light in photosynthesis",
      en: {
        H: "Think about what chlorophyll inside the chloroplasts captures from the lamp. Without light energy, can the light-dependent reactions split water ($\\text{H}_2\\text{O}$) to start photosynthesis?",
        C: "Light energy is absorbed by chlorophyll in the thylakoid membranes to excite electrons and split water molecules (photolysis). That is why illuminated plants actively release bubbles while unlit plants barely do.",
        E: "Photosynthesis begins with the light-dependent reactions in the thylakoid membranes. Chlorophyll absorbs photons from the lamp to split water ($\\text{H}_2\\text{O}$) into oxygen gas ($\\text{O}_2$), protons, and electrons, while generating ATP and NADPH. Compare your lit trials with your activity sheet!",
      },
      fil: {
        H: "Isipin kung ano ang sinasagap ng chlorophyll sa loob ng chloroplast mula sa lamp. Kapag walang light energy, mahahati ba ang tubig ($\\text{H}_2\\text{O}$) sa light-dependent reactions?",
        C: "Kailangan ng chlorophyll ang light energy sa thylakoid membrane upang hatiin ang water molecules (photolysis) at makagawa ng ATP at NADPH. Kaya kapag may ilaw, tuloy-tuloy ang paglabas ng oxygen bubbles.",
        E: "Sa light-dependent reactions sa thylakoid, sinasagap ng chlorophyll ang light energy upang hatiin ang $\\text{H}_2\\text{O}$ at maglabas ng oxygen gas ($\\text{O}_2$) habang bumubuo ng ATP at NADPH. Ikumpara ito sa iyong Student Activity Sheet!",
      },
      ceb: {
        H: "Hunahunaa unsay ginadakop sa chlorophyll sulod sa chloroplast gikan sa suga. Kon walay light energy, mabahin ba ang tubig ($\\text{H}_2\\text{O}$) sa light-dependent reactions?",
        C: "Gikinahanglan sa chlorophyll ang light energy sa thylakoid membrane aron mabahin ang water molecules (photolysis) ug makahimo og ATP ug NADPH. Mao nga adunay bula sa oxygen kon hayag ang suga.",
        E: "Sa light-dependent reactions sulod sa thylakoid, ginadakop sa chlorophyll ang light energy aron mabahin ang $\\text{H}_2\\text{O}$ ug mopagawas og oxygen gas ($\\text{O}_2$) samtang naghimo og ATP ug NADPH. I-tandi kini sa imong Activity Sheet!",
      },
    },
    I2: {
      title: "Bubble count as sign of rate",
      en: {
        H: "When water ($\\text{H}_2\\text{O}$) is split during the light-dependent reactions, which gas escapes from the cut stem as visible underwater bubbles?",
        C: "Each rising bubble is mostly oxygen gas ($\\text{O}_2$), a direct by-product of water photolysis in the thylakoids. Counting bubbles over 60 seconds gives us an observable indicator of how fast photosynthesis is running.",
        E: "Because oxygen gas ($\\text{O}_2$) is released whenever water molecules are split in the light-dependent reactions, a higher number of bubbles counted in 60 seconds indicates a faster rate of photosynthesis. Check how your bubble counts change across rows in your table!",
      },
      fil: {
        H: "Kapag hinati ang tubig ($\\text{H}_2\\text{O}$) sa light-dependent reactions, anong gas ang lumalabas sa tangkay ng halaman bilang mga bula?",
        C: "Ang bawat bula ay oxygen gas ($\\text{O}_2$) na by-product ng photolysis ng tubig sa thylakoid. Ang bilang ng bula sa loob ng 60 seconds ang nagsisilbing sukatan ng bilis (rate) ng photosynthesis.",
        E: "Dahil oxygen gas ($\\text{O}_2$) ang direktang produkto kapag hinahati ang $\\text{H}_2\\text{O}$ sa light-dependent reactions, mas maraming bubbles sa 60 seconds ay nangangahulugang mas mabilis ang photosynthesis rate. Suriin ang iyong data table!",
      },
      ceb: {
        H: "Kon mabahin ang tubig ($\\text{H}_2\\text{O}$) sa light-dependent reactions, unsang gas ang mogawas sa tangkay sa tanom isip mga bula sa tubig?",
        C: "Ang matag bula mao ang oxygen gas ($\\text{O}_2$) nga by-product sa photolysis sa tubig sulod sa thylakoid. Ang ihap sa bula sulod sa 60 seconds nagpakita kung unsa kapaspas ang rate sa photosynthesis.",
        E: "Tungod kay oxygen gas ($\\text{O}_2$) ang mogawas matag bahin sa $\\text{H}_2\\text{O}$ sa light-dependent reactions, ang mas daghang bula sulod sa 60 seconds nagpasabot nga mas paspas ang photosynthesis rate. Tan-awa ang imong data table!",
      },
    },
    I3: {
      title: "Lamp distance and light strength",
      en: {
        H: "Compare the light beam at 10 cm versus 40 cm. As the lamp moves farther from the beaker, does the light energy reaching the leaves become more concentrated or more spread out?",
        C: "Moving the lamp from 10 cm to 40 cm spreads the photons over a wider area, reducing light intensity (from 2,500 lx down to 280 lx). Fewer photons hitting chlorophyll mean slower photolysis and fewer oxygen bubbles.",
        E: "Light intensity decreases rapidly as lamp distance increases. At 10 cm (2,500 lx), chlorophyll receives abundant photons to drive electron transport and release ~39–45 bubbles/60s, whereas at 40 cm (280 lx) photon supply drops sharply, producing only ~6–10 bubbles/60s.",
      },
      fil: {
        H: "ikumpara ang sinag ng lamp sa 10 cm at sa 40 cm. Kapag inilalayo ang lamp sa beaker, lumalakas ba o humihina ang light intensity na tumatama sa dahon?",
        C: "Kapag inilayo ang lamp mula 10 cm papuntang 40 cm, kumakalat ang liwanag kaya bumababa ang illuminance (mula 2,500 lx hanggang 280 lx). Mas kaunting photons ang nasasagap ng chlorophyll kaya bumababa ang bilang ng bubbles.",
        E: "Bumababa ang light intensity kapag lumalayo ang lamp. Sa 10 cm (2,500 lx), maraming photons ang nagpapagana sa thylakoid (~39–45 bubbles/60s), samantalang sa 40 cm (280 lx) ay mahina na ang liwanag kaya ~6–10 bubbles/60s na lang ang lumalabas.",
      },
      ceb: {
        H: "Itandi ang kahayag sa suga sa 10 cm ug sa 40 cm. Kon ipalayo ang suga gikan sa beaker, magkakusog ba o magkahinay ang light intensity nga moigo sa dahon?",
        C: "Kon ipalayo ang suga gikan sa 10 cm ngadto sa 40 cm, mokatag ang kahayag ug moubos ang illuminance (gikan 2,500 lx ngadto sa 280 lx). Mas gamay nga photons ang madawat sa chlorophyll mao nga mokunhod ang bula.",
        E: "Magkahinay ang light intensity samtang magkalayo ang suga. Sa 10 cm (2,500 lx), daghang photons ang modasig sa thylakoid (~39–45 bubbles/60s), apan sa 40 cm (280 lx) hinay na ang kahayag (~6–10 bubbles/60s). I-tandi kini sa imong graph!",
      },
    },
    I4: {
      title: "Dark setup as comparison",
      en: {
        H: "Why do scientists include a Dark Control (0 lx) where the lamp is completely off? What does that prove about the bubbles you counted in the lit trials?",
        C: "The Dark Control (0 lx) serves as our baseline comparison. Because bubble production drops to nearly zero (0–2 bubbles/60s) in the dark, it confirms that the bubbles in the lit trials are caused by light-driven photosynthesis.",
        E: "In an experiment, a Dark Control (0 lx) isolates the effect of light. When the lamp is off while temperature (26.0 °C) and $\\text{NaHCO}_3$ stay constant, photolysis stops and oxygen bubbles drop to 0–2 per 60 seconds—proving light is essential for oxygen release.",
      },
      fil: {
        H: "Bakit kaya mahalagang magsama ng Dark Control (0 lx) kung saan patay ang lamp? Ano ang pinatutunayan nito tungkol sa mga bubbles na nabilang mo noong may ilaw?",
        C: "Ang Dark Control (0 lx) ang ating baseline comparison. Dahil halos zero (0–2 bubbles/60s) ang lumalabas sa dilim, pinatutunayan nitong ang mga bula ay talagang bunga ng light-dependent reactions.",
        E: "Ginagamit ang Dark Control (0 lx) upang patunayan na liwanag ang sanhi ng paglabas ng oxygen. Kapag patay ang ilaw habang pareho pa rin ang 26.0 °C at $\\text{NaHCO}_3$, humihinto ang photolysis kaya 0–2 bubbles na lang ang lumalabas.",
      },
      ceb: {
        H: "Ngano man nga importante ang Dark Control (0 lx) diin palong ang suga? Unsay gipamatud-an niini bahin sa mga bula nga imong naihap sa dihang nagsiga ang suga?",
        C: "Ang Dark Control (0 lx) mao ang atong baseline comparison. Tungod kay halos sero (0–2 bubbles/60s) ang bula sa ngitngit, nagpamatuod kini nga ang bula nagagikan gyud sa light-driven photosynthesis.",
        E: "Ang Dark Control (0 lx) gigamit aron ipakita nga kahayag ang hinungdan sa pagpagawas og oxygen. Kon palong ang suga samtang pareho ang 26.0 °C ug $\\text{NaHCO}_3$, mohunong ang photolysis ug mahimong 0–2 bubbles na lang.",
      },
    },
    I5: {
      title: "High-light leveling off",
      en: {
        H: "Look closely at the curve between 20 cm and 10 cm: Even when light intensity more than doubles (1,100 lx to 2,500 lx), why doesn't the bubble count double forever?",
        C: "At high light intensity, chlorophyll is already working near capacity, so another factor—such as dissolved $\\text{CO}_2$ supply or Calvin cycle enzyme speed (RuBisCO)—becomes the limiting factor, causing the curve to level off.",
        E: "This plateau is called light saturation. At 10 cm, the light-dependent reactions produce plenty of ATP and NADPH, but the overall rate of photosynthesis is limited by how fast Calvin cycle enzymes and dissolved $\\text{CO}_2$ (from 0.2% $\\text{NaHCO}_3$) can fix carbon in the stroma.",
      },
      fil: {
        H: "Tingnan ang pagitan ng 20 cm at 10 cm sa graph: Kahit mahigit doble ang itinaas ng lux (1,100 lx tungong 2,500 lx), bakit hindi nag-doble nang tuloy-tuloy ang bilang ng bubbles?",
        C: "Sa napakataas na liwanag, halos puno na ang kapasidad ng chloroplast, kaya ibang salik na—tulad ng dissolved $\\text{CO}_2$ o bilis ng enzymes sa Calvin cycle—ang nagiging limiting factor.",
        E: "Tinatawag itong light saturation. Sa 10 cm, sapat na ang liwanag para sa ATP at NADPH, ngunit nililimitahan na ng dami ng dissolved $\\text{CO}_2$ at bilis ng Calvin cycle enzymes sa stroma ang kabuuang bilis ng photosynthesis kaya nagle-level off ang graph.",
      },
      ceb: {
        H: "Tan-awa ang kalainan sa 20 cm ug 10 cm sa graph: Bisan og kapin sa doble ang pagsaka sa kahayag (1,100 lx ngadto sa 2,500 lx), nganong dili man mo-doble sa walay katapusan ang ihap sa bula?",
        C: "Sa kusog kaayo nga kahayag, hapit na mapuno ang kapasidad sa chloroplast, busa laing factor—sama sa dissolved $\\text{CO}_2$ o katulinon sa Calvin cycle enzymes—ang mahimong limiting factor.",
        E: "Gitawag kini og light saturation. Sa 10 cm, abunda na ang ATP ug NADPH gikan sa kahayag, apan ang kinatibuk-ang rate sa photosynthesis gilimitahan na sa suplay sa $\\text{CO}_2$ ug sa enzymes sa Calvin cycle sulod sa stroma.",
      },
    },
    I6: {
      title: "Repeated trials and mean",
      en: {
        H: "Notice that Trial 1, Trial 2, and Trial 3 at the same distance vary slightly (for example, 41, 44, and 40 bubbles). Why do we average 3 trials instead of trusting just 1 run?",
        C: "Biological specimens naturally fluctuate slightly from minute to minute. Conducting 3 repeated trials and calculating the Mean reduces random counting variation and gives a more reliable rate.",
        E: "Living shoots like Hydrilla show small natural variations in bubble nucleation (e.g., 40 vs. 43 bubbles in 60 seconds). Recording 3 trials per condition and computing the Mean ($(\\text{T1}+\\text{T2}+\\text{T3})\\div 3$) ensures your graph reflects the true biological trend.",
      },
      fil: {
        H: "Pansinin na bahagyang nagkakaiba ang Trial 1, Trial 2, at Trial 3 sa iisang distansya (hal. 41, 44, at 40 bubbles). Bakit kaya kailangang kumuha ng 3 trials at kunin ang Mean?",
        C: "Normal sa buhay na halaman ang bahagyang pagbabago-bago ng bula bawat minuto. Ang pagkuha ng 3 trials at pagkwenta ng Mean ay nagpapababa ng random error upang maging mas maaasahan ang iyong data.",
        E: "May natural na biological variation ang paglabas ng bula sa Hydrilla. Sa pamamagitan ng 3 repeated trials at pagkuha ng Mean ($(\\text{T1}+\\text{T2}+\\text{T3})\\div 3$), nagiging mas tumpak at siyentipiko ang iyong paghahambing sa bawat distansya.",
      },
      ceb: {
        H: "ikamatikod nga adunay gamayng kalainan ang Trial 1, Trial 2, ug Trial 3 sa parehong distansya (pananglitan 41, 44, ug 40 ka bula). Nganong magbuhat man ta og 3 ka trials ug kuhaon ang Mean?",
        C: "Normal sa buhing tanom ang gamay nga kausaban matag minuto. Ang paghimo og 3 ka repeated trials ug pagkuha sa Mean makapakunhod sa random error aron mas kasaligan ang imong resulta.",
        E: "Ang buhing tanom sama sa Hydrilla adunay natural nga biological variation sa pagpagawas og bula. Ang pagrekord og 3 ka trials ug pagkuwenta sa Mean ($(\\text{T1}+\\text{T2}+\\text{T3})\\div 3$) naghatag og mas tukma nga representante sa rate sa photosynthesis.",
      },
    },
    I7: {
      title: "Constant variables / fair test",
      en: {
        H: "If water bath temperature or $\\text{NaHCO}_3$ concentration changed at the same time as lamp distance, would we know which variable caused the bubble count to change?",
        C: "To make this a fair test, we change only the independent variable (lamp distance) while keeping water temperature ($26.0\\text{ }^\\circ\\text{C}$), $\\text{NaHCO}_3$ ($0.2\\%$), plant shoot, and observation time ($60\\text{ seconds}$) constant.",
        E: "Notice the radiant warmth waves near the lamp versus the submerged thermometer reading ($26.0\\text{ }^\\circ\\text{C}$). By stabilizing water temperature at $26.0\\text{ }^\\circ\\text{C}$ and $\\text{NaHCO}_3$ at $0.2\\%$, we ensure changes in bubble rate are caused solely by light intensity.",
      },
      fil: {
        H: "Kung sabay na nagbago ang temperatura ng tubig at ang distansya ng lamp, malalaman ba natin kung alin talaga ang nagpabago sa dami ng bubbles?",
        C: "Para maging fair test ang eksperimento, distansya lang ng lamp (independent variable) ang binabago habang pinananatiling constant ang temperatura ($26.0\\text{ }^\\circ\\text{C}$), $0.2\\%\\text{ NaHCO}_3$, halaman, at $60\\text{ seconds}$ timer.",
        E: "Kahit may visual heat waves malapit sa lamp, nananatiling $26.0\\text{ }^\\circ\\text{C}$ ang water bath at $0.2\\%$ ang $\\text{NaHCO}_3$. Dahil constant ang mga ito, sigurado tayong light intensity lang ang dahilan ng pagbabago sa bubble count.",
      },
      ceb: {
        H: "Kon dungan nga mausab ang temperatura sa tubig ug ang gilay-on sa suga, mahibal-an ba nato kung unsa gyud ang nakapausab sa ihap sa bula?",
        C: "Aron mahimong fair test ang eksperimento, ang gilay-on ra sa suga (independent variable) ang usbon samtang kanunay nga constant ang temperatura ($26.0\\text{ }^\\circ\\text{C}$), $0.2\\%\\text{ NaHCO}_3$, tanom, ug $60\\text{ seconds}$ nga oras.",
        E: "Bisan og adunay visual heat waves duol sa suga, nagpabilin nga $26.0\\text{ }^\\circ\\text{C}$ ang water bath ug $0.2\\%$ ang $\\text{NaHCO}_3$. Tungod kay constant kini, segurado kita nga ang light intensity ra ang nakaapekto sa rate sa bula.",
      },
    },
    I8: {
      title: "Light energy to chemical energy (glucose)",
      en: {
        H: "While oxygen bubbles leave the thylakoids, what happens to the ATP and NADPH produced during the light-dependent reactions?",
        C: "ATP and NADPH carry chemical energy from the thylakoid membranes into the stroma, where the Calvin cycle uses them to fix carbon dioxide ($\\text{CO}_2$) into glucose ($\\text{C}_6\\text{H}_{12}\\text{O}_6$).",
        E: "Photosynthesis links two stages inside the chloroplast: (1) Light-dependent reactions in the thylakoids capture light to split $\\text{H}_2\\text{O}$ (releasing $\\text{O}_2$ bubbles) and make ATP and NADPH; (2) The Calvin cycle in the stroma uses that ATP and NADPH to build glucose from $\\text{CO}_2$.",
      },
      fil: {
        H: "Habang lumalabas ang oxygen bubbles mula sa thylakoid, saan naman ginagamit ng halaman ang ATP at NADPH na nabuo sa light-dependent reactions?",
        C: "Dinadala ang ATP at NADPH papunta sa stroma, kung saan ginagamit ang mga ito ng Calvin cycle upang gawing glucose ($\\text{C}_6\\text{H}_{12}\\text{O}_6$) ang carbon dioxide ($\\text{CO}_2$).",
        E: "May dalawang magkaugnay na yugto sa chloroplast: (1) Sa thylakoid, hinahati ng light-dependent reactions ang $\\text{H}_2\\text{O}$ (kaya may $\\text{O}_2$ bubbles) at bumubuo ng ATP at NADPH; (2) Sa stroma, ginagamit ng Calvin cycle ang ATP at NADPH upang makabuo ng glucose mula sa $\\text{CO}_2$.",
      },
      ceb: {
        H: "Samtang nagagawas ang oxygen bubbles gikan sa thylakoid, asa man gamiton sa tanom ang ATP ug NADPH nga naporma sa light-dependent reactions?",
        C: "Ang ATP ug NADPH dad-on ngadto sa stroma aron gamiton sa Calvin cycle sa paghimo og glucose ($\\text{C}_6\\text{H}_{12}\\text{O}_6$) gikan sa carbon dioxide ($\\text{CO}_2$).",
        E: "Duha ka hugna ang nagkonektar sulod sa chloroplast: (1) Sa thylakoid, ang light-dependent reactions nagbahin sa $\\text{H}_2\\text{O}$ (nga mopagawas og $\\text{O}_2$ bubbles) ug naghimo og ATP ug NADPH; (2) Sa stroma, ang Calvin cycle mogamit sa ATP ug NADPH aron makahimo og glucose.",
      },
    },
    I9: {
      title: "Value of photosynthesis to organisms",
      en: {
        H: "Think beyond the beaker: How do the two main products of photosynthesis—oxygen gas ($\\text{O}_2$) and glucose ($\\text{C}_6\\text{H}_{12}\\text{O}_6$)—support nearly all living organisms on Earth?",
        C: "Photosynthesis provides the organic food (glucose) at the base of food webs and replenishes the dissolved and atmospheric oxygen ($\\text{O}_2$) needed for aerobic cellular respiration.",
        E: "Every oxygen bubble rising from Hydrilla or Elodea represents the process that oxygenates aquatic habitats and Earth's atmosphere, while the glucose synthesized in the Calvin cycle stores solar energy as biomass for food chains and ecosystems.",
      },
      fil: {
        H: "Isipin ang labas ng laboratoryo: Paano sinusuportahan ng dalawang produkto ng photosynthesis—oxygen ($\\text{O}_2$) at glucose ($\\text{C}_6\\text{H}_{12}\\text{O}_6$)—ang halos lahat ng may buhay sa mundo?",
        C: "Ang photosynthesis ang gumagawa ng glucose na pundasyon ng food web at nagbibigay ng oxygen ($\\text{O}_2$) sa tubig at hangin na kailangan sa cellular respiration.",
        E: "Ang bawat oxygen bubble mula sa Hydrilla ay mahalaga sa mga isda at iba pang organismo para sa aerobic respiration, habang ang glucose na binubuo nito ay nagsisilbing pangunahing pinagkukunan ng enerhiya sa buong ecosystem.",
      },
      ceb: {
        H: "Hunahunaa gawas sa beaker: Giunsa pagsuporta sa duha ka produkto sa photosynthesis—oxygen ($\\text{O}_2$) ug glucose ($\\text{C}_6\\text{H}_{12}\\text{O}_6$)—ang halos tanang buhing organismo sa kalibutan?",
        C: "Ang photosynthesis mao ang naghimo sa glucose nga pundasyon sa food web ug naghatag og oxygen ($\\text{O}_2$) sa tubig ug kahanginan alang sa cellular respiration.",
        E: "Ang matag bula sa oxygen gikan sa Hydrilla naghatag og hangin sa mga organismo sa tubig ug kalibutan, samtang ang glucose nga naporma sa Calvin cycle mao ang tinubdan sa enerhiya sa tanang food chains.",
      },
    },
  };

  function classifyQuestionAndConversationalIntent(rawQuestion) {
    const q = String(rawQuestion || "").toLowerCase();

    // 1. Check if student is asking for direct test/quiz answers (Appendix H strict guardrail)
    if (
      /\b(test answer|quiz answer|form a|form b|pretest|posttest|what is the letter|correct letter|choose a b c d|answer key|sagot sa test|tubag sa test)\b/i.test(
        q
      )
    ) {
      return { intent: "test_refusal", ideaCode: state.conversationMemory.lastIdeaCode || "I1" };
    }

    // 2. Check if completely off-topic (unrelated to biology / photosynthesis / experiment)
    if (
      /\b(basketball|valorant|mobile legends|tiktok|celebrity|movie|weather tomorrow|crypto|homework in math|calculus|world war)\b/i.test(
        q
      )
    ) {
      return { intent: "off_topic", ideaCode: state.conversationMemory.lastIdeaCode || "I1" };
    }

    // 3. Check if question is specifically about the 3 aquatic plants (Water Hyacinth vs Hydrilla vs Elodea)
    if (/\b(hyacinth|water hyacinth|eichhornia|floating|lutang|naglutaw|elodea|compare plant|roots)\b/i.test(q)) {
      return { intent: "plant_comparison", ideaCode: "I2" };
    }

    // 4. Check if conversational follow-up ("Why does that happen?", "Explain in simpler words", "Tell me more", "Ngano man?", "Bakit ganun?")
    const isShortFollowUp =
      q.split(/\s+/).length <= 8 &&
      /\b(why|how come|explain more|simpler|again|what do you mean|elaborate|ngano man|ngano diay|unsa pasabot|bakit ganun|bakit po|paano yun|mas simple|more detail)\b/i.test(
        q
      );
    if (isShortFollowUp && state.conversationMemory.turnCount > 0) {
      return {
        intent: "follow_up_expand",
        ideaCode: state.conversationMemory.lastIdeaCode || "I1",
      };
    }

    // 5. Map question keywords to Idea Codes I1–I9
    if (/\b(dark|ngitngit|dilim|0 lx|lamp off|palong|patay ang ilaw|control setup)\b/i.test(q)) {
      return { intent: "concept", ideaCode: "I4" };
    }
    if (
      /\b(level off|plateau|saturat|limiting|double|10 cm and 20 cm|stop increasing|limit)\b/i.test(
        q
      )
    ) {
      return { intent: "concept", ideaCode: "I5" };
    }
    if (
      /\b(trial|3 trials|three trials|mean|average|vary|variation|magkaiba|lahi-lahi)\b/i.test(q)
    ) {
      return { intent: "concept", ideaCode: "I6" };
    }
    if (
      /\b(constant|fair test|temperature|26|thermometer|heat|nahco3|bicarbonate|init)\b/i.test(q)
    ) {
      return { intent: "concept", ideaCode: "I7" };
    }
    if (/\b(calvin|stroma|atp|nadph|glucose|sugar|chemical energy|thylakoid)\b/i.test(q)) {
      return { intent: "concept", ideaCode: "I8" };
    }
    if (
      /\b(ecosystem|food web|food chain|environment|important|value|organisme|halaga|hinungdanon)\b/i.test(
        q
      )
    ) {
      return { intent: "concept", ideaCode: "I9" };
    }
    if (/\b(distance|10 cm|20 cm|30 cm|40 cm|farther|closer|duol|layo|malapit|malayo|lux)\b/i.test(q)) {
      return { intent: "concept", ideaCode: "I3" };
    }
    if (/\b(bubble|bula|oxygen|o2|gas|count|rate)\b/i.test(q)) {
      return { intent: "concept", ideaCode: "I2" };
    }
    if (/\b(light|chlorophyll|photon|sunlight|kahayag|liwanag|predict)\b/i.test(q)) {
      return { intent: "concept", ideaCode: "I1" };
    }

    // Fallback to Support Point default Idea Code
    const spDefaultMap = {
      sp1: "I1",
      sp2: "I7",
      sp3: "I3",
      sp4: "I5",
      sp5: "I8",
      sp6: "I9",
    };
    return {
      intent: "concept",
      ideaCode: spDefaultMap[state.supportPoint] || "I1",
    };
  }

  function buildSimulationContextAddendum(langKey) {
    const activeTable = getActiveSimTable();
    const curTrials = activeTable[state.selectedDistance] || [null, null, null];
    const mean = computeMean(curTrials);
    const distLabel =
      state.selectedDistance === "dark" ? "Dark Control (0 lx)" : `${state.selectedDistance} cm`;

    if (mean !== null) {
      if (langKey === "fil") {
        return ` Sa iyong kasalukuyang data para sa ${state.selectedPlant} sa ${distLabel}, ang iyong Mean ay ${mean.toFixed(1)} bubbles/60s.`;
      }
      if (langKey === "ceb") {
        return ` Sa imong kasamtangang data alang sa ${state.selectedPlant} sa ${distLabel}, ang imong Mean kay ${mean.toFixed(1)} bubbles/60s.`;
      }
      return ` Looking at your recorded data for ${state.selectedPlant} at ${distLabel}, your current Mean is ${mean.toFixed(1)} bubbles/60s.`;
    }
    return "";
  }

  function generateConversationalBioVoiceReply(questionText, langCode) {
    const langKey = langCode === "fil-PH" ? "fil" : langCode === "ceb-PH" ? "ceb" : "en";
    const classification = classifyQuestionAndConversationalIntent(questionText);
    const ideaCode = classification.ideaCode;
    const reqMap = { hint: "H", clarification: "C", explanation: "E" };
    let targetTier = reqMap[state.supportType] || "H";

    // Guardrail 1: Direct test/quiz answer refusal
    if (classification.intent === "test_refusal") {
      const refusals = {
        en: "I can't give direct test or worksheet answers, but let's reason through the biology together! Tell me which light condition or chloroplast process you are comparing, and I'll give you a helpful hint.",
        fil: "Hindi ako maaaring magbigay ng direktang sagot sa pagsusulit o worksheet, ngunit pwede nating pag-isipan nang magkasama! Sabihin mo kung aling light condition ang sinusuri mo para mabigyan kita ng hint.",
        ceb: "Dili ko makahatag og direktang tubag sa test o worksheet, apan mahimo natong tun-an ang konsepto! Sultihi ko kung unsang light condition ang imong gi-analisar aron mahatagan tika og hint.",
      };
      return {
        reply: refusals[langKey],
        ideaCode,
        actualType: "H",
        hintFirst: true,
      };
    }

    // Guardrail 2: Off-topic redirect
    if (classification.intent === "off_topic") {
      const redirects = {
        en: "I'm your BioVoice Biology companion, so I focus on our photosynthesis investigation! Right now you're on " +
          ACTIVITY_STEPS[state.currentStepIndex].partTitle +
          ". Would you like a hint about how lamp distance affects oxygen bubble production?",
        fil: "Ako ang iyong BioVoice Biology companion kaya nakatuon tayo sa photosynthesis experiment! Nasa " +
          ACTIVITY_STEPS[state.currentStepIndex].partTitle +
          " ka ngayon. Gusto mo ba ng hint kung paano nakakaapekto ang distansya ng lamp sa oxygen bubbles?",
        ceb: "Ako ang imong BioVoice Biology companion busa nakapokus ta sa atong photosynthesis investigation! Anaa ka karon sa " +
          ACTIVITY_STEPS[state.currentStepIndex].partTitle +
          ". Gusto ba ka og hint kung giunsa pag-apekto sa gilay-on sa suga ang bula sa oxygen?",
      };
      return {
        reply: redirects[langKey],
        ideaCode,
        actualType: "H",
        hintFirst: true,
      };
    }

    // Special Contextual Topic: Comparing Hydrilla, Elodea, and Floating Water Hyacinth
    if (classification.intent === "plant_comparison") {
      const plantReplies = {
        en: "Great observation comparing the three aquatic plants! Hydrilla and Elodea are fully submerged macrophytes, so the oxygen ($\\text{O}_2$) produced in their leaves escapes into the water as countable bubbles. Water Hyacinth (*Eichhornia crassipes*), however, floats at the water surface with aerial leaves—so most of its oxygen diffuses directly into the air through stomata rather than forming underwater bubbles!",
        fil: "Magandang obserbasyon sa paghahambing ng tatlong halaman! Ang Hydrilla at Elodea ay nakalubog sa tubig (submerged), kaya ang oxygen ($\\text{O}_2$) mula sa kanilang dahon ay lumalabas bilang mga bula sa tubig. Ang Water Hyacinth (*Eichhornia crassipes*) naman ay nakalutang sa ibabaw at nasa hangin ang mga dahon, kaya sa stomata sa hangin lumalabas ang karamihan ng oxygen nito!",
        ceb: "Nindot kaayo nga obserbasyon sa pagtandi sa tulo ka tanom! Ang Hydrilla ug Elodea kay nakalunod sa tubig (submerged), mao nga ang oxygen ($\\text{O}_2$) gikan sa ilang dahon mogawas isip maihap nga bula sa tubig. Apan ang Water Hyacinth (*Eichhornia crassipes*) naglutaw sa ibabaw sa tubig ug ang iyang dahon naa sa hangin—mao nga sa stomata sa hangin mogawas ang kadaghanang oxygen niini!",
      };
      state.conversationMemory.turnCount += 1;
      state.conversationMemory.lastIdeaCode = "I2";
      state.conversationMemory.lastSupportType = targetTier;
      return {
        reply: plantReplies[langKey],
        ideaCode: "I2",
        actualType: targetTier,
        hintFirst: targetTier === "H",
      };
    }

    // Multi-turn follow-up escalation: if asking a follow-up ("Why does that happen?") or repeating the same concept, step up H -> C -> E
    let followUpPrefix = "";
    if (
      classification.intent === "follow_up_expand" ||
      (state.conversationMemory.turnCount > 0 && state.conversationMemory.lastIdeaCode === ideaCode)
    ) {
      const prevTier = state.conversationMemory.lastSupportType || "H";
      if (prevTier === "H") targetTier = "C";
      else if (prevTier === "C") targetTier = "E";
      else targetTier = "E";

      const prefixes = {
        en: "Building on your previous question: ",
        fil: "Karugtong ng tanong mo kanina: ",
        ceb: " Sumpay sa imong pangutana ganina: ",
      };
      followUpPrefix = prefixes[langKey];
    }

    const entry = IDEA_KNOWLEDGE_BASE[ideaCode] || IDEA_KNOWLEDGE_BASE.I1;
    const baseText = (entry[langKey] && entry[langKey][targetTier]) || entry.en[targetTier];
    const simAddendum = targetTier !== "H" ? buildSimulationContextAddendum(langKey) : "";

    const finalReply = `${followUpPrefix}${baseText}${simAddendum}`.trim();

    state.conversationMemory.turnCount += 1;
    state.conversationMemory.lastIdeaCode = ideaCode;
    state.conversationMemory.lastSupportPoint = state.supportPoint;
    state.conversationMemory.lastSupportType = targetTier;
    state.conversationMemory.lastQuestion = questionText;
    state.conversationMemory.lastReply = finalReply;

    return {
      reply: finalReply,
      ideaCode,
      actualType: targetTier,
      hintFirst: targetTier === "H",
    };
  }

  function initBioVoiceGreeting() {
    const stream = $("chat-messages");
    if (!stream) return;
    stream.innerHTML = "";
    state.conversationMemory = {
      turnCount: 0,
      lastIdeaCode: "I1",
      lastSupportPoint: state.supportPoint,
      lastSupportType: "hint",
      lastQuestion: "",
      lastReply: "",
      messages: [],
    };

    const greeting =
      state.isSandbox
        ? "Hi! I'm BioVoice in Sandbox Demonstration Mode. Ask me any question or follow-up about the photosynthesis setup in English, Filipino, or Cebuano—I'll automatically detect your language and guide you step by step!"
        : `Hi ${state.participantCode}! I'm BioVoice, your Grade 11 Biology voice companion. Ask me anything about the photosynthesis experiment in English, Filipino, or Cebuano—I'll start with a helpful hint and we can talk through your observations together!`;

    appendChatBubble("assistant", greeting, "BioVoice · Ready (Auto Language Detection)");
    renderPromptChips();
  }

  function appendChatBubble(role, text, metaLabel) {
    const stream = $("chat-messages");
    if (!stream) return;
    const div = document.createElement("div");
    div.className = `chat-bubble ${role}`;
    const safeHtml = String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
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
        "Which distance will make the most bubbles?",
        "Why does the plant need light?",
        "Ngano man nga adunay bubbles ang Hydrilla?",
        "Bakit kailangan ng liwanag sa photosynthesis?",
      ],
      sp2: [
        "What are our constant variables?",
        "Why do we run 3 trials per distance?",
        "Why is water temperature kept at 26.0 °C?",
      ],
      sp3: [
        "Why did bubbles decrease at 40 cm?",
        "Why does Water Hyacinth make fewer underwater bubbles?",
        "Unsa ang kalahian sa 10 cm ug 40 cm?",
      ],
      sp4: [
        "Why do we include the Dark Control?",
        "Why does the graph level off between 20 cm and 10 cm?",
        "Why does that happen?",
      ],
      sp5: [
        "How do ATP and NADPH help the Calvin cycle?",
        "Why is photosynthesis important to ecosystems?",
      ],
      sp6: [
        "How should I summarize my trend using the mean?",
        "Can you explain that in simpler words?",
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

    // 2. Query /api/chat (supports live LLM if configured + conversational Appendix H engine)
    let finalReplyObj = null;
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
          simulationContext: {
            selectedPlant: state.selectedPlant,
            selectedDistance: state.selectedDistance,
            currentStep: stepObj.partTitle,
          },
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
        finalReplyObj = {
          reply: data.reply,
          ideaCode: cls.ideaCode,
          actualType: state.supportType === "explanation" ? "E" : state.supportType === "clarification" ? "C" : "H",
          hintFirst: state.supportType === "hint",
        };
      }
    } catch (_) {
      // Offline / static host uses local conversational engine
    }

    if (!finalReplyObj) {
      finalReplyObj = generateConversationalBioVoiceReply(question, state.lastDetectedLanguage);
    }

    state.conversationMemory.messages.push({ role: "assistant", text: finalReplyObj.reply });

    const typeLabels = { H: "Hint (H)", C: "Clarification (C)", E: "Explanation (E)" };
    appendChatBubble(
      "assistant",
      finalReplyObj.reply,
      `BioVoice · ${stepObj.spCode} · ${typeLabels[finalReplyObj.actualType] || "Hint"} · ${finalReplyObj.ideaCode} (${IDEA_CATALOG[finalReplyObj.ideaCode] || ""}) · ${state.lastDetectedLanguageLabel}`
    );

    // 3. Speak response out loud if voice is not muted
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
      .replace(/\$\\text\{CO\}_2\$/g, "carbon dioxide")
      .replace(/CO₂/g, "carbon dioxide")
      .replace(/\$\\text\{H\}_2\\text\{O\}\$/g, "water")
      .replace(/H₂O/g, "water")
      .replace(/\$\\text\{O\}_2\$/g, "oxygen")
      .replace(/O₂/g, "oxygen")
      .replace(/\$\\text\{C\}_6\\text\{H\}_\{12\}\\text\{O\}_6\$/g, "glucose")
      .replace(/C₆H₁₂O₆/g, "glucose")
      .replace(/\$\\text\{NaHCO\}_3\$/g, "sodium bicarbonate")
      .replace(/NaHCO₃/g, "sodium bicarbonate")
      .replace(/\$26\.0\\text\{ \}\^\\circ\\text\{C\}\$/g, "26 degrees Celsius")
      .replace(/26\.0 °C/g, "26 degrees Celsius")
      .replace(/\$0\.2\\%\$/g, "0.2 percent")
      .replace(/\$60\\text\{ seconds\}\$/g, "60 seconds")
      .replace(/[*_`~]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function selectBestVoice(langCode) {
    if (!("speechSynthesis" in window)) return null;
    const voices = window.speechSynthesis.getVoices() || [];
    if (!voices.length) return null;

    if (langCode === "fil-PH" || langCode === "ceb-PH") {
      const phVoice = voices.find((v) => /fil|tl|ph/i.test(v.lang) || /filipino|tagalog|philippines/i.test(v.name));
      if (phVoice) return phVoice;
    }
    const naturalEn = voices.find(
      (v) =>
        /en/i.test(v.lang) &&
        /natural|samantha|ava|allison|google|microsoft|neural|aria|jenny/i.test(v.name)
    );
    return naturalEn || voices.find((v) => /en/i.test(v.lang)) || voices[0];
  }

  function speakBioVoiceResponse(text, langCode) {
    const clean = cleanTextForNaturalSpeech(text);
    state.lastSpokenText = clean;
    state.lastSpokenLang = langCode || "en-PH";

    if (state.voiceMuted || !("speechSynthesis" in window) || !clean) return;

    window.speechSynthesis.cancel();
    const orb = $("bv-orb-indicator");
    if (orb) orb.classList.add("is-speaking");

    const utterance = new SpeechSynthesisUtterance(clean);
    const chosenVoice = selectBestVoice(state.lastSpokenLang);
    if (chosenVoice) utterance.voice = chosenVoice;
    utterance.lang = state.lastSpokenLang === "en-PH" ? "en-US" : "fil-PH";
    utterance.rate = Number(state.voiceSpeed) || 1.0;
    utterance.pitch = 1.02;

    utterance.onend = () => {
      if (orb) orb.classList.remove("is-speaking");
    };
    utterance.onerror = () => {
      if (orb) orb.classList.remove("is-speaking");
    };

    window.speechSynthesis.speak(utterance);
  }

  function stopSpeechOutput() {
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
    if ($("teacher-phase-readout")) $("teacher-phase-readout").textContent = state.studyConfig.studyPhase;
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

  function bindAllEvents() {
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
    if ($("voice-speed-select")) {
      $("voice-speed-select").addEventListener("change", (e) => {
        state.voiceSpeed = Number(e.target.value) || 1.0;
      });
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
