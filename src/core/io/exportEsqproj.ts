
import { Workspace } from '../schemas'
export function exportEsqproj(ws: Workspace){
  const blob = new Blob([JSON.stringify(ws, null, 2)], { type: 'application/json' })
  const name = `${ws.name}.esqproj`
  return { blob, name }
}
