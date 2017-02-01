import { Directive, ElementRef, HostListener, Renderer } from '@angular/core';
import { TreeNodeComponent } from './tree-node.component'

@Directive({
  selector: '[treeHandle]'
})
export class TreeHandleDirective {
  constructor(el: ElementRef, renderer: Renderer, private node: TreeNodeComponent) {
    if (node) {
      node.registerHandle();
    } else {
      throw new Error('Tree Handle not a descendant of a Tree Node');
    }
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent) {
    this.node.onHandlePress(event);
  }
}
