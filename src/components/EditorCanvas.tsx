import React, { useEffect, useRef, useCallback, useMemo, useState } from 'react'
import ReactFlow, {
  Background, Controls, MiniMap,
  Node as RFNode, Edge as RFEdge, ReactFlowInstance, applyNodeChanges, NodeChange
} from 'reactflow'
import 'reactflow/dist/style.css'
import { useEditor, useSelection } from '../state/store'
import { StartNode, EndNode, QuestionNode, VisitTypeNode, GateNode, PoolNode } from '../ui/nodes'
import FlowTools from './FlowTools'
import type { NodePositionChange } from 'reactflow'
import ConditionEdge from '../components/edges/ConditionEdge'
import DefaultEdge from '../components/edges/DefaultEdge'

function NodeContextActions({ id, onClose }:{ id:string; onClose:()=>void }){ 
  const { ws, updateNode, deleteNode, addNode } = useEditor();
  const n = ws?.nodes.find(n=>n.id===id)
  return <div className="ctx-group">
    <button onClick={()=>{ const nm=prompt('Rename node label override? (affects display only)', n?.questionId||''); if(nm && n?.kind==='Question'){ /* future: store label override */ } onClose() }}>Rename</button>
    <button onClick={()=>{ if(!n) return; addNode({ kind:n.kind, questionId:n.questionId, visitTypeId:(n as any).visitTypeId, poolId:(n as any).poolId, position:{ x:(n.position.x||0)+40, y:(n.position.y||0)+40 } }); onClose() }}>Duplicate</button>
    <button onClick={()=>{ if(confirm('Delete node?')) deleteNode(id); onClose() }} className="danger">Delete</button>
  </div> 
}
function EdgeContextActions({ id, onClose }:{ id:string; onClose:()=>void }){ 
  const { deleteEdge } = useEditor();
  return <div className="ctx-group">
    <button onClick={()=>{ (window as any).__addEdgeCondition?.(id); onClose() }}>Edit Conditions</button>
    <button onClick={()=>{ if(confirm('Delete edge?')) deleteEdge(id); onClose() }} className="danger">Delete</button>
  </div>
}

export default function EditorCanvas(){
  const { ws, addNode, addEdge, updateNode, updateEdge, deleteNode, deleteEdge } = useEditor()
  const { setSelectedNode, setSelectedEdge } = useSelection()
  const wrapper = useRef<HTMLDivElement>(null)
  const rfRef = useRef<ReactFlowInstance | null>(null)
  const [rfNodes, setRfNodes] = useState<RFNode[]>([])
  const [snap, setSnap] = useState(true)
  const [dragSelecting, setDragSelecting] = useState<null | {x:number;y:number}>(null)
  const [guides, setGuides] = useState<{x:number[]; y:number[]}>({x:[], y:[]})
  const [ctxMenu, setCtxMenu] = useState<{x:number;y:number; nodeId?:string; edgeId?:string}|null>(null)
  const multi = useSelection(s=>s.multiNodeIds)
  const setMulti = useSelection(s=>s.setMultiNodes)
  const moveSelected = useSelection(s=>s.moveSelected)
  const marqueeRef = useRef<HTMLDivElement|null>(null)

  useEffect(()=>{
    const onKey = (e:KeyboardEvent)=>{
      if(e.key.toLowerCase()==='n'){
        e.preventDefault()
        addNode({ kind:'Question', position:{x: Math.random()*400+100, y: Math.random()*200+100} })
      }
    }
    window.addEventListener('keydown', onKey)
    return ()=>window.removeEventListener('keydown', onKey)
  }, [addNode])

  useEffect(()=>{
    if(!ws) { setRfNodes([]); return }
    // remap workspace nodes to RF nodes (preserve existing position if already in rfNodes to avoid jump mid-drag)
    setRfNodes(prev=>{
      const map: Record<string, RFNode> = {}
      prev.forEach(n=> map[n.id]=n)
      return ws.nodes.map(n=>{
        const existing = map[n.id]
        const data: any = {
          label: n.kind==='Question'
            ? (ws.questions.find(q=>q.id===n.questionId)?.name || n.questionId || 'Question')
            : n.kind,
          vt: n.kind==='VisitType' ? (ws.visitTypes.find(v=>v.id===n.visitTypeId)?.name) : undefined,
            pool: n.kind==='Pool' ? (ws.pools.find(p=>p.id===n.poolId)?.name) : undefined,
          color: n.meta?.color,
          shape: n.meta?.shape
        }
        const type =
          n.kind==='Start' ? 'start' :
          n.kind==='End' ? 'end' :
          n.kind==='VisitType' ? 'visittype' :
          n.kind==='Gate' ? 'gate' :
          n.kind==='Pool' ? 'pool' : 'question'
        return {
          id:n.id,
          position: existing ? existing.position : n.position,
          data,
          type
        }
      })
    })
  }, [ws?.nodes, ws?.questions, ws?.visitTypes, ws?.pools])

  const edges: RFEdge[] = useMemo(()=>{
    if(!ws) return []
    return ws.edges.map(e=>({
      id:e.id, source:e.from, target:e.to, label:e.label, type: e.edgeConditions && e.edgeConditions.length? 'condEdge':'smoothstep',
      data:{ hasConds: !!(e.edgeConditions && e.edgeConditions.length) },
      markerEnd: { type: 'arrowclosed' } as any,
      updatable: true
    }))
  }, [ws])

  const onConnect = useCallback((params:any)=>{
    if(!ws) return
    addEdge({ from: params.source, to: params.target })
  }, [addEdge, ws])

  const onNodeClick = useCallback((_:any, node:any)=>{ if((window.event as MouseEvent).shiftKey){
      const cur = new Set(multi); if(cur.has(node.id)) cur.delete(node.id); else cur.add(node.id); setMulti(Array.from(cur))
    } else { setSelectedNode(node.id); setSelectedEdge(null); setMulti([node.id]) }
  }, [setSelectedNode, setSelectedEdge, multi, setMulti])

  const onEdgeClick = useCallback((_:any, edge:any)=>{ setSelectedEdge(edge.id); setSelectedNode(null) }, [setSelectedEdge, setSelectedNode])

  const handleDragOver = (e: React.DragEvent)=>{
    e.preventDefault(); e.dataTransfer.dropEffect = 'copy'
  }
  const handleDrop = (e: React.DragEvent)=>{
    e.preventDefault();
    if(!ws) return
    const raw = e.dataTransfer.getData('application/esq'); if(!raw) return
    const payload = JSON.parse(raw)
    const bounds = wrapper.current?.getBoundingClientRect();
    const base = { x: e.clientX - (bounds?.left||0), y: e.clientY - (bounds?.top||0) }
    const pos = rfRef.current ? rfRef.current.project(base) : base
    if(payload.kind==='Question') addNode({ kind:'Question', questionId: payload.id, position: pos })
    else if(payload.kind==='VisitType') addNode({ kind:'VisitType', visitTypeId: payload.id, position: pos })
    else if(payload.kind==='Pool') addNode({ kind:'Pool', poolId: payload.id, position: pos })
  }

  const nodeTypes = useMemo(()=>({
    start: StartNode,
    end: EndNode,
    question: QuestionNode,
    visittype: VisitTypeNode,
    pool: PoolNode,
    gate: GateNode
  }),[])
  const edgeTypes = useMemo(()=>({ condEdge: ConditionEdge, default: DefaultEdge }),[])

  useEffect(()=>{
    const onKey=(e:KeyboardEvent)=>{
      if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){
        const delta= e.shiftKey? 20: 5
        if(e.key==='ArrowUp') moveSelected(0,-delta)
        if(e.key==='ArrowDown') moveSelected(0,delta)
        if(e.key==='ArrowLeft') moveSelected(-delta,0)
        if(e.key==='ArrowRight') moveSelected(delta,0)
      }
      if(e.key==='g') setSnap(s=>!s)
    }
    window.addEventListener('keydown', onKey)
    return ()=>window.removeEventListener('keydown', onKey)
  }, [moveSelected])

  const onNodesChange = useCallback((changes: NodeChange[])=>{
    setRfNodes(nds=>{
      let next = applyNodeChanges(changes, nds)
      if(snap){ next = next.map(n=> ({ ...n, position:{ x: Math.round(n.position.x/10)*10, y: Math.round(n.position.y/10)*10 } })) }
      // compute guides for active dragged node
      const moving = changes.filter(c=> c.type==='position' && (c as NodePositionChange).dragging) as NodePositionChange[]
      if(moving.length>0){
        const ids = moving.map(m=>m.id)
        const movingNodes = next.filter(n=>ids.includes(n.id))
        const stationary = next.filter(n=>!ids.includes(n.id))
        const gx: number[] = []
        const gy: number[] = []
        movingNodes.forEach(mn=>{
          stationary.forEach(sn=>{
            if(Math.abs(mn.position.x - sn.position.x) < 6) gx.push(sn.position.x)
            if(Math.abs(mn.position.x - (sn.position.x+ sn.width!/2)) < 6) gx.push(sn.position.x+ sn.width!/2)
            if(Math.abs(mn.position.y - sn.position.y) < 6) gy.push(sn.position.y)
            if(Math.abs(mn.position.y - (sn.position.y+ sn.height!/2)) < 6) gy.push(sn.position.y+ sn.height!/2)
          })
        })
        setGuides({ x: gx.slice(0,3), y: gy.slice(0,3) })
      } else setGuides({x:[], y:[]})
      return next
    })
    if(!ws) return
    changes.forEach((ch:any)=>{
      if(ch.type==='position' && ch.dragging===false){
        const pos = snap? { x: Math.round(ch.position.x/10)*10, y: Math.round(ch.position.y/10)*10 }: ch.position
        updateNode({ id: ch.id, position: pos })
      }
      if(ch.type==='remove'){
        deleteNode(ch.id)
      }
    })
  }, [ws, updateNode, deleteNode, snap])

  const onEdgesChange = useCallback((changes:any)=>{
    if(!ws) return
    changes.forEach((ch:any)=>{
      if(ch.type==='remove') deleteEdge(ch.id)
    })
  }, [deleteEdge, ws])

  const onEdgeUpdate = useCallback((oldEdge:any, newConnection:any)=>{
    updateEdge({ id: oldEdge.id, from: newConnection.source, to: newConnection.target })
  }, [updateEdge])

  const onMouseMove = (e: React.MouseEvent) => {
    if (dragSelecting) {
      // TODO: implement marquee selection visual feedback
    }
  }

  const onMouseUp = (e: React.MouseEvent) => {
    if (dragSelecting) {
      setDragSelecting(null)
    }
  }

  const { highlightRuleId } = useSelection();
  const highlightedRule = highlightRuleId? ws?.rules.find(r=> r.id===highlightRuleId): null;
  const impactedQuestionIds = useMemo(()=> {
    if(!highlightedRule) return [] as string[];
    const conds = (highlightedRule as any).conditions || (highlightedRule as any).all || [];
    return conds.map((c: any)=> c.questionId).filter(Boolean);
  }, [highlightedRule]);
  const impactedVisitTypeId = useMemo(()=> highlightedRule && highlightedRule.action?.type==='SetVisitType'? highlightedRule.action.visitTypeId : null, [highlightedRule])
  const impactedNodeIds = useMemo(()=> {
    if(!ws || (!impactedQuestionIds.length && !impactedVisitTypeId)) return new Set<string>();
    const set = new Set<string>();
    ws.nodes.forEach(n=>{
      if(n.questionId && impactedQuestionIds.includes(n.questionId)) set.add(n.id)
      if(impactedVisitTypeId && n.visitTypeId===impactedVisitTypeId) set.add(n.id)
    })
    return set
  }, [ws, impactedQuestionIds, impactedVisitTypeId])
  const displayNodes = useMemo(()=> rfNodes.map(n=> ({...n, className: impactedNodeIds.has(n.id)? [n.className,'impact-highlight'].filter(Boolean).join(' '): n.className })), [rfNodes, impactedNodeIds])

  return (
    <div className="canvas" ref={wrapper} onDragOver={handleDragOver} onDrop={handleDrop}
      onMouseDown={(e)=>{ if(e.target===wrapper.current){ setDragSelecting({x:e.clientX,y:e.clientY}); setMulti([]) } }}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onContextMenu={(e)=>{ e.preventDefault(); const target = (e.target as HTMLElement).closest('.react-flow__node'); if(target){ const id = target.getAttribute('data-id')||target.getAttribute('id')||undefined; setCtxMenu({ x:e.clientX, y:e.clientY, nodeId:id||undefined }) } else { const edgeEl = (e.target as HTMLElement).closest('.react-flow__edge'); if(edgeEl){ const id=edgeEl.getAttribute('data-id')||undefined; setCtxMenu({x:e.clientX,y:e.clientY, edgeId:id}) } else setCtxMenu(null) } }}
    >
      {ws ? (
        <ReactFlow nodes={displayNodes} edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onInit={(inst)=>{ rfRef.current = inst }}
          fitView
          edgeUpdaterRadius={24}
        >
          <MiniMap pannable zoomable />
          <Controls />
          <Background gap={24} size={1}/>
          <FlowTools />
          <div className="snap-indicator">Snap: {snap? 'ON':'OFF'} (g)</div>
          {guides.x.map((x,i)=>(<div key={'gx'+i} className="guide-vert" data-pos={x} />))}
          {guides.y.map((y,i)=>(<div key={'gy'+i} className="guide-horz" data-pos={y} />))}
          {dragSelecting && <div className="marquee" ref={marqueeRef}></div>}
          {ctxMenu && <div className="context-menu" data-x={ctxMenu.x} data-y={ctxMenu.y}>
            {ctxMenu.nodeId && <NodeContextActions id={ctxMenu.nodeId} onClose={()=>setCtxMenu(null)} />}
            {ctxMenu.edgeId && <EdgeContextActions id={ctxMenu.edgeId} onClose={()=>setCtxMenu(null)} />}
          </div>}
        </ReactFlow>
      ) : (
        <div className="empty">Create a workspace (Toolbar → New) or Import a .esqproj</div>
      )}
    </div>
  )
}