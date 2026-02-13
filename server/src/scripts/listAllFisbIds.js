const axios = require('axios');

async function search() {
    try {
        const url = 'https://www.fisb.it/calendario2.html?view=calendario&regione=Toscana';
        const { data: html } = await axios.get(url);

        const regex = /view=classifica&id=(\d+)/gi;
        let match;
        const ids = new Set();
        while ((match = regex.exec(html)) !== null) {
            ids.add(match[1]);
        }
        console.log('IDs Classifica trovati:', Array.from(ids));
    } catch (err) {
        console.error('Errore:', err.message);
    }
}

search();
