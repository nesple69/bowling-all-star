const axios = require('axios');
const cheerio = require('cheerio');

async function probe() {
    for (let id = 15070; id <= 15090; id++) {
        try {
            const url = `https://www.fisb.it/calendario2.html?view=classifica&id=${id}`;
            const { data: html } = await axios.get(url, { timeout: 5000 });
            const $ = cheerio.load(html);
            const title = $('h1').first().text().trim();
            if (title) {
                console.log(`ID ${id}: ${title}`);
                if (title.toUpperCase().includes('FISBB')) {
                    console.log(`>>> TROVATO FISBB CUP: ${url}`);
                }
            }
        } catch (err) { }
    }
}

probe();
