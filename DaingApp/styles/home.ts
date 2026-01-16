import { StyleSheet } from "react-native";

export const homeStyles = StyleSheet.create({
  homeContainer: {
    flex: 1,
    backgroundColor: "#0a0e27",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
  },
  settingsButton: {
    padding: 8,
  },
  heroSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  heroButton: {
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 50,
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  heroButtonInner: {
    alignItems: "center",
  },
  heroButtonText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
    marginTop: 10,
  },
  heroButtonSubtext: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 5,
  },
  secondaryButtonsContainer: {
    flexDirection: "row",
    gap: 15,
  },
  secondaryButton: {
    backgroundColor: "#1e293b",
    paddingVertical: 20,
    paddingHorizontal: 25,
    borderRadius: 15,
    alignItems: "center",
    minWidth: 140,
    borderWidth: 1,
    borderColor: "#334155",
  },
  devButton: {
    backgroundColor: "#7c3aed",
    borderColor: "#8b5cf6",
  },
  secondaryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
  },
  secondaryButtonSubtext: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    marginTop: 4,
  },
});
