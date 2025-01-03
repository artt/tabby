import { GroupItem, TreeItem, WindowItem } from "@/types";
import { Active, Over, UniqueIdentifier } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";

// return the object of found ID, which could be a child of a child
export function getItemFromId(id: UniqueIdentifier, tree: TreeItem[]): TreeItem {
  let foundItem: TreeItem | null = null;
  function findItem(item: TreeItem) {
    if (item.id === id) {
      foundItem = item;
    }
    else {
      item.children.forEach(child => findItem(child));
    }
  }
  tree.forEach(item => findItem(item));
  if (foundItem == null) {
    throw new Error(`Could not find item with ID ${id}`);
  }
  return foundItem;
}

// From an index tree, return the index of the item within the window (specified by the first element of the index tree).
// This is done by looking at number of tabs within tabgroups before the item.
export function getWindowsTabIndexFromIndexTree(indexTree: number[], tree: TreeItem[]): number {
  if (indexTree.length < 2) {
    throw new Error("Index tree must have at least two elements");
  }
  const currentWindow = tree[indexTree[0]]
  let count = 0
  for (let i = 0; i < indexTree[1]; i ++) {
    if (currentWindow.children[i].kind === "tab") {
      count ++
    }
    else if (currentWindow.children[i].kind === "tabGroup") {
      count += (currentWindow.children[i] as GroupItem).children.length
    }
  }
  if (indexTree.length === 2) {
    return count
  }
  else {
    // move into the group
    return count + indexTree[2]
  }
}

// This function returns an array of indices, referred to as an 'index tree', for a given ID.
// The 'index tree' represents the hierarchical location of the item within the structure.
// The first element in the array is the index of the window where the item is located.
// The second element is either the index of the item within the window (if the item is a direct child of the window),
// or the index of the tab group within the window (if the item is within a tab group), and so on for deeper levels of nesting.
export function getIndexTreeFromId(id: UniqueIdentifier, tree: TreeItem[]): number[] {
  let foundIndexTree: number[] = [];
  function findIndexTree(item: TreeItem, indexTree: number[]) {
    if (item.id === id) {
      foundIndexTree = indexTree;
    }
    else {
      item.children.forEach((child, index) => findIndexTree(child, [...indexTree, index]));
    }
  }
  tree.forEach((item, index) => findIndexTree(item, [index]));
  if (foundIndexTree.length === 0) {
    throw new Error(`Could not find index tree for item with ID ${id}`);
  }
  return foundIndexTree;
}

function deleteItem(currentTree: TreeItem[], indexTree: number[]) {
  if (indexTree.length === 1) {
    return currentTree.filter((_, i) => i !== indexTree[0])
  }
  else {
    const newTree: TreeItem[] = []
    for (let i = 0; i < currentTree.length; i ++) {
      if (i === indexTree[0]) {
        const newChildren = deleteItem(currentTree[i].children, indexTree.slice(1))
        newTree.push({
          ...currentTree[i],
          children: newChildren
        })
      }
      else {
        newTree.push(currentTree[i])
      }
    }
    return newTree
  }
}

function addItem(currentTree: TreeItem[], indexTree: number[], item: TreeItem) {
  if (indexTree.length === 1) {
    return [
      ...currentTree.slice(0, indexTree[0]),
      item,
      ...currentTree.slice(indexTree[0])
    ]
  }
  else {
    const newTree: TreeItem[] = []
    for (let i = 0; i < currentTree.length; i ++) {
      if (i === indexTree[0]) {
        const newChildren = addItem(currentTree[i].children, indexTree.slice(1), item)
        newTree.push({
          ...currentTree[i],
          children: newChildren
        })
      }
      else {
        newTree.push(currentTree[i])
      }
    }
    return newTree
  }
}

function moveItem(
  currentTree: TreeItem[],
  activeId: UniqueIdentifier,
  overId: UniqueIdentifier,
) {

  const activeIndexTree = getIndexTreeFromId(activeId, currentTree)
  const overIndexTree = getIndexTreeFromId(overId, currentTree)

  if (activeIndexTree[0] === overIndexTree[0]) {
    const newTree: TreeItem[] = []
    for (let i = 0; i < currentTree.length; i ++) {
      if (i === activeIndexTree[0]) {
        const newChildren = moveItem(currentTree[i].children, activeId, overId)
        newTree.push({
          ...currentTree[i],
          children: newChildren
        })
      }
      else {
        newTree.push(currentTree[i])
      }
    }
    return newTree
  }
  else if ((activeIndexTree.length === 1 && overIndexTree.length === 1) && (currentTree[overIndexTree[0]].kind != 'tabGroup')) {

    // console.log('xxx', currentTree, activeIndexTree, overIndexTree)
    // if (currentTree[overIndexTree[0]].kind === "tabGroup") {
    //   // add the item to the tab group
    // }
    // console.log("one item left")
    return arrayMove(currentTree, activeIndexTree[0], overIndexTree[0])
  }
  // last case is when active and over don't have the same parent
  // we need to remove the active item from its current parent
  // then add the active item to the over item's children
  else {
    // get the active item
    const activeItem = getItemFromId(activeId, currentTree)
    const overItem = getItemFromId(overId, currentTree)
    // console.log('yyy', currentTree, activeIndexTree, overIndexTree)
    // console.log('---', activeItem.title, overItem.title)
    const newTree: TreeItem[] = []
    for (let i = 0; i < currentTree.length; i ++) {
      if (i === activeIndexTree[0]) {
        if (activeIndexTree.length === 1) {
          continue 
        }
        const newChildren = deleteItem(currentTree[i].children, activeIndexTree.slice(1))
        newTree.push({
          ...currentTree[i],
          children: newChildren
        })
      }
      else if (i === overIndexTree[0]) {
        if (overIndexTree.length === 1) {
          // check if overItem is a tabGroup
          // if it is, then add the activeItem to that tabGroup
          if (overItem.kind === "tabGroup") {
            const newChildren = addItem((overItem as GroupItem).children, [0], activeItem)
            newTree.push({
              ...overItem,
              children: newChildren
            })
          }
          else {
            newTree.push(activeItem)
            newTree.push(currentTree[i])
          }
        }
        else {
          const newChildren = addItem(currentTree[i].children, overIndexTree.slice(1), activeItem)
          newTree.push({
            ...currentTree[i],
            children: newChildren
          })
        }
      }
      else {
        newTree.push(currentTree[i])
      }
    }
    // console.log(newTree)
    return newTree
  }
}

// deal only with cases when the active item has changed parents
// otherwise the whole thing is dealt with in onDragEnd
export const onDragOver = (active: Active, over: Over, windowsData: WindowItem[], setWindowsData: (data: WindowItem[]) => void) => {

  if (active.id === over.id) {
    // TODO: consider remove this... not sure if needed
    console.error("This should not happen")
    return
  }

  console.log("drag over", getItemFromId(over.id, windowsData).title)

  const activeIndexTree = getIndexTreeFromId(active.id, windowsData)
  const overIndexTree = getIndexTreeFromId(over.id, windowsData)

  // if moved to own parent then do nothing
  // TODO: move this logic into moveItem instead so that the animation is more smooth
  if (activeIndexTree.slice(0, -1).join(",") === overIndexTree.join(",")) return
  if (activeIndexTree.join(",") === overIndexTree.slice(0, -1).join(",")) return

  // console.log("dragover", getItemFromId(over.id, windowsData).title)
  // console.log("move", activeIndexTree, overIndexTree)
  
  // console.log('moving item', activeIndexTree, overIndexTree)
  const tmp = moveItem(windowsData, active.id, over.id) as WindowItem[]
  // setWindowsData(tmp)

}

function syncChromeTabs(active: Active, over: Over, windowsData: WindowItem[]) {

  const activeItem = getItemFromId(active.id, windowsData)

  // we don't allow moving windows
  if (activeItem.kind === "window") {
    // TODO: consider remove this... not sure if needed
    console.error('We actually need to check this!?!')
    return
  }

  const activeIndexTree = getIndexTreeFromId(active.id, windowsData)

  if (activeItem.kind === "tab") {
    const newIndex = getWindowsTabIndexFromIndexTree(activeIndexTree, windowsData)
    let newGroup = -1
    if (activeIndexTree.length === 3) {
      console.log("activeIndexTree has length 3")
      // need to move into the group of the next tab
      // if the position in the group is 0, then need to look at the index of the next tab over
      newGroup = windowsData[activeIndexTree[0]].tabs![newIndex + (activeIndexTree[2] === 0 ? 1 : 0)].groupId
    }
    console.log("newGroup", newGroup)
    chrome.tabs.move(active.id as number, {
      index: getWindowsTabIndexFromIndexTree(activeIndexTree, windowsData),
      windowId: windowsData[activeIndexTree[0]].id,
    })
    if (newGroup === -1) {
      chrome.tabs.ungroup(active.id as number)
    }
    else {
      chrome.tabs.group({ tabIds: active.id as number, groupId: newGroup })
    }
  }
  
  else if (activeItem.kind === "tabGroup") {
    const currentWindowId = (activeItem as GroupItem).windowId
    const newWindowId = windowsData[activeIndexTree[0]].id
    chrome.tabGroups.move(active.id as number, {
      index: getWindowsTabIndexFromIndexTree(activeIndexTree, windowsData),
      // for some reason if the windowId is the same then there'd be error // TODO: report this?
      ...(currentWindowId !== newWindowId && {windowId: windowsData[activeIndexTree[0]].id}),
    })
  }

}

export const onDragEnd = (active: Active, over: Over, windowsData: WindowItem[], setWindowsData: (data: WindowItem[]) => void) => {

  document.getElementById("main")?.classList.remove("dragging")

  const newWindowsData = moveItem(windowsData, active.id, over.id) as WindowItem[]
  setWindowsData(newWindowsData)
  syncChromeTabs(active, over, newWindowsData)

}
