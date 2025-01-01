import { UniqueIdentifier } from "@dnd-kit/core"
import { GroupItem, TabItem, WindowItem } from "@/types"

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