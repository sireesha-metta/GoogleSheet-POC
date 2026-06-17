// ============================================================
// Leadership Reset Diagnostic - Google Apps Script
// Writes only into template answer cells (column D)
// ============================================================
var SHEET_ID = "1usg-fHi9euZAEfH9mg4TrW6YAQHqBlCOGKyvuHwKOoY";
var SHEET_TAB = "Sheet1";
var LOG_TAB = "Submissions";
var ROW_LOG_TAB = "Submissions_RowWise";

// Keys from FE payload (0-based row indexes from local xlsx) mapped to
// actual Google Sheet row numbers where the answer should be written in col D.
var ANSWER_ROW_INDEXES = [6, 7, 8, 9, 12, 13, 14, 15, 18, 19, 20, 21];

function valueOrEmpty(v) {
  return v == null ? "" : String(v);
}

function toAnswerTextOnly(v) {
  var text = valueOrEmpty(v).trim();
  if (!text) return "";

  // Convert common option prefixes like "A. ", "B) ", "1. " into plain text.
  return text.replace(/^([A-Da-d]|\d+)\s*[\.)\-:]\s*/, "").trim();
}

function appendSubmissionLog(ss, data) {
  var logSheet = ss.getSheetByName(LOG_TAB);
  if (!logSheet) {
    logSheet = ss.insertSheet(LOG_TAB);
  }

  var questionResponses = Array.isArray(data.questionResponses) ? data.questionResponses : [];
  var hasQuestionTextPayload = questionResponses.length > 0;

  if (hasQuestionTextPayload) {
    var rowSheet = ss.getSheetByName(ROW_LOG_TAB);
    if (!rowSheet) {
      rowSheet = ss.insertSheet(ROW_LOG_TAB);
    }

    if (rowSheet.getLastRow() === 0) {
      rowSheet.appendRow([
        "Timestamp",
        "Respondent",
        "Question No",
        "Question",
        "Selected Answer",
        "Score",
        "Weight",
      ]);
    }

    var submittedAt = valueOrEmpty(data.submittedAt || new Date().toISOString());
    var respondent = valueOrEmpty(data.respondent || "Anonymous");
    var totalScore = valueOrEmpty(data.totalScore);
    var totalWeightedScore = valueOrEmpty(data.totalWeightedScore);

    questionResponses.forEach(function (item, idx) {
      rowSheet.appendRow([
        submittedAt,
        respondent,
        valueOrEmpty(item.number || idx + 1),
        valueOrEmpty(item.question),
        toAnswerTextOnly(item.answer),
        valueOrEmpty(item.score),
        valueOrEmpty(item.weight),
      ]);
    });

    rowSheet.appendRow([
      "",
      "",
      "",
      "TOTALS",
      "",
      totalScore,
      totalWeightedScore,
    ]);

    return;
  }

  // Backward-compatible fallback
  if (logSheet.getLastRow() === 0) {
    logSheet.appendRow([
      "Timestamp",
      "Respondent",
      "Q1",
      "Q2",
      "Q3",
      "Q4",
      "Q5",
      "Q6",
      "Q7",
      "Q8",
      "Q9",
      "Q10",
      "Q11",
      "Q12",
    ]);
  }

  logSheet.appendRow([
    valueOrEmpty(data.submittedAt || new Date().toISOString()),
    valueOrEmpty(data.respondent || "Anonymous"),
    toAnswerTextOnly(data.q1),
    toAnswerTextOnly(data.q2),
    toAnswerTextOnly(data.q3),
    toAnswerTextOnly(data.q4),
    toAnswerTextOnly(data.q5),
    toAnswerTextOnly(data.q6),
    toAnswerTextOnly(data.q7),
    toAnswerTextOnly(data.q8),
    toAnswerTextOnly(data.q9),
    toAnswerTextOnly(data.q10),
    toAnswerTextOnly(data.q11),
    toAnswerTextOnly(data.q12),
  ]);
}

function findSheetByLooseName(ss, name) {
  var direct = ss.getSheetByName(name);
  if (direct) return direct;

  var target = String(name || "").replace(/\s+/g, "").toLowerCase();
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    var n = String(sheets[i].getName() || "").replace(/\s+/g, "").toLowerCase();
    if (n === target) return sheets[i];
  }
  return null;
}

function doPost(e) {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var data = JSON.parse((e && e.postData && e.postData.contents) || "{}");

    // Always keep an audit trail of respondent + timestamp + answers.
    appendSubmissionLog(ss, data);

    var sheet = findSheetByLooseName(ss, SHEET_TAB);
    var templateUpdated = false;
    var skipReason = "";

    if (!sheet) {
      skipReason = "Template tab not found for name: " + SHEET_TAB;
    } else {
      // Only write into a diagnostic template tab (expects D4 to mention "your answer").
      var d4 = String(sheet.getRange("D4").getDisplayValue() || "").toLowerCase();
      if (d4.indexOf("your answer") === -1) {
        skipReason = "Template header check failed on tab: " + sheet.getName();
      } else {
        var answersByRow = data.answersByRow || {};

        // Fill answer cells in D column for each question row.
        // rowIndex 6 => sheet row 7, ..., 21 => row 22.
        ANSWER_ROW_INDEXES.forEach(function (rowIndex, idx) {
          var qKey = "q" + (idx + 1);
          var value = "";

          if (answersByRow.hasOwnProperty(String(rowIndex))) {
            value = answersByRow[String(rowIndex)];
          } else if (answersByRow.hasOwnProperty(rowIndex)) {
            value = answersByRow[rowIndex];
          } else {
            value = data[qKey] || "";
          }

          sheet.getRange(rowIndex + 1, 4).setValue(toAnswerTextOnly(value));
        });
        templateUpdated = true;
      }
    }

    return ContentService
      .createTextOutput(
        JSON.stringify({
          success: true,
          message: templateUpdated
            ? "Template updated in column D. Submission logged in tab: " + LOG_TAB + "."
            : "Submission logged in tab: " + LOG_TAB + ". Template update skipped.",
          sheetId: SHEET_ID,
          sheetTab: sheet ? sheet.getName() : SHEET_TAB,
          logTab: LOG_TAB,
          templateUpdated: templateUpdated,
          skipReason: skipReason,
          spreadsheetUrl: ss.getUrl(),
        })
      )
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ status: "Leadership Reset Diagnostic API is live." }))
    .setMimeType(ContentService.MimeType.JSON);
}
