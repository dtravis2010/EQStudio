import React, { useEffect, useState } from 'react'

export default function ShortcutsModal(){
  const [open, setOpen] = useState(false)
  useEffect(()=>{
    const handler = (e:KeyboardEvent)=>{ if(e.key==='F1'){ e.preventDefault(); setOpen(o=>!o) } }
    window.addEventListener('keydown', handler)
    return ()=>window.removeEventListener('keydown', handler)
  },[])
  if(!open) return null
  return (
    <div className="modal-overlay" onClick={()=>setOpen(false)}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <h3>Shortcuts</h3>
        <ul>
          <li><b>N</b> Add Question Node</li>
          <li><b>G</b> Toggle Snap</li>
          <li><b>Arrow Keys</b> Move selected</li>
          <li><b>Shift + Click</b> Multi-select</li>
          <li><b>F1</b> Toggle this help</li>
          <li><b>Ctrl/Cmd + Z</b> Undo</li>
          <li><b>Ctrl/Cmd + Y</b> Redo</li>
        </ul>
        <button onClick={()=>setOpen(false)}>Close</button>
      </div>
    </div>
  )
}
