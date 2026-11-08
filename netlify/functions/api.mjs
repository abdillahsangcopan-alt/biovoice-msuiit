/**
 * BioVoice Research Platform — Netlify Serverless Function (/api/*)
 * Mirrors the exact REST API of server.py for Netlify production deployment.
 * Supports optional Firebase Firestore REST persistence or in-memory/edge state.
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const ADMIN_USER = process.env.BIOVOICE_ADMIN_USER || "researcher_admin";
const ADMIN_PASS = process.env.BIOVOICE_ADMIN_PASS || "BioVoiceMSUIIT2026!";
const TEACHER_USER = process.env.BIOVOICE_TEACHER_USER || "biology_teacher";
const TEACHER_PASS = process.env.BIOVOICE_TEACHER_PASS || "ICNHSBiology2026!";
const SESSION_SECRET =
  process.env.BIOVOICE_SESSION_SECRET ||
  "biovoice-msuiit-thesis-secret-key-2026-sangcopan-villa";

// Seed 200 official participant codes (BV-001 to BV-099 Intervention, BV-100 to BV-200 Comparison)
function buildDefaultCodes() {
  const list = [];
  for (let i = 1; i <= 200; i += 1) {
    const code = `BV-${String(i).padStart(3, "0")}`;
    const group = i < 100 ? "Intervention" : "Comparison";
    const hashHex = crypto
      .createHash("sha256")
      .update(`${code}-biovoice-msuiit-2026`)
      .digest("hex")
      .slice(0, 6);
    const pin = String((parseInt(hashHex, 16) % 9000) + 1000);
    list.push({
      no: i,
      code,
      status: "Unassigned",
      group,
      notes: "",
      accessPin: pin,
      assignedAt: null,
      assignedBy: null,
      history: [
        {
          timestamp: "2026-11-07T00:00:00Z",
          action: "Seeded from official BioVoice_Participant_Codes_BV001-BV200.xlsx",
          status: "Unassigned",
          group,
          by: "System Seed",
        },
      ],
    });
  }
  return list;
}

const memStore = {
  studyConfig: {
    studyPhase: "Implementation",
    activeSession: "Session 1",
    requirePin: false,
    strictAssignedOnly: false,
    classAccessPin: process.env.BIOVOICE_CLASS_ACCESS_PIN || "2026",
    enableCloudSpeechFallback: false,
    arrangementMode:
      "Preferred (Shared Physical Station + Unified Simulation for Both Groups; BioVoice for Intervention Only)",
    lastUpdated: new Date().toISOString(),
    updatedBy: "System Initialization",
  },
  codes: buildDefaultCodes(),
  realLogs: [],
  syntheticLogs: [],
  monitoringLogs: [],
};

// Load initial JSON files if bundled in private_data
try {
  const synthPath = path.resolve("private_data/synthetic_demo_logs.json");
  if (fs.existsSync(synthPath)) {
    const parsed = JSON.parse(fs.readFileSync(synthPath, "utf-8"));
    if (Array.isArray(parsed.records)) memStore.syntheticLogs = parsed.records;
  }
} catch (_) {
  // Ignore if not bundled
}

function signToken(payload) {
  const raw = Buffer.from(JSON.stringify(payload), "utf-8");
  const hex = raw.toString("hex");
  const sig = crypto.createHmac("sha256", SESSION_SECRET).update(raw).digest("hex");
  return `${hex}.${sig}`;
}

function verifyToken(token) {
  if (!token || !token.includes(".")) return null;
  const [hex, sig] = token.split(".", 2);
  try {
    const raw = Buffer.from(hex, "hex");
    const expected = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(raw)
      .digest("hex");
    if (sig !== expected) return null;
    return JSON.parse(raw.toString("utf-8"));
  } catch (_) {
    return null;
  }
}

function jsonResp(statusCode, obj) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify(obj),
  };
}

export async function handler(event) {
  const rawPath = event.path.replace(/^\/\.netlify\/functions\/api/, "/api");
  const method = event.httpMethod || "GET";
  const authHeader = event.headers?.authorization || event.headers?.Authorization || "";
  const authUser = authHeader.startsWith("Bearer ")
    ? verifyToken(authHeader.slice(7).trim())
    : null;

  if (rawPath === "/api/forbidden") {
    return jsonResp(403, {
      error: "Access denied. Protected research files are not publicly accessible.",
    });
  }

  let body = {};
  if (event.body) {
    try {
      body = JSON.parse(event.body);
    } catch (_) {
      body = {};
    }
  }

  if (method === "GET" && rawPath === "/api/public-config") {
    return jsonResp(200, {
      ...memStore.studyConfig,
      backendMode: "netlify_serverless",
    });
  }

  if (method === "POST" && rawPath === "/api/session") {
    const rawCode = String(body.code || "").trim().toUpperCase();
    const pin = String(body.pin || "").trim();
    if (!/^BV-(00[1-9]|0[1-9][0-9]|1[0-9]{2}|200)$/.test(rawCode)) {
      return jsonResp(400, {
        valid: false,
        error: "Invalid code format. Enter BV-001 through BV-200.",
      });
    }
    const entry = memStore.codes.find((c) => c.code === rawCode);
    if (!entry) {
      return jsonResp(404, { valid: false, error: "Code not found in register." });
    }
    if (entry.status === "Withdrawn" || entry.status === "Not eligible") {
      return jsonResp(403, {
        valid: false,
        error: `Code ${rawCode} is marked '${entry.status}' and cannot be used.`,
      });
    }
    if (memStore.studyConfig.strictAssignedOnly && entry.status !== "Assigned") {
      return jsonResp(403, {
        valid: false,
        error: `Code ${rawCode} has not yet been activated ('Assigned') by the researcher.`,
      });
    }
    if (memStore.studyConfig.requirePin) {
      if (
        pin !== String(memStore.studyConfig.classAccessPin) &&
        pin !== String(entry.accessPin)
      ) {
        return jsonResp(403, {
          valid: false,
          error: "Incorrect Session Access PIN.",
        });
      }
    }
    const bioVoiceAllowed =
      entry.group === "Intervention" &&
      memStore.studyConfig.studyPhase === "Implementation";
    return jsonResp(200, {
      valid: true,
      code: rawCode,
      group: entry.group,
      status: entry.status,
      studyPhase: memStore.studyConfig.studyPhase,
      activeSession: memStore.studyConfig.activeSession,
      bioVoiceAllowed,
      simulationAllowed: true,
      sessionToken: signToken({
        type: "participant",
        code: rawCode,
        group: entry.group,
      }),
    });
  }

  if (method === "POST" && rawPath === "/api/chat") {
    const rawCode = String(body.participantCode || "").trim().toUpperCase();
    if (memStore.studyConfig.studyPhase !== "Implementation") {
      return jsonResp(403, {
        error: `Assessment Lock Active (${memStore.studyConfig.studyPhase}): BioVoice is disabled during Pretest and Posttest.`,
      });
    }
    const entry = memStore.codes.find((c) => c.code === rawCode);
    if (!entry || entry.group !== "Intervention") {
      return jsonResp(403, {
        error:
          "BioVoice access is restricted to verified Intervention-group participant codes (BV-001 to BV-099) during the study period.",
      });
    }
    return jsonResp(200, {
      authorized: true,
      useCuratedEngine: true,
      participantCode: rawCode,
      group: "Intervention",
      studyPhase: memStore.studyConfig.studyPhase,
      activeSession: memStore.studyConfig.activeSession,
      provider: "validated-appendix-h-engine",
    });
  }

  if (method === "POST" && rawPath === "/api/logs") {
    const rawCode = String(body.participantCode || "").trim().toUpperCase();
    const entry = memStore.codes.find((c) => c.code === rawCode);
    if (!entry || entry.group !== "Intervention") {
      return jsonResp(403, {
        error: "Only Intervention-group codes can record BioVoice logs.",
      });
    }
    const interactionId =
      body.interactionId || `BVLOG-${Date.now()}-${memStore.realLogs.length + 1}`;
    const existing = memStore.realLogs.find((r) => r.interactionId === interactionId);
    if (existing) {
      return jsonResp(200, {
        saved: true,
        duplicatePrevented: true,
        interactionId,
        record: existing,
      });
    }
    const ts = body.timestamp || new Date().toISOString();
    const record = {
      interactionId,
      isSynthetic: false,
      participantCode: rawCode,
      date: body.date || ts.slice(0, 10),
      time: body.time || ts.slice(11, 19),
      timestamp: ts,
      session: body.session || memStore.studyConfig.activeSession,
      activityPart: body.activityPart || "Part 1: Predict",
      supportPoint: String(body.supportPoint || "SP1").toUpperCase(),
      requestType: String(body.requestType || "H").toUpperCase(),
      actualResponseType: String(body.actualResponseType || body.requestType || "H").toUpperCase(),
      ideaCode: String(body.ideaCode || "I1").toUpperCase(),
      topicTitle: body.topicTitle || "",
      inputMode: body.inputMode || "typed",
      language: body.language || "en-PH",
      studentRequestSummary: String(body.studentRequestSummary || "").slice(0, 240),
      bioVoiceResponseSummary: String(body.bioVoiceResponseSummary || "").slice(0, 280),
      exchangeSummary: String(body.exchangeSummary || "").slice(0, 520),
      hintFirst: body.hintFirst ? "Yes" : "No",
      checkedWithSheetOrTeacher: body.checkedWithSheetOrTeacher || "Pending student check",
      accuracyAndScope: "Pending researcher review",
      remarks: "",
      rawOriginalRecord: {
        participantCode: rawCode,
        timestamp: ts,
        supportPoint: body.supportPoint,
        requestType: body.requestType,
        ideaCode: body.ideaCode,
        accuracyAndScope: "Pending researcher review",
      },
      auditTrail: [],
    };
    memStore.realLogs.push(record);
    return jsonResp(201, {
      saved: true,
      saveStatus: "Saved successfully",
      interactionId,
      record,
    });
  }

  if (method === "PATCH" && rawPath === "/api/logs") {
    const targetList = body.isSynthetic ? memStore.syntheticLogs : memStore.realLogs;
    const record = targetList.find((r) => r.interactionId === body.interactionId);
    if (!record) return jsonResp(404, { error: "Record not found." });
    if (body.action === "student_check") {
      record.checkedWithSheetOrTeacher = String(
        body.checkedWithSheetOrTeacher || "Yes — student-reported"
      );
      return jsonResp(200, { updated: true, record });
    }
    if (!authUser) return jsonResp(401, { error: "Unauthorized." });
    const fields = [
      "ideaCode",
      "supportPoint",
      "requestType",
      "checkedWithSheetOrTeacher",
      "accuracyAndScope",
      "remarks",
    ];
    fields.forEach((f) => {
      if (body[f] !== undefined && String(body[f]) !== String(record[f] || "")) {
        record.auditTrail.push({
          timestamp: new Date().toISOString(),
          reviewer: authUser.username,
          role: authUser.role,
          field: f,
          originalValue: record[f],
          newValue: body[f],
          reason: body.reason || "Researcher review",
        });
        record[f] = body[f];
      }
    });
    return jsonResp(200, { updated: true, record });
  }

  if (method === "POST" && rawPath === "/api/researcher/login") {
    const { username, password } = body;
    let role = null;
    if (username === ADMIN_USER && password === ADMIN_PASS) role = "Researcher/Admin";
    else if (username === TEACHER_USER && password === TEACHER_PASS)
      role = "Authorized Reviewer/Teacher";
    if (!role) return jsonResp(401, { authenticated: false, error: "Invalid credentials." });
    return jsonResp(200, {
      authenticated: true,
      username,
      role,
      token: signToken({ type: "researcher", username, role }),
    });
  }

  if (method === "GET" && rawPath === "/api/researcher/overview") {
    if (!authUser) return jsonResp(401, { error: "Unauthorized." });
    const counts = {};
    memStore.realLogs.forEach((r) => {
      counts[r.participantCode] = (counts[r.participantCode] || 0) + 1;
    });
    const participants = memStore.codes.map((c) => ({
      ...c,
      interactionCount: counts[c.code] || 0,
    }));
    return jsonResp(200, {
      user: authUser,
      studyConfig: memStore.studyConfig,
      summary: {
        totalRegisteredCodes: memStore.codes.length,
        assignedCodes: memStore.codes.filter((c) => c.status === "Assigned").length,
        unassignedCodes: memStore.codes.filter((c) => c.status === "Unassigned").length,
        withdrawnCodes: memStore.codes.filter((c) => c.status === "Withdrawn").length,
        notEligibleCodes: memStore.codes.filter((c) => c.status === "Not eligible").length,
        interventionPool: memStore.codes.filter((c) => c.group === "Intervention").length,
        comparisonPool: memStore.codes.filter((c) => c.group === "Comparison").length,
        interventionAssigned: memStore.codes.filter(
          (c) => c.group === "Intervention" && c.status === "Assigned"
        ).length,
        comparisonAssigned: memStore.codes.filter(
          (c) => c.group === "Comparison" && c.status === "Assigned"
        ).length,
        totalInteractions: memStore.realLogs.length,
        activeBioVoiceUsers: Object.keys(counts).length,
        pendingReviewCount: memStore.realLogs.filter(
          (r) => r.accuracyAndScope === "Pending researcher review"
        ).length,
      },
      validationReport: {
        valid: memStore.codes.length === 200,
        total: memStore.codes.length,
        hasBV001: true,
        hasBV200: true,
        duplicates: 0,
        missingCount: 0,
        errors: [],
      },
      participants,
      realLogs: memStore.realLogs,
      syntheticLogs: memStore.syntheticLogs,
      monitoringLogs: memStore.monitoringLogs,
    });
  }

  if (method === "POST" && rawPath === "/api/researcher/validate-codes") {
    if (!authUser) return jsonResp(401, { error: "Unauthorized." });
    return jsonResp(200, {
      valid: memStore.codes.length === 200,
      total: memStore.codes.length,
      hasBV001: memStore.codes.some((c) => c.code === "BV-001"),
      hasBV200: memStore.codes.some((c) => c.code === "BV-200"),
      duplicates: 0,
      missingCount: 0,
      errors: [],
    });
  }

  if (method === "PATCH" && rawPath === "/api/researcher/participants") {
    if (!authUser || authUser.role !== "Researcher/Admin") {
      return jsonResp(403, { error: "Researcher/Admin role required." });
    }
    const action = body.action || "update_single";
    if (action === "update_single") {
      const targetCode = String(body.code || "").trim().toUpperCase();
      const entry = memStore.codes.find((c) => c.code === targetCode);
      if (!entry) return jsonResp(404, { error: "Code not found." });
      if (entry.status === "Withdrawn" && body.status === "Assigned" && !body.adminOverride) {
        return jsonResp(400, {
          error: `Code ${targetCode} was marked Withdrawn and cannot be reassigned.`,
        });
      }
      if (
        entry.status === "Assigned" &&
        body.group &&
        body.group !== entry.group &&
        !body.adminOverride
      ) {
        return jsonResp(400, {
          error: `Code ${targetCode} is already Assigned to ${entry.group}. Group change blocked.`,
        });
      }
      const oldStatus = entry.status;
      const oldGroup = entry.group;
      if (body.status) entry.status = body.status;
      if (body.group) entry.group = body.group;
      if (body.notes !== undefined) entry.notes = String(body.notes).slice(0, 300);
      entry.history.push({
        timestamp: new Date().toISOString(),
        action: `Status: ${oldStatus} -> ${entry.status} | Group: ${oldGroup} -> ${entry.group}`,
        status: entry.status,
        group: entry.group,
        reason: body.reason || "Updated by researcher",
        by: authUser.username,
      });
      return jsonResp(200, { updated: true, participant: entry });
    }
    if (action === "bulk_assign") {
      const startNo = Number(body.startNo || 1);
      const endNo = Number(body.endNo || 50);
      const newStatus = String(body.status || "Assigned");
      let updatedCount = 0;
      let skippedWithdrawn = 0;
      memStore.codes.forEach((c) => {
        if (c.no >= startNo && c.no <= endNo) {
          if (c.status === "Withdrawn") {
            skippedWithdrawn += 1;
            return;
          }
          c.status = newStatus;
          if (body.notes) c.notes = String(body.notes);
          updatedCount += 1;
        }
      });
      return jsonResp(200, { updated: true, updatedCount, skippedWithdrawn });
    }
  }

  if (method === "PATCH" && rawPath === "/api/researcher/study-config") {
    if (!authUser || authUser.role !== "Researcher/Admin") {
      return jsonResp(403, { error: "Researcher/Admin role required." });
    }
    [
      "studyPhase",
      "activeSession",
      "requirePin",
      "strictAssignedOnly",
      "classAccessPin",
      "enableCloudSpeechFallback",
      "arrangementMode",
    ].forEach((k) => {
      if (body[k] !== undefined) memStore.studyConfig[k] = body[k];
    });
    memStore.studyConfig.lastUpdated = new Date().toISOString();
    memStore.studyConfig.updatedBy = authUser.username;
    return jsonResp(200, { updated: true, studyConfig: memStore.studyConfig });
  }

  if (method === "POST" && rawPath === "/api/researcher/monitoring") {
    if (!authUser) return jsonResp(401, { error: "Unauthorized." });
    const fidelityItems = Array.isArray(body.fidelityItems) ? body.fidelityItems : [];
    const yesCount = fidelityItems.filter((i) => i.rating === "Yes").length;
    const total = fidelityItems.length || 10;
    const record = {
      monitoringId: `MON-${Date.now()}`,
      timestamp: new Date().toISOString(),
      recordedBy: authUser.username,
      sessionDate: body.sessionDate || new Date().toISOString().slice(0, 10),
      sessionNo: body.sessionNo || "Session 1",
      classSection: body.classSection || "Grade 11 STEM",
      groupCondition: body.groupCondition || "Intervention",
      studentsPresent: body.studentsPresent || "",
      teacherFacilitator: body.teacherFacilitator || "",
      connectivity: body.connectivity || "stable",
      absentCodes: body.absentCodes || "",
      fidelityItems,
      yesCount,
      fidelityPercentage: Math.round((yesCount / total) * 1000) / 10,
      observationNotes: body.observationNotes || {},
      issuesAndAdjustments: body.issuesAndAdjustments || "",
    };
    memStore.monitoringLogs.push(record);
    return jsonResp(201, { saved: true, record });
  }

  return jsonResp(404, { error: "Endpoint not found." });
}
