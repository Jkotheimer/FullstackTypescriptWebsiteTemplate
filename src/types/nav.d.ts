export interface NavNode {
    id: string;
    name: string;
    label: string;
    description: string;
    icon: string;
    path: string;
    parent: string;
    type: 'd' | 'f';
}

export interface DirectoryNode extends NavNode {
    nodes: Array<NavNode>;
}

export interface FileNode extends NavNode {
    content?: string;
    encoding?: string;
}
