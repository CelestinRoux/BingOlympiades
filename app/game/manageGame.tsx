import React, { useState, useEffect } from "react";
import { Text, View, Button, TextInput, Modal, TouchableOpacity, Pressable, StyleSheet, ScrollView, Alert } from "react-native";
import { db, collection, doc, addDoc, deleteDoc } from "@/firebaseConfig";
import { ThemedText } from "@/components/ThemedText";
import { useThemeColors } from "@/hooks/useThemeColors";
import { fetchGames } from "@/hooks/useFetchGames";
import { Header } from "@/components/Header";
import { useLocalSearchParams } from "expo-router";

export default function ManageGame() {
    const colors = useThemeColors();
    const [modalVisible, setModalVisible] = useState(false);
    const { isUnlocked } = useLocalSearchParams();
    const unlocked = isUnlocked === "true";
    const [nom, setNom] = useState("");
    const [regles, setRegles] = useState("");
    const [games, setGames] = useState<Game[]>([]);
    const [idGameRuleOpen, setIdGameRuleOpen] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    
    const addGame = async () => {
        if (nom && regles) {
        try {
            await addDoc(collection(db, "games"), {
            nom: nom.trim(),
            regles: regles,
            });
            console.log("Jeu ajouté !");
            setModalVisible(false);
            setNom("");
            setRegles("");
            fetchGames().then((data) => {
                setGames(data ?? []);
            });
        } catch (error) {
            console.error("Erreur lors de l'ajout :", error);
        }
        } else {
            alert("Veuillez remplir tous les champs !");
        }
    };

    const delGame = async (id: string) => {
            Alert.alert(
                "Confirmation de suppression",
                "Êtes-vous sûr de vouloir supprimer ce jeu ?",
                [
                    {
                        text: "Annuler",
                        onPress: () => console.log("Suppression annulée"),
                        style: "cancel",
                    },
                    {
                        text: "Supprimer",
                        onPress: async () => {
                            try {
                                await deleteDoc(doc(db, "games", id));
                                console.log("Jeu supprimé !");
                                fetchGames().then((data) => {
                                    setGames(data ?? []);
                                });
                            } catch (error) {
                                console.error("Erreur lors de la suppression :", error);
                            }
                        },
                    },
                ],
                { cancelable: false }
            );
        };

    useEffect(() => {
        fetchGames().then((data) => {
            setGames(data ?? []);
        });
    }, []);

    const onClose = () => {
        setModalVisible(false);
    }

    const toggleText = (gameId: string) => {
        if (gameId == idGameRuleOpen || idGameRuleOpen == "" || !isOpen) {
            setIsOpen(!isOpen);
        }
        setIdGameRuleOpen(gameId);
    };

    return (
        <View style={{flex: 1}}>
            <Header text="Liste des jeux" />
            <View style={styles.container}>
                <ScrollView>
                    {games.map((game, index) => {
                        return (
                            <View key={index} style={[styles.gameContainer, {backgroundColor: colors.tint}]}>
                                <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                                    <ThemedText style={{paddingBottom: 10}} variant="subtitle1" color="grayDark">{game.nom}</ThemedText>
                                    {(unlocked && 
                                        <TouchableOpacity 
                                            onPress={() => delGame(game.id)} 
                                            style={{ backgroundColor: 'transparent' }}
                                        >
                                            <Text style={{ fontSize: 20 }}>❌</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                                <View style={[styles.reglesContainer, { backgroundColor: 'rgba(255, 255, 255, 0.3)' }]}>
                                <TouchableOpacity onPress={() => toggleText(game.id)}>
                                    <ThemedText style={styles.toggleButton} variant="subtitle2">
                                    {isOpen && game.id == idGameRuleOpen ? '⬆️' : 'Afficher les règles'}
                                    </ThemedText>
                                </TouchableOpacity>

                                {isOpen && game.id == idGameRuleOpen && (
                                    <ThemedText variant="subtitle3" color="grayDark">
                                    {game.regles}
                                    </ThemedText>
                                )}
                                </View>
                            </View>
                        )
                    })}
                </ScrollView>
                {(unlocked && 
                    <Button title="Ajouter un jeu" onPress={() => setModalVisible(true)} />
                )}
                    
                {/* 🔹 Modal pour ajouter un jeu */}
                <Modal visible={modalVisible} animationType="fade" transparent={true} onRequestClose={onClose}>
                    <Pressable style={styles.backdrop} onPress={onClose}  />
                    <View style={styles.popup}>
                        <ThemedText style={{paddingBottom: 5}} variant="subtitle1" color="grayDark">Ajouter un jeu</ThemedText>

                        <TextInput
                        placeholder="Nom du jeu"
                        value={nom}
                        onChangeText={setNom}
                        style={{ borderBottomWidth: 1, marginBottom: 10 }}
                        />

                        <TextInput
                            placeholder="Règles du jeu"
                            value={regles}
                            onChangeText={setRegles}
                            multiline={true}
                            numberOfLines={10}
                            style={{
                                borderWidth: 1,
                                padding: 10,
                                marginBottom: 10,
                                textAlignVertical: 'top',
                            }}
                        />

                        <Button title="Ajouter" onPress={addGame} />
                        <TouchableOpacity onPress={() => setModalVisible(false)} style={{ marginTop: 10, alignSelf: "center" }}>
                            <ThemedText style={{color: "red"}} variant="subtitle2">Annuler</ThemedText>
                        </TouchableOpacity>
                    </View>
                </Modal>
            </View>
        </View>
        )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
    },
    gameContainer: {
        borderRadius: 8,
        padding: 15,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 2,
        elevation: 5,
    },
    reglesContainer: {
        padding: 10,
        flexDirection: 'column',
        alignItems: 'center',
        borderRadius: 8,
    },
    toggleButton: {
    color: '#007BFF',
    marginBottom: 10,
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