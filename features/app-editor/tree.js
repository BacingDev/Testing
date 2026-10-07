export function updateTree(nodes, id, updater) {
  return (nodes ?? []).map((node) => {
    if (node.id === id) return updater(node);
    if (node.children && node.children.length > 0) {
      return { ...node, children: updateTree(node.children, id, updater) };
    }
    return node;
  });
}

export function removeTree(nodes, id) {
  let removed = false;
  const next = [];
  for (const node of nodes ?? []) {
    if (node.id === id) {
      removed = true;
      continue;
    }
    if (node.children && node.children.length > 0) {
      const child = removeTree(node.children, id);
      removed = removed || child.removed;
      next.push({ ...node, children: child.nodes });
    } else {
      next.push(node);
    }
  }
  return { nodes: next, removed };
}

export function moveTree(nodes, id, delta) {
  const list = [...(nodes ?? [])];
  const index = list.findIndex((node) => node.id === id);
  if (index >= 0) {
    const target = index + delta;
    if (target < 0 || target >= list.length) return list;
    const [item] = list.splice(index, 1);
    list.splice(target, 0, item);
    return list;
  }
  return list.map((node) =>
    node.children && node.children.length > 0
      ? { ...node, children: moveTree(node.children, id, delta) }
      : node,
  );
}

export function insertTree(nodes, parentId, node) {
  if (!parentId) return [...(nodes ?? []), node];
  return (nodes ?? []).map((item) => {
    if (item.id === parentId) {
      return { ...item, children: [...(item.children ?? []), node] };
    }
    if (item.children && item.children.length > 0) {
      return { ...item, children: insertTree(item.children, parentId, node) };
    }
    return item;
  });
}

export function findTree(nodes, id) {
  for (const node of nodes ?? []) {
    if (node.id === id) return node;
    if (node.children && node.children.length > 0) {
      const found = findTree(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

export function containsId(nodes, id) {
  return findTree(nodes, id) !== null;
}
