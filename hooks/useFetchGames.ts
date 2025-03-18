import { db, collection, getDocs } from "@/firebaseConfig";

export async function fetchGames() {
    try {
        const querySnapshot = await getDocs(collection(db, "games"));
        const gamesList = querySnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                nom: data.nom,
                regles: data.regles,
            };
        });
        return gamesList;
    } catch (error) {
        console.error("Erreur lors de la récupération :", error);
    }
};