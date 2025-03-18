import { db, collection, getDocs } from "@/firebaseConfig";

export async function fetchScores() {
    try {
        const querySnapshot = await getDocs(collection(db, "scores"));
        const scoresList = querySnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                id_game: data.id_game,
                id_team: data.id_team,
                points: data.points
            };
        });
        return scoresList;
    } catch (error) {
        console.error("Erreur lors de la récupération :", error);
    }
}