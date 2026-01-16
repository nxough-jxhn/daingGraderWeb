import { useState, useRef } from "react";
import { View, Button, Alert } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { commonStyles } from "../styles/common";
import { HomeScreen } from "../components/HomeScreen";
import { ScanScreen } from "../components/ScanScreen";
import { AnalyticsScreen } from "../components/AnalyticsScreen";
import { DataGatheringScreen } from "../components/DataGatheringScreen";
import { SettingsModal } from "../components/SettingsModal";
import { takePicture } from "../utils/camera";
import { analyzeFish, uploadDataset } from "../services/api";
import { SERVER_URL } from "../constants/config";
import type { Screen, FishType, Condition } from "../types";

export default function Index() {
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  // Navigation & Settings
  const [currentScreen, setCurrentScreen] = useState<Screen>("home");
  const [showSettings, setShowSettings] = useState(false);
  const [devMode, setDevMode] = useState(false);

  // Data Gathering Mode
  const [fishType, setFishType] = useState<FishType>("danggit");
  const [condition, setCondition] = useState<Condition>("local_quality");

  // Check camera permissions
  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={commonStyles.container}>
        <Button onPress={requestPermission} title="Grant Camera Permission" />
      </View>
    );
  }

  // ============================================
  // HANDLERS
  // ============================================

  const handleTakePicture = async () => {
    const uri = await takePicture(cameraRef);
    if (uri) {
      setCapturedImage(uri);
    }
  };

  const handleAnalyzeFish = async () => {
    if (!capturedImage) return;
    setLoading(true);

    try {
      const result = await analyzeFish(capturedImage);
      setResultImage(result);
    } catch (error) {
      console.error("Server Error:", error);
      Alert.alert(
        "Connection Failed",
        `Make sure your IP is correct.\nCurrent Target: ${SERVER_URL}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDataset = async () => {
    if (!capturedImage) return;
    setLoading(true);

    try {
      await uploadDataset(capturedImage, fishType, condition);
      Alert.alert(
        "Success",
        `✅ Image saved to dataset/${fishType}/${condition}/`
      );
      handleReset();
    } catch (error) {
      console.error("Upload Error:", error);
      Alert.alert("Upload Failed", "Check your server connection.");
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCapturedImage(null);
    setResultImage(null);
    setLoading(false);
  };

  // ============================================
  // RENDER SCREENS
  // ============================================

  if (currentScreen === "home") {
    return (
      <>
        <HomeScreen
          onNavigate={setCurrentScreen}
          onOpenSettings={() => setShowSettings(true)}
          devMode={devMode}
        />
        <SettingsModal
          visible={showSettings}
          devMode={devMode}
          onToggleDevMode={() => setDevMode(!devMode)}
          onClose={() => setShowSettings(false)}
        />
      </>
    );
  }

  if (currentScreen === "analytics") {
    return <AnalyticsScreen onNavigate={setCurrentScreen} />;
  }

  if (currentScreen === "dataGathering") {
    return (
      <DataGatheringScreen
        cameraRef={cameraRef}
        capturedImage={capturedImage}
        loading={loading}
        fishType={fishType}
        condition={condition}
        onNavigate={setCurrentScreen}
        onTakePicture={handleTakePicture}
        onUpload={handleUploadDataset}
        onReset={handleReset}
        onSetFishType={setFishType}
        onSetCondition={setCondition}
      />
    );
  }

  // SCAN SCREEN
  return (
    <ScanScreen
      cameraRef={cameraRef}
      capturedImage={capturedImage}
      resultImage={resultImage}
      loading={loading}
      onNavigate={setCurrentScreen}
      onTakePicture={handleTakePicture}
      onAnalyze={handleAnalyzeFish}
      onReset={handleReset}
    />
  );
}
