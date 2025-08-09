import React from "react";
import { Handle, Position } from "reactflow";

const colorClass = (c?: string)=>{
  switch((c||'').toLowerCase()){
    case 'teal': return 'c-teal'
    case 'blue': return 'c-blue'
    case 'purple': return 'c-purple'
    case 'orange': return 'c-orange'
    default: return ''
  }
}

const Panel = ({ title, variant, subtitle, shape, color }:{ title:string; variant:'start'|'end'|'question'|'vt'|'gate'|'pool'; subtitle?:string; shape?:'rect'|'pill'; color?:string })=>{
  const cls = [ 'node-box', `is-${variant}`, shape==='pill'?'pill':'', colorClass(color) ].filter(Boolean).join(' ')
  return (
    <div className={cls}>
      <div className="node-title">{title}</div>
      {subtitle && <div className="node-sub">{subtitle}</div>}
    </div>
  )
}

export const StartNode = ({ data }: any) => (
  <div className="node start">
    <Panel title="Start" variant="start"/>
    <Handle type="source" position={Position.Right} />
  </div>
);

export const EndNode = ({ data }: any) => (
  <div className="node end">
    <Panel title="End" variant="end"/>
    <Handle type="target" position={Position.Left} />
  </div>
);

export const QuestionNode = ({ data }: any) => (
  <div className="node question">
    <Panel title={data?.label || 'Question'} variant="question" shape={data?.shape} color={data?.color}/>
    <Handle type="target" position={Position.Left} />
    <Handle type="source" position={Position.Right} />
  </div>
);

export const VisitTypeNode = ({ data }: any) => (
  <div className="node vt">
    <Panel title="VisitType" variant="vt" subtitle={data?.vt} shape={data?.shape} color={data?.color}/>
    <Handle type="target" position={Position.Left} />
    <Handle type="source" position={Position.Right} />
  </div>
);

export const PoolNode = ({ data }: any) => (
  <div className="node pool">
    <Panel title="Pool" variant="pool" subtitle={data?.pool} shape={data?.shape} color={data?.color}/>
    <Handle type="target" position={Position.Left} />
    <Handle type="source" position={Position.Right} />
  </div>
);

export const GateNode = ({ data }: any) => (
  <div className="node gate diamond">
    <div className="diamond-shape"></div>
    <Handle type="target" position={Position.Left} />
    <Handle type="source" position={Position.Right} />
  </div>
);