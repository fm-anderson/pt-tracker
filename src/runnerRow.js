import { formatTime } from "./utils.js";

export function createRunnerRow(runner, options) {
  const { isRunning, startTime, onUpdate, onFinish, onRemove } = options;
  const runnerTemplate = document.querySelector("#runner-template");
  const clone = runnerTemplate.content.cloneNode(true);
  const row = clone.querySelector(".runner-row");
  row.setAttribute("data-id", runner.id);

  const setupView = row.querySelector(".identity-setup");
  const activeView = row.querySelector(".identity-active");
  const nameInput = row.querySelector(".runner-name");
  const puInput = row.querySelector(".pushups-input");
  const suInput = row.querySelector(".situps-input");

  const displayName = row.querySelector(".display-name");
  const displayStats = row.querySelector(".display-stats");
  const lapDisplay = row.querySelector(".lap-counter");

  const lockBtn = row.querySelector(".lock-btn");
  const finishBtn = row.querySelector(".finish-btn");
  const removeBtn = row.querySelector(".remove-btn");
  const resultDisplay = row.querySelector(".result-display");
  const identity = row.querySelector(".runner-identity");

  // sync state
  nameInput.value = runner.name || "";
  puInput.value = runner.pushups || "";
  suInput.value = runner.situps || "";

  if (runner.locked) {
    setupView.style.display = "none";
    activeView.style.display = "block";
    displayName.textContent = runner.name;
    displayStats.textContent = `PU: ${runner.pushups || 0} | SU: ${runner.situps || 0}`;
    lapDisplay.textContent = `Laps: ${runner.laps}`;
    lockBtn.textContent = "Unlock";
  } else {
    setupView.style.display = "block";
    activeView.style.display = "none";
    lockBtn.textContent = "Lock";
  }

  if (isRunning) lockBtn.disabled = true;
  removeBtn.disabled = runner.locked || isRunning;
  finishBtn.disabled = !isRunning || !runner.locked || runner.finished;

  if (runner.finished && runner.finalTime) {
    resultDisplay.textContent = formatTime(runner.finalTime);
    row.classList.add("finished");
  }

  nameInput.addEventListener("input", (e) => {
    runner.name = e.target.value.trim();
  });

  puInput.addEventListener("input", (e) => {
    runner.pushups = e.target.value;
  });

  suInput.addEventListener("input", (e) => {
    runner.situps = e.target.value;
  });

  lockBtn.addEventListener("click", () => {
    if (!runner.locked) {
      if (!runner.name || !runner.pushups || !runner.situps) {
        alert("Please enter Name, Pushups, and Situps first.");
        return;
      }
    }
    runner.locked = !runner.locked;
    onUpdate();
  });

  removeBtn.addEventListener("click", () => onRemove(runner.id));

  identity.addEventListener("click", (e) => {
    if (e.target.tagName === "INPUT") return;

    if (isRunning && runner.locked && !runner.finished) {
      runner.laps++;
      lapDisplay.textContent = `Laps: ${runner.laps}`;
      identity.classList.add('pulse');
      setTimeout(() => identity.classList.remove('pulse'), 200);
      onUpdate();
    }
  });

  finishBtn.addEventListener("click", () => {
    if (isRunning && !runner.finished) {
      runner.finished = true;
      runner.finalTime = performance.now() - startTime;
      onFinish();
    }
  });

  return clone;
}
