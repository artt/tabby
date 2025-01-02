export function addWindowsAndTabsListeners(handleEvent: (_name: string, _payload: object) => void) {

  // add event listeners
  chrome.tabs.onActivated.addListener(
    (activeInfo) => handleEvent("activated", {activeInfo}));
  chrome.tabs.onAttached.addListener(
      (tabId, attachInfo) => handleEvent("attached", {tabId, attachInfo}));
  chrome.tabs.onCreated.addListener((tab) => handleEvent("created", {tab}));
  chrome.tabs.onDetached.addListener(
      (tabId, detachInfo) => handleEvent("detached", {tabId, detachInfo}));
  chrome.tabs.onHighlighted.addListener(
      (hightlighInfo) => handleEvent("hightlighted", {hightlighInfo}));
  chrome.tabs.onMoved.addListener(
      (tabId, moveInfo) => handleEvent("moved", {tabId, moveInfo}));
  chrome.tabs.onRemoved.addListener(
      (tabId, removeInfo) => handleEvent("removed", {tabId, removeInfo}));
  chrome.tabs.onReplaced.addListener(
      (addedTabId, removedTabId) => handleEvent("replaced", {addedTabId, removedTabId}));
  chrome.tabs.onUpdated.addListener(
      (tabId, changeInfo, tab) => handleEvent("updated", {tabId, changeInfo, tab}));
  chrome.tabGroups.onCreated.addListener((group) => handleEvent("groupCreated", {group}));
  chrome.tabGroups.onMoved.addListener((group) => handleEvent("groupMoved", {group}));
  chrome.tabGroups.onRemoved.addListener((group) => handleEvent("groupRemoved", {group}));
  chrome.tabGroups.onUpdated.addListener((group) => handleEvent("groupUpdated", {group}));
  chrome.tabGroups.onUpdated.addListener((group) => handleEvent("groupUpdated", {group}));
  chrome.windows.onCreated.addListener((window) => handleEvent("windowCreated", {window}));
  chrome.windows.onFocusChanged.addListener((windowId) => handleEvent("focusChanged", {windowId}));

}

function updateTheme(isDark: boolean) {
  const root = window.document.documentElement
  root.classList.remove("dark", "light")
  if (isDark) {
    root.classList.add("dark")
  } else {
    root.classList.add("light")
  }
}

export function addMediaQueryListener() {
  // https://medium.com/hypersphere-codes/detecting-system-theme-in-javascript-css-react-f6b961916d48
  const darkThemeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
  darkThemeMediaQuery.addEventListener("change", e => updateTheme(e.matches))
  updateTheme(darkThemeMediaQuery.matches)
}