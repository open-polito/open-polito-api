export type Corso = {
    nome: string,
    codice: string,
    cfu: number,
    id_incarico: number | null,
    categoria: string,
    overbooking: boolean
};

export class CaricoDidattico {
    corsi: Corso[];
}