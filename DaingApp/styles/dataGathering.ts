import { StyleSheet } from "react-native";

export const dataGatheringStyles = StyleSheet.create({
  selectionPanel: {
    backgroundColor: "#1e293b",
    padding: 20,
  },
  pickerGroup: {
    marginBottom: 15,
  },
  pickerLabel: {
    fontSize: 16,
    color: "white",
    marginBottom: 8,
    fontWeight: "600",
  },
  selectorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  selectorButton: {
    backgroundColor: "#0a0e27",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#334155",
  },
  selectorButtonActive: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
  },
  selectorButtonText: {
    color: "#94a3b8",
    fontSize: 14,
    fontWeight: "600",
  },
  selectorButtonTextActive: {
    color: "white",
  },
});
