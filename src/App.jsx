import { useState, useEffect, useMemo, useCallback } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "./supabase.js";

// ═══════════════════════════════════════════
//  CONFIGURAZIONE
// ═══════════════════════════════════════════
const APP_PASSWORD = "sposi2026";           // ← CAMBIA QUI
const WEDDING_DATE = new Date("2026-08-28");
// ═══════════════════════════════════════════

const CATS = [
  {id:"catering",        label:"Catering",        color:"#ff9f0a"},
  {id:"allestimenti",    label:"Allestimenti",    color:"#34c759"},
  {id:"intrattenimento", label:"Intrattenimento", color:"#bf5af2"},
  {id:"inviti_ospiti",   label:"Inviti e Ospiti", color:"#32ade6"},
  {id:"extra",           label:"Extra",           color:"#ff453a"},
];
const CAT = Object.fromEntries(CATS.map(c=>[c.id,c]));
const STATI = [
  {id:"pagato",      label:"Pagato",      color:"#34c759"},
  {id:"acconto",     label:"Acconto",     color:"#ff6b35"},
  {id:"da_pagare",   label:"Da pagare",   color:"#ff9f0a"},
  {id:"da_definire", label:"Da definire", color:"#ff453a"},
  {id:"incluso",     label:"Incluso",     color:"#8e8e93"},
];

const fmt  = n=>new Intl.NumberFormat("it-IT",{style:"currency",currency:"EUR"}).format(n);
const fmt2 = n=>new Intl.NumberFormat("it-IT",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(n);
const TODAY  = new Date().toISOString().slice(0,10);
const ACCENT = "#007AFF";

const SAMPLE_EXP = [
  {id:"e1", category:"catering",        description:"Ristorante Adulti",            unit_cost:95,      qty:100,notes:"116 ivato a persona",    stato:"da_pagare",  acconto_amount:"",acconto_date:""},
  {id:"e2", category:"catering",        description:"Ristorante Bambini (50%)",     unit_cost:44.50,   qty:10, notes:"55 ivato a persona",     stato:"da_pagare",  acconto_amount:"",acconto_date:""},
  {id:"e3", category:"catering",        description:"Ristorante Gratis",            unit_cost:0,       qty:4,  notes:"",                       stato:"incluso",    acconto_amount:"",acconto_date:""},
  {id:"e4", category:"catering",        description:"Ristorante Staff",             unit_cost:50,      qty:7,  notes:"",                       stato:"da_pagare",  acconto_amount:"",acconto_date:""},
  {id:"e5", category:"catering",        description:"Open Bar",                     unit_cost:10,      qty:100,notes:"10 ivato a persona",     stato:"da_pagare",  acconto_amount:"",acconto_date:""},
  {id:"e6", category:"catering",        description:"Buffet Dolci",                 unit_cost:10,      qty:100,notes:"12.2 ivato a persona",   stato:"da_pagare",  acconto_amount:"",acconto_date:""},
  {id:"e7", category:"catering",        description:"Brunch Sabato",                unit_cost:29,      qty:70, notes:"35 ivato a persona",     stato:"da_pagare",  acconto_amount:"",acconto_date:""},
  {id:"e8", category:"catering",        description:"IVA Mare",                     unit_cost:1409.50, qty:0.5,notes:"Da definire",            stato:"da_definire",acconto_amount:"",acconto_date:""},
  {id:"e9", category:"allestimenti",    description:"Fiori",                        unit_cost:2150,    qty:1,  notes:"",                       stato:"da_pagare",  acconto_amount:"",acconto_date:""},
  {id:"e10",category:"allestimenti",    description:"Chiesa",                       unit_cost:0,       qty:1,  notes:"Da definire",            stato:"da_definire",acconto_amount:"",acconto_date:""},
  {id:"e11",category:"allestimenti",    description:"Allestimenti Brunch",          unit_cost:500,     qty:1,  notes:"",                       stato:"da_pagare",  acconto_amount:"",acconto_date:""},
  {id:"e12",category:"intrattenimento", description:"SIAE",                         unit_cost:0,       qty:1,  notes:"Offerta da Mare",        stato:"incluso",    acconto_amount:"",acconto_date:""},
  {id:"e13",category:"intrattenimento", description:"Band",                         unit_cost:2600,    qty:1,  notes:"",                       stato:"da_pagare",  acconto_amount:"",acconto_date:""},
  {id:"e14",category:"intrattenimento", description:"DJ",                           unit_cost:0,       qty:1,  notes:"Da definire",            stato:"da_definire",acconto_amount:"",acconto_date:""},
  {id:"e15",category:"intrattenimento", description:"Fotografo",                    unit_cost:1600,    qty:1,  notes:"",                       stato:"pagato",     acconto_amount:"",acconto_date:""},
  {id:"e16",category:"inviti_ospiti",   description:"Partecipazioni / Casa Ciao",   unit_cost:686.86,  qty:1,  notes:"",                       stato:"pagato",     acconto_amount:"",acconto_date:""},
  {id:"e17",category:"inviti_ospiti",   description:"Bomboniere",                   unit_cost:10,      qty:50, notes:"",                       stato:"da_pagare",  acconto_amount:"",acconto_date:""},
  {id:"e18",category:"inviti_ospiti",   description:"Regalo Camere Testimoni",      unit_cost:250,     qty:8,  notes:"",                       stato:"da_pagare",  acconto_amount:"",acconto_date:""},
  {id:"e19",category:"allestimenti",    description:"Menu / Segnaposti / Table",    unit_cost:0,       qty:1,  notes:"Compreso",               stato:"incluso",    acconto_amount:"",acconto_date:""},
  {id:"e20",category:"extra",           description:"Confettata Miani",             unit_cost:197,     qty:1,  notes:"",                       stato:"da_pagare",  acconto_amount:"",acconto_date:""},
  {id:"e21",category:"catering",        description:"Vino Extra",                   unit_cost:1000,    qty:1,  notes:"",                       stato:"da_pagare",  acconto_amount:"",acconto_date:""},
  {id:"e22",category:"extra",           description:"Fedi",                         unit_cost:750,     qty:1,  notes:"",                       stato:"pagato",     acconto_amount:"",acconto_date:""},
];

const emptyExp  = ()=>({description:"",category:"catering",unit_cost:"",qty:"1",notes:"",stato:"da_pagare",acconto_amount:"",acconto_date:""});
const emptyGift = ()=>({guest:"",description:"Busta",amount:"",date:TODAY,adults:"1",children:"0"});

const S = {
  page:{padding:"1.5rem 1rem",maxWidth:"960px",margin:"0 auto"},
  card:{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:"18px",padding:"1.25rem 1.5rem"},
  inp: {background:"var(--color-background-secondary)",border:"0.5px solid var(--color-border-secondary)",borderRadius:"10px",color:"var(--color-text-primary)",padding:"9px 12px",fontSize:"14px",width:"100%",boxSizing:"border-box",outline:"none"},
  lbl: {fontSize:"11px",fontWeight:500,color:"var(--color-text-secondary)",letterSpacing:"0.04em",textTransform:"uppercase",display:"block",marginBottom:"5px"},
  sel: {appearance:"none",background:"var(--color-background-secondary)",border:"0.5px solid var(--color-border-secondary)",borderRadius:"10px",color:"var(--color-text-primary)",padding:"9px 28px 9px 12px",fontSize:"14px",outline:"none",backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24'%3E%3Cpath fill='%238e8e93' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E\")",backgroundRepeat:"no-repeat",backgroundPosition:"right 8px center"},
};

function PasswordGate({onUnlock}) {
  const [val,setVal]=useState(""); const [err,setErr]=useState(false);
  const check=()=>{
    if(val===APP_PASSWORD){try{localStorage.setItem("wed_auth",APP_PASSWORD);}catch{}onUnlock();}
    else{setErr(true);setVal("");setTimeout(()=>setErr(false),2000);}
  };
  return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:"2rem",background:"var(--color-background-secondary)"}}>
      <div style={{maxWidth:"320px",width:"100%",textAlign:"center"}}>
        <div style={{fontSize:"44px",marginBottom:"14px"}}>💍</div>
        <div style={{fontSize:"26px",fontWeight:500,letterSpacing:"-0.03em",color:"var(--color-text-primary)",marginBottom:"4px"}}>Stefano &amp; Giulia</div>
        <div style={{fontSize:"14px",color:"var(--color-text-secondary)",marginBottom:"2.5rem"}}>28 agosto 2026 — Mare, Cesenatico</div>
        <input type="password" value={val} onChange={e=>setVal(e.target.value)} onKeyDown={e=>e.key==="Enter"&&check()} placeholder="Password" autoFocus
          style={{...S.inp,textAlign:"center",marginBottom:"10px",fontSize:"16px",border:err?"1px solid #ff453a":undefined}}/>
        {err&&<div style={{fontSize:"13px",color:"#ff453a",marginBottom:"8px"}}>Password errata</div>}
        <button onClick={check} style={{width:"100%",background:ACCENT,color:"#fff",border:"none",borderRadius:"12px",padding:"13px",fontSize:"15px",fontWeight:500,cursor:"pointer"}}>Entra</button>
      </div>
    </div>
  );
}

export default function App() {
  const [unlocked,setUnlocked]=useState(()=>{try{return localStorage.getItem("wed_auth")===APP_PASSWORD;}catch{return false;}});
  const [exp,setExp]         = useState(null);
  const [gifts,setGifts]     = useState(null);
  const [loading,setLoading] = useState(false);
  const [saving,setSaving]   = useState(false);
  const [syncStatus,setSyncStatus] = useState("connecting");
  const [fCat,setFCat]       = useState("all");
  const [fStato,setFStato]   = useState("all");
  const [sortBy,setSortBy]   = useState("category");
  const [sortDir,setSortDir] = useState("asc");
  const [view,setView]       = useState("dashboard");
  const [tab,setTab]         = useState("expenses");
  const [editEId,setEditEId] = useState(null);
  const [editGId,setEditGId] = useState(null);
  const [eForm,setEForm]     = useState(emptyExp());
  const [gForm,setGForm]     = useState(emptyGift());
  const [delEId,setDelEId]   = useState(null);
  const [delGId,setDelGId]   = useState(null);
  const [hovId,setHovId]     = useState(null);

  const daysLeft=useMemo(()=>Math.max(0,Math.ceil((WEDDING_DATE-new Date())/86400000)),[]);

  const loadData=useCallback(async()=>{
    try{
      const [{data:e},{data:g}]=await Promise.all([
        supabase.from('expenses').select('*').order('created_at'),
        supabase.from('gifts').select('*').order('created_at'),
      ]);
      if(e!=null)setExp(e);
      if(g!=null)setGifts(g);
    }catch{}
  },[]);

  useEffect(()=>{
    if(!unlocked)return;
    setLoading(true);
    loadData().finally(()=>setLoading(false));
  },[unlocked,loadData]);

  useEffect(()=>{
    if(!unlocked)return;
    const ch=supabase.channel('wedding-sync')
      .on('postgres_changes',{event:'*',schema:'public',table:'expenses'},loadData)
      .on('postgres_changes',{event:'*',schema:'public',table:'gifts'},loadData)
      .subscribe(s=>setSyncStatus(s==='SUBSCRIBED'?'synced':s==='CHANNEL_ERROR'?'offline':'connecting'));
    return()=>supabase.removeChannel(ch);
  },[unlocked,loadData]);

  const seedData=async()=>{
    setSaving(true);
    await supabase.from('expenses').insert(SAMPLE_EXP);
    await loadData();
    setSaving(false);
  };

  const openAddE=()=>{setEditEId(null);setEForm(emptyExp());setView("exp-form");};
  const openEditE=e=>{setEditEId(e.id);setEForm({...e,unit_cost:String(e.unit_cost),qty:String(e.qty),acconto_amount:String(e.acconto_amount||""),acconto_date:e.acconto_date||""});setView("exp-form");};
  const closeE=()=>{setView("dashboard");setEditEId(null);};
  const saveE=async()=>{
    if(!eForm.description.trim()||eForm.unit_cost==="")return;
    const item={...eForm,unit_cost:parseFloat(eForm.unit_cost)||0,qty:parseFloat(eForm.qty)||1,
      acconto_amount:eForm.stato==="acconto"?eForm.acconto_amount:"",
      acconto_date:eForm.stato==="acconto"?eForm.acconto_date:"",
      id:editEId||String(Date.now())};
    setSaving(true);
    await supabase.from('expenses').upsert(item);
    await loadData();
    setSaving(false);
    closeE();
  };

  const openAddG=()=>{setEditGId(null);setGForm(emptyGift());setView("gift-form");};
  const openEditG=g=>{setEditGId(g.id);setGForm({...g,amount:String(g.amount),adults:String(g.adults??1),children:String(g.children??0)});setView("gift-form");};
  const closeG=()=>{setView("dashboard");setEditGId(null);};
  const saveG=async()=>{
    if(!gForm.guest.trim()||!gForm.amount)return;
    const item={...gForm,amount:parseFloat(gForm.amount)||0,adults:parseInt(gForm.adults)||0,children:parseInt(gForm.children)||0,id:editGId||String(Date.now())};
    setSaving(true);
    await supabase.from('gifts').upsert(item);
    await loadData();
    setSaving(false);
    closeG();
  };

  const doDelE=async id=>{await supabase.from('expenses').delete().eq('id',id);await loadData();setDelEId(null);};
  const doDelG=async id=>{await supabase.from('gifts').delete().eq('id',id);await loadData();setDelGId(null);};

  if(!unlocked)return<PasswordGate onUnlock={()=>setUnlocked(true)}/>;

  if(loading||!exp||!gifts)return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--color-background-secondary)"}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:"40px",marginBottom:"12px"}}>💍</div>
        <div style={{fontSize:"14px",color:"var(--color-text-secondary)"}}>Connessione al database...</div>
      </div>
    </div>
  );

  const net=stats.totalGifts-stats.totalBudget;

  const syncInfo={
    synced:     {color:"#34c759",label:"Sincronizzato"},
    connecting: {color:"#ff9f0a",label:"Connessione..."},
    offline:    {color:"#ff453a",label:"Offline"},
  }[syncStatus];

  const filteredExp=useMemo(()=>{
    let list=[...exp];
    if(fCat!=="all")list=list.filter(e=>e.category===fCat);
    if(fStato!=="all")list=list.filter(e=>e.stato===fStato);
    list.sort((a,b)=>{
      const va=sortBy==="total"?a.unit_cost*a.qty:sortBy==="description"?a.description.toLowerCase():a.category;
      const vb=sortBy==="total"?b.unit_cost*b.qty:sortBy==="description"?b.description.toLowerCase():b.category;
      return sortDir==="asc"?(va<vb?-1:1):(va>vb?-1:1);
    });return list;
  },[exp,fCat,fStato,sortBy,sortDir]);

  const stats=useMemo(()=>{
    const totalBudget=exp.reduce((s,e)=>s+e.unit_cost*e.qty,0);
    const totalPaid=exp.filter(e=>e.stato==="pagato").reduce((s,e)=>s+e.unit_cost*e.qty,0)
                  +exp.filter(e=>e.stato==="acconto").reduce((s,e)=>s+(parseFloat(e.acconto_amount)||0),0);
    const totalToPay=exp.filter(e=>["da_pagare","da_definire","acconto"].includes(e.stato)).reduce((s,e)=>{
      if(e.stato==="acconto")return s+(e.unit_cost*e.qty-(parseFloat(e.acconto_amount)||0));
      return s+e.unit_cost*e.qty;
    },0);
    const totalGifts=gifts.reduce((s,g)=>s+g.amount,0);
    const totalPersons=gifts.reduce((s,g)=>s+(parseInt(g.adults)||0)+(parseInt(g.children)||0),0);
    const mediaPerPerson=totalPersons>0?totalGifts/totalPersons:0;
    const byCat=CATS.map(c=>({...c,value:exp.filter(e=>e.category===c.id).reduce((s,e)=>s+e.unit_cost*e.qty,0)})).filter(c=>c.value>0);
    const byStato=STATI.map(s=>({...s,value:exp.filter(e=>e.stato===s.id).reduce((sum,e)=>{
      if(s.id==="acconto")return sum+(parseFloat(e.acconto_amount)||0);return sum+e.unit_cost*e.qty;
    },0)})).filter(s=>s.value>0);
    return{totalBudget,totalPaid,totalToPay,totalGifts,totalPersons,mediaPerPerson,byCat,byStato};
  },[exp,gifts]);

  const FormBtn=({ok,onClick,label})=>(<button onClick={onClick} disabled={!ok||saving} style={{flex:1,background:ok&&!saving?ACCENT:"var(--color-background-secondary)",color:ok&&!saving?"#fff":"var(--color-text-secondary)",border:"none",borderRadius:"12px",padding:"13px",fontSize:"15px",fontWeight:500,cursor:ok&&!saving?"pointer":"default"}}>{saving?"Salvataggio...":label}</button>);
  const KPI=({label,value,color,sub})=>(<div style={{...S.card,padding:"1rem 1.25rem"}}><div style={{fontSize:"11px",fontWeight:500,color:"var(--color-text-secondary)",letterSpacing:"0.04em",textTransform:"uppercase",marginBottom:"6px"}}>{label}</div><div style={{fontSize:"20px",fontWeight:500,letterSpacing:"-0.02em",color:color||"var(--color-text-primary)"}}>{value}</div>{sub&&<div style={{fontSize:"11px",color:"var(--color-text-secondary)",marginTop:"2px"}}>{sub}</div>}</div>);
  const DelBanner=({msg,onCancel,onConfirm})=>(<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"1rem",padding:"12px 14px",background:"var(--color-background-secondary)",border:"0.5px solid rgba(255,69,58,0.35)",borderRadius:"12px",marginBottom:"10px"}}><div style={{fontSize:"13px"}}>{msg}</div><div style={{display:"flex",gap:"8px",flexShrink:0}}><button onClick={onCancel} style={{background:"none",border:"0.5px solid var(--color-border-secondary)",borderRadius:"8px",padding:"5px 12px",fontSize:"12px",cursor:"pointer",color:"var(--color-text-primary)"}}>Annulla</button><button onClick={onConfirm} style={{background:"#ff453a",border:"none",borderRadius:"8px",padding:"5px 12px",fontSize:"12px",fontWeight:500,color:"#fff",cursor:"pointer"}}>Elimina</button></div></div>);
  const LegendRow=({color,label,value,pct})=>(<div style={{display:"flex",alignItems:"center",gap:"8px"}}><div style={{width:"7px",height:"7px",borderRadius:"50%",background:color,flexShrink:0}}/><div style={{flex:1,fontSize:"12px"}}>{label}</div><div style={{fontSize:"12px",fontWeight:500}}>{fmt(value)}</div>{pct!==undefined&&<div style={{fontSize:"11px",color:"var(--color-text-secondary)",width:"28px",textAlign:"right"}}>{pct}%</div>}</div>);
  const getStatusLabel=ex=>{if(ex.stato==="pagato")return{text:"PAGATO",color:"#ff453a"};if(ex.stato==="acconto")return{text:"ACCONTO",color:"#ff6b35"};return null;};
  const giftPersonsLabel=g=>{const a=parseInt(g.adults)||0,c=parseInt(g.children)||0;if(!a&&!c)return"";const p=[];if(a)p.push(`${a}A`);if(c)p.push(`${c}B`);return p.join(" · ");};

  if(view==="exp-form")return(
    <div style={{...S.page,maxWidth:"480px"}}>
      <button onClick={closeE} style={{background:"none",border:"none",color:ACCENT,fontSize:"15px",cursor:"pointer",padding:"0 0 1.5rem",display:"block"}}>‹ Torna alla dashboard</button>
      <div style={{fontSize:"22px",fontWeight:500,letterSpacing:"-0.03em",marginBottom:"1.5rem",color:"var(--color-text-primary)"}}>{editEId?"Modifica voce":"Nuova voce di spesa"}</div>
      <div style={{...S.card,marginBottom:"1rem"}}>
        <div style={{marginBottom:"14px"}}><span style={S.lbl}>Descrizione</span><input type="text" value={eForm.description} onChange={e=>setEForm(f=>({...f,description:e.target.value}))} placeholder="Es. Band musicale" style={S.inp}/></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"14px",marginBottom:"14px"}}>
          <div><span style={S.lbl}>Categoria</span><select value={eForm.category} onChange={e=>setEForm(f=>({...f,category:e.target.value}))} style={{...S.sel,width:"100%"}}>{CATS.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select></div>
          <div><span style={S.lbl}>Stato</span><select value={eForm.stato} onChange={e=>setEForm(f=>({...f,stato:e.target.value}))} style={{...S.sel,width:"100%"}}>{STATI.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></div>
        </div>
        {eForm.stato==="acconto"&&(<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"14px",marginBottom:"14px",padding:"12px 14px",background:"var(--color-background-secondary)",borderRadius:"12px",border:"0.5px solid rgba(255,107,53,0.35)"}}><div><span style={{...S.lbl,color:"#ff6b35"}}>Acconto versato</span><input type="number" value={eForm.acconto_amount} onChange={e=>setEForm(f=>({...f,acconto_amount:e.target.value}))} placeholder="0,00" min="0" step="0.01" style={S.inp}/></div><div><span style={{...S.lbl,color:"#ff6b35"}}>Data</span><input type="date" value={eForm.acconto_date} onChange={e=>setEForm(f=>({...f,acconto_date:e.target.value}))} style={S.inp}/></div></div>)}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"14px",marginBottom:"14px"}}>
          <div><span style={S.lbl}>Costo unitario</span><input type="number" value={eForm.unit_cost} onChange={e=>setEForm(f=>({...f,unit_cost:e.target.value}))} placeholder="0,00" min="0" step="0.01" style={S.inp}/></div>
          <div><span style={S.lbl}>Quantita</span><input type="number" value={eForm.qty} onChange={e=>setEForm(f=>({...f,qty:e.target.value}))} placeholder="1" min="0" step="0.5" style={S.inp}/></div>
        </div>
        <div><span style={S.lbl}>Note</span><input type="text" value={eForm.notes} onChange={e=>setEForm(f=>({...f,notes:e.target.value}))} placeholder="Note opzionali" style={S.inp}/></div>
      </div>
      {eForm.unit_cost&&eForm.qty&&(<div style={{...S.card,marginBottom:"1rem",padding:"1rem 1.5rem"}}><div style={{fontSize:"11px",color:"var(--color-text-secondary)",textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:"4px"}}>Totale voce</div><div style={{fontSize:"24px",fontWeight:500,color:ACCENT}}>{fmt((parseFloat(eForm.unit_cost)||0)*(parseFloat(eForm.qty)||0))}</div></div>)}
      <div style={{display:"flex",gap:"10px"}}><button onClick={closeE} style={{flex:1,background:"var(--color-background-secondary)",border:"0.5px solid var(--color-border-secondary)",borderRadius:"12px",padding:"13px",fontSize:"15px",cursor:"pointer",color:"var(--color-text-primary)"}}>Annulla</button><FormBtn ok={eForm.description.trim()&&eForm.unit_cost!==""} onClick={saveE} label={editEId?"Salva modifiche":"Aggiungi"}/></div>
    </div>
  );

  if(view==="gift-form")return(
    <div style={{...S.page,maxWidth:"480px"}}>
      <button onClick={closeG} style={{background:"none",border:"none",color:ACCENT,fontSize:"15px",cursor:"pointer",padding:"0 0 1.5rem",display:"block"}}>‹ Torna alla dashboard</button>
      <div style={{fontSize:"22px",fontWeight:500,letterSpacing:"-0.03em",marginBottom:"1.5rem",color:"var(--color-text-primary)"}}>{editGId?"Modifica regalo":"Registra regalo"}</div>
      <div style={{...S.card,marginBottom:"1rem"}}>
        <div style={{marginBottom:"14px"}}><span style={S.lbl}>Nome ospite / famiglia</span><input type="text" value={gForm.guest} onChange={e=>setGForm(f=>({...f,guest:e.target.value}))} placeholder="Es. Famiglia Rossi" style={S.inp}/></div>
        <div style={{marginBottom:"14px"}}><span style={S.lbl}>Tipo regalo</span><input type="text" value={gForm.description} onChange={e=>setGForm(f=>({...f,description:e.target.value}))} placeholder="Es. Busta, Assegno..." style={S.inp}/></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"12px",marginBottom:"14px"}}>
          <div><span style={S.lbl}>Adulti</span><input type="number" value={gForm.adults} onChange={e=>setGForm(f=>({...f,adults:e.target.value}))} placeholder="0" min="0" style={S.inp}/></div>
          <div><span style={S.lbl}>Bambini</span><input type="number" value={gForm.children} onChange={e=>setGForm(f=>({...f,children:e.target.value}))} placeholder="0" min="0" style={S.inp}/></div>
          <div><span style={S.lbl}>Totale</span><div style={{...S.inp,color:"var(--color-text-secondary)",display:"flex",alignItems:"center"}}>{(parseInt(gForm.adults)||0)+(parseInt(gForm.children)||0)}</div></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"14px"}}>
          <div><span style={S.lbl}>Importo</span><input type="number" value={gForm.amount} onChange={e=>setGForm(f=>({...f,amount:e.target.value}))} placeholder="0,00" min="0" step="0.01" style={S.inp}/></div>
          <div><span style={S.lbl}>Data</span><input type="date" value={gForm.date} onChange={e=>setGForm(f=>({...f,date:e.target.value}))} style={S.inp}/></div>
        </div>
      </div>
      <div style={{display:"flex",gap:"10px"}}><button onClick={closeG} style={{flex:1,background:"var(--color-background-secondary)",border:"0.5px solid var(--color-border-secondary)",borderRadius:"12px",padding:"13px",fontSize:"15px",cursor:"pointer",color:"var(--color-text-primary)"}}>Annulla</button><FormBtn ok={gForm.guest.trim()&&gForm.amount} onClick={saveG} label={editGId?"Salva modifiche":"Registra"}/></div>
    </div>
  );

  return(
    <div style={S.page}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:"1.75rem",flexWrap:"wrap",gap:"10px"}}>
        <div>
          <div style={{fontSize:"26px",fontWeight:500,letterSpacing:"-0.03em",color:"var(--color-text-primary)"}}>Stefano &amp; Giulia</div>
          <div style={{display:"flex",alignItems:"center",gap:"6px",marginTop:"3px"}}>
            <div style={{width:"6px",height:"6px",borderRadius:"50%",background:syncInfo.color}}/>
            <div style={{fontSize:"12px",color:"var(--color-text-secondary)"}}>{syncInfo.label} · 28 agosto 2026</div>
          </div>
        </div>
        <div style={{display:"flex",gap:"8px",alignItems:"center",flexWrap:"wrap"}}>
          <div style={{background:"var(--color-background-secondary)",border:"0.5px solid var(--color-border-secondary)",borderRadius:"12px",padding:"8px 14px",textAlign:"center"}}>
            <div style={{fontSize:"22px",fontWeight:500,color:ACCENT,letterSpacing:"-0.02em"}}>{daysLeft}</div>
            <div style={{fontSize:"10px",color:"var(--color-text-secondary)",textTransform:"uppercase",letterSpacing:"0.04em"}}>giorni</div>
          </div>
          {exp.length===0&&<button onClick={seedData} disabled={saving} style={{background:"#ff9f0a",color:"#fff",border:"none",borderRadius:"980px",padding:"9px 18px",fontSize:"14px",fontWeight:500,cursor:"pointer"}}>{saving?"Caricamento...":"Carica dati iniziali"}</button>}
          <button onClick={openAddE} style={{background:ACCENT,color:"#fff",border:"none",borderRadius:"980px",padding:"9px 18px",fontSize:"14px",fontWeight:500,cursor:"pointer"}}>+ Spesa</button>
          <button onClick={openAddG} style={{background:"#bf5af2",color:"#fff",border:"none",borderRadius:"980px",padding:"9px 18px",fontSize:"14px",fontWeight:500,cursor:"pointer"}}>+ Regalo</button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:"10px",marginBottom:"1rem"}}>
        <KPI label="Budget totale"   value={fmt(stats.totalBudget)}/>
        <KPI label="Gia pagato"      value={fmt(stats.totalPaid)}   color="#34c759"/>
        <KPI label="Da pagare"       value={fmt(stats.totalToPay)}  color="#ff9f0a"/>
        <KPI label="Regali ricevuti" value={fmt(stats.totalGifts)}  color="#bf5af2" sub={`${gifts.length} ospiti · ${stats.totalPersons} persone`}/>
        <KPI label="Media / persona" value={stats.mediaPerPerson>0?fmt2(stats.mediaPerPerson):"—"} color="#bf5af2"/>
        <KPI label="Bilancio netto"  value={fmt(net)} color={net>=0?"#34c759":"#ff453a"} sub={net>=0?"surplus":"da coprire"}/>
      </div>

      {/* Charts */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"1rem"}}>
        {[{title:"Spese per categoria",data:stats.byCat},{title:"Stato pagamenti",data:stats.byStato}].map(({title,data})=>(
          <div key={title} style={S.card}>
            <div style={{fontSize:"11px",fontWeight:500,color:"var(--color-text-secondary)",letterSpacing:"0.04em",textTransform:"uppercase",marginBottom:"8px"}}>{title}</div>
            {data.length>0?(<>
              <ResponsiveContainer width="100%" height={190}><PieChart><Pie data={data} cx="50%" cy="50%" innerRadius={48} outerRadius={82} paddingAngle={2} dataKey="value">{data.map((d,i)=><Cell key={i} fill={d.color}/>)}</Pie><Tooltip formatter={v=>[fmt(v),""]} contentStyle={{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-secondary)",borderRadius:"12px",fontSize:"12px"}}/></PieChart></ResponsiveContainer>
              <div style={{display:"flex",flexDirection:"column",gap:"8px",marginTop:"4px"}}>{data.map(d=><LegendRow key={d.id} color={d.color} label={d.label} value={d.value} pct={stats.totalBudget>0?Math.round(d.value/stats.totalBudget*100):0}/>)}</div>
            </>):(<div style={{height:190,display:"flex",alignItems:"center",justifyContent:"center",color:"var(--color-text-secondary)",fontSize:"13px"}}>Nessun dato</div>)}
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={S.card}>
        <div style={{display:"flex",gap:"0",marginBottom:"1rem",borderBottom:"0.5px solid var(--color-border-tertiary)"}}>
          {[{id:"expenses",label:`Spese (${exp.length})`},{id:"gifts",label:`Regali (${gifts.length})`}].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{background:"none",border:"none",borderBottom:tab===t.id?`2px solid ${ACCENT}`:"2px solid transparent",padding:"8px 18px",fontSize:"14px",fontWeight:tab===t.id?500:400,color:tab===t.id?ACCENT:"var(--color-text-secondary)",cursor:"pointer"}}>{t.label}</button>
          ))}
        </div>

        {tab==="expenses"&&(<>
          <div style={{display:"flex",flexWrap:"wrap",gap:"10px",marginBottom:"1rem"}}>
            <div><span style={S.lbl}>Categoria</span><select value={fCat} onChange={e=>setFCat(e.target.value)} style={S.sel}><option value="all">Tutte</option>{CATS.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select></div>
            <div><span style={S.lbl}>Stato</span><select value={fStato} onChange={e=>setFStato(e.target.value)} style={S.sel}><option value="all">Tutti</option>{STATI.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></div>
            <div><span style={S.lbl}>Ordina</span><select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={S.sel}><option value="category">Categoria</option><option value="total">Totale</option><option value="description">Nome</option></select></div>
            <div><span style={S.lbl}>Dir.</span><select value={sortDir} onChange={e=>setSortDir(e.target.value)} style={S.sel}><option value="asc">Crescente</option><option value="desc">Decrescente</option></select></div>
          </div>
          {delEId&&<DelBanner msg="Eliminare questa voce?" onCancel={()=>setDelEId(null)} onConfirm={()=>doDelE(delEId)}/>}
          <div style={{display:"flex",flexDirection:"column",maxHeight:"400px",overflowY:"auto"}}>
            {filteredExp.length===0&&<div style={{textAlign:"center",color:"var(--color-text-secondary)",fontSize:"13px",padding:"3rem 0"}}>Nessuna voce trovata</div>}
            {filteredExp.map((ex,i)=>{
              const cat=CAT[ex.category]||CATS[0];const total=ex.unit_cost*ex.qty;const isH=hovId===ex.id;const sl=getStatusLabel(ex);
              return(<div key={ex.id} onMouseEnter={()=>setHovId(ex.id)} onMouseLeave={()=>setHovId(null)}
                style={{display:"grid",gridTemplateColumns:"8px 1fr 110px 80px 60px 70px",gap:"0 8px",alignItems:"center",padding:"10px 4px",borderRadius:"10px",background:isH?"var(--color-background-secondary)":"transparent",borderBottom:i<filteredExp.length-1?"0.5px solid var(--color-border-tertiary)":"none"}}>
                <div style={{width:"7px",height:"7px",borderRadius:"50%",background:cat.color}}/>
                <div><div style={{fontSize:"13px",fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ex.description}</div>{ex.notes&&<div style={{fontSize:"11px",color:"var(--color-text-secondary)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ex.notes}</div>}</div>
                <div style={{fontSize:"12px",color:"var(--color-text-secondary)"}}>{cat.label}</div>
                <div style={{fontSize:"12px",color:"var(--color-text-secondary)"}}>{fmt(ex.unit_cost)}</div>
                <div style={{fontSize:"13px",fontWeight:500,textAlign:"right"}}>{fmt(total)}</div>
                <div style={{display:"flex",gap:"4px",justifyContent:"flex-end",opacity:isH?1:0}}>
                  <button onClick={()=>openEditE(ex)} style={{background:"none",border:"0.5px solid var(--color-border-secondary)",borderRadius:"6px",padding:"3px 7px",fontSize:"11px",color:"var(--color-text-secondary)",cursor:"pointer"}}>mod</button>
                  <button onClick={()=>setDelEId(ex.id)} style={{background:"none",border:"0.5px solid rgba(255,69,58,0.4)",borderRadius:"6px",padding:"3px 7px",fontSize:"11px",color:"#ff453a",cursor:"pointer"}}>del</button>
                </div>
              </div>);
            })}
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",gap:"2rem",padding:"12px 4px 0",borderTop:"0.5px solid var(--color-border-tertiary)",marginTop:"4px"}}>
            <div style={{fontSize:"12px",color:"var(--color-text-secondary)"}}>Budget totale: <span style={{fontWeight:500,color:"var(--color-text-primary)"}}>{fmt(stats.totalBudget)}</span></div>
          </div>
        </>)}

        {tab==="gifts"&&(<>
          {delGId&&<DelBanner msg="Eliminare questo regalo?" onCancel={()=>setDelGId(null)} onConfirm={()=>doDelG(delGId)}/>}
          <div style={{display:"flex",flexDirection:"column",maxHeight:"400px",overflowY:"auto"}}>
            {gifts.length===0&&<div style={{textAlign:"center",color:"var(--color-text-secondary)",fontSize:"13px",padding:"3rem 0"}}>Nessun regalo ancora registrato</div>}
            {[...gifts].sort((a,b)=>b.amount-a.amount).map((g,i)=>{
              const isH=hovId===g.id;const pLabel=giftPersonsLabel(g);const totP=(parseInt(g.adults)||0)+(parseInt(g.children)||0);
              return(<div key={g.id} onMouseEnter={()=>setHovId(g.id)} onMouseLeave={()=>setHovId(null)}
                style={{display:"grid",gridTemplateColumns:"1fr 90px 60px 80px 90px 70px",gap:"0 8px",alignItems:"center",padding:"10px 4px",borderRadius:"10px",background:isH?"var(--color-background-secondary)":"transparent",borderBottom:i<gifts.length-1?"0.5px solid var(--color-border-tertiary)":"none"}}>
                <div style={{fontSize:"13px",fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{g.guest}</div>
                <div style={{fontSize:"12px",color:"var(--color-text-secondary)"}}>{g.description}</div>
                <div style={{fontSize:"12px",color:"var(--color-text-secondary)"}}>{pLabel||"—"}</div>
                <div style={{fontSize:"12px",color:"var(--color-text-secondary)"}}>{g.date}</div>
                <div><div style={{fontSize:"13px",fontWeight:500,color:"#bf5af2",textAlign:"right"}}>+{fmt(g.amount)}</div>{totP>0&&<div style={{fontSize:"10px",color:"var(--color-text-secondary)",textAlign:"right"}}>{fmt2(g.amount/totP)}/pers</div>}</div>
                <div style={{display:"flex",gap:"4px",justifyContent:"flex-end",opacity:isH?1:0}}>
                  <button onClick={()=>openEditG(g)} style={{background:"none",border:"0.5px solid var(--color-border-secondary)",borderRadius:"6px",padding:"3px 7px",fontSize:"11px",color:"var(--color-text-secondary)",cursor:"pointer"}}>mod</button>
                  <button onClick={()=>setDelGId(g.id)} style={{background:"none",border:"0.5px solid rgba(255,69,58,0.4)",borderRadius:"6px",padding:"3px 7px",fontSize:"11px",color:"#ff453a",cursor:"pointer"}}>del</button>
                </div>
              </div>);
            })}
          </div>
          {gifts.length>0&&(<div style={{display:"flex",justifyContent:"space-between",padding:"12px 4px 0",borderTop:"0.5px solid var(--color-border-tertiary)",marginTop:"4px",flexWrap:"wrap",gap:"8px"}}>
            <div style={{fontSize:"12px",color:"var(--color-text-secondary)"}}>{stats.totalPersons} persone</div>
            <div style={{fontSize:"12px",color:"var(--color-text-secondary)"}}>{gifts.length} regali · <span style={{fontWeight:500,color:"#bf5af2"}}>{fmt(stats.totalGifts)}</span> · media <span style={{fontWeight:500,color:"#bf5af2"}}>{stats.mediaPerPerson>0?fmt2(stats.mediaPerPerson):"—"}</span>/pers</div>
          </div>)}
        </>)}
      </div>
    </div>
  );
}
