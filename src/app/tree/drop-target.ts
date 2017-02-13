import { TreeNode } from './node';

export abstract class DropTarget {
  public isDropTarget: boolean;
  public parentNode: TreeNode;
  public root: TreeNode[] = null;
  constructor() {
    this.isDropTarget = false;
  }
  target(isTarget: boolean) {
    this.isDropTarget = isTarget;
  }
}
