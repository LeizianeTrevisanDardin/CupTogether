import { StyleSheet } from "react-native";

export const commonStyles = StyleSheet.create({
  centeredContainer: {
    flex: 1,
    backgroundColor: "#FFF9F5",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  emoji: {
    fontSize: 60,
    marginBottom: 16,
  },

  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#3B241C",
  },

  subtitle: {
    marginTop: 10,
    fontSize: 16,
    textAlign: "center",
    color: "#76594F",
  },
});