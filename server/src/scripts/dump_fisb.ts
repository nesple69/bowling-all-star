import axios from 'axios';
import * as cheerio from 'cheerio';

async function dump() {
    const url = 'https://www.fisb.it/calendario2.html?view=classifica&id=15013';
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    console.log('--- DUMP TABLE STRUCTURE ---');
    $('table tr').each((i, row) => {
        const cols = $(row).find('td');
        const colTexts = cols.map((j, col) => $(col).text().trim()).get();
        console.log(`Row ${i}:`, JSON.stringify(colTexts));
        if (i < 5) console.log(`HTML Row ${i}:`, $(row).html()?.substring(0, 500));
    });
}

dump();
