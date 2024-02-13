import React from 'react'
import './style.scss'
import { Controls } from './components/Controls'
import { isTabMatched, processTabGroupItem, processTabItem, processWindowItem } from './utils'
import clsx from 'clsx'
import { ChakraProvider } from '@chakra-ui/react'
import theme from './theme'
import { Window } from './components/Items'

import { data } from './data'
import { GroupItem, TreeItem, WindowItem } from './types'
import { DndContext, PointerSensor, UniqueIdentifier, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
// import { createPortal } from 'react-dom'

export const debugMode = import.meta.env.MODE === "development"

function App() {

  const sensors = useSensors(
    useSensor(PointerSensor, {
        activationConstraint: { delay: 200, tolerance: 1000 }
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
    chrome.windows.getAll({ populate: true }).then(res => setRawWindows(res))
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
      chrome.windows.onCreated.addListener((window) => handleEvent("windowCreated", {window}));
      chrome.windows.onFocusChanged.addListener((windowId) => handleEvent("focusChanged", {windowId}));
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
    if (searchString === "") {
      setFocusedTabs([])
      return
    }
    // populate focusedTabs with tabs that match the search string
    let newFocusedTabs: number[] = []
    windowsData.forEach(window => {
      if (!window.tabs) return
      newFocusedTabs = newFocusedTabs.concat(window.tabs.filter(tab => isTabMatched(tab, searchString)).map(tab => tab.id!))
    })
    setFocusedTabs(newFocusedTabs)
  }, [windowsData, searchString])

  React.useEffect(() => {
    // console.log(windowsData[0])
  }, [windowsData])

  // return the index of found ID
  // function getIndexFromId(id: UniqueIdentifier, list: {id: UniqueIdentifier | undefined}[]): number {
  //   return list.findIndex(item => item.id === id)
  // }

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

  // From an index tree, return the index of the item within the window (specified by the first element of the index tree).
  // This is done by looking at number of tabs within tabgroups before the item.
  function getWindowsTabIndexFromIndexTree(indexTree: number[], tree: TreeItem[] = windowsData): number {
    if (indexTree.length < 2) {
      throw new Error("Index tree must have at least two elements");
    }
    const currentWindow = tree[indexTree[0]]
    let count = 0
    for (let i = 0; i < indexTree[1]; i ++) {
      if (currentWindow.children[i].kind === "tab") {
        count ++
      }
      else if (currentWindow.children[i].kind === "tabGroup") {
        count += (currentWindow.children[i] as GroupItem).children.length
      }
    }
    if (indexTree.length === 2) {
      return count
    }
    else {
      // move into the group
      return count + indexTree[2]
    }
  }

  // function getItemFromIndexTree(indexTree: number[], tree: TreeItem[] = windowsData): TreeItem | null {
  //   if (indexTree.length === 0) {
  //     throw new Error("Index tree must not be empty");
  //   }
  //   if (!tree[indexTree[0]]) return null
  //   else if (indexTree.length === 1) {
  //     return tree[indexTree[0]];
  //   }
  //   else {
  //     return getItemFromIndexTree(indexTree.slice(1), tree[indexTree[0]].children);
  //   }
  // }

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
            if (active.id === over.id) return


            const activeIndexTree = getIndexTreeFromId(active.id)
            const overIndexTree = getIndexTreeFromId(over.id)

            // if moved to own parent then do nothing
            if (activeIndexTree.slice(0, -1).join(",") === overIndexTree.join(",")) return
            if (activeIndexTree.join(",") === overIndexTree.slice(0, -1).join(",")) return

            console.log("dragover", getItemFromId(over.id).title)


            // const activeItem = getItemFromId(active.id)
            // const overItem = getItemFromId(over.id)

            // console.log(activeIndexTree, overIndexTree)

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
              if (activeIndexTree[0] === overIndexTree[0]) {
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
                // console.log("one item left")
                return arrayMove(currentTree, activeIndexTree[0], overIndexTree[0])
              }
              // last case is when active and over don't have the same parent
              // we need to remove the active item from its current parent
              // then add the active item to the over item's children
              else {
                // get the active item
                const activeItem = getItemFromId(active.id)
                const newTree: TreeItem[] = []
                for (let i = 0; i < currentTree.length; i ++) {
                  if (i === activeIndexTree[0]) {
                    if (activeIndexTree.length === 1) {
                      continue 
                    }
                    const newChildren = deleteItem(currentTree[i].children, activeIndexTree.slice(1))
                    newTree.push({
                      ...currentTree[i],
                      children: newChildren
                    })
                  }
                  else if (i === overIndexTree[0]) {
                    if (overIndexTree.length === 1) {
                      newTree.push(activeItem)
                      newTree.push(currentTree[i])
                    }
                    else {
                      const newChildren = addItem(currentTree[i].children, overIndexTree.slice(1), activeItem)
                      newTree.push({
                        ...currentTree[i],
                        children: newChildren
                      })
                    }
                  }
                  else {
                    newTree.push(currentTree[i])
                  }
                }
                return newTree
              }
            }
            
            // console.log("moveItem called with ", activeIndexTree, overIndexTree)
            console.log("move", activeIndexTree, overIndexTree)
            const tmp = moveItem(windowsData, activeIndexTree, overIndexTree) as WindowItem[]
            console.log(tmp)
            setWindowsData(tmp)
          }}
          onDragEnd={({active, over}) => {

            document.getElementById("windows-container")?.classList.remove("dragging")

            if (!over?.id) return

            const activeItem = getItemFromId(active.id)
            if (activeItem.kind === "window") return

            const activeIndexTree = getIndexTreeFromId(active.id)

            if (activeItem.kind === "tab") {
              const newIndex = getWindowsTabIndexFromIndexTree(activeIndexTree)
              console.log("newIndex", newIndex)
              let newGroup = -1
              if (activeIndexTree.length === 3) {
                console.log("activeIndexTree has length 3")
                // need to move into the group of the next tab
                // if the position in the group is 0, then need to look at the index of the next tab over
                newGroup = windowsData[activeIndexTree[0]].tabs![newIndex + (activeIndexTree[2] === 0 ? 1 : 0)].groupId
              }
              console.log("newGroup", newGroup)
              chrome.tabs.move(active.id as number, {
                index: getWindowsTabIndexFromIndexTree(activeIndexTree),
                windowId: windowsData[activeIndexTree[0]].id,
              })
              if (newGroup === -1) {
                chrome.tabs.ungroup(active.id as number)
              }
              else {
                chrome.tabs.group({ tabIds: active.id as number, groupId: newGroup })
              }
            }
            else if (activeItem.kind === "tabGroup") {
              const currentWindowId = (activeItem as GroupItem).windowId
              const newWindowId = windowsData[activeIndexTree[0]].id
              chrome.tabGroups.move(active.id as number, {
                index: getWindowsTabIndexFromIndexTree(activeIndexTree),
                // for some reason if the windowId is the same then there'd be error // TODO: report this?
                ...(currentWindowId !== newWindowId && {windowId: windowsData[activeIndexTree[0]].id}),
              })
            }

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
                className={clsx("window", windowData.focused ? "focused" : "")}
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
