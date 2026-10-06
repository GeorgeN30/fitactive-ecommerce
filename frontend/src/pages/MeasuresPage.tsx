import { useState, useMemo } from "react";
import ProfileLayout from "../components/ProfileLayout";
import { useAuth } from "../context/AuthContext";

export default function MeasuresPage() {
  const { user, updateProfile } = useAuth();
  
  const isFemale = ["Femenino", "Mujer", "female"].includes(user?.genero ?? "");
  
  // Default values based on gender
  const defaultAltura = isFemale ? 160 : 175;
  const defaultPecho = isFemale ? 90 : 100;
  const defaultCintura = isFemale ? 70 : 85;
  const defaultCadera = isFemale ? 95 : 95;
  const defaultMuslo = isFemale ? 55 : 55;

  // States
  const [altura, setAltura] = useState(user?.altura || defaultAltura);
  const [pecho, setPecho] = useState(user?.medida_pecho || defaultPecho);
  const [cintura, setCintura] = useState(user?.medida_cintura || defaultCintura);
  const [cadera, setCadera] = useState(user?.medida_cadera || defaultCadera);
  const [muslo, setMuslo] = useState(user?.medida_muslo || defaultMuslo);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (updateProfile) {
        await updateProfile({
          altura: Number(altura),
          medida_pecho: Number(pecho),
          medida_cintura: Number(cintura),
          medida_cadera: Number(cadera),
          medida_muslo: Number(muslo),
        });
      }
      setMsg("¡Medidas guardadas con éxito!");
      setTimeout(() => setMsg(""), 3000);
    } catch {
      setMsg("Error al guardar medidas");
    } finally {
      setSaving(false);
    }
  }

  // Dynamic body math - Realistic mannequin based on gender
  const bodyMetrics = useMemo(() => {
    const center = 150;
    
    // Scale vertically based on height (baseline 170cm)
    // Limits: min 140cm, max 220cm maps to 0.85 to 1.15 scale
    const heightScale = Math.max(0.85, Math.min(1.15, altura / 170));
    
    // Proportional offsets
    const chestOffset = (pecho - defaultPecho) * 0.7;
    const waistOffset = (cintura - defaultCintura) * 0.7;
    const hipsOffset = (cadera - defaultCadera) * 0.7;
    const thighOffset = (muslo - defaultMuslo) * 0.7;
    
    const neckW = isFemale ? 18 : 24;
    
    // Y coordinates scaled
    const baseYShoulder = 60;
    const baseYChest = isFemale ? 110 : 115;
    const baseYWaist = 180;
    const baseYHips = 240;
    const baseYCrotch = 270;
    const baseYThigh = 295;
    const baseYLegBottom = 350;

    const yShoulder = baseYShoulder; // Shoulders stay anchored
    const yChest = baseYShoulder + (baseYChest - baseYShoulder) * heightScale;
    const yWaist = baseYShoulder + (baseYWaist - baseYShoulder) * heightScale;
    const yHips = baseYShoulder + (baseYHips - baseYShoulder) * heightScale;
    const yCrotch = baseYShoulder + (baseYCrotch - baseYShoulder) * heightScale;
    const yThigh = baseYShoulder + (baseYThigh - baseYShoulder) * heightScale;
    const yLegBottom = baseYShoulder + (baseYLegBottom - baseYShoulder) * heightScale;

    // Widths
    // Males have wider base shoulders and chest, straighter waist
    const baseWShoulder = isFemale ? 55 : 75;
    const baseWChest = isFemale ? 45 : 52;
    const baseWWaist = isFemale ? 34 : 42;
    const baseWHips = isFemale ? 52 : 45;
    const baseWLeg = isFemale ? 22 : 25;

    const wShoulder = baseWShoulder + (chestOffset * 0.15); 
    const wChest = baseWChest + (chestOffset * 0.5);
    const wWaist = baseWWaist + (waistOffset * 0.5);
    const wHips = baseWHips + (hipsOffset * 0.5);
    const wLeg = baseWLeg + (thighOffset * 0.6);

    const pathD = `
      M ${center - neckW/2}, 20
      L ${center + neckW/2}, 20
      L ${center + neckW/2}, 45
      
      C ${center + neckW/2}, 50  ${center + wShoulder - 15}, 53  ${center + wShoulder}, ${yShoulder}
      
      C ${center + wShoulder}, ${yChest-30}  ${center + wChest + 8}, ${yChest-25}  ${center + wChest}, ${yChest}
      
      C ${center + wChest - 2}, ${yChest + 25}  ${center + wWaist + 2}, ${yWaist - 25}  ${center + wWaist}, ${yWaist}
      
      C ${center + wWaist - 2}, ${yWaist + 25}  ${center + wHips - 4}, ${yHips - 25}  ${center + wHips}, ${yHips}
      
      C ${center + wHips + 2}, ${yHips + 20}  ${center + wLeg + 15}, ${yThigh - 15}  ${center + wLeg + 10}, ${yThigh}
      C ${center + wLeg + 5}, ${yThigh + 20}  ${center + wLeg}, ${yLegBottom - 20}  ${center + wLeg}, ${yLegBottom}
      L ${center + 8}, ${yLegBottom}
      
      C ${center + 8}, ${yCrotch+30}  ${center + 4}, ${yCrotch}  ${center}, ${yCrotch}
      C ${center - 4}, ${yCrotch}  ${center - 8}, ${yCrotch+30}  ${center - 8}, ${yLegBottom}
      
      L ${center - wLeg}, ${yLegBottom}
      C ${center - wLeg}, ${yLegBottom - 20}  ${center - wLeg - 5}, ${yThigh + 20}  ${center - wLeg - 10}, ${yThigh}
      C ${center - wLeg - 15}, ${yThigh - 15}  ${center - wHips - 2}, ${yHips + 20}  ${center - wHips}, ${yHips}
      
      C ${center - wHips + 4}, ${yHips - 25}  ${center - wWaist + 2}, ${yWaist + 25}  ${center - wWaist}, ${yWaist}
      
      C ${center - wWaist - 2}, ${yWaist - 25}  ${center - wChest + 2}, ${yChest + 25}  ${center - wChest}, ${yChest}
      
      C ${center - wChest - 8}, ${yChest - 25}  ${center - wShoulder}, ${yChest-30}  ${center - wShoulder}, ${yShoulder}
      
      C ${center - wShoulder + 15}, 53  ${center - neckW/2}, 50  ${center - neckW/2}, 45
      Z
    `;

    return { pathD, yChest, yWaist, yHips, yThigh, center, wChest, wWaist, wHips, wLeg };
  }, [altura, pecho, cintura, cadera, muslo, isFemale, defaultPecho, defaultCintura, defaultCadera, defaultMuslo]);

  return (
    <ProfileLayout>
      <div className="bg-white dark:bg-brand-card-dark rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-100 dark:border-slate-800 min-h-[600px]">
        <div className="mb-8">
          <h2 className="text-2xl font-black uppercase tracking-wide text-slate-900 dark:text-white">Mis Medidas Biométricas</h2>
          <p className="text-slate-500 mt-2">
            Ajusta tus proporciones para recibir recomendaciones de tallas perfectas. 
            <span className="font-bold ml-1 text-slate-900 dark:text-white">
              (Modo: {isFemale ? "Femenino" : "Masculino"})
            </span>
          </p>
        </div>

        {msg && (
          <div className="mb-8 p-4 bg-[#E5FF00]/20 text-black dark:text-[#E5FF00] rounded-xl font-bold flex items-center gap-3">
            <i className="fa-solid fa-check-circle"></i>
            {msg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          
          {/* Avatar Area */}
          <div className="relative w-full aspect-[3/4] max-w-sm mx-auto bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-700 flex justify-center items-center overflow-hidden shadow-inner">
             <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
             
             <svg width="300" height="380" viewBox="0 0 300 380" className="drop-shadow-2xl transition-all duration-300 relative z-10">
               <path d={bodyMetrics.pathD} fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" className="dark:fill-slate-600 dark:stroke-slate-500 transition-all duration-500 ease-out" />
               
               <line x1={bodyMetrics.center - bodyMetrics.wChest - 20} y1={bodyMetrics.yChest} x2={bodyMetrics.center + bodyMetrics.wChest + 20} y2={bodyMetrics.yChest} stroke="#E5FF00" strokeWidth="2" strokeDasharray="4,4" className="transition-all duration-500" />
               <line x1={bodyMetrics.center - bodyMetrics.wWaist - 20} y1={bodyMetrics.yWaist} x2={bodyMetrics.center + bodyMetrics.wWaist + 20} y2={bodyMetrics.yWaist} stroke="#E5FF00" strokeWidth="2" strokeDasharray="4,4" className="transition-all duration-500" />
               <line x1={bodyMetrics.center - bodyMetrics.wHips - 20} y1={bodyMetrics.yHips} x2={bodyMetrics.center + bodyMetrics.wHips + 20} y2={bodyMetrics.yHips} stroke="#E5FF00" strokeWidth="2" strokeDasharray="4,4" className="transition-all duration-500" />
               <line x1={bodyMetrics.center - bodyMetrics.wLeg - 30} y1={bodyMetrics.yThigh} x2={bodyMetrics.center - bodyMetrics.wLeg + 10} y2={bodyMetrics.yThigh} stroke="#E5FF00" strokeWidth="2" strokeDasharray="4,4" className="transition-all duration-500" />
             </svg>
             
             <div className="absolute right-4 bg-black text-[#E5FF00] dark:bg-[#E5FF00] dark:text-black font-black px-3 py-1 rounded-lg text-sm shadow-xl transition-all" style={{ top: bodyMetrics.yChest - 12 }}>
               {pecho} cm
             </div>
             <div className="absolute right-4 bg-black text-[#E5FF00] dark:bg-[#E5FF00] dark:text-black font-black px-3 py-1 rounded-lg text-sm shadow-xl transition-all" style={{ top: bodyMetrics.yWaist - 12 }}>
               {cintura} cm
             </div>
             <div className="absolute right-4 bg-black text-[#E5FF00] dark:bg-[#E5FF00] dark:text-black font-black px-3 py-1 rounded-lg text-sm shadow-xl transition-all" style={{ top: bodyMetrics.yHips - 12 }}>
               {cadera} cm
             </div>
             <div className="absolute left-4 bg-black text-[#E5FF00] dark:bg-[#E5FF00] dark:text-black font-black px-3 py-1 rounded-lg text-sm shadow-xl transition-all" style={{ top: bodyMetrics.yThigh - 12 }}>
               {muslo} cm
             </div>
             
             {/* Height overlay */}
             <div className="absolute top-4 left-4 flex flex-col items-center">
               <div className="bg-black text-white dark:bg-white dark:text-black text-xs font-bold px-2 py-1 rounded">Altura</div>
               <div className="h-full border-l-2 border-dashed border-slate-300 dark:border-slate-600 my-1"></div>
               <div className="text-sm font-black text-slate-900 dark:text-white">{altura} cm</div>
             </div>
          </div>

          {/* Form Area */}
          <form onSubmit={handleSave} className="space-y-6">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-6">
              
              <MeasureInput 
                icon="fa-arrows-up-down"
                label="Altura" 
                value={altura} 
                setValue={setAltura} 
                min={140} 
                max={220} 
                desc="Tu estatura total sin zapatos"
              />
              <hr className="border-slate-200 dark:border-slate-700" />
              
              <MeasureInput 
                icon="fa-compress"
                label="Pecho" 
                value={pecho} 
                setValue={setPecho} 
                min={60} 
                max={140} 
                desc="Contorno en la parte más ancha"
              />
              <hr className="border-slate-200 dark:border-slate-700" />
              
              <MeasureInput 
                icon="fa-compress"
                label="Cintura" 
                value={cintura} 
                setValue={setCintura} 
                min={50} 
                max={140} 
                desc="Contorno a la altura del ombligo"
              />
              <hr className="border-slate-200 dark:border-slate-700" />
              
              <MeasureInput 
                icon="fa-compress"
                label="Cadera" 
                value={cadera} 
                setValue={setCadera} 
                min={60} 
                max={150} 
                desc="Contorno en la parte más ancha"
              />
              <hr className="border-slate-200 dark:border-slate-700" />

              <MeasureInput 
                icon="fa-compress"
                label="Muslo" 
                value={muslo} 
                setValue={setMuslo} 
                min={30} 
                max={100} 
                desc="Contorno de tu muslo superior"
              />
            </div>

            <button 
              type="submit"
              disabled={saving}
              className="w-full py-4 rounded-xl bg-black text-white dark:bg-[#E5FF00] dark:text-black font-black text-lg shadow-lg hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100"
            >
              {saving ? (
                <span><i className="fa-solid fa-circle-notch fa-spin mr-2"></i> Guardando...</span>
              ) : (
                <span>Guardar mis medidas</span>
              )}
            </button>
          </form>

        </div>
      </div>
    </ProfileLayout>
  );
}

function MeasureInput({ icon, label, value, setValue, min, max, desc }: any) {
  return (
    <div>
      <div className="flex justify-between items-end mb-4">
        <div>
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black uppercase tracking-wide">
            <i className={`fa-solid ${icon} text-brand-green`}></i>
            <span>{label}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">{desc}</p>
        </div>
        <div className="flex items-center gap-2">
          <input 
            type="number" 
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            className="w-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-center font-black text-lg text-slate-900 dark:text-white focus:outline-none focus:border-brand-green"
          />
          <span className="text-slate-400 font-bold">cm</span>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-black dark:accent-[#E5FF00]"
      />
    </div>
  );
}
