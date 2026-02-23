import React from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface Props {
    numeroPartita: number;
    birilli: number;
    data?: string | Date;
}

const CardPartita: React.FC<Props> = ({ numeroPartita, birilli, data }) => {
    const percentage = Math.round((birilli / 300) * 100);

    return (
        <div className="bg-white border border-gray-200 rounded-md p-4 shadow-sm hover:shadow-md transition">
            <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-[#2C3E50] uppercase tracking-wider">
                    Partita {numeroPartita}
                </span>
                <span className="text-2xl font-black text-[#5DADE2]">
                    {birilli}
                </span>
            </div>

            {/* Barra progresso */}
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3 overflow-hidden">
                <div
                    className="bg-[#F8B500] h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_8px_rgba(248,181,0,0.4)]"
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>

            <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <span>{data ? format(new Date(data), 'dd/MM/yyyy HH:mm', { locale: it }) : 'Orario non disp.'}</span>
                <span className="text-[#F8B500]">{percentage}%</span>
            </div>
        </div>
    );
};

export default CardPartita;
