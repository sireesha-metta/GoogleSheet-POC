const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");
const crypto = require("crypto");
const mysql = require("mysql2/promise");
require("dotenv").config();

const app = express();
const PORT = Number(process.env.PORT || 5000);
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
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

const FILE_PATH = path.join(process.cwd(), "Leadership_Reset_Diagnostic_NR.xlsx");
const SHEET_NAME = "Diagnostic";
const SCORE_SHEET_NAME = "Scores";
const GOOGLE_SCRIPT_URL =
  process.env.GOOGLE_SCRIPT_URL ||
  "https://script.google.com/macros/s/AKfycbytHuWxCiTwSTM-1gbpt2UgWzGXWDhZD-QqllAyC6Tcy_xxrdD--Kk2QBjYGcXbubfY/exec";

// const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "admin@leanin-coaching.com").trim().toLowerCase();
// const ADMIN_FIRST_NAME = process.env.ADMIN_FIRST_NAME || "Admin";
// const ADMIN_LAST_NAME = process.env.ADMIN_LAST_NAME || "User";
// const ADMIN_MOBILE = process.env.ADMIN_MOBILE || "9876543210";
// let ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Lean@123";
const TOKEN_TTL_MS = Number(process.env.TOKEN_TTL_MS || 8 * 60 * 60 * 1000);
const REMEMBER_TOKEN_TTL_MS = Number(process.env.REMEMBER_TOKEN_TTL_MS || 7 * 24 * 60 * 60 * 1000);
const sessions = new Map();

const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "new_password",
  database: process.env.DB_NAME || "leadership_assesment",
  waitForConnections: true,
  connectionLimit: 10,
});

async function findUserByEmail(email) {
  if (!email) return null;
  try {
    const [rows] = await db.execute(
      `SELECT * FROM Respondent WHERE email = ? AND status = 'Active'`,
      [email.toLowerCase()]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error("Server: failed to query user", error);
    return null;
  }
}

async function findAnyUserByEmail(email) {
  if (!email) return null;
  try {
    const [rows] = await db.execute(`SELECT * FROM Respondent WHERE email = ?`, [
      email.toLowerCase(),
    ]);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error("Server: failed to query user by email", error);
    return null;
  }
}

async function createUser(firstName, lastName, email, mobile, password) {
  try {
    const [result] = await db.execute(
      `INSERT INTO Respondent (firstname, lastname, email, password, role, status) VALUES (?, ?, ?, ?, ?, ?)`,
      [firstName, lastName, email.toLowerCase(), password, "RESPONDENT", "Active"]
    );
    return result.affectedRows > 0;
  } catch (error) {
    console.error("Server: failed to create user", error);
    return false;
  }
}

async function updateUserPasswordByEmail(email, newPassword) {
  if (!email || !newPassword) return false;

  try {
    const [result] = await db.execute(
      `UPDATE Respondent SET password = ? WHERE email = ? AND status = 'Active'`,
      [newPassword, email.toLowerCase()]
    );

    return Number(result?.affectedRows || 0) > 0;
  } catch (error) {
    console.error("Server: failed to update password", error);
    return false;
  }
}

async function listAdminUsers() {
  const [rows] = await db.execute(
    `SELECT id, firstname, lastname, mobile, email, status
     FROM Respondent
     WHERE role = 'ADMIN'
     ORDER BY id DESC`
  );

  return rows.map((row) => ({
    id: Number(row.id),
    firstName: row.firstname || "",
    lastName: row.lastname || "",
    mobile: row.mobile || "",
    email: row.email || "",
    status: row.status || "Active",
  }));
}

async function createAdminUser({ firstName, lastName, mobile, email, password }) {
  const [result] = await db.execute(
    `INSERT INTO Respondent (firstname, lastname, mobile, email, password, role, status)
     VALUES (?, ?, ?, ?, ?, 'ADMIN', 'Active')`,
    [firstName, lastName, mobile, email.toLowerCase(), password]
  );

  return Number(result?.affectedRows || 0) > 0;
}

async function updateAdminUserById(id, payload) {
  const fields = [];
  const values = [];

  if (payload.firstName !== undefined) {
    fields.push("firstname = ?");
    values.push(String(payload.firstName || "").trim());
  }

  if (payload.lastName !== undefined) {
    fields.push("lastname = ?");
    values.push(String(payload.lastName || "").trim());
  }

  if (payload.mobile !== undefined) {
    fields.push("mobile = ?");
    values.push(String(payload.mobile || "").trim());
  }

  if (payload.email !== undefined) {
    fields.push("email = ?");
    values.push(String(payload.email || "").trim().toLowerCase());
  }

  if (payload.status !== undefined) {
    fields.push("status = ?");
    values.push(payload.status);
  }

  if (fields.length === 0) return false;

  values.push(Number(id));

  const [result] = await db.execute(
    `UPDATE Respondent
     SET ${fields.join(", ")}
     WHERE id = ? AND role = 'ADMIN'`,
    values
  );

  return Number(result?.affectedRows || 0) > 0;
}

async function deleteAdminUserById(id) {
  const [result] = await db.execute(
    `DELETE FROM Respondent WHERE id = ? AND role = 'ADMIN'`,
    [Number(id)]
  );

  return Number(result?.affectedRows || 0) > 0;
}

function isAdminRole(role) {
  return String(role || "").trim().toUpperCase() === "ADMIN";
}

function requireAdmin(req, res, next) {
  if (!isAdminRole(req?.auth?.role)) {
    return res.status(403).json({
      success: false,
      message: "Only admin users can access this resource.",
    });
  }
  next();
}

function normalizeStatus(status) {
  const normalized = String(status || "").trim().toLowerCase();
  if (normalized === "inactive") return "Inactive";
  return "Active";
}


async function listRespondents() {
  const [rows] = await db.execute(
    `SELECT id, firstname, lastname, mobile, email, status
     FROM Respondent
     WHERE role = 'RESPONDENT'
     ORDER BY id DESC`
  );

  return rows.map((row) => ({
    id: Number(row.id),
    firstName: row.firstname || "",
    lastName: row.lastname || "",
    mobile: row.mobile || "",
    email: row.email || "",
    status: row.status || "Active",
  }));
}

async function createRespondent({ firstName, lastName, mobile, email, password }) {
  const [result] = await db.execute(
    `INSERT INTO Respondent (firstname, lastname, mobile, email, password, role, status)
     VALUES (?, ?, ?, ?, ?, 'RESPONDENT', 'Active')`,
    [firstName, lastName, mobile, email.toLowerCase(), password]
  );

  return Number(result?.affectedRows || 0) > 0;
}

async function updateRespondentById(id, payload) {
  const fields = [];
  const values = [];

  if (payload.firstName !== undefined) {
    fields.push("firstname = ?");
    values.push(String(payload.firstName || "").trim());
  }

  if (payload.lastName !== undefined) {
    fields.push("lastname = ?");
    values.push(String(payload.lastName || "").trim());
  }

  if (payload.mobile !== undefined) {
    fields.push("mobile = ?");
    values.push(String(payload.mobile || "").trim());
  }

  if (payload.email !== undefined) {
    fields.push("email = ?");
    values.push(String(payload.email || "").trim().toLowerCase());
  }

  if (payload.status !== undefined) {
    fields.push("status = ?");
    values.push(payload.status);
  }

  if (fields.length === 0) return false;

  values.push(Number(id));

  const [result] = await db.execute(
    `UPDATE Respondent
     SET ${fields.join(", ")}
     WHERE id = ? AND role = 'RESPONDENT'`,
    values
  );

  return Number(result?.affectedRows || 0) > 0;
}

async function deleteRespondentById(id) {
  const [result] = await db.execute(
    `DELETE FROM Respondent WHERE id = ? AND role = 'RESPONDENT'`,
    [Number(id)]
  );

  return Number(result?.affectedRows || 0) > 0;
}

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
  console.log("Server.requireAuth", { authorization: req.headers.authorization, token, hasSession: sessions.has(token) });
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
    role: session.role,
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

app.post("/api/auth/register", async (req, res) => {
  const { firstName, lastName, email, mobile, password, confirmPassword } = req.body || {};
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (!firstName || !lastName || !mobile || !normalizedEmail || !password || !confirmPassword) {
    return res.status(400).json({
      success: false,
      message: "All registration fields are required.",
    });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: "Passwords do not match.",
    });
  }

  const existingUser = await findUserByEmail(normalizedEmail);
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: "This email is already registered.",
    });
  }

  const created = await createUser(firstName, lastName, normalizedEmail, mobile, password);
  if (!created) {
    return res.status(500).json({
      success: false,
      message: "Failed to create account.",
    });
  }

  const token = createToken();
  const expiresAt = Date.now() + TOKEN_TTL_MS;

  sessions.set(token, {
    email: normalizedEmail,
    role: "RESPONDENT",
    firstName: String(firstName),
    lastName: String(lastName),
    mobile: String(mobile),
    expiresAt,
  });

  return res.json({
    success: true,
    data: {
      token,
      user: {
        email: normalizedEmail,
        role: "RESPONDENT",
        firstName: String(firstName),
        lastName: String(lastName),
        mobile: String(mobile),
      },
      expiresAt,
    },
  });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password, rememberMe = false } = req.body || {};
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedPassword = String(password || "");

  if (!normalizedEmail || !normalizedPassword) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required.",
    });
  }

  const user = await findUserByEmail(normalizedEmail);
  if (!user || normalizedPassword !== user.password) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password.",
    });
  }

  const token = createToken();
  const expiresAt = Date.now() + (rememberMe ? REMEMBER_TOKEN_TTL_MS : TOKEN_TTL_MS);

  sessions.set(token, {
    email: user.email,
    role: user.role || "RESPONDENT",
    firstName: user.firstname || "",
    lastName: user.lastname || "",
    mobile: user.mobile || "",
    expiresAt,
  });

  return res.json({
    success: true,
    data: {
      token,
      user: {
        email: user.email,
        role: user.role || "RESPONDENT",
        firstName: user.firstname || "",
        lastName: user.lastname || "",
        mobile: user.mobile || "",
      },
      expiresAt,
    },
  });
});

app.get("/api/auth/admins", requireAuth, requireAdmin, async (req, res) => {
  try {
    const admins = await listAdminUsers();
    return res.json({ success: true, data: admins });
  } catch (error) {
    console.error("Server: failed to list admins", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load admins.",
    });
  }
});

app.post("/api/auth/admins", requireAuth, requireAdmin, async (req, res) => {
  const { firstName, lastName, email, mobile, password } = req.body || {};

  const normalizedFirstName = String(firstName || "").trim();
  const normalizedLastName = String(lastName || "").trim();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedMobile = String(mobile || "").trim();
  const normalizedPassword = String(password || "");

  if (
    !normalizedFirstName ||
    !normalizedLastName ||
    !normalizedEmail ||
    !normalizedMobile ||
    !normalizedPassword
  ) {
    return res.status(400).json({
      success: false,
      message: "First name, last name, email, mobile and password are required.",
    });
  }

  const existingUser = await findAnyUserByEmail(normalizedEmail);
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: "User with this email already exists.",
    });
  }

  try {
    const created = await createAdminUser({
      firstName: normalizedFirstName,
      lastName: normalizedLastName,
      email: normalizedEmail,
      mobile: normalizedMobile,
      password: normalizedPassword,
    });

    if (!created) {
      return res.status(500).json({
        success: false,
        message: "Unable to create admin user.",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Admin user created successfully.",
    });
  } catch (error) {
    console.error("Server: failed to create admin", error);
    return res.status(500).json({
      success: false,
      message: "Unable to create admin user.",
    });
  }
});

app.put("/api/auth/admins/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ success: false, message: "Invalid admin id." });
  }

  const payload = {
    firstName: req.body?.firstName,
    lastName: req.body?.lastName,
    mobile: req.body?.mobile,
    email: req.body?.email,
    status: req.body?.status !== undefined ? normalizeStatus(req.body.status) : undefined,
  };

  try {
    const updated = await updateAdminUserById(id, payload);
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Admin user not found.",
      });
    }

    return res.json({
      success: true,
      message: "Admin user updated successfully.",
    });
  } catch (error) {
    console.error("Server: failed to update admin", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update admin user.",
    });
  }
});

app.delete("/api/auth/admins/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ success: false, message: "Invalid admin id." });
  }

  try {
    const deleted = await deleteAdminUserById(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Admin user not found.",
      });
    }

    return res.json({
      success: true,
      message: "Admin user deleted successfully.",
    });
  } catch (error) {
    console.error("Server: failed to delete admin", error);
    return res.status(500).json({
      success: false,
      message: "Unable to delete admin user.",
    });
  }
});


app.get("/api/auth/respondents", requireAuth, requireAdmin, async (req, res) => {
  try {
    const respondents = await listRespondents();
    return res.json({ success: true, data: respondents });
  } catch (error) {
    console.error("Server: failed to list respondents", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load respondents.",
    });
  }
});

app.post("/api/auth/respondents", requireAuth, requireAdmin, async (req, res) => {
  const { firstName, lastName, email, mobile, password } = req.body || {};

  const normalizedFirstName = String(firstName || "").trim();
  const normalizedLastName = String(lastName || "").trim();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedMobile = String(mobile || "").trim();
  const normalizedPassword = String(password || "");

  if (
    !normalizedFirstName ||
    !normalizedLastName ||
    !normalizedEmail ||
    !normalizedMobile ||
    !normalizedPassword
  ) {
    return res.status(400).json({
      success: false,
      message: "First name, last name, email, mobile and password are required.",
    });
  }

  const existingUser = await findAnyUserByEmail(normalizedEmail);
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: "User with this email already exists.",
    });
  }

  try {
    const created = await createRespondent({
      firstName: normalizedFirstName,
      lastName: normalizedLastName,
      email: normalizedEmail,
      mobile: normalizedMobile,
      password: normalizedPassword,
    });

    if (!created) {
      return res.status(500).json({
        success: false,
        message: "Unable to create respondent.",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Respondent created successfully.",
    });
  } catch (error) {
    console.error("Server: failed to create respondent", error);
    return res.status(500).json({
      success: false,
      message: "Unable to create respondent.",
    });
  }
});

app.put("/api/auth/respondents/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ success: false, message: "Invalid respondent id." });
  }

  const payload = {
    firstName: req.body?.firstName,
    lastName: req.body?.lastName,
    mobile: req.body?.mobile,
    email: req.body?.email,
    status: req.body?.status !== undefined ? normalizeStatus(req.body.status) : undefined,
  };

  try {
    const updated = await updateRespondentById(id, payload);
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Respondent not found.",
      });
    }

    return res.json({
      success: true,
      message: "Respondent updated successfully.",
    });
  } catch (error) {
    console.error("Server: failed to update respondent", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update respondent.",
    });
  }
});

app.delete("/api/auth/respondents/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ success: false, message: "Invalid respondent id." });
  }

  try {
    const deleted = await deleteRespondentById(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Respondent not found.",
      });
    }

    return res.json({
      success: true,
      message: "Respondent deleted successfully.",
    });
  } catch (error) {
    console.error("Server: failed to delete respondent", error);
    return res.status(500).json({
      success: false,
      message: "Unable to delete respondent.",
    });
  }
});

app.post("/api/auth/forgot-password", async (req, res) => {
  const { email, newPassword } = req.body || {};
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedPassword = String(newPassword || "");

  if (!normalizedEmail || !normalizedPassword) {
    return res.status(400).json({
      success: false,
      message: "Email and new password are required.",
    });
  }

  if (normalizedPassword.length < 8) {
    return res.status(400).json({
      success: false,
      message: "New password must be at least 8 characters.",
    });
  }

  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(normalizedPassword)) {
    return res.status(400).json({
      success: false,
      message: "Password must contain uppercase, lowercase and number.",
    });
  }

  const updated = await updateUserPasswordByEmail(normalizedEmail, normalizedPassword);

  if (!updated) {
    return res.status(404).json({
      success: false,
      message: "No active user found for this email.",
    });
  }

  return res.json({
    success: true,
    message: "Password updated successfully.",
  });
});

app.get("/api/auth/me", requireAuth, (req, res) => {
  res.json({
    success: true,
    data: {
      email: req.auth.email,
      role: req.auth.role,
      firstName: req.auth.firstName,
      lastName: req.auth.lastName,
      mobile: req.auth.mobile,
    },
  });
});

app.post("/api/auth/logout", requireAuth, (req, res) => {
  sessions.delete(req.auth.token);
  res.json({ success: true });
});

// POST /api/auth/change-password — change admin password (simple demo: requires auth)
app.post("/api/auth/change-password", requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body || {};

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: "Current and new password are required." });
  }

  if (String(currentPassword) !== String(ADMIN_PASSWORD)) {
    return res.status(403).json({ success: false, message: "Current password is incorrect." });
  }

  if (String(newPassword).length < 8) {
    return res.status(400).json({ success: false, message: "New password must be at least 8 characters." });
  }

  // basic complexity check
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(String(newPassword))) {
    return res.status(400).json({ success: false, message: "Password must contain uppercase, lowercase and number." });
  }

  ADMIN_PASSWORD = String(newPassword);
  return res.json({ success: true, message: "Password updated (in-memory)." });
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

app.get("/api/submissions", async (req, res) => {
  try {
    const upstream = await fetch(`${GOOGLE_SCRIPT_URL}?action=getSubmissions`);
    const data = await upstream.json();
    res.json(data);
  } catch (error) {
    console.error("Server: failed to load submissions", error);
    res.status(502).json({
      success: false,
      error: "Failed to load submissions from Google Script.",
    });
  }
});

app.listen(PORT, async () => {
  const fileExists = fs.existsSync(FILE_PATH);
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`File: ${FILE_PATH}`);
  console.log(`File exists: ${fileExists}`);
  console.log(`Frontend origin: ${FRONTEND_ORIGIN}`);
  console.log(`MySQL Database: ${process.env.DB_NAME}@${process.env.DB_HOST}`);

  try {
    const conn = await db.getConnection();
    console.log("Database Connected Successfully");
    conn.release();
  } catch (err) {
    console.error("Database Connection Failed:", err.message);
  }
});
