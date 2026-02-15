---
description: Regole fisse per il parsing delle classifiche FISB
---
# Regole di Parsing Classifiche FISB

Queste regole devono essere seguite ogni volta che si aggiorna o si interviene sul parser dei risultati FISB.

## Struttura Colonne (Standard FISB)
Il parser identifica le colonne principali tramite i loro header o tramite offset fissi se gli header mancano:

- **Posizione (Rank)**: Colonna index `0`. Deve essere presa SEMPRE dalla prima colonna, anche se l'intestazione è vuota (come accade spesso nei report FISB).
- **Giocatore (Atleta)**: Colonna index `2` (Header: `GIOCATORE` o `ATLETA`).
- **Categoria (Cat)**: Colonna index `3` (Header: `CAT.`).
- **Punteggi Partite**: Iniziano dopo la colonna `HDP/HDCP` (index `4`), quindi da index `5` in poi.
- **Totale Atleta (Birilli)**: Colonna `T` identficata dall'header `TOTALE` o `TOT.`.
- **Totale Squadra (Doppio/Tris/Squadra)**: Sempre all'offset **`T + 2`** (due colonne dopo il totale atleta).
  - *Nota*: Le colonne intermedie (`MEDIA`, etc.) vanno ignorate.

## Tipi di Torneo e Gestione Team
- **Singolo**: La colonna del totale squadra (offset `T + 2`) è tipicamente vuota o assente. Il risultato è solo individuale.
- **Doppio, Tris, Squadra**:
  - Il `Totale Squadra` all'offset `T + 2` viene usato per raggruppare i giocatori nello stesso team.
  - La posizione (Rank) della riga che contiene il Totale Squadra è il Rank del team.

## Gestione Riserve
In tornei di Tris o Squadra, i giocatori riserva devono essere gestiti separatamente:
- **Criterio**: Un giocatore è una riserva se ha punteggi validi ma il suo `Totale Squadra` (offset `T + 2`) è **0** o **vuoto**.
- **Comportamento**: Questi risultati vanno importati come **Individuali**, non devono essere sommati al totale di nessun team e non devono ereditare il raggruppamento della squadra precedente se la colonna è vuota.

## Pulizia Dati
- Rimuovere sempre tag HTML e entità come `&nbsp;`.
- I numeri con separatore delle migliaia (punto) devono essere puliti prima della conversione (es: `1.250` -> `1250`).

> [!WARNING]
> **Stabilità Colonne**: Non filtrare mai le stringhe vuote durante lo `split` delle righe. Se la prima colonna (ASD) è vuota, deve rimanere un elemento vuoto nell'array per non far saltare gli indici delle colonne successive (Giocatore, Totale, etc.). Questo è critico per i tornei Tris e Squadra.
