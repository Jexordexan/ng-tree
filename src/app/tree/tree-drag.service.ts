import { Injectable, Renderer } from '@angular/core'
import { Subject }    from 'rxjs/rx';

import { TreeEventsService, TREE_EVENT } from './tree-events.service';
import { DropTarget } from './drop-target';
import { TreeNode } from './node';
import { Tree } from './tree';

export class DragInfo {
  private accept = true;
  private locked = false;

  event: MouseEvent
  node: TreeNode
  selectedNodes: TreeNode[]
  target: DropTarget
  parent: TreeNode
  placeBefore: boolean
  placeInside: boolean

  constructor(_event: MouseEvent, _node: TreeNode, _target: DropTarget, _targetElement: HTMLElement, dragService: TreeDragService) {
    this.event = _event
    this.node = _node
    this.target = _target

    if (_target instanceof TreeNode) {
      this.parent = _target.parentNode
    } else {
      this.parent = null
    }

    let parentElement = _targetElement.parentElement;
    let targetRect = _targetElement.getBoundingClientRect();
    let pointer = dragService.pointerEventToXY(_event);
    if (_node === null) {
      this.placeInside = true;
      this.placeBefore = false;
    } else {
      this.placeInside = pointer.y > (targetRect.top + (targetRect.height / 4)) &&
                         pointer.y < (targetRect.bottom - (targetRect.height / 4));
      this.placeBefore = pointer.y < (targetRect.top + targetRect.bottom) / 2;
    }
  }
  reject() {
    if (this.locked) {
      console.warn('A drag event cannot be rejected after it is locked.');
    } else {
      this.accept = false;
    }
  }
  lock() {
    this.locked = true;
  }
  isValid() {
    return this.accept;
  }
}

@Injectable()
export class TreeDragService {
  private isDragging = false;
  private threshold = 5;
  private moves = 0;
  private currentNode: TreeNode;
  private targetNode: DropTarget;
  private dropTarget: DropTarget;
  private targetElement: HTMLElement;
  private placeholderElement: HTMLElement = null;

  constructor(private events: TreeEventsService) {}

  startDrag(node: TreeNode) {
    this.currentNode = node;
    this.targetNode = node;
    this.isDragging = true;
    this.events.broadcast(TREE_EVENT.DRAG_START, true);
  }
  // Service message EVENTS
  moveDrag(event: MouseEvent) {
    if (this.isDragging) {
      let node = this.currentNode
      let target = this.targetNode
      let element = this.targetElement

      if (!element || !node || !target) {
        return;
      }

      let parentElement = element.parentElement
      let dragEvent = new DragInfo(event, node, target, element, this);
      this.events.broadcast(TREE_EVENT.DRAG_MOVE, dragEvent);

      if (this.dropTarget) {
        this.dropTarget.target(false);
      }

      if (!dragEvent.isValid()) {
        this.deletePlaceholder();
        return;
      }

      if (!this.placeholderElement) {
        this.createPlaceholder();
      }

      if (target instanceof Tree) {
        this.deletePlaceholder();
        this.dropTarget = target;
        this.dropTarget.target(true);
        return;
      }

      if (dragEvent.placeInside) {
        this.deletePlaceholder();
        this.dropTarget = target;
        this.dropTarget.target(true);
      } else if (dragEvent.placeBefore) {
        // Put the placeholder before the target element
        parentElement.insertBefore(this.placeholderElement, element);
      } else {
        let nextElement = element.nextSibling;
        if (nextElement) {
           // Put the placeholder after target element (before the next sibling)
          parentElement.insertBefore(this.placeholderElement, nextElement);
        } else {
          // Put the placeholder at the end of the parent
          parentElement.appendChild(this.placeholderElement);
        }
      }
    }
  }
  endDrag(event: MouseEvent) {
    if (this.isDragging) {
      this.deletePlaceholder();

      let node = this.currentNode
      let target = this.targetNode
      let element = this.targetElement

      if (!element || !node || !target) {
        return;
      }

      let dragEndEvent = new DragInfo(event, node, target, element, this);
      this.events.broadcast(TREE_EVENT.DRAG_END, dragEndEvent);

      if (dragEndEvent.isValid()) {
        dragEndEvent.lock();
        this.events.broadcast(TREE_EVENT.DROP, dragEndEvent);
      }

      if (this.dropTarget) {
        this.dropTarget.target(false);
        this.dropTarget = null;
      }
      this.currentNode = null;
      this.targetNode = null;
      this.targetElement = null;
      this.isDragging = false;
    }
  }
  setTargetNode(node: DropTarget, target: HTMLElement) {
    this.targetNode = node;
    this.targetElement = target;
  }
  deletePlaceholder() {
    if (this.placeholderElement) {
      if (this.placeholderElement.parentNode) {
        this.placeholderElement.parentNode.removeChild(this.placeholderElement);
      }
      this.placeholderElement = null;
    }
  }
  createPlaceholder() {
    let placeholder = document.createElement('div');
    placeholder.style.height = '0';
    placeholder.style.width = '100%';
    placeholder.style.outline = '1px solid #29F';
    this.placeholderElement = placeholder;
  }
  pointerEventToXY (e: any): {x: number, y: number} {
    var out = {x:0, y:0};
    if(e.type == 'touchstart' || e.type == 'touchmove' || e.type == 'touchend' || e.type == 'touchcancel'){
      var touch = e.touches[0] || e.changedTouches[0];
      out.x = touch.pageX;
      out.y = touch.pageY;
    } else if (e.type == 'mousedown' || e.type == 'mouseup' || e.type == 'mousemove' || e.type == 'mouseover'|| e.type=='mouseout' || e.type=='mouseenter' || e.type=='mouseleave') {
      out.x = e.pageX;
      out.y = e.pageY;
    }
    return out;
  }
  getCurrentNode() {
    return this.currentNode;
  }
  getTargetNode() {
    return this.targetNode;
  }
  getTargetElement() {
    return this.targetElement;
  }
  getIsDragging() {
    return this.isDragging;
  }
}
