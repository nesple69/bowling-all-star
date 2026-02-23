const axios = require('axios');
const cheerio = require('cheerio');

const urls = [
    'https://www.fisb.it/calendario2.html?view=classifica&id=15084',
    'https://www.fisb.it/calendario2.html?view=classifica&id=15096'
];

async function test() {
    for (const url of urls) {
        try {
            console.log(`\n=== ANALISI: ${url} ===`);
            const { data: html } = await axios.get(url, {
                headers: { 'User-Agent': 'Mozilla/5.0' },
                timeout: 30000
            });

            const $ = cheerio.load(html);
            console.log('--- HEADERS ---');
            $('h1, h2, h3').each((i, el) => {
                const text = $(el).text().trim();
                if (text.length > 3) console.log(`${el.tagName.toUpperCase()}: ${text}`);
            });

        } catch (err) {
            console.error(`Errore su ${url}:`, err.message);
        }
    }
}

test();
