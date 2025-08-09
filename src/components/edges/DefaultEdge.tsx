import React, { useState } from 'react'
import { BaseEdge, EdgeLabelRenderer, getBezierPath, EdgeProps } from 'reactflow'

export default function DefaultEdge(props: EdgeProps){
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, markerEnd, selected, data } = props
  const [path, centerX, centerY] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition })
  const hasConds = !!data?.hasConds
  return (
    <>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} style={{ stroke: hasConds? '#5b8dd9':'#4a5d72', strokeWidth:2, opacity: selected?1:0.9 }} />
      <EdgeLabelRenderer>
        <div className="edge-actions" data-x={centerX} data-y={centerY} data-center>
          <button className="edge-btn add-cond" data-edge={id} title={hasConds? 'Edit Conditions':'Add Conditions'} onClick={(e)=>{ e.stopPropagation(); (window as any).__addEdgeCondition?.(id) }}>⚙</button>
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
