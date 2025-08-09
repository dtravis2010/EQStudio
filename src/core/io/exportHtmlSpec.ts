
  import { Workspace } from '../schemas'
  export function exportHtmlSpec(ws: Workspace){
    const rows = ws.questions.map(q => `
      <tr>
        <td>${q.name}</td>
        <td>${q.prompt}</td>
        <td>${q.type}</td>
        <td>${q.options?.map(o=>o.label).join(', ')||''}</td>
        <td>${q.validation?.required?'Required':''}</td>
      </tr>
    `).join('')
    const edges = ws.edges.map(e=> `
      <tr>
        <td>${e.id}</td><td>${e.from} → ${e.to}</td><td>${e.label||''}</td>
        <td><pre>${JSON.stringify(e.conditions||[], null, 2)}</pre></td>
      </tr>
    `).join('')

    const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<title>${ws.name} – Spec</title>
<style>
  body { font-family: Segoe UI, Tahoma, sans-serif; margin: 24px; }
  .brand { height:6px; background: linear-gradient(90deg, #005a9e, #2a9d8f); margin-bottom:16px; }
  h1 { margin: 8px 0 4px; }
  .meta { color:#444; font-size:12px }
  table { border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 13px }
  th, td { border: 1px solid #ccc; padding: 6px; text-align: left; vertical-align: top; }
  @media print { .noprint { display: none; } }
</style>
</head>
<body>
  <div class="brand"></div>
  <button class="noprint" onclick="window.print()">Print / Save PDF</button>
  <h1>${ws.name}</h1>
  <div class="meta"><b>Created:</b> ${ws.createdAt} &nbsp; <b>Updated:</b> ${ws.updatedAt}</div>

  <h2>Questions</h2>
  <table>
    <thead><tr><th>Name</th><th>Prompt</th><th>Type</th><th>Options</th><th>Validation</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>

  <h2>Edges & Rules</h2>
  <table>
    <thead><tr><th>ID</th><th>From → To</th><th>Label</th><th>Rules</th></tr></thead>
    <tbody>${edges}</tbody>
  </table>

  <h2>Visit Types</h2>
  <ul>${ws.visitTypes.map(v=>`<li>${v.name}${v.category?` (${v.category})`:''}</li>`).join('')}</ul>

  <h2>Scheduling Pools</h2>
  <ul>${ws.pools.map(p=>`<li>${p.name}${p.category?` (${p.category})`:''}</li>`).join('')}</ul>
</body></html>`
    const blob = new Blob([html], { type: 'text/html' })
    return { blob, name: `${ws.name}-spec.html` }
  }
