import { create } from 'zustand'
import { nanoid } from 'nanoid'
import type { Workspace, Node, Edge, Question, VisitType, SchedulingPool, Condition, Rule, Questionnaire, LibraryFolder } from '../core/schemas'

type EditorState = {
  ws: Workspace | null
  history: Workspace[]
  future: Workspace[]
  setWorkspace: (ws: Workspace)=>void
  newWorkspace: (name: string)=>void
  touch: ()=>void
  save: ()=>Promise<void>
  undo: ()=>void
  redo: ()=>void
  // Node/Edge
  addNode:(n: Partial<Node> & { kind: Node['kind']; position?:{x:number;y:number} })=>void
  addEdge:(e: Partial<Edge> & { from:string; to:string })=>void
  updateNode:(n: Partial<Node> & { id:string })=>void
  updateEdge:(e: Partial<Edge> & { id:string })=>void
  deleteNode:(id:string)=>void
  deleteEdge:(id:string)=>void
  moveNodes:(updates:{id:string; position:{x:number;y:number}}[])=>void
  // Edge conditions
  setEdgeConditions:(edgeId:string, conds:Condition[])=>void
  // Rules
  addRule:(r: Omit<Rule,'id'>)=>string | void
  updateRule:(r: Partial<Rule> & { id:string })=>void
  deleteRule:(id:string)=>void
  // Questions
  addQuestion:(q:{name:string; prompt:string; type?:Question['type']; options?:Question['options']; validation?:Question['validation']; displayHints?:Question['displayHints']})=>string | void
  addQuestions:(qs: Question[])=>void
  updateQuestion:(q: Partial<Question> & { id:string })=>void
  linkQuestionToNode:(nodeId:string, qid:string)=>void
  // Visit Types
  addVisitType:(vt:{name:string; category?:string; notes?:string})=>string | void
  updateVisitType:(vt: Partial<VisitType> & { id:string })=>void
  deleteVisitType:(id:string)=>void
  cloneVisitTypeFromBank:(id:string)=>void
  addVisitTypeToBank:(vt:VisitType)=>void
  // Pools
  addPool:(p:{name:string; category?:string; notes?:string})=>string | void
  updatePool:(p: Partial<SchedulingPool> & { id:string })=>void
  deletePool:(id:string)=>void
  clonePoolFromBank:(id:string)=>void
  addPoolToBank:(p:SchedulingPool)=>void
  // Questionnaires
  addQuestionnaire:(q:{name:string; description?:string})=>string | void
  updateQuestionnaire:(q: Partial<Questionnaire> & { id:string })=>void
  deleteQuestionnaire:(id:string)=>void
  addQuestionToQuestionnaire:(qid:string, questionId:string, index?:number)=>void
  removeQuestionFromQuestionnaire:(qid:string, questionId:string)=>void
  reorderQuestionnaire:(qid:string, from:number, to:number)=>void
  instantiateQuestionnaire:(qid:string)=>void
  // Folders
  addFolder:(f:{name:string; kind:LibraryFolder['kind']; parentId?:string})=>string | void
  renameFolder:(id:string, name:string)=>void
  deleteFolder:(id:string)=>void
  // assignment helpers
  moveQuestionToFolder:(questionId:string, folderId:string|null)=>void
  moveRuleToFolder:(ruleId:string, folderId:string|null)=>void
  moveQuestionnaireToFolder:(qid:string, folderId:string|null)=>void
}

// helper to push history
function pushHistory(current: Workspace, history: Workspace[]){
  const snapshot = JSON.parse(JSON.stringify(current)) as Workspace
  const next = [...history, snapshot]
  return next.slice(-50) // cap
}

const LAST_KEY = 'esq:last'

export const useEditor = create<EditorState>((set,get)=> ({
  ws:null,
  history:[],
  future:[],
  setWorkspace:(ws)=>{ set({ws, history:[], future:[]}); try{ localStorage.setItem(LAST_KEY, JSON.stringify(ws)) }catch{} },
  newWorkspace:(name)=>{
    const now = new Date().toISOString()
    const ws: Workspace = { id:nanoid(), name, version:'1.0', nodes:[{id:'n_start', kind:'Start', position:{x:80,y:80}}], edges:[], questions:[], visitTypes:[], pools:[], rules:[], questionnaires:[], folders:[], library:{questions:[], visitTypes:[], pools:[]}, aiNotes:[], createdAt:now, updatedAt:now }
    set({ws, history:[], future:[]})
    try{ localStorage.setItem(LAST_KEY, JSON.stringify(ws)) }catch{}
  },
  touch:()=>{ const ws = get().ws; if(!ws) return; const next = { ...ws, updatedAt:new Date().toISOString() }; set({ ws: next }); try{ localStorage.setItem(LAST_KEY, JSON.stringify(next)) }catch{} },
  save: async ()=>{ const ws = get().ws; if(!ws) return; try{ localStorage.setItem(LAST_KEY, JSON.stringify(ws)) }catch{} },
  undo:()=>{ const { history, ws, future } = get(); if(!ws || history.length===0) return; const prev = history[history.length-1]; const newHist = history.slice(0,-1); const newFuture = [JSON.parse(JSON.stringify(ws)) as Workspace, ...future].slice(0,50); set({ ws: prev, history:newHist, future:newFuture }) },
  redo:()=>{ const { history, ws, future } = get(); if(!ws || future.length===0) return; const nextWs = future[0]; const newFuture = future.slice(1); const newHist = pushHistory(ws, history); set({ ws: nextWs, history:newHist, future:newFuture }) },
  // Node/Edge
  addNode:(n)=>{ const ws = get().ws; if(!ws) return; const history = pushHistory(ws, get().history); const id = n.id || `n_${nanoid(6)}`; const base:any = { id, kind:n.kind, position:n.position||{x:120,y:120} }; if(n.kind==='Question' && (n as any).questionId) base.questionId = (n as any).questionId; if(n.kind==='VisitType' && (n as any).visitTypeId) base.visitTypeId = (n as any).visitTypeId; if(n.kind==='Pool' && (n as any).poolId) base.poolId = (n as any).poolId; const node:Node = base; const next = { ...ws, nodes:[...ws.nodes, node] }; set({ ws: next, history, future:[] }); try{ localStorage.setItem(LAST_KEY, JSON.stringify(next)) }catch{} },
  addEdge:(e)=>{ const ws = get().ws; if(!ws) return; const history = pushHistory(ws, get().history); const id = e.id || `e_${nanoid(6)}`; const edge:Edge = { id, from:e.from, to:e.to, label:e.label||'' }; const next = { ...ws, edges:[...ws.edges, edge] }; set({ ws: next, history, future:[] }); try{ localStorage.setItem(LAST_KEY, JSON.stringify(next)) }catch{} },
  updateNode:(n)=>{ const ws = get().ws; if(!ws) return; const history = pushHistory(ws, get().history); const next = { ...ws, nodes: ws.nodes.map(x=>x.id===n.id? {...x, ...n, position:n.position||x.position}: x) }; set({ ws: next, history, future:[] }); try{ localStorage.setItem(LAST_KEY, JSON.stringify(next)) }catch{} },
  updateEdge:(e)=>{ const ws = get().ws; if(!ws) return; const history = pushHistory(ws, get().history); const next = { ...ws, edges: ws.edges.map(x=>x.id===e.id? {...x, ...e}: x) }; set({ ws: next, history, future:[] }); try{ localStorage.setItem(LAST_KEY, JSON.stringify(next)) }catch{} },
  deleteNode:(id)=>{ const ws = get().ws; if(!ws) return; const history = pushHistory(ws, get().history); const next = { ...ws, nodes: ws.nodes.filter(n=>n.id!==id), edges: ws.edges.filter(ed=>ed.from!==id && ed.to!==id) }; set({ ws: next, history, future:[] }); try{ localStorage.setItem(LAST_KEY, JSON.stringify(next)) }catch{} },
  deleteEdge:(id)=>{ const ws = get().ws; if(!ws) return; const history = pushHistory(ws, get().history); const next = { ...ws, edges: ws.edges.filter(e=>e.id!==id) }; set({ ws: next, history, future:[] }); try{ localStorage.setItem(LAST_KEY, JSON.stringify(next)) }catch{} },
  moveNodes:(updates)=>{ const ws=get().ws; if(!ws||updates.length===0) return; const history=pushHistory(ws,get().history); const updateMap = new Map(updates.map(u=>[u.id,u.position])); const next={...ws, nodes: ws.nodes.map(n=> updateMap.has(n.id)? {...n, position:updateMap.get(n.id)!}: n)}; set({ ws: next, history, future:[]}); try{ localStorage.setItem(LAST_KEY, JSON.stringify(next)) }catch{} },
  setEdgeConditions:(edgeId, conds)=>{ const ws = get().ws; if(!ws) return; const history = pushHistory(ws, get().history); const next = { ...ws, edges: ws.edges.map(e=>e.id===edgeId? {...e, edgeConditions:conds}: e) }; set({ ws: next, history, future:[] }); try{ localStorage.setItem(LAST_KEY, JSON.stringify(next)) }catch{} },
  addRule:(r)=>{ const ws = get().ws; if(!ws) return; const history = pushHistory(ws, get().history); const id = `rule_${nanoid(6)}`; const rule:Rule = { id, ...r }; const next = { ...ws, rules:[...ws.rules, rule] }; set({ ws: next, history, future:[] }); try{ localStorage.setItem(LAST_KEY, JSON.stringify(next)) }catch{}; return id },
  updateRule:(r)=>{ const ws = get().ws; if(!ws) return; const history = pushHistory(ws, get().history); const next = { ...ws, rules: ws.rules.map(x=>x.id===r.id? {...x, ...r}: x) }; set({ ws: next, history, future:[] }); try{ localStorage.setItem(LAST_KEY, JSON.stringify(next)) }catch{} },
  deleteRule:(id)=>{ const ws = get().ws; if(!ws) return; const history = pushHistory(ws, get().history); const next = { ...ws, rules: ws.rules.filter(r=>r.id!==id) }; set({ ws: next, history, future:[] }); try{ localStorage.setItem(LAST_KEY, JSON.stringify(next)) }catch{} },
  // Questions
  addQuestion:(q)=>{
    const ws = get().ws; if(!ws) return
    const id = `q_${nanoid(6)}`
    const nq: Question = { id, name:q.name, prompt:q.prompt, type:q.type||'YesNo', options:q.options||[], validation:q.validation||{}, displayHints:q.displayHints||{} }
    const next = { ...ws, questions:[...ws.questions, nq] }
    set({ ws: next })
    try{ localStorage.setItem(LAST_KEY, JSON.stringify(next)) }catch{ /* ignore */ }
    return id
  },
  addQuestions:(qs)=>{
    const ws = get().ws; if(!ws) return
    const next = { ...ws, questions:[...ws.questions, ...qs] }
    set({ ws: next })
    try{ localStorage.setItem(LAST_KEY, JSON.stringify(next)) }catch{ /* ignore */ }
  },
  updateQuestion:(q)=>{
    const ws = get().ws; if(!ws) return
    const next = { ...ws, questions: ws.questions.map(x=>x.id===q.id? {...x, ...q}: x) }
    set({ ws: next })
    try{ localStorage.setItem(LAST_KEY, JSON.stringify(next)) }catch{ /* ignore */ }
  },
  linkQuestionToNode:(nodeId,qid)=>{
    const ws = get().ws; if(!ws) return
    const nextNodes: Node[] = ws.nodes.map(n=>
      n.id===nodeId ? { ...n, kind: 'Question' as Node['kind'], questionId: qid } : n
    )
    const next = { ...ws, nodes: nextNodes }
    set({ ws: next })
    try{ localStorage.setItem(LAST_KEY, JSON.stringify(next)) }catch{ /* ignore */ }
  },
  // Visit Types
  addVisitType:(vt)=>{
    const ws = get().ws; if(!ws) return
    const id = `vt_${nanoid(6)}`
    const newVT: VisitType = { id, name:vt.name, category:vt.category, notes:vt.notes }
    const next = { ...ws, visitTypes:[...ws.visitTypes, newVT] }
    set({ ws: next })
    try{ localStorage.setItem(LAST_KEY, JSON.stringify(next)) }catch{ /* ignore */ }
    return id
  },
  updateVisitType:(vt)=>{
    const ws = get().ws; if(!ws) return
    const next = { ...ws, visitTypes: ws.visitTypes.map(x=>x.id===vt.id? {...x, ...vt}: x) }
    set({ ws: next })
    try{ localStorage.setItem(LAST_KEY, JSON.stringify(next)) }catch{ /* ignore */ }
  },
  deleteVisitType:(id)=>{
    const ws = get().ws; if(!ws) return
    const next = { ...ws, visitTypes: ws.visitTypes.filter(v=>v.id!==id) }
    set({ ws: next })
    try{ localStorage.setItem(LAST_KEY, JSON.stringify(next)) }catch{ /* ignore */ }
  },
  cloneVisitTypeFromBank:(id)=>{
    const ws = get().ws; if(!ws) return
    const item = ws.library?.visitTypes.find(v=>v.id===id); if(!item) return
    const next = { ...ws, visitTypes:[...ws.visitTypes, {...item, id:`vt_${nanoid(6)}`}] }
    set({ ws: next })
    try{ localStorage.setItem(LAST_KEY, JSON.stringify(next)) }catch{ /* ignore */ }
  },
  addVisitTypeToBank:(vt)=>{
    const ws = get().ws; if(!ws) return
    const next = { ...ws, library:{...ws.library!, visitTypes:[...(ws.library?.visitTypes||[]), vt], questions: ws.library?.questions||[], pools: ws.library?.pools||[]} }
    set({ ws: next })
    try{ localStorage.setItem(LAST_KEY, JSON.stringify(next)) }catch{ /* ignore */ }
  },
  // Pools
  addPool:(p)=>{
    const ws = get().ws; if(!ws) return
    const id = `sp_${nanoid(6)}`
    const newP: SchedulingPool = { id, name:p.name, category:p.category, notes:p.notes }
    const next = { ...ws, pools:[...ws.pools, newP] }
    set({ ws: next })
    try{ localStorage.setItem(LAST_KEY, JSON.stringify(next)) }catch{ /* ignore */ }
    return id
  },
  updatePool:(p)=>{
    const ws = get().ws; if(!ws) return
    const next = { ...ws, pools: ws.pools.map(x=>x.id===p.id? {...x, ...p}: x) }
    set({ ws: next })
    try{ localStorage.setItem(LAST_KEY, JSON.stringify(next)) }catch{ /* ignore */ }
  },
  deletePool:(id)=>{
    const ws = get().ws; if(!ws) return
    const next = { ...ws, pools: ws.pools.filter(x=>x.id!==id) }
    set({ ws: next })
    try{ localStorage.setItem(LAST_KEY, JSON.stringify(next)) }catch{ /* ignore */ }
  },
  clonePoolFromBank:(id)=>{
    const ws = get().ws; if(!ws) return
    const item = ws.library?.pools.find(p=>p.id===id); if(!item) return
    const next = { ...ws, pools:[...ws.pools, {...item, id:`sp_${nanoid(6)}`}] }
    set({ ws: next })
    try{ localStorage.setItem(LAST_KEY, JSON.stringify(next)) }catch{ /* ignore */ }
  },
  addPoolToBank:(p)=>{
    const ws = get().ws; if(!ws) return
    const next = { ...ws, library:{...ws.library!, pools:[...(ws.library?.pools||[]), p], questions: ws.library?.questions||[], visitTypes: ws.library?.visitTypes||[]} }
    set({ ws: next })
    try{ localStorage.setItem(LAST_KEY, JSON.stringify(next)) }catch{ /* ignore */ }
  },
  // Questionnaires
  addQuestionnaire:(q)=>{ const ws=get().ws; if(!ws) return; const history=pushHistory(ws,get().history); const id=`qn_${nanoid(6)}`; const nq:Questionnaire={ id, name:q.name, description:q.description, questionIds:[] }; const next={...ws, questionnaires:[...(ws.questionnaires||[]), nq]}; set({ws:next, history, future:[]}); try{localStorage.setItem(LAST_KEY, JSON.stringify(next))}catch{}; return id },
  updateQuestionnaire:(q)=>{ const ws=get().ws; if(!ws) return; const history=pushHistory(ws,get().history); const next={...ws, questionnaires:(ws.questionnaires||[]).map(x=>x.id===q.id? {...x,...q}:x)}; set({ws:next, history, future:[]}); try{localStorage.setItem(LAST_KEY, JSON.stringify(next))}catch{} },
  deleteQuestionnaire:(id)=>{ const ws=get().ws; if(!ws) return; const history=pushHistory(ws,get().history); const next={...ws, questionnaires:(ws.questionnaires||[]).filter(q=>q.id!==id)}; set({ws:next, history, future:[]}); try{localStorage.setItem(LAST_KEY, JSON.stringify(next))}catch{} },
  addQuestionToQuestionnaire:(qid,questionId,index)=>{ const ws=get().ws; if(!ws) return; const history=pushHistory(ws,get().history); const nextQs=(ws.questionnaires||[]).map(q=>{ if(q.id!==qid) return q; if(q.questionIds.includes(questionId)) return q; const arr=[...q.questionIds]; if(index===undefined||index<0||index>arr.length) arr.push(questionId); else arr.splice(index,0,questionId); return {...q, questionIds:arr} }); const next={...ws, questionnaires:nextQs}; set({ws:next, history, future:[]}); try{localStorage.setItem(LAST_KEY, JSON.stringify(next))}catch{} },
  removeQuestionFromQuestionnaire:(qid,questionId)=>{ const ws=get().ws; if(!ws) return; const history=pushHistory(ws,get().history); const nextQs=(ws.questionnaires||[]).map(q=> q.id===qid? {...q, questionIds:q.questionIds.filter(id=>id!==questionId)}: q); const next={...ws, questionnaires:nextQs}; set({ws:next, history, future:[]}); try{localStorage.setItem(LAST_KEY, JSON.stringify(next))}catch{} },
  reorderQuestionnaire:(qid,from,to)=>{ const ws=get().ws; if(!ws) return; const history=pushHistory(ws,get().history); const nextQs=(ws.questionnaires||[]).map(q=>{ if(q.id!==qid) return q; const arr=[...q.questionIds]; if(from<0||from>=arr.length||to<0||to>=arr.length) return q; const [m]=arr.splice(from,1); arr.splice(to,0,m); return {...q, questionIds:arr}; }); const next={...ws, questionnaires:nextQs}; set({ws:next, history, future:[]}); try{localStorage.setItem(LAST_KEY, JSON.stringify(next))}catch{} },
  instantiateQuestionnaire:(qid)=>{ const ws=get().ws; if(!ws) return; const qn=(ws.questionnaires||[]).find(q=>q.id===qid); if(!qn) return; const history=pushHistory(ws,get().history); const baseX=120, baseY=120, dx=220; const newNodes:Node[]=[]; const newEdges:Edge[]=[]; let prevNodeId: string | null = null; qn.questionIds.forEach((qid,i)=>{ let targetNode = ws.nodes.find(n=>n.kind==='Question' && n.questionId===qid); if(!targetNode){ targetNode = { id:`n_${nanoid(6)}`, kind:'Question', questionId: qid, position:{ x: baseX + i*dx, y: baseY } }; newNodes.push(targetNode) } if(prevNodeId){ newEdges.push({ id:`e_${nanoid(6)}`, from: prevNodeId, to: targetNode.id, label:'' }) } prevNodeId = targetNode.id; }); const next={...ws, nodes:[...ws.nodes, ...newNodes], edges:[...ws.edges, ...newEdges]}; set({ws:next, history, future:[]}); try{localStorage.setItem(LAST_KEY, JSON.stringify(next))}catch{} },
  // Folders
  addFolder:(f)=>{ const ws=get().ws; if(!ws) return; const history=pushHistory(ws,get().history); const id=`fld_${nanoid(5)}`; const folder:LibraryFolder={ id, name:f.name, kind:f.kind, parentId:f.parentId }; const next={...ws, folders:[...(ws.folders||[]), folder]}; set({ws:next, history, future:[]}); try{localStorage.setItem(LAST_KEY, JSON.stringify(next))}catch{}; return id },
  renameFolder:(id,name)=>{ const ws=get().ws; if(!ws) return; const history=pushHistory(ws,get().history); const next={...ws, folders:(ws.folders||[]).map(f=>f.id===id? {...f, name}: f)}; set({ws:next, history, future:[]}); try{localStorage.setItem(LAST_KEY, JSON.stringify(next))}catch{} },
  deleteFolder:(id)=>{ const ws=get().ws; if(!ws) return; const history=pushHistory(ws,get().history); const next={...ws, folders:(ws.folders||[]).filter(f=>f.id!==id)}; set({ws:next, history, future:[]}); try{localStorage.setItem(LAST_KEY, JSON.stringify(next))}catch{} },
  moveQuestionToFolder:(questionId,folderId)=>{ const ws=get().ws; if(!ws) return; const history=pushHistory(ws,get().history); const next={...ws, questions: ws.questions.map(q=>q.id===questionId? {...q, folderId:folderId||undefined}: q)}; set({ws:next, history, future:[]}); try{localStorage.setItem(LAST_KEY, JSON.stringify(next)) }catch{} },
  moveRuleToFolder:(ruleId,folderId)=>{ const ws=get().ws; if(!ws) return; const history=pushHistory(ws,get().history); const next={...ws, rules: ws.rules.map(r=>r.id===ruleId? {...r, folderId:folderId||undefined}: r)}; set({ws:next, history, future:[]}); try{localStorage.setItem(LAST_KEY, JSON.stringify(next)) }catch{} },
  moveQuestionnaireToFolder:(qid,folderId)=>{ const ws=get().ws; if(!ws) return; const history=pushHistory(ws,get().history); const next={...ws, questionnaires:(ws.questionnaires||[]).map(q=>q.id===qid? {...q, folderId:folderId||undefined}: q)}; set({ws:next, history, future:[]}); try{localStorage.setItem(LAST_KEY, JSON.stringify(next)) }catch{} },
}))

export function loadLastWorkspace(): Workspace | null{
  try{
    const s = localStorage.getItem(LAST_KEY)
    if(!s) return null
    const ws = JSON.parse(s) as Workspace
    return ws
  }catch{ return null }
}

type SelState = {
  selectedNodeId: string|null
  selectedEdgeId: string|null
  setSelectedNode:(id:string|null)=>void
  setSelectedEdge:(id:string|null)=>void
}
export const useSelection = create<SelState & { multiNodeIds:string[]; setMultiNodes:(ids:string[])=>void; moveSelected:(dx:number, dy:number)=>void; clear:()=>void; highlightRuleId:string|null; setHighlightRule:(id:string|null)=>void }>((set,get)=> ({
  selectedNodeId:null,
  selectedEdgeId:null,
  multiNodeIds:[],
  highlightRuleId:null,
  setSelectedNode:(id)=>set({selectedNodeId:id, selectedEdgeId:null, multiNodeIds: id? [id]:[] }),
  setSelectedEdge:(id)=>set({selectedEdgeId:id, selectedNodeId:null, multiNodeIds:[]}),
  setMultiNodes:(ids)=>set({ multiNodeIds:ids, selectedNodeId: ids.length===1? ids[0]: null, selectedEdgeId:null }),
  moveSelected:(dx,dy)=>{
    const ids = get().multiNodeIds; if(ids.length===0) return
    const st = useEditor.getState(); const ws = st.ws; if(!ws) return
    ids.forEach(id=>{
      const n = ws.nodes.find(n=>n.id===id); if(!n) return
      st.updateNode({ id, position:{ x: n.position.x + dx, y: n.position.y + dy }})
    })
  },
  setHighlightRule:(id)=>set({ highlightRuleId:id }),
  clear:()=>set({ selectedNodeId:null, selectedEdgeId:null, multiNodeIds:[], highlightRuleId:null })
}))
