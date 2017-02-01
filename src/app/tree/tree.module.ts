import { NgModule }      from '@angular/core';
import { CommonModule }      from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';

import { TreeComponent }  from './tree.component';
import { TreeNodeComponent }  from './tree-node.component';
import { TreeNodeContent }  from './node-content.component';

import { TreeHandleDirective }  from './tree-handle.directive';

import { TreeEventsService }  from './tree-events.service';
import { TreeDragService }  from './tree-drag.service';
import { TreeConvertService }  from './tree-convert.service';

import 'styles/tree.css';

@NgModule({
  imports: [
    BrowserModule
  ],
  declarations: [
    TreeComponent,
    TreeNodeComponent,
    TreeNodeContent,
    TreeHandleDirective
  ],
  exports: [
    TreeComponent
  ],
  providers: [
    TreeConvertService,
    TreeDragService,
    TreeEventsService
  ]
})
export class TreeModule { }
