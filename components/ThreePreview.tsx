
import React from 'react';
import { FurnitureModule, ViewportMode, ToolMode } from '../types';

interface Props {
  modules: FurnitureModule[];
  floorWidth: number;
  floorDepth: number;
  wallHeight: number;
  selectedModuleId: string | null;
  viewportMode: ViewportMode;
  toolMode: ToolMode;
  onSelectModule: (id: string) => void;
}

const ThreePreview: React.FC<Props> = ({ modules, floorWidth, floorDepth, wallHeight, selectedModuleId, viewportMode, toolMode, onSelectModule }) => {
  // Aumentado de 0.12 para 0.15 para um zoom mais próximo
  const scale = 0.15; 

  const isEngineer = viewportMode === ViewportMode.ENGINEER;

  const getFinishColor = (finish: string) => {
    if (isEngineer) return 'rgba(212, 175, 55, 0.05)';
    switch(finish) {
      case 'Louredo Matt': return '#d4af37';
      case 'Branco Tx': return '#ffffff';
      case 'Grafite Silk': return '#444444';
      case 'Carvalho SD': return '#a67b5b';
      case 'Preto Absoluto': return '#1a1a1a';
      default: return '#ffffff';
    }
  };

  const getViewportTransform = () => {
    switch (viewportMode) {
      case ViewportMode.TOP: return 'rotateX(90deg) rotateZ(0deg)';
      case ViewportMode.FRONT: return 'rotateX(0deg) rotateY(0deg)';
      case ViewportMode.ENGINEER: return 'rotateX(-25deg) rotateY(-45deg)';
      case ViewportMode.PERSPECTIVE:
      default: return 'rotateX(-15deg) rotateY(-30deg)';
    }
  };

  return (
    <div className={`relative w-full h-full flex items-center justify-center overflow-hidden transition-all duration-1000 ${isEngineer ? 'bg-gray-900' : 'bg-[#f8f9fa] promob-grid'}`}>
      <div className="relative w-full h-full flex items-center justify-center" style={{ perspective: viewportMode === ViewportMode.PERSPECTIVE || isEngineer ? '3000px' : 'none' }}>
        <div className="relative transition-all duration-1000 ease-in-out" style={{ 
          transformStyle: 'preserve-3d',
          transform: getViewportTransform(),
          width: '100%',
          height: '100%'
        }}>
          
          {/* PISO PREMIUM */}
          <div className={`absolute left-1/2 top-1/2 transition-all duration-700 ${isEngineer ? 'border-amber-500/50 bg-amber-500/5' : 'bg-white border-2 border-amber-100 shadow-2xl'}`} style={{
            width: `${floorWidth * scale}px`,
            height: `${floorDepth * scale}px`,
            transform: 'translate(-50%, -50%) rotateX(90deg)',
          }}>
             {!isEngineer && (
               <div className="absolute inset-0" style={{ 
                 backgroundImage: 'linear-gradient(rgba(212,175,55,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.05) 1px, transparent 1px)',
                 backgroundSize: '50px 50px' 
               }}></div>
             )}
             {isEngineer && (
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-amber-500/10 font-black text-8xl uppercase tracking-[1.5em] pointer-events-none whitespace-nowrap">Área Técnica SD</div>
             )}
          </div>

          {/* PAREDE DE FUNDO */}
          {!isEngineer && (
            <div className="absolute left-1/2 top-1/2 bg-[#ffffff] border-b-4 border-amber-50 shadow-inner" style={{
              width: `${floorWidth * scale}px`,
              height: `${wallHeight * scale}px`,
              transform: `translate(-50%, -100%) translateZ(-${floorDepth * scale / 2}px)`,
            }}>
              <div className="absolute bottom-0 w-full h-16 bg-gray-50/50 border-t border-gray-100"></div>
            </div>
          )}

          {/* MÓDULOS 3D */}
          {modules.map((mod) => {
            const color = getFinishColor(mod.finish);
            const isSelected = selectedModuleId === mod.id;

            return (
              <div 
                key={mod.id}
                onClick={(e) => { e.stopPropagation(); onSelectModule(mod.id); }}
                className="absolute cursor-pointer transition-all duration-300 group"
                style={{
                  width: `${mod.width * scale}px`,
                  height: `${mod.height * scale}px`,
                  left: `calc(50% + ${mod.x * scale}px)`,
                  top: `calc(50% - ${mod.y * scale}px)`,
                  transformStyle: 'preserve-3d',
                  transform: `translate(-50%, -100%) translateZ(${mod.z * scale}px) rotateY(${mod.rotation || 0}deg)`,
                }}
              >
                {/* COTAS TÉCNICAS */}
                {(isEngineer || isSelected) && (
                  <div className="absolute inset-0 pointer-events-none" style={{ transformStyle: 'preserve-3d' }}>
                     <div className="absolute -top-16 left-0 right-0 border-t-2 border-dashed border-amber-500/40 flex justify-center items-center" style={{ transform: 'translateZ(120px)' }}>
                        <span className="bg-amber-600 text-white text-[11px] px-5 py-2 rounded-full font-black shadow-xl">{mod.width}mm</span>
                     </div>
                     <div className="absolute top-0 bottom-0 -right-16 border-r-2 border-dashed border-amber-500/40 flex items-center justify-center" style={{ transform: 'translateZ(120px)' }}>
                        <span className="bg-amber-600 text-white text-[11px] px-5 py-2 rounded-full font-black rotate-90 shadow-xl">{mod.height}mm</span>
                     </div>
                  </div>
                )}

                {/* VOLUME (FACE FRONTAL) */}
                <div className={`absolute inset-0 border-2 transition-all duration-500 ${isEngineer ? 'border-amber-500/30 bg-amber-500/10' : (isSelected ? 'border-amber-500 ring-8 ring-amber-500/20 shadow-[0_0_80px_rgba(212,175,55,0.4)] z-50' : 'border-black/5')}`} style={{
                  backgroundColor: color,
                  transform: `translateZ(${mod.depth * scale / 2}px)`,
                }}>
                  {mod.isRipado && !isEngineer && (
                    <div className="absolute inset-0 flex gap-[4px] p-[2px] overflow-hidden">
                      {Array.from({ length: Math.floor(mod.width/35) }).map((_, i) => (
                        <div key={i} className="h-full flex-1 bg-black/10 shadow-inner" style={{ backgroundColor: color }}></div>
                      ))}
                    </div>
                  )}
                  {/* Puxador Premium */}
                  {!mod.isRipado && mod.category === 'Cozinha' && !isEngineer && (
                    <div className="absolute top-1/2 right-8 w-2 h-32 -translate-y-1/2 bg-gray-200 rounded-full shadow-lg border border-white/50 group-hover:bg-amber-400 transition-colors"></div>
                  )}
                  {isEngineer && <div className="absolute inset-0 flex items-center justify-center text-amber-500/20 font-black text-[10px] uppercase rotate-45 pointer-events-none">{mod.type}</div>}
                </div>

                {/* OUTRAS FACES */}
                <div className="absolute top-0 bottom-0" style={{ width: `${mod.depth * scale}px`, backgroundColor: color, left: 0, transform: `translateX(-50%) rotateY(-90deg)`, border: isEngineer ? '1px solid rgba(212,175,55,0.2)' : 'none', filter: 'brightness(0.7)' }}></div>
                <div className="absolute top-0 bottom-0" style={{ width: `${mod.depth * scale}px`, backgroundColor: color, right: 0, transform: `translateX(50%) rotateY(90deg)`, border: isEngineer ? '1px solid rgba(212,175,55,0.2)' : 'none', filter: 'brightness(0.8)' }}></div>
                <div className="absolute left-0 right-0" style={{ height: `${mod.depth * scale}px`, backgroundColor: color, top: 0, transform: `translateY(-50%) rotateX(90deg)`, border: isEngineer ? '1px solid rgba(212,175,55,0.2)' : 'none', filter: 'brightness(1.1)' }}></div>
                <div className="absolute left-0 right-0" style={{ height: `${mod.depth * scale}px`, backgroundColor: color, bottom: 0, transform: `translateY(50%) rotateX(-90deg)`, border: isEngineer ? '1px solid rgba(212,175,55,0.2)' : 'none', filter: 'brightness(0.5)' }}></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ThreePreview;
