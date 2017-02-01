import { Injectable } from '@angular/core';
import { TreeNode }       from './node';

@Injectable()
export class TreeConvertService {
  makeTree(listData: Array<any>, parentKey?: string, primaryKey?: string):  TreeNode[] {
    parentKey = parentKey || 'parentId';
    primaryKey = primaryKey || 'id';
    var data = listData.map(node => new TreeNode(node, node[primaryKey]));
    var tree: TreeNode[] = [];
    var rootIds: number[] = [];
    var treeObjs = {};
    var parent: TreeNode;
    data.forEach(node => { treeObjs[node.id] = node; });
    data.forEach(node => {
       let primary = node.data[primaryKey];
       let parentId = node.data[parentKey];
       treeObjs[primary] = node;
       node.root = tree;
       if (parentId) {
         parent = treeObjs[parentId];
         node.parentNode = parent;
         if (parent) {
           if (parent.children) {
             parent.children.push(node);
           } else {
             parent.children = [node];
           }
         }
       } else {
         rootIds.push(primary);
       }
    });

    let len = rootIds.length;
    for (var i = 0; i < len; i++) {
       tree.push(treeObjs[rootIds[i]]);
    }
    return tree;
  }
}
