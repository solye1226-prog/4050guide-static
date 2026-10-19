const section=(heading,...paragraphs)=>`<h2>${heading}</h2>${paragraphs.map(p=>p.startsWith('<')?p:`<p>${p}</p>`).join('')}`;
const table=(caption,headers,rows)=>`<div class="verified-table" tabindex="0" role="region" aria-label="${caption}"><table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(x=>`<td>${x}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const post=(slug,title,category,intro,sections,faq,sources,related)=>({slug,title,category,label:{license:'자격증 취득',rejob:'재취업',support:'국비지원',money:'생활경제',welfare:'부모님 복지'}[category],description:intro,intro,body:sections.map(s=>section(...s)).join('\n'),faq,sources,related,verifiedAt:'2026-10-19',keepFigures:false});
module.exports={post,table,section};
