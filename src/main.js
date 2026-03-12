import './style.css';
import { formatTime } from './utils.js';
import { createRunnerRow } from './runnerRow.js';

const runnerContainer = document.querySelector('#runner-rows');
const addRunnerBtn = document.querySelector('#add-runner');
const startRunBtn = document.querySelector('#start-run');
const globalTimerDisplay = document.querySelector('#global-timer');
const resetAllBtn = document.querySelector('#reset-all');
const resetDialog = document.querySelector('#reset-dialog');
const confirmResetBtn = document.querySelector('#confirm-reset');

const MAX_RUNNERS = 6;
let runnersConfig = [{ 
  id: 1, 
  name: '', 
  pushups: '', 
  situps: '', 
  locked: false, 
  finished: false, 
  laps: 0, 
  finalTime: null 
}];
let startTime = null;
let timerInterval = null;
let isRunning = false;

function renderRunners() {
  runnerContainer.innerHTML = '';
  runnersConfig.forEach(runner => {
    const runnerElement = createRunnerRow(runner, {
      isRunning,
      startTime,
      onUpdate: () => { renderRunners(); updateStartButtonState(); },
      onFinish: () => { renderRunners(); checkAllFinished(); },
      onRemove: (id) => { runnersConfig = runnersConfig.filter(r => r.id !== id); renderRunners(); updateStartButtonState(); }
    });
    runnerContainer.appendChild(runnerElement);
  });
  addRunnerBtn.disabled = runnersConfig.length >= MAX_RUNNERS || isRunning;
}

function updateStartButtonState() {
  const anyLocked = runnersConfig.some(r => r.locked);
  startRunBtn.disabled = isRunning || !anyLocked;
}

function checkAllFinished() {
  const lockedRunners = runnersConfig.filter(r => r.locked);
  if (lockedRunners.length > 0 && lockedRunners.every(r => r.finished)) {
    clearInterval(timerInterval);
    isRunning = false;
    updateStartButtonState();
    renderRunners();
  }
}

function startTimer() {
  isRunning = true;
  startTime = performance.now();
  timerInterval = setInterval(() => {
    globalTimerDisplay.textContent = formatTime(performance.now() - startTime);
  }, 10);
  renderRunners();
  updateStartButtonState();
}

addRunnerBtn.addEventListener('click', () => {
  if (runnersConfig.length < MAX_RUNNERS) {
    const newId = runnersConfig.length > 0 ? Math.max(...runnersConfig.map(r => r.id)) + 1 : 1;
    runnersConfig.push({ 
      id: newId, 
      name: '', 
      pushups: '', 
      situps: '', 
      locked: false, 
      finished: false, 
      laps: 0, 
      finalTime: null 
    });
    renderRunners();
  }
});

startRunBtn.addEventListener('click', startTimer);
resetAllBtn.addEventListener('click', () => resetDialog.showModal());
confirmResetBtn.addEventListener('click', () => {
  clearInterval(timerInterval);
  isRunning = false;
  startTime = null;
  globalTimerDisplay.textContent = '00:00.00';
  runnersConfig = [{ 
    id: 1, 
    name: '', 
    pushups: '', 
    situps: '', 
    locked: false, 
    finished: false, 
    laps: 0, 
    finalTime: null 
  }];
  renderRunners();
  updateStartButtonState();
});

// Initial Init
renderRunners();
updateStartButtonState();
