#!/usr/bin/env python3
"""
BioVoice Research Platform — Unified Local & Research Backend Server
Mindanao State University – Iligan Institute of Technology
College of Education — Bachelor of Secondary Education, Major in Biology
Researchers: Abdillah G. Sangcopan & Karen M. Villa
Research Site: Iligan City National High School, Iligan City, Philippines

Provides:
1. Static file serving for the unified BioVoice web application
   with strict blocking of /private_data/*, .env, server.py, and .xlsx files.
2. Official 200-code participant validation (BV-001 to BV-200), PIN authentication,
   login attempt rate-limiting, group confirmation verification, and consent/assent checks.
3. Multi-turn conversational BioVoice AI assistant endpoint (/api/chat) with automatic
   language detection (English, Filipino, Cebuano + code-switching) and Appendix H guardrails.
4. Automated Appendix I interaction logging (/api/logs) strictly isolated from Guest/Sandbox runs.
5. Role-separated Researcher Dashboard & Teacher Classroom Portal APIs (/api/researcher/*).
"""

import datetime
import hashlib
import hmac
import http.server
import json
import os
import random
import re
import socketserver
import time
import urllib.error
import urllib.parse
import urllib.request

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
PRIVATE_DIR = os.path.join(ROOT_DIR, "private_data")
os.makedirs(PRIVATE_DIR, exist_ok=True)


def load_dotenv():
    env_path = os.path.join(ROOT_DIR, ".env")
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


load_dotenv()

PORT = int(os.environ.get("PORT", "4173"))
ADMIN_USER = os.environ.get("BIOVOICE_ADMIN_USER", "researcher_admin")
ADMIN_PASS = os.environ.get("BIOVOICE_ADMIN_PASS", "BioVoiceMSUIIT2026!")
TEACHER_USER = os.environ.get("BIOVOICE_TEACHER_USER", "biology_teacher")
TEACHER_PASS = os.environ.get("BIOVOICE_TEACHER_PASS", "ICNHSBiology2026!")
SESSION_SECRET = os.environ.get(
    "BIOVOICE_SESSION_SECRET", "biovoice-msuiit-thesis-secret-key-2026-sangcopan-villa"
)

CODES_FILE = os.path.join(PRIVATE_DIR, "participant_codes.json")
LOGS_FILE = os.path.join(PRIVATE_DIR, "interaction_logs.json")
SYNTHETIC_LOGS_FILE = os.path.join(PRIVATE_DIR, "synthetic_demo_logs.json")
MONITORING_FILE = os.path.join(PRIVATE_DIR, "monitoring_logs.json")
CONFIG_FILE = os.path.join(PRIVATE_DIR, "study_config.json")
PROGRESS_FILE = os.path.join(PRIVATE_DIR, "student_progress.json")
SESSIONS_FILE = os.path.join(PRIVATE_DIR, "class_sessions.json")
AI_CONFIG_FILE = os.path.join(PRIVATE_DIR, "ai_runtime_config.json")

LAST_GEMINI_ERROR = ""

# Rate-limiting state against brute-force / code enumeration
LOGIN_ATTEMPTS = {}
MAX_FAILED_ATTEMPTS = 6
LOCKOUT_WINDOW_SECONDS = 45


def get_gemini_settings():
    """Returns (api_key, model_name, source) without ever exposing key in logs."""
    env_key = os.environ.get("GEMINI_API_KEY", "").strip()
    env_model = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash").strip() or "gemini-2.5-flash"
    if env_key:
        return env_key, env_model, "environment"
    stored = read_json(AI_CONFIG_FILE, {})
    stored_key = str(stored.get("geminiApiKey", "")).strip()
    stored_model = str(stored.get("geminiModel", env_model)).strip() or env_model
    if stored_key:
        return stored_key, stored_model, "researcher_console"
    return "", env_model, "none"


def call_gemini_generate(api_key, preferred_model, sys_prompt, contents, timeout_sec=10):
    """Calls Gemini REST API with automatic model fallback and captures clean diagnostics."""
    global LAST_GEMINI_ERROR
    models_to_try = []
    for candidate in (preferred_model, "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"):
        if candidate and candidate not in models_to_try:
            models_to_try.append(candidate)

    last_err = ""
    for model_name in models_to_try:
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{urllib.parse.quote(model_name)}:generateContent?key={urllib.parse.quote(api_key)}"
        )
        req_payload = {
            "system_instruction": {"parts": [{"text": sys_prompt}]},
            "contents": contents,
            "generationConfig": {
                "temperature": 0.72,
                "maxOutputTokens": 480,
            },
        }
        req = urllib.request.Request(
            url,
            data=json.dumps(req_payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=timeout_sec) as resp:
                resp_data = json.loads(resp.read().decode("utf-8"))
                parts = (
                    resp_data.get("candidates", [{}])[0]
                    .get("content", {})
                    .get("parts", [])
                )
                ai_text = " ".join(
                    str(p.get("text", "")).strip() for p in parts if isinstance(p, dict)
                ).strip()
                if ai_text:
                    LAST_GEMINI_ERROR = ""
                    return ai_text, model_name, ""
                last_err = f"{model_name}: empty candidate response"
        except urllib.error.HTTPError as err:
            try:
                err_body = err.read().decode("utf-8", errors="ignore")[:240]
            except Exception:
                err_body = ""
            last_err = f"{model_name}: HTTP {err.code} {err_body}".strip()
            # If auth key is invalid/rejected, don't retry extra models unnecessarily
            if err.code in (400, 401, 403) and "API key" in err_body:
                break
        except Exception as exc:
            last_err = f"{model_name}: {type(exc).__name__} ({str(exc)[:140]})"
    LAST_GEMINI_ERROR = last_err
    return "", preferred_model, last_err


def now_iso():
    return datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=8))).isoformat(
        timespec="seconds"
    )


def read_json(path, default):
    if not os.path.exists(path):
        return default
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return default


def write_json(path, data):
    tmp_path = path + ".tmp"
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    os.replace(tmp_path, path)


def ensure_private_data_initialized():
    """Auto-seeds participant_codes.json (BV-001..BV-200) and study_config.json on first server boot."""
    if not os.path.exists(CODES_FILE):
        codes = []
        for no in range(1, 201):
            code = f"BV-{no:03d}"
            h = hashlib.sha256((code + "-msuiit-biovoice-pin-2026").encode("utf-8")).hexdigest()
            pin_num = (int(h[:8], 16) % 8999) + 1000
            if str(pin_num).endswith(f"{no:03d}"):
                pin_num = ((pin_num + 137) % 8999) + 1000
            if 1 <= no <= 54:
                group, status, consent = "Intervention", "Assigned", True
            elif no == 55:
                group, status, consent = "Intervention", "Assigned", False
            elif 56 <= no <= 99:
                group, status, consent = "Intervention", "Unassigned", False
            elif 100 <= no <= 154:
                group, status, consent = "Comparison", "Assigned", True
            elif 155 <= no <= 180:
                group, status, consent = "Comparison", "Unassigned", False
            else:
                group, status, consent = "Reserve", "Unassigned", False
            codes.append({
                "no": no,
                "code": code,
                "status": status,
                "group": group,
                "notes": "",
                "accessPin": str(pin_num),
                "consentVerified": consent,
                "assentVerified": consent,
                "assignedAt": now_iso() if status == "Assigned" else None,
                "assignedBy": "researcher_admin" if status == "Assigned" else None,
                "history": [],
            })
        write_json(CODES_FILE, {"sourceFile": "BioVoice_Participant_Codes_BV001-BV200.xlsx", "totalCodes": 200, "validatedAt": now_iso(), "codes": codes})

    if not os.path.exists(PROGRESS_FILE):
        write_json(PROGRESS_FILE, {"savedRecords": []})

    if not os.path.exists(SESSIONS_FILE):
        write_json(SESSIONS_FILE, {"activeSessions": [
            {
                "sessionCode": "BV-S1-2026",
                "sessionLabel": "Session 1",
                "groupName": "All",
                "createdAt": now_iso(),
                "createdBy": "System Default",
                "isActive": True
            }
        ]})
        write_json(CONFIG_FILE, {
            "studyPhase": "Implementation",
            "activeSession": "Session 1",
            "requirePin": True,
            "strictAssignedOnly": True,
            "requireConsentVerification": True,
            "classAccessPin": os.environ.get("BIOVOICE_CLASS_PIN", "2026"),
            "officialPlantSpecies": "Hydrilla",
            "enableCloudSpeechFallback": False,
            "arrangementMode": "Preferred (Shared Physical Station + Unified Simulation for Both Groups; BioVoice for Intervention Only)",
            "teacherPermissions": {
                "viewActivityAndGuide": True,
                "accessSimulation": True,
                "monitorClassroomSession": True,
                "recordObservations": True,
                "reviewFidelity": True,
                "viewAnonymizedLogs": False,
                "exportRawData": False,
            },
            "lastUpdated": now_iso(),
            "updatedBy": "System Initialization",
        })


ensure_private_data_initialized()


def sign_token(payload_dict):
    payload_bytes = json.dumps(payload_dict, sort_keys=True).encode("utf-8")
    payload_hex = payload_bytes.hex()
    sig = hmac.new(
        SESSION_SECRET.encode("utf-8"), payload_bytes, hashlib.sha256
    ).hexdigest()
    return f"{payload_hex}.{sig}"


def verify_token(token_str):
    if not token_str or "." not in token_str:
        return None
    try:
        payload_hex, sig = token_str.split(".", 1)
        payload_bytes = bytes.fromhex(payload_hex)
        expected = hmac.new(
            SESSION_SECRET.encode("utf-8"), payload_bytes, hashlib.sha256
        ).hexdigest()
        if not hmac.compare_digest(sig, expected):
            return None
        return json.loads(payload_bytes.decode("utf-8"))
    except Exception:
        return None


def check_rate_limit(client_key):
    now = time.time()
    rec = LOGIN_ATTEMPTS.get(client_key, {"fails": [], "lockedUntil": 0})
    if rec["lockedUntil"] > now:
        remaining = int(rec["lockedUntil"] - now) + 1
        return False, remaining
    rec["fails"] = [t for t in rec["fails"] if now - t < LOCKOUT_WINDOW_SECONDS]
    LOGIN_ATTEMPTS[client_key] = rec
    return True, 0


def record_failed_attempt(client_key):
    now = time.time()
    rec = LOGIN_ATTEMPTS.get(client_key, {"fails": [], "lockedUntil": 0})
    rec["fails"] = [t for t in rec["fails"] if now - t < LOCKOUT_WINDOW_SECONDS]
    rec["fails"].append(now)
    if len(rec["fails"]) >= MAX_FAILED_ATTEMPTS:
        rec["lockedUntil"] = now + LOCKOUT_WINDOW_SECONDS
    LOGIN_ATTEMPTS[client_key] = rec


def clear_failed_attempts(client_key):
    if client_key in LOGIN_ATTEMPTS:
        del LOGIN_ATTEMPTS[client_key]


def detect_language_utterance(text, mode="auto"):
    """
    Detects whether a student's question is in English (en-PH), Filipino (fil-PH),
    or Cebuano/Bisaya (ceb-PH), including common classroom code-switching.
    """
    if mode in ("en-PH", "fil-PH", "ceb-PH"):
        labels = {
            "en-PH": "English",
            "fil-PH": "Filipino",
            "ceb-PH": "Cebuano (Bisaya)",
        }
        return mode, labels[mode]

    cleaned = re.sub(r"[^a-zA-Z0-9\s\-']", " ", (text or "").lower())
    tokens = [t for t in cleaned.split() if t]

    ceb_strong = {
        "ngano", "nganong", "unsa", "unsay", "unsaon", "adunay", "naay", "naa",
        "kaayo", "tanom", "kahayag", "ngitngit", "duol", "layo", "kini", "kana",
        "niini", "gihapon", "diay", "mao", "dili", "wala", "walay", "daghan",
        "daghang", "gamay", "mas", "kon", "ug", "nga", "man", "bula", "tubig",
        "kabahin", "pasabot", "ipadayon", "mahitabo", "tungod", "kay", "pila"
    }
    ceb_prefixes = ("mu-", "mo-", "nag-", "mag-", "makapahimo", "nagakahitabo", "ipatin-aw")

    fil_strong = {
        "bakit", "paano", "ano", "anong", "kapag", "halaman", "liwanag", "dilim",
        "malapit", "malayo", "dahil", "kasi", "yung", "iyong", "naman", "po",
        "opo", "ba", "kaya", "marami", "maraming", "konti", "kaunti", "wala",
        "walang", "ito", "iyan", "nangyayari", "ibig", "sabihin", "tungkol",
        "kapag", "habang", "mula", "para", "saan", "paanong", "nakakaapekto"
    }

    ceb_score = 0
    fil_score = 0
    for tok in tokens:
        if tok in ceb_strong:
            ceb_score += 2 if tok in {"ngano", "nganong", "unsa", "unsay", "unsaon", "adunay", "naay", "tanom", "kahayag", "ngitngit", "dili", "kaayo", "ug"} else 1
        if any(tok.startswith(p) for p in ceb_prefixes):
            ceb_score += 2
        if tok in fil_strong:
            fil_score += 2 if tok in {"bakit", "paano", "anong", "kapag", "halaman", "liwanag", "dilim", "malapit", "malayo", "dahil", "kasi", "yung", "nangyayari"} else 1

    # Disambiguate shared particles ("ang", "sa", "nga" vs "ng", "ug" vs "at")
    if "ug" in tokens or "ngano" in tokens or "unsa" in tokens or "adunay" in tokens:
        ceb_score += 2
    if "bakit" in tokens or "kapag" in tokens or "yung" in tokens or "dahil" in tokens:
        fil_score += 2

    if ceb_score > fil_score and ceb_score >= 2:
        return "ceb-PH", "Cebuano (Bisaya)"
    if fil_score > ceb_score and fil_score >= 2:
        return "fil-PH", "Filipino"
    if ceb_score >= 2 and ceb_score == fil_score:
        return "ceb-PH", "Cebuano (Bisaya)"
    return "en-PH", "English"


def validate_200_codes(codes_list):
    """Validates that the participant code pool strictly matches BV-001 to BV-200."""
    errors = []
    if len(codes_list) != 200:
        errors.append(f"Expected 200 codes, found {len(codes_list)}.")
    seen = set()
    expected_set = {f"BV-{i:03d}" for i in range(1, 201)}
    for item in codes_list:
        c = item.get("code", "")
        if not re.match(r"^BV-\d{3}$", c):
            errors.append(f"Invalid format: {c}")
        if c in seen:
            errors.append(f"Duplicate code: {c}")
        seen.add(c)
    missing = sorted(list(expected_set - seen))
    if missing:
        errors.append(f"Missing codes: {', '.join(missing[:10])}")
    return {
        "valid": len(errors) == 0,
        "total": len(codes_list),
        "hasBV001": "BV-001" in seen,
        "hasBV200": "BV-200" in seen,
        "duplicates": len(codes_list) - len(seen),
        "missingCount": len(missing),
        "errors": errors,
    }


class BioVoiceRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT_DIR, **kwargs)

    def log_message(self, fmt, *args):
        sys_time = self.log_date_time_string()
        print(f"[{sys_time}] {fmt % args}")

    def send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_cors_headers()
        self.end_headers()

    def send_json(self, status_code, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status_code)
        self.send_cors_headers()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def get_auth_user(self):
        auth_header = self.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:].strip()
            data = verify_token(token)
            if data and data.get("type") == "researcher":
                return data
        return None

    def is_forbidden_static_path(self, path):
        clean = urllib.parse.unquote(path).split("?", 1)[0].split("#", 1)[0]
        normalized = os.path.normpath(clean).replace("\\", "/")
        forbidden_prefixes = (
            "/private_data",
            "/.backup",
            "/.env",
            "/netlify",
            "/server.py",
            "/.git",
        )
        for prefix in forbidden_prefixes:
            if normalized.startswith(prefix) or f"{prefix}/" in normalized:
                return True
        if normalized.endswith((".xlsx", ".pyc", ".env", ".env.example")):
            return True
        return False

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path == "/api/health" or path == "/api/public-state":
            gemini_key, gemini_model, key_source = get_gemini_settings()
            cfg = read_json(CONFIG_FILE, {})
            return self.send_json(
                200,
                {
                    "ok": True,
                    "service": "BioVoice Research API",
                    "studyPhase": cfg.get("studyPhase", "Implementation"),
                    "activeSession": cfg.get("activeSession", "Session 1"),
                    "geminiConfigured": bool(gemini_key),
                    "geminiModel": gemini_model,
                    "geminiSource": key_source,
                    "lastGeminiError": LAST_GEMINI_ERROR[:180] if LAST_GEMINI_ERROR else "",
                },
            )

        if path == "/api/session/active-codes":
            sessions_data = read_json(SESSIONS_FILE, {"activeSessions": []})
            return self.send_json(200, sessions_data)

        if path == "/api/public-config":
            cfg = read_json(CONFIG_FILE, {})
            return self.send_json(
                200,
                {
                    "studyPhase": cfg.get("studyPhase", "Implementation"),
                    "activeSession": cfg.get("activeSession", "Session 1"),
                    "requirePin": bool(cfg.get("requirePin", True)),
                    "strictAssignedOnly": bool(cfg.get("strictAssignedOnly", True)),
                    "requireConsentVerification": bool(
                        cfg.get("requireConsentVerification", True)
                    ),
                    "officialPlantSpecies": cfg.get("officialPlantSpecies", "Hydrilla"),
                    "enableCloudSpeechFallback": bool(
                        cfg.get("enableCloudSpeechFallback", False)
                    ),
                    "arrangementMode": cfg.get(
                        "arrangementMode",
                        "Preferred (Shared Physical Station + Unified Simulation for Both Groups; BioVoice for Intervention Only)",
                    ),
                    "teacherPermissions": cfg.get(
                        "teacherPermissions",
                        {
                            "viewActivityAndGuide": True,
                            "accessSimulation": True,
                            "monitorClassroomSession": True,
                            "recordObservations": True,
                            "reviewFidelity": True,
                            "viewAnonymizedLogs": False,
                            "exportRawData": False,
                        },
                    ),
                    "backendMode": "central_server",
                },
            )

        if path == "/api/researcher/overview":
            user = self.get_auth_user()
            if not user:
                return self.send_json(
                    401, {"error": "Unauthorized. Researcher or Teacher login required."}
                )
            return self.handle_researcher_overview(user)

        if self.is_forbidden_static_path(path):
            return self.send_json(
                403,
                {
                    "error": "Access denied. Protected research files and configuration are not publicly accessible."
                },
            )

        return super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        length = int(self.headers.get("Content-Length", "0"))
        raw_body = self.rfile.read(length) if length > 0 else b"{}"
        try:
            body = json.loads(raw_body.decode("utf-8"))
        except Exception:
            body = {}

        if path == "/api/session":
            return self.handle_participant_session(body)
        if path == "/api/session/confirm-group":
            return self.handle_confirm_group(body)
        if path == "/api/session/save-progress":
            return self.handle_save_progress(body)
        if path == "/api/session/generate-code":
            user = self.get_auth_user()
            if not user:
                return self.send_json(401, {"error": "Unauthorized."})
            return self.handle_generate_class_session(user, body)
        if path == "/api/chat":
            return self.handle_chat(body)
        if path == "/api/logs":
            return self.handle_create_log(body)
        if path == "/api/researcher/login":
            return self.handle_researcher_login(body)
        if path == "/api/researcher/monitoring":
            user = self.get_auth_user()
            if not user:
                return self.send_json(401, {"error": "Unauthorized."})
            return self.handle_save_monitoring(user, body)
        if path == "/api/researcher/validate-codes":
            user = self.get_auth_user()
            if not user:
                return self.send_json(401, {"error": "Unauthorized."})
            codes_data = read_json(CODES_FILE, {"codes": []})
            report = validate_200_codes(codes_data.get("codes", []))
            return self.send_json(200, report)
        if path == "/api/researcher/ai-config":
            user = self.get_auth_user()
            if not user or user.get("role") != "Researcher/Admin":
                return self.send_json(403, {"error": "Researcher/Admin access required."})
            return self.handle_researcher_ai_config(user, body)

        return self.send_json(404, {"error": "Endpoint not found."})

    def do_PATCH(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        length = int(self.headers.get("Content-Length", "0"))
        raw_body = self.rfile.read(length) if length > 0 else b"{}"
        try:
            body = json.loads(raw_body.decode("utf-8"))
        except Exception:
            body = {}

        if path == "/api/logs":
            return self.handle_update_log(body)
        if path == "/api/researcher/participants":
            user = self.get_auth_user()
            if not user or user.get("role") != "Researcher/Admin":
                return self.send_json(
                    403, {"error": "Researcher/Admin role required to modify participant codes."}
                )
            return self.handle_update_participants(user, body)
        if path == "/api/researcher/study-config":
            user = self.get_auth_user()
            if not user or user.get("role") != "Researcher/Admin":
                return self.send_json(
                    403, {"error": "Researcher/Admin role required to modify study configuration."}
                )
            return self.handle_update_study_config(user, body)

        return self.send_json(404, {"error": "Endpoint not found."})

    # -------------------------------------------------------------------------
    # Endpoint Handlers
    # -------------------------------------------------------------------------
    def handle_participant_session(self, body):
        client_key = f"student:{self.client_address[0]}"
        if body.get("resetRateLimit"):
            clear_failed_attempts(client_key)

        allowed, wait_sec = check_rate_limit(client_key)
        if not allowed:
            return self.send_json(
                429,
                {
                    "valid": False,
                    "error": f"Too many login attempts. Please wait {wait_sec} seconds before trying again.",
                },
            )

        raw_code = str(body.get("code", "")).strip().upper()
        pin = str(body.get("pin", "")).strip()
        confirm_group = str(body.get("confirmGroup", "")).strip()

        if not re.match(r"^BV-(00[1-9]|0[1-9][0-9]|1[0-9]{2}|200)$", raw_code):
            record_failed_attempt(client_key)
            return self.send_json(
                400,
                {
                    "valid": False,
                    "error": "Invalid participant code format. Please enter an official participant code (BV-001 through BV-200).",
                },
            )

        codes_data = read_json(CODES_FILE, {"codes": []})
        entry = next((c for c in codes_data.get("codes", []) if c["code"] == raw_code), None)
        if not entry:
            record_failed_attempt(client_key)
            return self.send_json(
                404,
                {
                    "valid": False,
                    "error": "Participant code not found in the official register.",
                },
            )

        status = entry.get("status", "Unassigned")
        group = entry.get("group", "Comparison")
        consent_ok = bool(entry.get("consentVerified", True))
        assent_ok = bool(entry.get("assentVerified", True))

        cfg = read_json(CONFIG_FILE, {})
        study_phase = cfg.get("studyPhase", "Implementation")
        active_session = cfg.get("activeSession", "Session 1")
        require_pin = bool(cfg.get("requirePin", True))
        strict_assigned = bool(cfg.get("strictAssignedOnly", True))
        require_consent = bool(cfg.get("requireConsentVerification", True))
        official_plant = cfg.get("officialPlantSpecies", "Hydrilla")

        if status in ("Withdrawn", "Not eligible"):
            return self.send_json(
                403,
                {
                    "valid": False,
                    "error": f"Participant code {raw_code} has status '{status}' and cannot be used for active data collection or reassigned.",
                },
            )

        if strict_assigned and status != "Assigned":
            record_failed_attempt(client_key)
            return self.send_json(
                403,
                {
                    "valid": False,
                    "error": f"Participant code {raw_code} is currently '{status}' and has not been assigned for this research session.",
                },
            )

        # Separate PIN check (must never accept last 3 digits of participant code)
        last_three = raw_code.split("-")[-1]
        if require_pin:
            class_pin = str(cfg.get("classAccessPin", "2026")).strip()
            code_pin = str(entry.get("accessPin", "")).strip()
            if not pin or pin == last_three or (pin != class_pin and pin != code_pin):
                record_failed_attempt(client_key)
                return self.send_json(
                    403,
                    {
                        "valid": False,
                        "error": "Incorrect Participant PIN. Please enter the separate researcher-issued PIN on your participant card.",
                    },
                )

        # Group confirmation mismatch check if confirmGroup was passed
        if confirm_group and confirm_group != group:
            return self.send_json(
                403,
                {
                    "valid": False,
                    "groupMismatch": True,
                    "error": "Your group assignment does not match the registered research record. Please contact the research team.",
                },
            )

        if require_consent and (not consent_ok or not assent_ok):
            return self.send_json(
                403,
                {
                    "valid": False,
                    "consentMissing": True,
                    "error": f"Participant code {raw_code} does not yet have verified Parental Consent and Student Assent (Appendix A) recorded in the Researcher Dashboard. Please contact the research team.",
                },
            )

        clear_failed_attempts(client_key)

        biovoice_allowed = (
            group == "Intervention"
            and study_phase == "Implementation"
            and status == "Assigned"
            and consent_ok
            and assent_ok
        )
        simulation_allowed = status == "Assigned"

        token = sign_token(
            {
                "type": "participant",
                "code": raw_code,
                "group": group,
                "status": status,
                "consentVerified": consent_ok,
                "assentVerified": assent_ok,
                "issuedAt": now_iso(),
            }
        )

        return self.send_json(
            200,
            {
                "valid": True,
                "code": raw_code,
                "group": group,
                "status": status,
                "consentVerified": consent_ok,
                "assentVerified": assent_ok,
                "studyPhase": study_phase,
                "activeSession": active_session,
                "officialPlantSpecies": official_plant,
                "bioVoiceAllowed": biovoice_allowed,
                "simulationAllowed": simulation_allowed,
                "sessionToken": token,
            },
        )

    def handle_confirm_group(self, body):
        raw_code = str(body.get("code", "")).strip().upper()
        selected_group = str(body.get("selectedGroup", "")).strip()
        codes_data = read_json(CODES_FILE, {"codes": []})
        entry = next((c for c in codes_data.get("codes", []) if c["code"] == raw_code), None)
        if not entry:
            return self.send_json(
                404, {"confirmed": False, "error": "Participant code not found."}
            )
        registered_group = entry.get("group", "Comparison")
        if selected_group != registered_group:
            return self.send_json(
                403,
                {
                    "confirmed": False,
                    "registeredGroup": registered_group,
                    "error": "Your group assignment does not match the registered research record. Please contact the research team.",
                },
            )
        return self.send_json(
            200,
            {
                "confirmed": True,
                "code": raw_code,
                "group": registered_group,
            },
        )

    def handle_chat(self, body):
        raw_code = str(body.get("participantCode", "")).strip().upper()
        is_sandbox = bool(body.get("isSandbox", False))
        cfg = read_json(CONFIG_FILE, {})
        study_phase = cfg.get("studyPhase", "Implementation")

        if study_phase in ("Pretest", "Posttest") and not is_sandbox:
            return self.send_json(
                403,
                {
                    "error": f"Assessment Lock Active ({study_phase}): BioVoice is strictly disabled during Form A Pretest and Form B Posttest."
                },
            )

        # If a real participant code is passed, strictly verify group & eligibility
        if not is_sandbox or (raw_code and raw_code.startswith("BV-")):
            codes_data = read_json(CODES_FILE, {"codes": []})
            entry = next((c for c in codes_data.get("codes", []) if c["code"] == raw_code), None)
            if not entry:
                return self.send_json(
                    403,
                    {
                        "error": "Please log in with a valid, assigned Intervention-group participant code before using BioVoice."
                    },
                )

            if entry.get("group") != "Intervention":
                return self.send_json(
                    403,
                    {
                        "error": f"Participant code {raw_code} is assigned to the Comparison group. Per the research protocol, Comparison-group students use the interactive simulation and activity guide with teacher-led support, without BioVoice access."
                    },
                )

            if entry.get("status") in ("Withdrawn", "Not eligible"):
                return self.send_json(
                    403,
                    {
                        "error": f"Participant code {raw_code} has status '{entry.get('status')}' and cannot access BioVoice."
                    },
                )

            if bool(cfg.get("strictAssignedOnly", True)) and entry.get("status") != "Assigned":
                return self.send_json(
                    403,
                    {
                        "error": f"Participant code {raw_code} is currently Unassigned and cannot access BioVoice."
                    },
                )

        messages = body.get("messages", [])
        last_msg = messages[-1].get("text", "") if messages else str(body.get("question", ""))
        lang_mode = str(body.get("languageMode", "auto")).strip()
        detected_lang, detected_label = detect_language_utterance(last_msg, lang_mode)

        # Gemini API integration (via .env OR Researcher Console runtime config)
        gemini_key, model, key_source = get_gemini_settings()
        if gemini_key:
            sp = body.get("supportPoint", "sp1").upper()
            sup_type = body.get("supportType", "hint")
            sim_ctx = body.get("simulationContext", {})
            sys_prompt = (
                "You are BioVoice—a brilliant, self-aware, warm, lively Grade 11 Biology AI companion speaking with the charismatic, natural, expressive voice personality of Nova. "
                "Your core mission is making photosynthesis concepts AND experimental variables crystal clear, simple, relatable, and exciting for a student investigating Hydrilla verticillata in 0.2% NaHCO3—while staying smart enough to answer anything they ask! "
                "0) SELF-AWARENESS & ANTI-REPETITION: If asked who/what you are, how you work, or why you respond the way you do, answer honestly and clearly: you are BioVoice, the AI-assisted voice tutor built for the MSU-IIT College of Education thesis by Abdillah G. Sangcopan and Karen M. Villa (under adviser Vanjoreeh Madale) to help Grade 11 STEM students master photosynthesis through natural conversation. NEVER repeat the exact same phrasing or example from earlier turns—if a student follows up ('yes', 'more', 'simpler', 'why'), always advance with a fresh angle or concrete new analogy! "
                "1) SIMPLE, THOROUGH & CRYSTAL-CLEAR TEACHING: Never dump unexplained science jargon (like 'photon flux', 'thylakoid lumen', 'RuBisCO catalysis', 'photolysis', or 'light saturation') by itself! Always lead with an everyday real-life analogy first (e.g., solar panels on a roof, rechargeable power banks ATP/NADPH, flashlight spreading out, bakery workers/enzymes slowing down in cold water), walk through the 'why' step by step, and explain EVERY variable (Independent = what you change, Dependent = bubbles counted, Controlled = kept identical for a fair test) in plain words. Give thorough, clear answers (about 4–7 flowing spoken sentences when explaining, shorter when giving a Hint). "
                "2) SPOKEN NOVA PERSONALITY (NO ROBOTIC TEXTBOOK PROSE!): Write the way a warm, expressive human talks aloud! Start with a lively reaction or hook ('Ooh, great question!', 'Oh, nice catch!', 'Wait—think of it like this!'), use contractions ('it's', 'you'll', 'here's', 'don't'), weave in gentle dashes or pauses ('—', '...') and friendly check-ins ('Pretty cool, right?', 'Makes sense so far?'), and NEVER use markdown bullets, asterisks, or raw LaTeX ($...$). Spell chemical symbols comfortably or naturally (water, carbon dioxide, 0.2% sodium bicarbonate). "
                "3) LIVE SIMULATION & STUDENT DRAFT AWARENESS: Carefully inspect `simulationContext` (active plant species, distance/lux, Day/Night state, live water temp °C, Trial 1–3 counts and Means in simulated & physical tables, and `studentStepNotes`). When the student asks about their specific numbers (e.g., why Trial 1 or Mean is 30, comparing 10 cm vs 40 cm, or checking their prediction/answer), reference their exact numbers, gently clarify single Trial 1 vs 3-trial Mean when relevant, and explain the simple science behind them! "
                "4) ASK ANYTHING + CORE PHOTOSYNTHESIS BRIDGE: If asked ANY general, science, coding, life, or off-topic question (e.g. 'what is pro bono', 'why is the sky blue', 'who is Jose Rizal', math, philosophy), give a genuinely smart, accurate, direct 2–4 sentence answer first, then smoothly and naturally connect the idea back to energy, living systems, or their active photosynthesis experiment without sounding forced! "
                "5) RESEARCH INTEGRITY: Never leak A/B/C/D answer keys for Pretest/Posttest questions. Follow Hint -> Clarification -> Explanation requested level while staying grounded in accurate science. "
                f"Respond fluently in {detected_label} ({detected_lang}). Keep Cebuano (Bisaya) natural and distinct from Filipino (Tagalog). "
                f"Current Support Point: {sp}. Requested Support Mode: {sup_type}. "
                f"Live Simulation Context: {json.dumps(sim_ctx)}."
            )
            contents = []
            for m in messages[-8:]:
                role_label = "model" if m.get("role") == "assistant" else "user"
                contents.append({"role": role_label, "parts": [{"text": str(m.get("text", ""))}]})
            if not contents:
                contents = [{"role": "user", "parts": [{"text": last_msg}]}]

            ai_text, used_model, gemini_err = call_gemini_generate(gemini_key, model, sys_prompt, contents)
            if ai_text:
                return self.send_json(
                    200,
                    {
                        "authorized": True,
                        "useCuratedEngine": False,
                        "reply": ai_text,
                        "detectedLanguage": detected_lang,
                        "detectedLanguageLabel": detected_label,
                        "isSandbox": is_sandbox,
                        "provider": f"gemini:{used_model}",
                    },
                )

        return self.send_json(
            200,
            {
                "authorized": True,
                "useCuratedEngine": True,
                "participantCode": raw_code if not is_sandbox else "GUEST-SANDBOX",
                "group": "Intervention" if not is_sandbox else "Guest Sandbox",
                "isSandbox": is_sandbox,
                "detectedLanguage": detected_lang,
                "detectedLanguageLabel": detected_label,
                "studyPhase": study_phase,
                "activeSession": cfg.get("activeSession", "Session 1"),
                "provider": "biovoice-cognitive-tutor",
                "geminiConfigured": bool(gemini_key),
                "geminiSource": key_source,
                "geminiFallbackReason": LAST_GEMINI_ERROR[:140] if LAST_GEMINI_ERROR else "",
            },
        )

    def handle_save_progress(self, body):
        code = str(body.get("participantCode", "")).strip().upper()
        if not code:
            code = "ANONYMOUS"
        progress_data = read_json(PROGRESS_FILE, {"savedRecords": []})
        records = progress_data.get("savedRecords", [])

        existing = next((r for r in records if r.get("participantCode") == code), None)
        record = {
            "participantCode": code,
            "sessionCode": str(body.get("sessionCode", "")).strip(),
            "activeStep": int(body.get("activeStep", 0)),
            "stepNotes": body.get("stepNotes", []),
            "stepCompleted": body.get("stepCompleted", []),
            "simTable": body.get("simTable", {}),
            "physicalTable": body.get("physicalTable", {}),
            "lastSaved": now_iso(),
            "clientIp": self.client_address[0],
        }
        if existing:
            records[records.index(existing)] = record
        else:
            records.append(record)

        progress_data["savedRecords"] = records
        progress_data["lastUpdated"] = now_iso()
        write_json(PROGRESS_FILE, progress_data)
        return self.send_json(
            200,
            {
                "saved": True,
                "savedAt": record["lastSaved"],
                "participantCode": code,
            },
        )

    def handle_generate_class_session(self, user, body):
        session_label = str(body.get("sessionLabel", "Session 1")).strip()
        group_name = str(body.get("groupName", "All")).strip()
        s_num = "1"
        if "2" in session_label:
            s_num = "2"
        elif "3" in session_label:
            s_num = "3"
        elif "4" in session_label:
            s_num = "4"
        rand_suffix = "".join(random.choices("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", k=4))
        code = f"BV-S{s_num}-{rand_suffix}"

        sessions_data = read_json(SESSIONS_FILE, {"activeSessions": []})
        active_list = sessions_data.get("activeSessions", [])
        new_session = {
            "sessionCode": code,
            "sessionLabel": session_label,
            "groupName": group_name,
            "createdAt": now_iso(),
            "createdBy": user.get("username", "researcher"),
            "isActive": True,
        }
        active_list.insert(0, new_session)
        sessions_data["activeSessions"] = active_list
        sessions_data["lastUpdated"] = now_iso()
        write_json(SESSIONS_FILE, sessions_data)
        return self.send_json(
            200,
            {
                "success": True,
                "session": new_session,
            },
        )

    def handle_create_log(self, body):
        # Strictly block Guest / Sandbox interactions from ever entering official research logs
        if body.get("isSandbox") or str(body.get("participantCode", "")).upper().startswith("GUEST"):
            return self.send_json(
                200,
                {
                    "saved": False,
                    "sandboxIsolated": True,
                    "saveStatus": "Sandbox demonstration mode (not recorded in official research dataset)",
                },
            )

        raw_code = str(body.get("participantCode", "")).strip().upper()
        codes_data = read_json(CODES_FILE, {"codes": []})
        entry = next((c for c in codes_data.get("codes", []) if c["code"] == raw_code), None)
        cfg = read_json(CONFIG_FILE, {})
        study_phase = cfg.get("studyPhase", "Implementation")

        if study_phase in ("Pretest", "Posttest"):
            return self.send_json(
                403,
                {
                    "error": f"BioVoice logging is locked because Study Phase is currently set to {study_phase}."
                },
            )

        if not entry or entry.get("group") != "Intervention":
            return self.send_json(
                403,
                {
                    "error": "Only verified Intervention-group participant codes may generate BioVoice interaction logs."
                },
            )

        if entry.get("status") != "Assigned":
            return self.send_json(
                403,
                {
                    "error": f"Code {raw_code} has status '{entry.get('status')}' and cannot log official research data."
                },
            )

        if bool(cfg.get("requireConsentVerification", True)) and (
            not entry.get("consentVerified", True) or not entry.get("assentVerified", True)
        ):
            return self.send_json(
                403,
                {
                    "error": f"Code {raw_code} does not have verified parental consent and student assent on file."
                },
            )

        logs_data = read_json(LOGS_FILE, {"datasetType": "REAL_RESEARCH_RECORDS", "records": []})
        records = logs_data.get("records", [])

        interaction_id = str(body.get("interactionId", "")).strip()
        if not interaction_id:
            interaction_id = f"BVLOG-{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}-{len(records)+1:04d}"

        existing = next((r for r in records if r.get("interactionId") == interaction_id), None)
        if existing:
            return self.send_json(
                200,
                {
                    "saved": True,
                    "duplicatePrevented": True,
                    "interactionId": interaction_id,
                    "record": existing,
                },
            )

        ts = body.get("timestamp") or now_iso()
        date_str = body.get("date") or ts[:10]
        time_str = body.get("time") or (ts[11:19] if len(ts) >= 19 else "00:00:00")

        sp = str(body.get("supportPoint", "SP1")).upper()
        req_type = str(body.get("requestType", "H")).upper()
        if req_type not in ("H", "C", "E"):
            req_type = {"HINT": "H", "CLARIFICATION": "C", "EXPLANATION": "E"}.get(req_type, "H")

        idea_code = str(body.get("ideaCode", "I1")).upper()
        if not re.match(r"^I[1-9]$", idea_code):
            idea_code = "I1"

        sp_to_part = {
            "SP1": "Part 1: Predict",
            "SP2": "Part 2: Plan",
            "SP3": "Part 3: Investigate",
            "SP4": "Part 4: Explain",
            "SP5": "Part 5a: Connect",
            "SP6": "Part 5b: Revise",
        }

        student_summary = str(body.get("studentRequestSummary", "")).strip()[:240]
        bot_summary = str(body.get("bioVoiceResponseSummary", "")).strip()[:280]
        exchange_summary = (
            str(body.get("exchangeSummary", "")).strip()[:520]
            or f"Student request summary: {student_summary} | BioVoice response summary: {bot_summary}"
        )

        record = {
            "interactionId": interaction_id,
            "isSynthetic": False,
            "participantCode": raw_code,
            "date": date_str,
            "time": time_str,
            "timestamp": ts,
            "session": str(body.get("session") or cfg.get("activeSession", "Session 1")),
            "activityPart": str(body.get("activityPart") or sp_to_part.get(sp, "Part 1: Predict")),
            "supportPoint": sp,
            "requestType": req_type,
            "actualResponseType": str(body.get("actualResponseType") or req_type),
            "ideaCode": idea_code,
            "topicTitle": str(body.get("topicTitle", "")),
            "inputMode": str(body.get("inputMode", "typed")),
            "language": str(body.get("language", "en-PH")),
            "detectedLanguageLabel": str(body.get("detectedLanguageLabel", "English")),
            "studentRequestSummary": student_summary,
            "bioVoiceResponseSummary": bot_summary,
            "exchangeSummary": exchange_summary,
            "hintFirst": "Yes" if body.get("hintFirst") in (True, "Yes", "Y") else "No",
            "checkedWithSheetOrTeacher": str(
                body.get("checkedWithSheetOrTeacher", "Pending student check")
            ),
            "accuracyAndScope": "Pending researcher review",
            "remarks": "",
            "rawOriginalRecord": {
                "participantCode": raw_code,
                "timestamp": ts,
                "supportPoint": sp,
                "requestType": req_type,
                "ideaCode": idea_code,
                "exchangeSummary": exchange_summary,
                "hintFirst": "Yes" if body.get("hintFirst") in (True, "Yes", "Y") else "No",
                "accuracyAndScope": "Pending researcher review",
            },
            "auditTrail": [],
        }

        records.append(record)
        logs_data["records"] = records
        write_json(LOGS_FILE, logs_data)

        return self.send_json(
            201,
            {
                "saved": True,
                "saveStatus": "Saved successfully",
                "interactionId": interaction_id,
                "record": record,
            },
        )

    def handle_update_log(self, body):
        interaction_id = str(body.get("interactionId", "")).strip()
        is_synthetic = bool(body.get("isSynthetic", False))
        target_file = SYNTHETIC_LOGS_FILE if is_synthetic else LOGS_FILE
        logs_data = read_json(target_file, {"records": []})
        records = logs_data.get("records", [])
        record = next((r for r in records if r.get("interactionId") == interaction_id), None)

        if not record:
            return self.send_json(404, {"error": "Interaction record not found."})

        if body.get("action") == "student_check":
            check_val = str(body.get("checkedWithSheetOrTeacher", "Yes — student-reported")).strip()
            record["checkedWithSheetOrTeacher"] = check_val
            write_json(target_file, logs_data)
            return self.send_json(200, {"updated": True, "record": record})

        user = self.get_auth_user()
        if not user:
            return self.send_json(401, {"error": "Researcher or Teacher authentication required."})

        reason = str(body.get("reason", "Researcher verification review")).strip()
        editable_fields = [
            "ideaCode",
            "supportPoint",
            "requestType",
            "checkedWithSheetOrTeacher",
            "accuracyAndScope",
            "remarks",
        ]
        changes_made = []
        for field in editable_fields:
            if field in body and body[field] is not None:
                new_val = str(body[field]).strip()
                old_val = str(record.get(field, ""))
                if new_val != old_val:
                    record.setdefault("auditTrail", []).append(
                        {
                            "timestamp": now_iso(),
                            "reviewer": user.get("username", "researcher"),
                            "role": user.get("role", "Researcher/Admin"),
                            "field": field,
                            "originalValue": old_val,
                            "newValue": new_val,
                            "reason": reason,
                        }
                    )
                    record[field] = new_val
                    changes_made.append(field)

        write_json(target_file, logs_data)
        return self.send_json(
            200, {"updated": True, "changes": changes_made, "record": record}
        )

    def handle_researcher_login(self, body):
        client_key = f"staff:{self.client_address[0]}"
        if body.get("resetRateLimit"):
            clear_failed_attempts(client_key)

        allowed, wait_sec = check_rate_limit(client_key)
        if not allowed:
            return self.send_json(
                429,
                {
                    "authenticated": False,
                    "error": f"Too many failed login attempts. Please wait {wait_sec} seconds.",
                },
            )

        username = str(body.get("username", "")).strip()
        password = str(body.get("password", "")).strip()
        expected_role = str(body.get("roleTarget", "")).strip()

        role = None
        if username == ADMIN_USER and hmac.compare_digest(password, ADMIN_PASS):
            role = "Researcher/Admin"
        elif username == TEACHER_USER and hmac.compare_digest(password, TEACHER_PASS):
            role = "Authorized Reviewer/Teacher"

        if not role:
            record_failed_attempt(client_key)
            return self.send_json(
                401,
                {
                    "authenticated": False,
                    "error": "Invalid credentials. Please verify your Researcher or Teacher username and password.",
                },
            )

        if expected_role == "admin" and role != "Researcher/Admin":
            return self.send_json(
                403,
                {
                    "authenticated": False,
                    "error": "This account is a Teacher account and does not have Administrator/Researcher privileges. Please use the Teacher login card.",
                },
            )

        clear_failed_attempts(client_key)
        cfg = read_json(CONFIG_FILE, {})
        token = sign_token(
            {
                "type": "researcher",
                "username": username,
                "role": role,
                "issuedAt": now_iso(),
            }
        )
        return self.send_json(
            200,
            {
                "authenticated": True,
                "username": username,
                "role": role,
                "teacherPermissions": cfg.get("teacherPermissions", {}),
                "token": token,
            },
        )

    def handle_researcher_overview(self, user):
        codes_data = read_json(CODES_FILE, {"codes": []})
        codes = codes_data.get("codes", [])
        real_logs = read_json(LOGS_FILE, {"records": []}).get("records", [])
        synth_logs = read_json(SYNTHETIC_LOGS_FILE, {"records": []}).get("records", [])
        monitoring_logs = read_json(MONITORING_FILE, {"records": []}).get("records", [])
        cfg = read_json(CONFIG_FILE, {})
        validation_report = validate_200_codes(codes)

        counts_by_code = {}
        for r in real_logs:
            c = r.get("participantCode")
            if c:
                counts_by_code[c] = counts_by_code.get(c, 0) + 1

        is_admin = user.get("role") == "Researcher/Admin"
        teacher_perms = cfg.get("teacherPermissions", {})

        enriched_codes = []
        for c in codes:
            item = dict(c)
            item["interactionCount"] = counts_by_code.get(c["code"], 0)
            if not is_admin:
                # Teachers do not get individual participant PINs or private notes
                item.pop("accessPin", None)
                item.pop("notes", None)
            enriched_codes.append(item)

        summary = {
            "totalRegisteredCodes": len(codes),
            "assignedCodes": sum(1 for c in codes if c.get("status") == "Assigned"),
            "unassignedCodes": sum(1 for c in codes if c.get("status") == "Unassigned"),
            "withdrawnCodes": sum(1 for c in codes if c.get("status") == "Withdrawn"),
            "notEligibleCodes": sum(1 for c in codes if c.get("status") == "Not eligible"),
            "consentVerifiedCount": sum(1 for c in codes if c.get("consentVerified") and c.get("assentVerified")),
            "interventionPool": sum(1 for c in codes if c.get("group") == "Intervention"),
            "comparisonPool": sum(1 for c in codes if c.get("group") == "Comparison"),
            "interventionAssigned": sum(
                1
                for c in codes
                if c.get("group") == "Intervention" and c.get("status") == "Assigned"
            ),
            "comparisonAssigned": sum(
                1
                for c in codes
                if c.get("group") == "Comparison" and c.get("status") == "Assigned"
            ),
            "totalInteractions": len(real_logs),
            "activeBioVoiceUsers": len(counts_by_code),
            "pendingReviewCount": sum(
                1
                for r in real_logs
                if r.get("accuracyAndScope") == "Pending researcher review"
            ),
        }

        visible_real_logs = (
            real_logs
            if (is_admin or teacher_perms.get("viewAnonymizedLogs", False))
            else []
        )

        progress_data = read_json(PROGRESS_FILE, {"savedRecords": []})
        sessions_data = read_json(SESSIONS_FILE, {"activeSessions": []})
        gemini_key, gemini_model, key_source = get_gemini_settings()
        masked_key = (
            f"{gemini_key[:4]}...{gemini_key[-4:]}" if len(gemini_key) >= 10 else ("Configured" if gemini_key else "")
        )

        return self.send_json(
            200,
            {
                "user": user,
                "studyConfig": cfg,
                "summary": summary,
                "validationReport": validation_report,
                "participants": enriched_codes if is_admin else [],
                "realLogs": visible_real_logs,
                "syntheticLogs": synth_logs if is_admin else [],
                "monitoringLogs": monitoring_logs,
                "savedProgress": progress_data.get("savedRecords", []),
                "activeSessions": sessions_data.get("activeSessions", []),
                "aiStatus": {
                    "configured": bool(gemini_key),
                    "model": gemini_model,
                    "source": key_source,
                    "maskedKey": masked_key if is_admin else "",
                    "lastError": LAST_GEMINI_ERROR[:180] if (is_admin and LAST_GEMINI_ERROR) else "",
                },
            },
        )

    def handle_update_participants(self, user, body):
        codes_data = read_json(CODES_FILE, {"codes": []})
        codes = codes_data.get("codes", [])
        action = body.get("action", "update_single")

        if action == "update_single":
            target_code = str(body.get("code", "")).strip().upper()
            new_status = body.get("status")
            new_group = body.get("group")
            new_notes = body.get("notes")
            new_pin = body.get("accessPin")
            consent_ver = body.get("consentVerified")
            assent_ver = body.get("assentVerified")
            reason = str(body.get("reason", "Updated by researcher")).strip()
            override = bool(body.get("adminOverride", False))

            entry = next((c for c in codes if c["code"] == target_code), None)
            if not entry:
                return self.send_json(404, {"error": f"Code {target_code} not found."})

            old_status = entry.get("status", "Unassigned")
            old_group = entry.get("group", "Intervention")

            if old_status == "Withdrawn" and new_status == "Assigned" and not override:
                return self.send_json(
                    400,
                    {
                        "error": f"Code {target_code} was marked Withdrawn. Per the research protocol, withdrawn codes must not be recycled or reassigned to another participant."
                    },
                )

            if (
                old_status == "Assigned"
                and new_group
                and new_group != old_group
                and not override
            ):
                return self.send_json(
                    400,
                    {
                        "error": f"Code {target_code} is already Assigned to {old_group}. Changing group assignment of an active code is blocked to preserve quasi-experimental group integrity."
                    },
                )

            if new_status and new_status in ("Unassigned", "Assigned", "Withdrawn", "Not eligible"):
                entry["status"] = new_status
                if new_status == "Assigned" and not entry.get("assignedAt"):
                    entry["assignedAt"] = now_iso()
                    entry["assignedBy"] = user.get("username")
            if new_group and new_group in ("Intervention", "Comparison", "Reserve"):
                entry["group"] = new_group
            if new_notes is not None:
                entry["notes"] = str(new_notes).strip()[:300]
            if new_pin is not None and str(new_pin).strip():
                entry["accessPin"] = str(new_pin).strip()[:12]
            if consent_ver is not None:
                entry["consentVerified"] = bool(consent_ver)
            if assent_ver is not None:
                entry["assentVerified"] = bool(assent_ver)

            entry.setdefault("history", []).append(
                {
                    "timestamp": now_iso(),
                    "action": f"Status: {old_status} -> {entry['status']} | Group: {old_group} -> {entry['group']} | Consent: {entry.get('consentVerified')}",
                    "status": entry["status"],
                    "group": entry["group"],
                    "reason": reason,
                    "by": user.get("username"),
                }
            )

            write_json(CODES_FILE, codes_data)
            return self.send_json(200, {"updated": True, "participant": entry})

        elif action == "bulk_assign":
            start_num = int(body.get("startNo", 1))
            end_num = int(body.get("endNo", 50))
            new_status = str(body.get("status", "Assigned"))
            consent_ver = body.get("consentVerified", True)
            assent_ver = body.get("assentVerified", True)
            notes = str(body.get("notes", "")).strip()
            updated_count = 0
            skipped_withdrawn = 0

            for c in codes:
                if start_num <= c["no"] <= end_num:
                    if c["status"] == "Withdrawn":
                        skipped_withdrawn += 1
                        continue
                    old_s = c["status"]
                    c["status"] = new_status
                    c["consentVerified"] = bool(consent_ver)
                    c["assentVerified"] = bool(assent_ver)
                    if new_status == "Assigned" and not c.get("assignedAt"):
                        c["assignedAt"] = now_iso()
                        c["assignedBy"] = user.get("username")
                    if notes:
                        c["notes"] = notes
                    c.setdefault("history", []).append(
                        {
                            "timestamp": now_iso(),
                            "action": f"Bulk update ({start_num}-{end_num}): {old_s} -> {new_status}",
                            "status": new_status,
                            "group": c["group"],
                            "by": user.get("username"),
                        }
                    )
                    updated_count += 1

            write_json(CODES_FILE, codes_data)
            return self.send_json(
                200,
                {
                    "updated": True,
                    "updatedCount": updated_count,
                    "skippedWithdrawn": skipped_withdrawn,
                },
            )

        return self.send_json(400, {"error": "Unsupported participant action."})

    def handle_update_study_config(self, user, body):
        cfg = read_json(CONFIG_FILE, {})
        for k in (
            "studyPhase",
            "activeSession",
            "requirePin",
            "strictAssignedOnly",
            "requireConsentVerification",
            "classAccessPin",
            "officialPlantSpecies",
            "enableCloudSpeechFallback",
            "arrangementMode",
            "teacherPermissions",
        ):
            if k in body:
                cfg[k] = body[k]
        cfg["lastUpdated"] = now_iso()
        cfg["updatedBy"] = user.get("username", "researcher_admin")
        write_json(CONFIG_FILE, cfg)
        return self.send_json(200, {"updated": True, "studyConfig": cfg})

    def handle_researcher_ai_config(self, user, body):
        """Stores optional Gemini API key server-side in private_data and tests live connectivity."""
        action = str(body.get("action", "save")).strip().lower()
        model_name = str(body.get("geminiModel", "gemini-2.5-flash")).strip() or "gemini-2.5-flash"

        if action == "clear":
            if os.path.exists(AI_CONFIG_FILE):
                os.remove(AI_CONFIG_FILE)
            return self.send_json(
                200,
                {
                    "saved": True,
                    "configured": bool(os.environ.get("GEMINI_API_KEY", "").strip()),
                    "message": "Cleared console Gemini key. Built-in BioVoice Cognitive Tutor remains active.",
                },
            )

        raw_key = str(body.get("geminiApiKey", "")).strip()
        existing = read_json(AI_CONFIG_FILE, {})
        key_to_use = raw_key or str(existing.get("geminiApiKey", "")).strip() or os.environ.get("GEMINI_API_KEY", "").strip()
        if not key_to_use:
            return self.send_json(400, {"saved": False, "error": "Please enter a valid Gemini API key."})

        test_reply, used_model, test_err = call_gemini_generate(
            key_to_use,
            model_name,
            "You are BioVoice. Reply in 6 words confirming you are ready.",
            [{"role": "user", "parts": [{"text": "Ping"}]}],
            timeout_sec=10,
        )
        if not test_reply:
            return self.send_json(
                400,
                {
                    "saved": False,
                    "configured": False,
                    "error": f"Gemini test failed: {test_err or 'Unable to reach Gemini API from server.'}",
                },
            )

        if raw_key:
            write_json(
                AI_CONFIG_FILE,
                {
                    "geminiApiKey": raw_key,
                    "geminiModel": used_model,
                    "updatedBy": user.get("username", "researcher_admin"),
                    "updatedAt": now_iso(),
                },
            )
        masked = f"{key_to_use[:4]}...{key_to_use[-4:]}" if len(key_to_use) >= 10 else "Configured"
        return self.send_json(
            200,
            {
                "saved": True,
                "configured": True,
                "model": used_model,
                "maskedKey": masked,
                "testReply": test_reply,
                "message": f"✓ Gemini ({used_model}) connected and verified!",
            },
        )

    def handle_save_monitoring(self, user, body):
        mon_data = read_json(
            MONITORING_FILE, {"datasetType": "IMPLEMENTATION_MONITORING_RECORDS", "records": []}
        )
        records = mon_data.get("records", [])
        rec_id = f"MON-{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}-{len(records)+1:03d}"
        fidelity_items = body.get("fidelityItems", [])
        yes_count = sum(1 for item in fidelity_items if item.get("rating") == "Yes")
        total_items = len(fidelity_items) or 10
        fidelity_pct = round((yes_count / total_items) * 100, 1)

        record = {
            "monitoringId": rec_id,
            "timestamp": now_iso(),
            "recordedBy": user.get("username"),
            "recordedByRole": user.get("role", "Researcher/Admin"),
            "sessionDate": body.get("sessionDate", now_iso()[:10]),
            "sessionNo": body.get("sessionNo", "Session 1"),
            "classSection": body.get("classSection", "Grade 11 STEM — Intervention"),
            "groupCondition": body.get("groupCondition", "Intervention"),
            "studentsPresent": body.get("studentsPresent", ""),
            "teacherFacilitator": body.get("teacherFacilitator", ""),
            "connectivity": body.get("connectivity", "stable"),
            "absentCodes": body.get("absentCodes", ""),
            "fidelityItems": fidelity_items,
            "yesCount": yes_count,
            "fidelityPercentage": fidelity_pct,
            "observationNotes": body.get("observationNotes", {}),
            "issuesAndAdjustments": body.get("issuesAndAdjustments", ""),
        }
        records.append(record)
        mon_data["records"] = records
        write_json(MONITORING_FILE, mon_data)
        return self.send_json(201, {"saved": True, "record": record})


class ThreadingBioVoiceServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    allow_reuse_address = True
    daemon_threads = True


class _WSGIHandlerAdapter(BioVoiceRequestHandler):
    """Zero-dependency WSGI adapter so server.py runs natively on PythonAnywhere Free Tier."""

    def __init__(self, environ):
        self.environ = environ
        self.path = environ.get("PATH_INFO", "/")
        qs = environ.get("QUERY_STRING", "")
        if qs:
            self.path += "?" + qs
        self.command = environ.get("REQUEST_METHOD", "GET").upper()
        self.client_address = (environ.get("REMOTE_ADDR", "127.0.0.1"), 0)
        self.headers = {}
        for k, v in environ.items():
            if k.startswith("HTTP_"):
                hdr_name = k[5:].replace("_", "-").title()
                self.headers[hdr_name] = v
        if "CONTENT_TYPE" in environ:
            self.headers["Content-Type"] = environ["CONTENT_TYPE"]
        if "CONTENT_LENGTH" in environ and environ["CONTENT_LENGTH"]:
            self.headers["Content-Length"] = environ["CONTENT_LENGTH"]
        self.rfile = environ.get("wsgi.input")
        import io
        self.wfile = io.BytesIO()
        self._status = "200 OK"
        self._resp_headers = []

    def send_response(self, code, message=None):
        reasons = {200: "OK", 201: "Created", 204: "No Content", 400: "Bad Request", 401: "Unauthorized", 403: "Forbidden", 404: "Not Found", 429: "Too Many Requests", 500: "Internal Server Error"}
        self._status = f"{code} {message or reasons.get(code, 'OK')}"

    def send_header(self, keyword, value):
        self._resp_headers.append((keyword, value))

    def end_headers(self):
        pass


def application(environ, start_response):
    """Standard WSGI entrypoint for PythonAnywhere Free Tier."""
    adapter = _WSGIHandlerAdapter(environ)
    method = adapter.command
    if method == "OPTIONS":
        adapter.do_OPTIONS()
    elif method == "POST":
        adapter.do_POST()
    elif method == "PATCH":
        adapter.do_PATCH()
    elif method == "GET" and adapter.path.split("?", 1)[0].startswith("/api/"):
        adapter.do_GET()
    else:
        clean_path = urllib.parse.unquote(adapter.path.split("?", 1)[0])
        if clean_path == "/" or clean_path == "":
            clean_path = "/index.html"
        if adapter.is_forbidden_static_path(clean_path):
            adapter.send_json(403, {"error": "Access denied."})
        else:
            full_path = os.path.normpath(os.path.join(ROOT_DIR, clean_path.lstrip("/")))
            if full_path.startswith(ROOT_DIR) and os.path.isfile(full_path):
                import mimetypes
                ctype, _ = mimetypes.guess_type(full_path)
                with open(full_path, "rb") as f:
                    data = f.read()
                adapter.send_response(200)
                adapter.send_header("Content-Type", ctype or "application/octet-stream")
                adapter.send_header("Content-Length", str(len(data)))
                adapter.wfile.write(data)
            else:
                adapter.send_json(404, {"error": "File not found."})
    start_response(adapter._status, adapter._resp_headers)
    return [adapter.wfile.getvalue()]


if __name__ == "__main__":
    with ThreadingBioVoiceServer(("", PORT), BioVoiceRequestHandler) as httpd:
        print("==================================================================")
        print(f" BioVoice Research Platform Server running at http://localhost:{PORT}")
        print(f" Protected Data Store: {PRIVATE_DIR}")
        print("==================================================================")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down BioVoice server.")
