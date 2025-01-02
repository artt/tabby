import { GroupItem, TreeItem, WindowItem } from "@/types";
import { UniqueIdentifier } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";

// return the object of found ID, which could be a child of a child
export function getItemFromId(id: UniqueIdentifier, windowsData: WindowItem[]): TreeItem {
  let foundItem: TreeItem | null = null;
  function findItem(item: TreeItem) {
    if (item.id === id) {
      foundItem = item;
    }
    else {
      item.children.forEach(child => findItem(child));
    }
  }
  windowsData.forEach(item => findItem(item));
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

export function moveItem(currentTree: TreeItem[], activeIndexTree: number[], overIndexTree: number[], activeId: UniqueIdentifier, windowsData: WindowItem[]) {
  if (activeIndexTree[0] === overIndexTree[0]) {
    const newTree: TreeItem[] = []
    for (let i = 0; i < currentTree.length; i ++) {
      if (i === activeIndexTree[0]) {
        const newChildren = moveItem(currentTree[i].children, activeIndexTree.slice(1), overIndexTree.slice(1), activeId, windowsData)
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
  else if (activeIndexTree.length === 1 && overIndexTree.length === 1) {
    // console.log("one item left")
    return arrayMove(currentTree, activeIndexTree[0], overIndexTree[0])
  }
  // last case is when active and over don't have the same parent
  // we need to remove the active item from its current parent
  // then add the active item to the over item's children
  else {
    // get the active item
    const activeItem = getItemFromId(activeId, windowsData)
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
          newTree.push(activeItem)
          newTree.push(currentTree[i])
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
    return newTree
  }
}