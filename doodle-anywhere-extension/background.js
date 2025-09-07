// background.js

chrome.action.onClicked.addListener((tab) => {
  // 🚫 Skip restricted URLs
  if (
    !tab.url ||
    tab.url.startsWith("chrome://") ||
    tab.url.startsWith("chrome-extension://") ||
    tab.url.startsWith("https://chrome.google.com/webstore")
  ) {
    console.log("🚫 Doodle Anywhere cannot run on this page:", tab.url);
    return;
  }

  // ✅ Inject content script safely
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content.js"]
  }).catch(err => {
    console.warn("⚠️ Failed to inject content script:", err);
  });
});
