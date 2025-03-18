import { View, ViewProps, StyleSheet, TouchableOpacity, Modal, TextInput, Pressable } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { ThemedText } from './ThemedText';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useNavigation } from 'expo-router';
import { useState } from 'react';
import { getAuth, signInWithEmailAndPassword  } from "firebase/auth";
import { app } from "@/firebaseConfig";
import Constants from 'expo-constants';

type Props = ViewProps & {
    text: string;
    isHome?: boolean;
    isUnlocked?: boolean;
    onUnlock?: () => void;
    onLock?: () => void;
};

export function Header({ text, isHome, isUnlocked, onLock, onUnlock, style, ...rest }: Props) {
  const colors = useThemeColors();
  const navigation = useNavigation();
  const [password, setPassword] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  const auth = getAuth(app);

 
  const handleUnlock = async () => {
    try {
      await signInWithEmailAndPassword(auth, Constants.expoConfig?.extra?.ADMIN_EMAIL, password);
      setModalVisible(false);
      onUnlock?.();
    } catch (error) {
      alert("Email ou mot de passe incorrect");
    }
  };

  const onClose = () => {
    setModalVisible(false);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.grayWhite }]} {...rest}>
        <ThemedText variant="headline" color="tint">{text}</ThemedText>
        
        <TouchableOpacity onPress={() => isHome && isUnlocked ? onLock?.() : (isHome ? setModalVisible(true) : navigation.goBack())}>
          {isHome && (
            <Icon name={isUnlocked ? "unlock" : "lock"} size={20} color="black" />
          )}
          {!isHome && (
            <Icon name="arrow-left" size={20} color="black" />
          )}
        </TouchableOpacity>

        <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={onClose}>
          <Pressable style={styles.backdrop} onPress={() => onClose()} />
            <View style={styles.popup}>
              <ThemedText variant='subtitle2' color='grayDark'>Entrez le mot de passe</ThemedText>
              <TextInput 
                secureTextEntry 
                value={password} 
                onChangeText={setPassword} 
                style={{ borderWidth: 1, padding: 8, width: 150, marginTop: 10 }} 
              />
              <TouchableOpacity onPress={handleUnlock} style={{ marginTop: 10, backgroundColor: colors.tint, padding: 10, borderRadius: 5 }}>
                <ThemedText variant='subtitle2' color='grayDark'>Déverrouiller</ThemedText>
              </TouchableOpacity>
            </View>
        </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
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
  });