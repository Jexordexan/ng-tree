import { Component, ElementRef, Input, Output, OnInit, OnChanges, Renderer, EventEmitter, SimpleChanges, SimpleChange, TemplateRef, ContentChild } from '@angular/core';
import  * as _ from 'lodash';
import { Tree } from './tree';
import { TreeNode } from './node';
import { TreeNodeComponent, ITreeNodeTemplate } from './tree-node.component';
import { TreeDragService, DragInfo } from './tree-drag.service';
import { TreeHandleDirective } from './tree-handle.directive';
import { TreeEventsService, TREE_EVENT } from './tree-events.service';

export interface IOptions {
  allowDrag: boolean | ((node: TreeNode) => boolean)
  allowDrop: boolean | ((node: TreeNode) => boolean)
  indentSize: number;
}

@Component({
    selector: 'tree',
    template: `
      <ul class="tree__nodes"
          [class.empty]="!tree.hasNodes()"
          [class.placeInside]="tree.isDropTarget"
          (mouseover)="onMouseOver($event)">
        <tree-node *ngFor="let node of tree.root"
                    [treeNode]="node">
        </tree-node>
      </ul>
    `
})

export class TreeComponent implements OnInit, OnChanges {
  @Input() tree: Tree = new Tree();
  // @Input() filter: string = '';
  @Input() options: IOptions;
  @ContentChild('nodeTemplate') nodeTemplate: TemplateRef<ITreeNodeTemplate>;

  public elem: HTMLElement;
  private anchorNode: TreeNode = null;
  private selectedNodes: TreeNode[] = [];
  private expandedNodes: TreeNode[] = [];
  private allowDrag = (node: TreeNode) => false
  private allowDrop = (node: TreeNode) => false

  constructor(
    private treeDragService: TreeDragService,
    private elementRef: ElementRef,
    private events: TreeEventsService,
    private renderer: Renderer) {
    this.elem = elementRef.nativeElement;
  }

  ngOnInit() {
    if (this.options) {
      if (typeof this.options.allowDrag === 'function') {
        this.allowDrag = this.options.allowDrag;
      } else if (typeof this.options.allowDrag === 'boolean') {
        this.allowDrag = (node: TreeNode) => !!this.options.allowDrag
      } else {
        this.allowDrag = (node: TreeNode) => false
      }

      if (typeof this.options.allowDrop === 'function') {
        this.allowDrop = this.options.allowDrop;
      } else if (typeof this.options.allowDrop === 'boolean') {
        this.allowDrop = (node: TreeNode) => !!this.options.allowDrop
      } else {
        this.allowDrop = (node: TreeNode) => false
      }

      if (!this.options.indentSize) {
        this.options.indentSize = 20;
      }
    }

    this.events.listen(TREE_EVENT.DRAG_MOVE)
    .subscribe((drag: DragInfo)  => {
      if (this.validateDragEvent(drag)) {
        drag.selectedNodes = this.selectedNodes;
      }
    });

    this.events.listen(TREE_EVENT.DRAG_END)
    .subscribe((dragEnd: DragInfo) => {
      this.validateDragEvent(dragEnd);
    });

    this.events.listen(TREE_EVENT.DROP)
    .subscribe((drop: DragInfo) => {
      if (this.tree.contains(drop.target)) {
        if (drop.placeBefore) {
          _.each(this.selectedNodes, node => {
            this.tree.moveNode(node, drop.target, drop.placeBefore, drop.placeInside);
          })
        } else {
          _.eachRight(this.selectedNodes, node => {
            this.tree.moveNode(node, drop.target, drop.placeBefore, drop.placeInside);
          })
        }
      }
    });

    this.events.listen(TREE_EVENT.SELECT_NODE)
    .subscribe(this.selectAnchorNode.bind(this));

    this.events.listen(TREE_EVENT.RANGE_SELECT_NODE)
    .subscribe(this.selectFromNodeToAnchor.bind(this));

    this.events.listen(TREE_EVENT.ADD_SELECT_NODE)
    .subscribe(node => {
      if (!node) {
        return null;
      }
      // don't select node if already selected
      if (this.isSelected(node)) {
        this.deselectNode(node);
        return null;
      }
      // select node before continuing
      // and deselect any descendants
      this.setAnchorNode(node);
      this.deselectDescendants(node);

      // clean up the new selection
      this.resolveSelection();
    });

    this.events.listen(TREE_EVENT.EXPAND_NODE)
    .subscribe(this.expandNode.bind(this));

    this.events.listen(TREE_EVENT.COLLAPSE_NODE)
    .subscribe(this.collapseNode.bind(this));
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['tree']) {
      this.onTreeDataChanges(changes['tree'])
    }
  }

  onMouseOver(event: MouseEvent) {
    if (!this.tree.hasNodes() && this.treeDragService.getIsDragging()) {
      event.stopPropagation();
      this.treeDragService.setTargetNode(this.tree, this.elem);
    }
  }

  validateDragEvent(dragEvent: DragInfo) {
    let node = dragEvent.node;
    let parent = dragEvent.parent;
    if (dragEvent.target instanceof TreeNode) {
      if (dragEvent.placeInside) {
          parent = dragEvent.target;
      }
      while (parent) {
        if (this.isSelected(parent)) {
          dragEvent.reject();
          return false;
        } else {
          parent = parent.parentNode;
        }
      }
    }
    return true;
  }

  filterNode(node: TreeNode, filter: (node: TreeNode) => boolean): boolean {
    let isMatch = filter(node);
    let hasMatch = false;
    let children = node.children || [];
    children.forEach(node => {
      hasMatch = this.filterNode(node, filter) || hasMatch;
    });

    if (isMatch || hasMatch) {
      node.show().expand().isMatch = isMatch;
      return true;
    } else {
      node.hide().isMatch = false;
      return false;
    }
  }

  filterTree(filter: (node: TreeNode) => boolean) {
    this.tree.root.forEach(node => this.filterNode(node, filter));
  }

  clearFilter() {
    const clearFilter = node => {
      let children = node.children || [];
      children.forEach(clearFilter);
      node.show().isMatch = false;
      node.expand(this.isExpanded(node));
    }
    this.tree.root.forEach(clearFilter);
  }

  onTreeDataChanges(changes: SimpleChange) {
    if (changes.isFirstChange()) {
      this.tree = changes.currentValue || new Tree();
    } else {
      let expandedIds = this.expandedNodes.map(node => node.id);
      let selectedIds = this.selectedNodes.map(node => node.id);
      this.expandedNodes = [];
      this.selectedNodes = [];
      this.tree = changes.currentValue;
      expandedIds.forEach(id => this.expandNode(this.tree.getNodeById(id)))
      selectedIds.forEach(id => this.selectNode(this.tree.getNodeById(id)))
    }
  }

  expandNode(node: TreeNode) {
    if (node) {
      let index = this.expandedNodes.indexOf(node);
      if (index < 0) {
        this.expandedNodes.push(node);
      }
      node.expand(true);
      if (node.isAsync) {
        this.tree.loadChildrenAsync(node, this.tree.loadDepth);
      }
    }
  }

  collapseNode(node: TreeNode) {
    if (node) {
      let index = this.expandedNodes.indexOf(node);
      if (index > -1) {
        this.expandedNodes.splice(index, 1);
      }
      node.expand(false);
    }
  }

  getAnchorNode() {
    return this.anchorNode;
  }

  getSelectedNodes() {
    return this.selectedNodes;
  }

  getExpandedNodes() {
    return this.expandedNodes;
  }

  isSelected(node: TreeNode) {
    let index = this.selectedNodes.indexOf(node);
    return index > -1;
  }

  isExpanded(node: TreeNode) {
    let index = this.expandedNodes.indexOf(node);
    return index > -1;
  }

  selectNode (node: TreeNode) {
    if (node) {
      let index = this.selectedNodes.indexOf(node);
      if (index < 0) {
        this.selectedNodes.push(node);
        node.select(true);
      }
    }
  }

  selectAnchorNode (node: TreeNode) {
    this.deselectAll();
    this.selectNode(node);
    this.anchorNode = node;
    node.select(true);
  }

  setAnchorNode (node: TreeNode) {
    this.selectNode(node);
    this.anchorNode = node;
    node.select(true);
  }

  selectFromNodeToAnchor (node: TreeNode) {
    if (!node) {
      return null;
    } else if (!this.anchorNode) {
      // just select the node if the anchor node isn't set
      this.selectAnchorNode(node);
      return this.selectedNodes;
    }

    // reset selection
    let anchor = this.anchorNode;
    let isBeforeAnchor = this.tree.isBeforeNode(node, this.anchorNode);
    this.deselectAll();

    // put the anchor node back in the list
    this.selectAnchorNode(anchor);

    // Add all nodes leading to the selected node
    while (node && node !== anchor) {
      this.selectNode(node);
      if (isBeforeAnchor) {
        node = this.tree.getNextNode(node);
      } else {
        node = this.tree.getPrevNode(node);
      }
    }

    // clean up the new selection
    this.resolveSelection();
    return this.selectedNodes;
  }

  resolveSelection(nodes?: TreeNode[]) {
    let tree = this;
    nodes = nodes || this.selectedNodes;
    // nodes.sort((a, b) => {
    //   return this.tree.isBeforeNode(a, b) ? -1 : 1;
    // });
    nodes.forEach(resolve);
    function resolve(node: TreeNode) {
      let children = node.children,
          selectedChildCount = 0,
          selectedDescendantCount  = 0;
      if (children.length) {
        for (var i = 0; i < children.length; i++) {
          selectedDescendantCount += resolve(children[i]);
          if (tree.isSelected(children[i])) {
            ++selectedChildCount;
          }
        }
        if (selectedChildCount === children.length) {
          tree.selectNode(node);
          tree.deselectDescendants(node);
        } else if (selectedChildCount || selectedDescendantCount) {
          tree.deselectNode(node);
        }
      }
      return selectedDescendantCount + selectedChildCount;
    }
  }

  deselectNode(node: TreeNode) {
    let index = this.selectedNodes.indexOf(node);
    if (index > -1) {
      if (this.anchorNode === node) {
        if (this.selectedNodes[index + 1]) {
          this.anchorNode = this.selectedNodes[index + 1];
        } else if (this.selectedNodes[index - 1]) {
          this.anchorNode = this.selectedNodes[index - 1];
        } else {
          this.anchorNode = null;
        }
      }
      this.selectedNodes.splice(index, 1);
    }

    node.select(false);
  }

  deselectAll() {
    this.anchorNode = null;
    for (let i = 0; i < this.selectedNodes.length; i++) {
        let node = this.selectedNodes[i];
        node.select(false);
    }
    this.selectedNodes = [];
  }

  deselectDescendants(node: TreeNode) {
    node = node || this.anchorNode;
    if (node) {
      let _children = node.children;
      if (_children.length > 0) {
        _children.forEach(child => {
          this.deselectDescendants(child);
          this.deselectNode(child);
        });
      }
    }
  }
}
