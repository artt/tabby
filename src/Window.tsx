import clsx from 'clsx'
import { getFaviconUrl } from './utils'
import type { GroupData, TabData, WindowData } from './App'

function handleCloseGroup(event: React.MouseEvent, tabGroup: GroupData) {
  event.stopPropagation()
  tabGroup.tabs.forEach(tab => chrome.tabs.remove(tab.id!))
}

function Tab({tab, className="", style}: {tab: TabData, className?: string, style?: React.CSSProperties}) {

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
      className={clsx(
        "tab",
        tab.active && "tab-active",
        className ?? "",
      )}
      style={style}
      onClick={handleClick}
    >
      <img className="tab-favicon" src={tab.favIconUrl || getFaviconUrl(tab.url || "")} alt="" />
      <div className="tab-title">{tab.title}</div>
      <div className="tab-close-icon" onClick={handleClose}>✕</div>
    </div>
  )
}


function Window({windowData, focusedTabs}: {windowData: WindowData, focusedTabs: number[]}) {

  return (
    <div className="window">
      {windowData.elements.map((el, i) => {
          if (el.type === "tabGroup") {
            return (
              <div className="first-level tab-group" key={i} style={{"--color": `var(--${el.color})`} as React.CSSProperties}>
                <div className="tab-group-header">
                  <div className="tab-group-title">{el.title}</div>
                  <div className="tab-close-icon" onClick={e => handleCloseGroup(e, el)}>✕</div>
                </div>
                {el.tabs!.map((tab, j) => {
                  return (
                    <Tab tab={tab} key={j} className={focusedTabs.includes(tab.id!) ? "focused" : ""} style={{borderColor: `var(--color)`}} />
                  )
                })}
              </div>
            )
          }
          else {
            return (
              <Tab tab={el} className={clsx("first-level", focusedTabs.includes(el.id!) && "focused")} key={i} />
            )
          }
        })
      }
    </div>
  )


}

export default Window