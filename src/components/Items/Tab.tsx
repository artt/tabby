import { TabItem } from "../../types"
import React from "react"
import clsx from "clsx"
import { debugMode } from "../../App"
import { getFaviconUrl } from "../../utils"
import { useSortable } from "@dnd-kit/sortable"
import {CSS} from '@dnd-kit/utilities';

type TabProps = {
  tab: TabItem,
  className?: string,
}

export const Tab = ({tab, className=""}: TabProps) => {

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({id: tab.id});
  
  const style = {
    transform: CSS.Translate.toString(transform),
    // transform: CSS.Transform.toString(transform),
    // transition: 'transform 0s linear',
    transition,
  };

  function handleClick(event: React.MouseEvent) {
    console.log('click')
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
      ref={setNodeRef}
      title={decodeURI(tab.url!)}
      className={clsx(
        "tab",
        tab.active && "tab-active",
        className || "",
      )}
      style={{...style, opacity: isDragging ? 0.5 : 1}}
      onClick={handleClick}
      {...attributes}
      {...listeners}
    >
      <img className="tab-favicon" src={tab.favIconUrl || (!debugMode && getFaviconUrl(tab.url || "")) || undefined} alt="" />
      <div className="tab-title">{tab.title}</div>
      <div className="tab-close-icon" onClick={handleClose}>✕</div>
    </div>
  )
}