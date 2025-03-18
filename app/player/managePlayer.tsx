import React, { useState, useEffect, useRef } from "react";
import { Text, View, Button, TextInput, FlatList, Modal, TouchableOpacity, Pressable, StyleSheet, Switch, Alert, ScrollView } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { db, collection, doc, addDoc, deleteDoc, updateDoc, getDocs } from "@/firebaseConfig";
import DateTimePicker from '@react-native-community/datetimepicker';
import { ThemedText } from "@/components/ThemedText";
import { Header } from "@/components/Header";

export default function ManagePlayer() {
    const [modalVisible, setModalVisible] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const inputDateRef = useRef<TextInput>(null);
    const [nom, setNom] = useState("");
    const [dateNaissance, setDateNaissance] = useState<Date | null>(null);
    const [sexe, setSexe] = useState("");
    const [active, setActive] = useState<Record<string, boolean>>({});
    const [players, setPlayers] = useState<Player[]>([]);

    const addPlayer = async () => {
        if (nom && dateNaissance  && sexe) {
        try {
            const dateNaissanceInit = new Date(dateNaissance);
            dateNaissanceInit.setHours(0, 0, 0, 0);

            await addDoc(collection(db, "players"), {
            nom: nom.trim(),
            dateNaissance: dateNaissanceInit.toString(),
            sexe: sexe,
            active: true,
            });
            console.log("Joueur ajouté !");
            setModalVisible(false);
            setNom("");
            setDateNaissance(null);
            setSexe("");
            fetchPlayers();
        } catch (error) {
            console.error("Erreur lors de l'ajout :", error);
        }
        } else {
            alert("Veuillez remplir tous les champs !");
        }
    };

    const delPlayer = async (id: string) => {
        Alert.alert(
            "Confirmation de suppression",
            "Êtes-vous sûr de vouloir supprimer ce joueur ?",
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
                            await deleteDoc(doc(db, "players", id));
                            console.log("Joueur supprimé !");
                            fetchPlayers();
                        } catch (error) {
                            console.error("Erreur lors de la suppression :", error);
                        }
                    },
                },
            ],
            { cancelable: false }
        );
    };

    const fetchPlayers = async () => {
        try {
        const querySnapshot = await getDocs(collection(db, "players"));
        const playersList = querySnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                nom: data.nom,
                dateNaissance: data.dateNaissance,
                sexe: data.sexe,
                active: data.active,
            };
        });
        playersList.sort((a, b) => Date.parse(a.dateNaissance) - Date.parse(b.dateNaissance));
        setPlayers(playersList);
        } catch (error) {
        console.error("Erreur lors de la récupération :", error);
        }
    };

    const handleSwitchChange = async (id: string) => {
        const updatedPlayers = players.map((player) =>
            player.id === id ? { ...player, active: !player.active } : player
        );
        setPlayers(updatedPlayers);
    
        try {
            const playerRef = doc(db, 'players', id);
            await updateDoc(playerRef, {
                active: updatedPlayers.find(player => player.id === id)?.active,
            });
    
            console.log('Statut active joueur modifié !');
        } catch (error) {
            console.error('Errueur modification statut active joueur :', error);
        }
    };

    const calculateAge = (dob: string) => {
        const naissance = new Date(dob);
        const age = new Date().getFullYear() - naissance.getFullYear();
        const moisDiff = new Date().getMonth() - naissance.getMonth();
        return moisDiff < 0 ? age - 1 : age;  // Ajuste si l'anniversaire n'est pas encore passé
    };

    const formatDate = (date: Date) => {
        if (!date) return '';
        return date.toLocaleDateString();
    };

    useEffect(() => {
        fetchPlayers();
    }, []);

    const onClose = () => {
        setModalVisible(false);
    }

    return (
        <View style={{ flex: 1 }}>
            <Header text="Liste des joueurs" />
            <View style={styles.container}>
                <ScrollView style={styles.listPlayers}>
                    {players.map((player, index) => {
                        return (
                            <View key={index} style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                                <ThemedText style={{flex: 1}} variant="subtitle2" color="grayDark">
                                    {player.nom} - {calculateAge(player.dateNaissance)} ans - {player.sexe}
                                </ThemedText>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 20 }}>
                                    <Switch
                                        value={active[player.id] !== undefined ? active[player.id] : player.active}
                                        onValueChange={() => handleSwitchChange(player.id)}
                                    />
                                    <TouchableOpacity 
                                        onPress={() => delPlayer(player.id)} 
                                        style={{ backgroundColor: 'transparent' }}
                                    >
                                        <Text style={{ fontSize: 20 }}>❌</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )
                    })}
                </ScrollView>
                <Button title="Ajouter un joueur" onPress={() => setModalVisible(true)} />

                <Modal visible={modalVisible} animationType="fade" transparent={true} onRequestClose={onClose}>
                    <Pressable style={styles.backdrop} onPress={onClose}  />
                    <View style={styles.popup}>
                        <ThemedText style={{paddingBottom: 5}} variant="subtitle1" color="grayDark">Ajouter un joueur</ThemedText>

                        <TextInput
                        placeholder="Nom"
                        value={nom}
                        onChangeText={setNom}
                        style={{ borderBottomWidth: 1, marginBottom: 10 }}
                        />

                        <View style={{ marginBottom: 10 }}>
                            <TextInput
                                ref={inputDateRef}
                                value={formatDate(dateNaissance!!)}
                                placeholder="> Sélectionner une date <"
                                onFocus={() => setShowDatePicker(true)}
                                style={{ borderBottomWidth: 1, marginBottom: 10 }}
                            />

                            {showDatePicker && (
                                <DateTimePicker
                                    value={dateNaissance || new Date()}
                                    mode="date"
                                    display="default"
                                    onChange={(event, selectedDate) => {
                                        if (selectedDate) {
                                            setDateNaissance(selectedDate);
                                        }
                                        setShowDatePicker(false);
                                        inputDateRef.current!!.blur();
                                    }}
                                />
                            )}
                        </View>

                        <Picker
                        selectedValue={sexe}
                        onValueChange={(itemValue) => setSexe(itemValue)}
                        style={{ marginBottom: 10 }}
                        >
                            <Picker.Item label="Sélectionnez le sexe" enabled={false} value="" />
                            <Picker.Item label="Homme" value="H" />
                            <Picker.Item label="Femme" value="F" />
                        </Picker>

                        <Button title="Ajouter" onPress={addPlayer} />
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
    listPlayers: {
        paddingHorizontal: 20,
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