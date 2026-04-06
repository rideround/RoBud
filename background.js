// Background service worker

chrome.runtime.onMessage.addListener((req, snd, sendResponse) => {
  sendResponse({ ok: true });
  return true;
});
