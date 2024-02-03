import React from 'react'
import './style.scss'
import { Controls } from './components/Controls'
import { isTabMatched, processTabGroupItem, processTabItem, processWindowItem } from './utils'
import clsx from 'clsx'
import { ChakraProvider } from '@chakra-ui/react'
import theme from './theme'
import { Window } from './components/Items'

import { data } from './data'
import { GroupItem, TabItem, TreeItem, WindowItem } from './types'
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
    console.log(windowsData[0])
  }, [windowsData])

  // return the index of found ID
  function getIndexFromId(id: UniqueIdentifier, list: {id: UniqueIdentifier | undefined}[]): number {
    return list.findIndex(item => item.id === id)
  }

  // return the object of found ID, which could be a child of a child
  function getItemFromId(id: UniqueIdentifier): TreeItem {
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

  // This function returns an array of indices, referred to as an 'index tree', for a given ID.
  // The 'index tree' represents the hierarchical location of the item within the structure.
  // The first element in the array is the index of the window where the item is located.
  // The second element is either the index of the item within the window (if the item is a direct child of the window),
  // or the index of the tab group within the window (if the item is within a tab group), and so on for deeper levels of nesting.
  function getIndexTreeFromId(id: UniqueIdentifier, tree: TreeItem[] = windowsData): number[] {
    let foundIndexTree: number[] = [];
    function findIndexTree(item: TreeItem, indexTree: number[]) {
      if (item.id === id) {
        foundIndexTree = indexTree;
      }
      else {
        item.children.forEach((child, index) => findIndexTree(child, [...indexTree, index]));
      }
    }
    tree.forEach((item, index) => findIndexTree(item, [index]));
    if (foundIndexTree.length === 0) {
      throw new Error(`Could not find index tree for item with ID ${id}`);
    }
    return foundIndexTree;
  }

  return (
    <ChakraProvider
      theme={theme}
    >
      <Controls searchString={searchString} setSearchString={setSearchString}/>
      <div id="windows-container" className={clsx(searchString !== "" && "search-mode")}>
        <DndContext
          sensors={sensors}
          onDragStart={({ active }) => {
            document.getElementById("windows-container")?.classList.add("dragging")
            setDraggedId(active.id);
            setClonedWindowsData(windowsData)
          }}
          onDragOver={({active, over}) => {

            if (!over?.id) return

            console.log("dragover", getItemFromId(active.id), getItemFromId(over.id))

            const activeIndexTree = getIndexTreeFromId(active.id)
            const overIndexTree = getIndexTreeFromId(over.id)

            console.log(activeIndexTree, overIndexTree)

            function deleteItem(currentTree: TreeItem[], indexTree: number[]) {
              if (indexTree.length === 1) {
                return currentTree.filter((_, i) => i !== indexTree[0])
              }
              else {
                const newTree: TreeItem[] = []
                for (let i = 0; i < currentTree.length; i ++) {
                  if (i === indexTree[0]) {
                    const newChildren = deleteItem(currentTree[i].children, indexTree.slice(1))
                    newTree.push({
                      ...currentTree[i],
                      children: newChildren
                    })
                  }
                  else {
                    newTree.push(currentTree[i])
                  }
                }
                return newTree
              }
            }

            function addItem(currentTree: TreeItem[], indexTree: number[], item: TreeItem) {
              if (indexTree.length === 1) {
                return [
                  ...currentTree.slice(0, indexTree[0]),
                  item,
                  ...currentTree.slice(indexTree[0])
                ]
              }
              else {
                const newTree: TreeItem[] = []
                for (let i = 0; i < currentTree.length; i ++) {
                  if (i === indexTree[0]) {
                    const newChildren = addItem(currentTree[i].children, indexTree.slice(1), item)
                    newTree.push({
                      ...currentTree[i],
                      children: newChildren
                    })
                  }
                  else {
                    newTree.push(currentTree[i])
                  }
                }
                return newTree
              }
            }

            function moveItem(currentTree: TreeItem[], activeIndexTree: number[], overIndexTree: number[]) {
              console.log("moveItem called with ", currentTree, activeIndexTree, overIndexTree)
              if (activeIndexTree[0] === overIndexTree[0]) {
                console.log("same parent")
                const newTree: TreeItem[] = []
                for (let i = 0; i < currentTree.length; i ++) {
                  if (i === activeIndexTree[0]) {
                    const newChildren = moveItem(currentTree[i].children, activeIndexTree.slice(1), overIndexTree.slice(1))
                    newTree.push({
                      ...currentTree[i],
                      children: newChildren
                    })
                  }
                  else {
                    newTree.push(currentTree[i])
                  }
                }
                return newTree
              }
              else if (activeIndexTree.length === 1 && overIndexTree.length === 1) {
                console.log("one item left")
                return arrayMove(currentTree, activeIndexTree[0], overIndexTree[0])
              }
              // last case is when active and over don't have the same parent
              // we need to remove the active item from its current parent
              // then add the active item to the over item's children
              else {
                // TODO: still need to fix this..... but getting close!
                console.log("different parent")
                // get the active item
                const activeItem = getItemFromId(active.id)
                const newTree: TreeItem[] = []
                for (let i = 0; i < currentTree.length; i ++) {
                  if (i === activeIndexTree[0]) {
                    const newChildren = deleteItem(currentTree[i].children, activeIndexTree.slice(1))
                    newTree.push({
                      ...currentTree[i],
                      children: newChildren
                    })
                  }
                  else if (i === overIndexTree[0]) {
                    const newChildren = addItem(currentTree[i].children, overIndexTree.slice(1), activeItem)
                    newTree.push({
                      ...currentTree[i],
                      children: newChildren
                    })
                  }
                  else {
                    newTree.push(currentTree[i])
                  }
                }
                return newTree
              }
            }
            
            const tmp = moveItem(windowsData, activeIndexTree, overIndexTree) as WindowItem[]
            console.log(tmp)
            setWindowsData(tmp)


            // steps

            // 1. get index tree of both the active and over items

            // 2. check the type of activeitem. if it's not a window, compare the index trees to see if they have the same parent
            
              // 2.1. if both of them have the same parent, then we can do a simple arrayMove
              // to figure out what the new windowsData should be,
              // traverse the windowsData according to the index tree of the active item

              // 2.2. if they don't have the same parent, then we need to do two things
              // first, we need to remove the active item from its current parent
              // then, we need to add the active item to the over item's children

            // we won't allow dragging windows and "merging" stuff for now

            // const activeItem = getItemFromId(active.id)
            // const overItem = getItemFromId(over.id)
            // if (activeItem.kind === "tab" || activeItem.kind === "tabGroup") {
            //   // get the index of the over item in that window
            //   const windowId = (activeItem as (TabItem | GroupItem)).windowId
            //   const window = getItemFromId(windowId) as WindowItem
            //   const overTabIndex = overItem.kind === "tab" ? (overItem as TabItem).index : (overItem.children[0] as TabItem).index
            //   const overIndex = getIndexFromId(over.id, window.children)
            //   const activeIndex = getIndexFromId(active.id, window.children)
            //   if (overIndex > -1 && overTabIndex > -1) {
            //     setWindowsData(
            //       windowsData.map(window => {
            //         if (window.id === windowId) {
            //           return {
            //             ...window,
            //             children: arrayMove(window.children, activeIndex, overIndex)
            //           }
            //         }
            //         return window
            //       })
            //     )
            //   }
            // }
          }}
          onDragEnd={({active, over}) => {
            document.getElementById("windows-container")?.classList.remove("dragging")
            // // let's assume for now that it's within the same container (window 0)
            // // will have to write something to check later
            // if (!over?.id) return

            // const activeItem = getItemFromId(active.id)
            // const overItem = getItemFromId(over.id)

            // if (activeItem.kind === "tab" || activeItem.kind === "tabGroup") {
            //   // get the index of the over item in that window
            //   const windowId = (activeItem as (TabItem | GroupItem)).windowId
            //   const window = getItemFromId(windowId) as WindowItem
            //   const overTabIndex = overItem.kind === "tab" ? (overItem as TabItem).index : (overItem.children[0] as TabItem).index
            //   const overIndex = getIndexFromId(over.id, window.children)
            //   const activeIndex = getIndexFromId(active.id, window.children)
            //   if (overIndex > -1 && overTabIndex > -1) {
            //     // move the tab to the overTabIndex
            //     if (activeItem.kind === "tab") {
            //       chrome.tabs.move(active.id as number, { index: overTabIndex })
            //     }
            //     else {
            //       chrome.tabGroups.move(active.id as number, { index: overTabIndex })
            //     }
            //     setWindowsData(
            //       windowsData.map(window => {
            //         if (window.id === windowId) {
            //           return {
            //             ...window,
            //             children: arrayMove(window.children, activeIndex, overIndex)
            //           }
            //         }
            //         return window
            //       })
            //     )
            //   }
            // }
          }}
          onDragCancel={() => {
            document.getElementById("windows-container")?.classList.remove("dragging")
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
