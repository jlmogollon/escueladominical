// ══════════ MAIN ══════════
function App(){
  const[user,setUser]=useState(null);
  const[loading,setLoading]=useState(true);
  const[teacherPasswords,setTeacherPasswords]=useState({});
  const[installPrompt,setInstallPrompt]=useState(null);
  const[showInstallBanner,setShowInstallBanner]=useState(false);
  const[installDone,setInstallDone]=useState(false);
  const[showIosInstallBanner,setShowIosInstallBanner]=useState(false);
  const isIosStandalone=typeof window!=="undefined"&&!!window.navigator.standalone;
  const hiddenAtRef=useRef(null);
  const MIN_BACKGROUND_HOURS=5;
  useEffect(()=>{
    const onVis=()=>{
      if(document.visibilityState==="hidden")hiddenAtRef.current=Date.now();
      if(document.visibilityState==="visible"&&hiddenAtRef.current!==null){
        const hours=(Date.now()-hiddenAtRef.current)/3600000;
        hiddenAtRef.current=null;
        if(hours>=MIN_BACKGROUND_HOURS)window.location.reload();
      }
    };
    document.addEventListener("visibilitychange",onVis);
    return ()=>document.removeEventListener("visibilitychange",onVis);
  },[]);
  useEffect(()=>{
    flushPendingWrites();
    const onOnline=()=>{flushPendingWrites();};
    window.addEventListener("online",onOnline);
    return ()=>window.removeEventListener("online",onOnline);
  },[]);
  const[data,setData]=useState({
    maestros:INITIAL_MAESTROS,
    clases:INITIAL_CLASES,
    cronograma:INITIAL_CRONOGRAMA,
    familias:INITIAL_FAMILIAS,
    alumnos:INITIAL_ALUMNOS,
    eventos:INITIAL_EVENTOS,
    evaluaciones:INITIAL_EVALUACIONES,
    calificaciones:[],
    criterios:CRITERIOS,
    peticiones:[],
    meriendas:[],
    clasesConfig:DEFAULT_CLASES_CONFIG,
    videos:[],
    finanzas:DEFAULT_FINANZAS,
    adminProfile:null,
  });
  const loadInitialData=useCallback(async(silent)=>{
    if(!silent)setLoading(true);
    try{
      const loaded={};
      for(const k of["maestros","clases","cronograma","familias","alumnos","eventos","evaluaciones","calificaciones","peticiones","meriendas","clasesConfig","videos","finanzas","adminProfile"]){
        const v=await loadData(k);if(v!==null)loaded[k]=v;
      }
      const familias=loaded.familias??INITIAL_FAMILIAS;
      let alumnos=loaded.alumnos;
      if(alumnos==null||!Array.isArray(alumnos)||alumnos.length===0){
        if(familias&&Array.isArray(familias)&&familias.length>0){
          alumnos=familias.map(f=>({ id:f.id, nombre:(f.alumno||"").trim(), clase:(f.clase||"").trim().toUpperCase().replace(/\s+/g,"_")||"CORDERITOS", nacimiento:f.nacimiento||null, padre:f.padre||"", madre:f.madre||"", telPadre:f.telPadre||"", telMadre:f.telMadre||"", familia:f.familia||"", bautizado:!!f.bautizado, sellado:!!f.sellado, foto:f.foto||null }));
          saveData("alumnos",alumnos);
        }else alumnos=INITIAL_ALUMNOS;
      }
      const calificaciones=loaded.calificaciones??[];
      const missingCalifs=getMissingAlumnosFromCalificaciones(calificaciones,alumnos);
      const missingClases=getMissingAlumnosFromClases(loaded.clases,alumnos);
      const seenKey=new Set();
      const missing=[];
      [...missingCalifs,...missingClases].forEach(m=>{
        const key=(m.nombre||"").trim()+"|"+m.clase;
        if(seenKey.has(key))return;
        seenKey.add(key);
        missing.push(m);
      });
      if(missing.length>0){
        const usedIds=new Set((alumnos||[]).map(a=>a.id));
        missing.forEach((m,i)=>{
          let id=Date.now()+i;
          while(usedIds.has(id))id++; usedIds.add(id);
          alumnos=[...alumnos,{ id, nombre:m.nombre.trim(), clase:m.clase, nacimiento:null, padre:"", madre:"", telPadre:"", telMadre:"", familia:"", bautizado:false, sellado:false, foto:m.foto||null }];
        });
        await saveData("alumnos",alumnos);
      }
      let datosRestaurados=restoreFotosFromClases(alumnos,loaded.clases);
      if(restoreFotosFromFamilias(alumnos,loaded.familias))datosRestaurados=true;
      if(restoreAlumnoDataFromStored(alumnos,loaded.clases,loaded.familias))datosRestaurados=true;
      if(datosRestaurados)await saveData("alumnos",alumnos);
      const dataToSet={ maestros:loaded.maestros??INITIAL_MAESTROS, clases:loaded.clases??INITIAL_CLASES, cronograma:loaded.cronograma??INITIAL_CRONOGRAMA, familias, alumnos, eventos:loaded.eventos??INITIAL_EVENTOS, evaluaciones:loaded.evaluaciones??INITIAL_EVALUACIONES, calificaciones, criterios:CRITERIOS, peticiones:loaded.peticiones??[], meriendas:loaded.meriendas??[], clasesConfig:loaded.clasesConfig??DEFAULT_CLASES_CONFIG, videos:loaded.videos??[], finanzas:loaded.finanzas??DEFAULT_FINANZAS, adminProfile:loaded.adminProfile??null };
      setData(dataToSet);
      const pw=await loadData("teacherPasswords");if(pw)setTeacherPasswords(pw);
    }catch(e){
      console.error("Error al cargar datos desde Firestore:",e&&e.message?e.message:e);
    }
    setLoading(false);
  },[]);
  useEffect(()=>{ loadInitialData(false); },[loadInitialData]);
  useEffect(()=>{
    if(!getDbNow())return;
    const unsub=subscribeData((key,val)=>{
      if(key==="teacherPasswords")setTeacherPasswords(val||{});
      else if(key==="alumnos"&&Array.isArray(val)){
        // No perder fotos: si el servidor devuelve alumnos sin foto, conservar la que teníamos en estado
        setData(d=>{
          const prev=d.alumnos||[];
          const merged=val.map(a=>{
            if(a.foto)return a;
            const p=prev.find(x=>x.id===a.id||(samePersonName(x.nombre,a.nombre)&&normalizarClase(x.clase)===normalizarClase(a.clase)));
            return p&&p.foto?{...a,foto:p.foto}:a;
          });
          return{...d,alumnos:merged};
        });
      }else setData(d=>({...d,[key]:val}));
    });
    return unsub;
  },[]);
  const saveMaestroSyncRef=useRef(null);
  const updateData=useCallback(async(key,val)=>{
    if(key==="maestros"&&Array.isArray(val)){
      saveMaestroSyncRef.current=null;
      setData(d=>{
        const oldMaestros=d.maestros||[];
        const replacements=[];
        val.forEach(m=>{const old=oldMaestros.find(o=>o.id===m.id);if(old&&old.nombre!==m.nombre)replacements.push({from:old.nombre,to:m.nombre});});
        let newCronograma=d.cronograma||[];
        let newEval=d.evaluaciones||[];
        replacements.forEach(({from,to})=>{
          newCronograma=newCronograma.map(ent=>({...ent,maestro:ent.maestro===from?to:ent.maestro,auxiliar:ent.auxiliar===from?to:ent.auxiliar}));
          newEval=newEval.map(e=>({...e,nombre:e.nombre===from?to:e.nombre}));
        });
        saveMaestroSyncRef.current=replacements.length?{cronograma:newCronograma,evaluaciones:newEval}:null;
        return{...d,maestros:val,cronograma:newCronograma,evaluaciones:newEval};
      });
      await saveData("maestros",val);
      const extra=saveMaestroSyncRef.current;
      if(extra){await saveData("cronograma",extra.cronograma);await saveData("evaluaciones",extra.evaluaciones);}
      return;
    }
    setData(d=>({...d,[key]:val}));
    return await saveData(key,val);
  },[]);
  const updatePw=useCallback(async(pws)=>{setTeacherPasswords(pws);const ok=await saveData("teacherPasswords",pws);return ok;},[]);

  // Opción de instalar web app: Android (beforeinstallprompt) e iOS (instrucciones Añadir a pantalla de inicio)
  useEffect(()=>{
    const onBeforeInstall=(e)=>{ e.preventDefault(); setInstallPrompt(e); setShowInstallBanner(true); };
    const onInstalled=()=>{ setInstallDone(true); setShowInstallBanner(false); setInstallPrompt(null); };
    window.addEventListener("beforeinstallprompt",onBeforeInstall);
    window.addEventListener("appinstalled",onInstalled);
    const isIosDevice=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
    if(isIosDevice&&!navigator.standalone)setShowIosInstallBanner(true);
    return ()=>{ window.removeEventListener("beforeinstallprompt",onBeforeInstall); window.removeEventListener("appinstalled",onInstalled); };
  },[]);
  const runInstallPrompt=async()=>{
    if(!installPrompt)return;
    installPrompt.prompt();
    const {outcome}=await installPrompt.userChoice;
    if(outcome==="accepted")setShowInstallBanner(false);
  };

  // Todo se desprende de alumnos: si hay lista de alumnos, clases y familias se derivan de ella (fuente de verdad). Se fusionan encargosFamilia/fotoFamilia guardados.
  const dataWithDerived=useMemo(()=>{
    try {
      const d=data||{};
      const alumnos=d.alumnos;
      const cfg=d.clasesConfig||DEFAULT_CLASES_CONFIG;
      let clases=d.clases;
      let familias=d.familias;
      if(alumnos&&Array.isArray(alumnos)&&alumnos.length>0){
        clases=deriveClases(alumnos,cfg);
        const derivedFam=deriveFamilias(alumnos);
        const stored=Array.isArray(d.familias)?d.familias:[];
        if(stored.length>0){
          const byFamilyKey={};
          stored.forEach(f=>{const k=f.familyKey||f.familia||f.alumno;if(k&&!byFamilyKey[k])byFamilyKey[k]={encargosFamilia:f.encargosFamilia,fotoFamilia:f.fotoFamilia};});
          familias=derivedFam.map(f=>{const x=byFamilyKey[f.familyKey];return {...f,encargosFamilia:x?.encargosFamilia??f.encargosFamilia,fotoFamilia:x?.fotoFamilia??f.fotoFamilia};});
        }else familias=derivedFam;
      }
      if(!clases||typeof clases!=="object")clases=INITIAL_CLASES;
      if(!Array.isArray(familias))familias=INITIAL_FAMILIAS;
      return { ...d, clases, familias };
    }catch(err){ console.error("dataWithDerived",err); var d=data||{}; return { ...d, clases: (d.clases&&typeof d.clases==="object")?d.clases:INITIAL_CLASES, familias: Array.isArray(d.familias)?d.familias:INITIAL_FAMILIAS }; }
  },[data]);

  const refreshData=useCallback(()=>{ loadInitialData(true); },[loadInitialData]);
  const screen = !user
    ? <LoginScreen onLogin={setUser}/>
    : user==="admin"
      ? <AdminApp data={dataWithDerived} onUpdateData={updateData} onLogout={()=>setUser(null)} teacherPasswords={teacherPasswords} onUpdatePasswords={updatePw} onRefreshData={refreshData}/>
      : <TeacherApp user={user} data={dataWithDerived} onLogout={()=>setUser(null)} onUpdateData={updateData} teacherPasswords={teacherPasswords} onUpdatePasswords={updatePw} onRefreshData={refreshData}/>;

  if(loading){
    return(
      <div style={{minHeight:"100dvh",background:"linear-gradient(160deg,#3D1B6B,#5B2D8E)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:20}}>
        <LogoLogin/>
        <div style={{color:"#FFFFFF",fontSize:16,fontWeight:700}}>Cargando...</div>
      </div>
    );
  }
  return (
    <ErrorBoundary>
      <div style={{width:"100%",maxWidth:"100vw",overflowX:"hidden",minHeight:"100dvh",touchAction:"pan-y pinch-zoom",position:"relative"}}>
        {screen}
        {showInstallBanner&&installPrompt&&!installDone&&(
          <div style={{position:"fixed",bottom:0,left:0,right:0,background:"linear-gradient(135deg,#3D1B6B,#5B2D8E)",color:"#FFFFFF",padding:"12px 16px",display:"flex",alignItems:"center",gap:12,boxShadow:"0 -4px 20px rgba(0,0,0,0.2)",zIndex:9999}}>
            <div style={{flex:1,fontSize:14,fontWeight:700}}>📲 Instalar Escuela Dominical en tu dispositivo</div>
            <button onClick={runInstallPrompt} style={{background:"#F5C842",color:"#3D1B6B",border:"none",borderRadius:12,padding:"10px 18px",fontWeight:800,fontSize:14,cursor:"pointer",whiteSpace:"nowrap"}}>Instalar</button>
            <button onClick={()=>setShowInstallBanner(false)} style={{background:"transparent",color:"rgba(255,255,255,0.9)",border:"none",padding:8,fontSize:18,cursor:"pointer",lineHeight:1}} aria-label="Cerrar">×</button>
          </div>
        )}
        {showIosInstallBanner&&!isIosStandalone&&(
          <div style={{position:"fixed",bottom:0,left:0,right:0,background:"linear-gradient(135deg,#3D1B6B,#5B2D8E)",color:"#FFFFFF",padding:"14px 16px",boxShadow:"0 -4px 20px rgba(0,0,0,0.2)",zIndex:9999}}>
            <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
              <div style={{flex:1}}>
                <div style={{fontSize:15,fontWeight:800,marginBottom:6}}>📲 Instalar en iPhone/iPad</div>
                <div style={{fontSize:13,opacity:0.95,lineHeight:1.4}}>Pulsa el botón <strong>Compartir</strong> (□↑) abajo en Safari y luego <strong>«Añadir a pantalla de inicio»</strong>. La app quedará como un icono en tu pantalla.</div>
              </div>
              <button onClick={()=>setShowIosInstallBanner(false)} style={{background:"transparent",color:"rgba(255,255,255,0.9)",border:"none",padding:6,fontSize:20,cursor:"pointer",lineHeight:1,flexShrink:0}} aria-label="Cerrar">×</button>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

const rootElement = document.getElementById("root");
if (rootElement) {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(<App />);
  } catch (err) {
    console.error("Boot error:", err);
    rootElement.innerHTML = "<div style=\"padding:24px;font-family:system-ui;max-width:500px\"><h2 style=\"color:#5B2D8E\">Error al cargar</h2><pre style=\"background:#f0f0f0;padding:12px;border-radius:8px;overflow:auto;font-size:12px\">" + (err && (err.message || String(err))) + "</pre><p style=\"color:#666;font-size:13px\">Abre la pestaña Console (F12) para más detalles.</p></div>";
  }
}
