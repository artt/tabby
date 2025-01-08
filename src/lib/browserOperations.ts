import { processTabsForOpenAi } from "./utils"
import OpenAI from "openai"

export async function group(apiKey: string) {
  console.log("Grouping current window...")
  const window = await chrome.windows.getCurrent({populate: true})
  console.log(window)
  const allTabs = processTabsForOpenAi(window.tabs!)
  const tabIds = window.tabs!.map(tab => tab.id!)

  const openai = new OpenAI({
    apiKey: apiKey, // import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
  })
  console.log("allTabs:", allTabs)
  console.log("tabIds:", tabIds)
  console.log("Making call to OpenAI...")
  const res = await openai.chat.completions.create({
    // model: "gpt-3.5-turbo-1106",
    // model: "gpt-4-0125-preview",
    model: "gpt-4o",
    response_format: { "type": "json_object" },
    messages: [
      {
        role: "system",
        content: [
          `You help people manage their tabs by grouping the tabs by their topics.`,
          `You will be provided with an array of object: {id, title, url} which contains the tab's ID, title, and domain/subdomain.`,
          `The URL field could be empty.`,
          `Please group them into logical groups based on titles and domain/subdomains.`,
          `The output should be a JSON object with a single key, "groups".`,
          `The value of that key is an array of objects with keys "title" which specifies the tab group's name, and "tabIds" which is an array of tab's IDs in each group.`,
          `Items that don't belong to any group should be in its own group named "Others".`,
          `Make sure each tab is assigned to exactly one group.`,
        ].join(' '),
      },
      {
        role: "user",
        content: JSON.stringify(allTabs),
      }
    ]
  })
  const newGroups = JSON.parse(res.choices[0].message.content || `{"groups": []}`)["groups"]
  console.log("Get new grouping", newGroups)
  // move the tabs accordingly
  // TODO: as of now, tabs that already have groups that are determined to not have any groups are not moved
  for (const group of newGroups) {
    console.log(`Moving tabs for group "${group.title}"`)
    const tabIdsInGroup = group.tabIds.map((tabId: number) => tabIds[tabId] || (-1 * tabId)).filter((tabId: number) => tabId > 0)
    console.log(tabIdsInGroup)
    const groupId = await chrome.tabs.group({ tabIds: tabIdsInGroup })
    chrome.tabGroups.update(groupId, { title: group.title })
  }
}

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