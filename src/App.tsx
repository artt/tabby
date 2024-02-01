import React from 'react'
import './style.scss'
import { Controls } from './components/Controls'
import { isTabMatched, processTabGroupItem, processTabItem, processWindowItem } from './utils'
import clsx from 'clsx'
import { ChakraProvider } from '@chakra-ui/react'
import theme from './theme'
import { Window } from './components/Items'

import { data } from './data'
import { TabItem, TreeItem, WindowItem } from './types'
import { DndContext, PointerSensor, UniqueIdentifier, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
// import { createPortal } from 'react-dom'

export const debugMode = import.meta.env.MODE === "development"

function App() {

  const sensors = useSensors(
    useSensor(PointerSensor, {
        activationConstraint: { distance: 4 }
    })
  )

  const [rawWindows, setRawWindows] = React.useState<chrome.windows.Window[]>([])
  const [rawTabGroups, setRawTabGroups] = React.useState<chrome.tabGroups.TabGroup[]>([])
  const [numTabs, setNumTabs] = React.useState<number>(0)

  const [windowsData, setWindowsData] = React.useState<WindowItem[]>([])
  const [clonedWindowsData, setClonedWindowsData] = React.useState<WindowItem[]>([])
  // additional properties of tabs are stored in a separate object
  const [focusedTabs, setFocusedTabs] = React.useState<number[]>([])

  const [searchString, setSearchString] = React.useState("")

  const [draggedId, setDraggedId] = React.useState<UniqueIdentifier | null>(null);


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
    console.log(draggedId)
  }, [draggedId])

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
    // console.log(windowsData[1])
  }, [windowsData])

  // // return the index of found ID
  // function getIdIndex(id: UniqueIdentifier, list: TreeItem[]): number {
  //   return list.findIndex(item => item.id === id)
  // }

  // return the object of found ID, which could be a child of a child
  function getItemById(id: UniqueIdentifier): TreeItem {
    let foundItem: TreeItem | null = null;
    function findItem(item: TreeItem) {
      if (item.id === id) {
        foundItem = item;
      }
      else {
        item.children.forEach(child => findItem(child));
      }
    }
    windowsData.forEach(item => findItem(item));
    if (foundItem == null) {
      throw new Error(`Could not find item with ID ${id}`);
    }
    return foundItem;
  }


  return (
    <ChakraProvider
      theme={theme}
    >
      <Controls searchString={searchString} setSearchString={setSearchString}/>
      <div className={clsx("windows-container", searchString !== "" && "search-mode")}>
        <DndContext
          sensors={sensors}
          onDragStart={({ active }) => {
            setDraggedId(active.id);
            setClonedWindowsData(windowsData)
          }}
          onDragEnd={({active, over}) => {
            // let's assume for now that it's within the same container (window 0)
            // will have to write something to check later
            if (!over) return
            if (!active.id || !over.id) return
            const activeItem = getItemById(active.id) as TabItem;
            if (activeItem.kind === "tab" || activeItem.kind === "tabGroup") {
              // get the index of the over item in that window
              const windowId = activeItem.windowId
              const window = getItemById(windowId)
              const overTabIndex = (window as WindowItem).tabs!.findIndex(tab => tab.id === over.id)
              const overIndex = window.children.findIndex(child => child.id === over.id)
              const activeIndex = window.children.findIndex(child => child.id === active.id)
              console.log(overIndex, activeIndex)
              if (overIndex > -1 && overTabIndex > -1) {
                // move the tab to the overTabIndex
                chrome.tabs.move((active.id as number), {windowId: (activeItem as TabItem).windowId, index: overTabIndex})
                setWindowsData(
                  windowsData.map(window => {
                    if (window.id === windowId) {
                      return {
                        ...window,
                        children: arrayMove(window.children, activeIndex, overIndex)
                      }
                    }
                    return window
                  })
                )
              }
            }
          }}
          onDragCancel={() => {
            if (clonedWindowsData) {
              setWindowsData(clonedWindowsData)
            }
            setDraggedId(null)
            setClonedWindowsData([])
          }}
        >
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
          {/* {createPortal(
            <DragOverlay
              // adjustScale={adjustScale}
              // dropAnimation={dropAnimation}
            >
              {activeId
                ? windows.includes(activeId)
                  ? renderContainerDragOverlay(activeId)
                  : renderSortableItemDragOverlay(activeId)
                : null}
              <div>xxx</div>
            </DragOverlay>,
            document.body
          )} */}
        </DndContext>
      </div>
      <div className="footer-container">
        {`Managing ${numTabs} tab${numTabs === 1 ? "" : "s"} in ${rawWindows.length} window${rawWindows.length === 1 ? "" : "s"}`}
      </div>
    </ChakraProvider>
  )
}

export default App
