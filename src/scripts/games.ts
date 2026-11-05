/*
  The puzzle games popup. The play buttons and the phone screenshots open a game
  right on this page instead of leaving the site. Without JavaScript they stay
  ordinary links to the live game.
*/

const dialog = document.querySelector<HTMLDialogElement>("dialog.game");

if (dialog) {
  const frame = dialog.querySelector<HTMLIFrameElement>(".game__frame")!;
  const stage = dialog.querySelector<HTMLElement>(".game__stage")!;

  /*
    The games are phone-sized pages whose pieces grow with the window's width.
    So they always get the same phone-width window (GAME_WIDTH wide), scaled to
    exactly fill the popup's width; the popup is shaped (420 x 740, see the CSS)
    so the window is always tall enough for the whole game. Both games appear
    at the same size, with no empty strip at the side and nothing cut off.
  */
  const GAME_WIDTH = 420;
  const fit = () => {
    const width = stage.clientWidth, height = stage.clientHeight; // inside the border
    if (!width || !height) return;
    const scale = width / GAME_WIDTH;
    frame.style.width = `${GAME_WIDTH}px`;
    frame.style.height = `${height / scale}px`;
    frame.style.transform = `scale(${scale})`;
  };
  new ResizeObserver(fit).observe(stage);

  let opener: HTMLElement | null = null;

  document.querySelectorAll<HTMLAnchorElement>("a[data-play]").forEach((a) => {
    a.addEventListener("click", (e) => {
      if (e.ctrlKey || e.metaKey || e.shiftKey) return; // let people open a real new tab if they ask for one
      e.preventDefault();
      opener = a;
      frame.title = a.dataset.label ?? "Puzzle game";
      frame.src = a.href;
      dialog.showModal();
      fit();
    });
  });

  dialog.querySelector(".game__close")?.addEventListener("click", () => dialog.close());

  // A click on the dimmed area around the popup closes it
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();
  });

  dialog.addEventListener("close", () => {
    frame.src = "about:blank"; // stop the game's timer
    opener?.focus();
  });
}
