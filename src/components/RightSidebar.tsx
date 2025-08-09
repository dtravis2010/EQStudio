import React from 'react'
import { useSelection, useEditor } from '../state/store'

export default function RightSidebar(){
  const selNode = useSelection(s=>s.selectedNodeId)
  const selEdge = useSelection(s=>s.selectedEdgeId)
  const ws = useEditor(s=>s.ws)
  if(!ws) return <div className="content minihelp">Create a workspace.</div>
  return (
    <div className="content rightbar-content">
      <h4>Details</h4>
      {selNode && <div className="minihelp">Node ID: {selNode}</div>}
      {selEdge && <div className="minihelp">Edge ID: {selEdge}</div>}
      {!selNode && !selEdge && <div className="minihelp">Select a node or edge for details.</div>}
    </div>
  )
}
