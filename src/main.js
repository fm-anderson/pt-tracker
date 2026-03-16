import "./style.css";
import { formatTime, storage } from "./utils.js";
import { createRunnerRow } from "./runnerRow.js";

const runnerContainer = document.querySelector("#runner-rows");
const addRunnerBtn = document.querySelector("#add-runner");
const startRunBtn = document.querySelector("#start-run");
const globalTimerDisplay = document.querySelector("#global-timer");
const resetAllBtn = document.querySelector("#reset-all");
const resetDialog = document.querySelector("#reset-dialog");
const confirmResetBtn = document.querySelector("#confirm-reset");

const sessionNameInput = document.querySelector("#session-name");
const archiveSection = document.querySelector("#archive-section");
const archiveBtn = document.querySelector("#archive-session");
const viewHistoryBtn = document.querySelector("#view-history");
const historyDialog = document.querySelector("#history-dialog");
const historyList = document.querySelector("#history-list");
const closeHistoryBtn = document.querySelector("#close-history");
const clearHistoryBtn = document.querySelector("#clear-history");

const MAX_RUNNERS = 6;
const STORAGE_KEY = "pt_tracker_state";
const STORAGE_KEY_HISTORY = "pt_tracker_history";

let runnersConfig = [
  {
    id: crypto.randomUUID(),
    name: "",
    pushups: "",
    situps: "",
    locked: false,
    finished: false,
    laps: 0,
    finalTime: null,
  },
];
let startTime = null;
let timerInterval = null;
let isRunning = false;
let lastElapsedTime = 0;

function saveState() {
  const currentElapsed = isRunning
    ? performance.now() - startTime
    : lastElapsedTime;
  const state = {
    runnersConfig,
    isRunning,
    lastElapsedTime: currentElapsed,
    startTimestamp: isRunning ? Date.now() - currentElapsed : null,
    sessionName: sessionNameInput.value,
  };
  storage.set(STORAGE_KEY, state);
}

function loadState() {
  const savedState = storage.get(STORAGE_KEY);
  if (savedState) {
    runnersConfig = savedState.runnersConfig;
    isRunning = savedState.isRunning;
    lastElapsedTime = savedState.lastElapsedTime || 0;
    sessionNameInput.value = savedState.sessionName || "";

    if (isRunning && savedState.startTimestamp) {
      const elapsedSoFar = Date.now() - savedState.startTimestamp;
      startTime = performance.now() - elapsedSoFar;
      resumeTimer();
    } else {
      globalTimerDisplay.textContent = formatTime(lastElapsedTime);
    }
  }
}

function renderRunners() {
  runnerContainer.innerHTML = "";
  runnersConfig.forEach((runner) => {
    const runnerElement = createRunnerRow(runner, {
      isRunning,
      startTime,
      onUpdate: () => {
        saveState();
        renderRunners();
        updateStartButtonState();
      },
      onFinish: () => {
        lastElapsedTime = performance.now() - startTime;
        saveState();
        renderRunners();
        checkAllFinished();
      },
      onRemove: (id) => {
        runnersConfig = runnersConfig.filter((r) => r.id !== id);
        saveState();
        renderRunners();
        updateStartButtonState();
      },
    });
    runnerContainer.appendChild(runnerElement);
  });
  addRunnerBtn.disabled =
    runnersConfig.length >= MAX_RUNNERS || isRunning || hasAnyFinished();

  checkArchiveVisibility();
}

function hasAnyFinished() {
  return runnersConfig.some((r) => r.finished);
}

function checkArchiveVisibility() {
  const lockedRunners = runnersConfig.filter((r) => r.locked);
  const allFinished =
    lockedRunners.length > 0 && lockedRunners.every((r) => r.finished);
  archiveSection.style.display = allFinished ? "block" : "none";
}

function updateStartButtonState() {
  const anyLocked = runnersConfig.some((r) => r.locked);
  startRunBtn.disabled = isRunning || !anyLocked || hasAnyFinished();
}

function checkAllFinished() {
  const lockedRunners = runnersConfig.filter((r) => r.locked);
  if (lockedRunners.length > 0 && lockedRunners.every((r) => r.finished)) {
    stopTimer();
    renderRunners();
  }
}

function stopTimer() {
  clearInterval(timerInterval);
  isRunning = false;
  saveState();
  updateStartButtonState();
}

function resumeTimer() {
  timerInterval = setInterval(() => {
    const elapsed = performance.now() - startTime;
    globalTimerDisplay.textContent = formatTime(elapsed);
    lastElapsedTime = elapsed;
  }, 10);
}

function startTimer() {
  isRunning = true;
  startTime = performance.now();
  lastElapsedTime = 0;
  saveState();
  resumeTimer();
  renderRunners();
  updateStartButtonState();
}

function archiveSession() {
  const history = storage.get(STORAGE_KEY_HISTORY) || [];
  const newSession = {
    id: Date.now(),
    name: sessionNameInput.value || `Session ${new Date().toLocaleString()}`,
    timestamp: Date.now(),
    runners: runnersConfig.filter((r) => r.locked && r.finished),
  };

  history.unshift(newSession);
  storage.set(STORAGE_KEY_HISTORY, history);

  resetActiveSession();
}

function resetActiveSession() {
  clearInterval(timerInterval);
  isRunning = false;
  startTime = null;
  lastElapsedTime = 0;
  globalTimerDisplay.textContent = "00:00.00";
  sessionNameInput.value = "";
  runnersConfig = [
    {
      id: crypto.randomUUID(),
      name: "",
      pushups: "",
      situps: "",
      locked: false,
      finished: false,
      laps: 0,
      finalTime: null,
    },
  ];
  storage.remove(STORAGE_KEY);
  renderRunners();
  updateStartButtonState();
}

function renderHistory() {
  const history = storage.get(STORAGE_KEY_HISTORY) || [];
  historyList.innerHTML =
    history.length === 0 ? "<p>No sessions archived yet.</p>" : "";

  history.forEach((session) => {
    const sessionEl = document.createElement("div");
    sessionEl.className = "history-item";
    sessionEl.innerHTML = `
      <h3>${session.name} <small>${new Date(session.timestamp).toLocaleDateString()} ${new Date(session.timestamp).toLocaleTimeString()}</small></h3>
      <ul>
        ${session.runners
          .map(
            (r) => `
          <li><strong>${r.name}</strong>: ${formatTime(r.finalTime)} (PU: ${r.pushups}, SU: ${r.situps}, Laps: ${r.laps})</li>
        `,
          )
          .join("")}
      </ul>
      <hr>
    `;
    historyList.appendChild(sessionEl);
  });
}

addRunnerBtn.addEventListener("click", () => {
  if (runnersConfig.length < MAX_RUNNERS) {
    runnersConfig.push({
      id: crypto.randomUUID(),
      name: "",
      pushups: "",
      situps: "",
      locked: false,
      finished: false,
      laps: 0,
      finalTime: null,
    });
    saveState();
    renderRunners();
  }
});

startRunBtn.addEventListener("click", startTimer);
resetAllBtn.addEventListener("click", () => resetDialog.showModal());

confirmResetBtn.addEventListener("click", resetActiveSession);

sessionNameInput.addEventListener("input", saveState);

archiveBtn.addEventListener("click", archiveSession);

viewHistoryBtn.addEventListener("click", () => {
  renderHistory();
  historyDialog.showModal();
});

closeHistoryBtn.addEventListener("click", () => historyDialog.close());

clearHistoryBtn.addEventListener("click", () => {
  if (confirm("Are you sure you want to clear ALL history?")) {
    storage.remove(STORAGE_KEY_HISTORY);
    renderHistory();
  }
});

// init
loadState();
renderRunners();
updateStartButtonState();
