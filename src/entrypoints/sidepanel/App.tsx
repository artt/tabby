import React from 'react';
import { addWindowsAndTabsListeners, addMediaQueryListener } from '@/lib/listeners';
import { isTabMatched, processTabGroupItem, processTabItem, processWindowItem } from '@/lib/process'
import { Input } from "@/components/ui/input"
import { WindowItem } from '@/types';
import { Window } from '@/components/Window';

function App() {

  const [rawWindows, setRawWindows] = React.useState<chrome.windows.Window[]>([])
  const [rawTabGroups, setRawTabGroups] = React.useState<chrome.tabGroups.TabGroup[]>([])
  const [windowsData, setWindowsData] = React.useState<WindowItem[]>([])

  function handleEvent(_name: string, _payload: object) {
    chrome.windows.getAll({ populate: true }).then(res => setRawWindows(res))
    chrome.tabGroups.query({}).then(res => setRawTabGroups(res))
  }

  React.useEffect(() => {
    console.log(windowsData)
  }, [windowsData])

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
    <>
      <div>xxx</div>
      {windowsData.map(windowData => (
        <Window
          key={windowData.id}
          window={windowData}
          // className={clsx("window", windowData.focused ? "focused" : "")}
          focusedTabs={[]} // just a placeholder
        />
      ))}
    </>
  );
}

export default App;
