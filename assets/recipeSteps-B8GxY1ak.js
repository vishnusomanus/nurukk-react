function c(r){const t=String(r??"").trim();if(!t)return[{heading:"",content:""}];const e=t.split(/(?=^\s*\d+[\).\s:-]+)/m).map(o=>o.trim()).filter(Boolean).map(o=>{const i=o.replace(/^\s*\d+[\).\s:-]+\s*/,"").trim().split(/\n/).map(s=>s.trim()).filter(Boolean);return i.length===0?{heading:"",content:""}:i.length===1?{heading:i[0],content:""}:{heading:i[0],content:i.slice(1).join(`
`)}});return e.length>0?e:[{heading:"",content:""}]}function u(r){return r.map(t=>{const n=t.heading.trim(),e=t.content.trim();return!n&&!e?"":n&&e?`${n}
${e}`:n||e}).filter(Boolean).map((t,n)=>`${n+1}. ${t}`).join(`

`)}function m(r){return r.some(t=>t.heading.trim()||t.content.trim())}export{u as a,c as i,m as r};
