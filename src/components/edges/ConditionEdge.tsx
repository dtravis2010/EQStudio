import React from 'react'
import { BaseEdge, EdgeProps, getBezierPath } from 'reactflow'

export default function ConditionEdge(props: EdgeProps){
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, markerEnd } = props
  const [path] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition })
  return (
    <>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} style={{ stroke:'#5b8dd9', strokeWidth:2 }}/>
      <g>
        <circle r={10} cx={(sourceX+targetX)/2} cy={(sourceY+targetY)/2} fill="#233646" stroke="#5b8dd9" strokeWidth={2} />
        <text x={(sourceX+targetX)/2} y={(sourceY+targetY)/2+4} fontSize={10} textAnchor="middle" fill="#d5e5ef">C</text>
      </g>
    </>
  )
}
