import clsx from 'clsx'
import { getFaviconUrl } from './utils'
import { debugMode } from './App'
import { GroupItem, TabItem, WindowItem } from './types'

function handleCloseGroup(event: React.MouseEvent, tabGroup: GroupItem) {
  event.stopPropagation()
  tabGroup.children.forEach(tab => chrome.tabs.remove(tab.id!))
}

function Tab({tab, className="", style}: {tab: TabItem, className?: string, style?: React.CSSProperties}) {

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
      title={decodeURI(tab.url!)}
      className={clsx(
        "tab",
        tab.active && "tab-active",
        className ?? "",
      )}
      style={style}
      onClick={handleClick}
    >
      <img className="tab-favicon" src={tab.favIconUrl || (!debugMode && getFaviconUrl(tab.url || "")) || undefined} alt="" />
      <div className="tab-title">{tab.title}</div>
      <div className="tab-close-icon" onClick={handleClose}>✕</div>
    </div>
  )
}


function Window({windowData, focusedTabs}: {windowData: WindowItem, focusedTabs: number[]}) {

  return (
    <div className="window">
      {windowData.children.map((el, i) => {
        if (el.kind === "tabGroup") {
          const tmp = el as GroupItem
          return (
            <div className="first-level tab-group" key={i} style={{"--color": `var(--${tmp.color})`} as React.CSSProperties}>
              <div className="tab-group-header">
                <div className="tab-group-title">{el.title || "​"}</div>
                <div className="tab-close-icon" onClick={e => handleCloseGroup(e, tmp)}>✕</div>
              </div>
              {tmp.children!.map((tab, j) => {
                return (
                  <Tab tab={tab} key={j} className={focusedTabs.includes(tab.id!) ? "focused" : ""} style={{borderColor: `var(--color)`}} />
                )
              })}
            </div>
          )
        }
        else {
          const tmp = el as TabItem
          return (
            <Tab tab={tmp} className={clsx("first-level", focusedTabs.includes(el.id!) && "focused")} key={i} />
          )
        }
      })}
    </div>
  )


}

export default Window