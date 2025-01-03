export async function ungroup() {
  const window = await chrome.windows.getCurrent({populate: true})
  chrome.tabs.ungroup(window.tabs!.map(tab => tab.id!))
}

// https://github.com/Litee/prevent-duplicate-tabs-chrome-extension/blob/master/src/background.ts
export async function deduplicate() {
  chrome.tabs.query({}, tabs => {
    const alreadyEncounteredTabUrls = new Set()
    tabs.forEach(tab => {
      if (alreadyEncounteredTabUrls.has(tab.url)) {
          chrome.tabs.remove(tab.id!);
      }
      alreadyEncounteredTabUrls.add(tab.url);
    })
  })
  // TODO: report how many tabs are closed in a toast
  // TODO: needo to check if the tabs really are the same?
}

function sortTabs(a: chrome.tabs.Tab, b: chrome.tabs.Tab) {
  // sort by the last part of the hostname first, then second to last, etc.
  // then by path
  const aUrl = new URL(a.url!)
  const bUrl = new URL(b.url!)
  const aParts = aUrl.hostname.split('.').reverse()
  const bParts = bUrl.hostname.split('.').reverse()
  for (let i = 0; i < Math.min(aParts.length, bParts.length); i++) {
    if (aParts[i] < bParts[i]) return -1
    if (aParts[i] > bParts[i]) return 1
  }
  if (aParts.length < bParts.length) return -1
  if (aParts.length > bParts.length) return 1
  if (aUrl.pathname < bUrl.pathname) return -1
  if (aUrl.pathname > bUrl.pathname) return 1
  return 0
  // if (!a.url) return 1
  // if (!b.url) return -1
  // if (a.url < b.url) return -1
  // if (a.url > b.url) return 1
  // return 0
}

export async function sort() {
  
  const window = await chrome.windows.getCurrent({populate: true})
  const tabGroups = await chrome.tabGroups.query({windowId: window.id})

  // loop over tabGroups and sort by url of each tabgroup
  for (let i = 0; i < tabGroups.length; i++ ) {
    console.log(`Sorting tabs for group ${i}`)
    const tabs = await chrome.tabs.query({groupId: tabGroups[i].id})
    const firstIndex = tabs[0].index
    tabs.sort(sortTabs)
    // move the tabs to the sorted order
    chrome.tabs.move(tabs.map(tab => tab.id!), {index: firstIndex})
  }

  // now sort ungrouped tabs
  const tabs = await chrome.tabs.query({groupId: -1})
  tabs.sort(sortTabs)
  chrome.tabs.move(tabs.map(tab => tab.id!), {index: -1})

}