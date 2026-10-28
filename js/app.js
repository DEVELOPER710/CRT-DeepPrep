// DeepPrep prototype. No framework, no backend. Data lives in localStorage.
const KEY = "deepprep.v1";
const $ = (s) => document.querySelector(s);
const app = $("#app");
const SESSION_LEN = 6;      // questions per quiz
const TIME_LIMIT = 30;      // seconds per question
const POINTS_PER_CORRECT = 10;
const MIN_EXPLAIN = 15;     // characters needed before help unlocks
const MIN_TAKEAWAY = 10;
const WEAK_BELOW = 60;      // % accuracy that counts as weak
const WEAK_MIN_TRIES = 3;

function esc(t) {
  return String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function emptyData() { return { attempts: [], sessions: [], reflections: [], takeaways: [], locked: 0, unlocked: 0 }; }
function load() {
  try { const d = JSON.parse(localStorage.getItem(KEY)); if (d) return Object.assign(emptyData(), d); } catch (e) {}
  return emptyData();
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {} }
function fmtDate(ts) { return new Date(ts).toLocaleDateString(undefined, { day: "numeric", month: "short" }); }

let data = load();
let S = null;          // current quiz session
let timerId = null;
let socraticMode = false;

// ---------- navigation ----------
document.querySelectorAll("nav button").forEach((b) => b.addEventListener("click", () => show(b.dataset.view)));
function show(view) {
  stopTimer();
  document.querySelectorAll("nav button").forEach((b) => b.classList.toggle("active", b.dataset.view === view));
  if (view === "practice") { S = null; renderHome(); }
  else if (view === "progress") renderProgress();
  else renderAbout();
}

// ---------- practice home ----------
function renderHome() {
  let h = `<h2>Practice</h2><p class="mute">Pick a topic. Difficulty moves up after two correct answers in a row and down after a miss.</p>`;
  h += `<div class="card"><label style="margin:0"><input type="checkbox" id="soc" ${socraticMode ? "checked" : ""}> Socratic mode: guiding questions instead of a direct hint</label></div>`;
  TOPICS.forEach((t) => {
    const tries = data.attempts.filter((a) => a.topic === t.id);
    const acc = tries.length ? Math.round((100 * tries.filter((a) => a.correct).length) / tries.length) + "% so far" : "not tried yet";
    h += `<div class="card topic"><div><h3>${esc(t.name)}</h3><span class="mute">${t.questions.length} questions, ${acc}</span></div>
          <button class="btn" data-topic="${t.id}">Start quiz</button></div>`;
  });
  app.innerHTML = h;
  $("#soc").addEventListener("change", (e) => (socraticMode = e.target.checked));
  app.querySelectorAll("[data-topic]").forEach((b) => b.addEventListener("click", () => startQuiz(b.dataset.topic)));
}

// ---------- quiz ----------
function startQuiz(topicId) {
  const topic = TOPICS.find((t) => t.id === topicId);
  S = { topic, used: [], level: 1, streak: 0, n: 0, total: Math.min(SESSION_LEN, topic.questions.length), correct: 0, q: null };
  nextQuestion();
}
function pickQuestion() {
  const pool = S.topic.questions.filter((q) => !S.used.includes(q.id));
  pool.sort((a, b) => Math.abs(a.level - S.level) - Math.abs(b.level - S.level));
  return pool[0];
}
function nextQuestion() {
  if (S.n >= S.total) return renderResult();
  S.q = pickQuestion();
  S.used.push(S.q.id);
  S.n++;
  S.picked = null; S.soc = 0; S.timeLeft = TIME_LIMIT;
  renderQuestion();
  startTimer();
}
function renderQuestion() {
  const q = S.q;
  let h = `<div class="meta"><span>${esc(S.topic.name)}: question ${S.n} of ${S.total} (level ${q.level})</span><span class="timer" id="timer"></span></div>
    <div class="card"><div class="qtext">${esc(q.q)}</div><div id="opts">`;
  q.options.forEach((o, i) => (h += `<button class="opt" data-i="${i}">${esc(o)}</button>`));
  h += `</div>
    <label for="why">Before you check: how would you work this out? (explain in your own words)</label>
    <textarea id="why" placeholder="Write at least a sentence. Help unlocks once you have."></textarea>
    <p class="mute" id="whyNote">${MIN_EXPLAIN} characters needed to unlock help.</p>
    <button class="btn alt" id="helpBtn" disabled>${socraticMode ? "Ask me a guiding question" : "Show hint"}</button>
    <div id="helpBox"></div>
    <div style="margin-top:14px"><button class="btn" id="submit" disabled>Check answer</button></div>
    <div id="result"></div></div>`;
  app.innerHTML = h;
  app.querySelectorAll(".opt").forEach((b) => b.addEventListener("click", () => {
    S.picked = Number(b.dataset.i);
    app.querySelectorAll(".opt").forEach((x) => x.classList.toggle("sel", x === b));
    $("#submit").disabled = false;
  }));
  $("#why").addEventListener("input", (e) => {
    const n = e.target.value.trim().length;
    $("#helpBtn").disabled = n < MIN_EXPLAIN;
    $("#whyNote").textContent = n < MIN_EXPLAIN ? `${MIN_EXPLAIN - n} more characters to unlock help.` : "Help unlocked.";
  });
  $("#helpBtn").addEventListener("click", showHelp);
  $("#submit").addEventListener("click", () => submitAnswer(false));
  updateTimer();
}
function showHelp() {
  const q = S.q, box = $("#helpBox");
  if (!socraticMode) { box.innerHTML = `<div class="help"><b>Hint:</b> ${esc(q.hint)}</div>`; return; }
  if (S.soc < q.socratic.length) {
    box.insertAdjacentHTML("beforeend", `<div class="help">${esc(q.socratic[S.soc])}</div>`);
    S.soc++;
  }
  if (S.soc >= q.socratic.length) { $("#helpBtn").disabled = true; $("#helpBtn").textContent = "No more guiding questions"; }
}
function submitAnswer(timedOut) {
  stopTimer();
  const q = S.q;
  const ok = !timedOut && S.picked === q.answer;
  app.querySelectorAll(".opt").forEach((b, i) => {
    b.disabled = true;
    if (i === q.answer) b.classList.add("right");
    else if (i === S.picked) b.classList.add("wrong");
  });
  $("#submit").disabled = true; $("#helpBtn").disabled = true; $("#why").disabled = true;
  data.attempts.push({ ts: Date.now(), topic: S.topic.id, qid: q.id, correct: ok, level: q.level });
  if (ok) { S.correct++; S.streak++; if (S.streak >= 2 && S.level < 3) { S.level++; S.streak = 0; } }
  else { S.streak = 0; if (S.level > 1) S.level--; }
  save();
  const last = S.n >= S.total;
  $("#result").innerHTML = `<div class="fb ${ok ? "ok" : "no"}"><b>${timedOut ? "Time is up." : ok ? "Correct." : "Not quite."}</b> ${esc(q.explain)}</div>
    <button class="btn" id="next">${last ? "See results" : "Next question"}</button>`;
  $("#next").addEventListener("click", nextQuestion);
}

// ---------- timer ----------
function startTimer() { stopTimer(); timerId = setInterval(() => { S.timeLeft--; updateTimer(); if (S.timeLeft <= 0) submitAnswer(true); }, 1000); }
function stopTimer() { if (timerId) clearInterval(timerId); timerId = null; }
function updateTimer() {
  const t = $("#timer"); if (!t) return;
  t.textContent = `0:${String(Math.max(S.timeLeft, 0)).padStart(2, "0")}`;
  t.classList.toggle("low", S.timeLeft <= 10);
}

// ---------- results, reflection, reward lock ----------
function renderResult() {
  const earned = S.correct * POINTS_PER_CORRECT;
  data.locked += earned;
  data.sessions.push({ ts: Date.now(), topic: S.topic.id, score: S.correct, total: S.total });
  save();
  const topicName = S.topic.name;
  app.innerHTML = `<h2>Quiz finished</h2>
    <div class="card"><p class="pts">You got <b>${S.correct} of ${S.total}</b> in ${esc(topicName)}. That is ${earned} points, added to your locked points.</p></div>
    <div class="card"><h3 style="margin-top:0">Reflection</h3>
      <p class="mute">Be honest: recalling an answer is not the same as understanding it.</p>
      <label for="rate">How well did you understand this round?</label>
      <select id="rate"><option value="1">1: mostly guessing or recalling</option><option value="2">2</option><option value="3" selected>3: partly understood</option><option value="4">4</option><option value="5">5: could teach it to someone</option></select>
      <label for="note">What was unclear?</label><textarea id="note"></textarea>
      <p><button class="btn" id="saveRef">Save reflection</button> <span id="refMsg" class="mute"></span></p></div>
    ${takeawayCard()}
    <button class="btn alt" id="again">Back to topics</button>`;
  $("#saveRef").addEventListener("click", () => {
    data.reflections.push({ ts: Date.now(), topic: topicName, rating: Number($("#rate").value), note: $("#note").value.trim() });
    save(); $("#saveRef").disabled = true; $("#refMsg").textContent = "Saved.";
  });
  $("#again").addEventListener("click", () => show("practice"));
  bindTakeaway(renderResultAfterUnlock);
}
function renderResultAfterUnlock() { const c = $("#takeCard"); if (c) c.outerHTML = takeawayCard(); bindTakeaway(renderResultAfterUnlock); }
function takeawayCard() {
  return `<div class="card" id="takeCard"><h3 style="margin-top:0">Study Room</h3>
    <p class="pts">Locked: <span class="lock">${data.locked}</span> &nbsp; Unlocked: <b>${data.unlocked}</b></p>
    ${data.locked > 0 ? `<p class="mute">Discuss a question with a classmate, then write what you took away from it. That unlocks your points.</p>
    <label for="take">Takeaway from your peer discussion</label><input type="text" id="take" placeholder="e.g. We worked out why default lists are shared between calls">
    <p><button class="btn" id="unlock">Unlock ${data.locked} points</button> <span class="mute" id="takeMsg"></span></p>` : `<p class="mute">Nothing locked right now. Finish a quiz to earn points.</p>`}</div>`;
}
function bindTakeaway(after) {
  const b = $("#unlock"); if (!b) return;
  b.addEventListener("click", () => {
    const text = $("#take").value.trim();
    if (text.length < MIN_TAKEAWAY) { $("#takeMsg").textContent = `Write at least ${MIN_TAKEAWAY} characters.`; return; }
    data.takeaways.push({ ts: Date.now(), text });
    data.unlocked += data.locked; data.locked = 0; save(); after();
  });
}

// ---------- progress ----------
function renderProgress() {
  let h = `<h2>Progress</h2>`;
  if (!data.attempts.length) {
    h += `<div class="card"><p>No attempts yet. Take a quiz in Practice and your accuracy will show up here.</p></div>`;
  } else {
    h += `<div class="card"><h3 style="margin-top:0">Accuracy by topic</h3>`;
    TOPICS.forEach((t) => {
      const a = data.attempts.filter((x) => x.topic === t.id);
      if (!a.length) return;
      const pct = Math.round((100 * a.filter((x) => x.correct).length) / a.length);
      const weak = a.length >= WEAK_MIN_TRIES && pct < WEAK_BELOW;
      h += `<div class="bar-row"><span>${esc(t.name)}</span><div class="track"><div class="fill ${weak ? "weak" : ""}" style="width:${pct}%"></div></div><span>${pct}% (${a.length})</span>${weak ? '<span class="tag">weak</span>' : ""}</div>`;
    });
    h += `<p class="mute">A topic is flagged weak when accuracy is under ${WEAK_BELOW}% after at least ${WEAK_MIN_TRIES} attempts.</p></div>`;
    h += `<div class="card"><h3 style="margin-top:0">Recent quizzes</h3><ul class="log">`;
    data.sessions.slice(-8).reverse().forEach((s) => {
      const t = TOPICS.find((x) => x.id === s.topic);
      h += `<li>${fmtDate(s.ts)}: ${esc(t ? t.name : s.topic)}, ${s.score}/${s.total}</li>`;
    });
    h += `</ul></div>`;
  }
  h += `<div class="card"><h3 style="margin-top:0">Reflection log</h3>`;
  if (!data.reflections.length) h += `<p class="mute">Reflections you save after a quiz appear here.</p>`;
  else {
    h += `<ul class="log">`;
    data.reflections.slice(-8).reverse().forEach((r) => (h += `<li>${fmtDate(r.ts)}: ${esc(r.topic)}, understanding ${r.rating}/5${r.note ? "<br>" + esc(r.note) : ""}</li>`));
    h += `</ul>`;
  }
  h += `</div>${takeawayCard()}<button class="btn alt" id="reset">Clear all my data</button>`;
  app.innerHTML = h;
  bindTakeaway(renderProgress);
  $("#reset").addEventListener("click", () => {
    if (confirm("This deletes all your DeepPrep data from this browser. Continue?")) { data = emptyData(); save(); renderProgress(); }
  });
}

// ---------- about ----------
function renderAbout() {
  app.innerHTML = `<h2>About DeepPrep</h2>
    <div class="card"><p>Most exam-prep apps reward speed and recall. DeepPrep slows that down: you explain your thinking before help appears, you get guiding questions instead of answers and you reflect on what you actually understood.</p>
    <p>Each feature in this prototype answers a risk raised in my Six Thinking Hats analysis.</p>
    <p>Created by Aryan Patil, PRN: 26070122281, from class CSE B-3 for CRT Assignment.</p></div>
    <div class="card"><ul class="log">
      <li><b>Adaptive quiz:</b> difficulty follows your recent answers.</li>
      <li><b>Explain-it-back:</b> help stays locked until you write your own reasoning.</li>
      <li><b>Socratic mode:</b> guiding questions, one at a time.</li>
      <li><b>Reflection log:</b> rate real understanding after each quiz.</li>
      <li><b>Progress page:</b> accuracy per topic over time, with weak topics flagged.</li>
      <li><b>Study Room lock:</b> points unlock after you record a peer-discussion takeaway.</li></ul></div>
    <p class="mute">Prototype note: hints and guiding questions are pre-written for each question. A full version would generate them with an AI model and live study rooms would need a backend.</p>`;
}

show("practice");
