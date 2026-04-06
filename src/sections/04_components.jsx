const { useState, useEffect, useCallback, useRef, useMemo } = React;

// Catches render errors and shows a friendly message instead of blank page
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{padding:32,textAlign:"center",fontFamily:"system-ui"}}>
          <div style={{fontSize:48,marginBottom:16}}>âš ï¸</div>
          <div style={{fontSize:20,fontWeight:800,color:"#5B2D8E",marginBottom:8}}>Algo saliÃ³ mal</div>
          <div style={{fontSize:13,color:"#7B6B9A",marginBottom:24}}>{(this.state.error&&this.state.error.message)||"Error desconocido"}</div>
          <button
            onClick={()=>this.setState({hasError:false,error:null})}
            style={{background:"#5B2D8E",color:"#FFF",border:"none",borderRadius:10,padding:"10px 24px",fontSize:14,cursor:"pointer",fontWeight:700}}
          >ðŸ”„ Reintentar</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// â•â•â•â•â•â•â•â•â•â• LOGIN â•â•â•â•â•â•â•â•â•â•
function LoginScreen({onLogin}){
  const [mode,setMode]=useState("select");
  const [adminPw,setAdminPw]=useState("");
  const [teacherName,setTeacherName]=useState("");
  const [teacherPw,setTeacherPw]=useState("");
  const [error,setError]=useState("");
  const [maestros,setMaestros]=useState(INITIAL_MAESTROS);
  const [passwords,setPasswords]=useState({});
  const [adminProfile,setAdminProfile]=useState(null);
  const adminPwRef=useRef(null);
  const teacherPwRef=useRef(null);
  useEffect(()=>{
    loadData("maestros").then(d=>{if(d)setMaestros(d);});
    loadData("teacherPasswords").then(d=>{if(d)setPasswords(d);});
    loadData("adminProfile").then(d=>{if(d)setAdminProfile(d);});
  },[]);
  useEffect(()=>{
    if(mode==="admin"){ const t=setTimeout(()=>{adminPwRef.current?.focus();},0); return ()=>clearTimeout(t); }
    if(mode==="teacher"){ const t=setTimeout(()=>{teacherPwRef.current?.focus();},0); return ()=>clearTimeout(t); }
  },[mode]);
  useEffect(()=>{ if(mode==="teacher"&&teacherName){ const t=setTimeout(()=>{teacherPwRef.current?.focus();},0); return ()=>clearTimeout(t); } },[mode,teacherName]);
  const handleTeacher=()=>{
    if(!teacherName){setError("Selecciona tu nombre");return;}
    if(teacherPw!==(passwords[teacherName]||DEFAULT_TEACHER_PASSWORD)){setError("ContraseÃ±a incorrecta");return;}
    onLogin({role:"teacher",name:teacherName});
  };
  return(
    <div style={{minHeight:"100dvh",background:"linear-gradient(160deg,#3D1B6B 0%,#5B2D8E 55%,#2A96BC 100%)",display:"flex",alignItems:"center",justifyContent:"center",padding:"1.5rem 1rem",boxSizing:"border-box",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:-80,right:-80,width:280,height:280,background:"#E84F9B44",borderRadius:"50%",filter:"blur(40px)"}}/>
      <div style={{position:"absolute",bottom:-60,left:-60,width:240,height:240,background:"#4BBCE044",borderRadius:"50%",filter:"blur(40px)"}}/>
      <div style={{background:"rgba(255,255,255,0.97)",borderRadius:28,padding:"1.5rem 1.25rem",width:"100%",maxWidth:400,boxShadow:"0 24px 80px rgba(0,0,0,0.35)",position:"relative",zIndex:1}}>
        <LogoLogin/>
        <div style={{textAlign:"center",marginBottom:24,fontSize:11,color:"#7B6B9A",fontWeight:700,letterSpacing:2,textTransform:"uppercase"}}>Villanueva del Pardillo</div>
        {mode==="select"&&(
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <h3 style={{textAlign:"center",color:"#5B2D8E",fontWeight:800,margin:"0 0 4px",fontSize:18}}>Â¿CÃ³mo deseas entrar?</h3>
            <button style={{...S.btn("#5B2D8E","#FFFFFF",true),padding:"16px",fontSize:16,borderRadius:16}} onClick={()=>setMode("admin")}>ðŸ” Administrador</button>
            <button style={{...S.btn("#4BBCE0","#FFFFFF",true),padding:"16px",fontSize:16,borderRadius:16}} onClick={()=>setMode("teacher")}>ðŸ‘©â€ðŸ« Soy Maestro / Auxiliar</button>
          </div>
        )}
        {mode==="admin"&&(
          <div>
            <h3 style={{textAlign:"center",color:"#5B2D8E",fontWeight:800,marginBottom:20,fontSize:18}}>Acceso Administrador</h3>
            <label style={S.label}>ContraseÃ±a</label>
            <input
              ref={adminPwRef}
              type="password"
              style={{...S.input,marginBottom:16}}
              value={adminPw}
              onChange={e=>setAdminPw(e.target.value)}
              onKeyDown={e=>{
                if(e.key==="Enter"){
                  const cfgPw=adminProfile?.adminPassword||ADMIN_PASSWORD;
                  if(adminPw===cfgPw||adminPw===ADMIN_PASSWORD)onLogin("admin");
                  else setError("ContraseÃ±a incorrecta");
                }
              }}
              placeholder="â€¢â€¢â€¢â€¢"
              autoFocus
            />
            {error&&<div style={{color:"#EF5350",fontSize:13,marginBottom:12,textAlign:"center",fontWeight:700}}>{error}</div>}
            <button
              style={{...S.btn("#5B2D8E","#FFFFFF",true),padding:"14px",marginBottom:10}}
              onClick={()=>{
                const cfgPw=adminProfile?.adminPassword||ADMIN_PASSWORD;
                if(adminPw===cfgPw||adminPw===ADMIN_PASSWORD)onLogin("admin");
                else setError("ContraseÃ±a incorrecta");
              }}
            >
              Entrar
            </button>
            <button style={{...S.btn("transparent","#7B6B9A",true),padding:"10px"}} onClick={()=>{setMode("select");setError("");}}>â† Volver</button>
          </div>
        )}
        {mode==="teacher"&&(
          <div>
            <h3 style={{textAlign:"center",color:"#5B2D8E",fontWeight:800,marginBottom:20,fontSize:18}}>Acceso Maestro</h3>
            <label style={S.label}>Tu nombre</label>
            <select style={{...S.input,marginBottom:14}} value={teacherName} onChange={e=>{setTeacherName(e.target.value);setError("");}}>
              <option value="">â€” Selecciona tu nombre â€”</option>
              {[...maestros].sort((a,b)=>sortKeyFirstName(a.nombre).localeCompare(sortKeyFirstName(b.nombre),"es")).map(m=><option key={m.id} value={m.nombre}>{displayMaestroNombre(m.nombre)} ({m.cargo})</option>)}
            </select>
            <label style={S.label}>ContraseÃ±a</label>
            <input ref={teacherPwRef} type="password" style={{...S.input,marginBottom:16}} value={teacherPw} onChange={e=>setTeacherPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleTeacher()} placeholder="â€¢â€¢â€¢â€¢"/>
            {error&&<div style={{color:"#EF5350",fontSize:13,marginBottom:12,textAlign:"center",fontWeight:700}}>{error}</div>}
            <button style={{...S.btn("#4BBCE0","#FFFFFF",true),padding:"14px",marginBottom:10}} onClick={handleTeacher}>Entrar</button>
            <button style={{...S.btn("transparent","#7B6B9A",true),padding:"10px"}} onClick={()=>{setMode("select");setError("");}}>â† Volver</button>
          </div>
        )}
      </div>
    </div>
  );
}

// â•â•â•â•â•â•â•â•â•â• ADMIN DASHBOARD â•â•â•â•â•â•â•â•â•â•
function AdminDashboard({data,onUpdateData,onGoToTab}){
  const maestros=Array.isArray(data.maestros)?data.maestros:[];
  const familias=Array.isArray(data.familias)?data.familias:[];
  const eventos=Array.isArray(data.eventos)?data.eventos:[];
  const peticiones=Array.isArray(data.peticiones)?data.peticiones:[];
  const clases=data.clases&&typeof data.clases==="object"?data.clases:{};
  const ninos=Object.values(clases).flat();
  const go=(tabId,masSub)=>{if(onGoToTab)onGoToTab(tabId,masSub);};
  const today=new Date();
  const upcomingEvents=eventos.filter(e=>{try{const[d,m,y]=e.fecha.split("/");const dt=new Date(parseInt(y),parseInt(m)-1,parseInt(d));const diff=Math.floor((dt-today)/86400000);return diff>=0&&diff<=60;}catch(e){return false;}}).sort((a,b)=>{try{const[da,ma,ya]=a.fecha.split("/");const[db,mb,yb]=b.fecha.split("/");return new Date(parseInt(ya),parseInt(ma)-1,parseInt(da))-new Date(parseInt(yb),parseInt(mb)-1,parseInt(db));}catch(e){return 0;}}).slice(0,5);
  const[sortedPeticiones,setSortedPeticiones]=useState([]);
  const[peticionForm,setPeticionForm]=useState({texto:"",anonimo:false});
  const[peticionModal,setPeticionModal]=useState(false);
  const[peticionEditId,setPeticionEditId]=useState(null);
  const[peticionEditForm,setPeticionEditForm]=useState({texto:"",anonimo:false});
  useEffect(()=>{setSortedPeticiones((peticiones||[]).slice().sort((a,b)=>new Date(b.fecha)-new Date(a.fecha)));},[peticiones]);
  const savePeticionNueva=()=>{
    if(!peticionForm.texto.trim())return;
    onUpdateData("peticiones",[...(peticiones||[]),{id:Date.now(),texto:peticionForm.texto.trim(),autor:"admin",anonimo:!!peticionForm.anonimo,fecha:new Date().toISOString()}]);
    setPeticionForm({texto:"",anonimo:false});
  };
  const openEditPeticion=(p)=>{setPeticionEditId(p.id);setPeticionEditForm({texto:p.texto,anonimo:p.anonimo});setPeticionModal(true);};
  const savePeticionEdit=()=>{
    if(!peticionEditForm.texto.trim())return;
    if(peticionEditId)onUpdateData("peticiones",(peticiones||[]).map(p=>p.id===peticionEditId?{...p,texto:peticionEditForm.texto,anonimo:peticionEditForm.anonimo}:p));
    setPeticionModal(false);
  };
  const deletePeticion=()=>{if(peticionEditId&&!confirmDelete("Â¿Eliminar esta peticiÃ³n de oraciÃ³n?"))return;if(peticionEditId){onUpdateData("peticiones",(peticiones||[]).filter(p=>p.id!==peticionEditId));setPeticionModal(false);}};
  return(
    <div style={{paddingBottom:10}}>
      <BirthdayBanner maestros={maestros} familias={familias}/>
      <VerseBannerMaestros/>
      <div style={{padding:"0 1rem 6.25rem"}}>
        <h2 style={S.title}>Panel General</h2>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
          <StatCard icon="ðŸ‘¨â€ðŸ«" value={maestros.filter(m=>m.cargo==="MAESTRO").length} label="Maestros" color="#5B2D8E" onClick={onGoToTab?()=>go("maestros"):undefined}/>
          <StatCard icon="ðŸ¤" value={maestros.filter(m=>m.cargo==="AUXILIAR").length} label="Auxiliares" color="#4BBCE0" onClick={onGoToTab?()=>go("maestros"):undefined}/>
          <StatCard icon="ðŸ‘¶" value={ninos.length} label="NiÃ±os" color="#E84F9B" onClick={onGoToTab?()=>go("clases"):undefined}/>
          <StatCard icon="ðŸ‘¨â€ðŸ‘©â€ðŸ‘§" value={[...new Set(familias.map(f=>f.num))].filter(Boolean).length} label="Familias" color="#F5C842" onClick={onGoToTab?()=>go("mas","familias"):undefined}/>
          <StatCard icon="ðŸ™" value={ninos.filter(n=>n.bautizado).length} label="Bautizados" color="#22c55e" onClick={onGoToTab?()=>go("alumnos","bautizados"):undefined}/>
          <StatCard icon="âœ¨" value={ninos.filter(n=>n.sellado).length} label="Sellados" color="#a78bfa" onClick={onGoToTab?()=>go("alumnos","sellados"):undefined}/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
          <a href="https://drive.google.com/drive/folders/1PW00hDNw0POgEPW4LiANMH7PgByvX8A5?usp=sharing" target="_blank" rel="noopener noreferrer" style={{textDecoration:"none"}}>
            <div style={{...S.card,cursor:"pointer",display:"flex",alignItems:"center",gap:12,padding:14,border:"2px solid #5B2D8E33"}} onMouseOver={e=>{e.currentTarget.style.borderColor="#5B2D8E88";}} onMouseOut={e=>{e.currentTarget.style.borderColor="#5B2D8E33";}}>
              <div style={{width:44,height:44,borderRadius:12,background:"#5B2D8E22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>ðŸ“</div>
              <div><div style={{fontWeight:800,color:"#5B2D8E",fontSize:14}}>Recursos E.D.</div><div style={{fontSize:11,color:"#7B6B9A"}}>Carpeta Google Drive</div></div>
            </div>
          </a>
          <a href="https://chat.whatsapp.com/D5XEyuz7NWXKtJeZQqG0h2?mode=gi_t" target="_blank" rel="noopener noreferrer" style={{textDecoration:"none"}}>
            <div style={{...S.card,cursor:"pointer",display:"flex",alignItems:"center",gap:12,padding:14,border:"2px solid #25D36633"}} onMouseOver={e=>{e.currentTarget.style.borderColor="#25D36688";}} onMouseOut={e=>{e.currentTarget.style.borderColor="#25D36633";}}>
              <div style={{width:44,height:44,borderRadius:12,background:"#25D36622",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>ðŸ’¬</div>
              <div><div style={{fontWeight:800,color:"#128C7E",fontSize:14}}>Grupo WhatsApp</div><div style={{fontSize:11,color:"#7B6B9A"}}>Maestros</div></div>
            </div>
          </a>
          <a href="https://www.bible.com/es/reading-plans/14400-la-biblia-en-1-ano" target="_blank" rel="noopener noreferrer" style={{textDecoration:"none",gridColumn:"1 / -1"}}>
            <div style={{...S.card,cursor:"pointer",display:"flex",alignItems:"center",gap:12,padding:14,border:"2px solid #8B691433"}} onMouseOver={e=>{e.currentTarget.style.borderColor="#8B691488";}} onMouseOut={e=>{e.currentTarget.style.borderColor="#8B691433";}}>
              <div style={{width:44,height:44,borderRadius:12,background:"#8B691422",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>ðŸ“–</div>
              <div><div style={{fontWeight:800,color:"#6B4E10",fontSize:14}}>Plan de lectura bÃ­blica (1 aÃ±o)</div><div style={{fontSize:11,color:"#7B6B9A"}}>Bible.com Â· Recorrido completo en un aÃ±o</div></div>
            </div>
          </a>
        </div>
        <div style={S.card}>
          <h3 style={{color:"#5B2D8E",fontWeight:800,fontSize:15,marginBottom:12}}>ðŸ“Š Alumnos por Clase</h3>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {CLASES_LIST.map(cl=>(
              <div
                key={cl}
                role={onGoToTab?"button":undefined}
                style={{background:CLASE_COLORS[cl]+"18",border:`2px solid ${CLASE_COLORS[cl]}44`,borderRadius:14,padding:"12px",textAlign:"center",...(onGoToTab?{cursor:"pointer",transition:"transform 0.15s"}:{})}}
                onClick={onGoToTab?()=>go("clases"):undefined}
                onMouseDown={onGoToTab?e=>e.currentTarget.style.transform="scale(0.98)":undefined}
                onMouseUp={onGoToTab?e=>e.currentTarget.style.transform="":undefined}
                onMouseLeave={onGoToTab?e=>e.currentTarget.style.transform="":undefined}
              >
                <div style={{fontSize:26,fontWeight:900,color:CLASE_COLORS[cl]}}>{(clases[cl]||[]).length}</div>
                <div style={{fontWeight:800,color:CLASE_COLORS[cl],fontSize:11}}>{cl}</div>
                <div style={{fontSize:10,color:"#7B6B9A",marginTop:2}}>{maestros.filter(m=>m.clase===cl).length} maestros</div>
              </div>
            ))}
          </div>
        </div>
        <div style={S.card}>
          <h3 style={{color:"#4BBCE0",fontWeight:800,fontSize:15,marginBottom:12}}>ðŸ“† PrÃ³ximos Eventos (60 dÃ­as)</h3>
          {upcomingEvents.length===0&&<div style={{color:"#7B6B9A"}}>Sin eventos prÃ³ximos.</div>}
          {upcomingEvents.map((e,i)=>(
            <div key={e.id} style={{display:"flex",gap:10,marginBottom:10,paddingBottom:10,borderBottom:i<upcomingEvents.length-1?"1px solid #DDD0F0":"none"}}>
              <div style={{background:(e.tipo==="NACIONAL"?"#5B2D8E":"#4BBCE0")+"22",borderRadius:8,padding:"4px 8px",fontSize:11,fontWeight:800,color:e.tipo==="NACIONAL"?"#5B2D8E":"#2A96BC",flexShrink:0}}>{e.fecha}</div>
              <div style={{fontWeight:600,fontSize:13}}>{e.nombre}</div>
            </div>
          ))}
        </div>
        <div style={{...S.card,borderLeft:"5px solid #EF5350"}}>
          <h3 style={{color:"#EF5350",fontWeight:800,fontSize:15,marginBottom:10}}>âš ï¸ Certificados Pendientes</h3>
          {maestros.filter(m=>m.certificado==="NO").length===0
            ?<div style={{color:"#4CAF50",fontWeight:700}}>âœ… Todos al dÃ­a</div>
            :maestros.filter(m=>m.certificado==="NO").map((m,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                <div style={{flex:1,fontWeight:700,fontSize:13}}>{displayMaestroNombre(m.nombre)}</div>
                <span style={S.badge(CLASE_COLORS[m.clase]||"#5B2D8E")}>{m.clase}</span>
              </div>
            ))
          }
        </div>
        <div style={{...S.card,borderLeft:"5px solid #E84F9B",marginBottom:14}}>
          <div style={{fontWeight:800,color:"#E84F9B",fontSize:15,marginBottom:12}}>ðŸ™ Peticiones de OraciÃ³n</div>
          {sortedPeticiones.length===0&&<div style={{color:"#7B6B9A",textAlign:"center",padding:20,fontStyle:"italic",fontSize:13}}>Sin peticiones. Escribe la primera abajo.</div>}
          {sortedPeticiones.map(p=>(
            <div key={p.id} style={{padding:"10px 0",borderBottom:"1px solid #DDD0F0"}}>
              <div style={{fontSize:13,color:"#2D1B4E",lineHeight:1.5}}>{p.texto}</div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:6,marginTop:6}}>
                <div style={{fontSize:11,color:"#7B6B9A"}}>
                  {p.anonimo?"ðŸ”’ AnÃ³nimo":shortDisplayName(p.autor)} Â· {p.fecha?new Date(p.fecha).toLocaleDateString("es-ES",{day:"2-digit",month:"short",year:"numeric"}):""}
                </div>
                <button style={{...S.btn("#4BBCE0"),padding:"5px 10px",fontSize:12}} onClick={()=>openEditPeticion(p)}>âœï¸</button>
              </div>
            </div>
          ))}
          <div style={{marginTop:16,paddingTop:16,borderTop:"2px solid #E84F9B33"}}>
            <div style={{fontSize:12,color:"#7B6B9A",marginBottom:8}}>AÃ±adir peticiÃ³n de oraciÃ³n (visible para todos los maestros)</div>
            <textarea style={{...S.input,height:80,resize:"vertical",marginBottom:10}} value={peticionForm.texto} onChange={e=>setPeticionForm(f=>({...f,texto:e.target.value}))} placeholder="Escribe tu peticiÃ³n de oraciÃ³n..."/>
            <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",marginBottom:12}}>
              <input type="checkbox" checked={!!peticionForm.anonimo} onChange={e=>setPeticionForm(f=>({...f,anonimo:e.target.checked}))} style={{width:20,height:20,accentColor:"#5B2D8E"}}/>
              <span style={{fontSize:13,color:"#5B2D8E",fontWeight:600}}>ðŸ”’ PeticiÃ³n anÃ³nima</span>
            </label>
            <button style={{...S.btn("#E84F9B","#FFFFFF",true),padding:12,fontSize:14}} onClick={savePeticionNueva}>ðŸ™ Guardar PeticiÃ³n</button>
          </div>
        </div>
      </div>
      <Modal open={peticionModal} onClose={()=>setPeticionModal(false)} title="Editar PeticiÃ³n">
        <label style={S.label}>PeticiÃ³n</label>
        <textarea style={{...S.input,height:100,resize:"vertical",marginBottom:12}} value={peticionEditForm.texto} onChange={e=>setPeticionEditForm(f=>({...f,texto:e.target.value}))}/>
        <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",marginBottom:16}}>
          <input type="checkbox" checked={!!peticionEditForm.anonimo} onChange={e=>setPeticionEditForm(f=>({...f,anonimo:e.target.checked}))} style={{width:20,height:20,accentColor:"#5B2D8E"}}/>
          <span style={{fontSize:13,fontWeight:600}}>ðŸ”’ AnÃ³nima</span>
        </label>
        <button style={{...S.btn("#E84F9B","#FFFFFF",true),padding:12}} onClick={savePeticionEdit}>ðŸ’¾ Guardar</button>
        <button style={{...S.btn("#FFF0F0","#EF5350"),padding:12,marginTop:10,border:"1.5px solid #EF535044"}} onClick={deletePeticion}>ðŸ—‘ Eliminar</button>
      </Modal>
    </div>
  );
}

// â•â•â•â•â•â•â•â•â•â• MAESTROS PANEL â•â•â•â•â•â•â•â•â•â•
function MaestrosPanel({maestros,onUpdate}){
  const[search,setSearch]=useState("");
  const[filterCargo,setFilterCargo]=useState("TODOS");
  const[modal,setModal]=useState(false);
  const[form,setForm]=useState({});
  const[editId,setEditId]=useState(null);
  const filtered=maestros.filter(m=>{const q=search.toLowerCase();if(q&&!displayMaestroNombre(m.nombre).toLowerCase().includes(q))return false;if(filterCargo!=="TODOS"&&m.cargo!==filterCargo)return false;return true;});
  const openAdd=()=>{setForm({primerNombre:"",primerApellido:"",cargo:"MAESTRO",clase:"CORDERITOS",nacimiento:"",cumpleanos:"",certificado:"SI"});setEditId(null);setModal(true);};
  const openEdit=(m)=>{const s=(m.nombre||"").trim().split(/\s+/).filter(Boolean);const primerNombre=s.length?s[0]:"";const primerApellido=s.length>=2?s[s.length-1]:"";setForm({...m,primerNombre,primerApellido,nacimiento:m.nacimiento||""});setEditId(m.id);setModal(true);};
  const save=()=>{
    const nombre=[(form.primerNombre||"").trim(),(form.primerApellido||"").trim()].filter(Boolean).join(" ").trim();
    let toSave={...form,nombre};
    if(toSave.nacimiento){
      try{
        const d=new Date(toSave.nacimiento);
        toSave.cumpleanos=`${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}`;
      }catch(e){}
    }
    onUpdate(editId?maestros.map(m=>m.id===editId?{...toSave,id:editId}:m):[...maestros,{...toSave,id:Date.now()}]);setModal(false);
  };
  const deleteMaestro=()=>{const nom=[(form.primerNombre||"").trim(),(form.primerApellido||"").trim()].filter(Boolean).join(" ");if(!confirmDelete("Â¿Eliminar a "+displayMaestroNombre(form.nombre||nom)+"?"))return;onUpdate(maestros.filter(x=>x.id!==editId));setModal(false);};
  return(
    <div style={{padding:"1rem 1rem 6.25rem"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <h2 style={S.title}>Maestros</h2>
        <button style={{...S.btn("#5B2D8E"),padding:"10px 16px",fontSize:14}} onClick={openAdd}>+ Agregar</button>
      </div>
      <input style={{...S.input,marginBottom:10}} placeholder="ðŸ” Buscar..." value={search} onChange={e=>setSearch(e.target.value)}/>
      <div style={{display:"flex",gap:8,marginBottom:10,alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",gap:8}}>
        {["TODOS","MAESTRO","AUXILIAR"].map(c=>(
          <button key={c} style={{...S.btn(filterCargo===c?"#5B2D8E":"#F5F0FF",filterCargo===c?"#FFFFFF":"#2D1B4E"),padding:"8px 14px",fontSize:12,borderRadius:20}} onClick={()=>setFilterCargo(c)}>{c}</button>
        ))}
      </div>
        <div style={{fontSize:11,color:"#7B6B9A"}}>Toca la foto para actualizarla</div>
      </div>
      {[...filtered].sort((a,b)=>sortKeyFirstName(a.nombre).localeCompare(sortKeyFirstName(b.nombre),"es")).map(m=>(
        <div key={m.id} style={{...S.card,display:"flex",alignItems:"center",gap:12}}>
          <AvatarUpload
            photo={m.foto||null}
            onPhoto={f=>onUpdate(maestros.map(x=>x.id===m.id?{...x,foto:f}:x))}
            size={44}
            initials={getInitials(m.nombre)}
            color={CLASE_COLORS[m.clase]||"#5B2D8E"}
          />
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:800,fontSize:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{displayMaestroNombre(m.nombre)}</div>
            <div style={{display:"flex",gap:5,marginTop:4,flexWrap:"wrap"}}>
              <span style={S.badge(m.cargo==="MAESTRO"?"#5B2D8E":"#4BBCE0")}>{m.cargo}</span>
              <span style={S.badge(CLASE_COLORS[m.clase]||"#5B2D8E")}>{m.clase}</span>
              {m.certificado&&<span style={S.badge(m.certificado==="SI"?"#4CAF50":"#EF5350")}>{m.certificado==="SI"?"âœ…":"âŒ"}</span>}
            </div>
          </div>
          <button style={{...S.btn("#4BBCE0"),padding:"8px 12px",fontSize:13}} onClick={()=>openEdit(m)}>âœï¸</button>
        </div>
      ))}
      <Modal open={modal} onClose={()=>setModal(false)} title={editId?"Editar Maestro":"Nuevo Maestro"}>
        <div style={{marginBottom:14}}><label style={S.label}>Nombre</label><input type="text" style={S.input} placeholder="Ej: JosÃ©" value={form.primerNombre||""} onChange={e=>setForm(f=>({...f,primerNombre:e.target.value}))}/></div>
        <div style={{marginBottom:14}}><label style={S.label}>Apellido</label><input type="text" style={S.input} placeholder="Ej: MogollÃ³n" value={form.primerApellido||""} onChange={e=>setForm(f=>({...f,primerApellido:e.target.value}))}/></div>
        <div style={{marginBottom:14}}><label style={S.label}>Fecha de Nacimiento</label><input type="date" style={S.input} value={form.nacimiento||""} onChange={e=>setForm(f=>({...f,nacimiento:e.target.value}))}/></div>
        {form.nacimiento&&(function(){try{const d=new Date(form.nacimiento);const dd=`${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}`;const hoy=new Date();const edad=hoy.getFullYear()-d.getFullYear()-(hoy<new Date(hoy.getFullYear(),d.getMonth(),d.getDate())?1:0);return <div style={{marginBottom:14,background:"#F5F0FF",borderRadius:12,padding:"10px 14px",fontSize:13,color:"#5B2D8E"}}>ðŸŽ‚ CumpleaÃ±os: {dd} Â· {edad} aÃ±os</div>;}catch(e){return null;}}())}
        {[["Cargo","cargo",["MAESTRO","AUXILIAR"]],["Clase","clase",CLASES_LIST],["Certificado","certificado",["SI","NO"]]].map(([l,k,opts])=>(
          <div key={k} style={{marginBottom:14}}><label style={S.label}>{l}</label><select style={S.input} value={form[k]||""} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}>{opts.map(o=><option key={o} value={o}>{o}</option>)}</select></div>
        ))}
        <button style={{...S.btn("#5B2D8E","#FFFFFF",true),padding:14,marginTop:8}} onClick={save}>ðŸ’¾ Guardar</button>
        {editId&&<button style={{...S.btn("#FFF0F0","#EF5350"),padding:12,marginTop:10,border:"1.5px solid #EF535044"}} onClick={deleteMaestro}>ðŸ—‘ Eliminar Maestro</button>}
      </Modal>
    </div>
  );
}

// â•â•â•â•â•â•â•â•â•â• CRONOGRAMA â•â•â•â•â•â•â•â•â•â•
function CronogramaPanel({cronograma,maestros,onUpdate}){
  const[activeDate,setActiveDate]=useState(null);
  const[subModal,setSubModal]=useState(null);
  const[addModal,setAddModal]=useState(false);
  const[editEntryId,setEditEntryId]=useState(null); // for inline edit/delete of entry
  const[form,setForm]=useState({fecha:"",grupo:"CORDERITOS",leccion:"",tema:"",maestro:"",auxiliar:""});
  const[unavailable,setUnavailable]=useState([]);
  const[unavailModal,setUnavailModal]=useState(false);
  const[statsModal,setStatsModal]=useState(false);
  const dates=[...new Set(cronograma.map(c=>c.fecha))].sort();
  const editEntry=editEntryId?cronograma.find(c=>c.id===editEntryId):null;

  // â”€â”€ Smart rotation helpers â”€â”€
  const nextSundays=(n=6)=>{
    const res=[];const d=new Date();
    const daysUntilSunday=d.getDay()===0?0:7-d.getDay();
    d.setDate(d.getDate()+daysUntilSunday);
    const toLocalYYYYMMDD=(x)=>{const y=x.getFullYear(),m=x.getMonth()+1,day=x.getDate();return `${y}-${String(m).padStart(2,"0")}-${String(day).padStart(2,"0")}`;};
    for(let i=0;i<n;i++){
      res.push(toLocalYYYYMMDD(d));
      d.setDate(d.getDate()+7);
    }
    return res;
  };
  const getRotationSuggestion=(grupo)=>{
    const lastEntries=cronograma.filter(c=>c.grupo===grupo).sort((a,b)=>b.fecha.localeCompare(a.fecha));
    const lastMaestro=lastEntries[0]?.maestro||"";
    const lastAuxiliar=lastEntries[0]?.auxiliar||"";
    const countMap={};
    cronograma.forEach(c=>{
      if(c.grupo!==grupo)return;
      if(c.maestro)countMap[c.maestro]=(countMap[c.maestro]||0)+1;
      if(c.auxiliar)countMap[c.auxiliar]=(countMap[c.auxiliar]||0)+1;
    });
    const isAdolescentes=grupo==="ADOLESCENTES";
    const sortByRotation=(a,b)=>{
      const sameClassA=a.clase===grupo?1:0;
      const sameClassB=b.clase===grupo?1:0;
      if(sameClassB!==sameClassA)return sameClassA-sameClassB;
      return (countMap[a.nombre]||0)-(countMap[b.nombre]||0);
    };
    let maestroPool=[];
    let auxPool=[];
    if(isAdolescentes){
      let adolMaestros=maestros.filter(m=>ADOLESCENTES_MAESTROS.includes(m.nombre)&&m.clase===grupo);
      if(adolMaestros.length===0){
        adolMaestros=ADOLESCENTES_MAESTROS.map(nombre=>({nombre,clase:"ADOLESCENTES"}));
      }
      maestroPool=[...adolMaestros].sort(sortByRotation);
    }else{
      const maestrosGrupo=maestros.filter(m=>m.cargo==="MAESTRO"&&m.clase===grupo);
      const auxiliaresGrupo=maestros.filter(m=>m.cargo==="AUXILIAR"&&m.clase===grupo);
      maestroPool=[...maestrosGrupo].sort(sortByRotation);
      auxPool=[...auxiliaresGrupo].sort(sortByRotation);
    }
    const sugMaestro=maestroPool.find(m=>m.nombre!==lastMaestro)?.nombre||maestroPool[0]?.nombre||"";
    const sugAux=isAdolescentes
      ? ""
      : auxPool.find(m=>m.nombre!==lastAuxiliar&&m.nombre!==sugMaestro)?.nombre||auxPool[0]?.nombre||"";
    const usedDates=new Set(cronograma.map(c=>c.fecha));
    const sundays=nextSundays(12);
    const sugFecha=sundays.find(s=>!usedDates.has(s))||sundays[0]||"";
    const lastNum=lastEntries[0]?.leccion?.match(/\d+/)?.[0];
    const sugLeccion=lastNum?`LecciÃ³n ${parseInt(lastNum)+1}`:"LecciÃ³n 1";
    return{maestro:sugMaestro,auxiliar:sugAux,fecha:sugFecha,leccion:sugLeccion};
  };
  const openAdd=()=>{
    const sug=getRotationSuggestion("CORDERITOS");
    setForm({fecha:sug.fecha,grupo:"CORDERITOS",leccion:sug.leccion,tema:"",maestro:sug.maestro,auxiliar:sug.auxiliar});
    setAddModal(true);
  };
  const updateGrupo=(grupo)=>{
    const sug=getRotationSuggestion(grupo);
    setForm(f=>({...f,grupo,maestro:sug.maestro,auxiliar:sug.auxiliar,leccion:sug.leccion,fecha:f.fecha||sug.fecha}));
  };

  // â”€â”€ Participation stats â”€â”€
  const getMaestroStats=(nombre)=>{
    const asMaestro=cronograma.filter(c=>sameTeacherName(c.maestro,nombre)).length;
    const asAux=cronograma.filter(c=>sameTeacherName(c.auxiliar,nombre)).length;
    const total=asMaestro+asAux;
    // Detect rescheduling: entries where teacher appears but class is "NO HAY CLASE"
    const noClass=cronograma.filter(c=>(c.maestro===nombre||c.auxiliar===nombre)&&(c.leccion==="NO HAY CLASE"||c.leccion==="DIA DEL PADRE")).length;
    const cumplimiento=total>0?Math.round(((total-noClass)/total)*100):100;
    return{total,asMaestro,asAux,noClass,cumplimiento};
  };
  const getSortedSubs=(grupo,role,entryId)=>{
    const currentEntry=entryId?cronograma.find(c=>c.id===entryId):null;
    const entryDate=currentEntry?.fecha||activeDate;
    const assigned=cronograma.filter(c=>c.fecha===entryDate&&c.id!==entryId).flatMap(c=>[c.maestro,c.auxiliar]).filter(Boolean);
    const pool=maestros.filter(m=>!unavailable.includes(m.nombre)&&!assigned.includes(m.nombre));
    return pool.sort((a,b)=>{
      if(a.clase===grupo&&b.clase!==grupo)return -1;
      if(b.clase===grupo&&a.clase!==grupo)return 1;
      const sa=getMaestroStats(a.nombre),sb=getMaestroStats(b.nombre);
      if(sa.total!==sb.total)return sa.total-sb.total;
      return sb.cumplimiento-sa.cumplimiento;
    });
  };
  return(
    <div style={{padding:"1rem 1rem 6.25rem"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <h2 style={S.title}>Cronograma</h2>
        <button style={{...S.btn("#5B2D8E"),padding:"10px 14px",fontSize:13}} onClick={openAdd}>+ Agregar</button>
      </div>
      <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap"}}>
        <button style={{...S.btn("#F5C842","#3D1B6B",true),padding:"12px",borderRadius:14,fontSize:14,flex:1}} onClick={()=>setUnavailModal(true)}>âš ï¸ Ausencias {unavailable.length>0?`(${unavailable.length})`:""}</button>
        <button style={{...S.btn("#4BBCE0","#FFFFFF",true),padding:"12px",borderRadius:14,fontSize:14,flex:1}} onClick={()=>setStatsModal(true)}>ðŸ“Š EstadÃ­sticas</button>
      </div>
      <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:8,marginBottom:14}}>
        <button style={{...S.btn(!activeDate?"#5B2D8E":"#F5F0FF",!activeDate?"#FFFFFF":"#2D1B4E"),padding:"8px 14px",fontSize:12,flexShrink:0,borderRadius:20}} onClick={()=>setActiveDate(null)}>Todos</button>
        {dates.map(d=>(
          <button key={d} style={{...S.btn(activeDate===d?"#5B2D8E":"#F5F0FF",activeDate===d?"#FFFFFF":"#2D1B4E"),padding:"8px 14px",fontSize:12,flexShrink:0,borderRadius:20}} onClick={()=>setActiveDate(d===activeDate?null:d)}>{formatFecha(d)}</button>
        ))}
      </div>
      {(activeDate?[activeDate]:dates).map(d=>{
        const entries=cronograma.filter(c=>c.fecha===d);
        return(
          <div key={d} style={S.card}>
            <div style={{fontWeight:800,color:"#5B2D8E",fontSize:16,marginBottom:12,paddingBottom:10,borderBottom:"2px solid #DDD0F0"}}>ðŸ“… {formatFecha(d)} 2026</div>
            {entries.map(e=>(
              <div key={e.id} style={{background:(CLASE_COLORS[e.grupo]||"#5B2D8E")+"12",border:`1.5px solid ${CLASE_COLORS[e.grupo]||"#5B2D8E"}44`,borderRadius:14,padding:"14px",marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",gap:8}}>
                  <div style={{flex:1}}>
                    <span style={S.tag(CLASE_COLORS[e.grupo]||"#5B2D8E")}>{e.grupo}</span>
                    <div style={{fontWeight:800,fontSize:15,marginTop:6}}>{e.leccion||"(sin lecciÃ³n)"}</div>
                    {e.tema&&<div style={{fontSize:12,color:"#7B6B9A",marginTop:2}}>{e.tema}</div>}
                  </div>
                  <div style={{display:"flex",gap:6,flexShrink:0}}>
                    <button
                      style={{...S.btn("#F5F0FF","#5B2D8E"),padding:"6px 10px",fontSize:16,borderRadius:999,boxShadow:`0 0 0 1px ${(CLASE_COLORS[e.grupo]||"#5B2D8E")+"33"}`}}
                      onClick={()=>setEditEntryId(e.id)}
                      title="Editar"
                    >âœï¸</button>
                    <button
                      style={{...S.btn("#FFF0F0","#EF5350"),padding:"6px 10px",fontSize:16,borderRadius:999,border:"1.5px solid #EF535044"}}
                      onClick={()=>{if(confirmDelete("Â¿Eliminar esta sesiÃ³n del cronograma?"))onUpdate(cronograma.filter(c=>c.id!==e.id));}}
                      title="Eliminar sesiÃ³n (tambiÃ©n si no hay clase)"
                    >ðŸ—‘</button>
                  </div>
                </div>
                {[["maestro","MAESTRO","ðŸŽ“","#5B2D8E","asistioMaestro","fallaMaestro"],["auxiliar","AUXILIAR","ðŸ¤","#E84F9B","asistioAuxiliar","fallaAuxiliar"]].filter(([role])=>!(e.grupo==="ADOLESCENTES"&&role==="auxiliar")).map(([role,label,icon,color,asistioKey,fallaKey])=>{
                  const nombreRole=e[role];const mRole=nombreRole?maestros.find(x=>x.nombre===nombreRole):null;
                  const puedeRegistrarAsistencia=nombreRole&&sessionDateAtLeast7DaysAgo(e.fecha);
                  const asistio=puedeRegistrarAsistencia?e[asistioKey]:undefined;
                  return(
                  <div key={role} style={{marginTop:8,background:"rgba(255,255,255,0.85)",borderRadius:10,padding:"10px 12px"}}>
                    <div style={{fontSize:11,fontWeight:800,color:"#7B6B9A",marginBottom:4,letterSpacing:1}}>{label}</div>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      {nombreRole&&(mRole?.foto?<img src={mRole.foto} alt="" style={{width:32,height:32,borderRadius:"50%",objectFit:"cover",border:`2px solid ${color}44`,flexShrink:0}}/>:<div style={{width:32,height:32,borderRadius:"50%",background:color+"33",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:11,color,flexShrink:0}}>{getInitials(nombreRole)}</div>)}
                      <div style={{flex:1,fontWeight:700,fontSize:13,color:nombreRole&&unavailable.includes(nombreRole)?"#EF5350":"#2D1B4E"}}>
                        {nombreRole?(unavailable.includes(nombreRole)?"âš ï¸ ":icon+" ")+displayMaestroNombre(nombreRole):<span style={{color:"#7B6B9A",fontStyle:"italic"}}>Sin asignar</span>}
                      </div>
                      {puedeRegistrarAsistencia&&(
                        <div style={{display:"flex",gap:4}}>
                          <button style={{...S.btn(asistio===true?"#4CAF50":"#F5F0FF",asistio===true?"#FFF":"#2D1B4E"),padding:"4px 8px",fontSize:11}} onClick={()=>onUpdate(cronograma.map(c=>c.id===e.id?{...c,[asistioKey]:true}:c))} title="AsistiÃ³">âœ“</button>
                          <button style={{...S.btn(asistio===false?"#EF5350":"#F5F0FF",asistio===false?"#FFF":"#2D1B4E"),padding:"4px 8px",fontSize:11}} onClick={()=>onUpdate(cronograma.map(c=>c.id===e.id?{...c,[asistioKey]:false}:c))} title="No asistiÃ³">âœ•</button>
                        </div>
                      )}
                      {nombreRole&&<button style={{...S.btn("#EF5350"),padding:"6px 10px",fontSize:11}} onClick={()=>{if(!window.confirm("Â¿Registrar falla a "+displayMaestroNombre(nombreRole)+" para esta sesiÃ³n?\n\nSe le restarÃ¡ 1 punto de cumplimiento, se quitarÃ¡ del horario y se abrirÃ¡ la selecciÃ³n de sustituto."))return;onUpdate(cronograma.map(c=>c.id===e.id?{...c,[fallaKey]:nombreRole,[role]:"",[asistioKey]:undefined}:c));setSubModal({entryId:e.id,role,grupo:e.grupo});setActiveDate(d);}} title="Falla: quita al maestro/auxiliar y resta cumplimiento; elige sustituto">Falla</button>}
                      <button style={{...S.btn(color),padding:"6px 12px",fontSize:12}} onClick={()=>{setSubModal({entryId:e.id,role,grupo:e.grupo});setActiveDate(d);}}>âœï¸</button>
                    </div>
                  </div>
                  );})}
              </div>
            ))}
          </div>
        );
      })}
      <Modal open={unavailModal} onClose={()=>setUnavailModal(false)} title="Gestionar Ausencias">
        <div style={{display:"flex",flexDirection:"column",gap:8,maxHeight:380,overflowY:"auto"}}>
          {maestros.map(m=>(
            <div key={m.id} onClick={()=>setUnavailable(u=>u.includes(m.nombre)?u.filter(n=>n!==m.nombre):[...u,m.nombre])}
              style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:unavailable.includes(m.nombre)?"#EF535018":"#F5F0FF",borderRadius:12,border:`2px solid ${unavailable.includes(m.nombre)?"#EF5350":"#DDD0F0"}`,cursor:"pointer"}}>
              {m.foto?<img src={m.foto} alt="" style={{width:40,height:40,borderRadius:"50%",objectFit:"cover",border:"2px solid #5B2D8E44",flexShrink:0}}/>:<div style={{width:40,height:40,borderRadius:"50%",background:(CLASE_COLORS[m.clase]||"#5B2D8E")+"33",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:14,color:CLASE_COLORS[m.clase]||"#5B2D8E",flexShrink:0}}>{getInitials(m.nombre)}</div>}
              <div style={{flex:1}}><div style={{fontWeight:700}}>{displayMaestroNombre(m.nombre)}</div><div style={{fontSize:12,color:"#7B6B9A"}}>{m.cargo} Â· {m.clase}</div></div>
              <div style={{width:28,height:28,borderRadius:"50%",background:unavailable.includes(m.nombre)?"#EF5350":"#DDD0F0",display:"flex",alignItems:"center",justifyContent:"center",color:"#FFFFFF",fontWeight:800}}>{unavailable.includes(m.nombre)?"âœ•":""}</div>
            </div>
          ))}
        </div>
        <button style={{...S.btn("#5B2D8E","#FFFFFF",true),padding:14,marginTop:14}} onClick={()=>setUnavailModal(false)}>Confirmar</button>
      </Modal>
      <Modal open={statsModal} onClose={()=>setStatsModal(false)} title="ðŸ“Š EstadÃ­sticas de ParticipaciÃ³n">
        <div style={{maxHeight:450,overflowY:"auto"}}>
          {[...maestros].sort((a,b)=>{
            const sa=getMaestroStats(a.nombre),sb=getMaestroStats(b.nombre);
            return sb.total-sa.total;
          }).map(m=>{
            const st=getMaestroStats(m.nombre);
            const barColor=st.cumplimiento>=80?"#4CAF50":st.cumplimiento>=60?"#F5C842":"#EF5350";
            return(
              <div key={m.id} style={{...S.card,padding:"12px 14px",marginBottom:10}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                  {m.foto?<img src={m.foto} alt="" style={{width:36,height:36,borderRadius:"50%",objectFit:"cover",border:"2px solid "+(CLASE_COLORS[m.clase]||"#5B2D8E")+"44",flexShrink:0}}/>:<div style={{width:36,height:36,borderRadius:"50%",background:(CLASE_COLORS[m.clase]||"#5B2D8E")+"33",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:12,color:CLASE_COLORS[m.clase]||"#5B2D8E",flexShrink:0}}>{getInitials(m.nombre)}</div>}
                  <div style={{flex:1}}>
                    <div style={{fontWeight:800,fontSize:13}}>{displayMaestroNombre(m.nombre)}</div>
                    <div style={{fontSize:11,color:"#7B6B9A"}}>{m.cargo} Â· {m.clase}</div>
                  </div>
                  <span style={{...S.badge(barColor),fontSize:12}}>{st.cumplimiento}%</span>
                </div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  <span style={{...S.badge("#5B2D8E"),fontSize:11}}>ðŸŽ“ {st.asMaestro} veces maestro</span>
                  <span style={{...S.badge("#E84F9B"),fontSize:11}}>ðŸ¤ {st.asAux} veces auxiliar</span>
                  {st.noClass>0&&<span style={{...S.badge("#EF5350"),fontSize:11}}>âš ï¸ {st.noClass} sin clase</span>}
                </div>
                <div style={{marginTop:8,background:"#F5F0FF",borderRadius:8,height:8,overflow:"hidden"}}>
                  <div style={{height:"100%",background:barColor,borderRadius:8,width:st.cumplimiento+"%",transition:"width 0.5s"}}/>
                </div>
              </div>
            );
          })}
        </div>
      </Modal>
      <Modal open={!!subModal} onClose={()=>setSubModal(null)} title="Seleccionar Sustituto">
        {subModal&&(
          <div>
            <p style={{color:"#7B6B9A",fontSize:13,marginBottom:12}}>{subModal.role==="maestro"?"Maestro":"Auxiliar"} para <strong>{subModal.grupo}</strong></p>
            <div style={{background:"#F0FBFF",borderRadius:10,padding:"10px 14px",marginBottom:16,fontSize:12,color:"#2A96BC"}}>
              ðŸ¤– <strong>Orden por sugerencia:</strong> misma clase Â· menos clases asignadas Â· mayor cumplimiento
            </div>
            {["MISMA CLASE","OTRAS CLASES"].map(sec=>{
              const subs=getSortedSubs(subModal.grupo,subModal.role,subModal.entryId).filter(m=>sec==="MISMA CLASE"?m.clase===subModal.grupo:m.clase!==subModal.grupo);
              if(!subs.length)return null;
              return(
                <div key={sec} style={{marginBottom:16}}>
                  <div style={{fontSize:11,fontWeight:800,color:"#7B6B9A",marginBottom:8,letterSpacing:1}}>{sec}</div>
                  {subs.map((m,mi)=>(
                    (()=>{const st=getMaestroStats(m.nombre);const warn=st.cumplimiento<70||st.total>8;return(
                    <div key={m.id} onClick={()=>{onUpdate(cronograma.map(c=>c.id===subModal.entryId?{...c,[subModal.role]:m.nombre}:c));setSubModal(null);}}
                      style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:(CLASE_COLORS[m.clase]||"#5B2D8E")+"15",borderRadius:12,marginBottom:8,border:`2px solid ${mi===0?"#4CAF5066":warn?"#F5C842":(CLASE_COLORS[m.clase]||"#5B2D8E")+"44"}`,cursor:"pointer"}}>
                      {m.foto?<img src={m.foto} alt="" style={{width:40,height:40,borderRadius:"50%",objectFit:"cover",border:"2px solid "+(CLASE_COLORS[m.clase]||"#5B2D8E")+"44",flexShrink:0}}/>:<div style={{width:40,height:40,borderRadius:"50%",background:(CLASE_COLORS[m.clase]||"#5B2D8E")+"44",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,color:CLASE_COLORS[m.clase]||"#5B2D8E",flexShrink:0}}>{getInitials(m.nombre)}</div>}
                      <div style={{flex:1}}>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <div style={{fontWeight:800,fontSize:13}}>{displayMaestroNombre(m.nombre)}</div>
                          {mi===0&&<span style={{...S.badge("#4CAF50"),fontSize:9,padding:"2px 7px"}}>â­ SUGERIDO</span>}
                        </div>
                        <div style={{fontSize:11,color:"#7B6B9A"}}>{m.cargo} Â· {m.clase}</div>
                        <div style={{display:"flex",gap:6,marginTop:3,flexWrap:"wrap"}}>
                          <span style={{...S.badge(st.total<4?"#4CAF50":st.total>8?"#EF5350":"#4BBCE0"),fontSize:10}}>{st.total} clases</span>
                          <span style={{...S.badge(st.cumplimiento>=80?"#4CAF50":st.cumplimiento>=60?"#F5C842":"#EF5350"),fontSize:10}}>{st.cumplimiento}% cumpl.</span>
                          {warn&&st.total>8&&<span style={{...S.badge("#F5C842"),fontSize:10}}>âš ï¸ Muchas clases</span>}
                        </div>
                      </div>
                      <span style={{fontSize:18,color:"#4CAF50"}}>âœ“</span>
                    </div>
                    );})()
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </Modal>
      <Modal open={addModal} onClose={()=>setAddModal(false)} title="ðŸ“… Nueva Clase">
        {/* Grupo selector */}
        <label style={S.label}>Grupo</label>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
          {CLASES_LIST.map(cl=>(
            <button key={cl} style={{...S.btn(form.grupo===cl?CLASE_COLORS[cl]:"#F5F0FF",form.grupo===cl?(cl==="VENCEDORES"?"#3D1B6B":"#FFFFFF"):"#2D1B4E"),padding:"7px 13px",fontSize:12,borderRadius:18,flexShrink:0}} onClick={()=>updateGrupo(cl)}>{cl}</button>
          ))}
        </div>
        {/* Sunday date suggestions */}
        <label style={S.label}>ðŸ“… Fecha (Domingos sugeridos)</label>
        <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:6,marginBottom:8}}>
          {nextSundays(8).map(d=>{
            const used=cronograma.some(c=>c.fecha===d);
            return <button key={d} onClick={()=>setForm(f=>({...f,fecha:d}))}
              style={{...S.btn(form.fecha===d?"#5B2D8E":used?"#EF535020":"#F5F0FF",form.fecha===d?"#FFFFFF":used?"#EF5350":"#2D1B4E"),padding:"6px 12px",fontSize:11,flexShrink:0,borderRadius:16,border:used?"2px solid #EF535055":"none",whiteSpace:"nowrap"}}>
              {used&&"âš ï¸ "}{formatFecha(d)}
            </button>;
          })}
        </div>
        <input type="date" style={{...S.input,marginBottom:14}} value={form.fecha} onChange={e=>setForm(f=>({...f,fecha:e.target.value}))}/>
        {/* LecciÃ³n y tema */}
        {[["LecciÃ³n","leccion","text"],["Tema (opcional)","tema","text"]].map(([l,k,t])=>(
          <div key={k} style={{marginBottom:12}}><label style={S.label}>{l}</label><input type={t} style={S.input} value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}/></div>
        ))}
        {/* Rotation suggestion banner */}
        <div style={{background:"linear-gradient(135deg,#4BBCE015,#4BBCE025)",border:"1.5px solid #4BBCE055",borderRadius:12,padding:"10px 14px",marginBottom:14}}>
          <div style={{fontSize:11,fontWeight:800,color:"#2A96BC",letterSpacing:0.5,marginBottom:6}}>ðŸ”„ ROTACIÃ“N SUGERIDA SEGÃšN HISTORIAL</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {form.maestro&&<span style={{...S.badge("#5B2D8E"),fontSize:11}}>ðŸŽ“ {displayMaestroNombre(form.maestro)}</span>}
            {form.auxiliar&&<span style={{...S.badge("#E84F9B"),fontSize:11}}>ðŸ¤ {displayMaestroNombre(form.auxiliar)}</span>}
            {!form.maestro&&!form.auxiliar&&<span style={{fontSize:12,color:"#7B6B9A",fontStyle:"italic"}}>Sin equipo sugerido aÃºn</span>}
          </div>
        </div>
        {/* Maestro */}
        <label style={S.label}>ðŸŽ“ Maestro</label>
        <select style={{...S.input,marginBottom:12}} value={form.maestro} onChange={e=>setForm(f=>({...f,maestro:e.target.value}))}>
          <option value="">â€” Sin asignar â€”</option>
          {form.grupo==="ADOLESCENTES"
            ? ADOLESCENTES_MAESTROS.slice().sort((a,b)=>sortKeyFirstName(a).localeCompare(sortKeyFirstName(b),"es")).map(nombre=>(
                <option key={nombre} value={nombre}>
                  {(()=>{const p=(nombre||"").trim().split(/\s+/).filter(Boolean);return p.length>=2?p.slice(1).join(" ")+" "+p[0]:nombre;})()}
                </option>
              ))
            : (()=>{
                const g=form.grupo||"";
                const sortMaestro=(a,b)=>{
                  if(!g)return sortKeyFirstName(a.nombre).localeCompare(sortKeyFirstName(b.nombre),"es");
                  if((a.clase===g?1:0)!==(b.clase===g?1:0))return (a.clase===g?0:1)-(b.clase===g?0:1);
                  return sortKeyFirstName(a.nombre).localeCompare(sortKeyFirstName(b.nombre),"es");
                };
                const maestrosList=maestros.filter(m=>m.cargo==="MAESTRO").sort(sortMaestro);
                const auxComoMaestro=maestros.filter(m=>m.cargo==="AUXILIAR").sort(sortMaestro);
                if(!g) return (
                  <>
                    <optgroup label="MAESTROS">{maestrosList.map(m=>(<option key={m.id} value={m.nombre}>{displayMaestroNombre(m.nombre)} Â· {m.clase}</option>))}</optgroup>
                    <optgroup label="AUXILIARES (como maestro)">{auxComoMaestro.map(m=>(<option key={m.id} value={m.nombre}>{displayMaestroNombre(m.nombre)} Â· {m.clase}</option>))}</optgroup>
                  </>
                );
                return (
                  <>
                    <optgroup label={"De "+g}>
                      {maestrosList.filter(m=>m.clase===g).map(m=>(<option key={m.id} value={m.nombre}>{displayMaestroNombre(m.nombre)} Â· {m.clase}</option>))}
                    </optgroup>
                    <optgroup label="MAESTROS (otras clases)">
                      {maestrosList.filter(m=>m.clase!==g).map(m=>(<option key={m.id} value={m.nombre}>{displayMaestroNombre(m.nombre)} Â· {m.clase}</option>))}
                    </optgroup>
                    <optgroup label="AUXILIARES (como maestro)">
                      {auxComoMaestro.map(m=>(<option key={m.id} value={m.nombre}>{displayMaestroNombre(m.nombre)} Â· {m.clase}</option>))}
                    </optgroup>
                  </>
                );
              })()
          }
        </select>
        {/* Auxiliar (no aplica para ADOLESCENTES) */}
        {form.grupo!=="ADOLESCENTES"&&(
          <>
            <label style={S.label}>ðŸ¤ Auxiliar</label>
            <select style={{...S.input,marginBottom:20}} value={form.auxiliar} onChange={e=>setForm(f=>({...f,auxiliar:e.target.value}))}>
              <option value="">â€” Sin asignar â€”</option>
              {(()=>{
                const g=form.grupo||"";
                const sortByClase=(a,b)=>{
                  if(!g)return sortKeyFirstName(a.nombre).localeCompare(sortKeyFirstName(b.nombre),"es");
                  if((a.clase===g?1:0)!==(b.clase===g?1:0))return (a.clase===g?0:1)-(b.clase===g?0:1);
                  return sortKeyFirstName(a.nombre).localeCompare(sortKeyFirstName(b.nombre),"es");
                };
                const auxList=maestros.filter(m=>m.cargo==="AUXILIAR").sort(sortByClase);
                const maestrosList=maestros.filter(m=>m.cargo==="MAESTRO").sort(sortByClase);
                if(!g) return (
                  <>
                    <optgroup label="AUXILIARES">{auxList.map(m=>(<option key={m.id} value={m.nombre}>{displayMaestroNombre(m.nombre)} Â· {m.clase}</option>))}</optgroup>
                    <optgroup label="MAESTROS (como auxiliar)">{maestrosList.map(m=>(<option key={m.id} value={m.nombre}>{displayMaestroNombre(m.nombre)} Â· {m.clase}</option>))}</optgroup>
                  </>
                );
                return (
                  <>
                    <optgroup label={"De "+g}>
                      {auxList.filter(m=>m.clase===g).map(m=>(<option key={m.id} value={m.nombre}>{displayMaestroNombre(m.nombre)} Â· {m.clase}</option>))}
                    </optgroup>
                    <optgroup label="AUXILIARES (otras clases)">
                      {auxList.filter(m=>m.clase!==g).map(m=>(<option key={m.id} value={m.nombre}>{displayMaestroNombre(m.nombre)} Â· {m.clase}</option>))}
                    </optgroup>
                    <optgroup label="MAESTROS (como auxiliar)">
                      {maestrosList.map(m=>(<option key={m.id} value={m.nombre}>{displayMaestroNombre(m.nombre)} Â· {m.clase}</option>))}
                    </optgroup>
                  </>
                );
              })()}
            </select>
          </>
        )}
        <button
          style={{...S.btn("#5B2D8E","#FFFFFF",true),padding:14}}
          onClick={()=>{
            onUpdate([
              ...cronograma,
              {
                ...form,
                auxiliar:form.grupo==="ADOLESCENTES"?null:form.auxiliar,
                id:Date.now(),
              },
            ]);
            setAddModal(false);
            setForm({fecha:"",grupo:"CORDERITOS",leccion:"",tema:"",maestro:"",auxiliar:""});
          }}
        >
          ðŸ’¾ Guardar Clase
        </button>
      </Modal>
      {/* â”€â”€ Modal editar/eliminar entrada del cronograma â”€â”€ */}
      <Modal open={!!editEntryId} onClose={()=>setEditEntryId(null)} title="âœï¸ Editar ProgramaciÃ³n">
        {editEntry&&(
          <div>
            <div style={{background:"#F5F0FF",borderRadius:12,padding:"12px 14px",marginBottom:16}}>
              <div style={{fontWeight:800,color:"#5B2D8E",fontSize:15}}>{editEntry.leccion||"(sin lecciÃ³n)"}</div>
              {editEntry.tema&&<div style={{fontSize:13,color:"#7B6B9A",marginTop:4}}>{editEntry.tema}</div>}
              <div style={{display:"flex",gap:8,marginTop:8,flexWrap:"wrap"}}>
                <span style={S.badge(CLASE_COLORS[editEntry.grupo]||"#5B2D8E")}>{editEntry.grupo}</span>
                <span style={S.badge("#7B6B9A")}>ðŸ“… {editEntry.fecha}</span>
              </div>
            </div>
            {[["LecciÃ³n","leccion"],["Tema","tema"],["Fecha","fecha"]].map(([l,k])=>(
              <div key={k} style={{marginBottom:12}}>
                <label style={S.label}>{l}</label>
                <input style={S.input} value={editEntry[k]||""} onChange={e=>onUpdate(cronograma.map(c=>c.id===editEntryId?{...c,[k]:e.target.value}:c))}/>
              </div>
            ))}
            <button style={{...S.btn("#5B2D8E","#FFFFFF",true),padding:13,marginTop:4}} onClick={()=>setEditEntryId(null)}>âœ… Listo</button>
            <p style={{fontSize:12,color:"#7B6B9A",marginTop:12,marginBottom:4}}>Puedes eliminar esta sesiÃ³n aunque no tenga clase asignada (ej. NO HAY CLASE).</p>
            <button style={{...S.btn("#FFF0F0","#EF5350"),padding:12,marginTop:4,border:"1.5px solid #EF535044"}} onClick={()=>{if(confirmDelete("Â¿Eliminar esta sesiÃ³n del cronograma?")){onUpdate(cronograma.filter(c=>c.id!==editEntryId));setEditEntryId(null);}}}>ðŸ—‘ Eliminar SesiÃ³n</button>
          </div>
        )}
      </Modal>
    </div>
  );
}

// â•â•â•â•â•â•â•â•â•â• CLASES PANEL (Admin, editable) â•â•â•â•â•â•â•â•â•â•
const COLORES_PRESET=["#4BBCE0","#F5C842","#5B2D8E","#E84F9B","#4CAF50","#FF7043","#7E57C2","#26A69A","#EF5350","#78909C"];

function ClasesPanel({clases,onUpdate,clasesConfig,onUpdateClasesConfig,calificaciones=[],familias=[],onUpdateFamilias=()=>{},readOnlyStudents=false,allowManageConfig=true}){
  const cfg=getCfgList(clasesConfig);
  const[activeClase,setActiveClase]=useState(cfg[0]?.key||"CORDERITOS");
  const[modal,setModal]=useState(false);       // add/edit alumno
  const[mgrModal,setMgrModal]=useState(false); // gestionar clases
  const[form,setForm]=useState({nombre:"",apellido:"",padre:"",madre:"",telPadre:"",telMadre:"",nacimiento:"",bautizado:false,sellado:false,foto:null});
  const[editIdx,setEditIdx]=useState(null);
  const[claseForm,setClaseForm]=useState(null); // editing a class config: {key,nombre,color,isNew}
  const ninos=clases[activeClase]||[];
  const color=getCfgColor(activeClase,clasesConfig);

  const getFamForAlumno=(n)=>{
    const claseNorm=(c)=>(c||"").trim().toUpperCase();
    let fam=familias.find(f=>samePersonName(f.alumno,n.nombre)&&claseNorm(f.clase)===claseNorm(activeClase));
    if(!fam) fam=familias.find(f=>samePersonName(f.alumno,n.nombre));
    return fam||null;
  };

  // Promedio general del alumno en esta clase (usado solo para mostrar, no editar)
  const getNinoGlobalAvg=(alumno)=>{
    if(!calificaciones||!calificaciones.length)return null;
    const entries=calificaciones.filter(c=>c.alumno===alumno&&c.clase===activeClase);
    if(!entries.length)return null;
    let t=0,cnt=0;
    const KEYS=["valores","conocimiento","oracion","servicio","respeto","participacion","comportamiento"];
    entries.forEach(e=>{
      KEYS.forEach(k=>{
        const v=parseFloat(e[k]);
        if(!isNaN(v)){t+=v;cnt++;}
      });
    });
    return cnt?(t/cnt).toFixed(1):null;
  };

  // â”€â”€ Alumnos CRUD â”€â”€
  const openAdd=()=>{setForm({nombre:"",apellido:"",padre:"",madre:"",telPadre:"",telMadre:"",nacimiento:"",bautizado:false,sellado:false,foto:null});setEditIdx(null);setModal(true);};
  const openEdit=(n,i)=>{
    const claseNorm=(c)=>(c||"").trim().toUpperCase();
    let fam=familias.find(f=>samePersonName(f.alumno,n.nombre)&&claseNorm(f.clase)===claseNorm(activeClase));
    if(!fam) fam=familias.find(f=>samePersonName(f.alumno,n.nombre));
    const nombreDisplay=n.nombre||"";
    const padre=fam?.padre??"",madre=fam?.madre??"",telPadre=fam?.telPadre??"",telMadre=fam?.telMadre??"",nacimiento=(n.nacimiento||fam?.nacimiento)||"";
    setForm({nombre:nombreDisplay,apellido:"",padre,madre,telPadre,telMadre,nacimiento,bautizado:!!(n.bautizado||fam?.bautizado),sellado:!!(n.sellado||fam?.sellado),foto:n.foto||fam?.foto||null});
    setEditIdx(i);setModal(true);
  };
  const saveAlumno=()=>{
    const nom=(form.nombre||"").trim();
    const ape=(form.apellido||"").trim();
    const nombreCompleto=[nom,ape].filter(Boolean).join(" ");
    if(!nombreCompleto)return;
    let edad=form.edad||null;
    let cumpleanos=null;
    if(form.nacimiento){
      try{
        const d=new Date(form.nacimiento);
        const hoy=new Date();
        edad=String(hoy.getFullYear()-d.getFullYear()-(hoy<new Date(hoy.getFullYear(),d.getMonth(),d.getDate())?1:0));
        cumpleanos=`${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}`;
      }catch(e){}
    }
    const updated=[...ninos];
    const base={id:editIdx!=null?ninos[editIdx]?.id:(Date.now()+""),nombre:nombreCompleto,edad,foto:form.foto||null,nacimiento:form.nacimiento||null,cumpleanos,bautizado:!!form.bautizado,sellado:!!form.sellado};
    if(editIdx!=null){
      const oldNombre=ninos[editIdx]?.nombre;
      updated[editIdx]=base;
      onUpdate({...clases,[activeClase]:updated});
      const tienePadre=(form.padre||"").trim()||(form.madre||"").trim();
      const claseNorm=(c)=>(c||"").trim().toUpperCase();
      const existingFam=familias.find(f=>samePersonName(f.alumno,oldNombre)&&claseNorm(f.clase)===claseNorm(activeClase));
      if(tienePadre){
        if(existingFam){
          const newFamilias=familias.map(f=>{
            if(samePersonName(f.alumno,oldNombre)&&claseNorm(f.clase)===claseNorm(activeClase))return{...f,alumno:nombreCompleto,padre:(form.padre||"").trim(),madre:(form.madre||"").trim(),telPadre:(form.telPadre||"").trim(),telMadre:(form.telMadre||"").trim(),edad,cumpleanos,nacimiento:form.nacimiento||f.nacimiento,bautizado:!!form.bautizado,sellado:!!form.sellado};
            return f;
          });
          onUpdateFamilias(newFamilias);
        }else{
          const num=Math.max(0,...familias.map(f=>f.num||0))+1;
          const famRec={id:Date.now(),num,familia:ape||(form.padre||form.madre||"Familia"),padre:(form.padre||"").trim(),madre:(form.madre||"").trim(),telPadre:(form.telPadre||"").trim(),telMadre:(form.telMadre||"").trim(),alumno:nombreCompleto,edad,cumpleanos,nacimiento:form.nacimiento||"",clase:activeClase,bautizado:!!form.bautizado,sellado:!!form.sellado};
          onUpdateFamilias([...familias,famRec]);
        }
      }else if(existingFam){
        onUpdateFamilias(familias.filter(f=>!(samePersonName(f.alumno,oldNombre)&&claseNorm(f.clase)===claseNorm(activeClase))));
      }
    }else{
      updated.push(base);
      onUpdate({...clases,[activeClase]:updated});
      const tienePadre=(form.padre||"").trim()||(form.madre||"").trim();
      if(tienePadre){
        const num=Math.max(0,...familias.map(f=>f.num||0))+1;
        const famRec={id:Date.now(),num,familia:ape||(form.padre||form.madre||"Familia"),padre:(form.padre||"").trim(),madre:(form.madre||"").trim(),telPadre:(form.telPadre||"").trim(),telMadre:(form.telMadre||"").trim(),alumno:nombreCompleto,edad,cumpleanos,nacimiento:form.nacimiento||"",clase:activeClase,bautizado:!!form.bautizado,sellado:!!form.sellado};
        onUpdateFamilias([...familias,famRec]);
      }
    }
    setModal(false);
  };
  const deleteAlumno=(i)=>{
    if(!confirmDelete("Â¿Eliminar a "+shortDisplayName(ninos[i].nombre)+" de la clase?"))return;
    const nombreEliminado=ninos[i].nombre;
    onUpdate({...clases,[activeClase]:ninos.filter((_,j)=>j!==i)});
    const claseNorm=(c)=>(c||"").trim().toUpperCase();
    onUpdateFamilias(familias.filter(f=>!(samePersonName(f.alumno,nombreEliminado)&&claseNorm(f.clase)===claseNorm(activeClase))));
  };
  const updateFoto=(i,foto)=>onUpdate({...clases,[activeClase]:ninos.map((n,j)=>j===i?{...n,foto}:n)});

  // â”€â”€ GestiÃ³n de Clases â”€â”€
  const saveClase=()=>{
    if(!allowManageConfig)return;
    if(!claseForm?.nombre?.trim())return;
    let newCfg=[...cfg];
    if(claseForm.isNew){
      const newKey=claseForm.nombre.trim().toUpperCase().replace(/\s+/g,"_");
      if(newCfg.find(c=>c.key===newKey)){alert("Ya existe una clase con ese nombre");return;}
      newCfg.push({key:newKey,nombre:claseForm.nombre.trim().toUpperCase(),color:claseForm.color||"#5B2D8E"});
      onUpdateClasesConfig(newCfg);
      if(!readOnlyStudents)onUpdate({...clases,[newKey]:[]});
      setActiveClase(newKey);
    } else {
      newCfg=newCfg.map(c=>c.key===claseForm.key?{...c,nombre:claseForm.nombre.trim().toUpperCase(),color:claseForm.color}:c);
      onUpdateClasesConfig(newCfg);
    }
    setClaseForm(null);
  };
  const deleteClase=(key)=>{
    if(!allowManageConfig)return;
    const count=(clases[key]||[]).length;
    if(count>0){alert(`No se puede eliminar: la clase tiene ${count} alumno${count!==1?"s":""}. Elimina los alumnos primero en la pestaÃ±a Alumnos.`);return;}
    if(!confirmDelete("Â¿Eliminar la clase "+key+"? Esta acciÃ³n no se puede deshacer."))return;
    const newCfg=cfg.filter(c=>c.key!==key);
    onUpdateClasesConfig(newCfg);
    if(!readOnlyStudents){const newClases={...clases};delete newClases[key];onUpdate(newClases);}
    setActiveClase(newCfg[0]?.key||"CORDERITOS");
  };

  return(
    <div style={{padding:"1rem 1rem 6.25rem"}}>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <h2 style={S.title}>Clases</h2>
        {allowManageConfig&&(
          <div style={{display:"flex",gap:8}}>
            <button style={{...S.btn("#F5F0FF","#5B2D8E"),padding:"9px 13px",fontSize:13,border:"1.5px solid #DDD0F0"}} onClick={()=>setMgrModal(true)}>âš™ï¸ Gestionar</button>
            {!readOnlyStudents&&<button style={{...S.btn(color),padding:"10px 16px",fontSize:14}} onClick={openAdd}>+ NiÃ±o</button>}
          </div>
        )}
      </div>
      {readOnlyStudents&&allowManageConfig&&(
        <div style={{fontSize:12,color:"#7B6B9A",marginBottom:10}}>
          Los alumnos se editan en la pestaÃ±a <strong>Alumnos</strong>.
        </div>
      )}

      {/* Class tabs */}
      <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:8,marginBottom:14}}>
        {cfg.map(cl=>{
          const isActive=activeClase===cl.key;
          const textColor=cl.color==="#F5C842"?"#3D1B6B":"#FFFFFF";
          return(
            <button key={cl.key}
              style={{...S.btn(isActive?cl.color:"#F5F0FF",isActive?textColor:"#2D1B4E"),padding:"8px 14px",fontSize:12,flexShrink:0,borderRadius:20}}
              onClick={()=>setActiveClase(cl.key)}>
              {cl.nombre} ({(clases[cl.key]||[]).length})
            </button>
          );
        })}
      </div>

      {/* Student list */}
      {ninos.length===0&&(
        <div style={{textAlign:"center",padding:"40px 20px",color:"#7B6B9A",fontSize:14}}>
          No hay alumnos en esta clase.<br/>
          <span style={{fontSize:12,opacity:0.7}}>{readOnlyStudents?"Agrega alumnos en la pestaÃ±a Alumnos.":"Usa el botÃ³n \"+ NiÃ±o\" para agregar."}</span>
        </div>
      )}
      {ninos.map((n,i)=>{
        const fam=getFamForAlumno(n);
        return(
          <div key={n.id||i} style={{...S.card,display:"flex",flexDirection:"column",gap:8}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <AvatarUpload photo={n.foto} onPhoto={readOnlyStudents?()=>{}:(f)=>updateFoto(i,f)} size={48} initials={getInitials(n.nombre)} color={color}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{displayNameAlumno(n)}</div>
                {n.edad&&<div style={{fontSize:12,color:"#7B6B9A"}}>{n.edad} aÃ±os</div>}
              </div>
              {(()=>{
                const avg=getNinoGlobalAvg(n.nombre);
                if(!avg)return <div style={{fontSize:11,color:"#7B6B9A"}}>Sin calificaciÃ³n</div>;
                return(
                  <div style={{background:scoreColor(avg)+"20",borderRadius:10,padding:"6px 10px",textAlign:"center",minWidth:56}}>
                    <div style={{fontWeight:900,color:scoreColor(avg),fontSize:16}}>{avg}</div>
                    <div style={{fontSize:9,color:"#7B6B9A"}}>prom.</div>
                  </div>
                );
              })()}
              {!readOnlyStudents&&<button style={{...S.btn("#4BBCE0"),padding:"8px 10px",fontSize:13,flexShrink:0}} onClick={()=>openEdit(n,i)} title="Editar alumno">âœï¸</button>}
            </div>
            {fam&&(fam.padre||fam.madre)&&(
              <div style={{marginTop:2,fontSize:11,color:"#7B6B9A"}}>
                {fam.padre&&fam.padre!=="(No registra)"&&(
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:fam.madre?4:0}}>
                    <span>ðŸ‘¨</span>
                    <span style={{fontWeight:600,flex:1}}>{fam.padre}</span>
                    {fam.telPadre
                      ?<a href={`tel:${fam.telPadre}`} style={{background:"#4BBCE0",color:"#FFFFFF",borderRadius:10,padding:"4px 8px",fontSize:11,fontWeight:700,textDecoration:"none",whiteSpace:"nowrap"}}>ðŸ“ž {fam.telPadre}</a>
                      :<span style={{fontSize:10,color:"#EF5350",fontStyle:"italic"}}>Sin tel.</span>
                    }
                  </div>
                )}
                {fam.madre&&fam.madre!=="(No registra)"&&(
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span>ðŸ‘©</span>
                    <span style={{fontWeight:600,flex:1}}>{fam.madre}</span>
                    {fam.telMadre
                      ?<a href={`tel:${fam.telMadre}`} style={{background:"#E84F9B",color:"#FFFFFF",borderRadius:10,padding:"4px 8px",fontSize:11,fontWeight:700,textDecoration:"none",whiteSpace:"nowrap"}}>ðŸ“ž {fam.telMadre}</a>
                      :<span style={{fontSize:10,color:"#EF5350",fontStyle:"italic"}}>Sin tel.</span>
                    }
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Modal: Agregar/Editar alumno */}
      <Modal open={modal} onClose={()=>setModal(false)} title={editIdx!=null?"Editar Alumno":`Agregar a ${activeClase}`}>
        <div style={{display:"flex",justifyContent:"center",marginBottom:18}}>
          <AvatarUpload photo={form.foto} onPhoto={(f)=>setForm(x=>({...x,foto:f}))} size={72} initials={(form.nombre||form.apellido)?getInitials([form.nombre,form.apellido].filter(Boolean).join(" ")):"?"} color={color}/>
        </div>
        {editIdx==null?(<>
          <label style={S.label}>Nombre</label>
          <input style={{...S.input,marginBottom:12}} placeholder="Ej: JosÃ© Luis" value={form.nombre} onChange={e=>setForm(f=>({...f,nombre:e.target.value}))}/>
          <label style={S.label}>Apellidos</label>
          <input style={{...S.input,marginBottom:12}} placeholder="Ej: MogollÃ³n MuÃ±oz" value={form.apellido} onChange={e=>setForm(f=>({...f,apellido:e.target.value}))}/>
        </>):(
          <label style={S.label}>Nombre completo</label>
        )}
        {editIdx!=null&&<input style={{...S.input,marginBottom:12}} value={form.nombre} onChange={e=>setForm(f=>({...f,nombre:e.target.value}))}/>}
        <label style={S.label}>Padre</label>
        <input style={{...S.input,marginBottom:12}} value={form.padre} onChange={e=>setForm(f=>({...f,padre:e.target.value}))}/>
        <label style={S.label}>Madre</label>
        <input style={{...S.input,marginBottom:12}} value={form.madre} onChange={e=>setForm(f=>({...f,madre:e.target.value}))}/>
        <label style={S.label}>Tel. Padre</label>
        <input type="tel" style={{...S.input,marginBottom:12}} placeholder="Ej: +34 600 000 000" value={form.telPadre} onChange={e=>setForm(f=>({...f,telPadre:e.target.value}))}/>
        <label style={S.label}>Tel. Madre</label>
        <input type="tel" style={{...S.input,marginBottom:12}} placeholder="Ej: +34 600 000 000" value={form.telMadre} onChange={e=>setForm(f=>({...f,telMadre:e.target.value}))}/>
        <label style={S.label}>Fecha de nacimiento</label>
        <input type="date" style={{...S.input,marginBottom:12}} value={form.nacimiento} onChange={e=>setForm(f=>({...f,nacimiento:e.target.value}))}/>
        {form.nacimiento&&(function(){try{const d=new Date(form.nacimiento);const dd=`${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}`;const hoy=new Date();const edad=hoy.getFullYear()-d.getFullYear()-(hoy<new Date(hoy.getFullYear(),d.getMonth(),d.getDate())?1:0);return <div style={{marginBottom:12,background:"#F5F0FF",borderRadius:10,padding:"8px 12px",fontSize:12,color:"#5B2D8E"}}>ðŸŽ‚ {dd} Â· {edad} aÃ±os</div>;}catch(e){return null;}}())}
        <div style={{display:"flex",gap:16,marginBottom:18}}>
          <label style={{display:"flex",alignItems:"center",gap:6,fontSize:13,color:"#5B2D8E"}}>
            <input type="checkbox" checked={!!form.bautizado} onChange={e=>setForm(f=>({...f,bautizado:e.target.checked}))}/>
            Bautizado
          </label>
          <label style={{display:"flex",alignItems:"center",gap:6,fontSize:13,color:"#5B2D8E"}}>
            <input type="checkbox" checked={!!form.sellado} onChange={e=>setForm(f=>({...f,sellado:e.target.checked}))}/>
            Sellado
          </label>
        </div>
        <button style={{...S.btn("#5B2D8E","#FFFFFF",true),padding:14}} onClick={saveAlumno}>ðŸ’¾ Guardar</button>
        {editIdx!=null&&<button style={{...S.btn("#FFF0F0","#EF5350"),padding:12,marginTop:10,border:"1.5px solid #EF535044"}} onClick={()=>{deleteAlumno(editIdx);setModal(false);}}>ðŸ—‘ Eliminar Alumno</button>}
      </Modal>

      {/* Modal: Gestionar Clases */}
      <Modal open={mgrModal} onClose={()=>{setMgrModal(false);setClaseForm(null);}} title="âš™ï¸ Gestionar Clases">
        {!claseForm?(
          <div>
            <div style={{marginBottom:14,fontSize:13,color:"#7B6B9A"}}>Edita el nombre o color de cada clase, o aÃ±ade una nueva.</div>
            {cfg.map(cl=>(
              <div key={cl.key} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:"1px solid #EEE8FF"}}>
                <div style={{width:18,height:18,borderRadius:5,background:cl.color,flexShrink:0}}/>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:14}}>{cl.nombre}</div>
                  <div style={{fontSize:11,color:"#7B6B9A"}}>{(clases[cl.key]||[]).length} alumnos</div>
                </div>
                <button style={{...S.btn("#4BBCE0"),padding:"6px 11px",fontSize:12}} onClick={()=>setClaseForm({...cl,isNew:false})}>âœï¸ Editar</button>
                <button style={{...S.btn("#EF5350"),padding:"6px 11px",fontSize:12}} onClick={()=>deleteClase(cl.key)}>ðŸ—‘</button>
              </div>
            ))}
            <button style={{...S.btn("#4CAF50","#FFFFFF",true),padding:"12px 20px",width:"100%",marginTop:18,borderRadius:12}} onClick={()=>setClaseForm({key:"",nombre:"",color:"#5B2D8E",isNew:true})}>
              âž• Nueva Clase
            </button>
          </div>
        ):(
          <div>
            <div style={{fontWeight:700,fontSize:15,color:"#5B2D8E",marginBottom:14}}>
              {claseForm.isNew?"Nueva Clase":"Editar: "+claseForm.nombre}
            </div>
            <label style={S.label}>Nombre de la clase</label>
            <input style={{...S.input,marginBottom:14}} value={claseForm.nombre}
              onChange={e=>setClaseForm(f=>({...f,nombre:e.target.value.toUpperCase()}))}
              placeholder="Ej: PÃRVULOS"/>
            <label style={S.label}>Color</label>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:18}}>
              {COLORES_PRESET.map(c=>(
                <div key={c} onClick={()=>setClaseForm(f=>({...f,color:c}))}
                  style={{width:32,height:32,borderRadius:8,background:c,cursor:"pointer",
                    border:claseForm.color===c?"3px solid #2D1B4E":"3px solid transparent",
                    boxShadow:claseForm.color===c?"0 0 0 2px white inset":"none"}}>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:8}}>
              <button style={{...S.btn("#F5F0FF","#5B2D8E"),padding:12,flex:1}} onClick={()=>setClaseForm(null)}>â† Volver</button>
              <button style={{...S.btn("#5B2D8E","#FFFFFF",true),padding:12,flex:2}} onClick={saveClase}>ðŸ’¾ Guardar Clase</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// â•â•â•â•â•â•â•â•â•â• FAMILIAS PANEL â•â•â•â•â•â•â•â•â•â•
function FamiliasPanel({familias,onUpdate,clases={},onUpdateClases=()=>{},teacherMode=false,readOnly=false}){
  const[search,setSearch]=useState("");
  const[modal,setModal]=useState(false);
  const[form,setForm]=useState({});
  const[editId,setEditId]=useState(null);
  const[encargoModal,setEncargoModal]=useState(false);
  const[encargoFamilyKey,setEncargoFamilyKey]=useState(null);
  const[encargoEditId,setEncargoEditId]=useState(null);
  const[openEncargosKey,setOpenEncargosKey]=useState(null);
  const[encargoForm,setEncargoForm]=useState({servicio:"",fecha:"",estado:"PENDIENTE",calificacion:"",nota:""});
  const empty={familia:"",padre:"",madre:"",telPadre:"",telMadre:"",alumno:"",edad:"",cumpleanos:"",nacimiento:"",clase:"CORDERITOS",bautizado:false,sellado:false};
  const matchFamKey=(f,key)=>f.familyKey===key;
  const updateEncargoInline=(familyKey,encargoId,patch)=>{
    onUpdate(familias.map(f=>matchFamKey(f,familyKey)?{...f,encargosFamilia:(f.encargosFamilia||[]).map(e=>e.id===encargoId?{...e,...patch}:e)}:f));
  };
  const filtered=familias
    .filter(f=>{const q=search.toLowerCase();return!q||f.alumno?.toLowerCase().includes(q)||f.familia?.toLowerCase().includes(q)||f.padre?.toLowerCase().includes(q)||f.madre?.toLowerCase().includes(q);});
  const grouped={};
  filtered.forEach(f=>{const k=f.familyKey;if(k==null||k==="")return;if(!grouped[k])grouped[k]=[];grouped[k].push(f);});
  const openEdit=(f)=>{if(!readOnly){setForm({...empty,...f});setEditId(f.id);setModal(true);}};
  const save=()=>{
    const toSave={...form};
    if(toSave.nacimiento){
      try{
        const d=new Date(toSave.nacimiento);
        const hoy=new Date();
        toSave.cumpleanos=`${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}`;
        toSave.edad=String(hoy.getFullYear()-d.getFullYear()-(hoy<new Date(hoy.getFullYear(),d.getMonth(),d.getDate())?1:0));
      }catch(e){}
    }
    const newFamilias=familias.map(f=>f.id===editId?{...toSave,id:editId,familyKey:f.familyKey}:f);
    onUpdate(newFamilias);
    // Sincronizar al alumno en Clases (mismo nombre y clase)
    const original=familias.find(f=>f.id===editId);
    if(original&&onUpdateClases){
      const oldClaseList=clases[original.clase]||[];
      const idx=oldClaseList.findIndex(n=>samePersonName(n.nombre,original.alumno));
      const alumnoEnClase=idx>=0?oldClaseList[idx]:null;
      const datosAlumno={nombre:(toSave.alumno||"").trim()||original.alumno,edad:toSave.edad||null,nacimiento:toSave.nacimiento||null,cumpleanos:toSave.cumpleanos||null,bautizado:!!toSave.bautizado,sellado:!!toSave.sellado};
      if(toSave.clase===original.clase){
        if(alumnoEnClase){
          const newList=oldClaseList.map((n,i)=>i===idx?{...n,...datosAlumno}:n);
          onUpdateClases({...clases,[original.clase]:newList});
        }
      }else{
        const newListOld=oldClaseList.filter((n,i)=>i!==idx);
        const newListNew=clases[toSave.clase]||[];
        const nuevoReg={...(alumnoEnClase||{id:Date.now(),foto:null}),...datosAlumno};
        onUpdateClases({...clases,[original.clase]:newListOld,[toSave.clase]:[...newListNew,nuevoReg]});
      }
    }
    setModal(false);
  };
  const updateMemberFoto=(id,foto)=>{ if(!readOnly)onUpdate(familias.map(f=>f.id===id?{...f,foto}:f)); };
  const updateFamilyFoto=(key,foto)=>{ if(!readOnly)onUpdate(familias.map(f=>matchFamKey(f,key)?{...f,fotoFamilia:foto}:f)); };
  const abrirEncargo=(familyKey,encargoExisting=null)=>{
    const todayStr=new Date().toISOString().slice(0,10);
    setEncargoFamilyKey(familyKey);
    if(encargoExisting){
      setEncargoEditId(encargoExisting.id);
      setEncargoForm({servicio:encargoExisting.servicio||"",fecha:encargoExisting.fecha||todayStr,estado:encargoExisting.estado||"PENDIENTE",calificacion:encargoExisting.calificacion!=null?String(encargoExisting.calificacion):"",nota:encargoExisting.nota||""});
    }else{
      setEncargoEditId(null);
      setEncargoForm({servicio:"",fecha:todayStr,estado:"PENDIENTE",calificacion:"",nota:""});
    }
    setEncargoModal(true);
  };
  const guardarEncargo=()=>{
    if(!encargoFamilyKey||!encargoForm.servicio.trim())return;
    const baseMember=familias.find(f=>matchFamKey(f,encargoFamilyKey));
    const prev=(baseMember&&baseMember.encargosFamilia)||[];
    if(encargoEditId!=null){
      const next=prev.map(e=>e.id===encargoEditId?{...e,servicio:encargoForm.servicio.trim(),fecha:encargoForm.fecha||e.fecha,estado:encargoForm.estado||"PENDIENTE",calificacion:encargoForm.calificacion?parseFloat(encargoForm.calificacion):null,nota:encargoForm.nota||""}:e);
      onUpdate(familias.map(f=>matchFamKey(f,encargoFamilyKey)?{...f,encargosFamilia:next}:f));
    }else{
      const nuevo={id:Date.now(),servicio:encargoForm.servicio.trim(),fecha:encargoForm.fecha||new Date().toISOString().slice(0,10),estado:encargoForm.estado||"PENDIENTE",calificacion:encargoForm.calificacion?parseFloat(encargoForm.calificacion):null,nota:encargoForm.nota||""};
      onUpdate(familias.map(f=>matchFamKey(f,encargoFamilyKey)?{...f,encargosFamilia:prev.concat([nuevo])}:f));
    }
    setEncargoModal(false);
    setEncargoEditId(null);
  };
  const eliminarEncargo=(familyKey,encargoId)=>{
    if(!confirmDelete("Â¿Eliminar este encargo del historial de la familia?"))return;
    onUpdate(familias.map(f=>matchFamKey(f,familyKey)?{...f,encargosFamilia:(f.encargosFamilia||[]).filter(x=>x.id!==encargoId)}:f));
    setEncargoModal(false);
    setEncargoEditId(null);
  };
  return(
    <div style={{padding:"1rem 1rem 6.25rem"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <h2 style={S.title}>{teacherMode?"ðŸ‘¨â€ðŸ‘©â€ðŸ‘§ Familias de mi Clase":"Familias"}</h2>
        {readOnly&&<div style={{fontSize:12,color:"#7B6B9A"}}>Los datos se editan en la pestaÃ±a <strong>Alumnos</strong>.</div>}
        {!teacherMode&&!readOnly&&<div style={{fontSize:12,color:"#7B6B9A"}}>Los alumnos se agregan en la pestaÃ±a Alumnos</div>}
        {teacherMode&&!readOnly&&<div style={{fontSize:12,color:"#7B6B9A",fontStyle:"italic"}}>Edita telÃ©fonos y datos</div>}
      </div>
      <input style={{...S.input,marginBottom:14}} placeholder="ðŸ” Buscar..." value={search} onChange={e=>setSearch(e.target.value)}/>
      {Object.entries(grouped).sort(([,aMembers],[,bMembers])=>{
        const aFirst=aMembers[0];
        const bFirst=bMembers[0];
        const nombreA=(aFirst?.familia||"").trim()||displayNameAlumno(aFirst)||(aFirst?.alumno||"").trim();
        const nombreB=(bFirst?.familia||"").trim()||displayNameAlumno(bFirst)||(bFirst?.alumno||"").trim();
        return nombreA.localeCompare(nombreB,"es",{sensitivity:"base"});
      }).map(([key,membersRaw])=>{
        const members=[...membersRaw].sort((a,b)=>sortKeyFirstName(a.alumno||"").localeCompare(sortKeyFirstName(b.alumno||""),"es"));
        const fotoFam=members[0].fotoFamilia||null;
        const encargos=members[0].encargosFamilia||[];
        return(
          <div key={key} style={{...S.card,borderLeft:"5px solid #5B2D8E"}}>
            {/* Family header with group photo */}
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
              <AvatarUpload photo={fotoFam} onPhoto={readOnly?()=>{}:(f)=>updateFamilyFoto(key,f)} size={52} initials={getInitials(members[0].alumno)} color="#5B2D8E"/>
              <div style={{flex:1}}>
                <div style={{fontWeight:800,color:"#5B2D8E",fontSize:15}}>ðŸ‘¨â€ðŸ‘©â€ðŸ‘§ {members[0].familia||displayNameAlumno(members[0])||key}</div>
                <div style={{fontSize:11,color:"#7B6B9A"}}>{members.length} alumno{members.length!==1?"s":""}</div>
              </div>
              <button style={{...S.btn("#F5C842","#2D1B4E"),padding:"6px 10px",fontSize:11,flexShrink:0}} onClick={()=>abrirEncargo(key)} title="Asignar un servicio a esta familia">ðŸ“ Encargar servicio</button>
            </div>
            {/* Historial de encargos en desplegable */}
            <div style={{marginBottom:12}}>
              <button
                style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:"#FFFBF0",border:"1px solid #F5C84244",borderRadius:10,fontSize:13,fontWeight:700,color:"#7B5A00",cursor:"pointer",fontFamily:"inherit"}}
                onClick={()=>setOpenEncargosKey(openEncargosKey===key?null:key)}
              >
                <span>ðŸ“ Historial de encargos de servicio {encargos.length>0?`(${encargos.length})`:""}</span>
                <span style={{fontSize:18}}>{openEncargosKey===key?"â–¼":"â–¶"}</span>
              </button>
              {openEncargosKey===key&&(
                <div style={{marginTop:8,padding:"12px 14px",background:"#FFFEF5",borderRadius:10,border:"1px solid #F5C84233"}}>
                  {encargos.length===0?(
                    <div style={{fontSize:13,color:"#7B6B9A",fontStyle:"italic"}}>AÃºn no hay encargos. Usa Â«Encargar servicioÂ» para asignar uno.</div>
                  ):(
                    encargos.slice().sort((a,b)=>(b.fecha||"").localeCompare(a.fecha||"")).map(e=>(
                        <div key={e.id} style={{padding:"10px 0",borderBottom:"1px solid #F5C84233"}}>
                          <div style={{fontWeight:700,fontSize:13,color:"#5B2D8E"}}>{e.servicio}</div>
                          <div style={{fontSize:11,color:"#7B6B9A",marginBottom:8}}>ðŸ“… {e.fecha||"â€”"}</div>
                          <div style={{fontSize:11,color:"#7B6B9A",marginBottom:4}}>Estado: {e.estado==="CUMPLIDO"?"âœ… CumpliÃ³":e.estado==="NO_CUMPLIO"?"âŒ No cumpliÃ³":"â³ Pendiente"}</div>
                          <div style={{display:"flex",flexWrap:"wrap",gap:8,alignItems:"center",marginBottom:6}}>
                            <span style={{fontSize:11,color:"#7B6B9A"}}>Â¿CumpliÃ³?</span>
                            <button style={{...S.btn(e.estado==="CUMPLIDO"?"#4CAF50":"#F5F0FF",e.estado==="CUMPLIDO"?"#FFF":"#2D1B4E"),padding:"4px 10px",fontSize:11}} onClick={()=>updateEncargoInline(key,e.id,{...e,estado:"CUMPLIDO"})}>CumpliÃ³</button>
                            <button style={{...S.btn(e.estado==="NO_CUMPLIO"?"#EF5350":"#F5F0FF",e.estado==="NO_CUMPLIO"?"#FFF":"#2D1B4E"),padding:"4px 10px",fontSize:11}} onClick={()=>updateEncargoInline(key,e.id,{...e,estado:"NO_CUMPLIO"})}>No cumpliÃ³</button>
                            <button style={{...S.btn(e.estado==="PENDIENTE"?"#7B6B9A":"#F5F0FF",e.estado==="PENDIENTE"?"#FFF":"#2D1B4E"),padding:"4px 10px",fontSize:11}} onClick={()=>updateEncargoInline(key,e.id,{...e,estado:"PENDIENTE"})}>Pendiente</button>
                          </div>
                          <div style={{display:"flex",alignItems:"center",gap:4,flexWrap:"wrap",marginBottom:6}}>
                            <span style={{fontSize:11,color:"#7B6B9A"}}>CalificaciÃ³n:</span>
                            {[1,2,3,4,5].map(s=>(
                              <button key={s} type="button" style={{padding:2,border:"none",background:"transparent",cursor:"pointer",fontSize:18}} onClick={()=>updateEncargoInline(key,e.id,{...e,calificacion:s})} title={`${s} estrella(s)`}>
                                <span style={{color:(e.calificacion!=null&&e.calificacion>=s)?"#F5C842":"#e0e0e0"}}>â˜…</span>
                              </button>
                            ))}
                            {e.calificacion!=null&&<span style={{fontSize:11,color:"#7B6B9A"}}>{e.calificacion}/5</span>}
                          </div>
                          <div style={{display:"flex",gap:6}}>
                            <button style={{...S.btn("#F5C842","#2D1B4E"),padding:"4px 8px",fontSize:11}} onClick={()=>abrirEncargo(key,e)}>âœï¸ Editar / Nota</button>
                            <button style={{...S.btn("#FFF0F0","#EF5350"),padding:"4px 8px",fontSize:11}} onClick={()=>eliminarEncargo(key,e.id)}>ðŸ—‘ Eliminar</button>
                          </div>
                        </div>
                    ))
                  )}
                </div>
              )}
            </div>
            {/* Parents + phones */}
            {(members[0].padre||members[0].madre)&&(
              <div style={{background:"#F5F0FF",borderRadius:10,padding:"10px 12px",marginBottom:10}}>
                {members[0].padre&&members[0].padre!=="(No registra)"&&(
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                    <span>ðŸ‘¨</span><span style={{fontSize:13,flex:1,fontWeight:600}}>{members[0].padre}</span>
                    {members[0].telPadre&&<a href={`tel:${members[0].telPadre}`} style={{background:"#4BBCE0",color:"#FFFFFF",borderRadius:10,padding:"5px 11px",fontSize:12,fontWeight:800,textDecoration:"none"}}>ðŸ“ž {members[0].telPadre}</a>}
                  </div>
                )}
                {members[0].madre&&members[0].madre!=="(No registra)"&&(
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span>ðŸ‘©</span><span style={{fontSize:13,flex:1,fontWeight:600}}>{members[0].madre}</span>
                    {members[0].telMadre&&<a href={`tel:${members[0].telMadre}`} style={{background:"#E84F9B",color:"#FFFFFF",borderRadius:10,padding:"5px 11px",fontSize:12,fontWeight:800,textDecoration:"none"}}>ðŸ“ž {members[0].telMadre}</a>}
                  </div>
                )}
              </div>
            )}
            {/* Members with individual photos */}
            {members.map((m,i)=>(
              <div key={m.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderTop:i>0?"1px solid #DDD0F0":"none"}}>
                <AvatarUpload photo={m.foto||null} onPhoto={readOnly?()=>{}:(f)=>updateMemberFoto(m.id,f)} size={40} initials={getInitials(m.alumno)} color={CLASE_COLORS[m.clase]||"#4BBCE0"}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:13}}>{displayNameAlumno(m)}</div>
              <div style={{fontSize:12,color:"#7B6B9A"}}>
                {m.edad}
                {m.cumpleanos?" Â· ðŸŽ‚ "+m.cumpleanos:""}
                {m.bautizado&&" Â· ðŸ™ Bautizado"}
                {m.sellado&&" Â· âœ¨ Sellado"}
              </div>
                </div>
                <span style={S.badge(CLASE_COLORS[m.clase]||"#4BBCE0")}>{m.clase}</span>
                {!readOnly&&<button style={{...S.btn("#4BBCE0"),padding:"6px 10px",fontSize:12}} onClick={()=>openEdit(m)}>âœï¸</button>}
              </div>
            ))}
          </div>
        );
      })}
      <Modal open={modal} onClose={()=>setModal(false)} title={editId?"Editar Alumno":"Nuevo Miembro"}>
        {/* Photo uploader in modal */}
        <div style={{display:"flex",justifyContent:"center",marginBottom:18}}>
          <AvatarUpload photo={form.foto||null} onPhoto={(f)=>setForm(x=>({...x,foto:f}))} size={72} initials={form.alumno?getInitials(form.alumno):"?"} color="#5B2D8E"/>
        </div>
        {(teacherMode
          ?[["Padre","padre"],["Tel. Padre","telPadre"],["Madre","madre"],["Tel. Madre","telMadre"]]
          :[["Familia","familia"],["Padre","padre"],["Tel. Padre","telPadre"],["Madre","madre"],["Tel. Madre","telMadre"],["Alumno","alumno"],["Fecha de Nacimiento","nacimiento"]]
        ).map(([l,k])=>(
          <div key={k} style={{marginBottom:12}}><label style={S.label}>{l}</label><input style={S.input} value={form[k]||""} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} type={k==="nacimiento"?"date":(k.startsWith("tel")?"tel":"text")}/></div>
        ))}
        {!teacherMode&&form.nacimiento&&(function(){try{const d=new Date(form.nacimiento);const dd=`${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}`;const hoy=new Date();const edad=hoy.getFullYear()-d.getFullYear()-(hoy<new Date(hoy.getFullYear(),d.getMonth(),d.getDate())?1:0);return <div style={{marginBottom:12,background:"#F5F0FF",borderRadius:10,padding:"8px 12px",fontSize:"0.8125rem",color:"#5B2D8E"}}>ðŸŽ‚ CumpleaÃ±os: {dd} Â· {edad} aÃ±os (calculado automÃ¡ticamente)</div>;}catch(e){return null;}}())}
        {!teacherMode&&(
          <>
            <label style={S.label}>Clase</label>
            <select style={{...S.input,marginBottom:18}} value={form.clase||"CORDERITOS"} onChange={e=>setForm(f=>({...f,clase:e.target.value}))}>
              {CLASES_LIST.map(cl=><option key={cl} value={cl}>{cl}</option>)}
            </select>
            <div style={{display:"flex",gap:16,marginBottom:18,marginTop:4,flexWrap:"wrap"}}>
              <label style={{display:"flex",alignItems:"center",gap:6,fontSize:13,color:"#5B2D8E"}}>
                <input type="checkbox" checked={!!form.bautizado} onChange={e=>setForm(f=>({...f,bautizado:e.target.checked}))}/>
                ðŸ™ Bautizado
              </label>
              <label style={{display:"flex",alignItems:"center",gap:6,fontSize:13,color:"#5B2D8E"}}>
                <input type="checkbox" checked={!!form.sellado} onChange={e=>setForm(f=>({...f,sellado:e.target.checked}))}/>
                âœ¨ Sellado
              </label>
            </div>
            <div style={{fontSize:11,color:"#7B6B9A",marginTop:-8,marginBottom:8}}>Puedes marcar uno, ambos o ninguno.</div>
          </>
        )}
        <button style={{...S.btn("#5B2D8E","#FFFFFF",true),padding:14}} onClick={save}>ðŸ’¾ Guardar</button>
        {editId&&!teacherMode&&<button style={{...S.btn("#FFF0F0","#EF5350"),padding:12,marginTop:10,border:"1.5px solid #EF535044"}} onClick={()=>{if(confirmDelete("Â¿Eliminar a "+displayNameAlumno(form)+"?")){onUpdate(familias.filter(f=>f.id!==editId));setModal(false);}}}>ðŸ—‘ Eliminar Miembro</button>}
      </Modal>
      <Modal open={encargoModal} onClose={()=>{setEncargoModal(false);setEncargoEditId(null);}} title={encargoEditId?"Revisar / Calificar servicio":"Encargar servicio a la familia"}>
        <div style={{fontSize:12,color:"#7B6B9A",marginBottom:10}}>
          {encargoEditId?"Puedes calificar cuando haya pasado la fecha de la tarea. Queda en el historial de calificaciÃ³n de la familia.":"Solo servicio y fecha. La calificaciÃ³n se harÃ¡ despuÃ©s, cuando pase la fecha de la tarea."}
        </div>
        <label style={S.label}>Servicio / tarea</label>
        <input style={{...S.input,marginBottom:10}} placeholder="Ej: Merienda general, decoraciÃ³n, visita, etc." value={encargoForm.servicio} onChange={e=>setEncargoForm(f=>({...f,servicio:e.target.value}))}/>
        <label style={S.label}>Fecha de la tarea</label>
        <input type="date" style={{...S.input,marginBottom:10}} value={encargoForm.fecha} onChange={e=>setEncargoForm(f=>({...f,fecha:e.target.value}))}/>
        {encargoEditId&&(()=>{
          const hoyStr=new Date().toISOString().slice(0,10);
          const yaPasÃ³=!(encargoForm.fecha&&encargoForm.fecha>hoyStr);
          if(!yaPasÃ³)return(
            <div style={{background:"#FFF8E0",borderRadius:10,padding:"12px 14px",marginBottom:14,fontSize:13,color:"#7B5A00"}}>
              PodrÃ¡s calificar cuando pase la fecha de la tarea ({encargoForm.fecha}).
            </div>
          );
          return(
            <>
              <label style={S.label}>Estado</label>
              <select style={{...S.input,marginBottom:10}} value={encargoForm.estado} onChange={e=>setEncargoForm(f=>({...f,estado:e.target.value}))}>
                <option value="PENDIENTE">Pendiente</option>
                <option value="CUMPLIDO">Cumplido</option>
              </select>
              <label style={S.label}>CalificaciÃ³n (1â€“5, opcional)</label>
              <input type="number" min="1" max="5" step="1" style={{...S.input,marginBottom:10}} value={encargoForm.calificacion} onChange={e=>setEncargoForm(f=>({...f,calificacion:e.target.value}))} placeholder="Ej: 5"/>
              <label style={S.label}>Notas</label>
              <textarea style={{...S.input,minHeight:70,resize:"vertical",marginBottom:14}} value={encargoForm.nota} onChange={e=>setEncargoForm(f=>({...f,nota:e.target.value}))} placeholder="Comentarios sobre cÃ³mo cumpliÃ³ la familia."/>
            </>
          );
        })()}
        {!encargoEditId&&(
          <label style={S.label}>Nota (opcional)</label>
        )}
        {!encargoEditId&&(
          <textarea style={{...S.input,minHeight:60,resize:"vertical",marginBottom:14}} value={encargoForm.nota} onChange={e=>setEncargoForm(f=>({...f,nota:e.target.value}))} placeholder="Detalle del encargo si lo necesitas"/>
        )}
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          <button style={{...S.btn("#5B2D8E","#FFFFFF",true),padding:14}} onClick={guardarEncargo}>{encargoEditId?"ðŸ’¾ Guardar calificaciÃ³n":"ðŸ’¾ Guardar encargo"}</button>
          {encargoEditId&&encargoFamilyKey&&<button style={{...S.btn("#FFF0F0","#EF5350"),padding:14,border:"1.5px solid #EF535044"}} onClick={()=>eliminarEncargo(encargoFamilyKey,encargoEditId)}>ðŸ—‘ Eliminar encargo</button>}
        </div>
      </Modal>
    </div>
  );
}

// â•â•â•â•â•â•â•â•â•â• ALUMNOS PANEL â€” Fuente de verdad: aquÃ­ se edita la lista de alumnos; de ella se forman las clases y las familias â•â•â•â•â•â•â•â•â•â•
function AlumnosPanel({
  alumnos=[],
  onUpdateAlumnos,
  clasesConfig,
  initialSubTab,
  onSubTabConsumed,
  calificaciones=[],
  // Opcional: herramienta manual para fusionar dos alumnos (lo gestiona AdminApp con acceso a calificaciones)
  onMergeAlumnos,
}){
  const cfg=getCfgList(clasesConfig);
  const[modal,setModal]=useState(false);
  const[editId,setEditId]=useState(null);
  const[alumnoSubTab,setAlumnoSubTab]=useState("todos"); // "todos" | "bautizados" | "sellados"
  const[form,setForm]=useState({primerNombre:"",segundoNombre:"",primerApellido:"",segundoApellido:"",nombrePadre:"",nombreMadre:"",clase:"CORDERITOS",nacimiento:"",telPadre:"",telMadre:"",bautizado:false,sellado:false,foto:null});
  const[mergeFromId,setMergeFromId]=useState(null);
  const[mergeToId,setMergeToId]=useState(null);
  const sorted=[...(alumnos||[])].sort((a,b)=>sortKeyFirstName(a.nombre).localeCompare(sortKeyFirstName(b.nombre),"es"));
  const bautizados=sorted.filter(a=>a.bautizado);
  const sellados=sorted.filter(a=>a.sellado);
  const listado=alumnoSubTab==="bautizados"?bautizados:alumnoSubTab==="sellados"?sellados:sorted;
  useEffect(()=>{ if(initialSubTab==="bautizados"||initialSubTab==="sellados"){ setAlumnoSubTab(initialSubTab); onSubTabConsumed&&onSubTabConsumed(); } },[initialSubTab]);

  // Alumnos que aparecen en calificaciones pero no en la lista (solo se usa para informaciÃ³n en paneles; la recuperaciÃ³n automÃ¡tica se hace al cargar datos)
  const missingFromCalifs=React.useMemo(()=>getMissingAlumnosFromCalificaciones(calificaciones,alumnos),[calificaciones,alumnos]);

  const openAdd=()=>{ setForm({primerNombre:"",segundoNombre:"",primerApellido:"",segundoApellido:"",nombrePadre:"",nombreMadre:"",clase:cfg[0]?.key||"CORDERITOS",nacimiento:"",telPadre:"",telMadre:"",bautizado:false,sellado:false,foto:null}); setEditId(null); setModal(true); };
  const openEdit=(a)=>{
    const tienePartes=a.primerNombre!=null||a.primerApellido!=null;
    const primerNombre=tienePartes?(a.primerNombre||""):((a.nombre||"").trim().split(/\s+/).filter(Boolean)[0]||"");
    const segundoNombre=tienePartes?(a.segundoNombre||""):"";
    const primerApellido=tienePartes?(a.primerApellido||""):(function(){const w=(a.nombre||"").trim().split(/\s+/).filter(Boolean);return w.length>=2?(w.length===2?w[1]:w[2]):"";}());
    const segundoApellido=tienePartes?(a.segundoApellido||""):(function(){const w=(a.nombre||"").trim().split(/\s+/).filter(Boolean);return w.length>=4?w[3]:"";}());
    setForm({ primerNombre, segundoNombre, primerApellido, segundoApellido, nombrePadre: (a.padre||"").trim(), nombreMadre: (a.madre||"").trim(), clase: normalizarClase(a.clase), nacimiento: a.nacimiento||"", telPadre: a.telPadre||"", telMadre: a.telMadre||"", bautizado: !!a.bautizado, sellado: !!a.sellado, foto: a.foto||null });
    setEditId(a.id);
    setModal(true);
  };
  const save=async()=>{
    const nombre=buildNombreFull(form.primerNombre,form.segundoNombre,form.primerApellido,form.segundoApellido);
    if(!nombre.trim())return;
    let edad=null,cumpleanos=null;
    if(form.nacimiento){
      try{
        const d=new Date(form.nacimiento);
        const hoy=new Date();
        edad=String(hoy.getFullYear()-d.getFullYear()-(hoy<new Date(hoy.getFullYear(),d.getMonth(),d.getDate())?1:0));
        cumpleanos=`${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}`;
      }catch(e){}
    }
    const claseKey=normalizarClase(form.clase);
    const familia=buildFamiliaAlumno(form.primerApellido,form.segundoApellido);
    const record={ id: editId||Date.now(), nombre, clase: claseKey, nacimiento: form.nacimiento||null, padre: (form.nombrePadre||"").trim(), madre: (form.nombreMadre||"").trim(), telPadre: (form.telPadre||"").trim(), telMadre: (form.telMadre||"").trim(), familia, bautizado: !!form.bautizado, sellado: !!form.sellado, foto: form.foto||null, primerNombre: (form.primerNombre||"").trim(), segundoNombre: (form.segundoNombre||"").trim(), primerApellido: (form.primerApellido||"").trim(), segundoApellido: (form.segundoApellido||"").trim() };
    const updated=editId?(alumnos||[]).map(a=>a.id===editId?record:a):[...(alumnos||[]),record];
    const ok=await onUpdateAlumnos(updated);
    if(ok)setModal(false);else alert("No se pudo guardar (incl. foto). Revisa la conexiÃ³n o la consola (F12).");
  };
  const deleteAlumno=(a)=>{
    if(!confirmDelete("Â¿Eliminar a "+displayNameAlumno(a)+"?"))return;
    onUpdateAlumnos((alumnos||[]).filter(x=>x.id!==a.id));
    setModal(false);
  };

  return(
    <div style={{padding:"1rem 1rem 6.25rem"}}>
      {onMergeAlumnos&&(
        <div style={{background:"#E0F2FE",border:"1.5px solid #38BDF8",borderRadius:14,padding:"12px 14px",marginBottom:16}}>
          <div style={{fontWeight:800,fontSize:13,color:"#0F172A",marginBottom:6}}>ðŸ”— Fusionar alumnos duplicados</div>
          <div style={{fontSize:12,color:"#0F172A",marginBottom:8}}>
            Si detectas que un alumno estÃ¡ repetido, selecciona ambos registros y marca que son la misma persona. Se unificarÃ¡n los datos y calificaciones en un solo alumno.
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8,alignItems:"center"}}>
            <div style={{display:"flex",flexDirection:"column",gap:4}}>
              <label style={{fontSize:11,color:"#0F172A"}}>Alumno A</label>
              <select
                style={{...S.input,fontSize:12,minWidth:180}}
                value={mergeFromId||""}
                onChange={e=>setMergeFromId(e.target.value?Number(e.target.value):null)}
              >
                <option value="">Selecciona alumno A</option>
                {sorted.map(a=>(
                  <option key={a.id} value={a.id}>{displayNameAlumno(a)} â€” {normalizarClase(a.clase)}</option>
                ))}
              </select>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:4}}>
              <label style={{fontSize:11,color:"#0F172A"}}>Alumno B</label>
              <select
                style={{...S.input,fontSize:12,minWidth:180}}
                value={mergeToId||""}
                onChange={e=>setMergeToId(e.target.value?Number(e.target.value):null)}
              >
                <option value="">Selecciona alumno B</option>
                {sorted.map(a=>(
                  <option key={a.id} value={a.id}>{displayNameAlumno(a)} â€” {normalizarClase(a.clase)}</option>
                ))}
              </select>
            </div>
            <button
              style={{...S.btn("#0EA5E9","#FFFFFF",true),padding:"8px 14px",fontSize:12,borderRadius:10,whiteSpace:"nowrap"}}
              disabled={!mergeFromId||!mergeToId||mergeFromId===mergeToId}
              onClick={()=>{
                if(!mergeFromId||!mergeToId||mergeFromId===mergeToId)return;
                const aA=(alumnos||[]).find(a=>a.id===mergeFromId);
                const aB=(alumnos||[]).find(a=>a.id===mergeToId);
                if(!aA||!aB)return;
                if(!window.confirm("Vas a fusionar a '"+displayNameAlumno(aA)+"' y '"+displayNameAlumno(aB)+"'.\n\nEl sistema conservarÃ¡ el alumno con mÃ¡s datos completos y unirÃ¡ todas las calificaciones de ambos.\n\nEsta acciÃ³n no se puede deshacer fÃ¡cilmente. Â¿Continuar?"))return;
                onMergeAlumnos(mergeFromId,mergeToId);
              }}
              title="Marcar que Alumno A y Alumno B son la misma persona y fusionar sus datos/calificaciones"
            >
              ðŸ”— Marcar como mismo alumno y fusionar
            </button>
          </div>
          {missingFromCalifs.length>0&&(
            <div style={{marginTop:8,fontSize:11,color:"#0F172A"}}>
              Nota: hay {missingFromCalifs.length} alumno{missingFromCalifs.length!==1?"s":""} que aparecen solo en calificaciones antiguas. Puedes fusionarlos manualmente usando este panel.
            </div>
          )}
        </div>
      )}
      <div style={{marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
          <h2 style={S.title}>Alumnos</h2>
          <button style={{...S.btn("#5B2D8E","#FFFFFF",true),padding:"10px 16px"}} onClick={openAdd}>+ Agregar alumno</button>
        </div>
        <div style={{fontSize:12,color:"#7B6B9A",marginTop:4}}>Todo se desprende de esta lista: de aquÃ­ se forman las clases y las familias. Solo aquÃ­ se editan los alumnos.</div>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        <button style={{...S.btn(alumnoSubTab==="todos"?"#5B2D8E":"#F5F0FF",alumnoSubTab==="todos"?"#FFFFFF":"#2D1B4E"),padding:"10px 16px",borderRadius:12,fontSize:13,fontWeight:700}} onClick={()=>setAlumnoSubTab("todos")}>ðŸ‘¦ Todos ({sorted.length})</button>
        <button style={{...S.btn(alumnoSubTab==="bautizados"?"#22c55e":"#F5F0FF",alumnoSubTab==="bautizados"?"#FFFFFF":"#2D1B4E"),padding:"10px 16px",borderRadius:12,fontSize:13,fontWeight:700}} onClick={()=>setAlumnoSubTab("bautizados")}>ðŸ™ Bautizados ({bautizados.length})</button>
        <button style={{...S.btn(alumnoSubTab==="sellados"?"#a78bfa":"#F5F0FF",alumnoSubTab==="sellados"?"#FFFFFF":"#2D1B4E"),padding:"10px 16px",borderRadius:12,fontSize:13,fontWeight:700}} onClick={()=>setAlumnoSubTab("sellados")}>âœ¨ Sellados ({sellados.length})</button>
      </div>
      {listado.length===0?(
        <div style={{textAlign:"center",padding:"40px 20px",color:"#7B6B9A",fontSize:14}}>
          {sorted.length===0?"No hay alumnos. Agrega el primero desde el botÃ³n superior.":alumnoSubTab==="bautizados"?"NingÃºn alumno marcado como bautizado.":alumnoSubTab==="sellados"?"NingÃºn alumno marcado como sellado.":"No hay resultados."}
        </div>
      ):(
        listado.map(a=>{
          const color=getCfgColor(normalizarClase(a.clase),clasesConfig);
          return(
            <div key={a.id} style={{...S.card,display:"flex",alignItems:"center",gap:12,borderLeft:"4px solid "+color}}>
              <AvatarUpload photo={a.foto} onPhoto={()=>{}} size={44} initials={getInitials(a.nombre)} color={color}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700}}>{displayNameAlumno(a)}</div>
                <div style={{fontSize:12,color:"#7B6B9A",display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                  {(a.padre||a.madre)?"ðŸ‘¨â€ðŸ‘©â€ðŸ‘§ Familia":""}
                  {a.bautizado&&<span style={{background:"#22c55e22",color:"#22c55e",padding:"2px 6px",borderRadius:6,fontSize:10,fontWeight:700}}>ðŸ™ Bautizado</span>}
                  {a.sellado&&<span style={{background:"#a78bfa22",color:"#a78bfa",padding:"2px 6px",borderRadius:6,fontSize:10,fontWeight:700}}>âœ¨ Sellado</span>}
                  {!(a.padre||a.madre)&&!a.bautizado&&!a.sellado&&"â€”"}
                </div>
              </div>
              <span style={S.badge(color)}>{normalizarClase(a.clase)}</span>
              <button style={{...S.btn("#4BBCE0"),padding:"8px 12px"}} onClick={()=>openEdit(a)} title="Editar">âœï¸</button>
              <button style={{...S.btn("#FFF0F0","#EF5350"),padding:"8px 12px"}} onClick={()=>{if(!confirmDelete("Â¿Eliminar a "+displayNameAlumno(a)+"?"))return;deleteAlumno(a);}} title="Eliminar">ðŸ—‘</button>
            </div>
          );
        })
      )}

      <Modal open={modal} onClose={()=>setModal(false)} title={editId?"Editar Alumno":"Agregar Alumno"}>
        <div style={{display:"flex",justifyContent:"center",marginBottom:18}}>
          <AvatarUpload photo={form.foto} onPhoto={(f)=>setForm(x=>({...x,foto:f}))} size={72} initials={buildNombreFull(form.primerNombre,form.segundoNombre,form.primerApellido,form.segundoApellido)?getInitials(buildNombreFull(form.primerNombre,form.segundoNombre,form.primerApellido,form.segundoApellido)):"?"} color="#5B2D8E"/>
        </div>
        <label style={S.label}>Primer nombre</label>
        <input style={{...S.input,marginBottom:12}} placeholder="Ej: JosÃ©" value={form.primerNombre} onChange={e=>setForm(f=>({...f,primerNombre:e.target.value}))}/>
        <label style={S.label}>Segundo nombre (opcional)</label>
        <input style={{...S.input,marginBottom:12}} placeholder="Ej: Luis â€” deja vacÃ­o si no aplica" value={form.segundoNombre} onChange={e=>setForm(f=>({...f,segundoNombre:e.target.value}))}/>
        <label style={S.label}>Primer apellido</label>
        <input style={{...S.input,marginBottom:12}} placeholder="Ej: MogollÃ³n" value={form.primerApellido} onChange={e=>setForm(f=>({...f,primerApellido:e.target.value}))}/>
        <label style={S.label}>Segundo apellido (opcional)</label>
        <input style={{...S.input,marginBottom:12}} placeholder="Ej: MuÃ±oz â€” deja vacÃ­o si no aplica" value={form.segundoApellido} onChange={e=>setForm(f=>({...f,segundoApellido:e.target.value}))}/>
        <div style={{marginBottom:12,fontSize:11,color:"#7B6B9A",background:"#F5F0FF",padding:"8px 10px",borderRadius:8}}>Las casillas opcionales pueden quedar vacÃ­as; no se corren. El nombre que se muestra serÃ¡ <strong>primer nombre + primer apellido</strong> (el disponible).</div>
        <div style={{marginBottom:12,fontSize:12,color:"#7B6B9A"}}>ðŸ‘¨â€ðŸ‘©â€ðŸ‘§ Familia (se rellena solo): {buildFamiliaAlumno(form.primerApellido,form.segundoApellido)||"â€”"}</div>
        <label style={S.label}>Nombre del padre</label>
        <input style={{...S.input,marginBottom:12}} placeholder="Ej: JosÃ© MogollÃ³n" value={form.nombrePadre} onChange={e=>setForm(f=>({...f,nombrePadre:e.target.value}))}/>
        <label style={S.label}>Nombre de la madre</label>
        <input style={{...S.input,marginBottom:12}} placeholder="Ej: Cindy MuÃ±oz" value={form.nombreMadre} onChange={e=>setForm(f=>({...f,nombreMadre:e.target.value}))}/>
        <label style={S.label}>Clase</label>
        <select style={{...S.input,marginBottom:12}} value={normalizarClase(form.clase)} onChange={e=>setForm(f=>({...f,clase:e.target.value}))}>
          {cfg.map(c=><option key={c.key} value={c.key}>{c.nombre}</option>)}
        </select>
        <label style={S.label}>Tel. Padre</label>
        <input type="tel" style={{...S.input,marginBottom:12}} value={form.telPadre} onChange={e=>setForm(f=>({...f,telPadre:e.target.value}))}/>
        <label style={S.label}>Tel. Madre</label>
        <input type="tel" style={{...S.input,marginBottom:12}} value={form.telMadre} onChange={e=>setForm(f=>({...f,telMadre:e.target.value}))}/>
        <label style={S.label}>Fecha de nacimiento</label>
        <input type="date" style={{...S.input,marginBottom:12}} value={form.nacimiento||""} onChange={e=>setForm(f=>({...f,nacimiento:e.target.value}))}/>
        {form.nacimiento&&(function(){try{const d=new Date(form.nacimiento);const dd=`${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}`;const hoy=new Date();const edad=hoy.getFullYear()-d.getFullYear()-(hoy<new Date(hoy.getFullYear(),d.getMonth(),d.getDate())?1:0);return <div style={{marginBottom:12,background:"#F5F0FF",borderRadius:10,padding:"8px 12px",fontSize:12,color:"#5B2D8E"}}>ðŸŽ‚ {dd} Â· {edad} aÃ±os</div>;}catch(e){return null;}}())}
        <div style={{display:"flex",gap:16,marginBottom:18,flexWrap:"wrap"}}>
          <label style={{display:"flex",alignItems:"center",gap:6,fontSize:13,color:"#5B2D8E"}}>
            <input type="checkbox" checked={!!form.bautizado} onChange={e=>setForm(f=>({...f,bautizado:e.target.checked}))}/>
            ðŸ™ Bautizado
          </label>
          <label style={{display:"flex",alignItems:"center",gap:6,fontSize:13,color:"#5B2D8E"}}>
            <input type="checkbox" checked={!!form.sellado} onChange={e=>setForm(f=>({...f,sellado:e.target.checked}))}/>
            âœ¨ Sellado
          </label>
        </div>
        <div style={{fontSize:11,color:"#7B6B9A",marginBottom:12}}>Puedes marcar uno, ambos o ninguno.</div>
        <button style={{...S.btn("#5B2D8E","#FFFFFF",true),padding:14}} onClick={save}>ðŸ’¾ Guardar</button>
        {editId&&<button style={{...S.btn("#FFF0F0","#EF5350"),padding:12,marginTop:10,border:"1.5px solid #EF535044"}} onClick={()=>{const a=(alumnos||[]).find(x=>x.id===editId);if(a)deleteAlumno(a);}}>ðŸ—‘ Eliminar</button>}
      </Modal>
    </div>
  );
}

// â•â•â•â•â•â•â•â•â•â• CALIFICACIONES ADMIN â•â•â•â•â•â•â•â•â•â•
function CalifAdminPanel({calificaciones,clases,criterios,onUpdate,cronograma=[],meriendas=[]}){
  const[activeClase,setActiveClase]=useState("CORDERITOS");
  const[viewMode,setViewMode]=useState("alumnos"); // "alumnos" | "sesiones"
  const ckeys=criterios.map(c=>c.key);
  const rowAvg=(entries)=>{let t=0,cnt=0;entries.forEach(e=>{ckeys.forEach(k=>{const v=parseFloat(e[k]);if(!isNaN(v)){t+=v;cnt++;}});});return cnt?(t/cnt).toFixed(1):null;};
  const getSesClaseCalifs=(sesionId)=>calificaciones.filter(c=>c.clase===activeClase&&c.sesionId===sesionId);
  const getSesAvgAll=(sesionId)=>{
    const entr=getSesClaseCalifs(sesionId);
    if(!entr.length)return null;
    let t=0,cnt=0;entr.forEach(e=>{ckeys.forEach(k=>{const v=parseFloat(e[k]);if(!isNaN(v)){t+=v;cnt++;}});});
    return cnt?(t/cnt).toFixed(1):null;
  };
  const sesiones=[...new Map(calificaciones.filter(c=>c.clase===activeClase).map(c=>[c.sesionId,c])).values()].sort((a,b)=>new Date(a.fecha)-new Date(b.fecha)).map(c=>{
    const cronEntry=cronograma.find(x=>x.id===c.sesionId)||{};
    return{...c,tema:c.tema||cronEntry.tema||""};
  });
  const totalNinos=(clases[activeClase]||[]).length;
  const resetCalifSesionAdmin=(sesionId)=>{
    if(!confirmDelete("Â¿Resetear todas las calificaciones de esta sesiÃ³n para la clase "+activeClase+"? Los alumnos quedarÃ¡n como ausentes."))return;
    const nuevas=calificaciones.filter(c=>!(c.clase===activeClase&&c.sesionId===sesionId));
    onUpdate(nuevas);
  };
  return(
    <div style={{padding:"1rem 1rem 6.25rem"}}>
      <h2 style={S.title}>Calificaciones</h2>
      <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:8,marginBottom:10}}>
        {CLASES_LIST.map(cl=>(
          <button key={cl} style={{...S.btn(activeClase===cl?CLASE_COLORS[cl]:"#F5F0FF",activeClase===cl?(cl==="VENCEDORES"?"#3D1B6B":"#FFFFFF"):"#2D1B4E"),padding:"8px 14px",fontSize:12,flexShrink:0,borderRadius:20}} onClick={()=>setActiveClase(cl)}>{cl}</button>
        ))}
      </div>
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        <button style={{...S.btn(viewMode==="alumnos"?"#5B2D8E":"#F5F0FF",viewMode==="alumnos"?"#FFFFFF":"#2D1B4E"),flex:1,padding:"10px",borderRadius:12,fontSize:13}} onClick={()=>setViewMode("alumnos")}>ðŸ‘¦ Por Alumno</button>
        <button style={{...S.btn(viewMode==="sesiones"?"#4BBCE0":"#F5F0FF",viewMode==="sesiones"?"#FFFFFF":"#2D1B4E"),flex:1,padding:"10px",borderRadius:12,fontSize:13}} onClick={()=>setViewMode("sesiones")}>ðŸ“‹ Por SesiÃ³n</button>
      </div>
      {viewMode==="alumnos"&&(clases[activeClase]||[]).map(n=>{
        const entries=calificaciones.filter(c=>c.alumno===n.nombre&&c.clase===activeClase).sort((a,b)=>new Date(a.fecha)-new Date(b.fecha));
        const avg=rowAvg(entries);
        const allObs=entries.filter(e=>e.observacion).map(e=>({texto:e.observacion,fecha:e.fecha,leccion:e.leccion,quien:e.quienObservacion}));
        return(
          <div key={n.nombre||n.id} style={{...S.card,borderLeft:`5px solid ${CLASE_COLORS[activeClase]}`}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
              {n.foto
                ?<img src={n.foto} alt="" style={{width:40,height:40,borderRadius:"50%",objectFit:"cover",border:`2px solid ${CLASE_COLORS[activeClase]}`,flexShrink:0}}/>
                :<div style={{width:40,height:40,borderRadius:"50%",background:CLASE_COLORS[activeClase]+"33",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,color:CLASE_COLORS[activeClase],flexShrink:0}}>{getInitials(n.nombre)}</div>
              }
              <div style={{flex:1}}><div style={{fontWeight:800,fontSize:14}}>{displayNameAlumno(n)}</div><div style={{fontSize:12,color:"#7B6B9A"}}>{entries.length} sesiones</div></div>
              {avg&&<div style={{background:scoreColor(avg)+"20",borderRadius:10,padding:"8px 12px",textAlign:"center"}}><div style={{fontSize:22,fontWeight:900,color:scoreColor(avg)}}>{avg}</div><div style={{fontSize:10,color:"#7B6B9A"}}>prom.</div></div>}
            </div>
            {entries.length===0&&<div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",background:"#EF535012",borderRadius:10,marginBottom:8}}><span style={{fontSize:14}}>ðŸ”´</span><span style={{fontSize:13,color:"#EF5350",fontWeight:700}}>Ausente â€” Sin calificaciones registradas</span></div>}
            {entries.map((e)=>(
              <div key={e.id} style={{background:"#F5F0FF",borderRadius:12,padding:"12px 14px",marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,flexWrap:"wrap",gap:6}}>
                  <span style={S.badge("#5B2D8E")}>{e.leccion} Â· {formatFecha(e.fecha)}</span>
                  {e.quienCalifico&&<span style={{fontSize:11,color:"#7B6B9A"}}>Calificado por {displayMaestroNombre(e.quienCalifico)}</span>}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
                  {criterios.map(c=>(
                    <div key={c.key} style={{fontSize:12}}><span style={{color:"#7B6B9A"}}>{c.logro}: </span><strong style={{color:scoreColor(e[c.key])}}>{e[c.key]||"â€”"}</strong></div>
                  ))}
                </div>
              </div>
            ))}
            {allObs.length>0&&(
              <div style={{marginTop:10,background:"linear-gradient(135deg,#F5C84215,#F5C84230)",border:"1.5px solid #F5C84255",borderRadius:12,padding:"12px 14px"}}>
                <div style={{fontWeight:800,color:"#7B5A00",fontSize:13,marginBottom:10}}>ðŸ’¬ Registro de Observaciones</div>
                {allObs.map((obs,i)=>(
                  <div key={i} style={{marginBottom:i<allObs.length-1?12:0,paddingBottom:i<allObs.length-1?12:0,borderBottom:i<allObs.length-1?"1px dashed #F5C84280":"none"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                      <span style={S.badge("#5B2D8E")}>{obs.leccion}</span>
                      <span style={{fontSize:11,color:"#7B6B9A",fontWeight:600}}>ðŸ“… {formatFecha(obs.fecha)}</span>
                      {obs.quien&&<span style={{fontSize:11,color:"#7B6B9A"}}>Â· por {displayMaestroNombre(obs.quien)}</span>}
                    </div>
                    <div style={{fontSize:13,color:"#2D1B4E",lineHeight:1.5,background:"#FFFFFF88",borderRadius:8,padding:"8px 10px"}}>{obs.texto}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
      {viewMode==="sesiones"&&(
        <div>
          {sesiones.length===0&&<div style={{color:"#7B6B9A",textAlign:"center",padding:30}}>Sin sesiones calificadas aÃºn.</div>}
          {sesiones.map(ses=>{
            const sesCalifs=getSesClaseCalifs(ses.sesionId);
            const avg=getSesAvgAll(ses.sesionId);
            const m=meriendas.find(x=>x.sesionId===ses.sesionId);
            const totalGasto=((parseFloat(m?.meriendaCosto)||0)+(parseFloat(m?.trabajoManualCosto)||0));
            let gastoLabel="";
            if(m?.merienda)gastoLabel+="ðŸŽ Merienda"+(m.meriendaDonativo?" (donativo)":"");
            if(m?.merienda&&m?.trabajoManual)gastoLabel+=" + ";
            if(m?.trabajoManual)gastoLabel+="âœ‚ï¸ T.Manual"+(m.trabajoManualDonativo?" (donativo)":"");
            const asistentes=sesCalifs.length;
            const pct=totalNinos?Math.round((asistentes/totalNinos)*100):0;
            return(
              <div key={ses.sesionId} style={{...S.card,borderLeft:`5px solid ${CLASE_COLORS[activeClase]||"#5B2D8E"}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10,flexWrap:"wrap",gap:8}}>
                  <div>
                    <div style={{fontWeight:900,fontSize:15,color:"#2D1B4E"}}>{ses.leccion}</div>
                    <div style={{fontSize:12,color:"#7B6B9A"}}>{formatFecha(ses.fecha)} Â· {ses.tema||"Sin tema registrado"}</div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    {sesCalifs.length>0&&(
                      <button style={{...S.btn("#FFF0E6","#C62828"),padding:"5px 10px",fontSize:11}} onClick={()=>resetCalifSesionAdmin(ses.sesionId)} title="Borrar todas las calificaciones de esta sesiÃ³n">ðŸ”„ Resetear</button>
                    )}
                    {avg&&<div style={{background:scoreColor(avg)+"25",borderRadius:12,padding:"8px 14px",textAlign:"center"}}>
                      <div style={{fontSize:22,fontWeight:900,color:scoreColor(avg)}}>{avg}</div>
                      <div style={{fontSize:10,color:"#7B6B9A"}}>prom. clase</div>
                    </div>}
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                  <div style={{background:"#5B2D8E12",borderRadius:10,padding:"10px 12px"}}>
                    <div style={{fontSize:10,color:"#5B2D8E",fontWeight:800,marginBottom:4}}>ASISTENCIA</div>
                    <div style={{fontWeight:900,fontSize:18,color:"#5B2D8E"}}>{asistentes}/{totalNinos}</div>
                    <div style={{fontSize:11,color:"#7B6B9A"}}>{pct}% de la clase</div>
                    <div style={{marginTop:6,background:"#DDD0F0",borderRadius:4,height:6,overflow:"hidden"}}>
                      <div style={{height:"100%",background:pct>=80?"#4CAF50":pct>=60?"#F5C842":"#EF5350",width:pct+"%",borderRadius:4}}/>
                    </div>
                  </div>
                  <div style={{background:totalGasto>0?"#4CAF5012":"#F5F0FF",borderRadius:10,padding:"10px 12px",border:totalGasto>0?"2px solid #4CAF5033":"none"}}>
                    <div style={{fontSize:10,color:totalGasto>0?"#2E7D32":"#7B6B9A",fontWeight:800,marginBottom:4}}>GASTOS</div>
                    {totalGasto>0?<>
                      <div style={{fontWeight:900,fontSize:18,color:"#2E7D32"}}>â‚¬{totalGasto.toFixed(2)}</div>
                      <div style={{fontSize:11,color:"#7B6B9A"}}>{gastoLabel}</div>
                    </>:<div style={{fontWeight:700,fontSize:13,color:"#CCC",marginTop:6}}>Sin gastos</div>}
                  </div>
                </div>
                {sesCalifs.length>0&&(
                  <div>
                    <div style={{fontSize:11,fontWeight:800,color:"#7B6B9A",marginBottom:6,letterSpacing:0.5}}>ALUMNOS PRESENTES</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                      {sesCalifs.map((e,i)=>{
                        let t=0,cnt=0;ckeys.forEach(k=>{const v=parseFloat(e[k]);if(!isNaN(v)){t+=v;cnt++;}});
                        const a=cnt?(t/cnt).toFixed(1):null;
                        const nino=(clases[activeClase]||[]).find(n=>n.nombre===e.alumno);
                        const colorClase=CLASE_COLORS[activeClase]||"#5B2D8E";
                        return <div key={i} style={{background:a?scoreColor(a)+"20":"#F5F0FF",borderRadius:8,padding:"4px 10px",fontSize:12,border:`1.5px solid ${a?scoreColor(a)+"44":"#DDD0F0"}`,display:"inline-flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                          {nino?.foto?<img src={nino.foto} alt="" style={{width:22,height:22,borderRadius:"50%",objectFit:"cover",border:`1.5px solid ${colorClase}44`}}/>:<div style={{width:22,height:22,borderRadius:"50%",background:colorClase+"33",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:colorClase}}>{getInitials(e.alumno)}</div>}
                          <span style={{fontWeight:700}}>{shortDisplayName(e.alumno)}</span>{a&&<span style={{color:scoreColor(a),fontWeight:800}}> {a}</span>}{e.quienCalifico&&<span style={{fontSize:10,color:"#7B6B9A"}}>Â· por {displayMaestroNombre(e.quienCalifico)}</span>}
                        </div>;
                      })}
                    </div>
                    {sesCalifs.some(e=>e.observacion)&&(
                      <div style={{marginTop:10,background:"#F5C84210",border:"1.5px solid #F5C84244",borderRadius:10,padding:"10px 12px"}}>
                        <div style={{fontSize:11,fontWeight:800,color:"#7B5A00",marginBottom:6}}>ðŸ’¬ OBSERVACIONES</div>
                        {sesCalifs.filter(e=>e.observacion).map((e,i)=>{
                          const nino=(clases[activeClase]||[]).find(n=>n.nombre===e.alumno);const colorClase=CLASE_COLORS[activeClase]||"#5B2D8E";
                          return <div key={i} style={{fontSize:12,color:"#2D1B4E",marginBottom:4,lineHeight:1.5,display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                            {nino?.foto?<img src={nino.foto} alt="" style={{width:20,height:20,borderRadius:"50%",objectFit:"cover",border:`1.5px solid ${colorClase}44`,flexShrink:0}}/>:<div style={{width:20,height:20,borderRadius:"50%",background:colorClase+"33",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800,color:colorClase,flexShrink:0}}>{getInitials(e.alumno)}</div>}
                            <span><strong>{shortDisplayName(e.alumno)}:</strong> {e.observacion}{e.quienObservacion?<span style={{fontSize:11,color:"#7B6B9A"}}> â€” por {displayMaestroNombre(e.quienObservacion)}</span>:""}</span>
                          </div>;
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// â•â•â•â•â•â•â•â•â•â• EVALUACIONES ADMIN â•â•â•â•â•â•â•â•â•â•
function EvaluacionesPanel({evaluaciones,onUpdate,videos=[],maestros=[]}){
  const[editModal,setEditModal]=useState(false);
  const[editForm,setEditForm]=useState(null);
  const[editIdx,setEditIdx]=useState(null);
  const openEdit=(ev,i)=>{setEditForm({...ev});setEditIdx(i);setEditModal(true);};
  const save=()=>{onUpdate(evaluaciones.map((e,i)=>i===editIdx?editForm:e));setEditModal(false);};
  return(
    <div style={{padding:"1rem 1rem 6.25rem"}}>
      <h2 style={S.title}>Evaluaciones Maestros</h2>
      {evaluaciones.map((ev,i)=>{
        const vAvg=videoAvgForMaestro(ev.nombre,videos,maestros);
        const avg=evalAvg(ev,vAvg);const avgN=parseFloat(avg);const color=avgN>=4.5?"#4CAF50":avgN>=3.5?"#F5A623":"#EF5350";
        const avgFormatted=formatEvalScore(avg);
        const mFoto=maestros.find(m=>m.nombre===ev.nombre);
        return(
          <div key={i} style={{...S.card,borderLeft:`5px solid ${color}`}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
              {mFoto?.foto?<img src={mFoto.foto} alt="" style={{width:44,height:44,borderRadius:"50%",objectFit:"cover",border:"2px solid #5B2D8E44",flexShrink:0}}/>:<div style={{width:44,height:44,borderRadius:"50%",background:"#5B2D8E22",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,color:"#5B2D8E",flexShrink:0}}>{getInitials(ev.nombre)}</div>}
              <div style={{flex:1}}><div style={{fontWeight:800,fontSize:14}}>{displayMaestroNombre(ev.nombre)}</div>
                {vAvg!=null&&<div style={{fontSize:11,color:"#4BBCE0",fontWeight:700}}>ðŸŽ¬ Video: {vAvg.toFixed(1)}/5 Â· incl. en promedio</div>}
              </div>
              <div style={{textAlign:"center",background:color+"20",borderRadius:12,padding:"8px 14px"}}>
                <div style={{fontSize:22,fontWeight:900,color}}>{avgFormatted}</div><div style={{fontSize:10,color:"#7B6B9A"}}>/5</div>
              </div>
              <button style={{...S.btn("#4BBCE0"),padding:"8px 12px",fontSize:13}} onClick={()=>openEdit(ev,i)}>âœï¸</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {EVAL_KEYS.map((k,j)=>(
                <div key={k} style={{background:k==="cumplimientoClases"?"linear-gradient(135deg,#5B2D8E15,#5B2D8E25)":"#F5F0FF",borderRadius:10,padding:"8px 10px",border:k==="cumplimientoClases"?"1.5px solid #5B2D8E44":"none"}}>
                  <div style={{fontSize:10,color:k==="cumplimientoClases"?"#5B2D8E":"#7B6B9A",marginBottom:4,fontWeight:k==="cumplimientoClases"?800:400}}>{EVAL_LABELS[j]}</div>
                  <div style={{display:"flex",gap:1}}>{[1,2,3,4,5].map(s=><span key={s} style={{color:s<=(ev[k]||0)?"#F5C842":"#e0e0e0",fontSize:16}}>â˜…</span>)}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      <Modal open={editModal} onClose={()=>setEditModal(false)} title={`Editar: ${editForm?displayMaestroNombre(editForm.nombre):""}`}>
        {editForm&&EVAL_KEYS.map((k,j)=>(
          <div key={k} style={{marginBottom:16}}>
            <label style={S.label}>{EVAL_LABELS[j]}</label>
            <div style={{display:"flex",gap:8,justifyContent:"center"}}>
              {[1,2,3,4,5].map(s=>(
                <button key={s} onClick={()=>setEditForm(f=>({...f,[k]:s}))}
                  style={{width:44,height:44,borderRadius:12,border:`2px solid ${editForm[k]===s?"#F5C842":"#DDD0F0"}`,background:editForm[k]===s?"#5B2D8E":"#F5F0FF",color:editForm[k]===s?"#F5C842":"#7B6B9A",fontWeight:900,cursor:"pointer",fontSize:22,fontFamily:"inherit"}}>â˜…</button>
              ))}
            </div>
          </div>
        ))}
        {editForm&&(
          <div style={{marginBottom:16}}>
            <label style={S.label}>Observaciones</label>
            <textarea style={{...S.input,minHeight:80,resize:"vertical"}} placeholder="Comentarios sobre el maestro para el informe" value={editForm.observaciones||""} onChange={e=>setEditForm(f=>({...f,observaciones:e.target.value}))}/>
          </div>
        )}
        <button style={{...S.btn("#5B2D8E","#FFFFFF",true),padding:14,marginTop:8}} onClick={save}>ðŸ’¾ Guardar</button>
      </Modal>
    </div>
  );
}

// Formato corto para registro de quiÃ©n calificÃ³ / observÃ³ (calificaciones de alumnos)
function formatCalifFecha(iso){
  if(!iso)return "";
  try{const d=new Date(iso);return d.toLocaleDateString("es-ES",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});}catch(e){return iso;}
}

// â•â•â•â•â•â•â•â•â•â• EVALUACIONES + VIDEOS UNIFICADO (admin) â•â•â•â•â•â•â•â•â•â•
// Una sola pestaÃ±a: maestros ordenados por sesiones, icono si hay videos por calificar
function EvaluacionesPanelUnificado({evaluaciones,onUpdate,videos,onUpdateVideos,cronograma,onUpdateCronograma,maestros}){
  const[editModal,setEditModal]=useState(false);
  const[editForm,setEditForm]=useState(null);
  const[editIdx,setEditIdx]=useState(null);
  const[videoModalMaestro,setVideoModalMaestro]=useState(null);
  const[editVideo,setEditVideo]=useState(null);
  const observacionesRef=useRef(null);
  useEffect(()=>{ if(editModal){ const t=setTimeout(()=>{observacionesRef.current?.focus();},100); return ()=>clearTimeout(t); } },[editModal]);

  const sesiones=cronograma
    .filter(c=>c.maestro&&c.leccion&&c.leccion!=="NO HAY CLASE")
    .sort((a,b)=>(b.fecha||"").localeCompare(a.fecha||""));
  const nombresEnMaestros=new Set((maestros||[]).map(m=>m.nombre));
  const findEvalForMaestro=(nombre)=>evaluaciones.find(e=>e.nombre===nombre)||evaluaciones.find(e=>samePersonName(e.nombre,nombre));
  // Orden: primero pendientes por calificar (sin evaluaciÃ³n), ordenados por fecha de sesiÃ³n (quien dio clase mÃ¡s reciente primero); luego el resto alfabÃ©ticamente
  const fechaPorMaestro={};
  sesiones.forEach(s=>{if(s.maestro&&nombresEnMaestros.has(s.maestro)&&!fechaPorMaestro[s.maestro])fechaPorMaestro[s.maestro]=s.fecha;});
  const allNombres=(maestros||[]).map(m=>m.nombre);
  const pendientesPorCalificar=allNombres.filter(n=>!findEvalForMaestro(n));
  const conEvaluacion=allNombres.filter(n=>findEvalForMaestro(n));
  const pendientesOrdenados=[...pendientesPorCalificar].sort((a,b)=>(fechaPorMaestro[b]||"").localeCompare(fechaPorMaestro[a]||""));
  const conEvalAlfabetico=[...conEvaluacion].sort((a,b)=>displayMaestroNombre(a).localeCompare(displayMaestroNombre(b),"es"));
  const orderedMaestros=[...pendientesOrdenados,...conEvalAlfabetico];

  const getVideo=(sesionId,maestro)=>videos.find(v=>v.sesionId===sesionId&&v.maestro===maestro)||null;
  const sesionesConVideoPorMaestro=(nombre)=>sesiones.filter(s=>VIDEO_CLASES.includes(s.grupo)&&s.maestro===nombre);
  const pendientesVideos=(nombre)=>sesionesConVideoPorMaestro(nombre).filter(s=>!getVideo(s.id,s.maestro));

  const openEdit=(ev,i,canonicalNombre)=>{setEditForm({...ev,...(canonicalNombre&&ev.nombre!==canonicalNombre?{nombre:canonicalNombre}:{})});setEditIdx(i);setEditModal(true);};
  const openAdd=(nombre)=>{const default5=EVAL_KEYS.filter(k=>k!=="cumplimientoClases").reduce((o,k)=>({...o,[k]:5}),{});setEditForm({nombre,...default5,cumplimientoClases:5,observaciones:""});setEditIdx(-1);setEditModal(true);};
  const save=()=>{
    const cumplimientoAuto=cumplimientoClasesFromCronograma(editForm.nombre,cronograma);
    const toSave={...editForm,cumplimientoClases:cumplimientoAuto!=null?cumplimientoAuto:(editForm.cumplimientoClases??3)};
    if(editIdx===-1)onUpdate([...evaluaciones,toSave]);
    else onUpdate(evaluaciones.map((e,i)=>i===editIdx?toSave:e));
    setEditModal(false);
  };

  const openVideosModal=(nombre)=>{setVideoModalMaestro(nombre);setEditVideo(null);};
  const openEditVideo=(ses)=>{
    const v=getVideo(ses.id,ses.maestro)||{sesionId:ses.id,maestro:ses.maestro,grupo:ses.grupo,fecha:ses.fecha,hizo:false,calidad:3,aTiempo:false};
    setEditVideo({...v,leccion:ses.leccion,fecha:ses.fecha});
  };
  const saveVideo=()=>{
    if(!editVideo)return;
    const {leccion:_,fecha:_f,...toSave}=editVideo;
    const exists=videos.findIndex(v=>v.sesionId===toSave.sesionId&&v.maestro===toSave.maestro);
    if(exists>=0)onUpdateVideos(videos.map((v,i)=>i===exists?toSave:v));
    else onUpdateVideos([...videos,toSave]);
    setEditVideo(null);
  };

  const setTeacherTo5=(nombre)=>{
    if(!window.confirm("Â¿Poner la calificaciÃ³n de "+displayMaestroNombre(nombre)+" en 5 estrellas? Se guardarÃ¡ la evaluaciÃ³n con la nota mÃ¡xima."))return;
    const ev=findEvalForMaestro(nombre);
    if(ev){
      onUpdate((evaluaciones||[]).map(e=>e.nombre===nombre?{...e,...EVAL_DEFAULT_5,nombre:e.nombre,observaciones:e.observaciones||""}:e));
    }else{
      onUpdate([...(evaluaciones||[]),{nombre,...EVAL_DEFAULT_5,observaciones:""}]);
    }
  };
  return(
    <div style={{padding:"1rem 1rem 6.25rem"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10,marginBottom:14}}>
        <h2 style={S.title}>Evaluaciones Maestros</h2>
      </div>
      <div style={{background:"linear-gradient(135deg,#4BBCE015,#5B2D8E15)",border:"1.5px solid #4BBCE055",borderRadius:14,padding:"12px 14px",marginBottom:16,fontSize:13,color:"#2D1B4E"}}>
        <div style={{fontWeight:800,marginBottom:4}}>ðŸ“‹ Pendientes por fecha de clase Â· Luego alfabÃ©tico Â· ðŸŽ¬ Videos por calificar</div>
        <div style={{color:"#5B2D8E",fontSize:12}}>Quienes faltan por calificar aparecen primero (por fecha de su Ãºltima clase); el resto en orden alfabÃ©tico. El icono <strong>ðŸŽ¬</strong> indica videos pendientes de calificar.</div>
      </div>
      {orderedMaestros.map(nombre=>{
        const ev=findEvalForMaestro(nombre);
        const evIdx=ev!=null?evaluaciones.indexOf(ev):-1;
        const cumplimientoAuto=cumplimientoClasesFromCronograma(nombre,cronograma);
        const evDisplay=ev?{...ev,cumplimientoClases:cumplimientoAuto!=null?cumplimientoAuto:(ev.cumplimientoClases??3)}:null;
        const vAvg=videoAvgForMaestro(nombre,videos,maestros);
        const avg=evDisplay?evalAvg(evDisplay,vAvg):(vAvg!=null?String(vAvg.toFixed(1)):null);
        const avgN=parseFloat(avg);const color=Number.isNaN(avgN)? "#DDD0F0" : avgN>=4.5?"#4CAF50":avgN>=3.5?"#F5A623":"#EF5350";
        const avgFormatted=formatEvalScore(avg);
        const mFoto=maestros.find(m=>m.nombre===nombre);
        const pendientes=pendientesVideos(nombre);
        const tienePendientes=pendientes.length>0;
        return(
          <div key={nombre} style={{...S.card,borderLeft:`5px solid ${ev?color:"#DDD0F0"}`}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
              {mFoto?.foto?<img src={mFoto.foto} alt="" style={{width:44,height:44,borderRadius:"50%",objectFit:"cover",border:"2px solid #5B2D8E44",flexShrink:0}}/>:<div style={{width:44,height:44,borderRadius:"50%",background:"#5B2D8E22",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,color:"#5B2D8E",flexShrink:0}}>{getInitials(nombre)}</div>}
              <div style={{flex:1}}>
                <div style={{fontWeight:800,fontSize:14}}>{displayMaestroNombre(nombre)}</div>
                {!ev&&<div style={{fontSize:11,color:"#F5A623",fontWeight:700,marginTop:2}}>â³ Pendiente por calificar</div>}
                {vAvg!=null&&<div style={{fontSize:11,color:"#4BBCE0",fontWeight:700}}>ðŸŽ¬ Video: {vAvg.toFixed(1)}/5 Â· incl. en promedio</div>}
              </div>
              {tienePendientes&&(
                <button title={`${pendientes.length} video(s) por calificar`} style={{...S.btn("#E84F9B"),padding:"8px 12px",fontSize:14,position:"relative"}} onClick={()=>openVideosModal(nombre)}>
                  ðŸŽ¬ {pendientes.length>0&&<span style={{position:"absolute",top:-4,right:-4,minWidth:18,height:18,borderRadius:9,background:"#FFFFFF",color:"#E84F9B",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",border:"2px solid #E84F9B"}}>{pendientes.length}</span>}
                </button>
              )}
              <button style={{...S.btn("#F5C842","#3D1B6B"),padding:"8px 12px",fontSize:13}} onClick={()=>setTeacherTo5(nombre)} title="Poner calificaciÃ³n total en 5 estrellas">â­ 5</button>
              {evIdx>=0?<button style={{...S.btn("#4BBCE0"),padding:"8px 12px",fontSize:13}} onClick={()=>openEdit(ev,evIdx,nombre)}>âœï¸</button>:<button style={{...S.btn("#4CAF50"),padding:"8px 12px",fontSize:13}} onClick={()=>openAdd(nombre)}>+ Evaluar</button>}
              {ev&&<div style={{textAlign:"center",background:color+"20",borderRadius:12,padding:"8px 14px"}}><div style={{fontSize:22,fontWeight:900,color}}>{avgFormatted}</div><div style={{fontSize:10,color:"#7B6B9A"}}>/5 <span style={{fontSize:9}}>incl. video</span></div></div>}
            </div>
            {ev&&(
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {EVAL_KEYS.map((k,j)=>(
                  <div key={k} style={{background:k==="cumplimientoClases"?"linear-gradient(135deg,#5B2D8E15,#5B2D8E25)":"#F5F0FF",borderRadius:10,padding:"8px 10px",border:k==="cumplimientoClases"?"1.5px solid #5B2D8E44":"none"}}>
                    <div style={{fontSize:10,color:k==="cumplimientoClases"?"#5B2D8E":"#7B6B9A",marginBottom:4,fontWeight:k==="cumplimientoClases"?800:400}}>{EVAL_LABELS[j]}{k==="cumplimientoClases"?" (auto)":""}</div>
                    <div style={{display:"flex",gap:1}}>{[1,2,3,4,5].map(s=><span key={s} style={{color:s<=(evDisplay[k]||0)?"#F5C842":"#e0e0e0",fontSize:16}}>â˜…</span>)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
      <Modal open={editModal} onClose={()=>setEditModal(false)} title={editForm?(editIdx===-1?`Nueva evaluaciÃ³n: ${displayMaestroNombre(editForm.nombre)}`:`Editar: ${displayMaestroNombre(editForm.nombre)}`):""}>
        {editForm&&EVAL_KEYS.filter(k=>k!=="cumplimientoClases").map((k,j)=>(
          <div key={k} style={{marginBottom:16}}>
            <label style={S.label}>{EVAL_LABELS[EVAL_KEYS.indexOf(k)]}</label>
            <div style={{display:"flex",gap:8,justifyContent:"center"}}>
              {[1,2,3,4,5].map(s=>(
                <button key={s} onClick={()=>setEditForm(f=>({...f,[k]:s}))}
                  style={{width:44,height:44,borderRadius:12,border:`2px solid ${editForm[k]===s?"#F5C842":"#DDD0F0"}`,background:editForm[k]===s?"#5B2D8E":"#F5F0FF",color:editForm[k]===s?"#F5C842":"#7B6B9A",fontWeight:900,cursor:"pointer",fontSize:22,fontFamily:"inherit"}}>â˜…</button>
              ))}
            </div>
          </div>
        ))}
        {editForm&&(
          <div style={{marginBottom:16,background:"linear-gradient(135deg,#5B2D8E12,#5B2D8E22)",borderRadius:12,padding:"12px 14px",border:"1.5px solid #5B2D8E44"}}>
            <label style={{...S.label,color:"#5B2D8E",fontWeight:800}}>âœ… Cumplimiento de Clases (automÃ¡tico)</label>
            <div style={{fontSize:13,color:"#7B6B9A",marginTop:4}}>Se calcula automÃ¡ticamente segÃºn las clases asignadas: empieza en 5 estrellas. Cada falla registrada en Horario (botÃ³n Falla) resta 1 punto. Con una falla nunca podrÃ¡ tener las 5 estrellas. Las fallas quedan registradas mÃ¡s abajo con fecha, lecciÃ³n y grupo.</div>
            <div style={{display:"flex",gap:4,marginTop:8,alignItems:"center"}}>
              {[1,2,3,4,5].map(s=>(
                <span key={s} style={{color:s<=(cumplimientoClasesFromCronograma(editForm.nombre,cronograma)??0)?"#F5C842":"#e0e0e0",fontSize:20}}>â˜…</span>
              ))}
              <span style={{fontSize:12,color:"#5B2D8E",marginLeft:4}}>{(cumplimientoClasesFromCronograma(editForm.nombre,cronograma)??"â€”")+"/5"}</span>
            </div>
            {(()=>{
              const fallasReg=(cronograma||[]).filter(e=>(e.fallaMaestro===editForm.nombre||e.fallaAuxiliar===editForm.nombre));
              if(fallasReg.length===0)return null;
              const quitarFalla=(ent)=>{
                const esMaestro=ent.fallaMaestro===editForm.nombre;
                const key=esMaestro?"fallaMaestro":"fallaAuxiliar";
                if(!window.confirm("Â¿Quitar esta falla del historial? Ya no se descontarÃ¡ cumplimiento para esta sesiÃ³n."))return;
                if(onUpdateCronograma)onUpdateCronograma(cronograma.map(c=>c.id===ent.id?{...c,[key]:undefined}:c));
              };
              return(
                <div style={{marginTop:12,paddingTop:10,borderTop:"1px solid #DDD0F0"}}>
                  <div style={{fontSize:11,fontWeight:800,color:"#EF5350",marginBottom:6}}>ðŸ“‹ Registro de fallas (fecha, lecciÃ³n, grupo) â€” Admin puede quitar si fue un error</div>
                  {fallasReg.map(e=>(
                    <div key={e.id} style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:"#2D1B4E",marginBottom:6}}>
                      <span style={{flex:1}}>ðŸ“… {e.fecha} Â· {e.leccion||"â€”"} Â· {e.grupo||"â€”"}</span>
                      {onUpdateCronograma&&<button type="button" style={{...S.btn("#FFF0F0","#EF5350"),padding:"4px 10px",fontSize:11}} onClick={()=>quitarFalla(e)} title="Quitar esta falla del historial">ðŸ—‘ Quitar falla</button>}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}
        {editForm&&(()=>{
          const sesionesVideo=(cronograma||[]).filter(s=>s.maestro===editForm.nombre&&VIDEO_CLASES.includes(s.grupo)&&s.leccion&&s.leccion!=="NO HAY CLASE");
          const conCalif=sesionesVideo.map(s=>{const v=videos.find(vid=>vid.sesionId===s.id&&vid.maestro===s.maestro);return {ses:s,v,score:v?videoScore(v):null};}).filter(x=>x.v);
          if(conCalif.length===0)return null;
          const openVideoEdit=(ses)=>{setVideoModalMaestro(editForm.nombre);openEditVideo(ses);setEditModal(false);};
          const eliminarVideoCalif=(v)=>{if(!confirmDelete("Â¿Eliminar esta calificaciÃ³n de video del historial? Se borrarÃ¡ el registro de esta sesiÃ³n."))return;onUpdateVideos(videos.filter(vid=>!(vid.sesionId===v.sesionId&&vid.maestro===v.maestro)));};
          return(
            <div style={{marginBottom:16,background:"#4BBCE008",borderRadius:12,padding:"12px 14px",border:"1.5px solid #4BBCE044"}}>
              <label style={{...S.label,color:"#4BBCE0",fontWeight:800}}>ðŸŽ¬ Historial de calificaciones (videos)</label>
              <div style={{fontSize:11,color:"#7B6B9A",marginTop:4,marginBottom:8}}>Cada fila es una sesiÃ³n con video calificado. Admin puede editar o eliminar si hubo error.</div>
              {conCalif.map(({ses,v,score})=>(
                <div key={ses.id} style={{display:"flex",alignItems:"center",gap:8,fontSize:12,marginBottom:8,flexWrap:"wrap"}}>
                  <span style={{fontWeight:700,color:"#5B2D8E"}}>{ses.leccion}</span>
                  <span style={{color:"#7B6B9A"}}>ðŸ“… {ses.fecha} Â· {ses.grupo}</span>
                  <span style={{fontWeight:800,color:score>=4?"#4CAF50":score>=2.5?"#F5A623":"#EF5350"}}>{score!=null?score.toFixed(1):"â€”"}/5</span>
                  <button type="button" style={{...S.btn("#4BBCE0","#FFF"),padding:"4px 10px",fontSize:11}} onClick={()=>openVideoEdit(ses)} title="Editar calificaciÃ³n">âœï¸ Editar</button>
                  <button type="button" style={{...S.btn("#FFF0F0","#EF5350"),padding:"4px 10px",fontSize:11}} onClick={()=>eliminarVideoCalif(v)} title="Eliminar del historial">ðŸ—‘ Eliminar</button>
                </div>
              ))}
            </div>
          );
        })()}
        {editForm&&(
          <div style={{marginBottom:16}}>
            <label style={S.label}>Observaciones</label>
            <textarea ref={observacionesRef} style={{...S.input,minHeight:80,resize:"vertical"}} placeholder="Comentarios sobre el maestro para el informe" value={editForm.observaciones||""} onChange={e=>setEditForm(f=>({...f,observaciones:e.target.value}))}/>
          </div>
        )}
        <button style={{...S.btn("#5B2D8E","#FFFFFF",true),padding:14,marginTop:8}} onClick={save}>ðŸ’¾ Guardar</button>
      </Modal>

      <Modal open={!!videoModalMaestro} onClose={()=>{setVideoModalMaestro(null);setEditVideo(null);}} title={videoModalMaestro?`ðŸŽ¬ Videos Â· ${displayMaestroNombre(videoModalMaestro)}`:""}>
        {videoModalMaestro&&!editVideo&&(
          <div>
            {sesionesConVideoPorMaestro(videoModalMaestro).length===0?(
              <div style={{textAlign:"center",padding:24,color:"#7B6B9A"}}>No hay sesiones con video para este maestro.</div>
            ):(
              sesionesConVideoPorMaestro(videoModalMaestro).map(ses=>{
                const v=getVideo(ses.id,ses.maestro);
                const score=v?videoScore(v):null;
                const scoreColor=score==null?"#7B6B9A":score>=4?"#4CAF50":score>=2.5?"#F5A623":"#EF5350";
                return(
                  <div key={ses.id} style={{...S.card,borderLeft:`5px solid ${v?scoreColor:"#DDD0F0"}`,marginBottom:10}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:800,fontSize:13}}>{ses.leccion}</div>
                        <div style={{fontSize:11,color:"#7B6B9A"}}>ðŸ“… {ses.fecha} Â· {ses.grupo}</div>
                      </div>
                      {v?(
                        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                          <span style={{...S.badge(v.hizo?"#4CAF50":"#EF5350"),fontSize:11}}>{v.hizo?"âœ… Enviado":"âŒ No enviado"}</span>
                          {v.hizo&&<span style={{...S.badge(scoreColor),fontSize:11}}>ðŸŽ¯ {score!=null?score.toFixed(1):"-"}/5</span>}
                          <button style={{...S.btn("#4BBCE0"),padding:"6px 12px",fontSize:12}} onClick={()=>openEditVideo(ses)}>âœï¸</button>
                        </div>
                      ):(
                        <button style={{...S.btn("#E84F9B"),padding:"8px 14px",fontSize:13}} onClick={()=>openEditVideo(ses)}>ðŸ“‹ Calificar</button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
        {editVideo&&(
          <div>
            <div style={{background:"#F5F0FF",borderRadius:12,padding:"12px 14px",marginBottom:16,display:"flex",alignItems:"center",gap:12}}>
              {(()=>{const mo=maestros.find(x=>x.nombre===editVideo.maestro);return mo?.foto?<img src={mo.foto} alt="" style={{width:44,height:44,borderRadius:"50%",objectFit:"cover",border:"2px solid #5B2D8E44",flexShrink:0}}/>:<div style={{width:44,height:44,borderRadius:"50%",background:"#5B2D8E22",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:16,color:"#5B2D8E",flexShrink:0}}>{getInitials(editVideo.maestro)}</div>;})()}
              <div><div style={{fontWeight:800,color:"#5B2D8E"}}>{editVideo.leccion}</div><div style={{fontSize:12,color:"#7B6B9A",marginTop:2}}>ðŸ“… {editVideo.fecha}</div></div>
            </div>
            <label style={S.label}>Â¿El maestro enviÃ³ el video?</label>
            <div style={{display:"flex",gap:10,marginBottom:16}}>
              {[[true,"âœ… SÃ­","#4CAF50"],[false,"âŒ No","#EF5350"]].map(([val,lbl,col])=>(
                <button key={String(val)} onClick={()=>setEditVideo(v=>({...v,hizo:val}))}
                  style={{flex:1,padding:"12px 8px",borderRadius:12,border:`2px solid ${editVideo.hizo===val?col:"#DDD0F0"}`,background:editVideo.hizo===val?col+"22":"#F5F0FF",color:editVideo.hizo===val?col:"#7B6B9A",fontWeight:700,cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>{lbl}</button>
              ))}
            </div>
            {editVideo.hizo&&(
              <>
                <label style={S.label}>â­ Calidad (1â€“5)</label>
                <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:16}}>
                  {[1,2,3,4,5].map(s=>(
                    <button key={s} onClick={()=>setEditVideo(v=>({...v,calidad:s}))}
                      style={{width:46,height:46,borderRadius:12,border:`2px solid ${editVideo.calidad===s?"#F5C842":"#DDD0F0"}`,background:editVideo.calidad===s?"#5B2D8E":"#F5F0FF",color:editVideo.calidad===s?"#F5C842":"#7B6B9A",fontWeight:900,cursor:"pointer",fontSize:22,fontFamily:"inherit"}}>â˜…</button>
                  ))}
                </div>
                <label style={S.label}>â° Â¿A tiempo?</label>
                <div style={{display:"flex",gap:10,marginBottom:20}}>
                  {[[true,"â° SÃ­","#4CAF50"],[false,"â± Tarde","#FF7043"]].map(([val,lbl,col])=>(
                    <button key={String(val)} onClick={()=>setEditVideo(v=>({...v,aTiempo:val}))}
                      style={{flex:1,padding:"12px 8px",borderRadius:12,border:`2px solid ${editVideo.aTiempo===val?col:"#DDD0F0"}`,background:editVideo.aTiempo===val?col+"22":"#F5F0FF",color:editVideo.aTiempo===val?col:"#7B6B9A",fontWeight:700,cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>{lbl}</button>
                  ))}
                </div>
                <div style={{background:"#4BBCE015",borderRadius:12,padding:"0.75rem 1rem",marginBottom:16,textAlign:"center"}}><div style={{fontSize:12,color:"#7B6B9A"}}>Score</div><div style={{fontSize:24,fontWeight:900,color:"#5B2D8E"}}>{videoScore(editVideo).toFixed(1)}/5</div></div>
              </>
            )}
            <button style={{...S.btn("#5B2D8E","#FFFFFF",true),padding:14,marginRight:8}} onClick={saveVideo}>ðŸ’¾ Guardar</button>
            <button style={{...S.btn("#F5F0FF","#5B2D8E"),padding:14}} onClick={()=>setEditVideo(null)}>â† Volver a lista</button>
          </div>
        )}
      </Modal>
    </div>
  );
}

// â•â•â•â•â•â•â•â•â•â• VIDEOS PANEL â•â•â•â•â•â•â•â•â•â•
// Solo para clases que requieren video: CORDERITOS, VENCEDORES, CONQUISTADORES
function VideosPanel({videos,onUpdate,cronograma,maestros}){
  const[selClase,setSelClase]=useState("CORDERITOS");
  const[editModal,setEditModal]=useState(false);
  const[editVideo,setEditVideo]=useState(null); // {sesionId, maestro, hizo, calidad, aTiempo}

  // Sesiones relevantes (con maestro asignado, solo VIDEO_CLASES)
  const sesiones=cronograma
    .filter(c=>VIDEO_CLASES.includes(c.grupo)&&c.maestro&&c.leccion!=="NO HAY CLASE")
    .sort((a,b)=>b.fecha.localeCompare(a.fecha));
  const sesionesFiltradas=sesiones.filter(c=>c.grupo===selClase);

  const getVideo=(sesionId,maestro)=>videos.find(v=>v.sesionId===sesionId&&v.maestro===maestro)||null;

  const openEdit=(ses)=>{
    const v=getVideo(ses.id,ses.maestro)||{sesionId:ses.id,maestro:ses.maestro,grupo:ses.grupo,fecha:ses.fecha,hizo:false,calidad:3,aTiempo:false};
    setEditVideo({...v,leccion:ses.leccion,fecha:ses.fecha});
    setEditModal(true);
  };

  const saveVideo=()=>{
    const {leccion:_,fecha:_f,...toSave}=editVideo;
    const exists=videos.findIndex(v=>v.sesionId===toSave.sesionId&&v.maestro===toSave.maestro);
    if(exists>=0)onUpdate(videos.map((v,i)=>i===exists?toSave:v));
    else onUpdate([...videos,toSave]);
    setEditModal(false);
  };

  // Stats por maestro para la clase seleccionada
  const maestrosClase=[...new Set(sesionesFiltradas.map(s=>s.maestro).filter(Boolean))];

  return(
    <div style={{padding:"1rem 1rem 6.25rem"}}>
      <h2 style={S.title}>ðŸŽ¬ Videos de Clase</h2>
      <div style={{background:"linear-gradient(135deg,#4BBCE015,#5B2D8E15)",border:"1.5px solid #4BBCE055",borderRadius:14,padding:"12px 14px",marginBottom:16,fontSize:13,color:"#2D1B4E"}}>
        <div style={{fontWeight:800,marginBottom:4}}>ðŸ“‹ Â¿CÃ³mo funciona?</div>
        <div style={{color:"#5B2D8E",fontSize:12}}>Cada maestro debe grabar un video de su clase para presentarlo el prÃ³ximo domingo. AquÃ­ puedes calificar si lo hizo, si quedÃ³ bien y si lo enviÃ³ a tiempo. La puntuaciÃ³n <strong>afecta el promedio de evaluaciÃ³n</strong> del maestro (20% del total).</div>
      </div>

      {/* Tabs por clase */}
      <div style={{display:"flex",gap:8,marginBottom:16,overflowX:"auto",paddingBottom:4}}>
        {VIDEO_CLASES.map(cl=>(
          <button key={cl}
            style={{...S.btn(selClase===cl?CLASE_COLORS[cl]:"#F5F0FF",selClase===cl?(cl==="VENCEDORES"?"#3D1B6B":"#FFFFFF"):"#2D1B4E"),padding:"8px 16px",fontSize:12,flexShrink:0,borderRadius:20}}
            onClick={()=>setSelClase(cl)}>
            {cl}
          </button>
        ))}
      </div>

      {/* Resumen por maestro */}
      {maestrosClase.length>0&&(
        <div style={{...S.card,borderLeft:"5px solid #4BBCE0",marginBottom:16}}>
          <div style={{fontWeight:800,color:"#2A96BC",fontSize:13,marginBottom:10}}>ðŸ“Š Resumen de maestros Â· {selClase}</div>
          {maestrosClase.map(m=>{
            const vs=videos.filter(v=>v.maestro===m&&v.grupo===selClase);
            const hechos=vs.filter(v=>v.hizo).length;
            const avg=videoAvgForMaestro(m,videos.filter(v=>v.grupo===selClase),maestros);
            const mo=maestros.find(x=>x.nombre===m);
            return(
              <div key={m} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:"1px solid #EEE8FF"}}>
                {mo?.foto?<img src={mo.foto} alt="" style={{width:36,height:36,borderRadius:"50%",objectFit:"cover",border:"2px solid "+CLASE_COLORS[selClase]+"44",flexShrink:0}}/>:<div style={{width:36,height:36,borderRadius:"50%",background:CLASE_COLORS[selClase]+"33",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,color:CLASE_COLORS[selClase],fontSize:12,flexShrink:0}}>{getInitials(m)}</div>}
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:13}}>{displayMaestroNombre(m)}</div>
                  <div style={{fontSize:11,color:"#7B6B9A"}}>{hechos} de {vs.length} videos enviados</div>
                </div>
                {avg!=null&&(
                  <div style={{textAlign:"center",background:"#4BBCE020",borderRadius:10,padding:"6px 12px"}}>
                    <div style={{fontWeight:900,color:"#2A96BC",fontSize:16}}>{avg.toFixed(1)}</div>
                    <div style={{fontSize:9,color:"#7B6B9A"}}>SCORE</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Lista de sesiones */}
      {sesionesFiltradas.length===0&&(
        <div style={{textAlign:"center",padding:"40px 20px",color:"#7B6B9A",fontSize:14}}>
          No hay sesiones programadas para {selClase} aÃºn.
        </div>
      )}
      {sesionesFiltradas.map(ses=>{
        const v=getVideo(ses.id,ses.maestro);
        const score=v?videoScore(v):null;
        const scoreColor=score==null?"#7B6B9A":score>=4?"#4CAF50":score>=2.5?"#F5A623":"#EF5350";
        return(
          <div key={ses.id} style={{...S.card,borderLeft:`5px solid ${v?scoreColor:"#DDD0F0"}`}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
              {(()=>{const mo=maestros.find(x=>x.nombre===ses.maestro);return mo?.foto?<img src={mo.foto} alt="" style={{width:36,height:36,borderRadius:"50%",objectFit:"cover",border:"2px solid #5B2D8E44",flexShrink:0}}/>:<div style={{width:36,height:36,borderRadius:"50%",background:"#5B2D8E22",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:12,color:"#5B2D8E",flexShrink:0}}>{getInitials(ses.maestro)}</div>;})()}
              <div style={{flex:1}}>
                <div style={{fontWeight:800,fontSize:14}}>{ses.leccion}</div>
                {ses.tema&&<div style={{fontSize:12,color:"#7B6B9A"}}>{ses.tema}</div>}
                <div style={{fontSize:11,color:"#7B6B9A",marginTop:2}}>ðŸ“… {ses.fecha} Â· ðŸŽ“ {displayMaestroNombre(ses.maestro)}</div>
              </div>
              <button style={{...S.btn("#4BBCE0"),padding:"8px 13px",fontSize:13}} onClick={()=>openEdit(ses)}>
                {v?"âœï¸":"ðŸ“‹"}
              </button>
            </div>
            {v?(
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <span style={{...S.badge(v.hizo?"#4CAF50":"#EF5350"),fontSize:11}}>{v.hizo?"âœ… Video enviado":"âŒ No enviado"}</span>
                {v.hizo&&<span style={{...S.badge("#F5C842"),fontSize:11}}>â­ Calidad: {v.calidad}/5</span>}
                {v.hizo&&<span style={{...S.badge(v.aTiempo?"#4CAF50":"#FF7043"),fontSize:11}}>{v.aTiempo?"â° A tiempo":"â± Tarde"}</span>}
                {score!=null&&<span style={{...S.badge(scoreColor),fontSize:11}}>ðŸŽ¯ Score: {score.toFixed(1)}/5</span>}
              </div>
            ):(
              <div style={{fontSize:12,color:"#7B6B9A",fontStyle:"italic"}}>Sin calificar Â· Toca ðŸ“‹ para evaluar</div>
            )}
          </div>
        );
      })}

      {/* Modal editar/calificar video */}
      <Modal open={editModal} onClose={()=>setEditModal(false)} title="ðŸŽ¬ Calificar Video">
        {editVideo&&(
          <div>
            <div style={{background:"#F5F0FF",borderRadius:12,padding:"12px 14px",marginBottom:16,display:"flex",alignItems:"center",gap:12}}>
              {(()=>{const mo=maestros.find(x=>x.nombre===editVideo.maestro);return mo?.foto?<img src={mo.foto} alt="" style={{width:44,height:44,borderRadius:"50%",objectFit:"cover",border:"2px solid #5B2D8E44",flexShrink:0}}/>:<div style={{width:44,height:44,borderRadius:"50%",background:"#5B2D8E22",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:16,color:"#5B2D8E",flexShrink:0}}>{getInitials(editVideo.maestro)}</div>;})()}
              <div>
                <div style={{fontWeight:800,color:"#5B2D8E"}}>{editVideo.leccion}</div>
                <div style={{fontSize:12,color:"#7B6B9A",marginTop:2}}>ðŸ“… {editVideo.fecha} Â· ðŸŽ“ {displayMaestroNombre(editVideo.maestro)}</div>
              </div>
            </div>

            {/* Â¿Hizo el video? */}
            <label style={S.label}>Â¿El maestro enviÃ³ el video?</label>
            <div style={{display:"flex",gap:10,marginBottom:16}}>
              {[[true,"âœ… SÃ­, lo enviÃ³","#4CAF50"],[false,"âŒ No lo enviÃ³","#EF5350"]].map(([val,lbl,col])=>(
                <button key={String(val)} onClick={()=>setEditVideo(v=>({...v,hizo:val}))}
                  style={{flex:1,padding:"12px 8px",borderRadius:12,border:`2px solid ${editVideo.hizo===val?col:"#DDD0F0"}`,background:editVideo.hizo===val?col+"22":"#F5F0FF",color:editVideo.hizo===val?col:"#7B6B9A",fontWeight:700,cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>
                  {lbl}
                </button>
              ))}
            </div>

            {editVideo.hizo&&(
              <>
                {/* Calidad del video */}
                <label style={S.label}>â­ Calidad del video (1â€“5)</label>
                <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:16}}>
                  {[1,2,3,4,5].map(s=>(
                    <button key={s} onClick={()=>setEditVideo(v=>({...v,calidad:s}))}
                      style={{width:46,height:46,borderRadius:12,border:`2px solid ${editVideo.calidad===s?"#F5C842":"#DDD0F0"}`,background:editVideo.calidad===s?"#5B2D8E":"#F5F0FF",color:editVideo.calidad===s?"#F5C842":"#7B6B9A",fontWeight:900,cursor:"pointer",fontSize:22,fontFamily:"inherit"}}>â˜…</button>
                  ))}
                </div>

                {/* Â¿A tiempo? */}
                <label style={S.label}>â° Â¿Lo enviÃ³ a tiempo?</label>
                <div style={{display:"flex",gap:10,marginBottom:20}}>
                  {[[true,"â° SÃ­, a tiempo","#4CAF50"],[false,"â± No, tarde","#FF7043"]].map(([val,lbl,col])=>(
                    <button key={String(val)} onClick={()=>setEditVideo(v=>({...v,aTiempo:val}))}
                      style={{flex:1,padding:"12px 8px",borderRadius:12,border:`2px solid ${editVideo.aTiempo===val?col:"#DDD0F0"}`,background:editVideo.aTiempo===val?col+"22":"#F5F0FF",color:editVideo.aTiempo===val?col:"#7B6B9A",fontWeight:700,cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>
                      {lbl}
                    </button>
                  ))}
                </div>

                {/* Preview del score calculado */}
                <div style={{background:"linear-gradient(135deg,#4BBCE015,#5B2D8E15)",borderRadius:12,padding:"0.75rem 1rem",marginBottom:16,textAlign:"center"}}>
                  <div style={{fontSize:12,color:"#7B6B9A",marginBottom:4}}>Score calculado para este video</div>
                  <div style={{fontSize:28,fontWeight:900,color:"#5B2D8E"}}>{videoScore(editVideo).toFixed(1)}<span style={{fontSize:14,color:"#7B6B9A"}}>/5</span></div>
                  <div style={{fontSize:11,color:"#7B6B9A",marginTop:4}}>Este score afecta el 20% del promedio de evaluaciÃ³n</div>
                </div>
              </>
            )}

            <button style={{...S.btn("#5B2D8E","#FFFFFF",true),padding:14}} onClick={saveVideo}>ðŸ’¾ Guardar CalificaciÃ³n</button>
          </div>
        )}
      </Modal>
    </div>
  );
}

// â•â•â•â•â•â•â•â•â•â• EVENTOS PANEL â•â•â•â•â•â•â•â•â•â•
function EventosPanel({eventos,onUpdate,readOnly=false}){
  const[modal,setModal]=useState(false);
  const[form,setForm]=useState({fecha:"",tipo:"LOCAL",nombre:""});
  const[editId,setEditId]=useState(null);
  const openAdd=()=>{setForm({fecha:"",tipo:"LOCAL",nombre:""});setEditId(null);setModal(true);};
  const openEdit=(e)=>{setForm({...e});setEditId(e.id);setModal(true);};
  const save=()=>{if(editId)onUpdate(eventos.map(e=>e.id===editId?{...form,id:editId}:e));else onUpdate([...eventos,{...form,id:Date.now()}]);setModal(false);};
  // â”€â”€ Detect past events (cumplidos)
  const isCumplido=(fechaStr)=>{
    if(!fechaStr)return false;
    // Try DD/MM/AAAA or DD/MM/YYYY
    const m=fechaStr.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/);
    if(!m)return false;
    const day=parseInt(m[1]),month=parseInt(m[2])-1,year=m[3]?parseInt(m[3]):new Date().getFullYear();
    const d=new Date(year,month,day);
    return d<new Date(new Date().toDateString()); // before today (midnight)
  };
  return(
    <div style={{padding:"1rem 1rem 6.25rem"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <h2 style={S.title}>Eventos</h2>
        {!readOnly&&<button style={{...S.btn("#5B2D8E"),padding:"10px 16px",fontSize:14}} onClick={openAdd}>+ Agregar</button>}
      </div>
      {["NACIONAL","LOCAL"].map(tipo=>(
        <div key={tipo} style={{...S.card,borderTop:`5px solid ${tipo==="NACIONAL"?"#5B2D8E":"#4BBCE0"}`}}>
          <h3 style={{color:tipo==="NACIONAL"?"#5B2D8E":"#2A96BC",fontWeight:800,marginBottom:14,fontSize:15}}>{tipo==="NACIONAL"?"ðŸŒ Nacionales / Distritales":"ðŸ  Eventos Locales"}</h3>
          {eventos.filter(e=>e.tipo===tipo).map((e)=>{
            const cumplido=isCumplido(e.fecha);
            return(
              <div key={e.id} style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:12,paddingBottom:12,borderBottom:"1px solid #DDD0F0",opacity:cumplido?0.7:1}}>
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,flexShrink:0}}>
                  <div style={{background:(tipo==="NACIONAL"?"#5B2D8E":"#4BBCE0")+"22",borderRadius:10,padding:"6px 10px",fontSize:11,fontWeight:800,color:tipo==="NACIONAL"?"#5B2D8E":"#2A96BC",minWidth:64,textAlign:"center"}}>{e.fecha}</div>
                  {cumplido&&<span style={{background:"#4CAF5022",color:"#2E7D32",borderRadius:8,padding:"2px 8px",fontSize:10,fontWeight:800}}>âœ… Cumplido</span>}
                </div>
                <div style={{flex:1,fontWeight:600,fontSize:13,textDecoration:cumplido?"line-through":undefined,color:cumplido?"#7B6B9A":undefined}}>{e.nombre}</div>
                {!readOnly&&(
                  <button style={{...S.btn("#4BBCE0"),padding:"5px 9px",fontSize:12}} onClick={()=>openEdit(e)}>âœï¸</button>
                )}
              </div>
            );
          })}
        </div>
      ))}
      {!readOnly&&(
        <Modal open={modal} onClose={()=>setModal(false)} title={editId?"Editar Evento":"Nuevo Evento"}>
          <label style={S.label}>Nombre</label><input style={{...S.input,marginBottom:12}} value={form.nombre} onChange={e=>setForm(f=>({...f,nombre:e.target.value}))}/>
          <label style={S.label}>Fecha</label><input style={{...S.input,marginBottom:12}} value={form.fecha} onChange={e=>setForm(f=>({...f,fecha:e.target.value}))} placeholder="DD/MM/AAAA"/>
          <label style={S.label}>Tipo</label>
          <select style={{...S.input,marginBottom:14}} value={form.tipo} onChange={e=>setForm(f=>({...f,tipo:e.target.value}))}><option value="LOCAL">Local</option><option value="NACIONAL">Nacional / Distrital</option></select>
          <button style={{...S.btn("#5B2D8E","#FFFFFF",true),padding:14}} onClick={save}>ðŸ’¾ Guardar</button>
          {editId&&<button style={{...S.btn("#FFF0F0","#EF5350"),padding:12,marginTop:10,border:"1.5px solid #EF535044"}} onClick={()=>{if(confirmDelete("Â¿Eliminar el evento: "+form.nombre+"?")){onUpdate(eventos.filter(ev=>ev.id!==editId));setModal(false);}}}>ðŸ—‘ Eliminar Evento</button>}
        </Modal>
      )}
    </div>
  );
}

// â•â•â•â•â•â•â•â•â•â• CUMPLEAÃ‘OS PANEL â•â•â•â•â•â•â•â•â•â•
function CumpleanosPanel({maestros,familias}){
  const months=["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const mColors=["#4BBCE0","#5B2D8E","#E84F9B","#F5C842","#2A96BC","#E84F9B","#5B2D8E","#4BBCE0","#F5C842","#E84F9B","#7B4DB2","#4BBCE0"];
  const ordenCategoria=(b)=>(b.categoria==="alumno"?0:b.tipo==="MAESTRO"?1:2);
  const all=[
    ...maestros.filter(m=>m.cumpleanos).map(m=>({nombre:displayMaestroNombre(m.nombre),fecha:m.cumpleanos,tipo:m.cargo,categoria:"maestro",clase:m.clase,foto:m.foto||null,iniciales:getInitials(m.nombre),diff:diasHastaCumple(m.cumpleanos)})),
    ...familias.filter(f=>f.cumpleanos).map(f=>({nombre:shortDisplayName(f.alumno),fecha:f.cumpleanos,tipo:"ALUMNO",clase:f.clase,categoria:"alumno",foto:f.foto||null,iniciales:getInitials(f.alumno),diff:diasHastaCumple(f.cumpleanos)})),
  ].sort((a,b)=>{
    const da=a.diff!=null?a.diff:9999;
    const db=b.diff!=null?b.diff:9999;
    if(da!==db)return da-db;
    const oa=ordenCategoria(a),ob=ordenCategoria(b);
    if(oa!==ob)return oa-ob;
    const[ad,am]=a.fecha.split("/").map(Number);
    const[bd,bm]=b.fecha.split("/").map(Number);
    return am-bm||ad-bd;
  });
  const byMonth={};
  all.forEach(b=>{const m=parseInt(b.fecha.split("/")[1])-1;if(!byMonth[m])byMonth[m]=[];byMonth[m].push(b);});
  const thumb=(b,color)=>(b.foto?<img src={b.foto} alt="" style={{width:40,height:40,borderRadius:"50%",objectFit:"cover",border:`2px solid ${color}44`,flexShrink:0}}/>:<div style={{width:40,height:40,borderRadius:"50%",background:color+"33",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:14,color,flexShrink:0}}>{b.iniciales||"?"}</div>);
  return(
    <div style={{padding:"1rem 1rem 6.25rem"}}>
      <h2 style={S.title}>CumpleaÃ±os</h2>
      <BirthdayBanner maestros={maestros} familias={familias}/>
      {months.map((month,mi)=>{const list=byMonth[mi]||[];if(!list.length)return null;
        return(
          <div key={mi} style={{...S.card,borderTop:`5px solid ${mColors[mi]}`}}>
            <div style={{fontWeight:800,color:mColors[mi],marginBottom:10,fontSize:15}}>ðŸ“… {month} ({list.length})</div>
            {list.map((b,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8,padding:"8px 10px",background:"#F5F0FF",borderRadius:10}}>
                {thumb(b,b.categoria==="maestro"?"#5B2D8E":(CLASE_COLORS[b.clase]||"#4BBCE0"))}
                <span style={{fontSize:20}}>ðŸŽ‚</span>
                <div style={{flex:1}}><div style={{fontWeight:700,fontSize:13}}>{b.nombre}</div><div style={{fontSize:11,color:"#7B6B9A"}}>{b.tipo}{b.clase&&b.categoria==="alumno"?" Â· "+b.clase:""}</div></div>
                <div style={{textAlign:"right"}}><span style={{fontWeight:800,fontSize:13,color:"#5B2D8E",display:"block"}}>{b.fecha}</span>{b.diff!=null&&<span style={{fontSize:11,color:"#E84F9B",fontWeight:700}}>{labelDiasFaltan(b.diff)}</span>}</div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}


// â”€â”€ Sub-componente: badges de merienda/taller por sesiÃ³n â”€â”€
function MeriendaBadges({ses, meriendas, openSesModal}) {
  const m = meriendas.find(x => x.sesionId === ses.id);
  const totalSes = (parseFloat(m?.meriendaCosto) || 0) + (parseFloat(m?.trabajoManualCosto) || 0);
  const merDonativo = m?.meriendaDonativo;
  const tmDonativo = m?.trabajoManualDonativo;
  return (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:6}}>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {m?.merienda && <span style={{...S.badge("#4BBCE0"),fontSize:11}}>ðŸŽ Merienda{m.meriendaCosto?" Â· â‚¬"+m.meriendaCosto:""}{merDonativo?" ðŸŽ donativo":""}</span>}
        {m?.trabajoManual && <span style={{...S.badge("#E84F9B"),fontSize:11}}>âœ‚ï¸ T.Manual{m.trabajoManualCosto?" Â· â‚¬"+m.trabajoManualCosto:""}{tmDonativo?" ðŸŽ donativo":""}</span>}
        {totalSes>0 && <span style={{...S.badge("#4CAF50"),fontSize:11}}>ðŸ’° Total: â‚¬{totalSes.toFixed(2)}</span>}
      </div>
      <button style={{...S.btn("#2A96BC"),padding:"5px 12px",fontSize:12,flexShrink:0}} onClick={()=>openSesModal(ses)}>ðŸ“‹ {m?"Ver sesiÃ³n":"Datos sesiÃ³n"}</button>
    </div>
  );
}

function TeacherFinanzasPanel({user,data}){
  const meriendas=data.meriendas||[];
  const cronograma=data.cronograma||[];
  const maestros=data.maestros||[];
  const miMaestro=maestros.find(m=>sameTeacherName(m.nombre,user.name))||{};
  const miClase=miMaestro.clase;
  const registros=meriendas.filter(m=>m.clase===miClase&&sameTeacherName(m.maestro,user.name));
  const totalClase=registros.reduce((s,m)=>
    s+(parseFloat(m.meriendaCosto)||0)+(parseFloat(m.trabajoManualCosto)||0)
  ,0);
  const filas=registros
    .map(m=>{
      const ses=cronograma.find(c=>c.id===m.sesionId)||{};
      const fecha=ses.fecha?formatFecha(ses.fecha):"â€”";
      const leccion=ses.leccion||"â€”";
      const merCost=parseFloat(m.meriendaCosto)||0;
      const tmCost=parseFloat(m.trabajoManualCosto)||0;
      const total=merCost+tmCost;
      return{m,fecha,leccion,merCost,tmCost,total};
    })
    .sort((a,b)=>(b.fecha||"").localeCompare(a.fecha||""));
  return(
    <div>
      <h2 style={S.title}>ðŸ’° Mis gastos de clase</h2>
      <div style={{...S.card,marginBottom:14}}>
        <div style={{fontSize:13,color:"#7B6B9A",marginBottom:8}}>
          Solo ves los <strong>gastos registrados como maestro</strong> en tu clase {miClase}.
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
          <div>
            <div style={{fontSize:11,color:"#7B6B9A"}}>Total gastado en el perÃ­odo</div>
            <div style={{fontSize:22,fontWeight:900,color:"#2E7D32"}}>â‚¬{totalClase.toFixed(2)}</div>
          </div>
          <div>
            <div style={{fontSize:11,color:"#7B6B9A"}}>Registros</div>
            <div style={{fontSize:18,fontWeight:800,color:"#5B2D8E"}}>{filas.length}</div>
          </div>
        </div>
      </div>
      {filas.length===0&&(
        <div style={{...S.card,fontSize:13,color:"#7B6B9A",fontStyle:"italic"}}>
          No hay gastos registrados todavÃ­a para tu clase.
        </div>
      )}
      {filas.length>0&&(
        <div style={S.card}>
          <div style={{fontWeight:800,fontSize:14,marginBottom:8,color:"#5B2D8E"}}>Detalle por sesiÃ³n</div>
          {filas.map((row,i)=>(
            <div key={row.m.sesionId||i} style={{padding:"8px 0",borderBottom:i<filas.length-1?"1px solid #EEE8FF":"none",display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,color:"#7B6B9A"}}>{row.fecha} Â· {miClase}</div>
                <div style={{fontWeight:700,fontSize:13,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{row.leccion}</div>
                <div style={{fontSize:11,color:"#7B6B9A",marginTop:2}}>
                  {row.m.merienda&&`ðŸŽ ${row.m.merienda}${row.meriCost>0?` Â· â‚¬${row.meriCost.toFixed(2)}`:""}`}
                  {(row.m.merienda&&row.tmCost>0)?" Â· ":""}
                  {row.m.trabajoManual&&`âœ‚ï¸ ${row.m.trabajoManual}${row.tmCost>0?` Â· â‚¬${row.tmCost.toFixed(2)}`:""}`}
                </div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontSize:11,color:"#7B6B9A"}}>Total</div>
                <div style={{fontWeight:800,fontSize:15,color:"#2E7D32"}}>â‚¬{row.total.toFixed(2)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// â”€â”€ Sub-componente: observaciones anteriores de un alumno â”€â”€
function PrevObsSection({selNino, calificaciones, miClase, selSes}) {
  if (!selNino) return null;
  const prevObs = calificaciones
    .filter(c => c.alumno === selNino.nombre && c.clase === miClase && c.observacion && c.sesionId !== selSes?.id)
    .sort((a,b) => (b.fecha||"").localeCompare(a.fecha||""))
    .slice(0, 3);
  if (!prevObs.length) return null;
  return (
    <div style={{background:"linear-gradient(135deg,#F5C84210,#F5C84225)",border:"1.5px solid #F5C84255",borderRadius:12,padding:"10px 14px",marginBottom:16}}>
      <div style={{fontWeight:800,color:"#7B5A00",fontSize:12,letterSpacing:0.5,marginBottom:8}}>ðŸ’¬ OBSERVACIONES ANTERIORES</div>
      {prevObs.map((obs,i) => (
        <div key={obs.id||i} style={{marginBottom:i<prevObs.length-1?10:0,paddingBottom:i<prevObs.length-1?10:0,borderBottom:i<prevObs.length-1?"1px dashed #F5C84255":"none"}}>
          <div style={{display:"flex",gap:6,marginBottom:3,flexWrap:"wrap"}}>
            <span style={{fontSize:11,fontWeight:800,color:"#5B2D8E",background:"#5B2D8E15",borderRadius:6,padding:"2px 6px"}}>{obs.leccion||"SesiÃ³n"}</span>
            <span style={{fontSize:11,color:"#7B6B9A"}}>ðŸ“… {formatFecha(obs.fecha)}</span>
            {obs.quienObservacion&&<span style={{fontSize:11,color:"#7B6B9A"}}>Â· por {displayMaestroNombre(obs.quienObservacion)}</span>}
          </div>
          <div style={{fontSize:12,color:"#2D1B4E",lineHeight:1.5,background:"#FFFFFFAA",borderRadius:8,padding:"6px 10px"}}>{obs.observacion}</div>
        </div>
      ))}
    </div>
  );
}

// â•â•â•â•â•â•â•â•â•â• TEACHER CALIFICACIONES â•â•â•â•â•â•â•â•â•â•
function TeacherCalif({user,data,onUpdateCalif,onUpdateMerienda}){
  const{calificaciones,cronograma,clases,maestros,meriendas=[]}=data;
  const criterios=data.criterios||CRITERIOS;
  const teacherInfo=maestros.find(m=>sameTeacherName(m.nombre,user.name))||{};
  const miClase=teacherInfo.clase;
  const misNinos=(clases[miClase]||[]).slice().sort((a,b)=>sortKeyFirstName(a.nombre).localeCompare(sortKeyFirstName(b.nombre),"es"));
  const misSesiones=cronograma.filter(c=>(sameTeacherName(c.maestro,user.name)||sameTeacherName(c.auxiliar,user.name))&&c.leccion&&c.leccion!=="NO HAY CLASE"&&c.leccion!=="DIA DEL PADRE");
  const[modal,setModal]=useState(false);
  const[form,setForm]=useState({});
  const[selNino,setSelNino]=useState(null);
  const[selSes,setSelSes]=useState(null);
  const observacionRef=useRef(null);
  useEffect(()=>{ if(modal){ const t=setTimeout(()=>{observacionRef.current?.focus();},100); return ()=>clearTimeout(t); } },[modal]);
  const open=(nino,ses)=>{
    const ex=calificaciones.find(c=>c.alumno===nino.nombre&&c.clase===miClase&&c.sesionId===ses.id)||{};
    setForm({alumno:nino.nombre,clase:miClase,sesionId:ses.id,fecha:ses.fecha,grupo:ses.grupo,leccion:ses.leccion,
      valores:ex.valores||"",conocimiento:ex.conocimiento||"",oracion:ex.oracion||"",servicio:ex.servicio||"",
      respeto:ex.respeto||"",participacion:ex.participacion||"",comportamiento:ex.comportamiento||"",
      merienda:ex.merienda||false,meriendaCosto:ex.meriendaCosto||"",trabajoManual:ex.trabajoManual||false,observacion:ex.observacion||"",
      quienCalifico:ex.quienCalifico||"",fechaCalificacion:ex.fechaCalificacion||"",quienObservacion:ex.quienObservacion||"",fechaObservacion:ex.fechaObservacion||""});
    setSelNino(nino);setSelSes(ses);setModal(true);
  };
  const mergeOrCreate=(payload)=>{
    const ex=calificaciones.find(c=>c.alumno===form.alumno&&c.clase===miClase&&c.sesionId===form.sesionId);
    const full={...(ex||{alumno:form.alumno,clase:miClase,sesionId:form.sesionId,fecha:form.fecha,grupo:form.grupo,leccion:form.leccion,id:Date.now()}),...payload};
    onUpdateCalif(ex?calificaciones.map(c=>c.alumno===form.alumno&&c.clase===miClase&&c.sesionId===form.sesionId?full:c):[...calificaciones,full]);
  };
  const saveSoloCalificacion=()=>{
    const ahora=new Date().toISOString();
    const payload={
      valores:form.valores,conocimiento:form.conocimiento,oracion:form.oracion,servicio:form.servicio,
      respeto:form.respeto,participacion:form.participacion,comportamiento:form.comportamiento,
      merienda:form.merienda,meriendaCosto:form.meriendaCosto||"",trabajoManual:form.trabajoManual,
      quienCalifico:user.name,fechaCalificacion:ahora,
    };
    mergeOrCreate(payload);
    setForm(f=>({...f,quienCalifico:user.name,fechaCalificacion:ahora}));
  };
  const saveSoloObservacion=()=>{
    const ahora=new Date().toISOString();
    const payload={observacion:(form.observacion||"").trim(),quienObservacion:user.name,fechaObservacion:ahora};
    mergeOrCreate(payload);
    setForm(f=>({...f,quienObservacion:user.name,fechaObservacion:ahora}));
  };
  // Session data (merienda/trabajo manual)
  const[sesModal,setSesModal]=useState(false);
  const[sesData,setSesData]=useState({});
  const[sesSesId,setSesSesId]=useState(null);
  const openSesModal=(ses)=>{
    const ex=meriendas.find(m=>m.sesionId===ses.id)||{};
    setSesData({merienda:ex.merienda||false,meriendaCosto:ex.meriendaCosto||"",meriendaFecha:ex.meriendaFecha||"",meriendaDonativo:!!ex.meriendaDonativo,trabajoManual:ex.trabajoManual||false,trabajoManualCosto:ex.trabajoManualCosto||"",trabajoManualDonativo:!!ex.trabajoManualDonativo});
    setSesSesId(ses.id);
    setSesModal(true);
  };
  const saveSesData=(ses)=>{
    const mData={sesionId:sesSesId,fecha:ses?.fecha||"",clase:miClase,maestro:user.name,...sesData};
    const existingM=meriendas.find(m=>m.sesionId===sesSesId);
    const newMeriendas=existingM?meriendas.map(m=>m.sesionId===sesSesId?mData:m):[...meriendas,mData];
    if(onUpdateMerienda)onUpdateMerienda(newMeriendas);
    setSesModal(false);
  };
  const getSesAvg=(alumno,sesId)=>{
    const e=calificaciones.find(c=>c.alumno===alumno&&c.clase===miClase&&c.sesionId===sesId);if(!e)return null;
    const vals=criterios.map(c=>parseFloat(e[c.key])).filter(v=>!isNaN(v));
    return vals.length?(vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1):null;
  };
  const resetCalifSesion=(ses)=>{
    if(!confirmDelete("Â¿Resetear todas las calificaciones de esta sesiÃ³n? Los alumnos quedarÃ¡n como ausentes y podrÃ¡s volver a calificar."))return;
    const nuevas=calificaciones.filter(c=>!(c.clase===miClase&&c.sesionId===ses.id));
    onUpdateCalif(nuevas);
  };
  const borrarCalifAlumno=()=>{
    if(!selNino||!selSes)return;
    if(!confirmDelete("Â¿Borrar la calificaciÃ³n de "+shortDisplayName(selNino.nombre)+" en esta sesiÃ³n? QuedarÃ¡ como ausente."))return;
    const nuevas=calificaciones.filter(c=>!(c.alumno===selNino.nombre&&c.clase===miClase&&c.sesionId===selSes.id));
    onUpdateCalif(nuevas);
    setModal(false);
  };
  return(
    <div style={{padding:"1rem 1rem 6.25rem"}}>
      <h2 style={S.title}>Calificaciones â€” {miClase}</h2>
      {misSesiones.length===0&&<div style={{color:"#7B6B9A",textAlign:"center",padding:40}}>Sin sesiones asignadas.</div>}
      {misSesiones.map(ses=>(
        <div key={ses.id} style={{...S.card,borderLeft:`5px solid ${CLASE_COLORS[ses.grupo]||"#5B2D8E"}`}}>
          <div style={{fontWeight:800,color:CLASE_COLORS[ses.grupo]||"#5B2D8E",marginBottom:4}}>{formatFecha(ses.fecha)} â€” {ses.leccion}</div>
          <div style={{fontSize:12,color:"#7B6B9A",marginBottom:6}}>{ses.tema}</div>
          <MeriendaBadges ses={ses} meriendas={meriendas} openSesModal={openSesModal}/>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,flexWrap:"wrap",gap:8}}>
            <div style={{fontSize:11,fontWeight:700,color:"#7B6B9A",letterSpacing:0.5}}>ASISTENCIA AUTOMÃTICA</div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:11,color:"#7B6B9A"}}>{calificaciones.filter(c=>c.clase===miClase&&c.sesionId===ses.id).length}/{misNinos.length} asistieron</span>
              {calificaciones.some(c=>c.clase===miClase&&c.sesionId===ses.id)&&(
                <button style={{...S.btn("#FFF0E6","#C62828"),padding:"5px 10px",fontSize:11}} onClick={()=>resetCalifSesion(ses)} title="Borrar todas las calificaciones de esta sesiÃ³n para poder volver a calificar">ðŸ”„ Resetear</button>
              )}
            </div>
          </div>
          {misNinos.map(n=>{
            const avg=getSesAvg(n.nombre,ses.id);
            const calif=calificaciones.find(c=>c.alumno===n.nombre&&c.clase===miClase&&c.sesionId===ses.id);
            const asistio=!!calif;
            return(
              <div key={n.nombre||n.id} style={{display:"flex",alignItems:"center",gap:10,paddingBottom:10,marginBottom:10,borderBottom:"1px solid #DDD0F0",opacity:asistio?1:0.55}}>
                {n.foto
                  ?<img src={n.foto} alt="" style={{width:36,height:36,borderRadius:"50%",objectFit:"cover",border:`2px solid ${asistio?(CLASE_COLORS[miClase]||"#5B2D8E"):"#CCC"}`,flexShrink:0}}/>
                  :<div style={{width:36,height:36,borderRadius:"50%",background:(asistio?(CLASE_COLORS[miClase]||"#5B2D8E"):"#CCC")+"33",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:12,color:asistio?(CLASE_COLORS[miClase]||"#5B2D8E"):"#999",flexShrink:0}}>{getInitials(n.nombre)}</div>
                }
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:13}}>{displayNameAlumno(n)}</div>
                  {avg?<div style={{fontSize:12,color:scoreColor(avg),fontWeight:700}}>Prom: {avg}</div>:<div style={{fontSize:12,color:"#7B6B9A",fontStyle:"italic"}}>Sin calificar â€” ausente</div>}
                  {calif?.observacion&&<div style={{fontSize:11,color:"#7B6B9A"}}>ðŸ’¬ {calif.observacion.slice(0,50)}{calif.observacion.length>50?"...":""}</div>}
                </div>
                <button style={{...S.btn(calif?"#4BBCE0":"#5B2D8E","#FFFFFF"),padding:"8px 13px",fontSize:calif?13:18,fontWeight:900,borderRadius:12}} onClick={()=>open(n,ses)}>{calif?"âœï¸":"+"}</button>
              </div>
            );
          })}
        </div>
      ))}
      <Modal open={sesModal} onClose={()=>setSesModal(false)} title="ðŸ“‹ Datos de la SesiÃ³n">
        <div style={{background:"#F0FBFF",borderRadius:12,padding:"12px 14px",marginBottom:14,fontSize:13,color:"#2A96BC",fontWeight:600}}>Estos datos son de la clase en general, no del alumno individual.</div>
        <div style={{marginBottom:16}}>
          <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",padding:"12px 14px",background:"#F5F0FF",borderRadius:12,marginBottom:10}}>
            <input type="checkbox" checked={!!sesData.merienda} onChange={e=>setSesData(d=>({...d,merienda:e.target.checked}))} style={{width:22,height:22,accentColor:"#4BBCE0"}}/>
            <div><div style={{fontWeight:700,fontSize:14}}>ðŸŽ Â¿LlevÃ³ merienda?</div></div>
          </label>
          {sesData.merienda&&(
            <div style={{marginBottom:10}}>
              <label style={S.label}>ðŸ’° Costo merienda (â‚¬)</label>
              <input type="number" step="0.01" min="0" style={{...S.input,padding:"10px 12px"}} value={sesData.meriendaCosto||""} onChange={e=>setSesData(d=>({...d,meriendaCosto:e.target.value}))} placeholder="0.00"/>
              <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",marginTop:8,fontSize:13,color:"#5B2D8E"}}>
                <input type="checkbox" checked={!!sesData.meriendaDonativo} onChange={e=>setSesData(d=>({...d,meriendaDonativo:e.target.checked}))} style={{width:20,height:20,accentColor:"#5B2D8E"}}/>
                <span>ðŸŽ Marcar como donativo</span>
              </label>
            </div>
          )}
          <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",padding:"12px 14px",background:"#FFF0F8",borderRadius:12,marginBottom:10}}>
            <input type="checkbox" checked={!!sesData.trabajoManual} onChange={e=>setSesData(d=>({...d,trabajoManual:e.target.checked}))} style={{width:22,height:22,accentColor:"#E84F9B"}}/>
            <div><div style={{fontWeight:700,fontSize:14}}>âœ‚ï¸ Â¿UsÃ³ trabajo manual?</div></div>
          </label>
          {sesData.trabajoManual&&(
            <div style={{marginBottom:6}}>
              <label style={S.label}>ðŸ’° Costo trabajo manual (â‚¬)</label>
              <input type="number" step="0.01" min="0" style={{...S.input,padding:"10px 12px"}} value={sesData.trabajoManualCosto||""} onChange={e=>setSesData(d=>({...d,trabajoManualCosto:e.target.value}))} placeholder="0.00"/>
              <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",marginTop:8,fontSize:13,color:"#5B2D8E"}}>
                <input type="checkbox" checked={!!sesData.trabajoManualDonativo} onChange={e=>setSesData(d=>({...d,trabajoManualDonativo:e.target.checked}))} style={{width:20,height:20,accentColor:"#5B2D8E"}}/>
                <span>ðŸŽ Marcar como donativo</span>
              </label>
            </div>
          )}
          {(sesData.merienda||sesData.trabajoManual)&&(
            <div style={{background:"linear-gradient(135deg,#4CAF5020,#4CAF5035)",border:"2px solid #4CAF5055",borderRadius:14,padding:"14px",marginTop:10,textAlign:"center"}}>
              <div style={{fontSize:12,color:"#7B6B9A",marginBottom:4}}>GASTO TOTAL DE LA SESIÃ“N</div>
              <div style={{fontSize:28,fontWeight:900,color:"#2E7D32"}}>â‚¬{((parseFloat(sesData.meriendaCosto)||0)+(parseFloat(sesData.trabajoManualCosto)||0)).toFixed(2)}</div>
            </div>
          )}
        </div>
        <button style={{...S.btn("#2A96BC","#FFFFFF",true),padding:14}} onClick={()=>saveSesData(misSesiones.find(s=>s.id===sesSesId))}>ðŸ’¾ Guardar Datos de SesiÃ³n</button>
      </Modal>
      <Modal open={modal} onClose={()=>setModal(false)} title={`Calificar: ${selNino?shortDisplayName(selNino.nombre):""}`}>
        {selSes&&<div style={{background:"#F5F0FF",borderRadius:12,padding:"10px 14px",marginBottom:16}}>
          <div style={{fontWeight:700,color:"#5B2D8E"}}>{selSes.leccion} â€” {selSes.tema}</div>
          <div style={{fontSize:12,color:"#7B6B9A"}}>{formatFecha(selSes.fecha)} Â· {miClase}</div>
        </div>}
        {/* Previous observations for this student */}
        <PrevObsSection selNino={selNino} calificaciones={calificaciones} miClase={miClase} selSes={selSes}/>
        {criterios.map(c=>(
          <div key={c.key} style={{marginBottom:16}}>
            <label style={S.label}>{c.logro} (1â€“5) â€” <span style={{fontWeight:400}}>{c.item}</span></label>
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
              {[1,2,3,4,5].map(v=>(
                <button key={v} onClick={()=>setForm(f=>({...f,[c.key]:v}))}
                  style={{width:38,height:38,borderRadius:10,border:`2px solid ${form[c.key]===v?scoreColor(v):"#DDD0F0"}`,background:form[c.key]===v?scoreColor(v):"#FFFFFF",color:form[c.key]===v?"#FFFFFF":"#2D1B4E",fontWeight:800,cursor:"pointer",fontSize:14,fontFamily:"inherit"}}>{v}</button>
              ))}
            </div>
          </div>
        ))}
        {form.quienCalifico&&(
          <div style={{fontSize:11,color:"#7B6B9A",marginBottom:12}}>Calificado por: <strong>{displayMaestroNombre(form.quienCalifico)}</strong> Â· {formatCalifFecha(form.fechaCalificacion)}</div>
        )}
        <button style={{...S.btn("#5B2D8E","#FFFFFF",true),padding:12,marginBottom:16}} onClick={saveSoloCalificacion}>ðŸ’¾ Guardar calificaciÃ³n</button>

        <div style={{marginBottom:16}}>
          <label style={S.label}>ðŸ’¬ ObservaciÃ³n (opcional)</label>
          <textarea ref={observacionRef} style={{...S.input,height:80,resize:"vertical"}} value={form.observacion||""} onChange={e=>setForm(f=>({...f,observacion:e.target.value}))} placeholder="Notas sobre el alumno..."/>
          {form.quienObservacion&&(
            <div style={{fontSize:11,color:"#7B6B9A",marginTop:6}}>ObservaciÃ³n por: <strong>{displayMaestroNombre(form.quienObservacion)}</strong> Â· {formatCalifFecha(form.fechaObservacion)}</div>
          )}
        </div>
        <button style={{...S.btn("#4BBCE0","#FFFFFF",true),padding:12,marginBottom:16}} onClick={saveSoloObservacion}>ðŸ’¾ Guardar observaciÃ³n</button>

        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          {selNino&&selSes&&calificaciones.some(c=>c.alumno===selNino.nombre&&c.clase===miClase&&c.sesionId===selSes.id)&&(
            <button style={{...S.btn("#FFF0F0","#EF5350"),padding:14,border:"1.5px solid #EF535044"}} onClick={borrarCalifAlumno}>ðŸ—‘ Borrar calificaciÃ³n</button>
          )}
        </div>
      </Modal>
    </div>
  );
}

// â•â•â•â•â•â•â•â•â•â• TEACHER APP â•â•â•â•â•â•â•â•â•â•
