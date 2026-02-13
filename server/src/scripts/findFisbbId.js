const axios = require('axios');

async function search() {
    try {
        console.log('Ricerca Fisbb Cup nel calendario Toscana...');
        const url = 'https://www.fisb.it/calendario2.html?view=calendario&regione=Toscana';
        const { data: html } = await axios.get(url);

        // Cerchiamo qualsiasi link classifica associato a Cup o Fisb
        const regex = /id=(\d+)[^>]*>([^<]*(Cup|Fisb|Coppa)[^<]*)</gi;
        let match;
        while ((match = regex.exec(html)) !== null) {
            console.log(`Trovato: "${match[2].trim()}" -> ID: ${match[1]}`);
        }
    } catch (err) {
        console.error('Errore:', err.message);
    }
}

search();
