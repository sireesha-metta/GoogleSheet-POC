const express = require("express");
const cors = require("cors");
const XLSX = require("xlsx");
const crypto = require("crypto");

const app = express();
const PORT = Number(process.env.PORT || 3001);
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || origin === FRONTEND_ORIGIN) {
        callback(null, true);
        return;
      }
      callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

const FILE_PATH = "Leadership_Reset_Diagnostic_NR.xlsx";
const SHEET_NAME = "Diagnostic";
const SCORE_SHEET_NAME = "Scores";
const GOOGLE_SCRIPT_URL =
  process.env.GOOGLE_SCRIPT_URL ||
  "https://script.google.com/macros/s/AKfycbytHuWxCiTwSTM-1gbpt2UgWzGXWDhZD-QqllAyC6Tcy_xxrdD--Kk2QBjYGcXbubfY/exec";

const ADMIN_EMAIL =
  (process.env.ADMIN_EMAIL || "admin@leanin-coaching.com").trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Lean@123";
const TOKEN_TTL_MS = Number(process.env.TOKEN_TTL_MS || 8 * 60 * 60 * 1000);
const REMEMBER_TOKEN_TTL_MS = Number(
  process.env.REMEMBER_TOKEN_TTL_MS || 7 * 24 * 60 * 60 * 1000
);

const sessions = new Map();

// Row indices (0-based) that contain questions, mapped to xlsx D-column cell refs
const QUESTION_ROWS = [6, 7, 8, 9, 12, 13, 14, 15, 18, 19, 20, 21];

const SECTIONS = {
  6: "DECISION MAKING",
  12: "CONVERSATION PATTERNS",
  18: "LEADER SIGNALS",
};

function createToken() {
  return crypto.randomBytes(32).toString("hex");
}

function getAuthToken(req) {
  const raw = req.headers.authorization || "";
  if (!raw.startsWith("Bearer ")) return null;
  return raw.slice(7).trim();
}

function requireAuth(req, res, next) {
  const token = getAuthToken(req);
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const session = sessions.get(token);
  if (!session || Date.now() > session.expiresAt) {
    sessions.delete(token);
    return res.status(401).json({ error: "Session expired" });
  }

  req.auth = {
    token,
    email: session.email,
  };

  next();
}

setInterval(() => {
  const now = Date.now();
  for (const [token, session] of sessions.entries()) {
    if (!session || now > session.expiresAt) {
      sessions.delete(token);
    }
  }
}, 5 * 60 * 1000).unref();

function parseOptions(optionsStr) {
  if (!optionsStr) return [];
  return optionsStr
    .split(/\r?\n/)
    .map((o) => o.trim())
    .filter(Boolean);
}

function normalizeAnswerText(value) {
  if (!value) return "";
  return String(value)
    .replace(/^[A-Da-d]\.?\s*/, "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/["'`,.;:!?()\[\]{}]/g, " ")
    .replace(/[^a-zA-Z0-9\s-]/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function readScoreRules(wb) {
  const ws = wb.Sheets[SCORE_SHEET_NAME];
  if (!ws) return new Map();

  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
  const rulesByDiagRow = new Map();

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] || [];
    const answerText = row[5];
    const score = row[6];
    const diagRow = row[7];
    if (!answerText || score === undefined || score === null || !diagRow) continue;

    const key = Number(diagRow);
    if (!rulesByDiagRow.has(key)) rulesByDiagRow.set(key, new Map());
    rulesByDiagRow.get(key).set(normalizeAnswerText(answerText), Number(score));
  }

  return rulesByDiagRow;
}

function readQuestions() {
  const wb = XLSX.readFile(FILE_PATH);
  const ws = wb.Sheets[SHEET_NAME];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
  const scoreRules = readScoreRules(wb);

  return QUESTION_ROWS.map((rowIdx) => {
    const row = data[rowIdx] || [];
    const cellRef = `D${rowIdx + 1}`;
    const cell = ws[cellRef];
    const scoreCell = ws[`E${rowIdx + 1}`];
    const options = parseOptions(row[2]);
    const scoreMap = {};
    const diagRow = rowIdx + 1;
    const rulesForRow = scoreRules.get(diagRow) || new Map();

    options.forEach((opt) => {
      const key = normalizeAnswerText(opt);
      scoreMap[opt] = rulesForRow.has(key) ? rulesForRow.get(key) : null;
    });

    return {
      rowIndex: rowIdx,
      number: row[0],
      question: row[1] || "",
      options,
      optionScoreMap: scoreMap,
      answer: cell ? String(cell.v) : "",
      score: scoreCell ? String(scoreCell.v ?? "") : "",
      weight: row[5] ?? "",
      section: SECTIONS[rowIdx] || null,
    };
  });
}

app.post("/api/auth/login", (req, res) => {
  const { email, password, rememberMe = false } = req.body || {};
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedPassword = String(password || "");

  if (!normalizedEmail || !normalizedPassword) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required.",
    });
  }

  if (normalizedEmail !== ADMIN_EMAIL || normalizedPassword !== ADMIN_PASSWORD) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password.",
    });
  }

  const token = createToken();
  const expiresAt = Date.now() + (rememberMe ? REMEMBER_TOKEN_TTL_MS : TOKEN_TTL_MS);

  sessions.set(token, {
    email: ADMIN_EMAIL,
    expiresAt,
  });

  return res.json({
    success: true,
    data: {
      token,
      user: {
        email: ADMIN_EMAIL,
      },
      expiresAt,
    },
  });
});

app.get("/api/auth/me", requireAuth, (req, res) => {
  res.json({
    success: true,
    data: {
      email: req.auth.email,
    },
  });
});

app.post("/api/auth/logout", requireAuth, (req, res) => {
  sessions.delete(req.auth.token);
  res.json({ success: true });
});

// GET /api/questions — returns all questions with current answers
app.get("/api/questions", requireAuth, (req, res) => {
  try {
    const questions = readQuestions();
    res.json(questions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to read file: " + err.message });
  }
});

// POST /api/answers — saves answers back to the xlsx file
// Body: { answers: { [rowIndex]: "A. ..." } }
app.post("/api/answers", requireAuth, (req, res) => {
  try {
    const { answers } = req.body;
    if (!answers || typeof answers !== "object") {
      return res.status(400).json({ error: "Invalid payload" });
    }

    const wb = XLSX.readFile(FILE_PATH);
    const ws = wb.Sheets[SHEET_NAME];

    for (const [rowIdx, value] of Object.entries(answers)) {
      const cellRef = `D${Number(rowIdx) + 1}`;
      if (!ws[cellRef]) {
        ws[cellRef] = { t: "s", v: value };
      } else {
        ws[cellRef].v = value;
        ws[cellRef].t = "s";
      }
    }

    XLSX.writeFile(wb, FILE_PATH);
    res.json({ success: true, message: "Answers saved to Excel file." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to write file: " + err.message });
  }
});

app.post("/api/submit", requireAuth, async (req, res) => {
  try {
    const upstream = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body || {}),
    });

    const text = await upstream.text();
    let parsed;

    try {
      parsed = JSON.parse(text);
    } catch {
      const plain = String(text || "").trim().toLowerCase();
      parsed = {
        success:
          plain === "success" || plain.includes("saved") || plain.includes("updated"),
        message: text,
      };
    }

    res.json(parsed);
  } catch (error) {
    console.error(error);
    res.status(502).json({
      success: false,
      error: "Failed to submit data to Google Script.",
    });
  }
});

app.get("/api/submissions", requireAuth, async (req, res) => {
  try {
    const upstream = await fetch(`${GOOGLE_SCRIPT_URL}?action=getSubmissions`);
    const data = await upstream.json();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(502).json({
      success: false,
      error: "Failed to load submissions from Google Script.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`File: ${FILE_PATH}`);
  console.log(`Frontend origin: ${FRONTEND_ORIGIN}`);
});
