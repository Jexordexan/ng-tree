import  * as _ from 'lodash';
import { Observable } from 'rxjs';

import { TreeNode } from './node';
import { DropTarget } from './drop-target';

export class Tree extends DropTarget {
  private nodesById: { [key: string]: TreeNode } = {};
  public root: TreeNode[] = [];
  public fetchChildren: (TreeNode) => Observable<TreeNode>;
  public loadDepth: number;

  constructor(treeData: TreeNode[] = []) {
    super();
    this.root = treeData;
    this.forEach(node => {
      if (this.nodesById[node.id]) {
        throw new Error('Node already exists with id: ' + node.id)
      } else {
        node.tree = this;
        node.root = this.root;
        this.nodesById[node.id] = node;
      }
    });
  }

  hasNodes(): boolean {
    return !!this.root && !!this.root.length;
  }

  contains(node: DropTarget): boolean {
    return node.root === this.root;
  }

  forEach(beforeFn?: (node: TreeNode) => void, afterFn?: (node: TreeNode) => void, entryNode?: TreeNode) {
    function walk(node: TreeNode): void {
      if (node) {
        if (beforeFn && typeof beforeFn === 'function') {
          beforeFn(node);
        }
        if (node.children) {
          node.children.forEach(walk);
        }
        if (afterFn && typeof afterFn === 'function') {
          afterFn(node);
        }
      }
    }

    if (entryNode) {
      walk(entryNode);
    } else {
      this.root.forEach(walk);
    }
  }

  loadChildrenAsync(node: TreeNode, depth=this.loadDepth) {
    if (depth < 0) {
      return;
    } else if (node.hasLoadedChildren) {
      node.children.forEach(child => {
        this.loadChildrenAsync(child, depth - 1);
      })
    } else {
      node.isLoadingChildren = true;
      this.fetchChildren(node).subscribe(
        child => {
          this.addNode(child, node);
          this.loadChildrenAsync(child, depth - 1);
        }, err => {
          node.isLoadingChildren = false;
          console.error('Error fetching children', err);
        }, () => {
          node.isLoadingChildren = false;
          node.hasLoadedChildren = true;
        });
    }
  }

  getNodeById(nodeId: number|string): TreeNode {
    return this.nodesById[nodeId];
  }

  getLastDescendant(node: TreeNode): TreeNode {
    let lastChild: TreeNode;
    let n: number;
    n = node.children.length;
    if (n === 0) {
        return node;
    } else {
        lastChild = node.children[n - 1];
        return this.getLastDescendant(lastChild);
    }
  }

  getNextSibling(node: TreeNode): TreeNode {
    let parent = node.parentNode;
    let siblings = parent ? parent.children : node.root
    let len = siblings.length;
    let index = siblings.indexOf(node);
    if (index < len) {
      return siblings[index + 1]
    } else {
      return null;
    }
  }

  getPrevSibling(node: TreeNode): TreeNode {
    let parent = node.parentNode;
    let siblings = parent ? parent.children : node.root
    let len = siblings.length;
    let index = siblings.indexOf(node);

    if (index > 0) {
      return siblings[index - 1];
    } else {
      return null;
    }
  }

  getClosestAncestorNextSibling(node: TreeNode): TreeNode {
    let _target = this.getNextSibling(node);
    if (_target) {
      return _target;
    }

    let _parent = node.parentNode;
    if (_parent) {
      return this.getClosestAncestorNextSibling(_parent);
    }

    return null;
  }

  getFirstChild(node: TreeNode): TreeNode {
    if (node.children) {
      return node.children[0];
    } else {
      return null;
    }
  }

  getNextNode(node: TreeNode): TreeNode {
    if (node) {
      let _target = this.getFirstChild(node);
      if (_target) {
        return _target;
      } else {
        return this.getClosestAncestorNextSibling(node);
      }
    }
  }

  getPrevNode(node: TreeNode): TreeNode {
    if (node) {
      let _target = this.getPrevSibling(node);
      if (_target) {
        return this.getLastDescendant(_target);
      }

      let _parent = node.parentNode;
      return _parent;
    }
  }

  isBeforeNode(node: TreeNode, reference: TreeNode): boolean {
    let next = this.getNextNode(node)
    while (next !== null) {
      if (next === reference) {
        return true;
      }
      next = this.getNextNode(next);
    }
    return false;
  }

  getNodeIndex(node: TreeNode): number {
    let parent = node.parentNode;
    let nodeIndex: number;
    if (parent === null) {
      nodeIndex = node.root.indexOf(node);
    } else {
      nodeIndex = parent.children.indexOf(node);
    }
    return nodeIndex;
  }

  addNode(node: TreeNode, parentNode: TreeNode, index: number = 0) {
    if (this.nodesById[node.id]) {
      throw new Error('Node already exists with id: ' + node.id)
    }

    this.nodesById[node.id] = node;

    if (parentNode === null) {
      this.root.splice(index, 0, node);
      node.parentNode = null;
    } else {
      if (parentNode.children) {
        parentNode.children.splice(index, 0, node);
      } else {
        parentNode.children = [node];
      }
      node.parentNode = parentNode;
    }
    node.tree = this
    node.root = this.root
  }

  removeNode(node: TreeNode) {
    delete this.nodesById[node.id];

    let parent = node.parentNode;
    let nodeIndex = this.getNodeIndex(node);
    if (parent === null) {
      node.root.splice(nodeIndex, 1);
    } else {
      parent.children.splice(nodeIndex, 1);
    }
  }

  moveNode(node: TreeNode, targetNode: DropTarget, placeBefore: boolean, placeInside: boolean) {
    if (targetNode instanceof TreeNode) {
      let parent = node.parentNode;
      let newParent = targetNode.parentNode;
      let nodeIndex = this.getNodeIndex(node);
      let newIndex = this.getNodeIndex(targetNode);
      this.removeNode(node);

      if (placeInside) {
        newIndex = 0;
        newParent = targetNode;
      }

      if (!placeBefore) {
        newIndex++;
      }

      if (this.contains(node) &&
        newParent === parent &&
        nodeIndex < newIndex) {
        newIndex--;
      }

      if (this.contains(targetNode)) {
        this.addNode(node, newParent, newIndex);
      }
    } else {
      this.removeNode(node);
      this.addNode(node, null, 0);
    }
  }
}
