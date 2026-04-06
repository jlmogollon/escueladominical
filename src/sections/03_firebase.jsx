const { useState, useEffect, useCallback, useRef, useMemo } = React;

const FIREBASE_CONFIG={
  apiKey:"AIzaSyDmnkl-h4HoHov3Nb4FV80uEnfC9GpqRxU",
  authDomain:"escueladominicalipuevp.firebaseapp.com",
  projectId:"escueladominicalipuevp",
  storageBucket:"escueladominicalipuevp.firebasestorage.app",
  messagingSenderId:"336792465529",
  appId:"1:336792465529:web:694cd9a6ce7453cd6a64a8"
};
const FIRESTORE_COLLECTION="ed_data";
const FIRESTORE_DATA_KEYS=["maestros","clases","cronograma","familias","alumnos","eventos","evaluaciones","calificaciones","peticiones","meriendas","clasesConfig","videos","finanzas","adminProfile","teacherPasswords"];
const PENDING_WRITES_KEY="ed_pending_writes_v1";

// Instancia singleton de Firestore
let _dbInstance=null;

function getDb(){
  if(_dbInstance)return _dbInstance;
  try{
    const fb=window.firebase||null;
    if(!fb)return null;  // SDK no cargado aún — waitForDb reintentará
    if(!fb.apps||!fb.apps.length)fb.initializeApp(FIREBASE_CONFIG);
    const db=fb.firestore?fb.firestore():null;
    if(db){_dbInstance=db;console.log("[Firebase] Firestore conectado OK ✓");}
    return db;
  }catch(e){
    console.error("[Firebase] Error Firestore:",e&&e.message?e.message:e);
    return null;
  }
}

// Espera hasta que Firebase esté listo (máx 15s, reintento cada 300ms)
function waitForDb(ms=15000){
  return new Promise(resolve=>{
    const d=getDb();
    if(d){resolve(d);return;}
    const t0=Date.now();
    const iv=setInterval(()=>{
      const d2=getDb();
      if(d2){clearInterval(iv);resolve(d2);}
      else if(Date.now()-t0>ms){
        clearInterval(iv);
        console.error("[Firebase] Timeout: no se pudo conectar en",ms/1000,"s.");
        resolve(null);
      }
    },300);
  });
}

function getDbNow(){return getDb();}

function getPendingWrites(){
  try{return JSON.parse(localStorage.getItem(PENDING_WRITES_KEY)||"[]")||[];}catch(_e){return[];}
}
function setPendingWrites(items){
  try{localStorage.setItem(PENDING_WRITES_KEY,JSON.stringify(items||[]));}catch(_e){}
}
function queuePendingWrite(key,val){
  const q=getPendingWrites().filter(x=>x.key!==key);
  q.push({key,val,ts:Date.now()});
  setPendingWrites(q);
}
async function flushPendingWrites(){
  try{
    const database=await waitForDb();
    if(!database)return;
    const q=getPendingWrites();
    if(!q.length)return;
    const remaining=[];
    for(const item of q){
      try{
        const str=JSON.stringify(item.val);
        await database.collection(FIRESTORE_COLLECTION).doc(item.key).set({value:str},{merge:true});
      }catch(_err){
        remaining.push(item);
      }
    }
    setPendingWrites(remaining);
  }catch(_e){}
}

// Diagnóstico
function firebaseDiagnostico(){
  waitForDb(5000).then(d=>{
    console.log("[Firebase] Diagnóstico — firebase:",!!window.firebase,"| db:",d?"OK":"null");
    if(!d){console.warn("[Firebase] No hay conexión. Verifica que los scripts de Firebase se carguen.");return;}
    d.collection(FIRESTORE_COLLECTION).doc("_test_connection")
      .set({value:JSON.stringify({t:Date.now()})},{merge:true})
      .then(()=>console.log("[Firebase] Escritura de prueba OK ✓"))
      .catch(err=>console.error("[Firebase] Error escritura:",err.code,err.message));
  });
}
if(typeof window!=="undefined")window.addEventListener("load",()=>setTimeout(firebaseDiagnostico,1000));

// Solo nube: siempre lee desde el servidor para sincronización en tiempo real.
async function loadData(key){
  try{
    const database=await waitForDb();
    if(!database)return null;
    const ref=database.collection(FIRESTORE_COLLECTION).doc(key);
    const snap=await ref.get({source:"server"});
    const raw=snap.exists?snap.data().value:null;
    return raw!=null?JSON.parse(raw):null;
  }catch(e){ console.error("loadData falló ["+key+"]:",e&&e.message?e.message:e); return null; }
}

// Solo nube: guarda en Firestore. No guarda en localStorage para que todo se sincronice en tiempo real.
let _saveDataWarned=false;
async function saveData(key,val){
  try{
    const database=await waitForDb();
    if(!database){
      queuePendingWrite(key,val);
      if(!_saveDataWarned){ _saveDataWarned=true; console.warn("saveData: Firebase no conectado. Cambio en cola local pendiente de sincronizar."); }
      return false;
    }
    const str=JSON.stringify(val);
    if(str.length>900000){ console.warn("saveData: payload muy grande ("+key+", "+Math.round(str.length/1024)+" KB). Firestore limita 1 MB por documento. Las fotos en base64 pueden causar fallos."); }
    await database.collection(FIRESTORE_COLLECTION).doc(key).set({value:str},{merge:true});
    const q=getPendingWrites().filter(x=>x.key!==key);
    setPendingWrites(q);
    return true;
  }catch(e){
    console.error("saveData falló ["+key+"]:",e&&e.message?e.message:e);
    queuePendingWrite(key,val);
    return false;
  }
}

function subscribeData(onChange){
  const unsubs=[];
  waitForDb().then(database=>{
    if(!database){console.warn("subscribeData: Firebase no disponible.");return;}
    FIRESTORE_DATA_KEYS.forEach(key=>{
      const unsubDoc=database.collection(FIRESTORE_COLLECTION).doc(key).onSnapshot(
        docSnap=>{
          try{
            const data=docSnap.exists?docSnap.data():null;
            const v=data&&data.value!=null?JSON.parse(data.value):null;
            onChange(key,v);
          }catch(e){ console.error("subscribeData parse ["+key+"]:",e); }
        },
        err=>{ console.error("subscribeData error ["+key+"]:",err); }
      );
      unsubs.push(unsubDoc);
    });
  });
  return ()=>{unsubs.forEach(fn=>{try{fn();}catch(_e){}});};
}

// Muestra solo primer nombre + primer apellido. Si el registro tiene las 4 partes guardadas, las usa (así no se "ruedan" al editar).
function displayNameAlumno(record){
  if(!record)return "";
  const pn=(record.primerNombre!=null&&record.primerNombre!=="")?String(record.primerNombre).trim():"";
  const pa=(record.primerApellido!=null&&record.primerApellido!=="")?String(record.primerApellido).trim():"";
  if(pn||pa)return [pn,pa].filter(Boolean).join(" ").trim();
  const str=record.nombre||record.alumno||"";
  return shortDisplayName(str);
}
function shortDisplayName(str){
  if(!str)return str;
  const p4=parseNombre4(str);
  const nombre=p4.primerNombre||"";
  const ape=p4.primerApellido||"";
  const out=[nombre,ape].filter(Boolean).join(" ").trim();
  return out||str;
}
// Iniciales: primera letra del primer nombre y primera del primer apellido.
function getInitials(n){
  if(!n)return"?";
  const p4=parseNombre4(n);
  const pn=(p4.primerNombre||"").trim();
  const pa=(p4.primerApellido||"").trim();
  if(pn&&pa)return(pn[0]+pa[0]).toUpperCase();
  if(pn)return pn[0].toUpperCase();
  if(pa)return pa[0].toUpperCase();
  return"?";
}
// Clave para ordenar por apellidos (A1 [A2]) y luego nombres (P1 [P2]).
function sortKeyName(str){
  if(!str)return str;
  const p4=parseNombre4(str);
  const apellidos=[p4.primerApellido||"",p4.segundoApellido||""].filter(Boolean).join(" ").trim();
  const nombres=[p4.primerNombre||"",p4.segundoNombre||""].filter(Boolean).join(" ").trim();
  const out=[apellidos,nombres].filter(Boolean).join(" ").trim();
  return out||str;
}
// Clave para ordenar personas por primer nombre (P1 [P2]) y luego apellidos.
function sortKeyFirstName(str){
  if(!str)return str;
  const p4=parseNombre4(str);
  const nombres=[p4.primerNombre||"",p4.segundoNombre||""].filter(Boolean).join(" ").trim();
  const apellidos=[p4.primerApellido||"",p4.segundoApellido||""].filter(Boolean).join(" ").trim();
  const out=[nombres,apellidos].filter(Boolean).join(" ").trim();
  return out||str;
}
// De un nombre completo devuelve solo apellidos (A1 [A2]) para mostrar como nombre de familia.
function fullNameToApellidos(str){
  if(!str)return"";
  const p4=parseNombre4(str);
  return [p4.primerApellido||"",p4.segundoApellido||""].filter(Boolean).join(" ").trim();
}
// Una sola base: maestros/auxiliares. Mostrar siempre "Primer nombre + Primer apellido".
// Caso especial: algunos maestros de ADOLESCENTES están almacenados como "Apellido Nombre(s)".
// Para ellos, mostramos "Nombre Apellido" para que no parezcan personas distintas.
function displayMaestroNombre(str){
  if(!str)return"";
  if(Array.isArray(ADOLESCENTES_MAESTROS)&&ADOLESCENTES_MAESTROS.includes(str)){
    const parts=(str||"").trim().split(/\s+/).filter(Boolean);
    if(parts.length>=2){
      const apellido=parts[0];
      const primerNombre=parts[1];
      return [primerNombre,apellido].join(" ").trim();
    }
  }
  return shortDisplayName(str);
}
// Parsea para el formulario asumiendo "Apellido Nombre(s)": así al guardar con buildNombreFull queda "Nombre(s) Apellido(s)" y se unifica la base.
function parseNombreMaestroParaForm(str){
  if(!str)return{primerNombre:"",segundoNombre:"",primerApellido:"",segundoApellido:""};
  const p=(str.trim()).split(/\s+/).filter(Boolean);
  if(p.length>=4) return{primerNombre:p[2],segundoNombre:p[3],primerApellido:p[0],segundoApellido:p[1]};
  if(p.length===3) return{primerNombre:p[1],segundoNombre:p[2],primerApellido:p[0],segundoApellido:""};
  if(p.length>=2){const p4=parseNombre4(str);return{primerNombre:p4.primerNombre,segundoNombre:p4.segundoNombre,primerApellido:p4.primerApellido,segundoApellido:p4.segundoApellido};}
  const p4=parseNombre4(str);
  return{primerNombre:p4.primerNombre,segundoNombre:p4.segundoNombre,primerApellido:p4.primerApellido,segundoApellido:p4.segundoApellido};
}
function evalAvg(ev,videoAvg=null){
  const v=EVAL_KEYS.map(k=>ev[k]).filter(x=>x!=null);
  if(!v.length)return "—";
  const base=v.reduce((a,b)=>a+b,0)/v.length;
  if(videoAvg!=null){
    // video score (0-5) blends in as 20% of total
    return ((base*0.8)+(videoAvg*0.2)).toFixed(1);
  }
  return base.toFixed(1);
}
// Si la calificación total es la máxima (5), mostrar "5" sin decimales.
function formatEvalScore(avg){
  if(avg==null||avg==="—")return avg;
  const n=parseFloat(avg);
  if(Number.isNaN(n))return avg;
  if(n>=5)return "5";
  return String(avg);
}
// Calcula score de video 0-5 por sesión
function videoScore(v){
  if(!v||!v.hizo)return 0;
  // hizo: base 1 (ya sabemos hizo), calidad 1-5, aTiempo +1 bonus
  const raw=(v.calidad||3)+(v.aTiempo?1:0); // 1-6
  return Math.min(5,(raw/6)*5);
}
// Promedio de videos de un maestro (0-5). Maestros de ADOLESCENTES no tienen evaluación de videos.
function videoAvgForMaestro(maestroNombre,videos,maestros){
  const m=maestros&&maestros.find(x=>x.nombre===maestroNombre);
  if(m&&m.clase==="ADOLESCENTES")return null;
  const vs=(videos||[]).filter(v=>v.maestro===maestroNombre);
  if(!vs.length)return null;
  const scored=vs.map(videoScore);
  return scored.reduce((a,b)=>a+b,0)/scored.length;
}
// Clases que requieren video semanal
const VIDEO_CLASES=["CORDERITOS","VENCEDORES","CONQUISTADORES"];
function scoreColor(v){const n=parseFloat(v);if(isNaN(n))return"#9E9E9E";return n>=4?"#4CAF50":n>=3?"#F5A623":"#EF5350";}
function formatFecha(str){if(!str)return"";try{const[y,m,d]=str.split("-");return`${d} ${["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"][parseInt(m)-1]}`;}catch(e){return str;}}
// Sesión con fecha al menos 7 días en el pasado (para evaluar cumplimiento)
function sessionDateAtLeast7DaysAgo(fechaStr){if(!fechaStr)return false;try{const[y,m,d]=fechaStr.split("-").map(Number);const sessionDate=new Date(y,m-1,d);sessionDate.setHours(0,0,0,0);const today=new Date();today.setHours(0,0,0,0);return (today-sessionDate)>=7*86400000;}catch(e){return false;}}
// Cumplimiento de clases (1-5): según clases asignadas. Empieza en 5; cada falla registrada resta 1 punto (mínimo 1). Con una falla nunca puede tener 5 estrellas. Solo se calcula si tiene al menos una sesión como maestro/auxiliar o una falla.
function cumplimientoClasesFromCronograma(nombre,cronograma){
  let fallas=0;
  let tieneSesiones=false;
  (cronograma||[]).forEach(e=>{
    if(!e.leccion||e.leccion==="NO HAY CLASE")return;
    if(e.maestro===nombre||e.auxiliar===nombre)tieneSesiones=true;
    if(e.fallaMaestro===nombre){fallas++;tieneSesiones=true;}
    if(e.fallaAuxiliar===nombre){fallas++;tieneSesiones=true;}
  });
  if(!tieneSesiones)return null;
  if(fallas===0)return 5;
  return Math.max(1,5-fallas);
}

function diasHastaCumple(fechaDDMM){
  if(!fechaDDMM)return null;
  const today=new Date();today.setHours(0,0,0,0);
  const parts=fechaDDMM.split("/");if(parts.length<2)return null;
  const[d,m]=parts.map(Number);if(!d||!m)return null;
  let dt=new Date(today.getFullYear(),m-1,d);if(dt<today)dt=new Date(today.getFullYear()+1,m-1,d);
  return Math.round((dt-today)/86400000);
}
function labelDiasFaltan(diff){
  if(diff==null||diff===undefined)return "";
  if(diff===0)return "Hoy";
  if(diff===1)return "Mañana";
  if(diff===2)return "En 2 días";
  return "En "+diff+" días";
}

function getBirthdays(maestros,familias){
  const today=new Date();today.setHours(0,0,0,0);
  const parseDDMM=(str)=>{if(!str)return null;const parts=str.split("/");if(parts.length<2)return null;const[d,m]=parts.map(Number);if(!d||!m)return null;let dt=new Date(today.getFullYear(),m-1,d);if(dt<today)dt=new Date(today.getFullYear()+1,m-1,d);return dt;};
  const parseNacimiento=(str)=>{if(!str)return null;try{const d=new Date(str);if(isNaN(d.getTime()))return null;const dd=`${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}`;let dt=new Date(today.getFullYear(),d.getMonth(),d.getDate());if(dt<today)dt=new Date(today.getFullYear()+1,d.getMonth(),d.getDate());return {dt,fecha:dd};}catch(e){return null;}};
  const result=[];
  maestros.forEach(mx=>{
    let dt,fecha;
    if(mx.nacimiento){const r=parseNacimiento(mx.nacimiento);if(r){dt=r.dt;fecha=r.fecha;}}
    else{dt=parseDDMM(mx.cumpleanos);fecha=mx.cumpleanos;}
    if(dt&&fecha){const diff=Math.round((dt-today)/86400000);result.push({nombre:displayMaestroNombre(mx.nombre),tipo:mx.cargo,clase:mx.clase,fecha,diff,categoria:"maestro",foto:mx.foto||null,iniciales:getInitials(mx.nombre)});}
  });
  familias.forEach(f=>{const dt=parseDDMM(f.cumpleanos);if(dt){const diff=Math.round((dt-today)/86400000);result.push({nombre:shortDisplayName(f.alumno),tipo:"ALUMNO",clase:f.clase,fecha:f.cumpleanos,diff,categoria:"alumno",foto:f.foto||null,iniciales:getInitials(f.alumno)});}});
  return result.sort((a,b)=>a.diff-b.diff);
}

const S={
  card:{background:"#FFFFFF",borderRadius:16,boxShadow:"0 2px 16px rgba(91,45,142,0.09)",padding:"1rem",marginBottom:14},
  btn:(bg="#5B2D8E",color="#FFFFFF",full=false)=>({background:bg,color,border:"none",borderRadius:12,padding:"0.7rem 1.1rem",fontWeight:700,cursor:"pointer",fontSize:"0.875rem",width:full?"100%":undefined,display:"block",textAlign:"center",fontFamily:"inherit",lineHeight:1.2,WebkitTapHighlightColor:"transparent"}),
  input:{border:"2px solid #DDD0F0",borderRadius:12,padding:"0.75rem 1rem",fontSize:"1rem",outline:"none",width:"100%",boxSizing:"border-box",fontFamily:"inherit",color:"#2D1B4E",background:"#FFFFFF"},
  badge:(color)=>({background:color+"22",color,borderRadius:20,padding:"3px 12px",fontSize:"0.75rem",fontWeight:700,display:"inline-block",whiteSpace:"nowrap"}),
  tag:(color)=>({background:color,color:color==="#F5C842"?"#3D1B6B":"#FFFFFF",borderRadius:8,padding:"3px 10px",fontSize:"0.6875rem",fontWeight:700,display:"inline-block"}),
  label:{fontSize:"0.8125rem",fontWeight:700,color:"#7B6B9A",display:"block",marginBottom:6},
  title:{fontSize:"1.25rem",fontWeight:900,color:"#5B2D8E",margin:"0 0 1rem",letterSpacing:-0.5},
};

// ── Logo with elegant gradient border & edge fade. Si onClick, al tocar hace recarga en limpio. ──
function LogoImg({height=44,onClick}){
  const inner=(
    <div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
      <div style={{position:"absolute",inset:-3,borderRadius:18,background:"linear-gradient(135deg,#4BBCE0,#5B2D8E,#E84F9B)",opacity:0.4,filter:"blur(5px)"}}/>
      <div style={{position:"relative",background:"#FFFFFF",borderRadius:16,padding:"5px 12px",overflow:"hidden",boxShadow:"0 4px 18px rgba(91,45,142,0.18)",WebkitMaskImage:"radial-gradient(ellipse 94% 90% at 50% 50%,black 70%,transparent 100%)",maskImage:"radial-gradient(ellipse 94% 90% at 50% 50%,black 70%,transparent 100%)"}}>
        <img src={LOGO_SRC} alt="Escuela Dominical IPUE" style={{height,width:"auto",display:"block"}}/>
      </div>
    </div>
  );
  if(onClick) return <div role="button" tabIndex={0} style={{cursor:"pointer",display:"inline-flex",outline:"none"}} onClick={onClick} onKeyDown={e=>e.key==="Enter"&&onClick()}>{inner}</div>;
  return inner;
}
function LogoLogin(){
  return(
    <div style={{display:"flex",justifyContent:"center",marginBottom:16}}>
      <div style={{position:"relative"}}>
        <div style={{position:"absolute",inset:-5,borderRadius:24,background:"linear-gradient(135deg,#4BBCE0,#5B2D8E,#E84F9B)",opacity:0.45,filter:"blur(10px)"}}/>
        <div style={{position:"relative",background:"#FFFFFF",borderRadius:20,padding:"10px 20px",boxShadow:"0 8px 32px rgba(91,45,142,0.2)",WebkitMaskImage:"radial-gradient(ellipse 92% 88% at 50% 50%,black 65%,transparent 100%)",maskImage:"radial-gradient(ellipse 92% 88% at 50% 50%,black 65%,transparent 100%)",maxWidth:"100%"}}>
          <img src={LOGO_SRC} alt="Logo" style={{width:240,maxWidth:"100%",height:"auto",display:"block"}}/>
        </div>
      </div>
    </div>
  );
}

// Reusable avatar uploader (compressed)
function AvatarUpload({ photo, onPhoto, size=56, initials="?", color="#5B2D8E" }) {
  const ref = useRef(null);
  const handleChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const compressed = await compressImage(file, 128, 0.5);
    onPhoto(compressed);
  };
  return (
    <div style={{ position:"relative", width:size, height:size, flexShrink:0 }}>
      {photo
        ? <img src={photo} alt="foto" style={{ width:size, height:size, borderRadius:"50%", objectFit:"cover", border:`3px solid ${color}` }} />
        : <div style={{ width:size, height:size, borderRadius:"50%", background:color+"33", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:Math.round(size*0.3), color, border:`3px solid ${color}55` }}>{initials}</div>
      }
      <button onClick={(e)=>{e.stopPropagation();ref.current.click();}} style={{ position:"absolute", bottom:-2, right:-2, width:22, height:22, borderRadius:"50%", background:color, border:"2px solid #FFFFFF", cursor:"pointer", fontSize:11, color:"#FFFFFF", display:"flex", alignItems:"center", justifyContent:"center", padding:0 }}>📷</button>
      <input ref={ref} type="file" accept="image/*" style={{ display:"none" }} onChange={handleChange} />
    </div>
  );
}

function Modal({open,onClose,title,children}){
  if(!open)return null;
  return(
    <div data-modal-overlay style={{position:"fixed",inset:0,background:"rgba(30,10,60,0.65)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:1000,backdropFilter:"blur(4px)",overflow:"hidden",overscrollBehavior:"contain"}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div data-modal-content style={{background:"#FFFFFF",borderRadius:"24px 24px 0 0",padding:"1rem 1rem 1.5rem",width:"100%",maxWidth:520,maxHeight:"92vh",overflowY:"auto",overflowX:"hidden",boxShadow:"0 -8px 40px rgba(0,0,0,0.25)",minWidth:0,WebkitOverflowScrolling:"touch"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem",minWidth:0}}>
          <h3 style={{color:"#5B2D8E",fontWeight:800,fontSize:"1.0625rem",margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{title}</h3>
          <button onClick={onClose} style={{background:"#F5F0FF",border:"none",borderRadius:"50%",width:32,height:32,fontSize:18,cursor:"pointer",flexShrink:0}}>×</button>
        </div>
        <div style={{overflowX:"hidden",minWidth:0,maxWidth:"100%"}}>{children}</div>
      </div>
    </div>
  );
}

function BottomNav({tabs,active,onSelect}){
  return(
    <nav style={{position:"fixed",bottom:0,left:0,right:0,background:"#FFFFFF",borderTop:"2px solid #DDD0F0",display:"flex",zIndex:200,boxShadow:"0 -4px 20px rgba(91,45,142,0.12)",paddingBottom:"env(safe-area-inset-bottom,0)"}}>
      {tabs.map(t=>(
        <button key={t.id} onClick={()=>onSelect(t.id)} style={{flex:1,background:"none",border:"none",cursor:"pointer",padding:"10px 2px 8px",display:"flex",flexDirection:"column",alignItems:"center",gap:3,color:active===t.id?"#5B2D8E":"#7B6B9A",fontFamily:"inherit",WebkitTapHighlightColor:"transparent"}}>
          <span style={{fontSize:22}}>{t.icon}</span>
          <span style={{fontSize:9,fontWeight:active===t.id?800:600}}>{t.label}</span>
          {active===t.id&&<div style={{width:18,height:3,background:"#5B2D8E",borderRadius:2}}/>}
        </button>
      ))}
    </nav>
  );
}

function StatCard({icon,value,label,color="#5B2D8E",onClick}){
  const baseStyle={background:"#FFFFFF",borderRadius:16,padding:"14px 16px",boxShadow:"0 2px 12px rgba(91,45,142,0.09)",borderLeft:"5px solid "+color,display:"flex",alignItems:"center",gap:12};
  const style=onClick?{...baseStyle,cursor:"pointer",transition:"transform 0.15s, box-shadow 0.15s"}:baseStyle;
  return(
    <div
      style={style}
      onClick={onClick}
      onMouseDown={onClick?e=>e.currentTarget.style.transform="scale(0.98)":undefined}
      onMouseUp={onClick?e=>e.currentTarget.style.transform="":undefined}
      onMouseLeave={onClick?e=>e.currentTarget.style.transform="":undefined}
      role={onClick?"button":undefined}
    >
      <div style={{fontSize:26,width:46,height:46,background:color+"20",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{icon}</div>
      <div><div style={{fontSize:24,fontWeight:900,color,lineHeight:1}}>{value}</div><div style={{fontSize:11,color:"#7B6B9A",fontWeight:600,marginTop:2}}>{label}</div></div>
    </div>
  );
}

// Un solo banner: los 2 cumpleaños más cercanos (alumno o maestro/auxiliar)
function BirthdayBanner({maestros,familias}){
  const all=getBirthdays(maestros,familias);
  const dosMasCercanos=all.slice(0,2);
  if(!dosMasCercanos.length)return null;
  const thumb=(b,size=44)=>(b.foto?<img src={b.foto} alt="" style={{width:size,height:size,borderRadius:"50%",objectFit:"cover",border:"2px solid rgba(255,255,255,0.5)",flexShrink:0}}/>:<div style={{width:size,height:size,borderRadius:"50%",background:"rgba(255,255,255,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:size*0.4,color:"#FFFFFF",flexShrink:0}}>{(b.iniciales||"?").slice(0,2)}</div>);
  return(
    <div style={{margin:"0 16px 14px"}}>
      {dosMasCercanos.map((b,i)=>(
        b.diff===0 ? (
          <div key={i} style={{background:"linear-gradient(135deg,#E84F9B,#F27DB8)",borderRadius:16,padding:"14px 16px",display:"flex",alignItems:"center",gap:12,marginBottom:i<dosMasCercanos.length-1?8:0,boxShadow:"0 4px 16px rgba(232,79,155,0.3)"}}>
            {thumb(b,48)}
            <span style={{fontSize:32}}>🎂</span>
            <div style={{flex:1}}><div style={{color:"#FFFFFF",fontWeight:900,fontSize:16}}>¡Cumpleaños hoy!</div><div style={{color:"rgba(255,255,255,0.9)",fontWeight:700,fontSize:14}}>{b.nombre}</div><div style={{color:"rgba(255,255,255,0.75)",fontSize:12}}>{b.tipo}{b.clase&&b.categoria==="alumno"?" · "+b.clase:""}</div></div>
            <span style={{background:"rgba(255,255,255,0.25)",color:"#FFFFFF",borderRadius:10,padding:"4px 10px",fontWeight:800,fontSize:13}}>Hoy</span>
          </div>
        ) : (
          <div key={i} style={{background:"linear-gradient(135deg,#5B2D8E,#7B4DB2)",borderRadius:16,padding:"0.75rem 1rem",display:"flex",alignItems:"center",gap:12,marginBottom:i<dosMasCercanos.length-1?8:0,boxShadow:"0 4px 16px rgba(91,45,142,0.2)"}}>
            {thumb(b,40)}
            <span style={{fontSize:26}}>🎉</span>
            <div style={{flex:1}}><div style={{color:"#F5C842",fontWeight:800,fontSize:12}}>Próximo cumpleaños</div><div style={{color:"#FFFFFF",fontWeight:700,fontSize:14}}>{b.nombre}</div><div style={{color:"rgba(255,255,255,0.7)",fontSize:12}}>{b.tipo}{b.clase&&b.categoria==="alumno"?" · "+b.clase:""} · {b.fecha}</div></div>
            <span style={{background:"rgba(255,255,255,0.2)",color:"#FFFFFF",borderRadius:10,padding:"4px 10px",fontWeight:800,fontSize:13}}>{labelDiasFaltan(b.diff)}</span>
          </div>
        )
      ))}
    </div>
  );
}

// Versículo bíblico diario — cambia cada día (índice por día del año)
const VERSICULOS_DIARIOS = [
  { ref: "Proverbios 22:6", texto: "Instruye al niño en su camino, Y aun cuando fuere viejo no se apartará de él.", url: "https://www.bible.com/bible/149/PRO.22.6" },
  { ref: "Deuteronomio 6:7", texto: "Y las repetirás a tus hijos, y hablarás de ellas estando en tu casa, y andando por el camino.", url: "https://www.bible.com/bible/149/DEU.6.7" },
  { ref: "Salmos 127:3", texto: "Herencia de Jehová son los hijos; cosa de estima el fruto del vientre.", url: "https://www.bible.com/bible/149/PSA.127.3" },
  { ref: "Mateo 19:14", texto: "Dejad a los niños venir a mí, y no se lo impidáis; porque de los tales es el reino de los cielos.", url: "https://www.bible.com/bible/149/MAT.19.14" },
  { ref: "Isaías 54:13", texto: "Y todos tus hijos serán enseñados por Jehová; y se multiplicará la paz de tus hijos.", url: "https://www.bible.com/bible/149/ISA.54.13" },
  { ref: "2 Timoteo 3:15", texto: "Y que desde la niñez has sabido las Sagradas Escrituras, las cuales te pueden hacer sabio para la salvación.", url: "https://www.bible.com/bible/149/2TI.3.15" },
  { ref: "Salmos 78:4", texto: "No las encubriremos a sus hijos, contando a la generación venidera las alabanzas de Jehová.", url: "https://www.bible.com/bible/149/PSA.78.4" },
  { ref: "Efesios 6:4", texto: "Y vosotros, padres, no provoquéis a ira a vuestros hijos, sino criadlos en disciplina y amonestación del Señor.", url: "https://www.bible.com/bible/149/EPH.6.4" },
  { ref: "Colosenses 3:21", texto: "Padres, no exasperéis a vuestros hijos, para que no se desalienten.", url: "https://www.bible.com/bible/149/COL.3.21" },
  { ref: "Proverbios 29:17", texto: "Corrige a tu hijo, y te dará descanso, y dará alegría a tu alma.", url: "https://www.bible.com/bible/149/PRO.29.17" },
];
function getVersiculoDelDia(){
  const start = new Date(new Date().getFullYear(), 0, 0);
  const now = new Date();
  const dayOfYear = Math.floor((now - start) / 86400000);
  const idx = dayOfYear % VERSICULOS_DIARIOS.length;
  return VERSICULOS_DIARIOS[idx];
}
function VerseBannerMaestros(){
  const { ref, texto, url } = getVersiculoDelDia();
  return(
    <a href={url} target="_blank" rel="noopener noreferrer" style={{textDecoration:"none",display:"block",margin:"0 16px 14px",minHeight:72}}>
      <div style={{background:"linear-gradient(135deg,#E8F5E9,#C8E6C9)",borderRadius:16,padding:"14px 16px",boxShadow:"0 2px 12px rgba(129,199,132,0.2)",borderLeft:"5px solid #81C784",cursor:"pointer",transition:"box-shadow 0.2s",minHeight:72,boxSizing:"border-box"}} onMouseOver={e=>{e.currentTarget.style.boxShadow="0 4px 16px rgba(129,199,132,0.3)";}} onMouseOut={e=>{e.currentTarget.style.boxShadow="0 2px 12px rgba(129,199,132,0.2)";}}>
        <div style={{color:"#2E7D32",fontSize:14,lineHeight:1.5,fontStyle:"italic",marginBottom:6}}>«{texto}»</div>
        <div style={{color:"#558B2F",fontSize:12,fontWeight:700}}>📖 {ref}</div>
      </div>
    </a>
  );
}


// ══════════ ERROR BOUNDARY ══════════