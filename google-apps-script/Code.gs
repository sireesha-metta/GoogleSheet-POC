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
  // Always write row-wise submissions to ROW_LOG_TAB
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

  var questionResponses = Array.isArray(data.questionResponses) ? data.questionResponses.slice() : [];
  // If questionResponses is empty, build from answersByRow using ANSWER_ROW_INDEXES
  if (questionResponses.length === 0) {
    var answersByRow = data.answersByRow || {};
    for (var i = 0; i < ANSWER_ROW_INDEXES.length; i++) {
      var rowIndex = ANSWER_ROW_INDEXES[i];
      var value = "";
      if (answersByRow.hasOwnProperty(String(rowIndex))) {
        value = answersByRow[String(rowIndex)];
      } else if (answersByRow.hasOwnProperty(rowIndex)) {
        value = answersByRow[rowIndex];
      }
      questionResponses.push({
        number: i + 1,
        question: "",
        answer: value,
        score: 0,
        weight: 0,
      });
    }
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
      valueOrEmpty(item.question || ""),
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

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || "";

  if (action === "getSubmissions") {
    try {
      var ss = SpreadsheetApp.openById(SHEET_ID);
      var rowSheet = ss.getSheetByName(ROW_LOG_TAB);
      if (!rowSheet || rowSheet.getLastRow() < 2) {
        return ContentService
          .createTextOutput(JSON.stringify({ success: true, submissions: [] }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      var data = rowSheet.getDataRange().getValues();
      // Headers: Timestamp, Respondent, Question No, Question, Selected Answer, Score, Weight
      var submissions = [];
      var current = null;

      for (var i = 1; i < data.length; i++) {
        var row = data[i];
        var timestamp   = String(row[0] || "");
        var respondent  = String(row[1] || "");
        var questionNo  = String(row[2] || "");
        var question    = String(row[3] || "");
        var answer      = String(row[4] || "");
        var score       = row[5];
        var weight      = row[6];

        if (question === "TOTALS") {
          if (current) {
            current.totalScore = Number(score) || 0;
            current.totalWeightedScore = Number(weight) || 0;
            submissions.push(current);
            current = null;
          }
          continue;
        }

        if (!current ||
            current.timestamp !== timestamp ||
            current.respondent !== respondent) {
          current = {
            timestamp: timestamp,
            respondent: respondent,
            totalScore: 0,
            totalWeightedScore: 0,
            questions: []
          };
        }

        current.questions.push({
          number: questionNo,
          question: question,
          answer: answer,
          score: Number(score) || 0,
          weight: Number(weight) || 0
        });
      }

      if (current) submissions.push(current);

      return ContentService
        .createTextOutput(JSON.stringify({ success: true, submissions: submissions }))
        .setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
      return ContentService
        .createTextOutput(JSON.stringify({ success: false, error: String(err) }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  return ContentService
    .createTextOutput(JSON.stringify({ status: "Leadership Reset Diagnostic API is live." }))
    .setMimeType(ContentService.MimeType.JSON);
}
