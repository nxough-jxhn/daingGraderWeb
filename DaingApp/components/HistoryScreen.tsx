import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { commonStyles } from "../styles/common";
import type { Screen } from "../types";

interface HistoryScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ onNavigate }) => {
  return (
    <View style={commonStyles.container}>
      <View style={commonStyles.screenHeader}>
        <TouchableOpacity onPress={() => onNavigate("home")}>
          <Ionicons name="arrow-back" size={28} color="white" />
        </TouchableOpacity>
        <Text style={commonStyles.screenTitle}>History</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={commonStyles.centerContent}>
        <Ionicons name="time-outline" size={80} color="#666" />
        <Text style={commonStyles.placeholderText}>History</Text>
        <Text style={commonStyles.placeholderSubtext}>
          Scan history will appear here
        </Text>
      </View>
    </View>
  );
};
