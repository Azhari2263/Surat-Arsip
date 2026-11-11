import React, { useState } from 'react';
import { MessageSquare, X, ChevronUp } from 'lucide-react';

interface HelpFloatingButtonProps {
  whatsappPhone: string;
}

export const HelpFloatingButton: React.FC<HelpFloatingButtonProps> = ({ whatsappPhone }) => {
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const phone = whatsappPhone || '6281253817688';
  const message = encodeURIComponent(
    'Halo Admin Tata Usaha, saya memerlukan bantuan/informasi terkait Sistem Tata Kelola Naskah Dinas & Penomoran Surat Keluar BPS Provinsi Kalimantan Barat.'
  );
  const waUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${message}`;

  if (isMinimized) {
    return (
      <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 flex items-center gap-1.5 animate-in fade-in zoom-in duration-200">
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#25d366] hover:bg-[#1ebc57] text-white shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-105 border-2 border-white/60 cursor-pointer"
          title="Bantuan Admin TU via WhatsApp"
        >
          <MessageSquare className="w-5 h-5 fill-current" />
        </a>
        <button
          onClick={() => setIsMinimized(false)}
          className="w-6 h-6 rounded-full bg-slate-800/80 hover:bg-slate-900 text-white flex items-center justify-center shadow-xs text-[10px] cursor-pointer transition-colors"
          title="Tampilkan label bantuan"
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 flex items-center bg-[#25d366] hover:bg-[#1ebc57] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-white/60 pl-3.5 pr-2 py-2">
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 cursor-pointer pr-2"
        title="Hubungi Admin Tata Usaha BPS via WhatsApp"
      >
        <div className="w-5 h-5 flex items-center justify-center shrink-0">
          <MessageSquare className="w-5 h-5 fill-current" />
        </div>
        <span className="font-bold text-xs tracking-wide whitespace-nowrap">
          Bantuan Admin TU
        </span>
      </a>

      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsMinimized(true);
        }}
        className="w-5 h-5 rounded-full bg-black/15 hover:bg-black/30 flex items-center justify-center text-white/90 hover:text-white transition-colors cursor-pointer shrink-0 ml-1"
        title="Ciutkan tombol bantuan"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};
