const axios = require('axios');

async function debug() {
    try {
        const url = 'https://www.fisb.it/calendario2.html?view=calendario&regione=Toscana';
        console.log(`Fetching ${url}...`);
        const { data: html } = await axios.get(url);

        console.log('--- HTML PREVIEW (first 2000 chars) ---');
        console.log(html.substring(0, 2000));

        console.log('\n--- SEARCHING FOR "CUP" or "FISBB" ---');
        const lines = html.split('\n');
        lines.forEach((line, i) => {
            if (line.toUpperCase().includes('CUP') || line.toUpperCase().includes('FISBB')) {
                console.log(`Line ${i}: ${line.trim()}`);
            }
        });
    } catch (err) {
        console.error('Error:', err.message);
    }
}

debug();
