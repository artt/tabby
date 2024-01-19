import React from 'react'
import Window from './Window'
import './style.scss'

function App() {

  const [windows, setWindows] = React.useState<chrome.windows.Window[]>([])
  const [tabGroups, setTabGroups] = React.useState<chrome.tabGroups.TabGroup[]>([])
  const [tabs, setTabs] = React.useState<chrome.tabs.Tab[]>([])

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_keepWindows, setKeepWindows] = React.useState<boolean>(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_keepExistingGroups, setKeepExistingGroups] = React.useState<boolean>(false)

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function handleEvent(_name: string, _payload: object) {
    chrome.windows.getAll({populate: true}).then(res => setWindows(res))
    chrome.tabGroups.query({}).then(res => setTabGroups(res))
    chrome.tabs.query({}).then(res => setTabs(res))
  }

  React.useEffect(() => {

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

    handleEvent("init", {})

  }, [])

  React.useEffect(() => {
    console.log(windows)
  }, [windows])
  React.useEffect(() => {
    console.log(tabGroups)
  }, [tabGroups])
  React.useEffect(() => {
    console.log(tabs)
  }, [tabs])

  function group() {
    console.log(import.meta.env.VITE_OPENAI_API_KEY)
    
  }

  return (
    <>
      <div className="controls">
        Keep windows <input type="checkbox" onClick={e => setKeepWindows((e.target as HTMLInputElement).checked)} />
        Keep existing groups <input type="checkbox" onClick={e => setKeepExistingGroups((e.target as HTMLInputElement).checked)} />
        <button onClick={group}>Group</button>
      </div>
      {windows.map(window => (
        <Window
          key={window.id}
          window={window}
          tabGroups={tabGroups}
        />
      ))}
    </>
  )
}

export default App
