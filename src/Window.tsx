import clsx from 'clsx'
import { getFaviconUrl } from './utils'

type CustomTab = chrome.tabs.Tab & {type: "tab"}
type CustomGroup = chrome.tabGroups.TabGroup & {type: "tabGroup", tabs: CustomTab[]}
type CustomElement = CustomTab | CustomGroup

function handleCloseGroup(event: React.MouseEvent, tabGroup: CustomGroup) {
  event.stopPropagation()
  tabGroup.tabs.forEach(tab => chrome.tabs.remove(tab.id!))
}

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
      <img className="tab-favicon" src={tab.favIconUrl || getFaviconUrl(tab.url || "")} alt="" />
      <div className="tab-title">{tab.title}</div>
      <div className="tab-close-icon" onClick={handleClose}>✕</div>
    </div>
  )
}


function Window({window, tabGroups}: {window: chrome.windows.Window, tabGroups: chrome.tabGroups.TabGroup[]}) {

  if (!window.tabs) return null

  // change tabs so that tabs are nested if they're in a tab group
  const organizedTabs: CustomElement[] = []
  for (let i = 0; i < window.tabs!.length; i ++) {
    const tab = window.tabs[i]
    if (tab.groupId === -1) {
      organizedTabs.push({...tab, type: "tab"})
    }
    else {
      const tabGroup = tabGroups.find(tabGroup => tabGroup.id === tab.groupId)
      if (tabGroup) {
        const tabsInGroup = window.tabs.filter(tab => tab.groupId === tabGroup.id).map(tab => ({...tab, type: "tab"} as CustomTab))
        const tmp: CustomGroup = {type: "tabGroup", ...tabGroup, tabs: tabsInGroup}
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
              <div className="first-level tab-group" key={i} style={{"--color": `var(--${el.color})`} as React.CSSProperties}>
                <div className="tab-group-header">
                  <div className="tab-group-title">{el.title}</div>
                  <div className="tab-close-icon" onClick={e => handleCloseGroup(e, el)}>✕</div>
                </div>
                {el.tabs!.map((tab, j) => {
                  return (
                    <Tab tab={tab} key={j} style={{borderColor: `var(--color)`}} />
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