import { Observable } from 'rxjs';

import { DropTarget } from './drop-target';
import { TreeConvertService } from './tree-convert.service.ts'
import { Tree } from './tree';


export class TreeNode extends DropTarget {
  id:  string|number
  data: any = null
  root: TreeNode[] = null
  tree: Tree = null
  children: TreeNode[] = []
  parentNode: TreeNode = null

  isAsync: boolean = false
  isExpanded: boolean = false
  isSelected: boolean = false
  isMatch: boolean = false
  isLoadingChildren: boolean = false
  hasLoadedChildren: boolean = false
  isLeafNode: boolean = false
  isVisible: boolean = true

  constructor(data: any, id: string|number, parent=null) {
    super();
    this.id = id
    this.parentNode = parent
    this.data = data
  }

  show() {
    this.isVisible = true
    return this
  }
  hide() {
    this.isVisible = false
    return this
  }
  expand(setter: boolean = true) {
    this.isExpanded = setter
    return this
  }
  select(setter?: boolean) {
    if (setter === undefined) {
      this.isSelected = !this.isSelected
    } else {
      this.isSelected = setter
    }
    return this
  }
  hasChildren(): boolean {
    if (this.isAsync) {
      return !this.isLeafNode;
    }
    return !!this.children.length
  }
  getDepth(): number {
    if (this.parentNode) {
      return this.parentNode.getDepth() + 1
    } else {
      return 0
    }
  }
}
