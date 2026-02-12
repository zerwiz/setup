import { useState } from 'react';
import type { DriveItem } from '../api';

type TreeNode = {
  path: string;
  name: string;
  isDir: boolean;
  children: TreeNode[];
};

function buildTree(items: DriveItem[]): TreeNode[] {
  const byPath = new Map<string, { isDir: boolean }>();
  for (const item of items) {
    byPath.set(item.path, { isDir: item.display.trimEnd().endsWith('/') });
  }

  const nodes = new Map<string, TreeNode>();

  for (const item of items) {
    const parts = item.path.split('/').filter(Boolean);
    const isDir = byPath.get(item.path)?.isDir ?? false;
    let parentPath = '';

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const path = parentPath ? `${parentPath}/${part}` : part;
      const isLast = i === parts.length - 1;

      if (!nodes.has(path)) {
        const parent = parentPath ? nodes.get(parentPath) : undefined;
        const node: TreeNode = {
          path,
          name: part,
          isDir: isLast ? isDir : true,
          children: [],
        };
        nodes.set(path, node);
        if (parent) parent.children.push(node);
      } else if (isLast) {
        nodes.get(path)!.isDir = isDir;
      }
      parentPath = path;
    }
  }

  const rootPaths = [...new Set(items.map((i) => i.path.split('/')[0]).filter(Boolean))];
  return rootPaths
    .map((p) => nodes.get(p))
    .filter((n): n is TreeNode => n != null)
    .sort((a, b) =>
      [a.isDir ? 0 : 1, a.name].join('\0').localeCompare([b.isDir ? 0 : 1, b.name].join('\0'))
    );
}

type Props = {
  items: DriveItem[];
  selectedPaths: Set<string>;
  onToggleSelect: (path: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onDelete: (item: DriveItem) => void;
  onDeleteSelected: (paths: string[]) => void;
  loading: boolean;
};

function TreeNodeRow({
  node,
  depth,
  selectedPaths,
  onToggleSelect,
  onDelete,
  loading,
}: {
  node: TreeNode;
  depth: number;
  selectedPaths: Set<string>;
  onToggleSelect: (path: string) => void;
  onDelete: (item: DriveItem) => void;
  loading: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const displayName = node.isDir ? `${node.name}/` : node.name;
  const isSelected = selectedPaths.has(node.path);

  return (
    <div className="select-none">
      <div
        className="group flex items-center gap-1 py-1 px-1 -mx-1 rounded hover:bg-whynot-border/20 min-h-[28px]"
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            onToggleSelect(node.path);
          }}
          onClick={(e) => e.stopPropagation()}
          className="shrink-0 rounded border-whynot-border"
          title="Select for bulk delete"
        />
        <button
          type="button"
          onClick={() => node.isDir && setExpanded((e) => !e)}
          className="flex items-center gap-1.5 flex-1 min-w-0 text-left"
        >
          {node.isDir ? (
            <span className="text-whynot-muted w-4 shrink-0">
              {expanded ? '▾' : '▸'}
            </span>
          ) : (
            <span className="w-4 shrink-0" />
          )}
          <span className="text-sm text-whynot-body font-mono truncate">
            {displayName}
          </span>
        </button>
        <button
          type="button"
          onClick={() => onDelete({ path: node.path, display: displayName })}
          disabled={loading}
          className="shrink-0 px-2 py-0.5 rounded text-xs text-red-400/70 hover:text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
          title={`Delete ${node.path}`}
        >
          Delete
        </button>
      </div>
      {node.isDir && expanded && (
        <div>
          {[...node.children]
            .sort((a, b) =>
              [a.isDir ? 0 : 1, a.name].join('\0').localeCompare([b.isDir ? 0 : 1, b.name].join('\0'))
            )
            .map((child) => (
              <TreeNodeRow
                key={child.path}
                node={child}
                depth={depth + 1}
                selectedPaths={selectedPaths}
                onToggleSelect={onToggleSelect}
                onDelete={onDelete}
                loading={loading}
              />
            ))}
        </div>
      )}
    </div>
  );
}

export default function DriveExplorer({
  items,
  selectedPaths,
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
  onDelete,
  onDeleteSelected,
  loading,
}: Props) {
  const tree = buildTree(items);
  const selectedCount = selectedPaths.size;

  if (tree.length === 0) {
    return (
      <p className="text-sm text-whynot-muted font-mono py-4">(empty)</p>
    );
  }

  return (
    <div className="font-mono text-sm">
      <div className="flex flex-wrap gap-2 mb-2 pb-2 border-b border-whynot-border/50">
        <button
          type="button"
          onClick={onSelectAll}
          className="text-xs text-whynot-muted hover:text-whynot-body"
        >
          Select all
        </button>
        <button
          type="button"
          onClick={onDeselectAll}
          className="text-xs text-whynot-muted hover:text-whynot-body"
        >
          Deselect all
        </button>
        {selectedCount > 0 && (
          <button
            type="button"
            onClick={() => onDeleteSelected([...selectedPaths])}
            disabled={loading}
            className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
          >
            Delete selected ({selectedCount})
          </button>
        )}
      </div>
      {tree.map((node) => (
        <TreeNodeRow
          key={node.path}
          node={node}
          depth={0}
          selectedPaths={selectedPaths}
          onToggleSelect={onToggleSelect}
          onDelete={onDelete}
          loading={loading}
        />
      ))}
    </div>
  );
}
