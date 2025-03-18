interface Game {
    id: string;
    nom: string;
    regles: string;
}

interface Score {
    id: string;
    id_game: string;
    id_team: string;
    points: number;
}