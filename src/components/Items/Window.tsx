import {SortableContext, useSortable, verticalListSortingStrategy} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import { Tab, TabGroup } from '.';
import { GroupItem, TabItem, TreeItem, WindowItem } from '../../types';

export function Window({window, focusedTabs, className}: {window: WindowItem, focusedTabs: number[], className?: string}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({id: window.id});
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={className}>
      {window.children.length > 0 &&
        <SortableContext 
          items={window.children.map((item: TreeItem) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div>Window {window.id}</div>
          {window.children.map((item: TabItem | GroupItem) => {
            if (item.kind === "tab") {
              return <Tab key={item.id} tab={(item as TabItem)} className={focusedTabs.includes(item.id!) ? "focused" : ""} />
            }
            else {
              return <TabGroup
                key={item.id}
                tabGroup={(item as GroupItem)}
                className={item.kind}
                focusedTabs={focusedTabs}
              />
            }
          })}
        </SortableContext>
      }
    </div>
  )
  
}
