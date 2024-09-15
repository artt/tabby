/* eslint-disable no-undef */
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: {tabId: tab.id},
    func: contentScriptFunc,
    args: ['action'],
  })
})

function contentScriptFunc(name) {
  alert(`"${name}" executed`);
}

chrome.commands.onCommand.addListener((command) => {
  console.log(`Command: ${command}`);
})
