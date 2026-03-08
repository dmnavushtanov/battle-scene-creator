import React, { useState } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { Users, Plus, Minus } from 'lucide-react';

const GroupSection: React.FC<{ selectedIds: string[] }> = ({ selectedIds }) => {
  const [groupName, setGroupName] = useState('');
  const createGroup = useEditorStore((s) => s.createGroup);
  const deleteGroup = useEditorStore((s) => s.deleteGroup);
  const selectGroup = useEditorStore((s) => s.selectGroup);
  const removeFromGroup = useEditorStore((s) => s.removeFromGroup);
  const addToGroup = useEditorStore((s) => s.addToGroup);
  const getGroupForObject = useEditorStore((s) => s.getGroupForObject);
  const setSelectedIds = useEditorStore((s) => s.setSelectedIds);
  const activeScene = useEditorStore((s) => {
    const scene = s.project.scenes.find((sc) => sc.id === s.activeSceneId);
    return scene || s.project.scenes[0];
  });

  const groups = activeScene.groups || {};
  const existingGroup = selectedIds.length === 1 ? getGroupForObject(selectedIds[0]) : null;

  const allInSameGroup = selectedIds.length > 1 && (() => {
    const g = getGroupForObject(selectedIds[0]);
    if (!g) return false;
    return selectedIds.every((id) => g.memberIds.includes(id));
  })();
  const sameGroup = allInSameGroup ? getGroupForObject(selectedIds[0]) : null;

  const handleCreateGroup = () => {
    const name = groupName.trim() || `Group ${Object.keys(groups).length + 1}`;
    createGroup(name, selectedIds);
    setGroupName('');
  };

  const getObjectLabel = (objId: string) => {
    const obj = activeScene.objectsById[objId];
    if (!obj) return objId.slice(0, 6);
    return obj.label || obj.unitType || obj.type;
  };

  return (
    <div className="pt-2 border-t border-border space-y-2">
      <label className="text-[9px] font-mono uppercase text-muted-foreground flex items-center gap-1">
        <Users size={10} /> Groups
      </label>

      {existingGroup && (
        <div className="p-2 bg-muted/50 rounded border border-border space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: existingGroup.color }} />
            <span className="text-[10px] font-mono font-semibold text-foreground">{existingGroup.name}</span>
            <span className="text-[8px] font-mono text-muted-foreground">{existingGroup.memberIds.length} members</span>
          </div>
          <div className="space-y-0.5">
            <span className="text-[8px] font-mono text-muted-foreground uppercase">Members:</span>
            {existingGroup.memberIds.map((mid) => (
              <div key={mid} className="flex items-center gap-1.5 pl-1">
                <span className={`text-[9px] font-mono ${mid === selectedIds[0] ? 'text-primary font-bold' : 'text-foreground'}`}>
                  {getObjectLabel(mid)}
                </span>
                <button onClick={() => setSelectedIds([mid])} className="text-[8px] font-mono text-muted-foreground hover:text-primary transition-colors" title="Select this unit">◎</button>
                <button onClick={() => removeFromGroup(existingGroup.id, [mid])} className="text-[8px] text-destructive/60 hover:text-destructive transition-colors ml-auto" title="Remove from group"><Minus size={8} /></button>
              </div>
            ))}
          </div>
          <div className="flex gap-1.5">
            <button onClick={() => selectGroup(existingGroup.id)} className="flex-1 py-1 text-[9px] font-mono uppercase bg-primary/10 text-primary border border-primary/30 rounded hover:bg-primary/20 transition-colors">Select All</button>
            <button onClick={() => deleteGroup(existingGroup.id)} className="flex-1 py-1 text-[9px] font-mono uppercase bg-destructive/10 text-destructive border border-destructive/30 rounded hover:bg-destructive/20 transition-colors">Ungroup</button>
          </div>
        </div>
      )}

      {sameGroup && (
        <div className="p-2 bg-muted/50 rounded border border-border space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sameGroup.color }} />
            <span className="text-[10px] font-mono font-semibold text-foreground">{sameGroup.name}</span>
          </div>
          <div className="flex gap-1.5">
            <button onClick={() => selectGroup(sameGroup.id)} className="flex-1 py-1 text-[9px] font-mono uppercase bg-primary/10 text-primary border border-primary/30 rounded hover:bg-primary/20 transition-colors">Select All</button>
            <button onClick={() => deleteGroup(sameGroup.id)} className="flex-1 py-1 text-[9px] font-mono uppercase bg-destructive/10 text-destructive border border-destructive/30 rounded hover:bg-destructive/20 transition-colors">Ungroup</button>
          </div>
        </div>
      )}

      {selectedIds.length > 1 && !allInSameGroup && (
        <div className="space-y-1.5">
          <div className="flex gap-1.5">
            <input type="text" value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Group name..."
              className="flex-1 bg-muted border border-border rounded px-2 py-1 text-[10px] font-mono text-foreground" />
            <button onClick={handleCreateGroup} className="px-3 py-1 text-[9px] font-mono uppercase bg-primary/20 text-primary border border-primary/30 rounded hover:bg-primary/30 transition-colors">Create</button>
          </div>
          {Object.keys(groups).length > 0 && (
            <div className="space-y-1">
              <span className="text-[8px] font-mono text-muted-foreground">Or add to existing:</span>
              {Object.values(groups).map((g) => (
                <button key={g.id} onClick={() => addToGroup(g.id, selectedIds)}
                  className="w-full flex items-center gap-2 p-1.5 text-[9px] font-mono bg-muted/30 border border-border rounded hover:bg-muted/60 transition-colors">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: g.color }} />
                  <span className="text-foreground">{g.name}</span>
                  <Plus size={8} className="ml-auto text-muted-foreground" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedIds.length <= 1 && !existingGroup && Object.keys(groups).length > 0 && (
        <div className="space-y-1">
          {Object.values(groups).map((g) => (
            <button key={g.id} onClick={() => selectGroup(g.id)}
              className="w-full flex items-center gap-2 p-1.5 text-[9px] font-mono bg-muted/30 border border-border rounded hover:bg-muted/60 transition-colors">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: g.color }} />
              <span className="text-foreground">{g.name}</span>
              <span className="text-muted-foreground ml-auto">{g.memberIds.length}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default GroupSection;
