import React, { useState } from 'react'
import { useEditor, useSelection } from '../state/store'
import { useReactFlow } from 'reactflow'

// Compact floating toolbar of flow-specific tools
export default function FlowTools(){
  const { ws, addNode, updateNode } = useEditor()
  const rf = useReactFlow()
  const [expanded, setExpanded] = useState(true)
  const [vtMenu, setVtMenu] = useState(false)
  const [poolMenu, setPoolMenu] = useState(false)
  const [showGuides, setShowGuides] = useState(true)
  const selection = useSelection(s=>s.multiNodeIds)
  const setSelection = useSelection(s=>s.setMultiNodes)

  if(!ws) return null

  const addQuestion = ()=> addNode({ kind:'Question', position:centerPos() })
  const addGate = ()=> addNode({ kind:'Gate', position:centerPos() })
  const addVisitType = (id:string)=>{ if(!id) return; addNode({ kind:'VisitType', visitTypeId:id, position:centerPos() }); setVtMenu(false) }
  const addPool = (id:string)=>{ if(!id) return; addNode({ kind:'Pool', poolId:id, position:centerPos() }); setPoolMenu(false) }
  const selectAll = ()=>{ if(!ws) return; setSelection(ws.nodes.map(n=>n.id)) }

  function centerPos(){
    try{
      const { x, y, zoom } = rf.getViewport()
      // place roughly center of view
      const dom = (rf as any).domNode?.getBoundingClientRect?.() || { width:600, height:400 }
      return { x: -x + (dom.width/2)/zoom, y: -y + (dom.height/2)/zoom }
    }catch{ return { x:120, y:120 } }
  }

  const autoLayout = ()=>{
    if(!ws) return
    // naive layered layout: keep existing order, position in columns
    const spacingX = 220, spacingY = 140
    ws.nodes.forEach((n, idx)=>{
      const col = Math.floor(idx/6)
      const row = idx % 6
      updateNode({ id:n.id, position:{ x: 80 + col*spacingX, y: 60 + row*spacingY } })
    })
  }

  const fit = ()=> rf.fitView({ padding:0.15 })
  const zoomIn = ()=> rf.zoomIn?.()
  const zoomOut = ()=> rf.zoomOut?.()

  return (
    <div className={`flow-tools ${expanded? 'open':'closed'}`}>
      <button className="toggle" onClick={()=>setExpanded(e=>!e)} title="Toggle Tools">{expanded? '✕':'≡'}</button>
      {expanded && (
        <div className="tool-groups">
          <div className="grp">
            <div className="hdr">Add</div>
            <button onClick={addQuestion} title="Add Question (n)">Q</button>
            <button onClick={addGate} title="Add Gate (g)">G</button>
            <div className="menu-wrapper">
              <button onClick={()=>setVtMenu(v=>!v)} title="Add Visit Type node">VT ▾</button>
              {vtMenu && <div className="menu">
                {ws.visitTypes.length===0 && <div className="empty">No visit types</div>}
                {ws.visitTypes.map(v=> <div key={v.id} className="menu-item" onClick={()=>addVisitType(v.id)}>{v.name}</div>)}
              </div>}
            </div>
            <div className="menu-wrapper">
              <button onClick={()=>setPoolMenu(p=>!p)} title="Add Pool node">Pool ▾</button>
              {poolMenu && <div className="menu">
                {ws.pools.length===0 && <div className="empty">No pools</div>}
                {ws.pools.map(p=> <div key={p.id} className="menu-item" onClick={()=>addPool(p.id)}>{p.name}</div>)}
              </div>}
            </div>
          </div>
          <div className="grp">
            <div className="hdr">View</div>
            <button onClick={fit} title="Fit View">Fit</button>
            <button onClick={zoomIn} title="Zoom In">+</button>
            <button onClick={zoomOut} title="Zoom Out">-</button>
          </div>
          <div className="grp">
            <div className="hdr">Layout</div>
            <button onClick={autoLayout} title="Auto Layout (naive)">Auto</button>
          </div>
          <div className="grp">
            <div className="hdr">Select</div>
            <button onClick={selectAll} title="Select All Nodes">All</button>
            <button onClick={()=>setShowGuides(g=>!g)} title="Toggle Alignment Guides">Guides {showGuides? '✓':'✗'}</button>
          </div>
        </div>
      )}
    </div>
  )
}
