interface Player {
    id: string;
    nom: string;
    dateNaissance: string;
    sexe: string;
    active: boolean;
}

interface Team {
    id: string;
    nom: string;
    customNom: string;
    hommes: Player[];
    femmes: Player[];
    ageTotal: number;
    totalPlayers: number;
    points: number;
}