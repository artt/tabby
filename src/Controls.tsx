import OpenAI from "openai"
import { cleanUrl } from './utils'

async function group() {
  console.log("Grouping current window...")
  const window = await chrome.windows.getCurrent({populate: true})
  console.log(window)
  const allTabs = window.tabs!.map(tab => ({
    title: tab.title || "",
    url: cleanUrl(tab.url) || "",
  }))
  const tabIds = window.tabs!.map(tab => tab.id!)

  const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
  })
  console.log("allTabs:", allTabs)
  console.log("tabIds:", tabIds)
  console.log("Making call to OpenAI...")
  const res = await openai.chat.completions.create({
    model: "gpt-4-1106-preview",
    response_format: { "type": "json_object" },
    messages: [
      {
        role: "system",
        content: [
          `You help people manage their tabs by grouping the tabs by their topics.`,
          `You will be provided with an array of object: {title, url}.`,
          `Each item in the array is identified by its zero-based index.`,
          `Given this array, group them into logical groups based on the content inferred from titles and URLs, not just the domain name.`,
          `The output should be a JSON object with key "groups" whose value is an array of objects with keys "title" which specifies the tab group's name, and "tabIds" which is an array of tab IDs in respective groups.`,
          `Items that don't belong to any group should be left out.`,
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
  for (const group of newGroups) {
    console.log(`Moving tabs for group "${group.title}"`)
    const tabIdsInGroup = group.tabIds.map((tabId: number) => tabIds[tabId] || (-1 * tabId)).filter((tabId: number) => tabId > 0)
    console.log(tabIdsInGroup)
    const groupId = await chrome.tabs.group({ tabIds: tabIdsInGroup })
    chrome.tabGroups.update(groupId, { title: group.title })
  }
}

// https://github.com/Litee/prevent-duplicate-tabs-chrome-extension/blob/master/src/background.ts
async function deduplicate() {
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

function handleSearch(event: React.ChangeEvent<HTMLInputElement>) {
  const query = event.target.value
  const matchedTabs: chrome.tabs.Tab[] = []
  chrome.tabs.query({currentWindow: true}, tabs => {
    console.log(tabs)
    tabs.forEach(tab => {
      if (tab.title?.includes(query) || tab.url?.includes(query)) {
        matchedTabs.push(tab)
      }
    })
    console.log(matchedTabs)
  })
}

export function Controls() {
  return(
    <div className="controls-container">
      <button onClick={group}>Group current window</button>
      <button onClick={deduplicate}>Deduplicate</button>
      <input type="text" placeholder="Search" onChange={handleSearch} />
    </div>
  )
}