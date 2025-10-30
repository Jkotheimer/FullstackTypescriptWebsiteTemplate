import { NavNode, DirectoryNode } from 'types/nav';

export default class NavUtils {
    public static findNode(id: string, nodes: Array<NavNode>): NavNode | null {
        const getNodeRecursive = (_nodes: Array<NavNode> = []): NavNode | null => {
            for (const node of _nodes) {
                if (node.id === id) {
                    return node;
                }
                if (node.type === 'd') {
                    const childNode = getNodeRecursive((node as DirectoryNode).nodes);
                    if (childNode) {
                        return childNode;
                    }
                }
            }
            return null;
        };
        return getNodeRecursive(nodes);
    }
}
