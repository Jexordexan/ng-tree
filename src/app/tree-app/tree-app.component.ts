import { Component, OnInit, ViewChild, enableProdMode } from '@angular/core';
import { Observable } from 'rxjs';

import { LocationService } from './location.service';
import { TreeEventsService, TREE_EVENT, TreeConvertService,
         TreeComponent, TreeNode, Tree, FilterMap, DragInfo } from '../tree';
enableProdMode();

@Component({
    selector: 'my-app',
    template: `
    <input name="treeFilter" #treeFilter (input)="filterTree(treeFilter.value)" type="text" />
    <tree [tree]="tree" [options]="treeOptions">
      <template #nodeTemplate let-node>
        <span>{{node.data.name}}</span><small *ngIf="node.isLoadingChildren">Loading</small>
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
  public filter: FilterMap;
  public treeOptions = {
    allowDrag: true,
    allowDrop: true,
    indentSize: 20
  }
  constructor (
    private locationService: LocationService,
    private treeConvertService: TreeConvertService,
    private treeEvents: TreeEventsService) {}
    public getChildrenData: (node: TreeNode) => Observable<any>;
  ngOnInit() {
    let dir$ = this.locationService.readDirectory('.').toArray();

    this.getChildrenData = (node: TreeNode) => {
      let path = node.id.toString();
      return this.locationService.readDirectory(path);
    }

    dir$.subscribe(
      result => {
        this.rawData = result;
        this.tree = this.treeConvertService.makeAsyncTree(result, this.getChildrenData, 'path');
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
          console.log('rejected');
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
    this.tree = this.treeConvertService.makeAsyncTree(this.rawData, this.getChildrenData, 'path');
  }

  filterTree(val) {
    if (val) {
      this.treeComponent.filterTree(node => {
        return node.data.name.indexOf(val) > -1;
      });
    } else {
      this.treeComponent.clearFilter();
    }
  }
}
