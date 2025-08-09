import { Workspace } from './schemas'

export type ValidationIssue = { kind: 'error' | 'warning'; code: string; message: string; data?: any };

export function validate(ws: Workspace): ValidationIssue[]{
  const issues: ValidationIssue[] = []
  const idSet = new Set(ws.nodes.map(n=>n.id))
  const start = ws.nodes.find(n=>n.kind==='Start')
  if(!start) issues.push({kind:'error', code:'NO_START', message:'Workspace has no Start node.'})

  // Duplicate IDs
  const nodeCounts = ws.nodes.reduce((m, n)=>{ m[n.id]=(m[n.id]||0)+1; return m }, {} as Record<string,number>)
  Object.entries(nodeCounts).forEach(([id,count])=>{ if(count>1) issues.push({kind:'error', code:'DUP_NODE_ID', message:`Duplicate node id: ${id}`}) })
  const edgeCounts = ws.edges.reduce((m, e)=>{ m[e.id]=(m[e.id]||0)+1; return m }, {} as Record<string,number>)
  Object.entries(edgeCounts).forEach(([id,count])=>{ if(count>1) issues.push({kind:'error', code:'DUP_EDGE_ID', message:`Duplicate edge id: ${id}`}) })

  ws.edges.forEach(e=>{
    if(!idSet.has(e.from) || !idSet.has(e.to)){
      issues.push({kind:'error', code:'EDGE_REF', message:`Edge ${e.id} references missing node(s).`, data:e})
    }
  })

  const out = new Map<string, number>()
  ws.edges.forEach(e=>out.set(e.from, (out.get(e.from)||0)+1))
  ws.nodes.forEach(n=>{
    if(n.kind!=='End' && (out.get(n.id)||0) < 1){
      issues.push({kind:'error', code:'NO_OUT', message:`Node ${n.id} has no outgoing edges.`})
    }
  })

  if(start){
    const seen = new Set<string>()
    const adj = new Map<string,string[]>()
    ws.edges.forEach(e=>adj.set(e.from, [ ...(adj.get(e.from)||[]), e.to ]))
    const dfs = (id:string)=>{ if(seen.has(id)) return; seen.add(id); (adj.get(id)||[]).forEach(dfs) }
    dfs(start.id)
    ws.nodes.forEach(n=>{ if(!seen.has(n.id)) issues.push({kind:'warning', code:'ORPHAN', message:`Node ${n.id} is unreachable from Start.`}) })
  }

  const slugOk = (s:string)=>/^[A-Z0-9_]+$/.test(s)
  ws.visitTypes.forEach(v=>{
    if(!slugOk(v.name)) issues.push({kind:'warning', code:'VT_SLUG', message:`VisitType "${v.name}" → prefer SLUG (e.g., MRI_BRAIN_WWO)`})
  })

  ws.edges.forEach(e=>{
    e.conditions?.forEach(r=>{
      const hasEq = (r.all||[]).some(c=>c.comparator==='eq')
      const hasNeq = (r.all||[]).some(c=>c.comparator==='neq')
      if(hasEq && hasNeq){
        issues.push({kind:'error', code:'CONFLICT_RULE', message:`Rule ${r.id} on edge ${e.id} contains conflicting comparators.`})
      }
    })
  })

  // New: reference integrity and engine coverage
  const qIds = new Set(ws.questions.map(q=>q.id))
  const vtIds = new Set(ws.visitTypes.map(v=>v.id))
  const poolIds = new Set(ws.pools.map(p=>p.id))

  // Node link checks
  ws.nodes.forEach(n=>{
    if(n.kind==='Question'){
      if(!n.questionId) issues.push({kind:'warning', code:'NODE_QUESTION_UNLINKED', message:`Question node ${n.id} has no linked question.`})
      else if(!qIds.has(n.questionId)) issues.push({kind:'error', code:'NODE_QUESTION_MISSING', message:`Question node ${n.id} links missing question ${n.questionId}.`})
    }
    if(n.kind==='VisitType'){
      if(n.visitTypeId && !vtIds.has(n.visitTypeId)) issues.push({kind:'error', code:'NODE_VT_MISSING', message:`VisitType node ${n.id} links missing VisitType ${n.visitTypeId}.`})
    }
  })

  // Conditions and actions
  ws.edges.forEach(e=>{
    e.conditions?.forEach(r=>{
      const allConds = [...(r.all||[]), ...(r.any||[]), ...(r.not||[])]
      allConds.forEach(c=>{
        if(!qIds.has(c.questionId)) issues.push({kind:'error', code:'COND_QUESTION_MISSING', message:`Rule ${r.id} on edge ${e.id} references missing question ${c.questionId}.`})
      })
      // Action refs
      const a = r.action as any
      if(a?.type==='SetVisitType'){
        if(!vtIds.has(a.visitTypeId)) issues.push({kind:'error', code:'ACTION_VT_MISSING', message:`Rule ${r.id} on edge ${e.id} references missing VisitType ${a.visitTypeId}.`})
      } else if(a?.type==='FlipVisitType'){
        if(a.from && !vtIds.has(a.from)) issues.push({kind:'warning', code:'ACTION_VT_FROM_MISSING', message:`Rule ${r.id} on edge ${e.id} references missing from VisitType ${a.from}.`})
        if(!vtIds.has(a.to)) issues.push({kind:'error', code:'ACTION_VT_TO_MISSING', message:`Rule ${r.id} on edge ${e.id} references missing to VisitType ${a.to}.`})
      } else if(a?.type==='SetSchedulingPool'){
        if(!poolIds.has(a.poolId)) issues.push({kind:'error', code:'ACTION_POOL_MISSING', message:`Rule ${r.id} on edge ${e.id} references missing Pool ${a.poolId}.`})
      } else if(a?.type==='ShowNode' || a?.type==='SkipNode'){
        if(!idSet.has(a.nodeId)) issues.push({kind:'error', code:'ACTION_NODE_MISSING', message:`Rule ${r.id} on edge ${e.id} references missing node ${a.nodeId}.`})
        // Engine does not currently apply ShowNode/SkipNode
        issues.push({kind:'warning', code:'ACTION_NOOP_ENGINE', message:`Rule ${r.id} on edge ${e.id} uses ${a.type}, which is not applied by the engine.`})
      }
    })
  })

  return issues
}
