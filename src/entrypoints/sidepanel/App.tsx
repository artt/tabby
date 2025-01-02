import React from 'react';
import { addWindowsAndTabsListeners, addMediaQueryListener } from '@/lib/listeners';
import { isTabMatched, processTabGroupItem, processTabItem, processWindowItem } from '@/lib/process'
import { Input } from "@/components/ui/input"
import { GroupItem, TreeItem, WindowItem } from '@/types';
import { getIndexTreeFromId, getItemFromId, getWindowsTabIndexFromIndexTree, moveItem } from '@/lib/dnd';
import { Window } from '@/components/Window';
import {DndContext, UniqueIdentifier} from '@dnd-kit/core';
import '@/components/style.scss'
import { PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove } from '@dnd-kit/sortable';

function App() {

  const [rawWindows, setRawWindows] = React.useState<chrome.windows.Window[]>([])
  const [rawTabGroups, setRawTabGroups] = React.useState<chrome.tabGroups.TabGroup[]>([])
  const [windowsData, setWindowsData] = React.useState<WindowItem[]>([])
  // backup windows data in case the drag is cancelled so we can restore the original order
  const [backupWindowsData, setBackupWindowsData] = React.useState<WindowItem[]>([])
  const [draggedId, setDraggedId] = React.useState<UniqueIdentifier | null>(null);
  
  const settings = {
    showIncognitoWindows: false,
  }

  // const { sensors } = useDndKit()
  const sensors = useSensors(
    useSensor(PointerSensor, {
        activationConstraint: { delay: 200, tolerance: 1000 }
    })
  )

  function handleEvent(_name: string, _payload: object) {
    chrome.windows.getAll({ populate: true }).then(res => setRawWindows(res))
    chrome.tabGroups.query({}).then(res => setRawTabGroups(res))
  }

  // React.useEffect(() => {
  //   console.log(windowsData)
  // }, [windowsData])

  React.useEffect(() => {
    // setNumTabs(rawWindows.map(window => window.tabs?.length ?? 0).reduce((a, b) => a + b, 0))
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

  function handleAppClick() {
    console.log('app clicked')
    // // focus on search bar element
    // document.getElementById("search-bar")?.focus()
  }

  React.useEffect(() => {

    addWindowsAndTabsListeners(handleEvent)
    handleEvent("init", {})

    addMediaQueryListener()

    document.body.addEventListener("click", handleAppClick)
    return () => {
      document.body.removeEventListener("click", handleAppClick)
    }

  }, [])

  return (
    <div id="main" className="">
      <DndContext
        sensors={sensors}
        onDragStart={({ active }) => {
          document.getElementById("main")?.classList.add("dragging")
          setDraggedId(active.id)
        }}
        // when everything is said and done, sync changes to the browser
        onDragEnd={({ active, over }) => {
          // console.log("drag end:", active, over)
          document.getElementById("main")?.classList.remove("dragging")
          if (!over?.id) return
          const activeItem = getItemFromId(active.id, windowsData)
          if (activeItem.kind === "window") return
          const activeIndexTree = getIndexTreeFromId(active.id, windowsData)
          if (activeItem.kind === "tab") {
            const newIndex = getWindowsTabIndexFromIndexTree(activeIndexTree, windowsData)
            let newGroup = -1
            if (activeIndexTree.length === 3) {
              console.log("activeIndexTree has length 3")
              // need to move into the group of the next tab
              // if the position in the group is 0, then need to look at the index of the next tab over
              newGroup = windowsData[activeIndexTree[0]].tabs![newIndex + (activeIndexTree[2] === 0 ? 1 : 0)].groupId
            }
            console.log("newGroup", newGroup)
            chrome.tabs.move(active.id as number, {
              index: getWindowsTabIndexFromIndexTree(activeIndexTree, windowsData),
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
              index: getWindowsTabIndexFromIndexTree(activeIndexTree, windowsData),
              // for some reason if the windowId is the same then there'd be error // TODO: report this?
              ...(currentWindowId !== newWindowId && {windowId: windowsData[activeIndexTree[0]].id}),
            })
          }
        }}
        // gets called when the dragged item is over another item
        // responsible for updating the UI
        onDragOver={({ active, over }) => {

          if (!over?.id) return
          if (active.id === over.id) return

          const activeIndexTree = getIndexTreeFromId(active.id, windowsData)
          const overIndexTree = getIndexTreeFromId(over.id, windowsData)

          // if moved to own parent then do nothing
          if (activeIndexTree.slice(0, -1).join(",") === overIndexTree.join(",")) return
          if (activeIndexTree.join(",") === overIndexTree.slice(0, -1).join(",")) return

          // console.log("dragover", getItemFromId(over.id, windowsData).title)
          // console.log("move", activeIndexTree, overIndexTree)
          
          const tmp = moveItem(windowsData, activeIndexTree, overIndexTree, active.id, windowsData) as WindowItem[]
          console.log(tmp)
          setWindowsData(tmp)

        }}
        onDragCancel={({ active }) => {
          console.log("drag cancel:", active)
          document.getElementById("main")?.classList.remove("dragging")
          if (backupWindowsData) {
            setWindowsData(backupWindowsData)
          }
          setDraggedId(null)
          setBackupWindowsData([])
        }}
      >
        {windowsData.map(windowData => (!windowData.incognito || settings.showIncognitoWindows) && (
          <Window
            key={windowData.id}
            window={windowData}
            // className={clsx("window", windowData.focused ? "focused" : "")}
            focusedTabs={[]} // just a placeholder
          />
        ))}
      </DndContext>
    </div>
  );
}

export default App;
