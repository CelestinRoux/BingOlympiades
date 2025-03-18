import { Animated, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { RelativePathString } from "expo-router";
import { ButtonLink } from "@/components/ButtonLink";
import { useEffect, useRef } from 'react';
import { fetchTeams } from "@/hooks/useFetchTeams";
import { useState } from 'react';
import { fetchGames } from '@/hooks/useFetchGames';
import { ThemedText } from "@/components/ThemedText";
import { useThemeColors } from "@/hooks/useThemeColors";
import { fetchScores } from "@/hooks/useFetchScores";
import { db, collection, doc, addDoc, deleteDoc, getDocs, setDoc } from "@/firebaseConfig";
import { Header } from "@/components/Header";
import { TextInput } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { TeamRanking } from "@/components/TeamRanking";

export default function Index() {
  const colors = useThemeColors();
  const isFocused = useIsFocused();
  const isUpdatingRef = useRef(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<{ gameId: string, teamId: string, teamName: string, customTeamName: string } | null>(null);
  const [scorePositive, setScorePositive] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [scores, setScores] = useState<Record<string, Record<string, number>>>({});
  const [totalScoresTeam, setTotalScoresTeam] = useState<{ teamTotalScores: Record<string, number>; teamGamesPlayed: Record<string, number>; maxScore: number }>({ teamTotalScores: {}, teamGamesPlayed: {}, maxScore: 0 });
  const [scoreModal, setScoreModal] = useState(0);
  const [scrollTabX, setScrollTabX] = useState(0); 
  const [error, setError] = useState<string>('');

  const processScores = (scores: Score[]) => {
    const formattedScores: Record<string, Record<string, number>> = {};

    scores.forEach(({ id_game, id_team, points }) => {
        if (!formattedScores[id_game]) {
            formattedScores[id_game] = {};
        }
        formattedScores[id_game][id_team] = points;
    });

    return formattedScores;
  };

  const updateScore = async (id_game: string, id_team: string, newPoints: number) => {
    if (isUpdatingRef.current) {
      console.log("Mise à jour déjà en cours, ignorée.");
      return;
    }

    isUpdatingRef.current = true;

    try {
      const scoreId = `${id_game}_${id_team}`;
      const finalPoints = Math.max(0, newPoints);

      if (finalPoints === 0) {
          await deleteDoc(doc(db, "scores", scoreId));
      } else {
          await setDoc(doc(db, "scores", scoreId), {
              id_game,
              id_team,
              points: finalPoints
          }, { merge: true });
      }

      fetchScores().then((data) => {  
        const formattedData = processScores(data ?? []);
        setScores(formattedData);
        setTotalScoresTeam(calculateTotalScores(formattedData));
      });
      fetchTeams().then((data) => {
        setTeams(data ?? []);
      });

    } catch (error) {
        console.error("Erreur lors de la mise à jour du score :", error);
    } finally {
        isUpdatingRef.current = false;
    }
  };

  const calculateTotalScores = (formattedScores: Record<string, Record<string, number>>) => {
    const teamTotalScores: Record<string, number> = {};
    const teamGamesPlayed: Record<string, number> = {};
    let maxScore = 0;

    Object.values(formattedScores).forEach(gameScores => {
        Object.entries(gameScores).forEach(([teamId, points]) => {
            teamTotalScores[teamId] = (teamTotalScores[teamId] ?? 0) + points;
            teamGamesPlayed[teamId] = (teamGamesPlayed[teamId] ?? 0) + 1;

            if (teamTotalScores[teamId] > maxScore) {
                maxScore = teamTotalScores[teamId];
            }
        });
    });

    return { teamTotalScores, teamGamesPlayed, maxScore };
  };

  useEffect(() => {
    if (isFocused) {
      fetchScores().then((data) => {
        const formattedData = processScores(data ?? []);
        setScores(formattedData);
        setTotalScoresTeam(calculateTotalScores(formattedData));
      });
      fetchTeams().then((data) => {
        setTeams(data ?? []);
      });
      fetchGames().then((data) => {
        setGames(data ?? []);
      });
    }
  }, [isFocused]);
  
  const onClose = () => {
    setModalVisible(false);
    setScoreModal(0);
    setScorePositive(true);
    setSelectedTeam(null);
  }

  const generateTeamColor = (teamName: string)=> {
    switch (teamName) {
        case "Equipe 1":
            return colors.team1;
        case "Equipe 2":
            return colors.team2;
        case "Equipe 3":
            return colors.team3;
        case "Equipe 4":
            return colors.team4;
        case "Equipe 5":
            return colors.team5;
        default:
            return colors.grayLight;
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Header text="BingOlympiades" isHome={true} isUnlocked={isUnlocked} onUnlock={() => setIsUnlocked(true)} onLock={() => setIsUnlocked(false)}  />
      <ScrollView style={{ padding: 15}} contentContainerStyle={{ paddingBottom: 30, gap: 20 }} scrollEnabled={!modalVisible}>
        
        {Object.keys(totalScoresTeam).length > 0 && (
          <View style={styles.classement}>
              <ThemedText style={{textAlign: 'center'}} variant="subtitle2" color="grayDark">Classement</ThemedText>
            <View>
                {teams.map(t => (
                    <TeamRanking 
                        key={t.id} 
                        name={t.customNom} 
                        value={totalScoresTeam.teamTotalScores[t.id] ?? 0} 
                        color={generateTeamColor(t.nom)}
                        nbTotalGames={games.length}
                        nbGames={totalScoresTeam.teamGamesPlayed[t.id] ?? 0}
                        maxScore={totalScoresTeam.maxScore}
                    />
                ))}
            </View>
          </View>
        )}

        <View style={styles.tabScores}>
          <View>
            <Animated.ScrollView
              horizontal
              scrollEventThrottle={16}              
              contentOffset={{ x: scrollTabX, y: 0 }}
              style={{ pointerEvents: 'none' }}
              scrollEnabled={!modalVisible}
            >
              <View style={styles.headerRow}>
                <View style={styles.headerCell} />
                {teams.map((team) => (
                  <ThemedText 
                    key={team.id} 
                    style={[styles.headerCell, { backgroundColor: generateTeamColor(team.nom) }]} 
                    variant="subtitle2" 
                    color="grayDark"
                  >
                    {team.customNom}
                  </ThemedText>
                ))}
              </View>
            </Animated.ScrollView>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
            <Animated.ScrollView
              horizontal
              scrollEventThrottle={16}
              onScroll={(event) => {
                const contentOffsetX = event.nativeEvent.contentOffset.x;
                setScrollTabX(contentOffsetX);
              }}
              scrollEnabled={!modalVisible}
            >
              <View>
                {games.map((game) => (
                  <View key={game.id} style={styles.row}>
                    <ThemedText 
                      style={[styles.cell, styles.firstCell]} 
                      variant="subtitle2" 
                      color="grayDark"
                    >
                      {game.nom}
                    </ThemedText>

                    {teams.map((team) => (
                      <View key={team.id} style={styles.cell}>
                        {(isUnlocked &&
                          <TouchableOpacity 
                            onPress={() => updateScore(game.id, team.id, (scores[game.id]?.[team.id] ?? 0) -1)} 
                            style={[styles.button, { backgroundColor: colors.tint }]}
                          >
                            <Text style={styles.buttonText}>-</Text>
                          </TouchableOpacity>
                        )}

                        <TouchableOpacity 
                          onPress={() => {
                            if (!isUnlocked) return;
                            setSelectedTeam({ gameId: game.id, teamId: team.id, teamName: team.nom, customTeamName: team.customNom });
                            setModalVisible(true);
                          }} 
                          style={[styles.buttonScore, { backgroundColor: colors.grayWhite }]}
                        >
                          <ThemedText variant="subtitle3" color="grayDark">
                            {scores[game.id]?.[team.id] || 0}
                          </ThemedText>
                        </TouchableOpacity>


                        {(isUnlocked &&
                          <TouchableOpacity 
                            onPress={() => updateScore(game.id, team.id, (scores[game.id]?.[team.id] ?? 0) +1)} 
                            style={[styles.button, { backgroundColor: colors.tint }]}
                          >
                            <Text style={styles.buttonText}>+</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </Animated.ScrollView>
          </ScrollView>


          {modalVisible && selectedTeam && isUnlocked && (
            <Modal visible={modalVisible} animationType="fade" transparent={true} onRequestClose={() => onClose()}>
                <Pressable style={styles.backdrop} onPress={() => onClose()} />
                <View style={styles.popup}>
                  <ThemedText style={[styles.titleModal, {backgroundColor: generateTeamColor(selectedTeam.teamName)}]} variant="subtitle1" color="grayDark">
                    {selectedTeam.customTeamName} : {scores[selectedTeam.gameId]?.[selectedTeam.teamId] ?? 0}
                  </ThemedText>

                  <View style={styles.popupInner}>
                    <View style={styles.viewPresetsScore}>
                      <TouchableOpacity onPress={() => {
                        updateScore(selectedTeam.gameId, selectedTeam.teamId, (scores[selectedTeam.gameId]?.[selectedTeam.teamId] ?? 0) + (scorePositive ? 3 : -3))
                        onClose();
                      }} style={[styles.buttonScoreModal, {backgroundColor: colors.tint}]}>
                        <ThemedText variant="subtitle1" color="grayWhite">{scorePositive ? "+" : "-"}3</ThemedText>
                      </TouchableOpacity>

                      <TouchableOpacity onPress={() => {
                        setScoreModal(3);
                        updateScore(selectedTeam.gameId, selectedTeam.teamId, (scores[selectedTeam.gameId]?.[selectedTeam.teamId] ?? 0) + (scorePositive ? 5 : -5))
                        onClose();
                      }} style={[styles.buttonScoreModal, {backgroundColor: colors.tint}]}>
                        <ThemedText variant="subtitle1" color="grayWhite">{scorePositive ? "+" : "-"}5</ThemedText>
                      </TouchableOpacity>

                      <TouchableOpacity onPress={() => {
                        setScoreModal(3);
                        updateScore(selectedTeam.gameId, selectedTeam.teamId, (scores[selectedTeam.gameId]?.[selectedTeam.teamId] ?? 0) + (scorePositive ? 10 : -10))
                        onClose();
                      }} style={[styles.buttonScoreModal, {backgroundColor: colors.tint}]}>
                        <ThemedText variant="subtitle1" color="grayWhite">{scorePositive ? "+" : "-"}10</ThemedText>
                      </TouchableOpacity>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                      <TouchableOpacity onPress={() => setScorePositive(!scorePositive)} style={[styles.button, {backgroundColor: colors.tint, width: 40, height: 40}]}>
                        <Text style={[styles.buttonText, {fontSize: 25}]}>{scorePositive ? "+" : "-"}</Text>
                      </TouchableOpacity>

                      <View style={{ width: '50%' }}>
                        <TextInput
                          placeholder="Saisir score"
                          value={scoreModal.toString()}
                          autoFocus
                          onChangeText={(text) => {
                              const num = Number(text);
                              
                              if (!isNaN(num) && num >= 1) {
                                  setScoreModal(num);
                                  setError('');
                              } else if (num < 1) {
                                  setScoreModal(0);
                                  setError('Le score doit être d\'au moins 1.');
                              }
                          }} 
                          onSubmitEditing={() => {
                            updateScore(selectedTeam.gameId, selectedTeam.teamId, (scores[selectedTeam.gameId]?.[selectedTeam.teamId] ?? 0) + (scorePositive ? scoreModal : -scoreModal))
                            onClose();
                          }}
                          keyboardType="numeric"
                          style={{ borderWidth: 1, borderRadius: 5, textAlign: 'center', fontSize: 20 }}
                          />
                          {error ? <Text style={{ color: 'red' }}>{error}</Text> : null}
                        </View>
                    </View>
                  </View>
                </View>
                  
              </Modal>
            )}
        </View>
        {isUnlocked && (
          <View style={{gap: 10}}>
            <ButtonLink path={"./player/managePlayer" as RelativePathString} text="Gestion des joueurs" />
            <ButtonLink path={"./team/manageTeam" as RelativePathString} text="Gestion des équipes" />
            <ButtonLink path={"./game/manageGame" as RelativePathString} text="Gestion des jeux" />
          </View>
        )}
        
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  classement: {
    padding: 10,
    borderRadius: 15,
    backgroundColor: 'white',
    gap: 10,
    shadowColor: 'black',
    elevation: 5,
  },
  container: {
      borderWidth: 1,
  },
  tabScores: {
    height: 250,
    marginVertical: 50,
  },
  headerRow: {
      flexDirection: 'row',
      paddingLeft: 11,
  },
  row: {
      flexDirection: 'row',
      padding: 10,
      borderBottomWidth: 1,
      alignItems: 'center',
  },
  headerCell: {
      flex: 1,
      textAlign: 'center',
      width: 85,
      padding: 10,
  },
  firstCell: {
      textAlign: 'left',
  },
  cell: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      width: 85,
  },
  button: {
      paddingVertical: 2,
      paddingHorizontal: 4,
      borderRadius: 5,
      marginHorizontal: 5,
      width: 20,
      height: 25,
      alignItems: 'center',
      justifyContent: 'center',
  },  
  buttonScore: {
    padding: 8,
    borderRadius: 5,
  },
  buttonScoreModal: {
    padding: 8,
    borderRadius: 5,
    width: 75,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 16,
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
      borderRadius: 10, 
      width: "80%",
  },
  popupInner: {
    padding: 20, 
  },
  titleModal: {
    padding: 5,
    borderTopRightRadius: 10, 
    borderTopLeftRadius: 10, 
    textAlign: 'center',
  },
  viewPresetsScore: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 20, 
    gap: 10,
  },
});