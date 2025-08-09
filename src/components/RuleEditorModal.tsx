import React, { useMemo, useState } from 'react'
import { useEditor } from '../state/store'
import type { Rule, Condition } from '../core/schemas'

interface Props { ruleId:string; onClose:()=>void }

export default function RuleEditorModal({ ruleId, onClose }:Props){
  const { ws, updateRule } = useEditor()
  const rule = ws?.rules.find(r=>r.id===ruleId)
  const [mode,setMode]=useState<'all'|'any'>((rule?.any&&rule.any.length>0)?'any':'all')
  const [all,setAll]=useState<Condition[]>(rule?.all||[])
  const [any,setAny]=useState<Condition[]>(rule?.any||[])
  const [not,setNot]=useState<Condition[]>(rule?.not||[])
  const questions = ws?.questions||[]

  const targetVisitTypeId = (rule?.action.type==='SetVisitType' && (rule.action as any).visitTypeId) ? (rule!.action as any).visitTypeId : ''
  const [visitTypeId,setVisitTypeId]=useState<string>(targetVisitTypeId)

  const activeList = mode==='all'? all : any
  const setActiveList = (lst:Condition[])=> mode==='all'? setAll(lst): setAny(lst)

  const addCond = ()=> setActiveList([ ...activeList, { questionId:'', comparator:'eq', value:'' } as Condition ])
  const updateCond = (i:number, patch:Partial<Condition>)=> setActiveList(activeList.map((c,idx)=> idx===i? {...c, ...patch}: c))
  const removeCond = (i:number)=> setActiveList(activeList.filter((_,idx)=> idx!==i))

  const save = ()=>{
    if(!rule) return
    const patch: Partial<Rule> = { id: rule.id, all: mode==='all'? all: undefined, any: mode==='any'? any: undefined, not: not.length? not: undefined, action:{ type:'SetVisitType', visitTypeId } as any }
    updateRule(patch as any)
    onClose()
  }

  if(!rule) return null
  return (
    <div className="modal-overlay rule-editor">
      <div className="modal rule-modal">
        <div className="modal-header">
          <h3>Edit Rule</h3>
          <button onClick={onClose}>✕</button>
        </div>
        <div className="re-layout">
          <div className="re-left">
            <div className="block">
              <label>Name</label>
              <div className="name-read">{rule.id}</div>
              <label>Mode</label>
              <div className="mode-toggle">
                <button className={mode==='all'? 'active':''} onClick={()=>setMode('all')}>AND (All)</button>
                <button className={mode==='any'? 'active':''} onClick={()=>setMode('any')}>OR (Any)</button>
              </div>
              <label>Target Visit Type</label>
              <select aria-label="Target Visit Type" value={visitTypeId} onChange={e=>setVisitTypeId(e.target.value)}>
                <option value="">Select…</option>
                {ws?.visitTypes.map(v=> <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div className="block minor">
              <label>NOT Conditions</label>
              {(not||[]).map((c,i)=>
                <div key={i} className="cond-row">
                  <select aria-label="NOT Question" value={c.questionId} onChange={e=> setNot(not.map((x,idx)=> idx===i? {...x, questionId:e.target.value}: x))}>
                    <option value="">Question…</option>
                    {questions.map(q=> <option key={q.id} value={q.id}>{q.name}</option>)}
                  </select>
                  <select aria-label="NOT Comparator" value={c.comparator} onChange={e=> setNot(not.map((x,idx)=> idx===i? {...x, comparator:e.target.value as any}: x))}>
                    <option value="eq">=</option><option value="neq">≠</option><option value="gt">&gt;</option><option value="lt">&lt;</option><option value="gte">≥</option><option value="lte">≤</option><option value="contains">contains</option><option value="in">in</option><option value="notin">not in</option><option value="isEmpty">isEmpty</option><option value="isNotEmpty">notEmpty</option>
                  </select>
                  {!(c.comparator==='isEmpty'||c.comparator==='isNotEmpty') && <input value={(c.value as any)||''} placeholder="Value" onChange={e=> setNot(not.map((x,idx)=> idx===i? {...x, value:e.target.value}: x))} />}
                  <button onClick={()=> setNot(not.filter((_,idx)=> idx!==i))}>✕</button>
                </div>
              )}
              <button onClick={()=> setNot([...(not||[]), { questionId:'', comparator:'eq', value:'' } as Condition])}>+ NOT Condition</button>
            </div>
          </div>
          <div className="re-main">
            <div className="cond-header">Conditions ({mode==='all'? 'ALL must match':'ANY may match'})</div>
            <div className="cond-list">
              {activeList.map((c,i)=>
                <div key={i} className="cond-row">
                  <div className="ln">{i+1}</div>
                  <select aria-label="Question" value={c.questionId} onChange={e=> updateCond(i,{questionId:e.target.value})}>
                    <option value="">Question…</option>
                    {questions.map(q=> <option key={q.id} value={q.id}>{q.name}</option>)}
                  </select>
                  <select aria-label="Comparator" value={c.comparator} onChange={e=> updateCond(i,{comparator:e.target.value as any})}>
                    <option value="eq">=</option><option value="neq">≠</option><option value="gt">&gt;</option><option value="lt">&lt;</option><option value="gte">≥</option><option value="lte">≤</option><option value="contains">contains</option><option value="in">in</option><option value="notin">not in</option><option value="isEmpty">isEmpty</option><option value="isNotEmpty">notEmpty</option>
                  </select>
                  {!(c.comparator==='isEmpty'||c.comparator==='isNotEmpty') && <input value={(c.value as any)||''} placeholder="Value" onChange={e=> updateCond(i,{value:e.target.value})} />}
                  <button onClick={()=> removeCond(i)}>✕</button>
                </div>
              )}
            </div>
            <div className="cond-actions">
              <button onClick={addCond}>+ Condition</button>
            </div>
          </div>
          <div className="re-right">
            <div className="prop-panel">
              <div className="prop-hdr">Questions</div>
              <div className="prop-list">
                {questions.map(q=> <div key={q.id} className="prop-item" onClick={()=>{ addCond(); updateCond(activeList.length,{questionId:q.id}) }}>{q.name}</div>)}
              </div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={save} className="btn primary">Save</button>
          <button onClick={onClose} className="btn outline">Cancel</button>
        </div>
      </div>
    </div>
  )
}
