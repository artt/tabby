// import clsx from 'clsx'
import clsx from 'clsx'
import { getColor } from './utils'

type OrganizedTabTab = chrome.tabs.Tab & {type: "tab"}
type OrganizedTabGroup = chrome.tabGroups.TabGroup & {type: "tabGroup", tabs: chrome.tabs.Tab[]}
type OrganizedTabElement = OrganizedTabTab | OrganizedTabGroup


function Tab({tab, className="", style}: {tab: chrome.tabs.Tab, className?: string, style?: React.CSSProperties}) {

  function handleClick(event: React.MouseEvent) {
    event.stopPropagation()
    chrome.windows.update(tab.windowId!, {focused: true})
    chrome.sidePanel.open({windowId: tab.windowId!})
    chrome.tabs.update(tab.id!, {active: true})
  }

  function handleClose(event: React.MouseEvent) {
    event.stopPropagation()
    chrome.tabs.remove(tab.id!)
  }

  return (
    <div
      title={tab.url}
      className={clsx("tab", tab.active && "tab-active", className)}
      style={style}
      onClick={handleClick}
    >
      <img className="tab-favicon" src={tab.favIconUrl} alt="" />
      <div className="tab-title">{tab.title}</div>
      <div className="tab-close-icon" onClick={handleClose}>✕</div>
    </div>
  )
}


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
              <div className="first-level tab-group" key={i} style={{"--color": getColor(el.color)} as React.CSSProperties}>
                <div className="tab-group-title">
                  <span>{el.title}</span>
                </div>
                {el.tabs!.map((tab, j) => {
                  return (
                    <Tab tab={tab} key={j} style={{borderColor: getColor(el.color)}} />
                  )
                })}
              </div>
            )
          }
          else {
            return (
              <Tab tab={el} className="first-level" key={i} />
            )
          }
        })
      }
    </div>
  )


}

export default Window