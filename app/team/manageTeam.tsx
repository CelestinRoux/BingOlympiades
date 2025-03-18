import React, { useState, useEffect } from "react";
import { View, Button, TextInput, Modal, TouchableOpacity, Pressable, StyleSheet, ScrollView, Text } from "react-native";
import { db, collection, doc, addDoc, deleteDoc, updateDoc, getDocs } from "@/firebaseConfig";
import { ThemedText } from "@/components/ThemedText";
import { fetchTeams } from "@/hooks/useFetchTeams";
import { Header } from "@/components/Header";
import { useThemeColors } from "@/hooks/useThemeColors";

export default function ManageTeam() {
    const colors = useThemeColors();
    const [modalVisible, setModalVisible] = useState(false);
    const [nbEquipes, setNbEquipes] = useState(0);
    const [players, setPlayers] = useState<Player[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [editingTeamId, setEditingTeamId] = useState("");
    const [customName, setCustomName] = useState("");   
    const [error, setError] = useState<string>('');

    const createBalancedTeams = async () => {
        if (!players || players.length === 0) {
            console.log("Aucun joueur actif trouvé.");
            return;
        }
        if (!teams || teams.length > 0) {
            await delTeams();
        }
        const genTeams = generateTeams(players);
        console.log("Équipes générées : ", genTeams);
        await saveTeams(genTeams);
        fetchTeams().then((data) => {
            setTeams(data ?? []);
        });
        setNbEquipes(0);
        setModalVisible(false);
    };

    const fetchActivePlayers = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "players"));
            const playersList = querySnapshot.docs
                .map((doc) => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        nom: data.nom,
                        dateNaissance: data.dateNaissance,
                        sexe: data.sexe,
                        active: data.active,
                    };
                }).filter((player) => player.active);
    
            setPlayers(playersList);;
        } catch (error) {
            console.error("Erreur lors de la récupération des joueurs :", error);
        }
    };

    const generateTeams = (playersList: Player[]): Team[] => {
        const { hommes, femmes } = groupAndSortPlayers(playersList);
    
        const genTeams: Team[] = Array.from({ length: nbEquipes }, (_, i) => ({
            id: "",
            nom: `Equipe ${i + 1}`,
            customNom: `Equipe ${i + 1}`,
            hommes: [],
            femmes: [],
            ageTotal: 0,
            points: 0,
            totalPlayers: 0,
        }));
        
        const currentYear = new Date().getFullYear();
        const calculateAge = (dateNaissance: string) => currentYear - new Date(dateNaissance).getFullYear();

        const shuffleArray = <T,>(array: T[]) => array.sort(() => Math.random() - 0.5);

        shuffleArray(hommes);
        shuffleArray(femmes);

        let teamIndex = 0;

        const distributePlayer = (player: Player, gender: "hommes" | "femmes") => {
            const playerAge = calculateAge(player.dateNaissance);

            let minTeam = genTeams.reduce((best, team, index) => {
                return team.totalPlayers < best.team.totalPlayers ? { team, index } : best;
            }, { team: genTeams[0], index: 0 });

            genTeams[minTeam.index][gender].push(player);
            genTeams[minTeam.index].ageTotal += playerAge;
            genTeams[minTeam.index].totalPlayers += 1;
        };

        const maxPlayers = Math.max(hommes.length, femmes.length);
        for (let i = 0; i < maxPlayers; i++) {
            if (i < hommes.length) distributePlayer(hommes[i], "hommes");
            if (i < femmes.length) distributePlayer(femmes[i], "femmes");
        }

        return genTeams;
    };
    

    const groupAndSortPlayers = (playersList: Player[]) => {
        const hommes = playersList
            .filter((player) => player.sexe === "H")
            .sort((a, b) => Date.parse(a.dateNaissance) - Date.parse(b.dateNaissance));
    
        const femmes = playersList
            .filter((player) => player.sexe === "F")
            .sort((a, b) => Date.parse(a.dateNaissance) - Date.parse(b.dateNaissance));
    
        return { hommes, femmes };
    };

    const saveTeams = async (teams: Team[]) => {
        try {
            const teamsCollection = collection(db, "teams");
    
            for (const team of teams) {
                await addDoc(teamsCollection, {
                    nom: team.nom,
                    customNom: team.customNom,
                    hommes: team.hommes.map(player => ({ id: player.id, nom: player.nom, dateNaissance: player.dateNaissance })),
                    femmes: team.femmes.map(player => ({ id: player.id, nom: player.nom, dateNaissance: player.dateNaissance })),
                    ageTotal: team.ageTotal,
                    totalPlayers: team.totalPlayers,
                    points: 0,
                    createdAt: new Date().toISOString()
                });
            }
    
            console.log("Équipes enregistrées !");
        } catch (error) {
            console.error("Erreur lors de l'enregistrement des équipes :", error);
        }
    };

    const delTeams = async () => {
        try {
        const teamsRef = collection(db, "teams");
        const querySnapshot = await getDocs(teamsRef);
        const deleteTeams = querySnapshot.docs.map((doc) => deleteDoc(doc.ref));

        const scoresRef = collection(db, "scores");
        const scoresSnapshot = await getDocs(scoresRef);
        const deleteScores = scoresSnapshot.docs.map((doc) => deleteDoc(doc.ref));

        await Promise.all([...deleteTeams, ...deleteScores]);
        console.log("Anciennes équipes supprimées.");
        } catch (error) {
            console.error("Erreur lors de la suppression :", error);
        }
    };

    useEffect(() => {
        fetchActivePlayers();
        fetchTeams().then((data) => {
            setTeams(data ?? []);
        });
    }, []);

    const onClose = () => {
        setModalVisible(false);
    };

    const handleEdit = (team: Team) => {
        setEditingTeamId(team.id);
        setCustomName(team.customNom);
    };

    const updateCustomNom = async (teamId: string) => {
        if (!customName.trim()) return;
    
        try {
            await updateDoc(doc(db, "teams", teamId), {
                customNom: customName.trim()
            });
    
            setEditingTeamId("");
            fetchTeams().then((data) => {
                setTeams(data ?? []);
            });
        } catch (error) {
            console.error("Erreur lors de la mise à jour du nom :", error);
        }
    };

    const generateTeamColor = (index: number) => {
        switch (index) {
            case 0:
                return colors.team1;
            case 1:
                return colors.team2;
            case 2:
                return colors.team3;
            case 3:
                return colors.team4;
            case 4:
                return colors.team5;
            default:
                return colors.grayLight;
        }
    };

    return (
        <View style={{ flex: 1 }}>
            <Header text="Liste des équipes" />
            <View style={styles.container}>
                <ScrollView>
                    {teams.map((team, index) => {
                        const teamColor = generateTeamColor(index);
                        return (
                            <View key={index} style={[styles.teamContainer, { backgroundColor: teamColor }]}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    {editingTeamId === team.id ? (
                                        <TextInput
                                            style={{ paddingBottom: 10, borderBottomWidth: 1, borderColor: colors.grayMedium }}
                                            value={customName}
                                            onChangeText={setCustomName}
                                            onSubmitEditing={() => updateCustomNom(team.id)}
                                            onBlur={() => setEditingTeamId("")}
                                            autoFocus
                                        />
                                    ) : (
                                        <TouchableOpacity onPress={() => handleEdit(team)}>
                                            <ThemedText style={{ paddingBottom: 10 }} variant="subtitle1" color="grayDark">
                                                {team.customNom}
                                            </ThemedText>
                                        </TouchableOpacity>
                                    )}
                                    <View style={[styles.infoContainer, { backgroundColor: 'rgba(255, 255, 255, 0.3)' }]}>
                                        <ThemedText variant="subtitle2" color="grayDark">Joueurs : {team.totalPlayers}</ThemedText>
                                        <ThemedText variant="subtitle2" color="grayDark">Moyenne d'age : {(team.ageTotal/team.totalPlayers).toFixed()}</ThemedText>
                                    </View>
                                </View>
                                <View style={[styles.playerContainer, { backgroundColor: 'rgba(255, 255, 255, 0.3)' }]}>
                                    <View>
                                        <ThemedText variant="subtitle2" color="grayDark">Hommes :</ThemedText>
                                        {team.hommes.map((homme, idx) => (
                                            <ThemedText key={idx} style={styles.player} variant="subtitle3" color="grayDark">{homme.nom}</ThemedText>
                                        ))}
                                    </View>
                                    <View>
                                        <ThemedText variant="subtitle2" color="grayDark">Femmes :</ThemedText>
                                        {team.femmes.map((femme, idx) => (
                                            <ThemedText key={idx} style={styles.player} variant="subtitle3" color="grayDark">{femme.nom}</ThemedText>
                                        ))}
                                    </View>
                                </View>
                            </View>
                        );
                    })}
                </ScrollView>
                <Button title="Générer les équipes" onPress={() => setModalVisible(true)} />
                <Modal visible={modalVisible} animationType="fade" transparent={true} onRequestClose={onClose}>
                    <Pressable style={styles.backdrop} onPress={onClose}  />
                    <View style={styles.popup}>
                        <ThemedText variant="subtitle1" color="grayDark">Générer les équipes</ThemedText>

                        <TextInput
                        placeholder="Nombre d'équipes"
                        value={nbEquipes.toString()}
                        onChangeText={(text) => {
                            const num = Number(text);
                            
                            if (!isNaN(num) && num >= 1 && num <= 5) {
                                setNbEquipes(num);
                                setError('');
                            } else if (num > 5) {
                                setNbEquipes(0);
                                setError('Le nombre d\'équipes ne peut pas être supérieur à 5.');
                            } else if (num < 1) {
                                setNbEquipes(0);
                                setError('Le nombre d\'équipes doit être d\'au moins 1.');
                            }
                        }} 
                        keyboardType="numeric"
                        style={{ borderBottomWidth: 1, marginBottom: 10 }}
                        />
                        {error ? <Text style={{ color: 'red' }}>{error}</Text> : null}

                        <Button title="Générer" onPress={createBalancedTeams} />
                        <TouchableOpacity onPress={() => setModalVisible(false)} style={{ marginTop: 10, alignSelf: "center" }}>
                            <ThemedText style={{color: "red"}} variant="subtitle2">Annuler</ThemedText>
                        </TouchableOpacity>
                    </View>
                </Modal>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
    },
    teamContainer: {
        borderRadius: 8,
        padding: 15,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 2,
        elevation: 5,
    },
    infoContainer: {
        padding: 10,
        flexDirection: 'column',
        justifyContent: 'space-around',
        borderRadius: 8,
        marginBottom: 10,
    },
    playerContainer: {
        padding: 10,
        flexDirection: 'row',
        justifyContent: 'space-around',
        borderRadius: 8,
    },
    player: {
        fontSize: 14,
        marginLeft: 10,
    },
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    popup: {
        position: "absolute",
        top: "30%",
        left: "10%",
        backgroundColor: "white", 
        padding: 20, 
        borderRadius: 10, 
        width: "80%",
    },
})