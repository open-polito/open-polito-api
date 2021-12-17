export type EsameSostenuto = {
    nome: string,
    cfu: number,
    voto: string,
    data: Date,
    stato: string,
}

export type EsameProvvisorio = {
    nome: string,
    voto: string | null,
    fallito: boolean,
    assente: boolean,
    stato: string,
    docente: string, // matricola docente
    messaggio: string, 
};

export class Libretto {
    materie: EsameSostenuto[];
    provvisori: EsameProvvisorio[];
}