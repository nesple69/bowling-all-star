import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://pnxcqhwhbfbavzbylvyk.supabase.co', 'sb_publishable_i291wdhhCXoFRA6ZCPKwOQ_lEixSSlz');

const playerList = `
1;AD0536;GIANPAOLO;IACCARINO;M/B
2;AD4601;EMANUELE;CAMPONESCO;M/A
3;AA5561;SANDRO;MALTINTI;M/A
4;AB4739;ALESSANDRO;NIERI;M/A
5;AD6056;LUCA;NAZZARO;M/A
6;AA9884;DAVIDE;SPAGNOLI;M/A
7;AA4211;ROBERTA;MINENNA;F/A
8;AD0813;EVA;LEMSTRA;F/A
9;AC3818;NEDO DANIELE;SPLENDIANI;M/B
10;AB8233;GIANLUCA;BINI;M/A
11;AA5827;DANIELA;BUZZELLI;F/B
12;AA2947;ALESSANDRO;FLORI;M/A
13;AA8937;DAVID;ROTONDI;M/B
14;AA2973;ENNIO;GIROLDINI;M/B
15;AA4177;LUCA GIOVANNI;BARBIN;M/C
16;AA9689;MANUELA;DALLE LUCCHE;F/B
17;AD7481;SIMONE;PIREDDA;M/B
18;AE8404;MARCO;FARATRO;M/B
19;AA8928;GIUSEPPE;DONISI;M/C
20;AD5029;MASSIMILIANO;CHITI;M/A
21;AD0158;MATTEO;BONANNO;M/A
22;AD9223;SIMONE;SORRENTINO;M/C
23;AD9224;TOMMASO;SORRENTINO;M/C
24;AD7524;LUCA;SIMONCINI;M/C
25;AF2069;DANIELE;SPOLAORE;M/ES
26;AD4765;ANTONIO;BONFA';M/C
27;AD3528;STEFANIA;CEI;F/C
28;AD6049;ALESSANDRO;BACHI;M/C
29;AD1563;LUCA;BERNETTI;M/C
30;AB9433;GAVINO;CASAGRANDE;M/ES
31;AE8405;ANTONELLA;ANATRA;F/D
32;AA6828;CARLO;GENTILE;M/D
33;AC6912;EMANUELA;IACOVONE;F/B
34;AF2071;SIMONE;ALVINO;M/ES
35;AA8929;GIUSEPPINA;DI DIO;F/C
36;AF2576;STEFANO;CASAGRANDE;M/ES
37;AF2198;LORENZO;NARDI;M/ES
38;AF2072;ELISA;DESSI;F/ES
39;AF2544;LORENZO;MORONI;M/ES
40;AD7480;CINZIA;SALVATORI;F/D
41;AF2542;VALERIO;FRANCHI;M/ES
42;AF2577;ELEONORA;MARCONI;F/ES
43;AF2199;SAOMI;FARINA;F/ES
44;AF2564;ALESSANDRO;CECCHI;M/ES
45;AD7712;RINO DAVIDE;IACOVONE;M/D
46;AA8484;ENRICO;GIORGIONE;M/B
47;AF2070;CARLO;POLLESCHI;M/ES
48;AA2961;MASSIMO;STEFANI;M/B
49;AC4637;LETIZIA;TORREGROSSA;F/DS
50;AF2543;GEMMA;MALACARNE;F/ES
51;AA3364;FEDERICO;ROSSI;M/A
52;AB1613;GERMANO;CASTELLI;M/B
`;

async function updatePlayers() {
    // 1. Fetch current players
    const { data: dbPlayers, error: fetchError } = await supabase.from('players').select('id, nome, cognome, categoria');
    if (fetchError) {
        console.error('Fetch Error:', fetchError);
        return;
    }

    // 2. Parse input list and match
    const updates = [];
    const lines = playerList.trim().split('\n');
    for (const line of lines) {
        const parts = line.split(';');
        if (parts.length < 5) continue;

        const nome = parts[2].trim().toUpperCase();
        const cognome = parts[3].trim().toUpperCase();
        const categoria = parts[4].trim();

        const player = dbPlayers.find(p => p.nome.toUpperCase() === nome && p.cognome.toUpperCase() === cognome);
        if (player) {
            if (player.categoria !== categoria) {
                updates.push({ id: player.id, categoria, fullName: `${nome} ${cognome}` });
            }
        }
    }

    console.log(`Found ${updates.length} players to update.`);

    // 3. Perform individual updates
    for (const update of updates) {
        console.log(`Updating ${update.fullName}: ${update.categoria}...`);
        const { error } = await supabase.from('players').update({ categoria: update.categoria }).eq('id', update.id);
        if (error) {
            console.error(`Error updating ${update.fullName}:`, error);
        }
    }

    console.log('✅ Update process finished.');
}

updatePlayers();
