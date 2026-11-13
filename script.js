/* =========================================================
   Report card page
   Reads REPORT_DATA (from data.js), finds the student in "show_report_card_for",
   calculates the results and draws the page in English or French.
   ========================================================= */

/* ---------- 1. Texts in both languages ----------
   To add or change a word, edit it here. Nothing else needs to change. */
const TEXT = {
  en: {
    docTitle: "Student report card",
    student: "Student",
    studentId: "ID",
    className: "Class",
    term: "Term",
    subject: "Subject",
    coef: "Coef.",
    mark: "Mark /20",
    points: "Mark × coef.",
    remark: "Teacher's remark",
    total: "Total",
    average: "Weighted average",
    rank: "Rank",
    classAverage: "Class average",
    outOf: "out of 20",
    ofStudents: (n) => `of ${n} students`,
    formula: "Weighted average = sum of (mark × coefficient) ÷ sum of coefficients.",
    principal: "Principal's signature",
    parent: "Parent's signature",
    print: "Print",
    loadError: "Could not load data.js. Check that data.js is in the same folder as index.html.",
    notFound: (id) => `No student with ID ${id} was found in data.js.`,
  },
  fr: {
    docTitle: "Bulletin de notes",
    student: "Élève",
    studentId: "Matricule",
    className: "Classe",
    term: "Période",
    subject: "Matière",
    coef: "Coef.",
    mark: "Note /20",
    points: "Note × coef.",
    remark: "Appréciation de l'enseignant",
    total: "Total",
    average: "Moyenne pondérée",
    rank: "Rang",
    classAverage: "Moyenne de la classe",
    outOf: "sur 20",
    ofStudents: (n) => `sur ${n} élèves`,
    formula: "Moyenne pondérée = somme des (note × coefficient) ÷ somme des coefficients.",
    principal: "Signature du chef d'établissement",
    parent: "Signature du parent",
    print: "Imprimer",
    loadError: "Impossible de charger data.js. Vérifiez que data.js est dans le même dossier que index.html.",
    notFound: (id) => `Aucun élève avec le matricule ${id} dans data.js.`,
  },
};

/* ---------- 2. Remark rule (from "remark_rule" in the data) ----------
   Checked from the top: the first line whose "min" is reached wins. */
const REMARKS = [
  { min: 18, en: "Excellent",           fr: "Excellent" },
  { min: 15, en: "Very good",           fr: "Très bien" },
  { min: 13, en: "Good",                fr: "Bien" },
  { min: 11, en: "Average",             fr: "Assez bien" },
  { min: 10, en: "Fair",                fr: "Passable" },
  { min: 0,  en: "Weak, work harder",   fr: "Insuffisant" },
];

function remarkFor(mark, lang) {
  const rule = REMARKS.find((r) => mark >= r.min);
  return rule[lang];
}

/* ---------- 3. Calculations ---------- */

// Weighted average of one student: sum(mark × coef) / sum(coef)
function weightedAverage(marks, subjects) {
  let points = 0;
  let totalCoef = 0;
  marks.forEach((mark, i) => {
    points += mark * subjects[i].coef;
    totalCoef += subjects[i].coef;
  });
  return points / totalCoef;
}

// Rank = 1 + number of students with a strictly higher average.
// Students with the same average share the same rank.
// We round to 6 decimals first so tiny floating-point noise cannot break a tie.
function rankOf(student, allStudents, subjects) {
  const round = (x) => Math.round(x * 1e6) / 1e6;
  const mine = round(weightedAverage(student.marks, subjects));
  const better = allStudents.filter(
    (s) => round(weightedAverage(s.marks, subjects)) > mine
  );
  return better.length + 1;
}

// Class average = mean of every student's weighted average.
function classAverage(allStudents, subjects) {
  const sum = allStudents.reduce(
    (total, s) => total + weightedAverage(s.marks, subjects), 0
  );
  return sum / allStudents.length;
}

/* ---------- 4. Display helpers ---------- */

let data = null;                 // the report data (set at the bottom)
let lang = "en";                 // current language

// Numbers always show 2 decimals: 10.45 in English, 10,45 in French.
function fmt(n) {
  return new Intl.NumberFormat(lang === "fr" ? "fr-FR" : "en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

// Small helper to create an element with optional class and text.
// We use textContent (not innerHTML), so data from the JSON can never inject HTML.
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// "Collège Bilingue Les Étoiles" -> "CB" (used when there is no logo file)
function initials(name) {
  return name
    .split(/\s+/)
    .filter((w) => /^[A-ZÀ-Ý]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
}

/* ---------- 5. Build the page ---------- */

function render() {
  const t = TEXT[lang];
  const sheet = document.getElementById("sheet");
  sheet.replaceChildren();

  const { school, subjects, students } = data;
  const student = students.find((s) => s.id === data.show_report_card_for);

  if (!student) {
    sheet.append(el("p", "error", t.notFound(data.show_report_card_for)));
    return;
  }

  const avg = weightedAverage(student.marks, subjects);
  const rank = rankOf(student, students, subjects);
  const classAvg = classAverage(students, subjects);
  const totalCoef = subjects.reduce((sum, s) => sum + s.coef, 0);
  const totalPoints = avg * totalCoef;

  // --- Header: logo (or initials) + school name ---
  const head = el("header", "head");
  if (school.logo) {
    const img = el("img", "logo");
    img.src = school.logo;
    img.alt = school.name;
    head.append(img);
  } else {
    head.append(el("div", "logo-mono", initials(school.name)));
  }
  const titles = el("div");
  titles.append(el("h1", "school-name", school.name));
  titles.append(el("p", "school-city", school.city));
  head.append(titles);
  sheet.append(head);

  sheet.append(el("h2", "doc-title", t.docTitle));

  // --- Student information ---
  const info = el("dl", "info");
  [
    [t.student, student.name],
    [t.studentId, student.id],
    [t.className, data.class[lang]],
    [t.term, data.term[lang]],
  ].forEach(([label, value]) => {
    const row = el("div");
    row.append(el("dt", "", label), el("dd", "", value));
    info.append(row);
  });
  sheet.append(info);

  // --- Marks table ---
  const table = el("table");
  const headRow = el("tr");
  [t.subject, t.coef, t.mark, t.points, t.remark].forEach((label, i) => {
    const th = el("th", i >= 1 && i <= 3 ? "num" : "", label);
    th.scope = "col";
    headRow.append(th);
  });
  const thead = el("thead");
  thead.append(headRow);
  table.append(thead);

  const tbody = el("tbody");
  subjects.forEach((subject, i) => {
    const mark = student.marks[i];
    const tr = el("tr");
    tr.append(
      el("td", "", lang === "fr" ? subject.name_fr : subject.name_en),
      el("td", "num", String(subject.coef)),
      el("td", mark < 10 ? "num weak" : "num", fmt(mark)),
      el("td", "num", fmt(mark * subject.coef)),
      el("td", "", remarkFor(mark, lang))
    );
    tbody.append(tr);
  });
  table.append(tbody);

  const tfoot = el("tfoot");
  const totalRow = el("tr");
  totalRow.append(
    el("td", "", t.total),
    el("td", "num", String(totalCoef)),
    el("td", "num", ""),
    el("td", "num", fmt(totalPoints)),
    el("td", "", "")
  );
  tfoot.append(totalRow);
  table.append(tfoot);
  sheet.append(table);

  // --- Results: average, rank, class average ---
  const summary = el("section", "summary");
  [
    ["main", t.average, fmt(avg), t.outOf],
    ["", t.rank, `${rank} / ${students.length}`, t.ofStudents(students.length)],
    ["", t.classAverage, fmt(classAvg), t.outOf],
  ].forEach(([kind, label, value]) => {
    const box = el("div", kind ? "box " + kind : "box");
    box.append(el("span", "label", label), el("span", "value", value));
    summary.append(box);
  });
  sheet.append(summary);

  sheet.append(el("p", "note", t.formula));

  // --- Signatures ---
  const signatures = el("div", "signatures");
  signatures.append(el("div", "sign", t.principal), el("div", "sign", t.parent));
  sheet.append(signatures);

  // --- Keep the toolbar and the browser tab in the right language ---
  document.documentElement.lang = lang;
  document.title = `${t.docTitle} - ${student.name}`;
  document.getElementById("btn-print").textContent = t.print;
  document.getElementById("btn-en").setAttribute("aria-pressed", String(lang === "en"));
  document.getElementById("btn-fr").setAttribute("aria-pressed", String(lang === "fr"));
}

/* ---------- 6. Start ---------- */

function setLanguage(newLang) {
  lang = newLang;
  if (data) render();
  // keep ?lang=fr in the address bar so the link can be shared
  const url = new URL(window.location);
  url.searchParams.set("lang", lang);
  history.replaceState(null, "", url);
}

document.getElementById("btn-en").addEventListener("click", () => setLanguage("en"));
document.getElementById("btn-fr").addEventListener("click", () => setLanguage("fr"));
document.getElementById("btn-print").addEventListener("click", () => window.print());

// The language can also be set with ?lang=fr in the link (default: English).
const requested = new URLSearchParams(window.location.search).get("lang");
if (requested === "fr" || requested === "en") lang = requested;

if (typeof REPORT_DATA === "undefined") {
  // data.js did not load (missing file or typo in it)
  document.getElementById("sheet").replaceChildren(el("p", "error", TEXT[lang].loadError));
} else {
  data = REPORT_DATA;
  render();
}
