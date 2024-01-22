import React from 'react'
import Window from './Window'
import './style.scss'
import { Controls } from './Controls'

function App() {

  const [windows, setWindows] = React.useState<chrome.windows.Window[]>([])
  const [tabGroups, setTabGroups] = React.useState<chrome.tabGroups.TabGroup[]>([])

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function handleEvent(_name: string, _payload: object) {
    chrome.windows.getAll({populate: true}).then(res => setWindows(res))
    chrome.tabGroups.query({}).then(res => setTabGroups(res))
    // chrome.tabs.query({}).then(res => setTabs(res))
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
    chrome.tabGroups.onCreated.addListener((group) => handleEvent("groupCreated", {group}));
    chrome.tabGroups.onMoved.addListener((group) => handleEvent("groupMoved", {group}));
    chrome.tabGroups.onRemoved.addListener((group) => handleEvent("groupRemoved", {group}));
    chrome.tabGroups.onUpdated.addListener((group) => handleEvent("groupUpdated", {group}));

    handleEvent("init", {})

  }, [])

  React.useEffect(() => {
    console.log(windows)
  }, [windows])
  // React.useEffect(() => {
  //   console.log(tabGroups)
  // }, [tabGroups])
  // React.useEffect(() => {
  //   console.log(tabs)
  // }, [tabs])

  return (
    <>
      <Controls />
      <div className="windows-container">
        {windows.map(window => (
          <Window
            key={window.id}
            window={window}
            tabGroups={tabGroups}
          />
        ))}
      </div>
      <div className="footer-container">
        Test
      </div>
    </>
  )
}

export default App
