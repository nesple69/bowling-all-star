const axios = require('axios');
const cheerio = require('cheerio');

const url = 'https://www.fisb.it/calendario2.html?view=classifica&id=15072';

async function test() {
    try {
        console.log(`Recupero HTML da: ${url}...`);
        const { data: html } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0'
            },
            timeout: 30000
        });

        const $ = cheerio.load(html);
        console.log('--- HEADERS (H1, H2, H3) ---');
        $('h1, h2, h3').each((i, el) => {
            console.log(`${el.tagName.toUpperCase()}: ${$(el).text().trim()}`);
        });

        console.log('\n--- RIGHE TABELLA (Prime 20) ---');
        $('table tr').slice(0, 20).each((i, el) => {
            const cols = $(el).find('td, th');
            const text = $(el).text().trim();
            if (cols.length < 5 && text.length > 5) {
                console.log(`Header Row/Division?: "${text}" (Cols: ${cols.length})`);
            }
        });

    } catch (err) {
        console.error('Errore:', err.message);
    }
}

test();
