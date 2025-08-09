import React, { useCallback, useEffect, useRef, useState } from 'react'

interface SplitPaneProps {
  a: React.ReactNode
  b: React.ReactNode
  direction?: 'horizontal' | 'vertical' // horizontal = stacked (a on top), vertical = side by side
  initialA?: number // px size of pane A
  minA?: number
  minB?: number
  id?: string // persist size key
  className?: string
}

// Generic resizable split pane (no external deps) using flex layout
export default function SplitPane({ a, b, direction='vertical', initialA=240, minA=160, minB=160, id, className }: SplitPaneProps){
  const key = id? `sp:${id}`: undefined
  const stored = (key && typeof window!=='undefined') ? Number(localStorage.getItem(key)||'') : undefined
  const [aSize,setASize] = useState<number>(stored && !isNaN(stored)? stored: initialA)
  const ref = useRef<HTMLDivElement|null>(null)
  const dragging = useRef(false)

  const onMove = useCallback((e:MouseEvent)=>{
    if(!dragging.current || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    let next = direction==='vertical'? (e.clientX - rect.left) : (e.clientY - rect.top)
    const max = direction==='vertical'? rect.width : rect.height
    if(next < minA) next = minA
    if(next > max - (minB)) next = max - (minB)
    setASize(next)
  },[direction,minA,minB])

  const stop = useCallback(()=>{ if(dragging.current){ dragging.current=false; if(key) try{ localStorage.setItem(key, String(aSize)) }catch{} } },[aSize,key])

  useEffect(()=>{
    const up = ()=> stop()
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', up)
    window.addEventListener('mouseleave', up)
    return ()=>{ window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', up); window.removeEventListener('mouseleave', up) }
  },[onMove, stop])

  const startDrag = ()=>{ dragging.current=true }

  const applySizeVar = ()=>{ if(!ref.current) return; ref.current.style.setProperty('--sp-a-size', aSize+'px') }
  useEffect(()=>{ applySizeVar() },[aSize])
  const resetSize = ()=>{ setASize(initialA); if(key) try{ localStorage.setItem(key, String(initialA)) }catch{} }
  const onDividerKey = (e:React.KeyboardEvent)=>{ if(e.key==='Enter' || e.key===' ') { e.preventDefault(); resetSize() } if(e.key==='ArrowLeft' && direction==='vertical'){ setASize(s=> Math.max(minA, s-16)) } if(e.key==='ArrowRight' && direction==='vertical'){ setASize(s=> Math.min(s+16, (ref.current?.getBoundingClientRect().width||s)-minB)) } }

  const styleA = direction==='vertical'? { width:aSize } : { height:aSize }
  const dirCls = direction==='vertical'? 'sp-vert':'sp-horiz'

  return (
    <div className={`split-pane ${dirCls} ${className||''}`} ref={ref}>
      <div className="sp-pane sp-pane-a" data-size={aSize} data-dir={direction}>
        {a}
      </div>
      <div className="sp-divider" role="separator" tabIndex={0} title="Drag to resize • Double-click / Enter to reset" onDoubleClick={resetSize} onKeyDown={onDividerKey} {...(direction==='vertical'? { 'aria-orientation':'vertical'}: { 'aria-orientation':'horizontal'})} onMouseDown={startDrag} />
      <div className="sp-pane sp-pane-b">
        {b}
      </div>
    </div>
  )
}
