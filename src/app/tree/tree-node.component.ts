import { Component, Input, ElementRef, Renderer, OnChanges, TemplateRef } from '@angular/core';
import { NgClass } from '@angular/common';

import { TREE_EVENT, TreeEventsService } from './tree-events.service';
import { TreeDragService } from './tree-drag.service';
import { TreeComponent } from './tree.component';
import { ITreeNodeTemplate } from './node-content.component';
import { TreeNode } from './node';

@Component({
    selector: 'tree-node',
    template: `
      <div class="tree__node-item"
          treeHandle
          [class.hidden]="!treeNode.isVisible"
          [class.match]="treeNode.isMatch"
          [class.selected]="treeNode.isSelected"
          [class.placeInside]="treeNode.isDropTarget"
          [style.paddingLeft]="calculateIndent()"
          (mouseover)="onMouseOver($event)"
          (click)="onMouseClick($event)">
          <span class="tree__icon"
                [ngClass]="treeNode.getState()"
                (mousedown)="toggleExpand($event)"></span>
          <template [ngTemplateOutlet]="nodeTemplate" [ngOutletContext]="{ $implicit: treeNode }"></template>
      </div>
      <ul class="tree__nodes" *ngIf="treeNode.isExpanded">
        <tree-node *ngFor="let child of treeNode.children"
                  [treeNode]="child">
        </tree-node>
      </ul>
    `
})
export class TreeNodeComponent {
  @Input() treeNode: TreeNode;
  public elem: HTMLElement;
  private nodeTemplate: TemplateRef<ITreeNodeTemplate>;
  private hasHandle = false;

  constructor(
    private elementRef: ElementRef,
    private treeComponent: TreeComponent,
    private renderer: Renderer,
    private treeDragService: TreeDragService,
    private events: TreeEventsService) {
      this.elem = elementRef.nativeElement;
      this.nodeTemplate =  treeComponent.nodeTemplate;
  }

  registerHandle() {
    this.hasHandle = true;
  }

  onMouseOver(event: MouseEvent) {
    event.stopPropagation();
    if (this.treeDragService.getIsDragging()) {
      this.treeDragService.setTargetNode(this.treeNode, this.elem);
    }
  }

  onHandlePress(event: MouseEvent) {
    event.stopPropagation();
    this.selectNode(event);

    if (this.treeDragService.getIsDragging()) {
      this.treeDragService.setTargetNode(this.treeNode, this.elem);
    }

    let start = this.treeDragService.pointerEventToXY(event);

    let mouseMove = this.renderer.listenGlobal('document', 'mousemove', (event: MouseEvent) => {
      event.preventDefault();

      let threshold = 3;
      let pointer = this.treeDragService.pointerEventToXY(event);
      if (!this.treeDragService.getIsDragging()) {
        if (Math.abs(pointer.y - start.y) > threshold ||
            Math.abs(pointer.x - start.x) > threshold) {
          this.treeDragService.startDrag(this.treeNode);
        }
      } else {
        this.treeDragService.moveDrag(event);
      }
    });

    let mouseUp = this.renderer.listenGlobal('document', 'mouseup', (event: MouseEvent) => {
      mouseMove();
      mouseUp();
      if (this.treeDragService.getIsDragging()) {
        this.treeDragService.endDrag(event);
      }
    });
  }

  onMouseClick(event: MouseEvent) {
    event.stopPropagation();
    this.events.broadcast(TREE_EVENT.CLICK_NODE, {event: event, node: this.treeNode});
  }

  selectNode(event: MouseEvent) {
    event.preventDefault();
    if (event.metaKey) {
      this.events.broadcast(TREE_EVENT.ADD_SELECT_NODE, this.treeNode);
    } else if (event.shiftKey) {
      event.stopPropagation();
      this.events.broadcast(TREE_EVENT.RANGE_SELECT_NODE, this.treeNode);
    } else if (!this.treeNode.isSelected) {
      this.events.broadcast(TREE_EVENT.SELECT_NODE, this.treeNode);
    }
  }

  toggleExpand(event: MouseEvent) {
    if (this.treeNode.isExpanded) {
      this.events.broadcast(TREE_EVENT.COLLAPSE_NODE, this.treeNode);
    } else {
      this.events.broadcast(TREE_EVENT.EXPAND_NODE, this.treeNode);
    }
  }

  calculateIndent() {
    return (this.treeNode.getDepth() * this.treeComponent.options.indentSize + 5) + 'px';
  }
}
