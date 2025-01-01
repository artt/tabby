import type {UniqueIdentifier} from '@dnd-kit/core';

export type TabItem = chrome.tabs.Tab & {id: UniqueIdentifier, parentId: UniqueIdentifier | null, kind: 'tab', children: []}
export type GroupItem = chrome.tabGroups.TabGroup & {id: UniqueIdentifier, parentId: UniqueIdentifier | null, kind: 'tabGroup', children: TabItem[]}
export type WindowItem = chrome.windows.Window & {id: UniqueIdentifier, parentId: null, kind: 'window', children: (TabItem | GroupItem)[]}

export interface TreeItem {
  id: UniqueIdentifier
  parentId: UniqueIdentifier | null
  title?: string
  children: TreeItem[]
  collapsed?: boolean
  kind: 'window' | 'tabGroup' | 'tab'
}
