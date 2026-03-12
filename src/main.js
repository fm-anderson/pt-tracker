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

const MAX_RUNNERS = 6;
const STORAGE_KEY = "pt_tracker_state";

let runnersConfig = [
  {
    id: 1,
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
  };
  storage.set(STORAGE_KEY, state);
}

function loadState() {
  const savedState = storage.get(STORAGE_KEY);
  if (savedState) {
    runnersConfig = savedState.runnersConfig;
    isRunning = savedState.isRunning;
    lastElapsedTime = savedState.lastElapsedTime || 0;

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
}

function hasAnyFinished() {
  return runnersConfig.some((r) => r.finished);
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

addRunnerBtn.addEventListener("click", () => {
  if (runnersConfig.length < MAX_RUNNERS) {
    const newId =
      runnersConfig.length > 0
        ? Math.max(...runnersConfig.map((r) => r.id)) + 1
        : 1;
    runnersConfig.push({
      id: newId,
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

confirmResetBtn.addEventListener("click", () => {
  clearInterval(timerInterval);
  isRunning = false;
  startTime = null;
  lastElapsedTime = 0;
  globalTimerDisplay.textContent = "00:00.00";
  runnersConfig = [
    {
      id: 1,
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
});

// init
loadState();
renderRunners();
updateStartButtonState();
