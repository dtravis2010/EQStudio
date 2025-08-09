
import { Workspace } from '../schemas'

function toCsv(rows: string[][]){
  return rows.map(r=>r.map(v => `"${(v??'').toString().replace(/"/g,'""')}"`).join(',')).join('\n')
}

export function exportQuestionsCsv(ws: Workspace){
  const rows: string[][] = [["id","name","prompt","type","required","options"]]
  ws.questions.forEach(q=>{
    const opts = (q.options||[]).map(o=>o.label).join('|')
    rows.push([q.id, q.name, q.prompt, q.type, q.validation?.required?'true':'', opts])
  })
  const blob = new Blob([toCsv(rows)], { type: 'text/csv' })
  return { blob, name: `${ws.name}-questions.csv` }
}

export function exportRulesCsv(ws: Workspace){
  const rows: string[][] = [["edgeId","ruleId","label","logic_json","action_json"]]
  ws.edges.forEach(e=>{
    (e.conditions||[]).forEach(r=>{
      rows.push([e.id, r.id, e.label||'', JSON.stringify({all:r.all,any:r.any,not:r.not}), JSON.stringify(r.action)])
    })
  })
  const blob = new Blob([toCsv(rows)], { type: 'text/csv' })
  return { blob, name: `${ws.name}-rules.csv` }
}
