import { db, collection, getDocs } from "@/firebaseConfig";

export async function fetchTeams() {
    try {
        const querySnapshot = await getDocs(collection(db, "teams"));
        const teamsList = querySnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                nom: data.nom,
                customNom: data.customNom,
                hommes: data.hommes,
                femmes: data.femmes,
                ageTotal: data.ageTotal,
                totalPlayers: data.totalPlayers,
                points: data.points,
                createdAt: data.createdAt,
            };
        });
        return teamsList.sort((a, b) => a.nom.localeCompare(b.nom));
    }
    catch (error) {
        console.error("Erreur lors de la récupération des équipes :", error);
    }
};