import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { CameraView } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { commonStyles } from "../styles/common";
import type { Screen } from "../types";

interface ScanScreenProps {
  cameraRef: React.RefObject<CameraView | null>;
  capturedImage: string | null;
  resultImage: string | null;
  loading: boolean;
  onNavigate: (screen: Screen) => void;
  onTakePicture: () => void;
  onAnalyze: () => void;
  onReset: () => void;
}

export const ScanScreen: React.FC<ScanScreenProps> = ({
  cameraRef,
  capturedImage,
  resultImage,
  loading,
  onNavigate,
  onTakePicture,
  onAnalyze,
  onReset,
}) => {
  return (
    <View style={commonStyles.container}>
      {!resultImage && !capturedImage && (
        <View style={commonStyles.screenHeader}>
          <TouchableOpacity
            onPress={() => {
              onReset();
              onNavigate("home");
            }}
          >
            <Ionicons name="arrow-back" size={28} color="white" />
          </TouchableOpacity>
          <Text style={commonStyles.screenTitle}>Scan Fish</Text>
          <View style={{ width: 28 }} />
        </View>
      )}

      {/* SCENARIO A: SHOW RESULT FROM SERVER */}
      {resultImage ? (
        <View style={commonStyles.previewContainer}>
          <Text style={commonStyles.resultHeader}>✅ ANALYSIS COMPLETE</Text>
          <Image
            source={{ uri: resultImage }}
            style={commonStyles.previewImage}
          />
          <TouchableOpacity
            style={commonStyles.button}
            onPress={() => {
              onReset();
              onNavigate("home");
            }}
          >
            <Text style={commonStyles.text}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      ) : /* SCENARIO B: SHOW PREVIEW BEFORE SENDING */
      capturedImage ? (
        <View style={commonStyles.previewContainer}>
          <Image
            source={{ uri: capturedImage }}
            style={commonStyles.previewImage}
          />
          {loading ? (
            <ActivityIndicator size="large" color="#00ff00" />
          ) : (
            <View style={commonStyles.row}>
              <TouchableOpacity
                style={[commonStyles.button, { backgroundColor: "red" }]}
                onPress={onReset}
              >
                <Text style={commonStyles.text}>Retake</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[commonStyles.button, { backgroundColor: "green" }]}
                onPress={onAnalyze}
              >
                <Text style={commonStyles.text}>Analyze</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        /* SCENARIO C: LIVE CAMERA */
        <CameraView style={commonStyles.camera} ref={cameraRef}>
          <View style={commonStyles.buttonContainer}>
            <TouchableOpacity
              style={commonStyles.captureButton}
              onPress={onTakePicture}
            >
              <View style={commonStyles.innerButton} />
            </TouchableOpacity>
          </View>
        </CameraView>
      )}
    </View>
  );
};
