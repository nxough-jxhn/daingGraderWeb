import { StyleSheet } from "react-native";

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "transparent",
    margin: 64,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  innerButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "black",
  },
  previewContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  previewImage: {
    width: "90%",
    height: "70%",
    resizeMode: "contain",
    marginBottom: 20,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    backgroundColor: "blue",
    marginHorizontal: 10,
  },
  text: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  row: {
    flexDirection: "row",
  },
  resultHeader: {
    fontSize: 20,
    color: "#00ff00",
    marginBottom: 20,
    fontWeight: "bold",
  },
  screenHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: "#0a0e27",
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  placeholderText: {
    fontSize: 22,
    color: "#666",
    marginTop: 20,
    fontWeight: "600",
  },
  placeholderSubtext: {
    fontSize: 14,
    color: "#555",
    marginTop: 10,
    textAlign: "center",
  },
});
