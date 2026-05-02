import { ITreeAble } from '@common/interfaces/treeable.interface';

export class TreeStructure {
  private nodes: Set<ITreeAble>;

  constructor(entities: Array<ITreeAble>) {
    this.nodes = new Set(entities);
  }

  public getTrees(): Array<ITreeAble> {
    for (const item of this.nodes) {
      if (item.parentId == null) {
        this.getTree(item);
      }
    }

    return Array.from(this.nodes);
  }

  private getTree(root: ITreeAble): ITreeAble {
    root.childs = [];

    this.nodes.forEach((node) => {
      if (node.parentId == root.id) {
        root.childs.push(node);
        this.nodes.delete(node);
        this.getTree(node);
      }
    });

    return root;
  }

  public static getSubTree(
    targetId: string,
    nodes: Array<ITreeAble>,
  ): ITreeAble {
    for (const node of nodes) {
      if (node.id == targetId) {
        return node;
      }
      if (node.childs) {
        TreeStructure.getSubTree(targetId, node.childs);
      }
    }
  }

  public static getLeafs(tree: ITreeAble, leafs: Array<ITreeAble>) {
    if (!tree.childs || tree.childs.length == 0) {
      leafs.push(tree);
      return leafs;
    }

    for (const node of tree.childs) {
      if (!node.childs && node.childs.length == 0) {
        leafs.push(node);
      } else {
        TreeStructure.getLeafs(node, leafs);
      }
    }

    return leafs;
  }
}
