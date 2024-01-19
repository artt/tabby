// import clsx from 'clsx'
import { getColor } from './utils'

type OrganizedTabTab = chrome.tabs.Tab & {type: "tab"}
type OrganizedTabGroup = chrome.tabGroups.TabGroup & {type: "tabGroup", tabs: chrome.tabs.Tab[]}
type OrganizedTabElement = OrganizedTabTab | OrganizedTabGroup


function Window({window, tabGroups}: {window: chrome.windows.Window, tabGroups: chrome.tabGroups.TabGroup[]}) {

  if (!window.tabs) return null

  // change tabs so that tabs are nested if they're in a tab group
  const organizedTabs: OrganizedTabElement[] = []
  for (let i = 0; i < window.tabs!.length; i ++) {
    const tab = window.tabs[i]
    if (tab.groupId === -1) {
      organizedTabs.push({...tab, type: "tab"})
    }
    else {
      const tabGroup = tabGroups.find(tabGroup => tabGroup.id === tab.groupId)
      if (tabGroup) {
        const tabsInGroup = window.tabs.filter(tab => tab.groupId === tabGroup.id).map(tab => ({...tab, type: "tab"}))
        const tmp: OrganizedTabGroup = {type: "tabGroup", ...tabGroup, tabs: tabsInGroup}
        organizedTabs.push(tmp)
        i += tabsInGroup.length - 1
      }
    }
  }

  return (
    <div className="window">
      {organizedTabs.map((el, i) => {
          if (el.type === "tabGroup") {
            return (
              <div className="first-level tab-group" key={i}>
                <div className="tab-group-title" style={{backgroundColor: getColor(el.color)}}>{el.title}</div>
                {el.tabs!.map((tab, j) => {
                  return (
                    <div key={j} className="tab grouped" style={{borderColor: getColor(el.color)}}>{tab.title}</div>
                  )
                })}
              </div>
            )
          }
          else {
            return (
              <div className="first-level tab" key={i}>
                {el.title}
              </div>
            )
          }
        })
      }
    </div>
  )


}

export default Window