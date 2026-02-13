-- CreateEnum
CREATE TYPE "Ruolo" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "CategoriaGiocatore" AS ENUM ('U12', 'U15', 'U18', 'SENIOR_A', 'SENIOR_B', 'SENIOR_C', 'SENIOR_D');

-- CreateEnum
CREATE TYPE "TipologiaTorneo" AS ENUM ('SINGOLO', 'TEAM');

-- CreateEnum
CREATE TYPE "TipoMovimento" AS ENUM ('RICARICA', 'ISCRIZIONE_TORNEO', 'ACQUISTO_MAGLIA');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cognome" TEXT NOT NULL,
    "ruolo" "Ruolo" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Giocatore" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cognome" TEXT NOT NULL,
    "dataNascita" TIMESTAMP(3) NOT NULL,
    "telefono" TEXT,
    "numeroTessera" TEXT,
    "categoria" "CategoriaGiocatore" NOT NULL,
    "mediaAttuale" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "migliorPartita" INTEGER NOT NULL DEFAULT 0,
    "totaleBirilli" INTEGER NOT NULL DEFAULT 0,
    "certificatoMedicoScadenza" TIMESTAMP(3),
    "aziendaAffiliata" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Giocatore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stagione" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "dataInizio" TIMESTAMP(3) NOT NULL,
    "dataFine" TIMESTAMP(3) NOT NULL,
    "attiva" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Stagione_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Torneo" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipologia" "TipologiaTorneo" NOT NULL,
    "sede" TEXT NOT NULL,
    "locandina" TEXT,
    "linkIscrizione" TEXT,
    "stagioneId" TEXT NOT NULL,
    "dataInizio" TIMESTAMP(3) NOT NULL,
    "dataFine" TIMESTAMP(3) NOT NULL,
    "completato" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Torneo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GiorniOrariTorneo" (
    "id" TEXT NOT NULL,
    "torneoId" TEXT NOT NULL,
    "giorno" DATE NOT NULL,
    "orarioInizio" TIMESTAMP(3) NOT NULL,
    "orarioFine" TIMESTAMP(3) NOT NULL,
    "postiDisponibili" INTEGER NOT NULL,

    CONSTRAINT "GiorniOrariTorneo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IscrizioneTorneo" (
    "id" TEXT NOT NULL,
    "torneoId" TEXT NOT NULL,
    "giocatoreId" TEXT NOT NULL,
    "turnoId" TEXT NOT NULL,
    "confermata" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "IscrizioneTorneo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RisultatoTorneo" (
    "id" TEXT NOT NULL,
    "torneoId" TEXT NOT NULL,
    "giocatoreId" TEXT NOT NULL,
    "posizione" INTEGER NOT NULL,
    "partiteGiocate" INTEGER NOT NULL,
    "totaleBirilli" INTEGER NOT NULL,
    "totaleBirilliSquadra" INTEGER,

    CONSTRAINT "RisultatoTorneo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimentoContabile" (
    "id" TEXT NOT NULL,
    "giocatoreId" TEXT NOT NULL,
    "importo" DECIMAL(10,2) NOT NULL,
    "tipo" "TipoMovimento" NOT NULL,
    "descrizione" TEXT,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adminId" TEXT,

    CONSTRAINT "MovimentoContabile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaldoBorsellino" (
    "id" TEXT NOT NULL,
    "giocatoreId" TEXT NOT NULL,
    "saldoAttuale" DECIMAL(10,2) NOT NULL DEFAULT 0,

    CONSTRAINT "SaldoBorsellino_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Giocatore_numeroTessera_key" ON "Giocatore"("numeroTessera");

-- CreateIndex
CREATE UNIQUE INDEX "Giocatore_userId_key" ON "Giocatore"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SaldoBorsellino_giocatoreId_key" ON "SaldoBorsellino"("giocatoreId");

-- AddForeignKey
ALTER TABLE "Giocatore" ADD CONSTRAINT "Giocatore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Torneo" ADD CONSTRAINT "Torneo_stagioneId_fkey" FOREIGN KEY ("stagioneId") REFERENCES "Stagione"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiorniOrariTorneo" ADD CONSTRAINT "GiorniOrariTorneo_torneoId_fkey" FOREIGN KEY ("torneoId") REFERENCES "Torneo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IscrizioneTorneo" ADD CONSTRAINT "IscrizioneTorneo_torneoId_fkey" FOREIGN KEY ("torneoId") REFERENCES "Torneo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IscrizioneTorneo" ADD CONSTRAINT "IscrizioneTorneo_giocatoreId_fkey" FOREIGN KEY ("giocatoreId") REFERENCES "Giocatore"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IscrizioneTorneo" ADD CONSTRAINT "IscrizioneTorneo_turnoId_fkey" FOREIGN KEY ("turnoId") REFERENCES "GiorniOrariTorneo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RisultatoTorneo" ADD CONSTRAINT "RisultatoTorneo_torneoId_fkey" FOREIGN KEY ("torneoId") REFERENCES "Torneo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RisultatoTorneo" ADD CONSTRAINT "RisultatoTorneo_giocatoreId_fkey" FOREIGN KEY ("giocatoreId") REFERENCES "Giocatore"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimentoContabile" ADD CONSTRAINT "MovimentoContabile_giocatoreId_fkey" FOREIGN KEY ("giocatoreId") REFERENCES "Giocatore"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaldoBorsellino" ADD CONSTRAINT "SaldoBorsellino_giocatoreId_fkey" FOREIGN KEY ("giocatoreId") REFERENCES "Giocatore"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
