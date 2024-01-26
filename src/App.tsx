import React from 'react'
import Window from './Window'
import './style.scss'
import { Controls } from './components/Controls'
import { isTabMatched } from './utils'
import clsx from 'clsx'
import { ChakraProvider } from '@chakra-ui/react'
import theme from './theme'

import { data } from './data'

export type TabData = chrome.tabs.Tab & {kind: string, canHaveChildren: boolean}
export type GroupData = chrome.tabGroups.TabGroup & {kind: string, children: TabData[]}
export type WindowData = chrome.windows.Window & {kind: string, children: (TabData | GroupData)[]}

export const debugMode = import.meta.env.MODE === "development"

function App() {

  const [windows, setWindows] = React.useState<chrome.windows.Window[]>([])
  const [tabGroups, setTabGroups] = React.useState<chrome.tabGroups.TabGroup[]>([])

  const [windowsData, setWindowsData] = React.useState<WindowData[]>([])
  // additional properties of tabs are stored in a separate object
  const [focusedTabs, setFocusedTabs] = React.useState<number[]>([])

  const [searchString, setSearchString] = React.useState("")

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function handleEvent(_name: string, _payload: object) {
    if (debugMode) return
    chrome.windows.getAll({populate: true}).then(res => setWindows(res))
    chrome.tabGroups.query({}).then(res => setTabGroups(res))
    // chrome.tabs.query({}).then(res => setTabs(res))
  }

  React.useEffect(() => {

    if (debugMode) {
      console.log(data)
      setWindowsData(data as WindowData[])
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

    return () => {document.body.removeEventListener("click", handleAppClick)}

  }, [])

  function handleAppClick() {
    // focus on search bar element
    const searchBar = document.getElementById("search-bar")
    if (searchBar) searchBar.focus()
  }

  React.useEffect(() => {
    if (debugMode) return
    setWindowsData(windows.map(window => {
      if (!window.tabs) return {...window, kind: "window", children: []}
      const children: WindowData["children"] = []
      for (let i = 0; i < window.tabs.length; i ++) {
        const tab = window.tabs[i]
        if (tab.groupId === -1) {
          children.push({...tab, kind: "tab", canHaveChildren: false})
        }
        else {
          const tabGroup = tabGroups.find(tabGroup => tabGroup.id === tab.groupId)
          if (tabGroup) {
            const tabsInGroup = window.tabs.filter(tab => tab.groupId === tabGroup.id).map((tab: chrome.tabs.Tab) => ({...tab, kind: "tab", canHaveChildren: false}))
            const tmp: GroupData = {...tabGroup, kind: "tabGroup", children: tabsInGroup}
            children.push(tmp)
            i += tabsInGroup.length - 1
          }
        }
      }
      return {...window, kind: "window", children}
    }))
  }, [windows, tabGroups])

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

  // React.useEffect(() => {
  //   console.log(tabGroups)
  // }, [tabGroups])
  // React.useEffect(() => {
  //   console.log(tabs)
  // }, [tabs])

  return (
    <ChakraProvider theme={theme}>
      <Controls searchString={searchString} setSearchString={setSearchString}/>
      <div className={clsx("windows-container", searchString !== "" && "search-mode")}>
        {windowsData.map(windowData => (
          <Window
            key={windowData.id}
            windowData={windowData}
            focusedTabs={focusedTabs}
          />
        ))}
      </div>
      <div className="footer-container">
        Test
      </div>
    </ChakraProvider>
  )
}

export default App
