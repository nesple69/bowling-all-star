import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://pnxcqhwhbfbavzbylvyk.supabase.co', 'sb_publishable_i291wdhhCXoFRA6ZCPKwOQ_lEixSSlz');

async function getPlayers() {
    const { data, error } = await supabase.from('players').select('id, nome, cognome, categoria');
    if (error) {
        console.error('Error:', error);
        return;
    }
    console.log(JSON.stringify(data));
}

getPlayers();
