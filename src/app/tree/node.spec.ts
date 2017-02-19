import { TreeNode } from './node';

describe('Tree Node', () => {
  let node: TreeNode
  let location = {
    id: 1,
    Name: 'United States of America'
  }

  beforeEach( () => {
    node = new TreeNode(location, location.id);
  })

  it('has name', () => {
    expect(node.data.Name).toEqual('United States of America');
    expect(node.id).toEqual(1);
  });

  it('toggles expanded property', () => {
    expect(node.isExpanded).toBe(false);
    node.toggle();
    expect(node.isExpanded).toBe(true);
  })

  it('toggles selected property', () => {
    expect(node.isSelected).toBe(false);
    node.select();
    expect(node.isSelected).toBe(true);
  })
});
