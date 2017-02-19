import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TreeNode }   from './node';
import { Tree }       from './tree';

@Injectable()
export class TreeConvertService {
  public makeTreeFromArray(listData: Array<any>,
    parentKey='parentId',
    primaryKey='id'):  Tree {

    let data = listData.map(node => new TreeNode(node, node[primaryKey]));
    let tree: TreeNode[] = [];
    let rootIds: number[] = [];
    let treeObjs = {};
    let parent: TreeNode;
    data.forEach(node => { treeObjs[node.id] = node; });
    data.forEach(node => {
       let primary = node.data[primaryKey];
       let parentId = node.data[parentKey];
       treeObjs[primary] = node;
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
    return new Tree(tree);
  }

  public makeTreeFromTree(treeData: Array<any>,
    parent=null,
    childKey='children',
    primaryKey='id'): Tree {

    return new Tree(this.traverseChildren(treeData));
  }

  public makeAsyncTree(rootData: Array<any>,
    childFactory: (TreeNode) => Observable<any>,
    primaryKey='id',
    loadDepth=1): Tree {

    let root: TreeNode[] = [];
    rootData.forEach(node => {
      let treeNode = new TreeNode(node, node[primaryKey])
      treeNode.isAsync = true
      root.push(treeNode);
    });

    let tree = new Tree(root);
    tree.loadDepth = loadDepth;
    tree.fetchChildren = (treeNode) => {
      return childFactory(treeNode).map(child => {
        let childNode = new TreeNode(child, child[primaryKey], treeNode)
        childNode.isAsync = true
        return childNode
      })
    }

    tree.forEach(tree.loadChildrenAsync.bind(tree))

    return tree;
  }

  private traverseChildren(treeData: Array<any>,
    parent=null,
    childKey='children',
    primaryKey='id'): TreeNode[] {

    let root: TreeNode[] = [];
    treeData.forEach(node => {
      let children = node[childKey];
      if (!children) {
        root.push(new TreeNode(node, node[primaryKey], parent));
        return;
      }

      if (children instanceof Array) {
        delete node[childKey];
        let treeNode = new TreeNode(node, node[primaryKey], parent);
        treeNode.children = this.traverseChildren(children, node, childKey, primaryKey);
        root.push(treeNode);
      }
    });
    return root;
  }
}
