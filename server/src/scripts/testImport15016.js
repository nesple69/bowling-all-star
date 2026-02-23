const { fetchTorneoFederazione } = require('../services/scrapingService');

async function test() {
    console.log('--- TEST IMPORTAZIONE 15024 (Aziendale Toscana) ---');
    try {
        const data = await fetchTorneoFederazione('https://www.fisb.it/calendario2.html?view=classifica&id=15024');
        console.log(`Torneo: ${data.nome}`);

        const divisions = [...new Set(data.classifica.map(c => c.divisione))];
        console.log('Divisioni rilevate:');
        divisions.forEach(d => console.log(`- "${d}"`));

        console.log('\nPreview primi 3 atleti:');
        data.classifica.slice(0, 3).forEach(c => {
            console.log(`${c.posizione}. ${c.atleta} | Divisione: ${c.divisione}`);
        });

    } catch (err) {
        console.error('Errore:', err.message);
    }
}

test();
