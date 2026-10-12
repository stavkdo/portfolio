import { audio } from "./audio";

/** Turn sound on or off, keep every toggle in sync and tell listeners. */
export async function setSound(on: boolean) {
  await audio.setEnabled(on);
  document.querySelectorAll<HTMLButtonElement>(".sound").forEach((btn) => {
    btn.setAttribute("aria-pressed", String(on));
    const label = btn.querySelector(".sound__label");
    if (label) label.textContent = on ? "Sound on" : "Sound off";
  });
  window.dispatchEvent(new CustomEvent("sound:change", { detail: { on } }));
}

document.querySelectorAll<HTMLButtonElement>(".sound").forEach((btn) => {
  btn.addEventListener("click", () => setSound(!audio.enabled));
});
