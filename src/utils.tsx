import { UniqueIdentifier } from "@dnd-kit/core"
import { GroupItem, TabItem, WindowItem } from "./types"

export function cleanUrl(url: string | undefined): string | undefined {
  if (!url) return url
  // separate URL into two parts using ^https?:\/\/[^/]+\/ regex
  // if there is no match, return the original URL
  url = decodeURI(url)
  const match = url.match(/(^https?:\/\/[^/]+\/)(.*)/)
  if (!match) return url
  return match[1] + match[2].replace(/([a-zA-Z0-9]{10,})/g, "")
}

export function getFaviconUrl(url: string) {
  return `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent(url)}&size=32`;
}

export function isTabMatched(tab: chrome.tabs.Tab, searchString: string): boolean {
  return tab.title?.toLowerCase().includes(searchString.toLowerCase()) || decodeURI(tab.url!).toLowerCase().includes(searchString.toLowerCase()) || false
}

export const processWindowItem = (rawWindow: chrome.windows.Window, children: (TabItem | GroupItem)[]): WindowItem => ({
  ...rawWindow,
  id: rawWindow.id || -1,
  parentId: null,
  kind: "window",
  children,
})

export const processTabGroupItem = (rawTabGroup: chrome.tabGroups.TabGroup, children: TabItem[]): GroupItem => ({
  ...rawTabGroup,
  id: rawTabGroup.id || -1,
  parentId: rawTabGroup.windowId,
  kind: "tabGroup",
  children,
})

export const processTabItem = (rawTab: chrome.tabs.Tab, parentId: UniqueIdentifier): TabItem => ({
  ...rawTab,
  id: rawTab.id || -1,
  parentId,
  kind: "tab",
  children: [],
})

interface ObjectWithId {
  id: UniqueIdentifier
}

export function getIndexFromId(id: UniqueIdentifier, list: ObjectWithId[] ): number {
  return list.findIndex(item => item.id === id)
}