import React, { useEffect, useState } from 'react'
import { useEditor } from '../state/store'
import { validate } from '../core/validators'

export default function FooterStatus(){
  const ws = useEditor(s=>s.ws)
  const [issues, setIssues] = useState(0)
  useEffect(()=>{ if(ws){ setIssues(validate(ws).length) } }, [ws])
  return (
    <div className="footer-status">
      <div>Issues: {ws? issues: '-'}</div>
      <div>{ws? 'Workspace: '+ws.name : 'No workspace'}</div>
      <div className="hint">F1: Shortcuts</div>
    </div>
  )
}
