import React, { useState } from 'react'
import { useEditor, useSelection } from '../state/store'

export default function LeftNav(){
  const ws = useEditor(s=>s.ws)
  const setSelectedNode = useSelection(s=>s.setSelectedNode)
  const addQuestion = useEditor(s=>s.addQuestion)
  const addQuestionnaire = useEditor(s=>s.addQuestionnaire)
  const instantiateQuestionnaire = useEditor(s=>s.instantiateQuestionnaire)
  const addFolder = useEditor(s=>s.addFolder)
  const renameFolder = useEditor(s=>s.renameFolder)
  const addNode = useEditor(s=>s.addNode)
  const moveQuestionToFolder = useEditor(s=>s.moveQuestionToFolder)
  const moveQuestionnaireToFolder = useEditor(s=>s.moveQuestionnaireToFolder)
  const addQuestionToQuestionnaire = useEditor(s=>s.addQuestionToQuestionnaire)
  const reorderQuestionnaire = useEditor(s=>s.reorderQuestionnaire)
  const [activeQn, setActiveQn] = useState<string|null>(null)
  const [collapsed,setCollapsed] = useState<{[k:string]:boolean}>({ questions:false, questionnaires:false, folders:false })
  const toggle=(k:string)=> setCollapsed(c=>({...c, [k]:!c[k]}))
  const [dragIdx,setDragIdx]=useState<number|null>(null)
  const [overIdx,setOverIdx]=useState<number|null>(null)
  const startDrag = (e: React.DragEvent, payload: any)=>{
    const data = JSON.stringify(payload)
    e.dataTransfer.setData('application/esq', data)
    e.dataTransfer.setData('application/reactflow', data) // compatibility with React Flow examples
    e.dataTransfer.setData('text/plain', 'esq-dnd') // needed for Safari/Firefox to enable DnD
    e.dataTransfer.effectAllowed = 'copy'
  }
  const onDragStartQ=(e:React.DragEvent, idx:number)=>{ setDragIdx(idx); e.dataTransfer.effectAllowed='move' }
  const onDragEnterQ=(idx:number)=>{ if(dragIdx!==null && idx!==dragIdx) setOverIdx(idx) }
  const onDragEndQ=()=>{ if(activeQn && dragIdx!==null && overIdx!==null && dragIdx!==overIdx){ reorderQuestionnaire(activeQn, dragIdx, overIdx) } setDragIdx(null); setOverIdx(null) }
  const moveRow=(qid:string, from:number, delta:number)=>{ const to=from+delta; reorderQuestionnaire(qid, from, to) }

  // Keyboard activation for div-based buttons
  const onKeyActivate = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      action()
    }
  }

  if(!ws) return <>
    <h3>Left</h3><div className="content minihelp">Create a workspace to begin.</div>
  </>

  return (
    <>      
      <h3>Library</h3>
      <div className="content leftnav">
        <div className="section">
          <div className="title collapsible" role="group">
            <span className="chevron toggle" tabIndex={0} onClick={()=>toggle('questionnaires')} onKeyDown={e=>{ if(e.key==='Enter'||e.key===' ') { e.preventDefault(); toggle('questionnaires') } }}>{collapsed.questionnaires? '▸':'▾'}</span>
            <span className="label" onClick={()=>toggle('questionnaires')}>Questionnaires ({ws.questionnaires?.length||0})</span>
            <button onClick={(e)=>{ e.stopPropagation(); const name=prompt('Questionnaire name?'); if(!name) return; addQuestionnaire({ name }) }} className="add-btn">+ New</button>
          </div>
          {!collapsed.questionnaires && (ws.questionnaires||[]).map(qn=>
            <div className={`item ${activeQn===qn.id?'active':''}`} key={qn.id} onClick={()=>setActiveQn(qn.id)}>
              <span>{qn.name}</span>
              <button className="mini" title="Instantiate to Canvas" onClick={(e)=>{ e.stopPropagation(); instantiateQuestionnaire(qn.id) }}>→Canvas</button>
              {qn.questionIds.length>0 && <span className="mini-count">{qn.questionIds.length}</span>}
            </div>
          )}
          {activeQn && <div className="qn-builder">
            <div className="subhdr">Questions in {ws.questionnaires?.find(q=>q.id===activeQn)?.name}</div>
            <ol className="qn-list" role="list">
              {ws.questionnaires?.find(q=>q.id===activeQn)?.questionIds.map((qid,i)=>{
                const q = ws.questions.find(qq=>qq.id===qid)
                if(!q) return null
                return <li key={qid}
                  className={['qn-row', dragIdx===i? 'dragging':'', overIdx===i? 'over':''].filter(Boolean).join(' ')}
                  draggable
                  onDragStart={(e)=>onDragStartQ(e,i)}
                  onDragEnter={()=>onDragEnterQ(i)}
                  onDragEnd={onDragEndQ}
                >
                  <span className="handle" title="Drag to reorder">⋮⋮</span>
                  <span className="idx">{i+1}</span>
                  <span className="name">{q.name}</span>
                  <div className="row-actions">
                    <button title="Move Up" disabled={i===0} onClick={()=>moveRow(activeQn,i,-1)}>↑</button>
                    <button title="Move Down" disabled={i===((ws.questionnaires?.find(q=>q.id===activeQn)?.questionIds.length||1)-1)} onClick={()=>moveRow(activeQn,i,1)}>↓</button>
                  </div>
                </li>
              })}
            </ol>
            <div className="minihelp">Drag or use arrows to reorder. Drag questions below into this questionnaire or click +Add.</div>
          </div>}
        </div>
        <div className="section">
          <div className="title collapsible" role="group">
            <span className="chevron toggle" tabIndex={0} onClick={()=>toggle('questions')} onKeyDown={e=>{ if(e.key==='Enter'||e.key===' ') { e.preventDefault(); toggle('questions') } }}>{collapsed.questions? '▸':'▾'}</span>
            <span className="label" onClick={()=>toggle('questions')}>Questions ({ws.questions.length})</span>
            <button onClick={(e)=>{ e.stopPropagation(); const name=prompt('New Question name?')?.trim(); if(!name) return; const promptTxt=(prompt('Prompt text?')||'').trim(); addQuestion({ name, prompt: promptTxt }) }} className="add-btn">+ New</button>
          </div>
          {!collapsed.questions && ws.questions.map(q=>
            <div className="item question-row" key={q.id} draggable onDragStart={(e)=>startDrag(e,{ kind:'Question', id:q.id })}>
              <span onClick={()=>{ if(activeQn){ addQuestionToQuestionnaire(activeQn, q.id) }}} title={activeQn? 'Click to add to questionnaire' : ''}>{q.name}</span>
              {activeQn && <button className="mini" title="Add to questionnaire" onClick={()=>addQuestionToQuestionnaire(activeQn, q.id)}>+Add</button>}
              <button className="mini" title="Create node" onClick={()=>{ addNode({ kind:'Question', questionId:q.id, position:{x: 300+Math.random()*200, y: 200+Math.random()*160 } }) }}>+Node</button>
            </div>
          )}
        </div>
        <div className="section">
          <div className="title collapsible" role="group">
            <span className="chevron toggle" tabIndex={0} onClick={()=>toggle('folders')} onKeyDown={e=>{ if(e.key==='Enter'||e.key===' ') { e.preventDefault(); toggle('folders') } }}>{collapsed.folders? '▸':'▾'}</span>
            <span className="label" onClick={()=>toggle('folders')}>Folders ({ws.folders?.length||0})</span>
            <button onClick={(e)=>{ e.stopPropagation(); const name=prompt('Folder name?'); if(!name) return; addFolder({ name, kind:'questionnaire' }) }} className="add-btn">+ New</button>
          </div>
          {!collapsed.folders && (ws.folders||[]).map(f=>
            <div className="item" key={f.id}>
              <span>{f.name} [{f.kind}]</span>
              <button className="mini" onClick={()=>{ const nm=prompt('Rename folder', f.name); if(nm) renameFolder(f.id, nm) }}>✎</button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}