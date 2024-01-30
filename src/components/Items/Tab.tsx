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
  } = useSortable({id: tab.id});
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

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
      ref={setNodeRef}
      title={decodeURI(tab.url!)}
      className={clsx(
        "tab",
        tab.active && "tab-active",
        className || "",
      )}
      style={style}
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