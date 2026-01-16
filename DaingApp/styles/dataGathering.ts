import { StyleSheet } from "react-native";

export const dataGatheringStyles = StyleSheet.create({
  selectionPanel: {
    backgroundColor: "rgba(10, 14, 39, 0.95)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  statusLabel: {
    position: "absolute",
    top: 10,
    left: 20,
    right: 20,
    backgroundColor: "rgba(10, 14, 39, 0.8)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    zIndex: 5,
    alignItems: "center",
  },
  statusText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  pickerGroup: {
    marginBottom: 8,
  },
  pickerLabel: {
    fontSize: 14,
    color: "white",
    marginBottom: 6,
    fontWeight: "600",
  },
  selectorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  selectorButton: {
    backgroundColor: "rgba(30, 41, 59, 0.7)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(51, 65, 85, 0.8)",
  },
  selectorButtonActive: {
    backgroundColor: "rgba(59, 130, 246, 0.9)",
    borderColor: "#3b82f6",
  },
  selectorButtonText: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "600",
  },
  selectorButtonTextActive: {
    color: "white",
  },
});
