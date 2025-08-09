import React, { useState } from 'react';
import { useEditor, useSelection } from '../state/store';
import RuleEditorModal from './RuleEditorModal';

const TABS = ['manage', 'node', 'edge', 'rules'] as const;
type Tab = typeof TABS[number];

export default function Inspector() {
  const ws = useEditor((s) => s.ws);
  const selectedNodeId = useSelection((s) => s.selectedNodeId);
  const selectedEdgeId = useSelection((s) => s.selectedEdgeId);
  const [tab, setTab] = useState<Tab>('manage');

  if (!ws) return <div className="content minihelp">Create a workspace to begin.</div>;

  return (
    <div className="inspector modern">
      <h3 className="inspector-title">Inspector</h3>
      {/* Tabs */}
      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <div
            key={t}
            className={`tab ${tab === t ? 'active' : ''}`}
            role="tab"
            tabIndex={0}
            onClick={() => setTab(t)}
            onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </div>
        ))}
      </div>
      {/* Tab Content */}
      <div className="content">
        {tab === 'manage' && <ManageTab />}
        {tab === 'node' && <NodeTab nodeId={selectedNodeId} />}
        {tab === 'edge' && <EdgeTab edgeId={selectedEdgeId} />}
        {tab === 'rules' && <RulesTab />}
      </div>
    </div>
  );
}

function ManageTab() {
  const { ws, addQuestion } = useEditor();
  const [qDraft, setQDraft] = useState<{ name:string; prompt:string; type:'YesNo'|'SingleSelect'|'MultiSelect'|'FreeText' }>({ name: '', prompt: '', type: 'YesNo' });

  const saveQuestion = () => {
    if (!qDraft.name || !qDraft.prompt) {
      alert('Name & prompt required');
      return;
    }
    addQuestion({
      name: qDraft.name,
      prompt: qDraft.prompt,
      type: qDraft.type,
    });
    setQDraft({ name: '', prompt: '', type: 'YesNo' });
  };

  return (
    <div className="manage-tab">
      <h4>Create Question</h4>
      <label>
        Name
        <input
          value={qDraft.name}
          onChange={(e) => setQDraft((d) => ({ ...d, name: e.target.value }))}
        />
      </label>
      <label>
        Prompt
        <input
          value={qDraft.prompt}
          onChange={(e) => setQDraft((d) => ({ ...d, prompt: e.target.value }))}
        />
      </label>
      <label>
        Type
        <select
          value={qDraft.type}
          onChange={(e) => setQDraft((d) => ({ ...d, type: e.target.value as 'YesNo'|'SingleSelect'|'MultiSelect'|'FreeText' }))}
        >
          <option>YesNo</option>
          <option>SingleSelect</option>
          <option>MultiSelect</option>
          <option>FreeText</option>
        </select>
      </label>
      <button className="btn primary" onClick={saveQuestion}>Save Question</button>
    </div>
  );
}

function NodeTab({ nodeId }: { nodeId: string | null }) {
  const { ws, updateNode } = useEditor();
  if (!ws || !nodeId) return <div className="minihelp">Select a node.</div>;
  const node = ws.nodes.find((n) => n.id === nodeId);
  if (!node) return <div>No node selected.</div>;

  const setShape = (shape: 'rect' | 'pill') => {
    updateNode({ id: node.id, meta: { ...node.meta, shape } });
  };

  return (
    <div className="node-tab">
      <h4>Node Properties</h4>
      <label>
        Shape
        <select
          value={node.meta?.shape || 'rect'}
          onChange={(e) => setShape(e.target.value as 'rect' | 'pill')}
        >
          <option value="rect">Rectangle</option>
          <option value="pill">Pill</option>
        </select>
      </label>
      <label>
        Color
        <select
          value={node.meta?.color || ''}
          onChange={(e) => updateNode({ id: node.id, meta: { ...node.meta, color: e.target.value } })}
        >
          <option value="">Default</option>
          <option value="teal">Teal</option>
          <option value="blue">Blue</option>
        </select>
      </label>
    </div>
  );
}

function EdgeTab({ edgeId }: { edgeId: string | null }) {
  const { ws, updateEdge, setEdgeConditions } = useEditor();
  if (!ws || !edgeId) return <div className="minihelp">Select an edge.</div>;
  const edge = ws.edges.find((e) => e.id === edgeId);
  if (!edge) return <div>No edge selected.</div>;

  return (
    <div className="edge-tab">
      <h4>Edge Properties</h4>
      <label>
        Label
        <input
          value={edge.label || ''}
          onChange={(e) => updateEdge({ id: edge.id, label: e.target.value })}
        />
      </label>
      <EdgeConditionsEditor edge={edge} onChange={(conds)=> setEdgeConditions(edge.id, conds)} />
    </div>
  );
}

function EdgeConditionsEditor({ edge, onChange }:{ edge:any; onChange:(c:any[])=>void }){
  const { ws } = useEditor()
  const conds = edge.edgeConditions||[]
  const [local, setLocal] = useState<any[]>(conds)
  const addCond = ()=>{ setLocal([...local, { questionId:'', comparator:'eq', value:'' }]) }
  const update = (i:number, patch:any)=>{ setLocal(local.map((c,idx)=> idx===i? {...c, ...patch}: c)) }
  const remove = (i:number)=>{ setLocal(local.filter((_,idx)=>idx!==i)) }
  return (
    <div className="conds-editor">
      <h5>Conditions (AND)</h5>
      {local.map((c,i)=>(
        <div key={i} className="row align-end">
          <select title="Question" value={c.questionId} onChange={e=>update(i,{questionId:e.target.value})}>
            <option value="">Question…</option>
            {ws?.questions.map(q=> <option key={q.id} value={q.id}>{q.name}</option>)}
          </select>
          <select title="Comparator" value={c.comparator} onChange={e=>update(i,{comparator:e.target.value})}>
            <option value="eq">=</option><option value="neq">≠</option><option value="gt">&gt;</option><option value="lt">&lt;</option>
            <option value="contains">contains</option><option value="isEmpty">isEmpty</option><option value="isNotEmpty">notEmpty</option>
          </select>
          {!(c.comparator==='isEmpty'||c.comparator==='isNotEmpty') && (
            <input placeholder="Value" value={c.value||''} onChange={e=>update(i,{value:e.target.value})} />
          )}
          <button onClick={()=>remove(i)} title="Remove">✕</button>
        </div>
      ))}
      <div className="row">
        <button onClick={addCond}>+ Condition</button>
        <button onClick={()=>onChange(local)} disabled={local===conds}>Apply</button>
      </div>
    </div>
  )
}

function RulesTab(){
  const { ws, addRule, deleteRule, moveRuleToFolder } = useEditor()
  const highlightRuleId = useSelection(s=>s.highlightRuleId)
  const setHighlightRule = useSelection(s=>s.setHighlightRule)
  const [draft, setDraft] = useState({ visitTypeId:'', questionId:'', comparator:'eq', value:'', action:'SetVisitType', folderId:'' })
  const [folderFilter, setFolderFilter] = useState<string>('')
  const [editRuleId, setEditRuleId] = useState<string | null>(null);
  if(!ws) return null
  const folders = (ws.folders||[]).filter(f=>f.kind==='rule')
  const add = ()=>{
    if(!draft.visitTypeId && draft.action==='SetVisitType') return alert('VisitType required')
    const ruleId = addRule({ all: draft.questionId? [{ questionId:draft.questionId, comparator:draft.comparator as any, value:draft.value }]:[], action:{ type:'SetVisitType', visitTypeId:draft.visitTypeId }, folderId: draft.folderId || undefined })
    setDraft({ visitTypeId:'', questionId:'', comparator:'eq', value:'', action:'SetVisitType', folderId:draft.folderId })
    if(ruleId && draft.folderId) moveRuleToFolder(ruleId, draft.folderId)
  }
  const visibleRules = ws.rules.filter(r=> folderFilter? r.folderId===folderFilter : true)
  return (
    <div className="rules-tab">
      <h4>Rules</h4>
      <div className="row">
        <select title="Filter by folder" value={folderFilter} onChange={e=>setFolderFilter(e.target.value)}>
          <option value="">All Folders</option>
          {folders.map(f=> <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
        <button onClick={()=>{ const name = prompt('New Rule Folder name?'); if(!name) return; useEditor.getState().addFolder({ name, kind:'rule' }) }}>+ Folder</button>
      </div>
      <div className="minihelp">Set visit type when condition matches.</div>
      <div className="row">
        <select title="Question" value={draft.questionId} onChange={e=>setDraft(d=>({...d,questionId:e.target.value}))}>
          <option value="">Question…</option>
          {ws.questions.map(q=> <option key={q.id} value={q.id}>{q.name}</option>)}
        </select>
        <select title="Comparator" value={draft.comparator} onChange={e=>setDraft(d=>({...d,comparator:e.target.value}))}>
          <option value="eq">=</option><option value="neq">≠</option><option value="gt">&gt;</option><option value="lt">&lt;</option><option value="gte">≥</option><option value="lte">≤</option><option value="contains">contains</option><option value="in">in</option><option value="notin">not in</option><option value="isEmpty">isEmpty</option><option value="isNotEmpty">isNotEmpty</option>
        </select>
        {!(draft.comparator==='isEmpty'||draft.comparator==='isNotEmpty') && (
          <input placeholder={draft.comparator==='in'||draft.comparator==='notin'? 'Comma values':'Value'} value={draft.value} onChange={e=>setDraft(d=>({...d,value:e.target.value}))} />
        )}
      </div>
      <div className="row">
        <select title="Visit Type" value={draft.visitTypeId} onChange={e=>setDraft(d=>({...d,visitTypeId:e.target.value}))}>
          <option value="">VisitType…</option>
          {ws.visitTypes.map(v=> <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
        <select title="Assign Folder" value={draft.folderId} onChange={e=>setDraft(d=>({...d, folderId:e.target.value}))}>
          <option value="">(no folder)</option>
          {folders.map(f=> <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
        <button onClick={add}>Add Rule</button>
      </div>
      <div className="rule-list">
        {visibleRules.map(r=> (
          <div key={r.id} className={`logic-cond ${highlightRuleId===r.id? 'active-rule':''}`} onMouseEnter={()=> setHighlightRule(r.id)} onMouseLeave={()=> setHighlightRule(null)} onClick={()=> setEditRuleId(r.id)}>
            <div>{(r.all||[]).map(c=>`${ws.questions.find(q=>q.id===c.questionId)?.name||c.questionId} ${c.comparator} ${c.value}`).join(' AND ')||'(no conditions)'} → {r.action.type==='SetVisitType' ? ws.visitTypes.find(v=>v.id===(r.action as any).visitTypeId)?.name : r.action.type}</div>
            <button onClick={()=>deleteRule(r.id)}>✕</button>
          </div>
        ))}
      </div>
      {editRuleId && <RuleEditorModal ruleId={editRuleId} onClose={()=>setEditRuleId(null)} />}
    </div>
  )
}

function AITab() { return null }