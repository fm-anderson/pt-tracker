import { formatTime } from "./utils.js";

export function createRunnerRow(runner, options) {
  const { isRunning, startTime, onUpdate, onFinish, onRemove } = options;
  const runnerTemplate = document.querySelector("#runner-template");
  const clone = runnerTemplate.content.cloneNode(true);
  const row = clone.querySelector(".runner-row");
  row.setAttribute("data-id", runner.id);

  const nameInput = row.querySelector(".runner-name");
  const lapDisplay = row.querySelector(".lap-counter");
  const lockBtn = row.querySelector(".lock-btn");
  const finishBtn = row.querySelector(".finish-btn");
  const removeBtn = row.querySelector(".remove-btn");
  const resultDisplay = row.querySelector(".result-display");
  const identity = row.querySelector(".runner-identity");

  nameInput.value = runner.name;
  nameInput.placeholder = `Runner ${runner.id} Name`;
  nameInput.disabled = runner.locked;

  lapDisplay.textContent = `Laps: ${runner.laps}`;
  lockBtn.textContent = runner.locked ? "Unlock" : "Lock";
  if (isRunning) lockBtn.disabled = true;

  removeBtn.disabled = runner.locked || isRunning;
  finishBtn.disabled = !isRunning || !runner.locked || runner.finished;

  if (runner.finished && runner.finalTime) {
    resultDisplay.textContent = formatTime(runner.finalTime);
    row.classList.add("finished");
  }

  nameInput.addEventListener("input", (e) => {
    runner.name = e.target.value.trim();
    onUpdate();
  });

  lockBtn.addEventListener("click", () => {
    if (!runner.locked && !runner.name) {
      alert("Please enter a runner name first.");
      return;
    }
    runner.locked = !runner.locked;
    onUpdate();
  });

  removeBtn.addEventListener("click", () => onRemove(runner.id));

  identity.addEventListener("click", (e) => {
    if (e.target.tagName === "INPUT" && !runner.locked) return;
    if (isRunning && runner.locked && !runner.finished) {
      runner.laps++;
      lapDisplay.textContent = `Laps: ${runner.laps}`;
      identity.classList.add("pulse");
      setTimeout(() => identity.classList.remove("pulse"), 200);
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
