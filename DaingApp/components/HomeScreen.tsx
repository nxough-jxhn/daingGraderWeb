import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { homeStyles } from "../styles/home";
import type { Screen } from "../types";

interface HomeScreenProps {
  onNavigate: (screen: Screen) => void;
  onOpenSettings: () => void;
  devMode: boolean;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigate,
  onOpenSettings,
  devMode,
}) => {
  return (
    <View style={homeStyles.homeContainer}>
      {/* HEADER WITH SETTINGS */}
      <View style={homeStyles.header}>
        <Text style={homeStyles.appTitle}>DaingGrader</Text>
        <TouchableOpacity
          style={homeStyles.settingsButton}
          onPress={onOpenSettings}
        >
          <Ionicons name="settings-outline" size={28} color="white" />
        </TouchableOpacity>
      </View>

      {/* HERO SECTION */}
      <View style={homeStyles.heroSection}>
        {/* HERO BUTTON - SCAN */}
        <TouchableOpacity
          style={homeStyles.heroButton}
          onPress={() => onNavigate("scan")}
          activeOpacity={0.8}
        >
          <View style={homeStyles.heroButtonInner}>
            <Ionicons name="camera" size={80} color="#fff" />
            <Text style={homeStyles.heroButtonText}>SCAN</Text>
            <Text style={homeStyles.heroButtonSubtext}>Analyze Dried Fish</Text>
          </View>
        </TouchableOpacity>

        {/* SECONDARY BUTTONS */}
        <View style={homeStyles.secondaryButtonsContainer}>
          <TouchableOpacity
            style={homeStyles.secondaryButton}
            onPress={() => onNavigate("analytics")}
          >
            <Ionicons name="analytics-outline" size={32} color="#fff" />
            <Text style={homeStyles.secondaryButtonText}>Analytics</Text>
            <Text style={homeStyles.secondaryButtonSubtext}>View History</Text>
          </TouchableOpacity>

          {/* DATA GATHERING BUTTON (DEV MODE ONLY) */}
          {devMode && (
            <TouchableOpacity
              style={[homeStyles.secondaryButton, homeStyles.devButton]}
              onPress={() => onNavigate("dataGathering")}
            >
              <Ionicons name="folder-open-outline" size={32} color="#fff" />
              <Text style={homeStyles.secondaryButtonText}>Data Gathering</Text>
              <Text style={homeStyles.secondaryButtonSubtext}>
                Build Dataset
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};
