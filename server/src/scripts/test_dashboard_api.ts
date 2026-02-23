import axios from 'axios';

async function testApi() {
    try {
        const response = await axios.get('http://localhost:3001/api/dashboard/stats');
        const ultimiTornei = response.data.ultimiTornei;

        console.log('--- VERIFICA API DASHBOARD ---');
        if (ultimiTornei && ultimiTornei.length > 0) {
            const primoRis = ultimiTornei[0].risultati[0];
            console.log('Giocatore:', primoRis.giocatore.cognome, primoRis.giocatore.nome);
            console.log('Dati Giocatore in Risultato:', JSON.stringify(primoRis.giocatore, null, 2));
        } else {
            console.log('Nessun torneo completato trovato.');
        }
    } catch (error: any) {
        console.error('Errore chiamata API:', error.message);
    }
}

testApi();
