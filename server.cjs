const express = require("express");
const cors = require("cors");
const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

const FILE_PATH = "C:\\Users\\siree\\Documents\\Leadership_Reset_Diagnostic_NR.xlsx";
const SHEET_NAME = "Diagnostic";
const SCORE_SHEET_NAME = "Scores";

// Row indices (0-based) that contain questions, mapped to xlsx D-column cell refs
const QUESTION_ROWS = [6, 7, 8, 9, 12, 13, 14, 15, 18, 19, 20, 21];

const SECTIONS = {
  6: "DECISION MAKING",
  12: "CONVERSATION PATTERNS",
  18: "LEADER SIGNALS",
};

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

// GET /api/questions — returns all questions with current answers
app.get("/api/questions", (req, res) => {
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
app.post("/api/answers", (req, res) => {
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

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`File: ${FILE_PATH}`);
});
