import React from 'react';
import { DndContext, UniqueIdentifier, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';

import { WindowItem } from '@/types';
import { addWindowsAndTabsListeners, addMediaQueryListener } from '@/lib/listeners';
import { processTabGroupItem, processTabItem, processWindowItem } from '@/lib/process'
import { onDragEnd, onDragOver } from '@/lib/dnd';

import { Window } from '@/components/Window';
import TopBar from '@/components/TopBar';

import '@/components/style.scss'

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
    <div className="flex flex-col h-screen">
      <TopBar />
      <div id="main" className="overflow-y-auto flex-grow">
        <DndContext
          sensors={sensors}
          autoScroll={false}
          onDragStart={({ active }) => {
            document.getElementById("main")?.classList.add("dragging")
            setDraggedId(active.id)
            setBackupWindowsData(windowsData)
          }}
          // when everything is said and done, sync changes to the browser
          onDragEnd={({ active, over }) => onDragEnd(active, over, windowsData)}
          // gets called when the dragged item is over another item
          // responsible for updating the UI
          onDragOver={({ active, over }) => onDragOver(active, over, windowsData, setWindowsData)}
          // gets called when the drag is cancelled
          // we just restore the original order
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
    </div>
  );
}

export default App;
