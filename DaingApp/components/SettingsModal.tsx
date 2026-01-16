import React from "react";
import { View, Text, Modal, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { modalStyles } from "../styles/modal";

interface SettingsModalProps {
  visible: boolean;
  devMode: boolean;
  onToggleDevMode: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  devMode,
  onToggleDevMode,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={modalStyles.modalOverlay}>
        <View style={modalStyles.modalContent}>
          <Text style={modalStyles.modalTitle}>Settings</Text>

          <TouchableOpacity
            style={modalStyles.settingRow}
            onPress={onToggleDevMode}
          >
            <Text style={modalStyles.settingText}>Developer Mode</Text>
            <View
              style={[
                modalStyles.checkbox,
                devMode && modalStyles.checkboxActive,
              ]}
            >
              {devMode && <Ionicons name="checkmark" size={20} color="white" />}
            </View>
          </TouchableOpacity>

          <Text style={modalStyles.settingDescription}>
            Enables data gathering mode for building training datasets
          </Text>

          <TouchableOpacity style={modalStyles.closeButton} onPress={onClose}>
            <Text style={modalStyles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
