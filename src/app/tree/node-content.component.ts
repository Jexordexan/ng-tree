import { Component, Input, TemplateRef } from '@angular/core';
import { TreeNode } from './node';

export interface ITreeNodeTemplate {
  node: TreeNode;
  context: any;
}

@Component({
  selector: 'TreeNodeContent',
  template: `<template [ngTemplateOutlet]="treeNodeContentTemplate" [ngOutletContext]="{ node: node }"></template>`,
})
export class TreeNodeContent {
  @Input() node: TreeNode;
  @Input() nodeTemplate: TemplateRef<ITreeNodeTemplate>;
}
