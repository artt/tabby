import React from 'react'
import './style.scss'
import { Controls } from './components/Controls'
import { isTabMatched, processTabGroupItem, processTabItem, processWindowItem } from './utils'
import clsx from 'clsx'
import { ChakraProvider } from '@chakra-ui/react'
import theme from './theme'
import { Window } from './components/Items'

import { data } from './data'
import { WindowItem } from './types'
import { DndContext } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

export const debugMode = import.meta.env.MODE === "development"

function App() {

  const [rawWindows, setRawWindows] = React.useState<chrome.windows.Window[]>([])
  const [rawTabGroups, setRawTabGroups] = React.useState<chrome.tabGroups.TabGroup[]>([])
  const [numTabs, setNumTabs] = React.useState<number>(0)

  const [windowsData, setWindowsData] = React.useState<WindowItem[]>([])
  // additional properties of tabs are stored in a separate object
  const [focusedTabs, setFocusedTabs] = React.useState<number[]>([])

  const [searchString, setSearchString] = React.useState("")

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function handleEvent(_name: string, _payload: object) {
    if (debugMode) return
    chrome.windows.getAll({populate: true}).then(res => setRawWindows(res))
    chrome.tabGroups.query({}).then(res => setRawTabGroups(res))
    // chrome.tabs.query({}).then(res => setTabs(res))
  }

  React.useLayoutEffect(() => {
    localStorage.removeItem("chakra-ui-color-mode")
  }, [])

  React.useEffect(() => {

    if (debugMode) {
      console.log(data)
      setWindowsData(data as WindowItem[])
    }
    else {
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
      handleEvent("init", {})
    }

    document.body.addEventListener("click", handleAppClick)
    return () => {
      document.body.removeEventListener("click", handleAppClick)
    }

  }, [])

  function handleAppClick() {
    // focus on search bar element
    const searchBar = document.getElementById("search-bar")
    if (searchBar) searchBar.focus()
  }

  
  React.useEffect(() => {
    if (debugMode) return
    setNumTabs(rawWindows.map(window => window.tabs?.length ?? 0).reduce((a, b) => a + b, 0))
    setWindowsData(rawWindows.map(window => {
      if (!window.tabs) return processWindowItem(window, [])

      const children: WindowItem["children"] = []
      for (let i = 0; i < window.tabs.length; i ++) {
        const tab = window.tabs[i]
        if (tab.groupId === -1) {
          children.push(processTabItem(tab, tab.windowId))
        }
        else {
          const tabGroup = rawTabGroups.find(tabGroup => tabGroup.id === tab.groupId)
          if (tabGroup) {
            const tabsInGroup = window.tabs
              .filter(tab => tab.groupId === tabGroup.id)
              .map(tab => processTabItem(tab, tabGroup.id))
            const tmp = processTabGroupItem(tabGroup, tabsInGroup)
            children.push(tmp)
            i += tabsInGroup.length - 1
          }
        }
      }
      return processWindowItem(window, children)
    }))
  }, [rawWindows, rawTabGroups])

  React.useEffect(() => {
    if (searchString === "") return
    // populate focusedTabs with tabs that match the search string
    let newFocusedTabs: number[] = []
    windowsData.forEach(window => {
      if (!window.tabs) return
      newFocusedTabs = newFocusedTabs.concat(window.tabs.filter(tab => isTabMatched(tab, searchString)).map(tab => tab.id!))
    })
    setFocusedTabs(newFocusedTabs)
  }, [windowsData, searchString])

  React.useEffect(() => {
    console.log(windowsData)
  }, [windowsData])


  return (
    <ChakraProvider
      theme={theme}
    >
      <Controls searchString={searchString} setSearchString={setSearchString}/>
      <div className={clsx("windows-container", searchString !== "" && "search-mode")}>
        <DndContext>
          <SortableContext
            items={windowsData.map(window => window.id)}
            strategy={verticalListSortingStrategy}
          >
            {windowsData.map(windowData => (
              <Window
                key={windowData.id}
                window={windowData}
                className="window"
                focusedTabs={focusedTabs}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
      <div className="footer-container">
        {`Managing ${numTabs} tab${numTabs === 1 ? "" : "s"} in ${rawWindows.length} window${rawWindows.length === 1 ? "" : "s"}`}
      </div>
    </ChakraProvider>
  )
}

export default App
