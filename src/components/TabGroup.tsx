import { cn } from "@/lib/utils"
import { GroupItem, TabItem } from "@/types"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from '@dnd-kit/utilities';
import React from "react";

function handleCloseGroup(event: React.MouseEvent, tabGroup: GroupItem) {
  event.stopPropagation()
  tabGroup.children.forEach(tab => chrome.tabs.remove(tab.id!))
}

type TabGroupProps = {
  tabGroup: GroupItem,
  className?: string,
  focusedTabs: number[]
}

export const TabGroup = ({tabGroup, className="", focusedTabs}: TabGroupProps) => {

  const [numTabsDisplayed, setNumTabsDisplayed] = React.useState(0)

  React.useEffect(() => {
    setNumTabsDisplayed(focusedTabs.length > 0 ? tabGroup.children.filter(tab => focusedTabs.includes(tab.id!)).length : tabGroup.children.length)
  }, [focusedTabs, tabGroup.children])

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({id: tabGroup.id});

  const style = {
    transform: CSS.Translate.toString(transform),
    // transform: CSS.Transform.toString(transform),
    transition: `${transition}, height .2s ease-in-out`,
  };
  
  return (
    <div
      ref={setNodeRef}
      className="tab-group my-2 overflow-x-hidden"
      style={{
        ...style,
        "--color": `var(--${tabGroup.color})`,
        backgroundColor: `color-mix(in srgb, var(--color), transparent 92%)`,
        opacity: isDragging ? 0.5 : 1
      } as React.CSSProperties}
      {...attributes}
      {...listeners}
    >
      <div className="tab-group-title flex items-center px-[--left-space] bg-[--color] font-bold text-background">
        <div>{tabGroup.title || "​"}</div>
        <div
          className="close-button ml-auto cursor-pointer font-bold hidden opacity-30"
          onClick={e => handleCloseGroup(e, tabGroup)}
        >
          ✕
        </div>
      </div>
      <div
        style={{
          height: isDragging ? 0 : `${numTabsDisplayed * 20}px`,
          transition: "height 0.2s",
        }}
      >
        {tabGroup.children.map((item: TabItem) => (
          <Tab
            key={item.id}
            tab={item}
            className={cn(
              focusedTabs.includes(item.id!) ? "focused" : ""
            )}
          />
        ))}
      </div>
    </div>
  )
}