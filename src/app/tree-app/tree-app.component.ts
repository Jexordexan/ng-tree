import { Component, OnInit, ViewChild, enableProdMode} from '@angular/core';

import { LocationService } from './location.service';
import { DragInfo } from '../tree/tree-drag.service';
import { TreeEventsService, TREE_EVENT, TreeConvertService, TreeComponent, TreeNode } from '../tree';
// enableProdMode();

@Component({
    selector: 'my-app',
    template: `
    <input name="treeFilter" #treeFilter (keyup)="0" type="text" />
    <tree [treeData]="treeData" [options]="treeOptions" [filter]="treeFilter.value">
      <template #nodeTemplate let-node>
        <h3 class="initials">{{node.data.Name[0]}}</h3><span>{{node.data.Name}} <small>{{node.data.id}}</small></span>
      </template>
    </tree>
    <button (click)="reloadData()">Reload data</button>
    <h3>Anchor</h3>
      <div *ngIf="tree.getAnchorNode()">{{tree.getAnchorNode().data.Name}}</div>
    <h3>Selected</h3>
    <!-- <tree-root [treeData]="tree.getSelectedNodes()"></tree-root> -->
      <li *ngFor="let node of tree.getSelectedNodes()">{{node.data.Name}}</li>
    <h3>Expanded</h3>
    <ul>
      <li *ngFor="let node of tree.getExpandedNodes()">{{node.data.Name}}</li>
    </ul>
    `,
    providers: [ LocationService ]
})
export class TreeAppComponent implements OnInit {
  @ViewChild(TreeComponent)
  private tree: TreeComponent;

  private rawData: any;
  private treeData: TreeNode[];
  private filter: '';
  private treeOptions = {
    allowDrag: true,
    allowDrop: true,
    indentSize: 40
  }
  constructor (
    private locationService: LocationService,
    private treeConvertService: TreeConvertService,
    private treeEvents: TreeEventsService) {}
  ngOnInit() {
    let locationStream = this.locationService.getLocationObservable();

    locationStream.subscribe(data => {
      this.rawData = data;
      this.treeData = this.treeConvertService.makeTree(data);
    })

    this.treeEvents.listen(TREE_EVENT.DRAG_MOVE)
    .subscribe((drag: DragInfo)  => {
      let target = drag.target;
      let re = /es/;
      if (target instanceof TreeNode) {
        if (drag.placeInside && target.data.allowDrop === false) {
          drag.reject();
        }
      }
    });

    this.treeEvents.listen(TREE_EVENT.DRAG_END)
    .subscribe((drag: DragInfo)  => {
      let target = drag.target;
      let re = /es/;
      if (target instanceof TreeNode) {
        if (drag.placeInside && re.test(target.data.Name)) {
          drag.reject();
        }
      }
    });

    this.treeEvents.listen(TREE_EVENT.CLICK_NODE)
    .subscribe((click: {event: MouseEvent, node: TreeNode})  => {
      console.log(click.node.data);
    });
  };

  reloadData() {
    this.treeData = this.treeConvertService.makeTree(this.rawData);
  }
}
