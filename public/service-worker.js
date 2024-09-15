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

chrome.runtime.onInstalled.addListener(async () => {
  chrome.contextMenus.create({
    id: "sciHub",
    title: "Open in Sci-Hub",
    type: 'normal',
    contexts: ['selection'],
  })
  chrome.contextMenus.create({
    id: "openTav",
    title: "Open in TAV",
    type: 'normal',
    contexts: ['selection'],
  })
})

function tav(code) {
  const url = `https://thisav.com/en/${code}`
  // get all windows and find the first ingonito window
  chrome.windows.getAll({populate: false, windowTypes: ['normal']}, function(windows) {
    for (let w of windows) {
      if (w.incognito) {
          // Use this window.
          chrome.tabs.create({ url, windowId: w.id })
          return;
      }
    }
    // No incognito window found, open a new one.
    chrome.windows.create({ url, incognito: true });
  })
}

// listener for context menu click
chrome.contextMenus.onClicked.addListener((item, tab) => {

  // get the context menu item id
  const menuItemId = item.menuItemId

  // if link is clicked, and it starts with https://doi.org/,
  // or the regex matches DOI, then open it in Sci-Hub
  if (item.menuItemId === 'sciHub') {
    if (item.linkUrl?.startsWith('https://doi.org/') || item.selectionText?.match(/10\.\d{4,9}\/[-._;()/:A-Z0-9]+/i)) {
      const doi = item.linkUrl.replace('https://doi.org/', '');
      const url = `https://sci-hub.se/${doi}`;
      chrome.tabs.create({ url, index: tab.index + 1 });
    }
  }

  if (item.menuItemId === 'openTav') {
    console.log(item)
    if (item.selectionText?.match(/[a-zA-Z]+-?\d+/)) {
      tav(item.selectionText)
    }
    else if (item.linkUrl?.startsWith('https://t.co/')) {
      // get only the code from the url
      const code = item.linkUrl.split('/').pop()
      fetch(`https://js.api.artt.dev/tco/${code}`)
        .then(response => response.text())
        .then(data => {
          const match = data.match(/cid%3D([a-z]+\d+)%2F/)
          if (match) {
            tav(match[1])
          }
        })
    }
  }

})