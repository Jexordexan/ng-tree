import { DropTarget } from './drop-target';

export class TreeNode extends DropTarget {
  id:  string|number
  data: any = null
  root: TreeNode[] = null
  children: TreeNode[] = []
  parentNode: TreeNode = null

  isExpanded: boolean = false
  isSelected: boolean = false
  isMatch: boolean = false
  isVisible: boolean = true

  constructor(data: any, id: string|number) {
    super();
    this.id = id
    this.parentNode = null
    this.data = data
  }

  toggle() {
    this.isExpanded = !this.isExpanded
    return this
  }
  show() {
    this.isVisible = true;
    return this
  }
  hide() {
    this.isVisible = false;
    return this
  }
  expand(setter: boolean = true) {
    this.isExpanded = setter;
    return this
  }
  select(setter?: boolean) {
    if (setter === undefined) {
      this.isSelected = !this.isSelected
    } else {
      this.isSelected = setter;
    }
    return this
  }
  getState() {
    return {
      expanded: this.children.length && this.isExpanded,
      collapsed: this.children.length && !this.isExpanded
    };
  }
  getDepth(): number {
    if (this.parentNode) {
      return this.parentNode.getDepth() + 1;
    } else {
      return 0
    }
  }
}
