import { Component, OnInit, ViewChild, enableProdMode } from '@angular/core';
import { Observable } from 'rxjs';

import { LocationService } from './location.service';
import { DragInfo } from '../tree/tree-drag.service';
import { TreeEventsService, TREE_EVENT, TreeConvertService,
         TreeComponent, TreeNode, Tree } from '../tree';
// enableProdMode();

@Component({
    selector: 'my-app',
    template: `
    <input name="treeFilter" #treeFilter (keyup)="0" type="text" />
    <tree [tree]="tree" [options]="treeOptions" [filter]="treeFilter.value">
      <template #nodeTemplate let-node>
        <span>{{node.data.Name}}</span><small *ngIf="node.isLoadingChildren">Loading</small>
      </template>
    </tree>
    <button (click)="reloadData()">Reload data</button>
    <h3>Anchor</h3>
      <div *ngIf="treeComponent.getAnchorNode()">{{treeComponent.getAnchorNode().data.Name}}</div>
    <h3>Selected</h3>
      <li *ngFor="let node of treeComponent.getSelectedNodes()">{{node.data.Name}}</li>
    <h3>Expanded</h3>
    <ul>
      <li *ngFor="let node of treeComponent.getExpandedNodes()">{{node.data.Name}}</li>
    </ul>
    `,
    providers: [ LocationService ]
})
export class TreeAppComponent implements OnInit {
  @ViewChild(TreeComponent)
  public treeComponent: TreeComponent;

  public rawData: any;
  public tree: Tree;
  public treeOptions = {
    allowDrag: true,
    allowDrop: true,
    indentSize: 40
  }
  constructor (
    private locationService: LocationService,
    private treeConvertService: TreeConvertService,
    private treeEvents: TreeEventsService) {}
  ngOnInit() {
    // let locationStream = this.locationService.getLocationObservable();
    // locationStream.subscribe(data => {
    //   this.rawData = data;
    //   this.treeData = this.treeConvertService.makeTree(data);
    // })

    let dir$ = this.locationService.readDirectory('.')
      .map(item => ({ id: item, Name: item }))
      .toArray();

    dir$.subscribe(
      result => {
        this.rawData = result;
        this.tree = this.treeConvertService.makeAsyncTree(result, node => {
          var path = './';
          var parent = node.parentNode;
          var parents = [];
          while (parent) {
            parents.push(parent.id)
            parent = parent.parentNode;
          }
          parents.reverse().forEach(parent => path += parent + '/')
          path += node.id
          return this.locationService
            .readDirectory(path)
            .map(item => ({ id: item, Name: item }))
        });
      },
      err => {
        console.error(err);
      }
    );

    this.treeEvents.listen(TREE_EVENT.DRAG_MOVE)
    .merge(this.treeEvents.listen(TREE_EVENT.DRAG_END))
    .subscribe((drag: DragInfo)  => {
      let target = drag.target;
      let re = /es/;
      if (target instanceof TreeNode) {
        if (drag.placeInside && target.data.allowDrop === false) {
          drag.reject();
        }
      }
    });

    this.treeEvents.listen(TREE_EVENT.CLICK_NODE)
    .subscribe((click: {event: MouseEvent, node: TreeNode})  => {
      // console.log(click.node.data);
    });
  };

  reloadData() {
    this.tree = this.treeConvertService.makeTreeFromArray(this.rawData);
  }
}
