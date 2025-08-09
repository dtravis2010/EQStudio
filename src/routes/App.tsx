import { LeftNav, EditorCanvas, Inspector, Toolbar, RightSidebar, FooterStatus, ShortcutsModal } from '@components'
import { useEffect } from 'react'
import { useEditor, loadLastWorkspace } from '../state/store'
import SplitPane from '../components/layout/SplitPane'

export default function App(){
  const { ws, setWorkspace } = useEditor()

  useEffect(()=>{
    if(!ws){
      const last = loadLastWorkspace()
      if(last) setWorkspace(last)
    }
  }, [ws, setWorkspace])

  useEffect(()=>{
    document.body.classList.add('epic')
    return ()=>{ document.body.classList.add('epic') }
  },[])

  return (
    <div className="app">
      <div className="brandbar"></div>
      <div className="context-header">ENV: Dev  |  User: You  |  {new Date().toLocaleDateString()}</div>
      <Toolbar/>
      <div className="body layout-flex">
        <SplitPane id="main" a={<div className="panel panel-side leftnav"><LeftNav/></div>} b={
          <SplitPane id="mid" a={<div className="panel panel-canvas"><EditorCanvas/></div>} b={<div className="side-stack"><div className="panel panel-side inspector"><Inspector/></div><div className="panel panel-side rightbar"><RightSidebar/></div></div>} />
        } />
      </div>
      <FooterStatus />
      <ShortcutsModal />
    </div>
  )
}
