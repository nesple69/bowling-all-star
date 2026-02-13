export interface Player {
    id: string;
    firstName: string;
    lastName: string;
    fiscalCode?: string;
    email?: string;
    phone?: string;
    tesseraNumber?: string;
    category: string;
    birthDate?: Date;
}

export interface AssociationInfo {
    name: string;
    address: string;
    president: string;
    vatNumber?: string;
}

export interface Tournament {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    location: string;
}
