import { cn, getFavIconUrl } from "@/lib/utils"
import { TabItem } from "@/types"
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from '@dnd-kit/utilities';
import React from "react";

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
    transition: `${transition}, height .2s ease-in-out`,
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

  React.useEffect(() => {
    console.log('dragging', isDragging)
  }, [isDragging])

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "tab flex items-center h-[--tab-height] px-[--left-space] transition-height",
        className,
        tab.active ? "active": "",
        // isDragging ? "cursor-grabbing" : "",
      )}
      style={{...style, opacity: isDragging ? 0.5 : 1}}
      onClick={handleClick}
      {...attributes}
      {...listeners}
    >
      <img className="w-4 h-4" src={tab.favIconUrl || getFavIconUrl(tab.url || "") || undefined} alt="" />
      <div className="mx-2 overflow-hidden text-ellipsis whitespace-nowrap">{tab.title}</div>
      <div
        className="close-button ml-auto font-bold hidden opacity-30"
        onClick={handleClose}
      >
        ✕
      </div>
    </div>
  )
}