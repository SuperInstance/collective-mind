interface Env { MIND_KV: KVNamespace; DEEPSEEK_API_KEY?: string; }

const CSP: Record<string, string> = { 'default-src': "'self'", 'script-src': "'self' 'unsafe-inline' 'unsafe-eval'", 'style-src': "'self' 'unsafe-inline'", 'img-src': "'self' data: https:", 'connect-src': "'self' https://api.deepseek.com https://*" };

function json(data: unknown, s = 200) { return new Response(JSON.stringify(data), { status: s, headers: { 'Content-Type': 'application/json', ...CSP } }); }

async function callLLM(key: string, system: string, user: string, model = 'deepseek-chat', max = 1500): Promise<string> {
  const resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST', headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages: [{ role: 'system', content: system }, { role: 'user', content: user }], max_tokens: max, temperature: 0.7 })
  });
  return (await resp.json()).choices?.[0]?.message?.content || '';
}

function stripFences(t: string): string {
  t = t.trim();
  while (t.startsWith('```')) { t = t.split('\n').slice(1).join('\n'); }
  while (t.endsWith('```')) { t = t.slice(0, -3).trim(); }
  return t;
}

interface Fragment { id: string; vessel: string; content: string; tags: string[]; ts: string; }
interface Insight { id: string; description: string; sourceVessels: string[]; sourceFragments: string[]; novelty: number; ts: string; }

function getLanding(): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Collective Mind — Cocapn</title><style>
body{font-family:system-ui,sans-serif;background:#0a0a0f;color:#e0e0e0;margin:0;min-height:100vh}
.container{max-width:800px;margin:0 auto;padding:40px 20px}
h1{color:#c084fc;font-size:2.2em}a{color:#c084fc;text-decoration:none}
.sub{color:#8A93B4;margin-bottom:2em}
.card{background:#16161e;border:1px solid #2a2a3a;border-radius:12px;padding:24px;margin:20px 0}
.card h3{color:#c084fc;margin:0 0 12px 0}
.btn{background:#c084fc;color:#0a0a0f;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-weight:bold}
.btn:hover{background:#a855f7}
textarea,input{background:#0a0a0f;color:#e0e0e0;border:1px solid #2a2a3a;border-radius:8px;padding:10px;width:100%;box-sizing:border-box}
.insight{padding:16px;background:#1a1a2a;border-left:3px solid #c084fc;margin:8px 0;border-radius:0 8px 8px 0}
.insight .vessels{color:#8A93B4;font-size:.8em}.novelty{font-weight:bold;color:#22c55e}
.fragment{padding:8px;background:#0a1a1a;border-left:2px solid #64748b;margin:4px 0;border-radius:0 6px 6px 0;font-size:.85em;color:#8A93B4}
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:20px 0}
.stat{text-align:center;padding:16px;background:#16161e;border-radius:8px;border:1px solid #2a2a3a}
.stat .num{font-size:2em;color:#c084fc;font-weight:bold}.stat .label{color:#8A93B4;font-size:.8em}
</style></head><body><div class="container">
<h1>🧠 Collective Mind</h1><p class="sub">Patterns hidden across 130+ vessels — insights no single agent could see.</p>
<div class="stats"><div class="stat"><div class="num" id="fragments">0</div><div class="label">Fragments</div></div>
<div class="stat"><div class="num" id="insights">0</div><div class="label">Insights</div></div>
<div class="stat"><div class="num" id="syntheses">0</div><div class="label">Syntheses</div></div></div>
<div class="card"><h3>Submit Knowledge Fragment</h3>
<input id="vessel" placeholder="Vessel name">
<textarea id="fragment" rows="2" placeholder="A piece of knowledge, pattern, or observation from this vessel..." style="margin-top:8px"></textarea>
<div style="margin-top:12px"><button class="btn" onclick="submitFragment()">Submit</button></div></div>
<div class="card"><h3>Forge Insight</h3>
<textarea id="query" rows="2" placeholder="Ask the collective mind a question, or type 'auto' to auto-synthesize..."></textarea>
<div style="margin-top:12px"><button class="btn" onclick="forge()">Forge Insight</button></div></div>
<div id="insightsList" class="card"><h3>Collective Insights</h3><p style="color:#8A93B4">Loading...</p></div>
<script>
async function load(){try{const[f,i]=await Promise.all([fetch('/api/fragments'),fetch('/api/insights')]);
const frags=await f.json(),ins=await i.json();
document.getElementById('fragments').textContent=frags.length;
document.getElementById('insights').textContent=ins.length;
document.getElementById('syntheses').textContent=ins.filter(x=>x.novelty>=0.7).length;
const el=document.getElementById('insightsList');
if(!ins.length)el.innerHTML='<h3>Collective Insights</h3><p style="color:#8A93B4">No insights yet. Submit fragments and forge.</p>';
else el.innerHTML='<h3>Collective Insights ('+ins.length+')</h3>'+ins.map(x=>'<div class="insight"><span class="novelty">'+(x.novelty*100).toFixed(0)+'% novel</span><br>'+x.description+'<br><span class="vessels">'+x.sourceVessels.join(' + ')+'</span></div>').join('');}catch(e){}}
async function submitFragment(){const v=document.getElementById('vessel').value.trim(),f=document.getElementById('fragment').value.trim();
if(!v||!f)return;await fetch('/api/fragment',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({vessel:v,content:f})});
document.getElementById('fragment').value='';load();}
async function forge(){const q=document.getElementById('query').value.trim();if(!q)return;
const r=await fetch('/api/forge',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:q})});
const p=await r.json();
if(p.error)alert(p.error);
else{document.getElementById('query').value='';load();}
}
load();</script>
<div style="text-align:center;padding:24px;color:#475569;font-size:.75rem"><a href="https://the-fleet.casey-digennaro.workers.dev" style="color:#64748b">The Fleet</a> · <a href="https://cocapn.ai" style="color:#64748b">Cocapn</a></div>
</div></body></html>`;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname === '/health') return json({ status: 'ok', vessel: 'collective-mind' });
    if (url.pathname === '/vessel.json') return json({ name: 'collective-mind', type: 'cocapn-vessel', version: '1.0.0', description: 'Cross-vessel pattern discovery — insights no single agent could see', fleet: 'https://the-fleet.casey-digennaro.workers.dev', capabilities: ['cross-vessel-patterns', 'collective-intelligence', 'hidden-insight-discovery'] });

    if (url.pathname === '/api/fragments') return json((await env.MIND_KV.get('fragments', 'json') as Fragment[] || []).slice(0, 50));
    if (url.pathname === '/api/insights') return json((await env.MIND_KV.get('insights', 'json') as Insight[] || []).slice(0, 20));

    if (url.pathname === '/api/fragment' && req.method === 'POST') {
      const { vessel, content } = await req.json() as { vessel: string; content: string };
      if (!vessel || !content) return json({ error: 'vessel and content required' }, 400);
      const fragments = await env.MIND_KV.get('fragments', 'json') as Fragment[] || [];
      fragments.unshift({
        id: Date.now().toString(), vessel: vessel.substring(0, 50),
        content: content.substring(0, 500), tags: [], ts: new Date().toISOString()
      });
      if (fragments.length > 200) fragments.length = 200;
      await env.MIND_KV.put('fragments', JSON.stringify(fragments));
      return json({ logged: true });
    }

    if (url.pathname === '/api/forge' && req.method === 'POST') {
      const { query } = await req.json() as { query: string };
      if (!query || !env.DEEPSEEK_API_KEY) return json({ error: 'query and API key required' }, 400);

      const fragments = await env.MIND_KV.get('fragments', 'json') as Fragment[] || [];
      if (fragments.length < 5) return json({ error: 'need 5+ knowledge fragments first' }, 400);

      // Select diverse fragments (pick from different vessels)
      const vesselSet = new Map<string, Fragment>();
      for (const f of fragments) {
        if (!vesselSet.has(f.vessel) && vesselSet.size < 8) vesselSet.set(f.vessel, f);
      }
      const diverse = [...vesselSet.values()];

      if (query === 'auto') {
        // Auto-synthesize: find patterns across diverse fragments
        const fragStr = diverse.map(f => `[${f.vessel}] ${f.content}`).join('\n');
        const raw = await callLLM(env.DEEPSEEK_API_KEY,
          'You are a collective intelligence analyzing knowledge fragments from different AI vessels. Find a NON-OBVIOUS pattern, insight, or connection that NO single fragment reveals alone. This must be a genuine synthesis — something new that emerges only from combining these perspectives. Reply with: 1) INSIGHT: (2-3 sentences) 2) NOVELTY: (0.0-1.0) 3) IMPLIES: (what this means for the fleet)',
          fragStr, 'deepseek-chat', 1000);
        const insight: Insight = {
          id: Date.now().toString(),
          description: stripFences(raw).substring(0, 1000),
          sourceVessels: diverse.map(f => f.vessel),
          sourceFragments: diverse.map(f => f.id),
          novelty: 0.7, ts: new Date().toISOString()
        };
        // Parse novelty from response if present
        const novMatch = raw.match(/NOVELTY:\s*([\d.]+)/);
        if (novMatch) insight.novelty = Math.min(1, Math.max(0, parseFloat(novMatch[1])));

        const insights = await env.MIND_KV.get('insights', 'json') as Insight[] || [];
        insights.unshift(insight);
        if (insights.length > 50) insights.length = 50;
        await env.MIND_KV.put('insights', JSON.stringify(insights));
        return json({ insight, fragmentsUsed: diverse.length });
      } else {
        // Query-directed synthesis
        const fragStr = diverse.map(f => `[${f.vessel}] ${f.content}`).join('\n');
        const raw = await callLLM(env.DEEPSEEK_API_KEY,
          'Answer using ONLY knowledge from these fleet fragments. If the answer requires information not present, say so. Synthesize from multiple sources when possible.',
          `Question: ${query}\n\nFleet knowledge:\n${fragStr}`, 'deepseek-chat', 800);
        const insight: Insight = {
          id: Date.now().toString(), description: stripFences(raw).substring(0, 1000),
          sourceVessels: diverse.map(f => f.vessel), sourceFragments: diverse.map(f => f.id),
          novelty: 0.5, ts: new Date().toISOString()
        };
        const insights = await env.MIND_KV.get('insights', 'json') as Insight[] || [];
        insights.unshift(insight);
        if (insights.length > 50) insights.length = 50;
        await env.MIND_KV.put('insights', JSON.stringify(insights));
        return json({ insight, fragmentsUsed: diverse.length });
      }
    }

    return new Response(getLanding(), { headers: { 'Content-Type': 'text/html;charset=UTF-8', ...CSP } });
  }
};
