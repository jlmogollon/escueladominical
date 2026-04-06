const { useState, useEffect, useCallback, useRef, useMemo } = React;

function TeacherApp({user,data,onLogout,onUpdateData,teacherPasswords,onUpdatePasswords,onRefreshData}){
  const[activeTab,setActiveTab]=useState("inicio");
  const[masTab,setMasTab]=useState("evaluacion");
  const[pwForm,setPwForm]=useState({old:"",new1:"",new2:""});
  const[pwError,setPwError]=useState("");
  const[pwOk,setPwOk]=useState(false);
  const[photoSrc,setPhotoSrc]=useState(null);
  const fileRef=useRef(null);
  const[phoneModal,setPhoneModal]=useState(false);
  const[phoneForm,setPhoneForm]=useState({});
  const[phoneEditId,setPhoneEditId]=useState(null);
  const[editNinoModal,setEditNinoModal]=useState(false);
  const[editNinoForm,setEditNinoForm]=useState({});
  const[editNinoTarget,setEditNinoTarget]=useState(null);
  const openEditNino=(n)=>{setEditNinoForm({nombre:n.nombre,edad:n.edad||"",cumpleanos:n.cumpleanos||"",nacimiento:n.nacimiento||""});setEditNinoTarget(n);setEditNinoModal(true);};
  const saveEditNino=()=>{
    if(alumnosSource)return;
    if(!editNinoTarget)return;
    let form={...editNinoForm};
    // Auto-derive cumpleaños and edad from nacimiento
    if(form.nacimiento){
      try{
        const d=new Date(form.nacimiento);
        const hoy=new Date();
        const edad=hoy.getFullYear()-d.getFullYear()-(hoy<new Date(hoy.getFullYear(),d.getMonth(),d.getDate())?1:0);
        form.cumpleanos=`${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}`;
        form.edad=String(edad);
      }catch(e){}
    }
    const updated={...editNinoTarget,...form};
    const newClases={...clases,[miClase]:(clases[miClase]||[]).map(x=>x.id===editNinoTarget.id?updated:x)};
    onUpdateData("clases",newClases);
    if(form.nombre!==editNinoTarget.nombre||form.nacimiento||form.edad){
      const newFamilias=familias.map(f=>f.alumno===editNinoTarget.nombre?{...f,alumno:form.nombre||f.alumno,cumpleanos:form.cumpleanos||f.cumpleanos,nacimiento:form.nacimiento||f.nacimiento,edad:form.edad||f.edad}:f);
      onUpdateData("familias",newFamilias);
    }
    setEditNinoModal(false);
  };
  const{maestros,cronograma,clases,calificaciones,eventos,familias,evaluaciones,alumnos}=data;
  const alumnosSource=alumnos&&Array.isArray(alumnos)&&alumnos.length>0;
  const teacherInfo=maestros.find(m=>sameTeacherName(m.nombre,user.name))||{};
  const miClase=teacherInfo.clase;
  const misNinos=(clases[miClase]||[]).slice().sort((a,b)=>sortKeyFirstName(a.nombre).localeCompare(sortKeyFirstName(b.nombre),"es"));
  const misClases=cronograma.filter(c=>sameTeacherName(c.maestro,user.name)||sameTeacherName(c.auxiliar,user.name)).sort((a,b)=>a.fecha.localeCompare(b.fecha));
  const todayTeacher=new Date();
  const upcomingEventsTeacher=(Array.isArray(eventos)?eventos:[]).filter(e=>{try{const[d,m,y]=(e.fecha||"").split("/");const dt=new Date(parseInt(y),parseInt(m)-1,parseInt(d));const diff=Math.floor((dt-todayTeacher)/86400000);return diff>=0&&diff<=60;}catch(err){return false;}}).sort((a,b)=>{try{const[da,ma,ya]=(a.fecha||"").split("/");const[db,mb,yb]=(b.fecha||"").split("/");return new Date(parseInt(ya),parseInt(ma)-1,parseInt(da))-new Date(parseInt(yb),parseInt(mb)-1,parseInt(db));}catch(e){return 0;}}).slice(0,5);
  const miEval=evaluaciones.find(e=>{const n1=(e.nombre||"").toLowerCase();const n2=user.name.toLowerCase();return n1.includes(n2.split(" ")[0])||n2.includes(n1.split(" ")[0]);});

  const matchFamilia=(cNombre,fAlumno)=>{
    if(!cNombre||!fAlumno)return false;
    if(cNombre.trim()===fAlumno.trim())return true;
    const w1=cNombre.toLowerCase().split(" ").filter(w=>w.length>2);
    const w2=fAlumno.toLowerCase().split(" ").filter(w=>w.length>2);
    return w1.some(w=>w2.includes(w));
  };
  const getParents=(alumnoNombre)=>familias.find(f=>matchFamilia(alumnoNombre,f.alumno)&&f.clase===miClase)||familias.find(f=>matchFamilia(alumnoNombre,f.alumno));
  const[phoneEditTarget,setPhoneEditTarget]=useState(null);
  const openPhoneEdit=(p)=>{
    setPhoneForm({telPadre:p.telPadre||"",telMadre:p.telMadre||"",padre:p.padre||"",madre:p.madre||""});
    setPhoneEditId(p.id||null);
    setPhoneEditTarget(p);
    setPhoneModal(true);
  };
  const savePhone=()=>{
    if(alumnosSource){setPhoneModal(false);return;}
    if(phoneEditId){
      onUpdateData("familias",familias.map(f=>f.id===phoneEditId?{...f,...phoneForm}:f));
    } else {
      // New family record for student with no family data
      const target=phoneEditTarget||{};
      const newRec={id:Date.now(),familia:phoneForm.padre||phoneForm.madre||target.alumno||"",alumno:target.alumno||target.nombre||"",clase:target.clase||miClase,...phoneForm};
      onUpdateData("familias",[...familias,newRec]);
    }
    setPhoneModal(false);
  };

  const changePw=async()=>{
    const cur=teacherPasswords[user.name]||DEFAULT_TEACHER_PASSWORD;
    if(pwForm.old!==cur){setPwError("Contraseña actual incorrecta");return;}
    if(pwForm.new1.length<4){setPwError("Mínimo 4 caracteres");return;}
    if(pwForm.new1!==pwForm.new2){setPwError("Las contraseñas no coinciden");return;}
    const ok=await onUpdatePasswords({...teacherPasswords,[user.name]:pwForm.new1});
    if(ok){setPwOk(true);setPwForm({old:"",new1:"",new2:""});setPwError("");}
    else setPwError("No se pudo guardar en la nube. Revisa la conexión o la consola (F12).");
  };
  const handlePhoto=async(e)=>{const file=e.target.files[0];if(!file)return;const compressed=await compressImage(file,128,0.5);setPhotoSrc(compressed);const updated=maestros.map(m=>m.nombre===user.name?{...m,foto:compressed}:m);const ok=await onUpdateData("maestros",updated);if(!ok)alert("No se pudo guardar la foto en la nube. Revisa la conexión o la consola (F12).");};

  const getNinoGlobalAvg=(alumno)=>{
    const entries=calificaciones.filter(c=>c.alumno===alumno&&c.clase===miClase);if(!entries.length)return null;
    let t=0,cnt=0;entries.forEach(e=>{["valores","conocimiento","oracion","servicio","respeto","participacion","comportamiento"].forEach(k=>{const v=parseFloat(e[k]);if(!isNaN(v)){t+=v;cnt++;}});});
    return cnt?(t/cnt).toFixed(1):null;
  };

  const peticiones=data.peticiones||[];
  const[sortedPeticionesT,setSortedPeticionesT]=useState([]);
  const[peticionFormT,setPeticionFormT]=useState({texto:"",anonimo:false});
  const[peticionModalT,setPeticionModalT]=useState(false);
  const[peticionEditIdT,setPeticionEditIdT]=useState(null);
  const[peticionEditFormT,setPeticionEditFormT]=useState({texto:"",anonimo:false});
  useEffect(()=>{setSortedPeticionesT((peticiones||[]).slice().sort((a,b)=>new Date(b.fecha)-new Date(a.fecha)));},[peticiones]);
  const savePeticionNuevaT=()=>{
    if(!peticionFormT.texto.trim())return;
    onUpdateData("peticiones",[...peticiones,{id:Date.now(),texto:peticionFormT.texto.trim(),autor:user.name,anonimo:!!peticionFormT.anonimo,fecha:new Date().toISOString()}]);
    setPeticionFormT({texto:"",anonimo:false});
  };
  const openEditPeticionT=(p)=>{setPeticionEditIdT(p.id);setPeticionEditFormT({texto:p.texto,anonimo:p.anonimo});setPeticionModalT(true);};
  const savePeticionEditT=()=>{
    if(!peticionEditFormT.texto.trim())return;
    if(peticionEditIdT)onUpdateData("peticiones",peticiones.map(p=>p.id===peticionEditIdT?{...p,texto:peticionEditFormT.texto,anonimo:peticionEditFormT.anonimo}:p));
    setPeticionModalT(false);
  };
  const deletePeticionT=()=>{if(peticionEditIdT&&confirmDelete("¿Eliminar esta petición de oración?")){onUpdateData("peticiones",peticiones.filter(p=>p.id!==peticionEditIdT));setPeticionModalT(false);}};

  const tabs=[
    {id:"inicio",label:"Inicio",icon:"🏠"},
    {id:"cronograma",label:"Horario",icon:"📅"},
    {id:"calificaciones",label:"Calific.",icon:"📊"},
    {id:"clase",label:"Mi clase",icon:"👧"},
    {id:"clases",label:"Clases",icon:"🧒"},
    {id:"mas",label:"Más",icon:"☰"},
  ];

  return(
    <div style={{background:"#F5F0FF",minHeight:"100dvh",paddingBottom:70}}>
      <div style={{background:"linear-gradient(135deg,#3D1B6B,#5B2D8E)",padding:"0.75rem 1rem",display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"0 2px 12px rgba(0,0,0,0.15)",position:"sticky",top:0,zIndex:100}}>
        <LogoImg height={38} onClick={()=>onRefreshData?.()} title="Actualizar datos"/>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{textAlign:"right"}}>
            <div style={{color:"#F5C842",fontWeight:800,fontSize:12,lineHeight:1.2}}>{displayMaestroNombre(user.name)}</div>
            <div style={{color:"rgba(255,255,255,0.65)",fontSize:10}}>{teacherInfo.cargo} · {miClase}</div>
          </div>
          <button style={{background:"rgba(255,255,255,0.18)",border:"none",borderRadius:10,padding:"8px 12px",color:"#FFFFFF",fontWeight:700,fontSize:13,cursor:"pointer"}} onClick={onLogout}>🚪 Salir</button>
        </div>
      </div>

      <div style={{paddingBottom:10}}>
        {activeTab==="inicio"&&(
          <div style={{padding:"1rem 1rem 0"}}>
            <h2 style={S.title}>Hola, {displayMaestroNombre(user.name).split(" ")[0]} 👋</h2>
            <BirthdayBanner maestros={maestros} familias={familias}/>
            <VerseBannerMaestros/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
              <StatCard icon="👧" value={misNinos.length} label="Mis alumnos" color={CLASE_COLORS[miClase]||"#5B2D8E"} onClick={()=>setActiveTab("clase")}/>
              <StatCard icon="📅" value={misClases.length} label="Clases asig." color="#4BBCE0" onClick={()=>setActiveTab("cronograma")}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
              <a href="https://drive.google.com/drive/folders/1PW00hDNw0POgEPW4LiANMH7PgByvX8A5?usp=sharing" target="_blank" rel="noopener noreferrer" style={{textDecoration:"none"}}>
                <div style={{...S.card,cursor:"pointer",display:"flex",alignItems:"center",gap:12,padding:14,border:"2px solid #5B2D8E33",transition:"border-color 0.2s"}} onMouseOver={e=>{e.currentTarget.style.borderColor="#5B2D8E88";}} onMouseOut={e=>{e.currentTarget.style.borderColor="#5B2D8E33";}}>
                  <div style={{width:44,height:44,borderRadius:12,background:"#5B2D8E22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>📁</div>
                  <div><div style={{fontWeight:800,color:"#5B2D8E",fontSize:14}}>Recursos E.D.</div><div style={{fontSize:11,color:"#7B6B9A"}}>Carpeta Google Drive</div></div>
                </div>
              </a>
              <a href="https://chat.whatsapp.com/D5XEyuz7NWXKtJeZQqG0h2?mode=gi_t" target="_blank" rel="noopener noreferrer" style={{textDecoration:"none"}}>
                <div style={{...S.card,cursor:"pointer",display:"flex",alignItems:"center",gap:12,padding:14,border:"2px solid #25D36633",transition:"border-color 0.2s"}} onMouseOver={e=>{e.currentTarget.style.borderColor="#25D36688";}} onMouseOut={e=>{e.currentTarget.style.borderColor="#25D36633";}}>
                  <div style={{width:44,height:44,borderRadius:12,background:"#25D36622",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>💬</div>
                  <div><div style={{fontWeight:800,color:"#128C7E",fontSize:14}}>Grupo WhatsApp</div><div style={{fontSize:11,color:"#7B6B9A"}}>Maestros</div></div>
                </div>
              </a>
              <a href="https://www.bible.com/es/reading-plans/14400-la-biblia-en-1-ano" target="_blank" rel="noopener noreferrer" style={{textDecoration:"none",gridColumn:"1 / -1"}}>
                <div style={{...S.card,cursor:"pointer",display:"flex",alignItems:"center",gap:12,padding:14,border:"2px solid #8B691433"}} onMouseOver={e=>{e.currentTarget.style.borderColor="#8B691488";}} onMouseOut={e=>{e.currentTarget.style.borderColor="#8B691433";}}>
                  <div style={{width:44,height:44,borderRadius:12,background:"#8B691422",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>📖</div>
                  <div><div style={{fontWeight:800,color:"#6B4E10",fontSize:14}}>Plan de lectura bíblica (1 año)</div><div style={{fontSize:11,color:"#7B6B9A"}}>Bible.com · Recorrido completo en un año</div></div>
                </div>
              </a>
            </div>
            <div style={S.card}>
              <h3 style={{color:"#5B2D8E",fontWeight:800,fontSize:15,marginBottom:12}}>📅 Próximas Clases</h3>
              {misClases.slice(0,3).map((c,i)=>(
                <div key={i} style={{marginBottom:10,background:(CLASE_COLORS[c.grupo]||"#5B2D8E")+"15",border:`1.5px solid ${CLASE_COLORS[c.grupo]||"#5B2D8E"}44`,borderRadius:12,padding:"12px 14px"}}>
                  <div style={{fontWeight:800,color:CLASE_COLORS[c.grupo]||"#5B2D8E",fontSize:12}}>{formatFecha(c.fecha)} · {c.grupo}</div>
                  <div style={{fontSize:15,fontWeight:700,margin:"4px 0 2px"}}>{c.leccion}</div>
                  <div style={{fontSize:12,color:"#7B6B9A"}}>{c.tema}</div>
                  <div style={{marginTop:6}}><span style={S.badge(sameTeacherName(c.maestro,user.name)?"#5B2D8E":"#4BBCE0")}>{sameTeacherName(c.maestro,user.name)?"🎓 Maestro":"🤝 Auxiliar"}</span></div>
                </div>
              ))}
              {misClases.length===0&&<div style={{color:"#7B6B9A",fontSize:13}}>Sin clases asignadas.</div>}
            </div>
            <div style={S.card}>
              <h3 style={{color:"#4BBCE0",fontWeight:800,fontSize:15,marginBottom:12}}>📆 Próximos Eventos (60 días)</h3>
              {upcomingEventsTeacher.length===0&&<div style={{color:"#7B6B9A"}}>Sin eventos próximos.</div>}
              {upcomingEventsTeacher.map((e,i)=>(
                <div key={e.id} style={{display:"flex",gap:10,marginBottom:10,paddingBottom:10,borderBottom:i<upcomingEventsTeacher.length-1?"1px solid #DDD0F0":"none"}}>
                  <div style={{background:(e.tipo==="NACIONAL"?"#5B2D8E":"#4BBCE0")+"22",borderRadius:8,padding:"4px 8px",fontSize:11,fontWeight:800,color:e.tipo==="NACIONAL"?"#5B2D8E":"#2A96BC",flexShrink:0}}>{e.fecha}</div>
                  <div style={{fontWeight:600,fontSize:13}}>{e.nombre}</div>
                </div>
              ))}
            </div>
            <div style={{...S.card,borderLeft:"5px solid #E84F9B",marginBottom:14}}>
              <div style={{fontWeight:800,color:"#E84F9B",fontSize:15,marginBottom:12}}>🙏 Peticiones de Oración</div>
              {sortedPeticionesT.length===0&&<div style={{color:"#7B6B9A",textAlign:"center",padding:20,fontStyle:"italic",fontSize:13}}>Sin peticiones. Escribe la primera abajo.</div>}
              {sortedPeticionesT.map(p=>(
                <div key={p.id} style={{padding:"10px 0",borderBottom:"1px solid #DDD0F0"}}>
                  <div style={{fontSize:13,color:"#2D1B4E",lineHeight:1.5}}>{p.texto}</div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:6,marginTop:6}}>
                    <div style={{fontSize:11,color:"#7B6B9A"}}>
                      {p.anonimo?"🔒 Anónimo":shortDisplayName(p.autor)} · {p.fecha?new Date(p.fecha).toLocaleDateString("es-ES",{day:"2-digit",month:"short",year:"numeric"}):""}
                    </div>
                    {p.autor===user.name&&<button style={{...S.btn("#4BBCE0"),padding:"5px 10px",fontSize:12}} onClick={()=>openEditPeticionT(p)}>✏️</button>}
                  </div>
                </div>
              ))}
              <div style={{marginTop:16,paddingTop:16,borderTop:"2px solid #E84F9B33"}}>
                <div style={{fontSize:12,color:"#7B6B9A",marginBottom:8}}>Añadir petición (visible para todos)</div>
                <textarea style={{...S.input,height:80,resize:"vertical",marginBottom:10}} value={peticionFormT.texto} onChange={e=>setPeticionFormT(f=>({...f,texto:e.target.value}))} placeholder="Escribe tu petición de oración..."/>
                <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",marginBottom:12}}>
                  <input type="checkbox" checked={!!peticionFormT.anonimo} onChange={e=>setPeticionFormT(f=>({...f,anonimo:e.target.checked}))} style={{width:20,height:20,accentColor:"#5B2D8E"}}/>
                  <span style={{fontSize:13,color:"#5B2D8E",fontWeight:600}}>🔒 Petición anónima</span>
                </label>
                <button style={{...S.btn("#E84F9B","#FFFFFF",true),padding:12,fontSize:14}} onClick={savePeticionNuevaT}>🙏 Guardar Petición</button>
              </div>
            </div>
          </div>
        )}
        {activeTab==="cronograma"&&(
          <div style={{padding:"1rem 1rem 0"}}>
            <h2 style={S.title}>Mi Cronograma</h2>
            {misClases.map((c,i)=>(
              <div key={i} style={{...S.card,borderLeft:`5px solid ${CLASE_COLORS[c.grupo]||"#5B2D8E"}`}}>
                <div style={{fontWeight:800,color:CLASE_COLORS[c.grupo]||"#5B2D8E",fontSize:13}}>{formatFecha(c.fecha)} 2026 · {c.grupo}</div>
                <div style={{fontSize:17,fontWeight:900,margin:"6px 0 4px"}}>{c.leccion}</div>
                <div style={{fontSize:13,color:"#7B6B9A",marginBottom:8}}>{c.tema}</div>
                <div style={{display:"flex",gap:10}}>
                  <span style={S.badge(sameTeacherName(c.maestro,user.name)?"#5B2D8E":"#4BBCE0")}>{sameTeacherName(c.maestro,user.name)?"🎓 Maestro":"🤝 Auxiliar"}</span>
                  <span style={{fontSize:12,color:"#7B6B9A"}}>Aux: {c.auxiliar?displayMaestroNombre(c.auxiliar):"—"}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        {activeTab==="calificaciones"&&<TeacherCalif user={user} data={data} onUpdateCalif={v=>onUpdateData("calificaciones",v)} onUpdateMerienda={v=>onUpdateData("meriendas",v)}/>}
        {activeTab==="clase"&&(
          <div style={{padding:"1rem 1rem 0"}}>
            <h2 style={S.title}>Mi Clase: {miClase}</h2>
            {misNinos.map((n,i)=>{
              const avg=getNinoGlobalAvg(n.nombre);
              // Padres/teléfonos solo desde la tarjeta del alumno (n), nunca desde familias u otra fuente
              const p=(n.padre!==undefined||n.madre!==undefined)?{ padre: n.padre||"", madre: n.madre||"", telPadre: n.telPadre||"", telMadre: n.telMadre||"", bautizado: !!n.bautizado, sellado: !!n.sellado }:getParents(n.nombre);
              // All observations for this student across all sessions
              const obsHistorial=calificaciones
                .filter(c=>c.alumno===n.nombre&&c.clase===miClase&&c.observacion)
                .sort((a,b)=>b.fecha?.localeCompare(a.fecha||"")||0)
                .slice(0,5);
              const totalSesiones=calificaciones.filter(c=>c.alumno===n.nombre&&c.clase===miClase).length;
              return(
                <div key={n.id||i} style={{...S.card,borderLeft:`5px solid ${CLASE_COLORS[miClase]||"#5B2D8E"}`}}>
                  <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
                    {n.foto
                      ?<img src={n.foto} alt="" style={{width:44,height:44,borderRadius:"50%",objectFit:"cover",border:`3px solid ${CLASE_COLORS[miClase]||"#5B2D8E"}`,flexShrink:0}}/>
                      :<div style={{width:44,height:44,borderRadius:"50%",background:(CLASE_COLORS[miClase]||"#5B2D8E")+"33",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:14,color:CLASE_COLORS[miClase]||"#5B2D8E",flexShrink:0}}>{getInitials(n.nombre)}</div>
                    }
                    <div style={{flex:1}}>
                      <div style={{fontWeight:800}}>{displayNameAlumno(n)}</div>
                      <div style={{fontSize:12,color:"#7B6B9A"}}>
                        {n.edad?n.edad+" años · ":""}
                        {totalSesiones} sesiones asistidas
                        {p?.bautizado&&" · 🙏 Bautizado"}
                        {p?.sellado&&" · ✨ Sellado"}
                      </div>
                    </div>
                    {avg&&<div style={{background:scoreColor(avg)+"20",borderRadius:10,padding:"6px 10px",textAlign:"center"}}><div style={{fontWeight:900,color:scoreColor(avg),fontSize:18}}>{avg}</div><div style={{fontSize:10,color:"#7B6B9A"}}>prom.</div></div>}
                  </div>
                  {/* Observation history - visible to teacher/auxiliary */}
                  {obsHistorial.length>0&&(
                    <div style={{background:"linear-gradient(135deg,#F5C84212,#F5C84228)",border:"1.5px solid #F5C84255",borderRadius:12,padding:"10px 14px",marginBottom:10}}>
                      <div style={{fontWeight:800,color:"#7B5A00",fontSize:12,letterSpacing:0.5,marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
                        💬 HISTORIAL DE OBSERVACIONES
                        <span style={{background:"#F5C842",color:"#3D1B00",borderRadius:20,padding:"1px 7px",fontSize:11,fontWeight:900}}>{obsHistorial.length}</span>
                      </div>
                      {obsHistorial.map((obs,oi)=>(
                        <div key={obs.id||oi} style={{marginBottom:oi<obsHistorial.length-1?10:0,paddingBottom:oi<obsHistorial.length-1?10:0,borderBottom:oi<obsHistorial.length-1?"1px dashed #F5C84255":"none"}}>
                          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                            <span style={{fontSize:11,fontWeight:800,color:"#5B2D8E",background:"#5B2D8E15",borderRadius:8,padding:"2px 7px"}}>{obs.leccion||"Sesión"}</span>
                            <span style={{fontSize:11,color:"#7B6B9A"}}>📅 {formatFecha(obs.fecha)}</span>
                          </div>
                          <div style={{fontSize:13,color:"#2D1B4E",lineHeight:1.5,background:"#FFFFFF88",borderRadius:8,padding:"6px 10px"}}>{obs.observacion}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {obsHistorial.length===0&&totalSesiones>0&&(
                    <div style={{fontSize:12,color:"#7B6B9A",fontStyle:"italic",padding:"4px 0 8px",borderBottom:"1px solid #F0ECF8",marginBottom:8}}>Sin observaciones registradas aún</div>
                  )}
                  {p&&(p.padre||p.madre)&&(
                    <div style={{background:"#F5F0FF",borderRadius:12,padding:"10px 14px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                        <div style={{fontSize:11,fontWeight:800,color:"#7B6B9A",letterSpacing:1}}>PADRES / TUTORES</div>
                        {!alumnosSource&&<button style={{...S.btn("#F5C842","#3D1B6B"),padding:"4px 10px",fontSize:11}} onClick={()=>openPhoneEdit(p)}>✏️ Editar Tel.</button>}
                      </div>
                      {p.padre&&p.padre!=="(No registra)"&&(
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:p.madre?8:0}}>
                          <span style={{fontSize:14}}>👨</span>
                          <span style={{fontSize:13,fontWeight:600,flex:1}}>{p.padre}</span>
                          {p.telPadre?<a href={`tel:${p.telPadre}`} style={{background:"#4BBCE0",color:"#FFFFFF",borderRadius:10,padding:"6px 12px",fontSize:12,fontWeight:800,textDecoration:"none",whiteSpace:"nowrap"}}>📞 {p.telPadre}</a>:<span style={{fontSize:11,color:"#EF5350",fontStyle:"italic"}}>Sin tel.</span>}
                        </div>
                      )}
                      {p.madre&&p.madre!=="(No registra)"&&(
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <span style={{fontSize:14}}>👩</span>
                          <span style={{fontSize:13,fontWeight:600,flex:1}}>{p.madre}</span>
                          {p.telMadre?<a href={`tel:${p.telMadre}`} style={{background:"#E84F9B",color:"#FFFFFF",borderRadius:10,padding:"6px 12px",fontSize:12,fontWeight:800,textDecoration:"none",whiteSpace:"nowrap"}}>📞 {p.telMadre}</a>:<span style={{fontSize:11,color:"#EF5350",fontStyle:"italic"}}>Sin tel.</span>}
                        </div>
                      )}
                    </div>
                  )}
                  {!p&&!alumnosSource&&(
                    <div style={{background:"#FFF0E6",borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}>
                      <div style={{flex:1,fontSize:12,color:"#7B6B9A",fontStyle:"italic"}}>Sin datos de familia registrados</div>
                      <button style={{...S.btn("#F5C842","#3D1B6B"),padding:"6px 12px",fontSize:12,whiteSpace:"nowrap"}} onClick={()=>openPhoneEdit({alumno:n.nombre,clase:miClase,padre:"",madre:"",telPadre:"",telMadre:""})}>+ Agregar</button>
                    </div>
                  )}
                  {!p&&alumnosSource&&(
                    <div style={{background:"#F5F0FF",borderRadius:10,padding:"10px 14px",fontSize:12,color:"#7B6B9A"}}>Sin datos de familia registrados</div>
                  )}
                  {p&&!(p.padre&&p.padre!=="(No registra)")&&!(p.madre&&p.madre!=="(No registra)")&&!alumnosSource&&(
                    <div style={{background:"#FFF0E6",borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}>
                      <div style={{flex:1,fontSize:12,color:"#7B6B9A"}}>⚠️ Padres sin nombre registrado</div>
                      <button style={{...S.btn("#F5C842","#3D1B6B"),padding:"6px 12px",fontSize:12}} onClick={()=>openPhoneEdit(p)}>✏️ Editar</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {activeTab==="clases"&&(
          <ClasesPanel
            readOnlyStudents
            allowManageConfig={false}
            clases={data.clases}
            onUpdate={()=>{}}
            clasesConfig={data.clasesConfig}
            onUpdateClasesConfig={()=>{}}
            calificaciones={data.calificaciones}
            familias={data.familias}
            onUpdateFamilias={()=>{}}
          />
        )}
        <Modal open={phoneModal} onClose={()=>setPhoneModal(false)} title="Editar Teléfonos de Padres">
          <div style={{background:"#F5F0FF",borderRadius:12,padding:"10px 14px",marginBottom:16,fontSize:13,color:"#7B6B9A"}}>Agrega o actualiza los teléfonos de contacto</div>
          {[["👨 Padre / Tutor","padre"],["📞 Tel. Padre","telPadre"],["👩 Madre / Tutora","madre"],["📞 Tel. Madre","telMadre"]].map(([l,k])=>(
            <div key={k} style={{marginBottom:14}}>
              <label style={S.label}>{l}</label>
              <input style={S.input} type={k.startsWith("tel")?"tel":"text"} value={phoneForm[k]||""} onChange={e=>setPhoneForm(f=>({...f,[k]:e.target.value}))} placeholder={k.startsWith("tel")?"Ej: +34 600 000 000":""}/>
            </div>
          ))}
          <button style={{...S.btn("#5B2D8E","#FFFFFF",true),padding:14}} onClick={savePhone}>💾 Guardar Teléfonos</button>
        </Modal>
        <Modal open={editNinoModal} onClose={()=>setEditNinoModal(false)} title="✏️ Editar Alumno">
          <div style={{background:"#F0FBFF",borderRadius:12,padding:"10px 14px",marginBottom:14,fontSize:13,color:"#2A96BC",lineHeight:1.6}}>El cumpleaños y la edad se calculan automáticamente a partir de la fecha de nacimiento.</div>
          {[["Nombre completo (Apellido Nombre)","nombre","text"],["Fecha de nacimiento","nacimiento","date"]].map(([l,k,t])=>(
            <div key={k} style={{marginBottom:14}}>
              <label style={S.label}>{l}</label>
              <input type={t} style={S.input} value={editNinoForm[k]||""} onChange={e=>setEditNinoForm(f=>({...f,[k]:e.target.value}))}/>
            </div>
          ))}
          {editNinoForm.nacimiento&&(()=>{
            try{
              const d=new Date(editNinoForm.nacimiento);
              const hoy=new Date();
              const edad=hoy.getFullYear()-d.getFullYear()-(hoy<new Date(hoy.getFullYear(),d.getMonth(),d.getDate())?1:0);
              const cumple=`${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}`;
              return <div style={{background:"#F5FFF5",border:"2px solid #4CAF5044",borderRadius:12,padding:"12px 14px",marginBottom:14}}>
                <div style={{fontSize:12,color:"#7B6B9A",marginBottom:4}}>Calculado automáticamente:</div>
                <div style={{display:"flex",gap:16}}>
                  <div><span style={{fontSize:11,color:"#7B6B9A"}}>🎂 Cumpleaños</span><div style={{fontWeight:800,color:"#4CAF50"}}>{cumple}</div></div>
                  <div><span style={{fontSize:11,color:"#7B6B9A"}}>🔢 Edad</span><div style={{fontWeight:800,color:"#4CAF50"}}>{edad} años</div></div>
                </div>
              </div>;
            }catch(e){return null;}
          })()}
          <button style={{...S.btn("#5B2D8E","#FFFFFF",true),padding:14}} onClick={saveEditNino}>💾 Guardar Cambios</button>
        </Modal>
        {activeTab==="mas"&&(
          <div style={{padding:"1rem 1rem 0"}}>
            <div style={{display:"flex",gap:8,overflowX:"auto",marginBottom:16,paddingBottom:4}}>
              {[
                ["eventos","📆 Eventos"],
                ["cumpleanos","🎂 Cumple."],
                ["finanzas","💰 Finanzas"],
                ...((()=>{const n=(user.name||"").toLowerCase();return n.includes("marcela")&&n.includes("lavaire")?[["finanzasED","💰 Finanzas ED"]]:[];})()),
                ["evaluacion","⭐ Evaluac."],
                ["perfil","👤 Perfil"],
              ].map(([id,label])=>(
                <button key={id} style={{...S.btn(masTab===id?"#5B2D8E":"#F5F0FF",masTab===id?"#FFFFFF":"#2D1B4E"),padding:"8px 14px",fontSize:13,flexShrink:0,borderRadius:20,whiteSpace:"nowrap"}} onClick={()=>setMasTab(id)}>{label}</button>
              ))}
            </div>
            {masTab==="evaluacion"&&(
              <div>
                <h2 style={S.title}>Mi Evaluación</h2>
                {miEval?(
                  <div style={S.card}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                      <div><div style={{fontWeight:800,fontSize:16}}>{displayMaestroNombre(user.name)}</div><div style={{color:"#7B6B9A",fontSize:13}}>{teacherInfo.cargo} · {miClase}</div></div>
                      <div style={{background:"#5B2D8E15",borderRadius:14,padding:"12px 18px",textAlign:"center"}}>
                        <div style={{fontSize:32,fontWeight:900,color:"#5B2D8E"}}>{formatEvalScore(evalAvg(miEval,videoAvgForMaestro(user.name,data.videos||[],data.maestros||[])))}</div><div style={{fontSize:11,color:"#7B6B9A"}}>/5</div>
                      </div>
                    </div>
                    {EVAL_KEYS.map((k,j)=>(
                      <div key={k} style={{marginBottom:12,background:k==="cumplimientoClases"?"linear-gradient(135deg,#5B2D8E18,#5B2D8E30)":"#F5F0FF",borderRadius:12,padding:"12px 14px",border:k==="cumplimientoClases"?"2px solid #5B2D8E55":"none"}}>
                        <div style={{fontSize:12,color:k==="cumplimientoClases"?"#5B2D8E":"#7B6B9A",marginBottom:6,fontWeight:k==="cumplimientoClases"?800:400}}>{EVAL_LABELS[j]}</div>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          <div style={{display:"flex",gap:2}}>{[1,2,3,4,5].map(s=><span key={s} style={{color:s<=(miEval[k]||0)?"#F5C842":"#e0e0e0",fontSize:20}}>★</span>)}</div>
                          <span style={{fontWeight:800,color:miEval[k]>=4?"#4CAF50":miEval[k]>=3?"#F5A623":"#EF5350"}}>{miEval[k]||"—"}/5</span>
                        </div>
                      </div>
                    ))}
                    {(()=>{
                      const crono=data.cronograma||[];
                      const fallasReg=crono.filter(e=>sameTeacherName(e.fallaMaestro,user.name)||sameTeacherName(e.fallaAuxiliar,user.name));
                      const videos=data.videos||[];
                      const sesionesVideo=crono.filter(s=>sameTeacherName(s.maestro,user.name)&&VIDEO_CLASES.includes(s.grupo)&&s.leccion&&s.leccion!=="NO HAY CLASE").sort((a,b)=>(b.fecha||"").localeCompare(a.fecha||""));
                      const rowsVideo=sesionesVideo.map(s=>{
                        const v=videos.find(x=>x.sesionId===s.id&&x.maestro===s.maestro);
                        const score=v?videoScore(v):null;
                        return{ses:s,vid:v,score};
                      }).filter(r=>r.vid&&r.vid.hizo);
                      const hayFallas=fallasReg.length>0;
                      const hayVideos=rowsVideo.length>0;
                      if(!hayFallas&&!hayVideos)return null;
                      return(
                        <div style={{marginTop:16}}>
                          <div style={{fontWeight:800,fontSize:14,color:"#5B2D8E",marginBottom:8}}>📋 Historial de calificaciones</div>
                          {hayFallas&&(
                            <div style={{marginBottom:14}}>
                              <div style={{fontWeight:800,fontSize:12,color:"#EF5350",marginBottom:6}}>Fallas registradas (fecha, lección, grupo)</div>
                              <div style={{borderRadius:12,overflow:"hidden",border:"1px solid #EF535044"}}>
                                {fallasReg.map((e,i)=>(
                                  <div key={e.id||i} style={{display:"flex",alignItems:"center",padding:"8px 12px",background:i%2===0?"#FFF0F0":"#FFFFFF",fontSize:12}}>
                                    <span style={{color:"#EF5350",marginRight:8}}>❌</span>
                                    <span style={{fontWeight:600,color:"#2D1B4E"}}>{e.leccion||"—"}</span>
                                    <span style={{color:"#7B6B9A",marginLeft:8}}>📅 {formatFecha(e.fecha)} · {e.grupo||"—"}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {hayVideos&&(
                            <div>
                              <div style={{fontWeight:800,fontSize:12,color:"#4BBCE0",marginBottom:6}}>🎬 Calificaciones de videos (fecha, lección, grupo)</div>
                              <div style={{fontSize:11,color:"#7B6B9A",marginBottom:6}}>Clases que requieren video: Corderitos, Vencedores, Conquistadores.</div>
                              <div style={{borderRadius:12,overflow:"hidden",border:"1px solid #DDD0F0"}}>
                                {rowsVideo.map((r,i)=>(
                                  <div key={r.ses.id||i} style={{display:"flex",alignItems:"center",padding:"8px 10px",background:i%2===0?"#F5F0FF":"#FFFFFF"}}>
                                    <div style={{flex:1,minWidth:0}}>
                                      <div style={{fontWeight:700,fontSize:13}}>{r.ses.leccion||"Sesión"}</div>
                                      <div style={{fontSize:11,color:"#7B6B9A"}}>{formatFecha(r.ses.fecha)} · {r.ses.grupo}</div>
                                    </div>
                                    <div style={{textAlign:"right",fontSize:11}}>
                                      <div>{r.vid?.hizo?"✅ Enviado":"❌ Sin video"}</div>
                                      {r.score!=null&&<div style={{fontWeight:800,fontSize:14,color:scoreColor(r.score.toFixed(1))}}>{r.score.toFixed(1)}/5</div>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                ):<div style={{color:"#7B6B9A"}}>No hay evaluación disponible.</div>}
              </div>
            )}
            {masTab==="eventos"&&<EventosPanel eventos={data.eventos} onUpdate={()=>{}} readOnly/>}
            {masTab==="finanzas"&&(
              <TeacherFinanzasPanel user={user} data={data}/>
            )}
            {masTab==="finanzasED"&&(user.name||"").toLowerCase().includes("marcela")&&(user.name||"").toLowerCase().includes("lavaire")&&(
              <FinanzasPanel finanzas={data.finanzas||DEFAULT_FINANZAS} maestros={data.maestros} onUpdate={v=>onUpdateData("finanzas",v)}/>
            )}
            {masTab==="cumpleanos"&&(
              <div>
                <h2 style={S.title}>Cumpleaños — {miClase}</h2>
                <BirthdayBanner maestros={maestros.filter(m=>m.clase===miClase)} familias={familias.filter(f=>f.clase===miClase)}/>
                {(()=>{
                  const maestrosClase=maestros.filter(m=>m.clase===miClase&&(m.cumpleanos||m.nacimiento));
                  const cumpleMaestros=maestrosClase.map(m=>{
                    let f=m.cumpleanos;if(!f&&m.nacimiento){try{const d=new Date(m.nacimiento);f=`${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}`;}catch(e){}}return f?{nombre:displayMaestroNombre(m.nombre),fecha:f,tipo:m.cargo,categoria:"maestro",foto:m.foto,iniciales:getInitials(m.nombre),diff:diasHastaCumple(f)}:null;
                  }).filter(Boolean);
                  const cumpleAlumnos=familias.filter(f=>f.clase===miClase&&f.cumpleanos).map(f=>({nombre:f.alumno||"",fecha:f.cumpleanos,tipo:"ALUMNO",categoria:"alumno",edad:f.edad,foto:f.foto,iniciales:getInitials(f.alumno),diff:diasHastaCumple(f.cumpleanos)}));
                  const sortByDiff=(a,b)=>{
                    const da=a.diff!=null?a.diff:9999;
                    const db=b.diff!=null?b.diff:9999;
                    if(da!==db)return da-db;
                    const[ad,am]=a.fecha.split("/").map(Number);
                    const[bd,bm]=b.fecha.split("/").map(Number);
                    return am-bm||ad-bd;
                  };
                  const maestrosOnly=cumpleMaestros.filter(m=>m.tipo==="MAESTRO").sort(sortByDiff);
                  const auxiliaresOnly=cumpleMaestros.filter(m=>m.tipo==="AUXILIAR").sort(sortByDiff);
                  const todos=[...cumpleAlumnos.sort(sortByDiff),...maestrosOnly,...auxiliaresOnly];
                  const thumb=(b,color)=>(b.foto?<img src={b.foto} alt="" style={{width:40,height:40,borderRadius:"50%",objectFit:"cover",border:`2px solid ${color}44`,flexShrink:0}}/>:<div style={{width:40,height:40,borderRadius:"50%",background:color+"33",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:14,color,flexShrink:0}}>{b.iniciales||"?"}</div>);
                  return todos.length===0?(<div style={{color:"#7B6B9A",textAlign:"center",padding:24,fontStyle:"italic"}}>No hay cumpleaños registrados en tu clase.</div>):(
                    todos.map((b,i)=>(
                      <div key={b.nombre+b.fecha+i} style={{...S.card,display:"flex",alignItems:"center",gap:10}}>
                        {thumb(b,b.categoria==="maestro"?"#5B2D8E":(CLASE_COLORS[miClase]||"#4BBCE0"))}
                        <span style={{fontSize:22}}>🎂</span>
                        <div style={{flex:1}}>
                          <div style={{fontWeight:700}}>{b.nombre}</div>
                          <div style={{fontSize:12,color:"#7B6B9A"}}>{b.tipo}{b.edad?" · "+b.edad:""}</div>
                        </div>
                        <div style={{textAlign:"right"}}><span style={{fontWeight:800,color:"#E84F9B",fontSize:14,display:"block"}}>{b.fecha}</span>{b.diff!=null&&<span style={{fontSize:11,color:"#5B2D8E",fontWeight:700}}>{labelDiasFaltan(b.diff)}</span>}</div>
                      </div>
                    ))
                  );
                })()}
              </div>
            )}
            {masTab==="perfil"&&(
              <div>
                <h2 style={S.title}>Mi Perfil</h2>
                <div style={{...S.card,textAlign:"center",padding:24}}>
                  <div style={{position:"relative",width:90,height:90,margin:"0 auto 14px"}}>
                    {(photoSrc||teacherInfo.foto)?<img src={photoSrc||teacherInfo.foto} alt="foto" style={{width:90,height:90,borderRadius:"50%",objectFit:"cover",border:"4px solid #5B2D8E"}}/>
                      :<div style={{width:90,height:90,borderRadius:"50%",background:"#5B2D8E22",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:32,color:"#5B2D8E",border:"4px solid #DDD0F0"}}>{getInitials(user.name)}</div>}
                    <button onClick={()=>fileRef.current.click()} style={{position:"absolute",bottom:0,right:0,width:28,height:28,borderRadius:"50%",background:"#5B2D8E",border:"none",cursor:"pointer",fontSize:14,color:"#FFFFFF"}}>📷</button>
                    <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handlePhoto}/>
                  </div>
                  <div style={{fontWeight:800,fontSize:18}}>{displayMaestroNombre(user.name)}</div>
                  <div style={{color:"#7B6B9A",marginTop:4}}>{teacherInfo.cargo} · {miClase}</div>
                  {teacherInfo.cumpleanos&&<div style={{marginTop:8,color:"#E84F9B",fontWeight:700}}>🎂 {teacherInfo.cumpleanos}</div>}
                  <div style={{marginTop:10}}><span style={S.badge(teacherInfo.certificado==="SI"?"#4CAF50":"#EF5350")}>{teacherInfo.certificado==="SI"?"✅ Certificado al día":"❌ Pendiente"}</span></div>
                </div>
                <div style={S.card}>
                  <h3 style={{color:"#5B2D8E",fontWeight:800,marginBottom:16,fontSize:16}}>🔐 Cambiar Contraseña</h3>
                  {pwOk?<div style={{color:"#4CAF50",fontWeight:700,textAlign:"center",padding:"20px 0"}}>✅ Contraseña cambiada</div>:(
                    <>
                      {[["Contraseña actual","old"],["Nueva contraseña","new1"],["Confirmar nueva","new2"]].map(([l,k])=>(
                        <div key={k} style={{marginBottom:14}}><label style={S.label}>{l}</label><input type="password" style={S.input} value={pwForm[k]} onChange={e=>{setPwForm(f=>({...f,[k]:e.target.value}));setPwError("");setPwOk(false);}}/></div>
                      ))}
                      {pwError&&<div style={{color:"#EF5350",fontSize:13,marginBottom:10,fontWeight:700}}>{pwError}</div>}
                      <button style={{...S.btn("#5B2D8E","#FFFFFF",true),padding:14}} onClick={changePw}>Cambiar Contraseña</button>
                    </>
                  )}
                </div>
                <button style={{...S.btn("#EF5350","#FFFFFF",true),padding:14,marginTop:8}} onClick={onLogout}>🚪 Cerrar Sesión</button>
              </div>
            )}
          </div>
        )}
      </div>
      <Modal open={peticionModalT} onClose={()=>setPeticionModalT(false)} title="Editar Petición">
        <label style={S.label}>Petición</label>
        <textarea style={{...S.input,height:100,resize:"vertical",marginBottom:12}} value={peticionEditFormT.texto} onChange={e=>setPeticionEditFormT(f=>({...f,texto:e.target.value}))}/>
        <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",marginBottom:16}}>
          <input type="checkbox" checked={!!peticionEditFormT.anonimo} onChange={e=>setPeticionEditFormT(f=>({...f,anonimo:e.target.checked}))} style={{width:20,height:20,accentColor:"#5B2D8E"}}/>
          <span style={{fontSize:13,fontWeight:600}}>🔒 Anónima</span>
        </label>
        <button style={{...S.btn("#E84F9B","#FFFFFF",true),padding:12}} onClick={savePeticionEditT}>💾 Guardar</button>
        <button style={{...S.btn("#FFF0F0","#EF5350"),padding:12,marginTop:10,border:"1.5px solid #EF535044"}} onClick={deletePeticionT}>🗑 Eliminar</button>
      </Modal>
      <BottomNav tabs={tabs} active={activeTab} onSelect={setActiveTab}/>
    </div>
  );
}

// ══════════ PDF REPORTS ══════════
function generarPDF(titulo, htmlContent, options={}){
  const estilos=`
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
      *{margin:0;padding:0;box-sizing:border-box;}
      body{font-family:'Inter',sans-serif;background:#fff;color:#1a1a2e;font-size:13px;line-height:1.5;}
      .header{background:linear-gradient(135deg,#3D1B6B,#5B2D8E);color:#fff;padding:20px 24px;display:flex;align-items:center;gap:16px;margin-bottom:20px;}
      .header h1{font-size:18px;font-weight:900;}
      .header .sub{font-size:12px;opacity:0.75;margin-top:2px;}
      .section{margin:0 20px 20px;background:#fff;border-radius:12px;border:1.5px solid #DDD0F0;overflow:hidden;}
      .section-title{background:linear-gradient(135deg,#5B2D8E15,#5B2D8E25);padding:10px 16px;font-weight:800;font-size:14px;color:#5B2D8E;border-bottom:1.5px solid #DDD0F0;}
      table{width:100%;border-collapse:collapse;}
      th{background:#F5F0FF;padding:8px 12px;text-align:left;font-size:11px;font-weight:700;color:#5B2D8E;letter-spacing:0.5px;text-transform:uppercase;}
      td{padding:9px 12px;border-bottom:1px solid #EEE8FF;font-size:12px;}
      tr:last-child td{border-bottom:none;}
      tr:nth-child(even) td{background:#FAFAF8;}
      .badge{display:inline-block;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;}
      .avatar{width:36px;height:36px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;color:#fff;}
      .score{font-weight:800;font-size:14px;}
      .card{border-radius:12px;border:1.5px solid #DDD0F0;padding:14px 16px;margin:0 20px 12px;}
      .card-title{font-weight:800;font-size:15px;margin-bottom:4px;}
      .card-sub{font-size:11px;color:#7B6B9A;margin-bottom:10px;}
      .grid2{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
      .stat{background:#F5F0FF;border-radius:8px;padding:8px 10px;}
      .stat-val{font-size:20px;font-weight:900;color:#5B2D8E;}
      .stat-lbl{font-size:10px;color:#7B6B9A;}
      .obs{background:#F5C84215;border:1px dashed #F5C84255;border-radius:8px;padding:8px 10px;font-size:11px;margin-top:6px;color:#5A4000;}
      .presente{color:#4CAF50;font-weight:700;} .ausente{color:#EF5350;font-weight:700;}
      .bar-wrap{height:8px;background:#EEE8FF;border-radius:4px;overflow:hidden;margin-top:4px;}
      .bar-fill{height:100%;border-radius:4px;}
      .footer{text-align:center;padding:16px;font-size:10px;color:#AAA;border-top:1px solid #EEE8FF;margin:0 20px;}
      .firmas{margin:32px 20px 20px;padding-top:24px;border-top:2px solid #DDD0F0;display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:end;}
      .firma-item{text-align:center;}
      .firma-linea{border-bottom:1px solid #1a1a2e;height:36px;margin-bottom:6px;max-width:220px;margin-left:auto;margin-right:auto;}
      .firma-nombre{font-size:12px;font-weight:700;color:#5B2D8E;}
      .firma-cargo{font-size:10px;color:#7B6B9A;}
      .print-btn{display:block;margin:20px auto;padding:12px 30px;background:#5B2D8E;color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;}
      @media print{.print-btn{display:none!important;}body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}
    </style>`;
  const fecha=new Date().toLocaleDateString("es-ES",{day:"2-digit",month:"long",year:"numeric"});
  const {firmas=true}=options||{};
  const firmasHtml=firmas?`
    <div class="firmas">
      <div class="firma-item"><div class="firma-linea"></div><div class="firma-nombre">José Hernán Díaz</div><div class="firma-cargo">Pastor</div></div>
      <div class="firma-item"><div class="firma-linea"></div><div class="firma-nombre">Cindy Vanessa Muñoz</div><div class="firma-cargo">Directora de Escuela Dominical</div></div>
    </div>`:"";
  const full=`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">${estilos}<title>${titulo}</title></head><body>
    <div class="header">
      <div>
        <h1>📋 ${titulo}</h1>
        <div class="sub">Escuela Dominical IPUE · Villanueva del Pardillo · ${fecha}</div>
      </div>
    </div>
    ${htmlContent}
    ${firmasHtml}
    <div class="footer">Generado por Sistema Escuela Dominical IPUE · ${fecha}</div>
    <button class="print-btn" onclick="window.print()">🖨️ Imprimir / Guardar PDF</button>
  </body></html>`;
  const blob=new Blob([full],{type:"text/html;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;
  a.target="_blank";
  a.rel="noopener noreferrer";
  a.click();
  setTimeout(()=>URL.revokeObjectURL(url),10000);
}

function generarPDFLandscape(titulo, htmlContent){
  const estilos=`
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
      @page{size:landscape;}
      *{margin:0;padding:0;box-sizing:border-box;}
      body{font-family:'Inter',sans-serif;background:#fff;color:#1a1a2e;font-size:12px;line-height:1.4;}
      .header{background:linear-gradient(135deg,#3D1B6B,#5B2D8E);color:#fff;padding:14px 20px;display:flex;align-items:center;gap:16px;margin-bottom:12px;}
      .header h1{font-size:16px;font-weight:900;}
      .header .sub{font-size:11px;opacity:0.75;margin-top:2px;}
      .cal-grid{width:100%;border-collapse:collapse;table-layout:fixed;}
      .cal-grid th{background:#5B2D8E;color:#fff;padding:6px 4px;font-size:10px;font-weight:800;text-align:center;}
      .cal-grid td{border:1px solid #DDD0F0;padding:4px;vertical-align:top;min-height:70px;}
      .cal-day{font-weight:800;color:#5B2D8E;font-size:11px;margin-bottom:4px;}
      .cal-entry{font-size:9px;background:#F5F0FF;border-radius:4px;padding:3px 5px;margin-bottom:3px;border-left:3px solid #5B2D8E;}
      .cal-entry.grupo{font-weight:700;color:#2D1B4E;}
      .footer{text-align:center;padding:10px;font-size:10px;color:#AAA;border-top:1px solid #EEE8FF;}
      .print-btn{display:block;margin:12px auto;padding:10px 24px;background:#5B2D8E;color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;}
      @media print{.print-btn{display:none!important;}body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}
    </style>`;
  const fecha=new Date().toLocaleDateString("es-ES",{day:"2-digit",month:"long",year:"numeric"});
  const full=`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">${estilos}<title>${titulo}</title></head><body>
    <div class="header">
      <div><h1>📅 ${titulo}</h1><div class="sub">Escuela Dominical IPUE · Villanueva del Pardillo · ${fecha}</div></div>
    </div>
    ${htmlContent}
    <div class="footer">Generado por Sistema Escuela Dominical IPUE · ${fecha}</div>
    <button class="print-btn" onclick="window.print()">🖨️ Imprimir / Guardar PDF</button>
  </body></html>`;
  const blob=new Blob([full],{type:"text/html;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;
  a.target="_blank";
  a.rel="noopener noreferrer";
  a.click();
  setTimeout(()=>URL.revokeObjectURL(url),10000);
}

function scoreColorHex(v){const n=parseFloat(v);if(isNaN(n))return"#AAA";if(n>=4)return"#4CAF50";if(n>=3)return"#F5A623";return"#EF5350";}
function claseColorHex(cl){return CLASE_COLORS[cl]||"#5B2D8E";}

function InformesPanel({data}){
  const{maestros,clases,familias,calificaciones,cronograma,evaluaciones,meriendas=[],criterios,videos=[],finanzas=DEFAULT_FINANZAS}=data;
  const crit=criterios||CRITERIOS;
  const ckeys=crit.map(c=>c.key);
  const ninos=Object.entries(clases).flatMap(([cl,arr])=>arr.map(n=>({...n,clase:cl})));

  const ninoAvg=(nombre,clase)=>{
    const e=calificaciones.filter(c=>c.alumno===nombre&&c.clase===clase);
    let t=0,cnt=0;e.forEach(ex=>{ckeys.forEach(k=>{const v=parseFloat(ex[k]);if(!isNaN(v)){t+=v;cnt++;}});});
    return cnt?(t/cnt).toFixed(1):null;
  };
  const maestroSesiones=(nombre)=>cronograma.filter(c=>c.maestro===nombre||c.auxiliar===nombre);
  const evalMaestro=(nombre)=>evaluaciones.find(e=>{const n1=(e.nombre||"").toLowerCase();const n2=nombre.toLowerCase();return n1.includes(n2.split(" ")[0])||n2.includes(n1.split(" ")[0]);});
  const gastoTotal=(m)=>((parseFloat(m?.meriendaCosto)||0)+(parseFloat(m?.trabajoManualCosto)||0));

  const finanzasMiniSection=()=>{
    const gastosComite=(finanzas.gastos||[]).reduce((s,g)=>s+(parseFloat(g.monto)||0),0);
    const gastosClases=(meriendas||[]).reduce((s,m)=>s+gastoTotal(m),0);
    const gastosActividades=(finanzas.actividades||[]).reduce((s,a)=>s+(parseFloat(a.gastos)||0),0);
    const ingresosActividades=(finanzas.actividades||[]).reduce((s,a)=>{
      const ef=parseFloat(a.ingresoEfectivo!=null?a.ingresoEfectivo:a.ingresos)||0;
      const tpv=parseFloat(a.ingresoTPV||0)||0;
      return s+ef+tpv;
    },0);
    const donativosTotal=(finanzas.donativos||[]).reduce((s,d)=>{
      const ef=parseFloat(d.efectivo!=null?d.efectivo:d.monto)||0;
      const tpv=parseFloat(d.tpv||0)||0;
      return s+ef+tpv;
    },0);
    const totalGastos=gastosComite+gastosClases+gastosActividades;
    const totalIngresos=ingresosActividades+donativosTotal;
    const neto=totalIngresos-totalGastos;
    const filasGastos=(finanzas.gastos||[]).map(g=>{
      const resp=g.responsable?displayMaestroNombre(g.responsable):"—";
      return `<tr>
        <td>${g.fecha||"—"}</td>
        <td><strong>${g.concepto||"—"}</strong></td>
        <td>${resp}</td>
        <td style="font-weight:700;color:#C62828">€${(parseFloat(g.monto)||0).toFixed(2)}</td>
      </tr>`;
    }).join("");
    const filasActiv=(finanzas.actividades||[]).map(a=>{
      const resp=a.responsable?displayMaestroNombre(a.responsable):"—";
      const ef=parseFloat(a.ingresoEfectivo!=null?a.ingresoEfectivo:a.ingresos)||0;
      const tpv=parseFloat(a.ingresoTPV||0)||0;
      const ing=ef+tpv;
      const gas=parseFloat(a.gastos)||0;
      const net=ing-gas;
      return `<tr>
        <td>${a.fecha||"—"}</td>
        <td><strong>${a.nombre||"—"}</strong></td>
        <td>${resp}</td>
        <td style="color:#2E7D32">€${ing.toFixed(2)}</td>
        <td style="color:#C62828">€${gas.toFixed(2)}</td>
        <td style="font-weight:700;color:${net>=0?"#2E7D32":"#C62828"}">€${net.toFixed(2)}</td>
      </tr>`;
    }).join("");
    const filasDon=(finanzas.donativos||[]).map(d=>{
      const resp=d.responsable?displayMaestroNombre(d.responsable):"—";
      const ef=parseFloat(d.efectivo!=null?d.efectivo:d.monto)||0;
      const tpv=parseFloat(d.tpv||0)||0;
      const tot=ef+tpv;
      return `<tr>
        <td>${d.fecha||"—"}</td>
        <td><strong>${d.concepto||"—"}</strong></td>
        <td>${d.tipo||"DONATIVO"}</td>
        <td>${resp}</td>
        <td style="color:#2E7D32">€${ef.toFixed(2)}</td>
        <td style="color:#2E7D32">€${tpv.toFixed(2)}</td>
        <td style="font-weight:700;color:#2E7D32">€${tot.toFixed(2)}</td>
      </tr>`;
    }).join("");
    if(totalGastos===0&&totalIngresos===0&&!filasGastos&&!filasActiv&&!filasDon)return"";
    return `
      <div class="section">
        <div class="section-title">💰 Resumen de Finanzas (Comité + Clases)</div>
        <div style="padding:10px 16px 4px;font-size:12px;color:#2D1B4E;display:flex;flex-wrap:wrap;gap:16px">
          <div><div style="color:#7B6B9A;font-size:11px">Total gastos</div><div style="font-weight:900;color:#C62828;font-size:18px">€${totalGastos.toFixed(2)}</div></div>
          <div><div style="color:#7B6B9A;font-size:11px">Total ingresos</div><div style="font-weight:900;color:#2E7D32;font-size:18px">€${totalIngresos.toFixed(2)}</div></div>
          <div><div style="color:#7B6B9A;font-size:11px">Resultado neto</div><div style="font-weight:900;color:${neto>=0?"#2E7D32":"#C62828"};font-size:18px">€${neto.toFixed(2)}</div></div>
        </div>
        <div style="padding:4px 16px 0;font-size:11px;color:#7B6B9A">Incluye gastos de clases (meriendas / trabajos manuales), gastos generales del comité, actividades y donativos.</div>
        <div style="margin-top:10px">
          <h4 style="margin:8px 0 4px;font-size:12px;color:#5B2D8E">🏛️ Gastos generales del comité</h4>
          <table>
            <thead><tr><th>Fecha</th><th>Concepto</th><th>Responsable</th><th>Monto</th></tr></thead>
            <tbody>${filasGastos||"<tr><td colspan='4' style='text-align:center;color:#AAA'>Sin gastos registrados</td></tr>"}</tbody>
          </table>
        </div>
        <div style="margin-top:10px">
          <h4 style="margin:8px 0 4px;font-size:12px;color:#2A96BC">🎉 Actividades del comité</h4>
          <table>
            <thead><tr><th>Fecha</th><th>Actividad</th><th>Responsable</th><th>Ingresos</th><th>Gastos</th><th>Neto</th></tr></thead>
            <tbody>${filasActiv||"<tr><td colspan='6' style='text-align:center;color:#AAA'>Sin actividades registradas</td></tr>"}</tbody>
          </table>
        </div>
        <div style="margin-top:10px">
          <h4 style="margin:8px 0 4px;font-size:12px;color:#2E7D32">🙏 Donativos / Votos</h4>
          <table>
            <thead><tr><th>Fecha</th><th>Detalle</th><th>Tipo</th><th>Responsable</th><th>Efec.</th><th>TPV</th><th>Total</th></tr></thead>
            <tbody>${filasDon||"<tr><td colspan='7' style='text-align:center;color:#AAA'>Sin donativos registrados</td></tr>"}</tbody>
          </table>
        </div>
      </div>`;
  };

  // ── Helper para mini gráficos de barras ──
  const barRow=(label,value,max,color)=>`<div style="display:flex;align-items:center;gap:8;margin-bottom:4;font-size:11px">
    <div style="width:110px;color:#7B6B9A">${label}</div>
    <div style="flex:1;background:#F5F0FF;border-radius:999px;overflow:hidden;height:8px;position:relative">
      <div style="width:${max>0?Math.min(100,(value/max)*100):0}%;background:${color};height:100%"></div>
    </div>
    <div style="width:50px;text-align:right;font-weight:700;color:#2D1B4E">${value}</div>
  </div>`;

  // ── Report 1: All Students ──
  const reportAlumnos=()=>{
    const rows=ninos.map(n=>{
      const avg=ninoAvg(n.nombre,n.clase);
      const fam=familias.find(f=>f.alumno===n.nombre);
      const asistencias=calificaciones.filter(c=>c.alumno===n.nombre&&c.clase===n.clase).length;
      const totalSes=maestroSesiones(maestros.find(m=>m.clase===n.clase&&m.cargo==="MAESTRO")?.nombre||"").length||0;
      const pct=totalSes>0?Math.round((asistencias/totalSes)*100):0;
      const scoreC=avg?scoreColorHex(avg):"#AAA";
      const obsCount=calificaciones.filter(c=>c.alumno===n.nombre&&c.clase===n.clase&&c.observacion).length;
      const fotoHtml=n.foto?`<img src="${n.foto}" alt="${displayNameAlumno(n)}" style="width:28px;height:28px;border-radius:50%;object-fit:cover;margin-right:8px;border:2px solid ${claseColorHex(n.clase)}33">`:`<div style="width:28px;height:28px;border-radius:50%;background:${claseColorHex(n.clase)}33;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:${claseColorHex(n.clase)};margin-right:8px">${getInitials(n.nombre)}</div>`;
      const bautizado=fam?.bautizado?"Sí":"No";
      const sellado=fam?.sellado?"Sí":"No";
      return `<tr>
        <td><div style="display:flex;align-items:center">${fotoHtml}<strong>${displayNameAlumno(n)}</strong></div></td>
        <td><span class="badge" style="background:${claseColorHex(n.clase)}22;color:${claseColorHex(n.clase)};border:1px solid ${claseColorHex(n.clase)}44">${n.clase}</span></td>
        <td>${n.edad||"—"}</td>
        <td>${fam?.cumpleanos||"—"}</td>
        <td>${fam?.padre||fam?.madre?"✅ Sí":"⚠️ No"}</td>
        <td>${bautizado}</td>
        <td>${sellado}</td>
        <td>${asistencias}/${totalSes} <small style="color:#7B6B9A">(${pct}%)</small></td>
        <td style="color:${scoreC};font-weight:800">${avg||"—"}</td>
        <td>${obsCount>0?obsCount+" obs.":"—"}</td>
      </tr>`;
    }).join("");
    const totalBaut=ninos.filter(n=>{const fam=familias.find(f=>f.alumno===n.nombre);return fam?.bautizado;}).length;
    const totalSell=ninos.filter(n=>{const fam=familias.find(f=>f.alumno===n.nombre);return fam?.sellado;}).length;
    const html=`
      <div class="section">
        <div class="section-title">📊 Resumen General · ${ninos.length} Alumnos</div>
        <div style="padding:10px 16px 4px">
          ${barRow("Bautizados",totalBaut,ninos.length,"#4CAF50")}
          ${barRow("Sellados",totalSell,ninos.length,"#5B2D8E")}
        </div>
        <table>
          <thead><tr><th>Alumno</th><th>Clase</th><th>Edad</th><th>Cumpleaños</th><th>Familia</th><th>Bautizado</th><th>Sellado</th><th>Asistencia</th><th>Promedio</th><th>Observac.</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`+finanzasMiniSection();
    generarPDF("Informe de Alumnos",html);
  };

  // ── Report states (hooks must be at top level) ──
  const[selMaestro,setSelMaestro]=useState(maestros[0]?.nombre||"");
  const[selNino,setSelNino]=useState(ninos[0]?.nombre||"");
  const[calendarYearMonth,setCalendarYearMonth]=useState(()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;});

  // ── Report 2: Individual Teacher ──
  const reportMaestro=()=>{
    const m=maestros.find(x=>x.nombre===selMaestro);
    if(!m)return;
    const sesiones=maestroSesiones(m.nombre).sort((a,b)=>a.fecha.localeCompare(b.fecha));
    const ev=evalMaestro(m.nombre);
    const avgEv=ev?evalAvg(ev,videoAvgForMaestro(m.nombre,videos,maestros)):videoAvgForMaestro(m.nombre,videos,maestros);
    const misNinos=clases[m.clase]||[];
    const cumpl=sesiones.length>0?Math.round((sesiones.filter(s=>s.leccion&&s.leccion!=="NO HAY CLASE"&&s.leccion!=="DIA DEL PADRE").length/sesiones.length)*100):100;
    const sesRows=sesiones.map(s=>{
      const mer=meriendas.find(x=>x.sesionId===s.id);
      const gastos=(parseFloat(mer?.meriendaCosto)||0)+(parseFloat(mer?.trabajoManualCosto)||0);
      const donativoParts=[];
      if(mer?.meriendaDonativo)donativoParts.push("merienda");
      if(mer?.trabajoManualDonativo)donativoParts.push("t. manual");
      const donativoNote=donativoParts.length>0?" <small style=\"color:#7B6B9A\">("+donativoParts.join(", ")+" donativo)</small>":"";
      return `<tr>
      <td>${formatFecha(s.fecha)}</td>
      <td><strong>${s.leccion||"—"}</strong></td>
      <td>${s.tema||"—"}</td>
      <td><span class="${s.maestro===m.nombre?"presente":"ausente"}">${s.maestro===m.nombre?"🎓 Maestro":"🤝 Auxiliar"}</span></td>
      <td>${gastos>0?"€"+gastos.toFixed(2):"—"}${donativoNote}</td>
    </tr>`;
    }).join("");
    const ninoRows=misNinos.map(n=>{
      const avg=ninoAvg(n.nombre,m.clase);
      const asist=calificaciones.filter(c=>c.alumno===n.nombre&&c.clase===m.clase).length;
      const fotoHtml=n.foto?`<img src="${n.foto}" alt="${displayNameAlumno(n)}" style="width:26px;height:26px;border-radius:50%;object-fit:cover;margin-right:6px;border:2px solid ${claseColorHex(m.clase)}33;vertical-align:middle">`:`<div style="width:26px;height:26px;border-radius:50%;background:${claseColorHex(m.clase)}33;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:${claseColorHex(m.clase)};margin-right:6px;vertical-align:middle">${getInitials(n.nombre)}</div>`;
      return`<tr>
        <td><div style="display:flex;align-items:center">${fotoHtml}<strong>${displayNameAlumno(n)}</strong></div></td>
        <td>${asist} sesiones</td>
        <td style="color:${avg?scoreColorHex(avg):"#AAA"};font-weight:800">${avg||"Sin calificar"}</td>
      </tr>`;
    }).join("");
    const evalRows=ev?EVAL_KEYS.map((k,j)=>`<tr><td>${EVAL_LABELS[j]}</td><td>${"★".repeat(ev[k]||0)}${"☆".repeat(5-(ev[k]||0))}</td><td style="font-weight:700">${ev[k]||0}/5</td></tr>`).join(""):"";
    const sesionesConVideo=sesiones.filter(s=>s.maestro===m.nombre&&VIDEO_CLASES.includes(s.grupo)&&s.leccion&&s.leccion!=="NO HAY CLASE");
    const getV=(sesionId)=>videos.find(v=>v.sesionId===sesionId&&v.maestro===m.nombre);
    const videoRows=sesionesConVideo.map(s=>{
      const v=getV(s.id);
      const score=v?videoScore(v):null;
      return`<tr>
        <td>${formatFecha(s.fecha)}</td>
        <td><strong>${s.leccion||"—"}</strong></td>
        <td>${s.grupo}</td>
        <td>${v?.hizo?"✅ Sí":"❌ No"}</td>
        <td>${v?.hizo?(v.calidad||"—")+"/5":"—"}</td>
        <td>${v?.hizo?(v.aTiempo?"✅ Sí":"No"):"—"}</td>
        <td style="font-weight:700">${score!=null?score.toFixed(1)+"/5":"—"}</td>
      </tr>`;
    }).join("");
    const videoSection=sesionesConVideo.length>0?`
      <div class="section">
        <div class="section-title">🎬 Envío de Videos de Clase</div>
        <p style="font-size:11px;color:#7B6B9A;padding:8px 16px 0">Videos requeridos para clases Corderitos, Vencedores y Conquistadores. Calidad 1-5 y envío a tiempo.</p>
        <table><thead><tr><th>Fecha</th><th>Lección</th><th>Grupo</th><th>Envió</th><th>Calidad</th><th>A tiempo</th><th>Score</th></tr></thead><tbody>${videoRows}</tbody></table>
      </div>`:"";
    const fotoHtml=m.foto?`<div style="margin-right:14px"><img src="${m.foto}" alt="${displayMaestroNombre(m.nombre)}" style="width:54px;height:54px;border-radius:50%;object-fit:cover;border:3px solid ${claseColorHex(m.clase)}33"></div>`:`<div style="width:54px;height:54px;border-radius:50%;background:${claseColorHex(m.clase)}22;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:900;color:${claseColorHex(m.clase)};margin-right:14px">${getInitials(m.nombre)}</div>`;
    const html=`
      <div class="card">
        <div style="display:flex;align-items:center;margin-bottom:10px">
          ${fotoHtml}
          <div>
            <div class="card-title" style="margin:0">${displayMaestroNombre(m.nombre)}</div>
            <div class="card-sub">${m.cargo} · Clase ${m.clase} · Certificado: ${m.certificado||"—"}</div>
          </div>
        </div>
        <div style="margin:6px 0 10px;padding:6px 10px;background:#F5F0FF;border-radius:10px;font-size:11px">
          ${barRow("Cumplimiento",cumpl,100,cumpl>=80?"#4CAF50":cumpl>=60?"#F5A623":"#EF5350")}
        </div>
        <div class="grid2">
          <div class="stat"><div class="stat-val">${sesiones.length}</div><div class="stat-lbl">Clases asignadas</div></div>
          <div class="stat"><div class="stat-val" style="color:${cumpl>=80?"#4CAF50":cumpl>=60?"#F5A623":"#EF5350"}">${cumpl}%</div><div class="stat-lbl">Cumplimiento</div></div>
          ${avgEv!=null?`<div class="stat"><div class="stat-val">${typeof avgEv==="number"?avgEv.toFixed(1):avgEv}/5</div><div class="stat-lbl">Evaluación (incl. videos)</div></div>`:""}
          <div class="stat"><div class="stat-val">${misNinos.length}</div><div class="stat-lbl">Alumnos en clase</div></div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">📅 Historial de Clases</div>
        <table><thead><tr><th>Fecha</th><th>Lección</th><th>Tema</th><th>Rol</th><th>Gastos</th></tr></thead><tbody>${sesRows||"<tr><td colspan='5' style='text-align:center;color:#AAA'>Sin clases asignadas</td></tr>"}</tbody></table>
      </div>
      ${videoSection}
      <div class="section">
        <div class="section-title">👦 Alumnos de ${m.clase}</div>
        <table><thead><tr><th>Alumno</th><th>Asistencia</th><th>Promedio</th></tr></thead><tbody>${ninoRows||"<tr><td colspan='3' style='text-align:center;color:#AAA'>Sin alumnos</td></tr>"}</tbody></table>
      </div>
      ${ev?`<div class="section"><div class="section-title">⭐ Evaluación del Administrador</div><table><thead><tr><th>Criterio</th><th>Calificación</th><th>Puntos</th></tr></thead><tbody>${evalRows}</tbody></table>${(ev.observaciones||"").trim()?`<div style="padding:12px 16px;border-top:1px solid #DDD0F0"><div style="font-size:11px;font-weight:700;color:#5B2D8E;margin-bottom:6px">Observaciones</div><div style="font-size:13px;color:#2D1B4E;white-space:pre-wrap">${String(ev.observaciones||"").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</div></div>`:""}</div>`:""}`+finanzasMiniSection();
    generarPDF(`Informe de ${displayMaestroNombre(m.nombre)}`,html);
  };

  // ── Report 4: Individual Student ──
  const reportNino=()=>{
    const n=ninos.find(x=>x.nombre===selNino);
    if(!n)return;
    const entries=calificaciones.filter(c=>c.alumno===n.nombre&&c.clase===n.clase).sort((a,b)=>new Date(a.fecha)-new Date(b.fecha));
    const fam=familias.find(f=>f.alumno===n.nombre);
    const avg=ninoAvg(n.nombre,n.clase);
    const totalSes=(cronograma.filter(c=>c.grupo===n.clase&&c.leccion&&c.leccion!=="NO HAY CLASE").length)||1;
    const asistPct=Math.round((entries.length/totalSes)*100);
    const scoreC=avg?scoreColorHex(avg):"#AAA";
    const sesRows=entries.map(e=>{
      let t=0,cnt=0;ckeys.forEach(k=>{const v=parseFloat(e[k]);if(!isNaN(v)){t+=v;cnt++;}});
      const ea=cnt?(t/cnt).toFixed(1):null;
      return"<tr><td>"+formatFecha(e.fecha)+"</td><td><strong>"+(e.leccion||"—")+"</strong></td>"+
        ckeys.map(k=>"<td style=\"color:"+scoreColorHex(e[k])+";font-weight:700\">"+(e[k]||"—")+"</td>").join("")+
        "<td style=\"color:"+(ea?scoreColorHex(ea):"#AAA")+";font-weight:800\">"+(ea||"—")+"</td>"+
        "<td style=\"font-size:11px;color:#7B6B9A\">"+(e.observacion||"")+"</td></tr>";
    }).join("");
    const obsRows=entries.filter(e=>e.observacion).map(e=>
      "<div style=\"padding:10px 14px;border-bottom:1px solid #EEE8FF\">"+
      "<div style=\"font-size:11px;color:#5B2D8E;font-weight:700\">"+(e.leccion||"—")+" · "+formatFecha(e.fecha)+"</div>"+
      "<div style=\"font-size:12px;color:#2D1B4E\">"+(e.observacion)+"</div></div>"
    ).join("");
    const padreRow=fam&&fam.padre&&fam.padre!=="(No registra)"?"<div style=\"font-size:12px;color:#7B6B9A\">👨 "+fam.padre+(fam.telPadre?" · 📞 "+fam.telPadre:"")+"</div>":"";
    const madreRow=fam&&fam.madre&&fam.madre!=="(No registra)"?"<div style=\"font-size:12px;color:#7B6B9A\">👩 "+fam.madre+(fam.telMadre?" · 📞 "+fam.telMadre:"")+"</div>":"";
    const bautizadoSellado="<div style=\"margin-top:8px;font-size:12px\">"+(fam?.bautizado?"<span style=\"color:#2E7D32;font-weight:700\">🙏 Bautizado</span>":"<span style=\"color:#7B6B9A\">Bautizado: No</span>")+" &nbsp; "+(fam?.sellado?"<span style=\"color:#5B2D8E;font-weight:700\">✨ Sellado</span>":"<span style=\"color:#7B6B9A\">Sellado: No</span>")+"</div>";
    const avgBox=avg?"<div style=\"text-align:center;background:"+scoreC+"22;border-radius:12px;padding:10px 14px\"><div style=\"font-size:28px;font-weight:900;color:"+scoreC+"\">"+avg+"</div><div style=\"font-size:10px;color:#7B6B9A\">/10</div></div>":"";
    const fotoHtml=n.foto?("<img src=\""+n.foto+"\" alt=\""+displayNameAlumno(n)+"\" style=\"width:52px;height:52px;border-radius:50%;object-fit:cover;border:3px solid "+claseColorHex(n.clase)+"33\">"):("<div style=\"width:52px;height:52px;border-radius:50%;background:"+claseColorHex(n.clase)+"33;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:900;color:"+claseColorHex(n.clase)+"\">"+getInitials(n.nombre)+"</div>");
    const historial=entries.length>0?
      "<div class=\"section\"><div class=\"section-title\">📊 Historial de Calificaciones ("+entries.length+" sesiones)</div>"+
      "<table><thead><tr><th>Fecha</th><th>Lección</th>"+crit.map(c=>"<th>"+c.logro+"</th>").join("")+"<th>Prom.</th><th>Observación</th></tr></thead>"+
      "<tbody>"+sesRows+"</tbody></table></div>"+
      (obsRows?"<div class=\"section\"><div class=\"section-title\">💬 Observaciones</div>"+obsRows+"</div>":"")
      :"<div style=\"text-align:center;padding:30px;color:#7B6B9A;font-style:italic\">Sin calificaciones registradas.</div>";
    const html=
      "<div class=\"card\" style=\"margin:0 20px 16px;border-left:4px solid "+claseColorHex(n.clase)+"\">"+
      "<div style=\"display:flex;gap:14px;align-items:center;margin-bottom:12px\">"+
      fotoHtml+
      "<div style=\"flex:1\"><div style=\"font-size:20px;font-weight:900;color:#2D1B4E\">"+displayNameAlumno(n)+"</div>"+
      "<div style=\"font-size:12px;color:#7B6B9A\">Clase: <strong>"+n.clase+"</strong> · Edad: <strong>"+(n.edad||"—")+"</strong></div>"+
      padreRow+madreRow+bautizadoSellado+"</div>"+avgBox+"</div>"+
      "<div style=\"display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:8px\">"+
      "<div class=\"stat\"><div class=\"stat-val\">"+entries.length+"</div><div class=\"stat-lbl\">Sesiones asistidas</div></div>"+
      "<div class=\"stat\"><div class=\"stat-val\">"+asistPct+"%</div><div class=\"stat-lbl\">Asistencia</div></div>"+
      "<div class=\"stat\"><div class=\"stat-val\" style=\"color:"+scoreC+"\">"+( avg||"—")+"</div><div class=\"stat-lbl\">Promedio general</div></div>"+
      "</div></div>"+historial+finanzasMiniSection();
    generarPDF("Informe: "+displayNameAlumno(n),html);
  };

  // ── Report 3: Class Summary ──
  const[selClase,setSelClase]=useState("CORDERITOS");
  const reportClase=()=>{
    const claseMaestro=maestros.find(m=>m.clase===selClase&&m.cargo==="MAESTRO");
    const claseAux=maestros.filter(m=>m.clase===selClase&&m.cargo==="AUXILIAR");
    const claseSesiones=cronograma.filter(c=>c.grupo===selClase&&c.leccion&&c.leccion!=="NO HAY CLASE").sort((a,b)=>a.fecha.localeCompare(b.fecha));
    const claseNinos=clases[selClase]||[];
    const totalGasto=meriendas.filter(m=>m.clase===selClase).reduce((s,m)=>s+(parseFloat(m.meriendaCosto)||0)+(parseFloat(m.trabajoManualCosto)||0),0);
    const sesRows=claseSesiones.map(s=>{
      const sesCalifs=calificaciones.filter(c=>c.clase===selClase&&c.sesionId===s.id);
      const m2=meriendas.find(x=>x.sesionId===s.id);
      let t=0,cnt=0;sesCalifs.forEach(e=>{ckeys.forEach(k=>{const v=parseFloat(e[k]);if(!isNaN(v)){t+=v;cnt++;}});});
      const avg2=cnt?(t/cnt).toFixed(1):null;
      const gasto=((parseFloat(m2?.meriendaCosto)||0)+(parseFloat(m2?.trabajoManualCosto)||0));
      const donativoParts2=[];
      if(m2?.meriendaDonativo)donativoParts2.push("merienda");
      if(m2?.trabajoManualDonativo)donativoParts2.push("t. manual");
      const donativoNote2=donativoParts2.length>0?" <small style=\"color:#7B6B9A\">("+donativoParts2.join(", ")+" donativo)</small>":"";
      const pct2=claseNinos.length?Math.round((sesCalifs.length/claseNinos.length)*100):0;
      return`<tr>
        <td>${formatFecha(s.fecha)}</td>
        <td><strong>${s.leccion}</strong></td>
        <td>${s.tema||"—"}</td>
        <td><div class="bar-wrap"><div class="bar-fill" style="width:${pct2}%;background:${pct2>=80?"#4CAF50":pct2>=60?"#F5A623":"#EF5350"}"></div></div><small>${sesCalifs.length}/${claseNinos.length} (${pct2}%)</small></td>
        <td style="color:${avg2?scoreColorHex(avg2):"#AAA"};font-weight:800">${avg2||"—"}</td>
        <td style="color:${gasto>0?"#2E7D32":"#AAA"}">${gasto>0?"€"+gasto.toFixed(2):"—"}${donativoNote2}</td>
      </tr>`;
    }).join("");
    const ninoRows2=claseNinos.map(n=>{
      const avg2=ninoAvg(n.nombre,selClase);
      const asist=calificaciones.filter(c=>c.alumno===n.nombre&&c.clase===selClase).length;
      const fam=familias.find(f=>f.alumno===n.nombre);
      const obsCount=calificaciones.filter(c=>c.alumno===n.nombre&&c.clase===selClase&&c.observacion).length;
      const fotoHtml=n.foto?`<img src="${n.foto}" alt="${displayNameAlumno(n)}" style="width:26px;height:26px;border-radius:50%;object-fit:cover;margin-right:6px;border:2px solid ${claseColorHex(selClase)}33">`:`<div style="width:26px;height:26px;border-radius:50%;background:${claseColorHex(selClase)}33;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:${claseColorHex(selClase)};margin-right:6px">${getInitials(n.nombre)}</div>`;
      return`<tr>
        <td><div style="display:flex;align-items:center">${fotoHtml}<strong>${displayNameAlumno(n)}</strong></div></td>
        <td>${n.edad||"—"}</td>
        <td>${fam?.cumpleanos||"—"}</td>
        <td>${fam?.bautizado?"Sí":"No"}</td>
        <td>${fam?.sellado?"Sí":"No"}</td>
        <td>${asist}/${claseSesiones.length}</td>
        <td style="color:${avg2?scoreColorHex(avg2):"#AAA"};font-weight:800">${avg2||"—"}</td>
        <td>${obsCount>0?obsCount+" obs.":"—"}</td>
      </tr>`;
    }).join("");
    const promedioClase=(()=>{let t=0,cnt=0;claseNinos.forEach(n=>{const a=ninoAvg(n.nombre,selClase);if(a){t+=parseFloat(a);cnt++;}});return cnt?(t/cnt).toFixed(1):"—";})();
    const totalSesionesAsistidas=calificaciones.filter(c=>c.clase===selClase).length;
    const posibleAsistencias=claseNinos.length*claseSesiones.length||1;
    const pctAsistGlobal=posibleAsistencias?Math.round((totalSesionesAsistidas/posibleAsistencias)*100):0;
    const html=`
      <div class="card">
        <div class="card-title" style="color:${claseColorHex(selClase)};font-size:18px">🏫 Clase ${selClase}</div>
        <div class="card-sub">${claseMaestro?`Maestro: ${displayMaestroNombre(claseMaestro.nombre)}`:"Sin maestro asignado"} ${claseAux.length?`· Auxiliar(es): ${claseAux.map(a=>displayMaestroNombre(a.nombre)).join(", ")}`:""}
        </div>
        <div class="grid2">
          <div class="stat"><div class="stat-val">${claseNinos.length}</div><div class="stat-lbl">Alumnos</div></div>
          <div class="stat"><div class="stat-val">${claseSesiones.length}</div><div class="stat-lbl">Sesiones realizadas</div></div>
          <div class="stat"><div class="stat-val" style="color:#2E7D32">€${totalGasto.toFixed(2)}</div><div class="stat-lbl">Gasto total</div></div>
          <div class="stat"><div class="stat-val" style="color:${claseColorHex(selClase)}">${promedioClase}</div><div class="stat-lbl">Promedio general</div></div>
        </div>
        <div style="margin-top:8px;padding:6px 10px;background:#F5F0FF;border-radius:10px;font-size:11px">
          ${barRow("Asistencia global",pctAsistGlobal,100, pctAsistGlobal>=80?"#4CAF50":pctAsistGlobal>=60?"#F5A623":"#EF5350")}
        </div>
      </div>
      <div class="section">
        <div class="section-title">📅 Sesiones de Clase</div>
        <table><thead><tr><th>Fecha</th><th>Lección</th><th>Tema</th><th>Asistencia</th><th>Promedio</th><th>Gasto</th></tr></thead>
        <tbody>${sesRows||"<tr><td colspan='6' style='text-align:center;color:#AAA'>Sin sesiones registradas</td></tr>"}</tbody></table>
      </div>
      <div class="section">
        <div class="section-title">👦 Alumnos</div>
        <table><thead><tr><th>Alumno</th><th>Edad</th><th>Cumpleaños</th><th>Bautizado</th><th>Sellado</th><th>Asistencia</th><th>Promedio</th><th>Observac.</th></tr></thead>
        <tbody>${ninoRows2||"<tr><td colspan='8' style='text-align:center;color:#AAA'>Sin alumnos</td></tr>"}</tbody></table>
      </div>`+finanzasMiniSection();
    generarPDF(`Informe Clase ${selClase}`,html);
  };

  // ── Report 5: Economic Summary ──
  const reportEconomico=()=>{
    const gastosMeriendasBruto=meriendas.reduce((s,m)=>s+gastoTotal(m),0);
    const donativosMeriendasTotal=meriendas.reduce((s,m)=>{
      let d=0;
      if(m.meriendaDonativo)d+=parseFloat(m.meriendaCosto)||0;
      if(m.trabajoManualDonativo)d+=parseFloat(m.trabajoManualCosto)||0;
      return s+d;
    },0);
    const gastosMeriendasNeto=gastosMeriendasBruto-donativosMeriendasTotal;
    const gastosComite=(finanzas.gastos||[]).reduce((s,g)=>s+(parseFloat(g.monto)||0),0);
    const gastosActividades=(finanzas.actividades||[]).reduce((s,a)=>s+(parseFloat(a.gastos)||0),0);
    const ingresosActividades=(finanzas.actividades||[]).reduce((s,a)=>{
      const ef=parseFloat(a.ingresoEfectivo!=null?a.ingresoEfectivo:a.ingresos)||0;
      const tpv=parseFloat(a.ingresoTPV||0)||0;
      return s+ef+tpv;
    },0);
    const donativosRawList=finanzas.donativos||[];
    const votosTotal=donativosRawList.filter(d=>d.tipo==="VOTO").reduce((s,d)=>{const ef=parseFloat(d.efectivo!=null?d.efectivo:d.monto)||0;const tpv=parseFloat(d.tpv||0)||0;return s+ef+tpv;},0);
    const donativosSoloTotal=donativosRawList.filter(d=>d.tipo!=="VOTO").reduce((s,d)=>{const ef=parseFloat(d.efectivo!=null?d.efectivo:d.monto)||0;const tpv=parseFloat(d.tpv||0)||0;return s+ef+tpv;},0);
    const ofrendaNinosTotal=(finanzas.ofrendaNinos||[]).reduce((s,o)=>s+(parseFloat(o.monto)||0),0);
    const totalRecaudado=ingresosActividades+votosTotal+donativosSoloTotal+ofrendaNinosTotal;
    const totalGastos=gastosMeriendasNeto+gastosComite+gastosActividades;
    const balanceTotal=totalRecaudado-totalGastos;
    if(totalGastos===0&&totalRecaudado===0){
      const html=`<div class="section"><div class="section-title">📊 Informe Económico</div><p style="padding:20px;font-size:13px;color:#7B6B9A;font-style:italic">No hay movimientos económicos registrados todavía.</p></div>`;
      generarPDF("Informe Económico",html);
      return;
    }
    const resumenGlobal=`
      <div class="section">
        <div class="section-title">💰 Resumen Económico General</div>
        <div style="padding:12px 18px;font-size:13px;color:#2D1B4E;">
          <div style="font-weight:800;margin-bottom:12px;color:#5B2D8E">📥 Total recaudado</div>
          <div style="display:flex;flex-wrap:wrap;gap:16px 24px;margin-bottom:8px">
            <span>Actividades: <strong style="color:#2E7D32">€${ingresosActividades.toFixed(2)}</strong></span>
            <span>Votos: <strong style="color:#2E7D32">€${votosTotal.toFixed(2)}</strong></span>
            <span>Donativos: <strong style="color:#2E7D32">€${donativosSoloTotal.toFixed(2)}</strong></span>
            <span>Ofrenda niños E.D.: <strong style="color:#2E7D32">€${ofrendaNinosTotal.toFixed(2)}</strong></span>
          </div>
          <div style="font-size:18px;font-weight:900;color:#2E7D32;margin-bottom:16px;border-top:1px solid #DDD0F0;padding-top:10px">Total recaudado: €${totalRecaudado.toFixed(2)}</div>
          <div style="font-weight:800;margin-bottom:12px;color:#5B2D8E">📤 Total gastado (restando donativos de meriendas/t. manual)</div>
          <div style="display:flex;flex-wrap:wrap;gap:16px 24px;margin-bottom:8px">
            <span>Clases (neto): <strong style="color:#C62828">€${gastosMeriendasNeto.toFixed(2)}</strong>${donativosMeriendasTotal>0?` <small style="color:#7B6B9A">(donativos descontados: €${donativosMeriendasTotal.toFixed(2)})</small>`:""}</span>
            <span>Comité: <strong style="color:#C62828">€${gastosComite.toFixed(2)}</strong></span>
            <span>Actividades: <strong style="color:#C62828">€${gastosActividades.toFixed(2)}</strong></span>
          </div>
          <div style="font-size:18px;font-weight:900;color:#C62828;margin-bottom:16px;border-top:1px solid #DDD0F0;padding-top:10px">Total gastado: €${totalGastos.toFixed(2)}</div>
          <div style="font-weight:800;font-size:20px;color:${balanceTotal>=0?"#2E7D32":"#C62828"};border:2px solid ${balanceTotal>=0?"#2E7D32":"#C62828"};border-radius:12px;padding:14px;text-align:center">Balance total: €${balanceTotal.toFixed(2)}</div>
          <div style="font-size:11px;color:#7B6B9A;margin-top:8px">Clases con gastos: ${CLASES_LIST.filter(cl=>meriendas.some(m=>m.clase===cl)).length}/${CLASES_LIST.length}</div>
        </div>
      </div>`;

    const seccionesClases=CLASES_LIST.map(cl=>{
      const merClase=meriendas.filter(m=>m.clase===cl);
      if(!merClase.length)return"";
      const totalClase=merClase.reduce((s,m)=>s+gastoTotal(m),0);
      const filasSesiones=merClase.map(m=>{
        const ses=cronograma.find(c=>c.id===m.sesionId)||{};
        const fecha=ses.fecha?formatFecha(ses.fecha):"—";
        const leccion=ses.leccion||"—";
        const maestro=ses.maestro?displayMaestroNombre(ses.maestro):"—";
        const aux=ses.auxiliar?displayMaestroNombre(ses.auxiliar):"—";
        const merTxt=m.merienda?String(m.merienda):"";
        const merCost=parseFloat(m.meriendaCosto)||0;
        const tmTxt=m.trabajoManual?String(m.trabajoManual):"";
        const tmCost=parseFloat(m.trabajoManualCosto)||0;
        const total=merCost+tmCost;
        const merDonativo=m.meriendaDonativo?" <small style=\"color:#7B6B9A\">(donativo)</small>":"";
        const tmDonativo=m.trabajoManualDonativo?" <small style=\"color:#7B6B9A\">(donativo)</small>":"";
        return `<tr>
          <td>${fecha}</td>
          <td><strong>${leccion}</strong></td>
          <td>${maestro}</td>
          <td>${aux}</td>
          <td>${merTxt||merCost>0?"🍎 "+(merTxt||"Merienda"):"—"}${merCost>0?" · €"+merCost.toFixed(2):""}${merDonativo}</td>
          <td>${tmTxt||tmCost>0?"✂️ "+(tmTxt||"T. manual"):"—"}${tmCost>0?" · €"+tmCost.toFixed(2):""}${tmDonativo}</td>
          <td style="font-weight:700;color:${total>0?"#2E7D32":"#7B6B9A"}">${total>0?"€"+total.toFixed(2):"—"}</td>
        </tr>`;
      }).join("");

      const porMaestro={};
      merClase.forEach(m=>{
        const ses=cronograma.find(c=>c.id===m.sesionId);
        if(!ses)return;
        const g=gastoTotal(m);
        if(!g)return;
        if(ses.maestro)porMaestro[ses.maestro]=(porMaestro[ses.maestro]||0)+g;
      });
      const filasMaestros=Object.entries(porMaestro).sort((a,b)=>b[1]-a[1]).map(([nombre,total])=>{
        const short=displayMaestroNombre(nombre);
        const info=maestros.find(x=>x.nombre===nombre);
        const cargo=info?.cargo||"MAESTRO";
        return `<tr>
          <td>${short}</td>
          <td>${cargo}</td>
          <td style="font-weight:800;color:#2E7D32">€${total.toFixed(2)}</td>
        </tr>`;
      }).join("");

      return `
        <div class="section">
          <div class="section-title">🏫 Clase ${cl}</div>
          <div style="padding:8px 16px;font-size:12px;color:#7B6B9A">Total de gastos registrados en esta clase: <strong style="color:#2E7D32">€${totalClase.toFixed(2)}</strong></div>
          <table>
            <thead><tr><th>Fecha</th><th>Lección</th><th>Maestro</th><th>Auxiliar</th><th>Merienda</th><th>Trabajo Manual</th><th>Total</th></tr></thead>
            <tbody>${filasSesiones||"<tr><td colspan='7' style='text-align:center;color:#AAA'>Sin gastos registrados</td></tr>"}</tbody>
          </table>
          <div style="margin-top:16px">
            <div style="font-weight:800;font-size:13px;margin-bottom:6px;color:#2D1B4E">👩‍🏫 Resumen por maestro (solo rol de maestro)</div>
            <table>
              <thead><tr><th>Maestro</th><th>Cargo</th><th>Total gastado</th></tr></thead>
              <tbody>${filasMaestros||"<tr><td colspan='3' style='text-align:center;color:#AAA'>Sin gastos por maestro</td></tr>"}</tbody>
            </table>
          </div>
        </div>`;
    }).join("");

    const gastosComiteRows=(finanzas.gastos||[]).map(g=>{
      const resp=g.responsable?displayMaestroNombre(g.responsable):"—";
      return `<tr>
        <td>${g.fecha||"—"}</td>
        <td><strong>${g.concepto||"—"}</strong></td>
        <td>${resp}</td>
        <td style="font-weight:700;color:#C62828">€${(parseFloat(g.monto)||0).toFixed(2)}</td>
      </tr>`;
    }).join("");
    const actividadesRows=(finanzas.actividades||[]).map(a=>{
      const resp=a.responsable?displayMaestroNombre(a.responsable):"—";
      const ingEf=parseFloat(a.ingresoEfectivo!=null?a.ingresoEfectivo:a.ingresos)||0;
      const ingTpv=parseFloat(a.ingresoTPV||0)||0;
      const ing=ingEf+ingTpv;
      const gas=parseFloat(a.gastos)||0;
      const net=ing-gas;
      return `<tr>
        <td>${a.fecha||"—"}</td>
        <td><strong>${a.nombre||"—"}</strong></td>
        <td>${resp}</td>
        <td style="color:#2E7D32">€${ingEf.toFixed(2)}</td>
        <td style="color:#2E7D32">€${ingTpv.toFixed(2)}</td>
        <td style="color:#2E7D32">€${ing.toFixed(2)}</td>
        <td style="color:#C62828">€${gas.toFixed(2)}</td>
        <td style="font-weight:700;color:${net>=0?"#2E7D32":"#C62828"}">€${net.toFixed(2)}</td>
      </tr>`;
    }).join("");
    const donativosRows=(finanzas.donativos||[]).map(d=>{
      const resp=d.responsable?displayMaestroNombre(d.responsable):"—";
      const ef=parseFloat(d.efectivo!=null?d.efectivo:d.monto)||0;
      const tpv=parseFloat(d.tpv||0)||0;
      const total=ef+tpv;
      return `<tr>
        <td>${d.fecha||"—"}</td>
        <td><strong>${d.concepto||"—"}</strong></td>
        <td>${d.tipo||"DONATIVO"}</td>
        <td>${resp}</td>
        <td style="color:#2E7D32">€${ef.toFixed(2)}</td>
        <td style="color:#2E7D32">€${tpv.toFixed(2)}</td>
        <td style="font-weight:700;color:#2E7D32">€${total.toFixed(2)}</td>
      </tr>`;
    }).join("");

    const ofrendaNinosRows=(finanzas.ofrendaNinos||[]).slice().sort((a,b)=>(b.fecha||"").localeCompare(a.fecha||"")).map(o=>{
      const resp=o.responsable?displayMaestroNombre(o.responsable):"—";
      return `<tr>
        <td>${o.fecha||"—"}</td>
        <td style="font-weight:700;color:#2E7D32">€${(parseFloat(o.monto)||0).toFixed(2)}</td>
        <td>${resp}</td>
      </tr>`;
    }).join("");

    const seccionComite=`
      <div class="section">
        <div class="section-title">🏛️ Comité de Escuela Dominical — Gastos Generales</div>
        <table>
          <thead><tr><th>Fecha</th><th>Concepto</th><th>Responsable</th><th>Monto</th></tr></thead>
          <tbody>${gastosComiteRows||"<tr><td colspan='4' style='text-align:center;color:#AAA'>Sin gastos registrados</td></tr>"}</tbody>
        </table>
      </div>`;

    const seccionActividades=`
      <div class="section">
        <div class="section-title">🎉 Actividades del Comité</div>
        <table>
          <thead><tr><th>Fecha</th><th>Actividad</th><th>Responsable</th><th>Efec.</th><th>TPV</th><th>Ingresos</th><th>Gastos</th><th>Neto</th></tr></thead>
          <tbody>${actividadesRows||"<tr><td colspan='8' style='text-align:center;color:#AAA'>Sin actividades registradas</td></tr>"}</tbody>
        </table>
      </div>`;

  const seccionDonativos=`
      <div class="section">
        <div class="section-title">🙏 Donativos / Votos</div>
        <table>
          <thead><tr><th>Fecha</th><th>Detalle</th><th>Tipo</th><th>Responsable</th><th>Efec.</th><th>TPV</th><th>Total</th></tr></thead>
          <tbody>${donativosRows||"<tr><td colspan='7' style='text-align:center;color:#AAA'>Sin donativos registrados</td></tr>"}</tbody>
        </table>
      </div>`;

    const seccionOfrendaNinos=`
      <div class="section">
        <div class="section-title">👧 Ofrenda de niños Escuela Dominical</div>
        <table>
          <thead><tr><th>Fecha</th><th>Monto</th><th>Registrado por</th></tr></thead>
          <tbody>${ofrendaNinosRows||"<tr><td colspan='3' style='text-align:center;color:#AAA'>Sin ofrendas registradas</td></tr>"}</tbody>
        </table>
      </div>`;

    const html=resumenGlobal+seccionesClases+seccionComite+seccionActividades+seccionDonativos+seccionOfrendaNinos;
    generarPDF("Informe Económico",html);
  };

  // ── Report 6: Programación mensual en PDF (cronograma detallado por día y clase) ──
  const reportCalendarioMensual=()=>{
    const year=parseInt(calendarYearMonth.slice(0,4),10);
    const month=parseInt(calendarYearMonth.slice(5,7),10);
    if(!year||!month||month<1||month>12){
      alert("Selecciona un mes válido.");
      return;
    }
    const monthNames=["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
    const monthNamesLower=["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
    const weekdayNamesLong=["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
    const monthLabel=monthNames[month-1]+" "+year;
    const prefix=`${year}-${String(month).padStart(2,"0")}-`;

    const byDate={};
    (cronograma||[]).forEach(c=>{
      if(!c.fecha||!c.fecha.startsWith(prefix))return;
      if(!c.leccion||c.leccion==="NO HAY CLASE")return;
      if(!byDate[c.fecha])byDate[c.fecha]=[];
      byDate[c.fecha].push(c);
    });
    const dates=Object.keys(byDate).sort();
    if(dates.length===0){
      alert("No hay programación con clase para "+monthLabel+".");
      return;
    }

    const sections=dates.map(fecha=>{
      const [y,m,d]=fecha.split("-").map(Number);
      const dt=new Date(y,m-1,d);
      const dayName=weekdayNamesLong[dt.getDay()];
      const dateStr=`${dayName} ${String(d).padStart(2,"0")} de ${monthNamesLower[m-1]} de ${y}`;
      const rows=byDate[fecha]
        .slice()
        .sort((a,b)=>a.grupo.localeCompare(b.grupo,"es"))
        .map(e=>{
          const color=claseColorHex(e.grupo);
          const maestro=e.maestro?displayMaestroNombre(e.maestro):"—";
          const aux=e.auxiliar?displayMaestroNombre(e.auxiliar):"—";
          const tema=(e.tema||"").trim();
          const temaStr=tema||"—";
          return `<tr>
            <td><span class="badge" style="background:${color}15;color:${color};border:1px solid ${color}55">${e.grupo}</span></td>
            <td><strong>${e.leccion||"—"}</strong></td>
            <td>${temaStr}</td>
            <td>${maestro}</td>
            <td>${aux}</td>
          </tr>`;
        }).join("");
      return `
        <div class="section">
          <div class="section-title">📅 ${dateStr}</div>
          <table>
            <thead>
              <tr>
                <th>Grupo</th>
                <th>Lección</th>
                <th>Tema</th>
                <th>Maestro</th>
                <th>Auxiliar</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`;
    }).join("");

    const html=sections;
    generarPDF("Programación "+monthLabel,html,{firmas:false});
  };

  return(
    <div style={{padding:"1rem 1rem 6.25rem"}}>
      <h2 style={S.title}>📄 Generar Informes PDF</h2>
      <div style={{background:"#F0FBFF",borderRadius:14,padding:"14px",marginBottom:18,fontSize:13,color:"#2A96BC",fontWeight:600}}>
        Los informes se abrirán en una nueva pestaña listos para imprimir o guardar como PDF.
      </div>

      {/* Report 1 - All Students */}
      <div style={{...S.card,borderLeft:"5px solid #5B2D8E",marginBottom:14}}>
        <div style={{fontWeight:800,fontSize:15,color:"#5B2D8E",marginBottom:4}}>📋 Informe de Alumnos</div>
        <div style={{fontSize:12,color:"#7B6B9A",marginBottom:14}}>Todos los alumnos con asistencia, promedio, cumpleaños y datos de familia.</div>
        <button style={{...S.btn("#5B2D8E","#FFFFFF",true),padding:"12px 20px",borderRadius:12,fontSize:14,width:"100%"}} onClick={reportAlumnos}>
          📥 Generar PDF — Todos los Alumnos ({ninos.length})
        </button>
      </div>

      {/* Report 2 - Individual Teacher */}
      <div style={{...S.card,borderLeft:"5px solid #E84F9B",marginBottom:14}}>
        <div style={{fontWeight:800,fontSize:15,color:"#E84F9B",marginBottom:4}}>👩‍🏫 Informe Individual de Maestro/Auxiliar</div>
        <div style={{fontSize:12,color:"#7B6B9A",marginBottom:12}}>Historial de clases, alumnos, evaluación y estadísticas personales.</div>
        <label style={S.label}>Seleccionar Maestro/Auxiliar</label>
        <select style={{...S.input,marginBottom:14}} value={selMaestro} onChange={e=>setSelMaestro(e.target.value)}>
          {[...maestros].sort((a,b)=>sortKeyFirstName(a.nombre).localeCompare(sortKeyFirstName(b.nombre),"es")).map(m=>(
            <option key={m.id} value={m.nombre}>{displayMaestroNombre(m.nombre)} — {m.cargo} ({m.clase})</option>
          ))}
        </select>
        <button style={{...S.btn("#E84F9B","#FFFFFF",true),padding:"12px 20px",borderRadius:12,fontSize:14,width:"100%"}} onClick={reportMaestro}>
          📥 Generar PDF — {selMaestro?displayMaestroNombre(selMaestro):"Selecciona uno"}
        </button>
      </div>

      {/* Report 3 - Class Summary */}
      <div style={{...S.card,borderLeft:"5px solid #4BBCE0",marginBottom:14}}>
        <div style={{fontWeight:800,fontSize:15,color:"#2A96BC",marginBottom:4}}>🏫 Informe General de Clase</div>
        <div style={{fontSize:12,color:"#7B6B9A",marginBottom:12}}>Resumen completo de la clase: sesiones, asistencia, promedios y gastos.</div>
        <label style={S.label}>Seleccionar Clase</label>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
          {CLASES_LIST.map(cl=>(
            <button key={cl} style={{...S.btn(selClase===cl?CLASE_COLORS[cl]:"#F5F0FF",selClase===cl?(cl==="VENCEDORES"?"#3D1B6B":"#FFFFFF"):"#2D1B4E"),padding:"8px 16px",borderRadius:20,fontSize:13}} onClick={()=>setSelClase(cl)}>{cl}</button>
          ))}
        </div>
        <button style={{...S.btn("#4BBCE0","#FFFFFF",true),padding:"12px 20px",borderRadius:12,fontSize:14,width:"100%"}} onClick={reportClase}>
          📥 Generar PDF — Clase {selClase} ({(clases[selClase]||[]).length} alumnos)
        </button>
      </div>

      {/* Report 4 - Individual Student */}
      <div style={{...S.card,borderLeft:"5px solid #4CAF50",marginBottom:14}}>
        <div style={{fontWeight:800,fontSize:15,color:"#2E7D32",marginBottom:4}}>👦 Informe Individual de Alumno</div>
        <div style={{fontSize:12,color:"#7B6B9A",marginBottom:12}}>Ficha personal con historial completo de asistencias, calificaciones y observaciones.</div>
        <label style={S.label}>Seleccionar Alumno</label>
        <select style={{...S.input,marginBottom:14}} value={selNino} onChange={e=>setSelNino(e.target.value)}>
          {ninos.sort((a,b)=>sortKeyFirstName(a.nombre).localeCompare(sortKeyFirstName(b.nombre),"es")).map(n=>(
            <option key={n.nombre+n.clase} value={n.nombre}>{displayNameAlumno(n)} — {n.clase}</option>
          ))}
        </select>
        <button style={{...S.btn("#4CAF50","#FFFFFF",true),padding:"12px 20px",borderRadius:12,fontSize:14,width:"100%"}} onClick={reportNino}>
          📥 Generar Informe — {selNino?shortDisplayName(selNino):"Selecciona uno"}
        </button>
      </div>
      {/* Report 5 - Economic Summary */}
      <div style={{...S.card,borderLeft:"5px solid #F5C842",marginBottom:14}}>
        <div style={{fontWeight:800,fontSize:15,color:"#B69100",marginBottom:4}}>💰 Informe Económico General</div>
        <div style={{fontSize:12,color:"#7B6B9A",marginBottom:12}}>Resumen de gastos de clases, gastos del comité, actividades y donativos.</div>
        <button style={{...S.btn("#F5C842","#3D1B6B",true),padding:"12px 20px",borderRadius:12,fontSize:14,width:"100%"}} onClick={reportEconomico}>
          📥 Generar Informe Económico
        </button>
      </div>

      {/* Report 6 - Programación mensual (PDF detallado por día y clase) */}
      <div style={{...S.card,borderLeft:"5px solid #7E57C2"}}>
        <div style={{fontWeight:800,fontSize:15,color:"#5E35B1",marginBottom:4}}>📅 Programación del mes</div>
        <div style={{fontSize:12,color:"#7B6B9A",marginBottom:12}}>Informe PDF por día: fecha como título y tabla Grupo, Lección, Tema, Maestro y Auxiliar.</div>
        <label style={S.label}>Elegir mes</label>
        <div style={{display:"flex",gap:10,marginBottom:14}}>
          <select style={{...S.input,marginBottom:0,flex:1}} value={calendarYearMonth?calendarYearMonth.slice(5,7):""} onChange={e=>setCalendarYearMonth(prev=>{const m=e.target.value;const y=prev?prev.slice(0,4):new Date().getFullYear();return y&&m?`${y}-${m}`:prev;})}>
            {["01","02","03","04","05","06","07","08","09","10","11","12"].map(m=>(
              <option key={m} value={m}>{["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"][parseInt(m,10)-1]}</option>
            ))}
          </select>
          <select style={{...S.input,marginBottom:0,flex:1}} value={calendarYearMonth?calendarYearMonth.slice(0,4):""} onChange={e=>setCalendarYearMonth(prev=>{const y=e.target.value;const m=prev?prev.slice(5,7):String(new Date().getMonth()+1).padStart(2,"0");return y&&m?`${y}-${m}`:prev;})}>
            {Array.from({length:8},(_,i)=>new Date().getFullYear()-2+i).map(y=>(<option key={y} value={String(y)}>{y}</option>))}
          </select>
        </div>
        <button style={{...S.btn("#7E57C2","#FFFFFF",true),padding:"12px 20px",borderRadius:12,fontSize:14,width:"100%"}} onClick={reportCalendarioMensual}>
          📥 Generar PDF — {calendarYearMonth?calendarYearMonth.replace("-","/")+"":""}
        </button>
      </div>
    </div>
  );
}

// ══════════ PETICIONES DE ORACIÓN ══════════
function PeticionesDashboard({peticiones,user,onUpdate}){
  const recent=(peticiones||[]).slice().sort((a,b)=>new Date(b.fecha)-new Date(a.fecha)).slice(0,5);
  if(!recent.length) return null;
  return(
    <div style={{...S.card,borderLeft:"5px solid #E84F9B",margin:"0 0 14px"}}>
      <div style={{fontWeight:800,color:"#E84F9B",fontSize:15,marginBottom:10}}>🙏 Peticiones de Oración</div>
      {recent.map((p,i)=>(
        <div key={p.id} style={{padding:"8px 0",borderBottom:i<recent.length-1?"1px solid #DDD0F0":"none"}}>
          <div style={{fontSize:13,color:"#2D1B4E",lineHeight:1.5}}>{p.texto}</div>
          <div style={{fontSize:11,color:"#7B6B9A",marginTop:3}}>
            {p.anonimo?"🔒 Anónimo":shortDisplayName(p.autor)} · {p.fecha?new Date(p.fecha).toLocaleDateString("es-ES",{day:"2-digit",month:"short"}):""}
          </div>
        </div>
      ))}
    </div>
  );
}

function PeticionesPanel({peticiones,user,onUpdate,isAdmin=false}){
  const[modal,setModal]=useState(false);
  const[form,setForm]=useState({texto:"",anonimo:false});
  const[editId,setEditId]=useState(null);
  const sorted=(peticiones||[]).slice().sort((a,b)=>new Date(b.fecha)-new Date(a.fecha));
  const canEdit=(p)=>isAdmin||p.autor===user;
  const openAdd=()=>{setForm({texto:"",anonimo:false});setEditId(null);setModal(true);};
  const openEdit=(p)=>{setForm({texto:p.texto,anonimo:p.anonimo});setEditId(p.id);setModal(true);};
  const save=()=>{
    if(!form.texto.trim())return;
    if(editId){
      onUpdate((peticiones||[]).map(p=>p.id===editId?{...p,texto:form.texto,anonimo:form.anonimo}:p));
    } else {
      onUpdate([...((peticiones||[])),{id:Date.now(),texto:form.texto,autor:user,anonimo:form.anonimo,fecha:new Date().toISOString()}]);
    }
    setModal(false);
  };
  return(
    <div style={{padding:"16px 0 20px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <h2 style={{...S.title,margin:0}}>🙏 Peticiones</h2>
        <button style={{...S.btn("#E84F9B"),padding:"10px 16px",fontSize:14}} onClick={openAdd}>+ Nueva</button>
      </div>
      {sorted.length===0&&<div style={{color:"#7B6B9A",textAlign:"center",padding:30,fontStyle:"italic"}}>Sin peticiones. ¡Añade la primera!</div>}
      {sorted.map(p=>(
        <div key={p.id} style={{...S.card,borderLeft:"5px solid #E84F9B",padding:"14px 16px"}}>
          <div style={{fontSize:14,color:"#2D1B4E",lineHeight:1.6,marginBottom:8}}>{p.texto}</div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:6}}>
            <div style={{fontSize:12,color:"#7B6B9A",display:"flex",alignItems:"center",gap:6}}>
              {p.anonimo?<span style={{...S.badge("#7B6B9A"),fontSize:11}}>🔒 Anónimo</span>:<span style={{...S.badge("#5B2D8E"),fontSize:11}}>👤 {shortDisplayName(p.autor)}</span>}
              <span>· {p.fecha?new Date(p.fecha).toLocaleDateString("es-ES",{day:"2-digit",month:"short",year:"numeric"}):""}</span>
            </div>
            {canEdit(p)&&(
              <button style={{...S.btn("#4BBCE0"),padding:"5px 10px",fontSize:12}} onClick={()=>openEdit(p)}>✏️</button>
            )}
          </div>
        </div>
      ))}
      <Modal open={modal} onClose={()=>setModal(false)} title={editId?"Editar Petición":"Nueva Petición de Oración"}>
        <div style={{background:"#FFF0F8",borderRadius:12,padding:"12px 14px",marginBottom:14,fontSize:13,color:"#7B6B9A"}}>Las peticiones son visibles para todos los maestros y auxiliares. Puedes hacerla anónima si lo prefieres.</div>
        <label style={S.label}>Petición</label>
        <textarea style={{...S.input,height:100,resize:"vertical",marginBottom:16}} value={form.texto} onChange={e=>setForm(f=>({...f,texto:e.target.value}))} placeholder="Escribe tu petición de oración..."/>
        <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",marginBottom:20,padding:"12px 14px",background:"#F5F0FF",borderRadius:12}}>
          <input type="checkbox" checked={!!form.anonimo} onChange={e=>setForm(f=>({...f,anonimo:e.target.checked}))} style={{width:22,height:22,accentColor:"#5B2D8E"}}/>
          <div>
            <div style={{fontWeight:700,fontSize:14}}>🔒 Petición anónima</div>
            <div style={{fontSize:12,color:"#7B6B9A"}}>Tu nombre no aparecerá</div>
          </div>
        </label>
        <button style={{...S.btn("#E84F9B","#FFFFFF",true),padding:14}} onClick={save}>🙏 Guardar Petición</button>
        {editId&&<button style={{...S.btn("#FFF0F0","#EF5350"),padding:12,marginTop:10,border:"1.5px solid #EF535044"}} onClick={()=>{if(confirmDelete("¿Eliminar esta petición de oración?")){onUpdate((peticiones||[]).filter(x=>x.id!==editId));setModal(false);}}}>🗑 Eliminar Petición</button>}
      </Modal>
    </div>
  );
}

// ══════════ FINANZAS PANEL (ADMIN) ══════════
function FinanzasPanel({finanzas,maestros,onUpdate}){
  const getTodayStr=()=>new Date().toISOString().slice(0,10);
  const[gastoForm,setGastoForm]=useState(()=>({fecha:getTodayStr(),concepto:"",monto:"",responsable:""}));
  const[actForm,setActForm]=useState(()=>({fecha:getTodayStr(),nombre:"",ingresoEfectivo:"",ingresoTPV:"",gastos:"",responsable:""}));
  const[donForm,setDonForm]=useState(()=>({fecha:getTodayStr(),concepto:"",efectivo:"",tpv:"",donante:"",responsableMaestro:""}));
  const[votoForm,setVotoForm]=useState(()=>({fecha:getTodayStr(),concepto:"",efectivo:"",tpv:"",responsable:"",otroNombre:""}));
  const[ofrendaForm,setOfrendaForm]=useState(()=>({fecha:getTodayStr(),monto:"",responsable:""}));

  const gastos=Array.isArray(finanzas?.gastos)?finanzas.gastos:[];
  const actividades=Array.isArray(finanzas?.actividades)?finanzas.actividades:[];
  const donativosRaw=Array.isArray(finanzas?.donativos)?finanzas.donativos:[];
  const ofrendaNinos=Array.isArray(finanzas?.ofrendaNinos)?finanzas.ofrendaNinos:[];
  const votos=donativosRaw.filter(d=>d.tipo==="VOTO");
  const donativos=donativosRaw.filter(d=>d.tipo!=="VOTO");

  const saveGasto=()=>{
    if(!gastoForm.concepto.trim()||!gastoForm.monto)return;
    const m=parseFloat(gastoForm.monto.replace(",","."));
    const nuevo={id:Date.now()+"-g",fecha:gastoForm.fecha||new Date().toISOString().slice(0,10),concepto:gastoForm.concepto.trim(),monto:isNaN(m)?0:m,responsable:gastoForm.responsable||""};
    onUpdate({...finanzas,gastos:[...gastos,nuevo]});
    setGastoForm({fecha:getTodayStr(),concepto:"",monto:"",responsable:gastoForm.responsable});
  };
  const deleteGasto=id=>{
    if(!confirmDelete("¿Eliminar este gasto del comité?"))return;
    onUpdate({...finanzas,gastos:gastos.filter(g=>g.id!==id)});
  };

  const saveActividad=()=>{
    if(!actForm.nombre.trim())return;
    const ingEf=parseFloat(actForm.ingresoEfectivo.replace(",",".")||"0");
    const ingTpv=parseFloat(actForm.ingresoTPV.replace(",",".")||"0");
    const gas=parseFloat(actForm.gastos.replace(",",".")||"0");
    const nueva={
      id:Date.now()+"-a",
      fecha:actForm.fecha||new Date().toISOString().slice(0,10),
      nombre:actForm.nombre.trim(),
      ingresoEfectivo:isNaN(ingEf)?0:ingEf,
      ingresoTPV:isNaN(ingTpv)?0:ingTpv,
      gastos:isNaN(gas)?0:gas,
      responsable:actForm.responsable||"",
    };
    onUpdate({...finanzas,actividades:[...actividades,nueva]});
    setActForm({fecha:getTodayStr(),nombre:"",ingresoEfectivo:"",ingresoTPV:"",gastos:"",responsable:actForm.responsable});
  };
  const deleteActividad=id=>{
    if(!confirmDelete("¿Eliminar esta actividad del comité?"))return;
    onUpdate({...finanzas,actividades:actividades.filter(a=>a.id!==id)});
  };

  const saveDonativo=()=>{
    if(!donForm.efectivo && !donForm.tpv)return;
    const mEf=parseFloat(donForm.efectivo.replace(",",".")||"0");
    const mTpv=parseFloat(donForm.tpv.replace(",",".")||"0");
    const responsable=donForm.responsableMaestro||donForm.donante||"";
    const nuevo={
      id:Date.now()+"-d",
      fecha:donForm.fecha||new Date().toISOString().slice(0,10),
      concepto:donForm.concepto.trim()||"Donativo",
      tipo:"DONATIVO",
      efectivo:isNaN(mEf)?0:mEf,
      tpv:isNaN(mTpv)?0:mTpv,
      responsable,
    };
    onUpdate({...finanzas,donativos:[...donativosRaw,nuevo]});
    setDonForm({fecha:getTodayStr(),concepto:"",efectivo:"",tpv:"",donante:donForm.donante,responsableMaestro:donForm.responsableMaestro});
  };
  const saveVoto=()=>{
    if(!votoForm.efectivo && !votoForm.tpv)return;
    const mEf=parseFloat(votoForm.efectivo.replace(",",".")||"0");
    const mTpv=parseFloat(votoForm.tpv.replace(",",".")||"0");
    const responsable=votoForm.responsable||votoForm.otroNombre||"";
    const nuevo={
      id:Date.now()+"-v",
      fecha:votoForm.fecha||new Date().toISOString().slice(0,10),
      concepto:votoForm.concepto.trim()||"Voto",
      tipo:"VOTO",
      efectivo:isNaN(mEf)?0:mEf,
      tpv:isNaN(mTpv)?0:mTpv,
      responsable,
    };
    onUpdate({...finanzas,donativos:[...donativosRaw,nuevo]});
    setVotoForm({fecha:getTodayStr(),concepto:"",efectivo:"",tpv:"",responsable:votoForm.responsable,otroNombre:votoForm.otroNombre});
  };
  const deleteDonativo=id=>{
    if(!confirmDelete("¿Eliminar este registro de donativo/voto?"))return;
    onUpdate({...finanzas,donativos:donativosRaw.filter(d=>d.id!==id)});
  };

  const saveOfrendaNinos=()=>{
    const m=parseFloat(ofrendaForm.monto.replace(",","."));
    if(isNaN(m)||m<=0)return;
    const nuevo={id:Date.now()+"-o",fecha:ofrendaForm.fecha||getTodayStr(),monto:m,responsable:ofrendaForm.responsable||""};
    onUpdate({...finanzas,ofrendaNinos:[...ofrendaNinos,nuevo]});
    setOfrendaForm({fecha:getTodayStr(),monto:"",responsable:ofrendaForm.responsable});
  };
  const deleteOfrendaNinos=id=>{
    if(!confirmDelete("¿Eliminar este registro de ofrenda?"))return;
    onUpdate({...finanzas,ofrendaNinos:ofrendaNinos.filter(o=>o.id!==id)});
  };

  const maestrosOpts=[...maestros].sort((a,b)=>sortKeyFirstName(a.nombre).localeCompare(sortKeyFirstName(b.nombre),"es"));

  return(
    <div style={{padding:"1rem 1rem 6.25rem"}}>
      <h2 style={S.title}>💰 Finanzas del Comité</h2>

      <div style={{...S.card,borderLeft:"5px solid #5B2D8E",marginBottom:14}}>
        <div style={{fontWeight:800,fontSize:15,color:"#5B2D8E",marginBottom:4}}>👧 Ofrenda de niños Escuela Dominical</div>
        <div style={{fontSize:12,color:"#7B6B9A",marginBottom:10}}>Registro de las ofrendas que entran cada domingo. Indica la fecha y quién la registró (maestro/auxiliar).</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:8,marginBottom:10}}>
          <input type="date" style={S.input} value={ofrendaForm.fecha} onChange={e=>setOfrendaForm(f=>({...f,fecha:e.target.value}))}/>
          <input style={S.input} placeholder="€ Monto" value={ofrendaForm.monto} onChange={e=>setOfrendaForm(f=>({...f,monto:e.target.value}))}/>
          <select style={S.input} value={ofrendaForm.responsable} onChange={e=>setOfrendaForm(f=>({...f,responsable:e.target.value}))}>
            <option value="">Quién registró</option>
            {maestrosOpts.map(m=><option key={m.id} value={m.nombre}>{displayMaestroNombre(m.nombre)} — {m.cargo}</option>)}
          </select>
        </div>
        <button style={{...S.btn("#5B2D8E","#FFFFFF",true),padding:10,fontSize:13,marginBottom:10}} onClick={saveOfrendaNinos}>➕ Añadir ofrenda</button>
        {ofrendaNinos.length===0&&<div style={{fontSize:12,color:"#7B6B9A",fontStyle:"italic"}}>Sin ofrendas registradas.</div>}
        {ofrendaNinos.slice().sort((a,b)=>(b.fecha||"").localeCompare(a.fecha||"")).map(o=>(
          <div key={o.id} style={{marginTop:8,padding:"8px 10px",borderRadius:10,background:"#F5F0FF",display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
            <div style={{fontSize:12,color:"#2D1B4E"}}>
              <div style={{fontWeight:700}}>€{(parseFloat(o.monto)||0).toFixed(2)}</div>
              <div style={{fontSize:11,color:"#7B6B9A"}}>{o.fecha} · Registrado por: {o.responsable?displayMaestroNombre(o.responsable):"—"}</div>
            </div>
            <button style={{...S.btn("#FFF0F0","#EF5350"),padding:"4px 8px",fontSize:11}} onClick={()=>deleteOfrendaNinos(o.id)}>🗑</button>
          </div>
        ))}
      </div>

      <div style={{...S.card,borderLeft:"5px solid #E84F9B",marginBottom:14}}>
        <div style={{fontWeight:800,fontSize:15,color:"#E84F9B",marginBottom:4}}>🏛️ Gastos del Comité</div>
        <div style={{fontSize:12,color:"#7B6B9A",marginBottom:10}}>Registra compras generales (materiales, regalos, transporte, etc.) con un responsable.</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:8,marginBottom:10}}>
          <input type="date" style={S.input} value={gastoForm.fecha} onChange={e=>setGastoForm(f=>({...f,fecha:e.target.value}))}/>
          <input style={S.input} placeholder="Concepto" value={gastoForm.concepto} onChange={e=>setGastoForm(f=>({...f,concepto:e.target.value}))}/>
          <input style={S.input} placeholder="€ Monto" value={gastoForm.monto} onChange={e=>setGastoForm(f=>({...f,monto:e.target.value}))}/>
          <select style={S.input} value={gastoForm.responsable} onChange={e=>setGastoForm(f=>({...f,responsable:e.target.value}))}>
            <option value="">Responsable</option>
            {maestrosOpts.map(m=><option key={m.id} value={m.nombre}>{displayMaestroNombre(m.nombre)} — {m.cargo}</option>)}
          </select>
        </div>
        <button style={{...S.btn("#E84F9B","#FFFFFF",true),padding:10,fontSize:13,marginBottom:10}} onClick={saveGasto}>➕ Añadir gasto</button>
        {gastos.length===0&&<div style={{fontSize:12,color:"#7B6B9A",fontStyle:"italic"}}>Sin gastos registrados.</div>}
        {gastos.slice().sort((a,b)=>(b.fecha||"").localeCompare(a.fecha||"")).map(g=>(
          <div key={g.id} style={{marginTop:8,padding:"8px 10px",borderRadius:10,background:"#FDF5F7",display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
            <div style={{fontSize:12,color:"#2D1B4E"}}>
              <div style={{fontWeight:700}}>{g.concepto}</div>
              <div style={{fontSize:11,color:"#7B6B9A"}}>{g.fecha} · {g.responsable?displayMaestroNombre(g.responsable):"Sin responsable"}</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontWeight:800,color:"#C62828",fontSize:13}}>€{(parseFloat(g.monto)||0).toFixed(2)}</span>
              <button style={{...S.btn("#FFF0F0","#EF5350"),padding:"4px 8px",fontSize:11}} onClick={()=>deleteGasto(g.id)}>🗑</button>
            </div>
          </div>
        ))}
      </div>

      <div style={{...S.card,borderLeft:"5px solid #4BBCE0",marginBottom:14}}>
        <div style={{fontWeight:800,fontSize:15,color:"#2A96BC",marginBottom:4}}>🎉 Actividades del Comité</div>
        <div style={{fontSize:12,color:"#7B6B9A",marginBottom:10}}>Registra actividades (ventas, rifas, comidas, etc.) con sus ingresos (efectivo / TPV) y gastos.</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:8,marginBottom:10}}>
          <input type="date" style={S.input} value={actForm.fecha} onChange={e=>setActForm(f=>({...f,fecha:e.target.value}))}/>
          <input style={S.input} placeholder="Nombre de la actividad" value={actForm.nombre} onChange={e=>setActForm(f=>({...f,nombre:e.target.value}))}/>
          <input style={S.input} placeholder="€ Efectivo" value={actForm.ingresoEfectivo} onChange={e=>setActForm(f=>({...f,ingresoEfectivo:e.target.value}))}/>
          <input style={S.input} placeholder="€ TPV" value={actForm.ingresoTPV} onChange={e=>setActForm(f=>({...f,ingresoTPV:e.target.value}))}/>
          <input style={S.input} placeholder="€ Gastos" value={actForm.gastos} onChange={e=>setActForm(f=>({...f,gastos:e.target.value}))}/>
          <select style={S.input} value={actForm.responsable} onChange={e=>setActForm(f=>({...f,responsable:e.target.value}))}>
            <option value="">Responsable</option>
            {maestrosOpts.map(m=><option key={m.id} value={m.nombre}>{displayMaestroNombre(m.nombre)} — {m.cargo}</option>)}
          </select>
        </div>
        <button style={{...S.btn("#4BBCE0","#FFFFFF",true),padding:10,fontSize:13,marginBottom:10}} onClick={saveActividad}>➕ Añadir actividad</button>
        {actividades.length===0&&<div style={{fontSize:12,color:"#7B6B9A",fontStyle:"italic"}}>Sin actividades registradas.</div>}
        {actividades.slice().sort((a,b)=>(b.fecha||"").localeCompare(a.fecha||"")).map(a=>{
          const ingEf=parseFloat(a.ingresoEfectivo!=null?a.ingresoEfectivo:a.ingresos)||0;
          const ingTpv=parseFloat(a.ingresoTPV||0)||0;
          const ing=ingEf+ingTpv;
          const gas=parseFloat(a.gastos)||0;
          const net=ing-gas;
          return(
            <div key={a.id} style={{marginTop:8,padding:"8px 10px",borderRadius:10,background:"#F0FAFF",display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
              <div style={{fontSize:12,color:"#2D1B4E"}}>
                <div style={{fontWeight:700}}>{a.nombre}</div>
                <div style={{fontSize:11,color:"#7B6B9A"}}>{a.fecha} · {a.responsable?displayMaestroNombre(a.responsable):"Sin responsable"}</div>
              </div>
              <div style={{textAlign:"right",fontSize:11}}>
                <div style={{color:"#2E7D32",fontWeight:700}}>Efec.: €{ingEf.toFixed(2)} · TPV: €{ingTpv.toFixed(2)}</div>
                <div style={{color:"#2E7D32",fontWeight:700}}>Ingresos totales: €{ing.toFixed(2)}</div>
                <div style={{color:"#C62828",fontWeight:700}}>Gastos: €{gas.toFixed(2)}</div>
                <div style={{fontWeight:800,color:net>=0?"#2E7D32":"#C62828"}}>Neto: €{net.toFixed(2)}</div>
              </div>
              <button style={{...S.btn("#FFF0F0","#EF5350"),padding:"4px 8px",fontSize:11}} onClick={()=>deleteActividad(a.id)}>🗑</button>
            </div>
          );
        })}
      </div>

      <div style={{...S.card,borderLeft:"5px solid #4CAF50",marginBottom:14}}>
        <div style={{fontWeight:800,fontSize:15,color:"#2E7D32",marginBottom:4}}>🙏 Donativos</div>
        <div style={{fontSize:12,color:"#7B6B9A",marginBottom:10}}>Registra donativos individuales con el nombre del donante y el desglose entre efectivo y TPV.</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:8,marginBottom:10}}>
          <input type="date" style={S.input} value={donForm.fecha} onChange={e=>setDonForm(f=>({...f,fecha:e.target.value}))}/>
          <input style={S.input} placeholder="Concepto" value={donForm.concepto} onChange={e=>setDonForm(f=>({...f,concepto:e.target.value}))}/>
          <input style={S.input} placeholder="€ Efectivo" value={donForm.efectivo} onChange={e=>setDonForm(f=>({...f,efectivo:e.target.value}))}/>
          <input style={S.input} placeholder="€ TPV" value={donForm.tpv} onChange={e=>setDonForm(f=>({...f,tpv:e.target.value}))}/>
          <select style={S.input} value={donForm.responsableMaestro} onChange={e=>setDonForm(f=>({...f,responsableMaestro:e.target.value,donante:e.target.value||f.donante}))}>
            <option value="">Responsable (maestro/aux)</option>
            {maestrosOpts.map(m=><option key={m.id} value={m.nombre}>{displayMaestroNombre(m.nombre)} — {m.cargo}</option>)}
          </select>
          <input style={S.input} placeholder="Otro donante (si aplica)" value={donForm.donante} onChange={e=>setDonForm(f=>({...f,donante:e.target.value}))}/>
        </div>
        <button style={{...S.btn("#4CAF50","#FFFFFF",true),padding:10,fontSize:13,marginBottom:10}} onClick={saveDonativo}>➕ Añadir donativo</button>
        {donativos.length===0&&<div style={{fontSize:12,color:"#7B6B9A",fontStyle:"italic"}}>Sin donativos registrados.</div>}
        {donativos.slice().sort((a,b)=>(b.fecha||"").localeCompare(a.fecha||"")).map(d=>{
          const ef=parseFloat(d.efectivo!=null?d.efectivo:d.monto)||0;
          const tpv=parseFloat(d.tpv||0)||0;
          const total=ef+tpv;
          return(
            <div key={d.id} style={{marginTop:8,padding:"8px 10px",borderRadius:10,background:"#F3FFF5",display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
              <div style={{fontSize:12,color:"#2D1B4E"}}>
                <div style={{fontWeight:700}}>{d.concepto||d.tipo}</div>
                <div style={{fontSize:11,color:"#7B6B9A"}}>{d.fecha} · Donante: {d.responsable||"—"}</div>
              </div>
              <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:2,fontSize:11}}>
                <span style={{fontWeight:700,color:"#2E7D32"}}>Efec.: €{ef.toFixed(2)} · TPV: €{tpv.toFixed(2)}</span>
                <span style={{fontWeight:800,color:"#2E7D32",fontSize:13}}>Total: €{total.toFixed(2)}</span>
              </div>
              <button style={{...S.btn("#FFF0F0","#EF5350"),padding:"4px 8px",fontSize:11}} onClick={()=>deleteDonativo(d.id)}>🗑</button>
            </div>
          );
        })}
      </div>

      <div style={{...S.card,borderLeft:"5px solid #F5C842"}}>
        <div style={{fontWeight:800,fontSize:15,color:"#B69100",marginBottom:4}}>📝 Votos</div>
        <div style={{fontSize:12,color:"#7B6B9A",marginBottom:10}}>Registra votos u otras promesas asignadas a un maestro/auxiliar, con su desglose entre efectivo y TPV.</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:8,marginBottom:10}}>
          <input type="date" style={S.input} value={votoForm.fecha} onChange={e=>setVotoForm(f=>({...f,fecha:e.target.value}))}/>
          <input style={S.input} placeholder="Concepto" value={votoForm.concepto} onChange={e=>setVotoForm(f=>({...f,concepto:e.target.value}))}/>
          <input style={S.input} placeholder="€ Efectivo" value={votoForm.efectivo} onChange={e=>setVotoForm(f=>({...f,efectivo:e.target.value}))}/>
          <input style={S.input} placeholder="€ TPV" value={votoForm.tpv} onChange={e=>setVotoForm(f=>({...f,tpv:e.target.value}))}/>
          <select style={S.input} value={votoForm.responsable} onChange={e=>setVotoForm(f=>({...f,responsable:e.target.value}))}>
            <option value="">Responsable</option>
            {maestrosOpts.map(m=><option key={m.id} value={m.nombre}>{displayMaestroNombre(m.nombre)} — {m.cargo}</option>)}
          </select>
          <input style={S.input} placeholder="Nombre si no es maestro" value={votoForm.otroNombre} onChange={e=>setVotoForm(f=>({...f,otroNombre:e.target.value}))}/>
        </div>
        <button style={{...S.btn("#F5C842","#3D1B6B",true),padding:10,fontSize:13,marginBottom:10}} onClick={saveVoto}>➕ Añadir voto</button>
        {votos.length===0&&<div style={{fontSize:12,color:"#7B6B9A",fontStyle:"italic"}}>Sin votos registrados.</div>}
        {votos.slice().sort((a,b)=>(b.fecha||"").localeCompare(a.fecha||"")).map(d=>{
          const ef=parseFloat(d.efectivo!=null?d.efectivo:d.monto)||0;
          const tpv=parseFloat(d.tpv||0)||0;
          const total=ef+tpv;
          return(
            <div key={d.id} style={{marginTop:8,padding:"8px 10px",borderRadius:10,background:"#FFF9E6",display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
              <div style={{fontSize:12,color:"#2D1B4E"}}>
                <div style={{fontWeight:700}}>{d.concepto||"Voto"}</div>
                <div style={{fontSize:11,color:"#7B6B9A"}}>{d.fecha} · Responsable: {d.responsable?displayMaestroNombre(d.responsable):"—"}</div>
              </div>
              <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:2,fontSize:11}}>
                <span style={{fontWeight:700,color:"#2E7D32"}}>Efec.: €{ef.toFixed(2)} · TPV: €{tpv.toFixed(2)}</span>
                <span style={{fontWeight:800,color:"#2E7D32",fontSize:13}}>Total: €{total.toFixed(2)}</span>
              </div>
              <button style={{...S.btn("#FFF0F0","#EF5350"),padding:"4px 8px",fontSize:11}} onClick={()=>deleteDonativo(d.id)}>🗑</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ══════════ ADMIN APP ══════════
function AdminApp({data,onUpdateData,onLogout,teacherPasswords,onUpdatePasswords,onRefreshData}){
  const[activeTab,setActiveTab]=useState("inicio");
  const[masTab,setMasTab]=useState("familias");
  const[alumnoSubTabInitial,setAlumnoSubTabInitial]=useState(null); // "bautizados" | "sellados" cuando se viene del dashboard
  const[adminPwForm,setAdminPwForm]=useState({current:"",master:"",new1:"",new2:"",error:"",ok:false});
  const[resetForm,setResetForm]=useState({maestro:"",newPw:"",master:"",error:"",ok:false});
  const[restoreBusy,setRestoreBusy]=useState(false);
  const backupFileInputRef=useRef(null);
  const tabs=[
    {id:"inicio",label:"Inicio",icon:"🏠"},
    {id:"horario",label:"Horario",icon:"📅"},
    {id:"calificaciones",label:"Calif.",icon:"📝"},
    {id:"evaluaciones",label:"Evaluac.",icon:"⭐"},
    {id:"clases",label:"Clases",icon:"🧒"},
    {id:"alumnos",label:"Alumnos",icon:"👦"},
    {id:"maestros",label:"Maestros",icon:"👩‍🏫"},
    {id:"mas",label:"Más",icon:"☰"},
  ];
  const useAlumnosSource=!(data.alumnos&&Array.isArray(data.alumnos)&&data.alumnos.length>0)?false:true;

  const handleMergeAlumnos=useCallback(async(idA,idB)=>{
    const alumnos=data.alumnos||[];
    const calificaciones=data.calificaciones||[];
    const aA=alumnos.find(a=>a.id===idA);
    const aB=alumnos.find(a=>a.id===idB);
    if(!aA||!aB)return;
    // Elegir como principal el que tenga más datos completos
    const scoreAlumno=a=>{
      let s=0;
      ["familia","padre","madre","telPadre","telMadre","nacimiento","foto","primerNombre","segundoNombre","primerApellido","segundoApellido"].forEach(k=>{
        if(a[k])s++;
      });
      if(a.bautizado)s++;
      if(a.sellado)s++;
      return s;
    };
    let aPrincipal=aA;
    let aDup=aB;
    if(scoreAlumno(aB)>scoreAlumno(aA)){
      aPrincipal=aB;
      aDup=aA;
    }
    // Fusionar datos personales: se prioriza el alumno principal y se rellenan huecos con datos del duplicado
    const alumnoFusionado={
      ...aPrincipal,
      familia:aPrincipal.familia||aDup.familia,
      padre:aPrincipal.padre||aDup.padre,
      madre:aPrincipal.madre||aDup.madre,
      telPadre:aPrincipal.telPadre||aDup.telPadre,
      telMadre:aPrincipal.telMadre||aDup.telMadre,
      nacimiento:aPrincipal.nacimiento||aDup.nacimiento,
      bautizado:aPrincipal.bautizado||aDup.bautizado,
      sellado:aPrincipal.sellado||aDup.sellado,
      foto:aPrincipal.foto||aDup.foto||null,
      primerNombre:(aPrincipal.primerNombre||aDup.primerNombre)||"",
      segundoNombre:(aPrincipal.segundoNombre||aDup.segundoNombre)||"",
      primerApellido:(aPrincipal.primerApellido||aDup.primerApellido)||"",
      segundoApellido:(aPrincipal.segundoApellido||aDup.segundoApellido)||"",
    };
    const nuevosAlumnos=alumnos
      .filter(a=>a.id!==aDup.id)
      .map(a=>a.id===aPrincipal.id?alumnoFusionado:a);
    const nuevasCalifs=calificaciones.map(c=>{
      if(samePersonName(c.alumno,aDup.nombre)){
        return {...c,alumno:aPrincipal.nombre,clase:normalizarClase(aPrincipal.clase)};
      }
      return c;
    });
    await onUpdateData("alumnos",nuevosAlumnos);
    await onUpdateData("calificaciones",nuevasCalifs);
  },[data.alumnos,data.calificaciones,onUpdateData]);

  const repairAlumnosYCalifs=useCallback(async()=>{
    const alumnosCopy=(data.alumnos||[]).map(a=>({...a}));
    const califsCopy=(data.calificaciones||[]).map(c=>({...c}));
    let changed=false;
    if(restoreFotosFromClases(alumnosCopy,data.clases))changed=true;
    if(restoreFotosFromFamilias(alumnosCopy,data.familias))changed=true;
    if(restoreAlumnoDataFromStored(alumnosCopy,data.clases,data.familias))changed=true;
    const {changed:califsChanged,calificaciones:nuevasCalifs}=repairCalifsToExistingAlumnos(califsCopy,alumnosCopy);
    if(califsChanged)changed=true;
    if(!changed){
      alert("No se encontraron datos adicionales para restaurar. Ya está todo sincronizado.");
      return;
    }
    await onUpdateData("alumnos",alumnosCopy);
    await onUpdateData("calificaciones",nuevasCalifs);
    alert("Datos de alumnos y calificaciones reparados. Si no ves los cambios, recarga la página.");
  },[data.alumnos,data.calificaciones,data.clases,data.familias,onUpdateData]);

  const saveAdminPassword=async()=>{
    const currentStored=data.adminProfile?.adminPassword||ADMIN_PASSWORD;
    if(!adminPwForm.current||adminPwForm.current!==currentStored){
      setAdminPwForm(f=>({...f,error:"Contraseña actual incorrecta",ok:false}));
      return;
    }
    if(adminPwForm.new1.length<4){
      setAdminPwForm(f=>({...f,error:"La nueva contraseña debe tener al menos 4 caracteres",ok:false}));
      return;
    }
    if(adminPwForm.new1!==adminPwForm.new2){
      setAdminPwForm(f=>({...f,error:"Las contraseñas nuevas no coinciden",ok:false}));
      return;
    }
    const nextProfile={...(data.adminProfile||{}),adminPassword:adminPwForm.new1};
    const ok=await onUpdateData("adminProfile",nextProfile);
    setAdminPwForm(f=>ok?{current:"",master:"",new1:"",new2:"",error:"",ok:true}:{...f,error:"No se pudo guardar. Revisa la conexión.",ok:false});
  };

  const resetTeacherPassword=async()=>{
    if(!resetForm.maestro){
      setResetForm(f=>({...f,error:"Selecciona un maestro o auxiliar",ok:false}));
      return;
    }
    if(resetForm.newPw.length<4){
      setResetForm(f=>({...f,error:"La nueva contraseña debe tener al menos 4 caracteres",ok:false}));
      return;
    }
    // Contraseña maestra: ADMIN_PASSWORD
    if(resetForm.master!==ADMIN_PASSWORD){
      setResetForm(f=>({...f,error:"Contraseña maestra incorrecta",ok:false}));
      return;
    }
    const ok=await onUpdatePasswords({...teacherPasswords,[resetForm.maestro]:resetForm.newPw});
    setResetForm(f=>ok?{maestro:"",newPw:"",master:"",error:"",ok:true}:{...f,error:"No se pudo guardar en la nube",ok:false});
  };

  const downloadFullBackup=()=>{
    try{
      const now=new Date();
      const stamp=now.toISOString().replace(/[:.]/g,"-");
      const payload={
        metadata:{
          app:"Escuela Dominical",
          respaldoGeneradoEn:now.toISOString(),
          tipo:"full-backup"
        },
        data
      };
      const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json;charset=utf-8"});
      const url=URL.createObjectURL(blob);
      const a=document.createElement("a");
      a.href=url;
      a.download=`escuela_dominical_backup_${stamp}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      alert("Copia de seguridad descargada correctamente.");
    }catch(e){
      console.error("Error generando copia de seguridad:",e);
      alert("No se pudo generar la copia de seguridad.");
    }
  };

  const handleRestoreBackupFile=async(e)=>{
    const file=e.target.files?.[0];
    if(!file)return;
    try{
      const text=await file.text();
      let parsed;
      try{
        parsed=JSON.parse(text);
      }catch(_err){
        alert("El archivo no es un JSON válido.");
        return;
      }
      const backupData=parsed?.data;
      if(!backupData||typeof backupData!=="object"){
        alert("La copia no tiene el formato esperado (falta el bloque data).");
        return;
      }
      if(!window.confirm("Se reemplazarán los datos actuales por los de la copia. Esta acción no se puede deshacer. ¿Continuar?")){
        return;
      }
      setRestoreBusy(true);
      const keysToRestore=["maestros","clases","cronograma","familias","alumnos","eventos","evaluaciones","calificaciones","peticiones","meriendas","clasesConfig","videos","finanzas","adminProfile"];
      for(const key of keysToRestore){
        if(Object.prototype.hasOwnProperty.call(backupData,key)){
          const ok=await onUpdateData(key,backupData[key]);
          if(ok===false)throw new Error(`No se pudo restaurar ${key}`);
        }
      }
      if(parsed&&Object.prototype.hasOwnProperty.call(parsed,"teacherPasswords")){
        const okPw=await onUpdatePasswords(parsed.teacherPasswords||{});
        if(okPw===false)throw new Error("No se pudo restaurar teacherPasswords");
      }
      alert("Copia restaurada correctamente. Se recomienda recargar la página para ver todos los cambios.");
    }catch(err){
      console.error("Error restaurando copia:",err);
      alert("No se pudo restaurar la copia de seguridad. Verifica el archivo e inténtalo de nuevo.");
    }finally{
      setRestoreBusy(false);
      if(backupFileInputRef.current)backupFileInputRef.current.value="";
    }
  };

  return(
    <div style={{background:"#F5F0FF",minHeight:"100dvh",paddingBottom:70}}>
      <div style={{background:"linear-gradient(135deg,#3D1B6B,#5B2D8E)",padding:"0.75rem 1rem",display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"0 2px 12px rgba(0,0,0,0.15)",position:"sticky",top:0,zIndex:100}}>
        <LogoImg height={38} onClick={()=>onRefreshData?.()} title="Actualizar datos"/>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{background:"#F5C84233",color:"#F5C842",borderRadius:20,padding:"4px 12px",fontSize:12,fontWeight:800}}>👑 ADMIN</span>
          <button style={{background:"rgba(255,255,255,0.18)",border:"none",borderRadius:10,padding:"8px 12px",color:"#FFFFFF",fontWeight:700,fontSize:13,cursor:"pointer"}} onClick={onLogout}>🚪 Salir</button>
        </div>
      </div>
      <div>
        {activeTab==="inicio"&&<AdminDashboard data={data} onUpdateData={onUpdateData} onGoToTab={(tabId,masSub)=>{setActiveTab(tabId);if(tabId==="alumnos"&&(masSub==="bautizados"||masSub==="sellados"))setAlumnoSubTabInitial(masSub);else if(masSub)setMasTab(masSub);}}/>}
        {activeTab==="horario"&&<CronogramaPanel cronograma={data.cronograma} maestros={data.maestros} onUpdate={v=>onUpdateData("cronograma",v)}/>}
        {activeTab==="calificaciones"&&<CalifAdminPanel calificaciones={data.calificaciones} clases={data.clases} criterios={data.criterios||CRITERIOS} onUpdate={v=>onUpdateData("calificaciones",v)} cronograma={data.cronograma} meriendas={data.meriendas||[]}/>}
        {activeTab==="evaluaciones"&&<EvaluacionesPanelUnificado evaluaciones={data.evaluaciones} onUpdate={v=>onUpdateData("evaluaciones",v)} videos={data.videos||[]} onUpdateVideos={v=>onUpdateData("videos",v)} cronograma={data.cronograma} onUpdateCronograma={v=>onUpdateData("cronograma",v)} maestros={data.maestros||[]}/>}
        {activeTab==="clases"&&<ClasesPanel readOnlyStudents={useAlumnosSource} clases={data.clases} onUpdate={useAlumnosSource?()=>{}:v=>onUpdateData("clases",v)} clasesConfig={data.clasesConfig} onUpdateClasesConfig={v=>onUpdateData("clasesConfig",v)} calificaciones={data.calificaciones} familias={data.familias} onUpdateFamilias={useAlumnosSource?()=>{}:v=>onUpdateData("familias",v)}/>}
        {activeTab==="alumnos"&&<AlumnosPanel alumnos={data.alumnos||[]} onUpdateAlumnos={v=>onUpdateData("alumnos",v)} clasesConfig={data.clasesConfig} initialSubTab={alumnoSubTabInitial} onSubTabConsumed={()=>setAlumnoSubTabInitial(null)} calificaciones={data.calificaciones||[]} onMergeAlumnos={handleMergeAlumnos}/>}
        {activeTab==="maestros"&&<MaestrosPanel maestros={data.maestros} onUpdate={v=>onUpdateData("maestros",v)}/>}
        {activeTab==="mas"&&(
          <div style={{padding:"1rem 1rem 0"}}>
            <div style={{display:"flex",gap:8,overflowX:"auto",marginBottom:16,paddingBottom:4}}>
              {[["familias","👨‍👩‍👧 Familias"],["eventos","📆 Eventos"],["cumpleanos","🎂 Cumple."],["finanzas","💰 Finanzas"],["informes","📄 Informes"],["perfilAdmin","👑 Admin"]].map(([id,label])=>(
                <button key={id} style={{...S.btn(masTab===id?"#5B2D8E":"#F5F0FF",masTab===id?"#FFFFFF":"#2D1B4E"),padding:"8px 14px",fontSize:13,flexShrink:0,borderRadius:20,whiteSpace:"nowrap"}} onClick={()=>setMasTab(id)}>{label}</button>
              ))}
            </div>
            {masTab==="familias"&&<FamiliasPanel readOnly={useAlumnosSource} familias={data.familias} onUpdate={v=>onUpdateData("familias",v)} clases={data.clases} onUpdateClases={useAlumnosSource?()=>{}:v=>onUpdateData("clases",v)}/>}
            {masTab==="eventos"&&<EventosPanel eventos={data.eventos} onUpdate={v=>onUpdateData("eventos",v)}/>}
            {masTab==="cumpleanos"&&<CumpleanosPanel maestros={data.maestros} familias={data.familias}/>}
            {masTab==="finanzas"&&<FinanzasPanel finanzas={data.finanzas||DEFAULT_FINANZAS} maestros={data.maestros} onUpdate={v=>onUpdateData("finanzas",v)}/>}
            {masTab==="informes"&&<InformesPanel data={data}/>}
            {masTab==="perfilAdmin"&&(
              <div style={{paddingBottom:20}}>
                <h2 style={S.title}>👑 Admin</h2>
                <div style={{...S.card,marginBottom:14}}>
                  <h3 style={{color:"#5B2D8E",fontWeight:800,fontSize:15,margin:"0 0 8px"}}>🗂️ Copia de seguridad</h3>
                  <p style={{fontSize:12,color:"#7B6B9A",margin:"0 0 10px"}}>
                    Descarga un archivo JSON con todos los datos actuales de la app, incluyendo clases, alumnos, cronograma,
                    evaluaciones y finanzas.
                  </p>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    <button
                      style={{...S.btn("#2A96BC","#FFFFFF",true),padding:"8px 14px",fontSize:13,borderRadius:10}}
                      onClick={downloadFullBackup}
                      disabled={restoreBusy}
                    >
                      💾 Descargar copia completa
                    </button>
                    <button
                      style={{...S.btn("#4CAF50","#FFFFFF",true),padding:"8px 14px",fontSize:13,borderRadius:10,opacity:restoreBusy?0.7:1}}
                      onClick={()=>backupFileInputRef.current?.click()}
                      disabled={restoreBusy}
                    >
                      ♻️ Restaurar copia
                    </button>
                    <input
                      ref={backupFileInputRef}
                      type="file"
                      accept="application/json,.json"
                      style={{display:"none"}}
                      onChange={handleRestoreBackupFile}
                    />
                  </div>
                  {restoreBusy&&<p style={{fontSize:12,color:"#2A96BC",margin:"10px 0 0"}}>Restaurando copia, por favor espera...</p>}
                </div>
                <div style={{...S.card,marginBottom:14}}>
                  <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:12}}>
                    <div style={{position:"relative",width:70,height:70}}>
                      {data.adminProfile?.foto
                        ? <img src={data.adminProfile.foto} alt="Admin" style={{width:70,height:70,borderRadius:"50%",objectFit:"cover",border:"3px solid #5B2D8E"}}/>
                        : <div style={{width:70,height:70,borderRadius:"50%",background:"#5B2D8E22",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:26,color:"#5B2D8E",border:"3px solid #DDD0F0"}}>{getInitials(data.adminProfile?.nombre||"Admin")}</div>
                      }
                      <label style={{position:"absolute",bottom:-4,right:-4,width:26,height:26,borderRadius:"50%",background:"#5B2D8E",border:"2px solid #FFFFFF",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:"#FFFFFF",cursor:"pointer"}}>
                        📷
                        <input
                          type="file"
                          accept="image/*"
                          style={{display:"none"}}
                          onChange={async e=>{
                            const file=e.target.files?.[0];
                            if(!file)return;
                            const compressed=await compressImage(file,128,0.5);
                            onUpdateData("adminProfile",{...(data.adminProfile||{}),foto:compressed});
                          }}
                        />
                      </label>
                    </div>
                    <div>
                      <h3 style={{color:"#5B2D8E",fontWeight:800,fontSize:15,margin:"0 0 4px"}}>💼 Datos visibles del admin</h3>
                      <p style={{fontSize:11,color:"#7B6B9A",margin:0}}>Aquí puedes configurar cómo se verá el administrador en los informes.</p>
                    </div>
                  </div>
                <div style={{...S.card,marginBottom:14}}>
                  <h3 style={{color:"#5B2D8E",fontWeight:800,fontSize:15,margin:"0 0 8px"}}>🩺 Reparar datos de alumnos y calificaciones</h3>
                  <p style={{fontSize:12,color:"#7B6B9A",margin:"0 0 10px"}}>
                    Si después de fusionar alumnos notas que alguna foto u observaciones de clases desaparecieron, puedes intentar restaurarlas desde los datos guardados en Clases, Familias y Calificaciones.
                    No se crearán alumnos nuevos; solo se completarán datos faltantes y se reasignarán calificaciones a los alumnos actuales.
                  </p>
                  <button
                    style={{...S.btn("#4BBCE0","#FFFFFF",true),padding:"8px 14px",fontSize:13,borderRadius:10}}
                    onClick={repairAlumnosYCalifs}
                  >
                    🔧 Reparar alumnos y calificaciones
                  </button>
                </div>
                  <label style={S.label}>Nombre del administrador</label>
                  <input
                    style={{...S.input,marginBottom:10}}
                    value={data.adminProfile?.nombre||""}
                    onChange={e=>onUpdateData("adminProfile",{...(data.adminProfile||{}),nombre:e.target.value})}
                    placeholder="Ej: Coordinador Escuela Dominical"
                  />
                  <p style={{fontSize:11,color:"#7B6B9A",margin:0}}>Solo se usa para mostrar en informes u otras pantallas de administración.</p>
                </div>
                <div style={{...S.card,marginBottom:14}}>
                  <h3 style={{color:"#5B2D8E",fontWeight:800,fontSize:15,marginBottom:10}}>🔐 Cambiar contraseña de administrador</h3>
                  <p style={{fontSize:11,color:"#7B6B9A",marginBottom:6}}>Esta contraseña se usará para entrar como administrador (además de la contraseña maestra fija).</p>
                  <p style={{fontSize:11,color:"#9E9E9E",marginBottom:10,fontStyle:"italic"}}>Contraseña maestra (fija): <strong>{ADMIN_PASSWORD}</strong></p>
                  <label style={S.label}>Contraseña actual</label>
                  <input type="password" style={{...S.input,marginBottom:10}} value={adminPwForm.current} onChange={e=>setAdminPwForm(f=>({...f,current:e.target.value,error:"",ok:false}))}/>
                  <label style={S.label}>Nueva contraseña</label>
                  <input type="password" style={{...S.input,marginBottom:10}} value={adminPwForm.new1} onChange={e=>setAdminPwForm(f=>({...f,new1:e.target.value,error:"",ok:false}))}/>
                  <label style={S.label}>Confirmar nueva contraseña</label>
                  <input type="password" style={{...S.input,marginBottom:10}} value={adminPwForm.new2} onChange={e=>setAdminPwForm(f=>({...f,new2:e.target.value,error:"",ok:false}))}/>
                  {adminPwForm.error&&<div style={{color:"#EF5350",fontSize:12,fontWeight:700,marginBottom:8}}>{adminPwForm.error}</div>}
                  {adminPwForm.ok&&<div style={{color:"#4CAF50",fontSize:12,fontWeight:700,marginBottom:8}}>Contraseña de admin actualizada.</div>}
                  <button style={{...S.btn("#5B2D8E","#FFFFFF",true),padding:12}} onClick={saveAdminPassword}>💾 Guardar contraseña admin</button>
                </div>
                <div style={S.card}>
                  <h3 style={{color:"#5B2D8E",fontWeight:800,fontSize:15,marginBottom:10}}>🔑 Restablecer contraseña de maestro/auxiliar</h3>
                  <p style={{fontSize:11,color:"#7B6B9A",marginBottom:10}}>Usa la <strong>contraseña maestra de administrador</strong> para poder cambiar la contraseña de cualquier maestro o auxiliar.</p>
                  <label style={S.label}>Seleccionar maestro/auxiliar</label>
                  <select
                    style={{...S.input,marginBottom:10}}
                    value={resetForm.maestro}
                    onChange={e=>setResetForm(f=>({...f,maestro:e.target.value,error:"",ok:false}))}
                  >
                    <option value="">— Selecciona —</option>
                    {[...data.maestros].sort((a,b)=>sortKeyFirstName(a.nombre).localeCompare(sortKeyFirstName(b.nombre),"es")).map(m=>(
                      <option key={m.id} value={m.nombre}>{displayMaestroNombre(m.nombre)} — {m.cargo} ({m.clase})</option>
                    ))}
                  </select>
                  <label style={S.label}>Nueva contraseña</label>
                  <input
                    type="password"
                    style={{...S.input,marginBottom:10}}
                    value={resetForm.newPw}
                    onChange={e=>setResetForm(f=>({...f,newPw:e.target.value,error:"",ok:false}))}
                  />
                  <label style={S.label}>Contraseña maestra (solo admin)</label>
                  <input
                    type="password"
                    style={{...S.input,marginBottom:10}}
                    value={resetForm.master}
                    onChange={e=>setResetForm(f=>({...f,master:e.target.value,error:"",ok:false}))}
                    placeholder="Contraseña maestra de administrador"
                  />
                  {resetForm.error&&<div style={{color:"#EF5350",fontSize:12,fontWeight:700,marginBottom:8}}>{resetForm.error}</div>}
                  {resetForm.ok&&<div style={{color:"#4CAF50",fontSize:12,fontWeight:700,marginBottom:8}}>Contraseña actualizada para el maestro seleccionado.</div>}
                  <button style={{...S.btn("#E84F9B","#FFFFFF",true),padding:12}} onClick={resetTeacherPassword}>🔑 Restablecer contraseña</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <BottomNav tabs={tabs} active={activeTab} onSelect={setActiveTab}/>
    </div>
  );
}

// ══════════ MAIN ══════════