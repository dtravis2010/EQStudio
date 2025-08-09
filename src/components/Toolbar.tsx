import { useEditor } from '../state/store'
import { exportEsqproj } from '../core/io/exportEsqproj'
import { exportQuestionsCsv, exportRulesCsv } from '../core/io/exportCsv'
import { exportHtmlSpec } from '../core/io/exportHtmlSpec'
import { saveAs } from 'file-saver'
import { validate } from '../core/validators'
import React from 'react'

export default function Toolbar(){
  const { ws, newWorkspace, save, setWorkspace, undo, redo } = useEditor()

  const onExport = ()=>{
    if(!ws) return
    const { blob, name } = exportEsqproj(ws)
    saveAs(blob, name)
  }
  const onImport = async (e: any)=>{
    const file = e.target.files?.[0]; if(!file) return
    const txt = await file.text()
    try{
      const parsed = JSON.parse(txt)
      setWorkspace(parsed)
    }catch(err){
      alert('Invalid .esqproj JSON')
    }
  }
  const onValidate = ()=>{
    if(!ws) return
    const issues = validate(ws)
    if(issues.length===0) alert('No issues found 🎉')
    else alert(issues.map(i=>`${i.kind.toUpperCase()} ${i.code}: ${i.message}`).join('\n'))
  }
  const onSpec = ()=>{
    if(!ws) return
    const { blob, name } = exportHtmlSpec(ws)
    saveAs(blob, name)
  }
  const onCsvQ = ()=>{
    if(!ws) return
    const { blob, name } = exportQuestionsCsv(ws); saveAs(blob, name)
  }
  const onCsvR = ()=>{
    if(!ws) return
    const { blob, name } = exportRulesCsv(ws); saveAs(blob, name)
  }

  return (
    <div className="toolbar">
      <button onClick={()=>{ const n = prompt('Workspace name?','New Workspace'); if(n) newWorkspace(n) }}>New</button>
      <button onClick={()=>save()}>Save</button>
      <button onClick={()=>undo()} title="Undo (Ctrl+Z)">Undo</button>
      <button onClick={()=>redo()} title="Redo (Ctrl+Y)">Redo</button>
      <label className="filebtn">
        <span>Import .esqproj</span>
        <input type="file" accept=".esqproj,.json" hidden onChange={onImport}/>
      </label>
      <button onClick={onExport}>Export .esqproj</button>
      <button onClick={onSpec}>Export Spec (HTML)</button>
      <button onClick={onCsvQ}>Export Questions CSV</button>
      <button onClick={onCsvR}>Export Rules CSV</button>
      <div className="spacer"></div>
      <button onClick={onValidate}>Validate</button>
      <div className="group">
        {/* Epic UI always active */}
      </div>
    </div>
  )
}
