/* eslint-disable @typescript-eslint/no-unused-vars */
import { IconSymbol } from '@/components/ui/icon-symbol';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface SintaResult {
  sintaLevel: string;
  publishabilityScore: number;
  completeness: number;
  weaknesses: string[];
  suggestions: string[];
}

export default function JournalScanner() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SintaResult | null>(null);
  const [scanMode, setScanMode] = useState<'camera' | 'pdf' | null>(null);

  // Request camera permission
  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera access is required to scan journals');
      return false;
    }
    return true;
  };

  // Scan via Camera (OCR Mode)
  const handleCameraScan = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setLoading(true);
        setScanMode('camera');
        // Process image with Gemini Vision API
        await processImageWithGemini(result.assets[0].base64);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture image');
      console.error(error);
    }
  };

  // Upload Photo from Gallery
  const handleGalleryUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setLoading(true);
        setScanMode('camera');
        await processImageWithGemini(result.assets[0].base64);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload image');
      console.error(error);
    }
  };

  // Scan PDF
  const handlePdfScan = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.assets && result.assets[0]) {
        setLoading(true);
        setScanMode('pdf');
        // Process PDF with Gemini
        await processPdfWithGemini(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to process PDF');
      console.error(error);
    }
  };

  // Process Image with Gemini Vision API
  const processImageWithGemini = async (base64Image: string) => {
    try {
      // TODO: Implement Gemini API call
      // This should call your Gemini service with the image
      const mockResult: SintaResult = {
        sintaLevel: 'SINTA 2',
        publishabilityScore: 87,
        completeness: 92,
        weaknesses: [
          'Keyword kurang spesifik',
          'Referensi <5 tahun hanya 2 buah',
          'Metodologi kurang detail',
        ],
        suggestions: [
          'Tambahkan keyword yang lebih spesifik',
          'Update referensi dengan paper terbaru',
          'Perjelas metodologi penelitian',
        ],
      };

      // Simulate API delay
      setTimeout(() => {
        setResult(mockResult);
        setLoading(false);
      }, 2000);
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to analyze journal');
    }
  };

  // Process PDF with Gemini
  const processPdfWithGemini = async (pdfUri: string) => {
    try {
      // TODO: Implement PDF processing with Gemini
      const mockResult: SintaResult = {
        sintaLevel: 'SINTA 3',
        publishabilityScore: 78,
        completeness: 85,
        weaknesses: [
          'Abstrak terlalu panjang',
          'Hasil penelitian kurang detail',
          'Diskusi tidak mendalam',
        ],
        suggestions: [
          'Ringkas abstrak menjadi 200-250 kata',
          'Tambahkan tabel hasil penelitian',
          'Perkuat diskusi dengan membandingkan penelitian terdahulu',
        ],
      };

      setTimeout(() => {
        setResult(mockResult);
        setLoading(false);
      }, 2000);
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to analyze PDF');
    }
  };

  const resetScan = () => {
    setResult(null);
    setScanMode(null);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>
            {scanMode === 'camera' ? 'Analyzing image...' : 'Processing PDF...'}
          </Text>
          <Text style={styles.loadingSubtext}>
            AI is analyzing your journal
          </Text>
        </View>
      </View>
    );
  }

  if (result) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.resultContainer}>
          <Text style={styles.title}>📊 Analysis Result</Text>

          {/* SINTA Score Card */}
          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>Predicted SINTA Level</Text>
            <Text style={styles.scoreValue}>⭐ {result.sintaLevel}</Text>
          </View>

          {/* Metrics */}
          <View style={styles.metricsContainer}>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{result.publishabilityScore}/100</Text>
              <Text style={styles.metricLabel}>Publishability</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{result.completeness}%</Text>
              <Text style={styles.metricLabel}>Completeness</Text>
            </View>
          </View>

          {/* Weaknesses */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚠️ Issues Found</Text>
            {result.weaknesses.map((weakness, idx) => (
              <View key={idx} style={styles.listItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.listText}>{weakness}</Text>
              </View>
            ))}
          </View>

          {/* Suggestions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💡 Suggestions</Text>
            {result.suggestions.map((suggestion, idx) => (
              <View key={idx} style={styles.listItem}>
                <Text style={styles.bullet}>✓</Text>
                <Text style={styles.listText}>{suggestion}</Text>
              </View>
            ))}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Chat with AI Reviewer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Generate PDF Report</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={resetScan}>
              <Text style={styles.secondaryButtonText}>Scan New Journal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.mainContent}>
        <Text style={styles.title}>SintaScan AI</Text>
        <Text style={styles.subtitle}>
          Scan your journal and get instant SINTA prediction
        </Text>

        {/* Main Scan Options */}
        <View style={styles.optionsContainer}>
          <TouchableOpacity style={styles.scanOption} onPress={handleCameraScan}>
            <View style={styles.iconContainer}>
              <IconSymbol name="camera.fill" size={40} color="#007AFF" />
            </View>
            <Text style={styles.optionTitle}>Take Photo</Text>
            <Text style={styles.optionDesc}>Scan physical journal pages</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.scanOption} onPress={handleGalleryUpload}>
            <View style={styles.iconContainer}>
              <IconSymbol name="photo.fill" size={40} color="#34C759" />
            </View>
            <Text style={styles.optionTitle}>Upload Photo</Text>
            <Text style={styles.optionDesc}>Choose from gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.scanOption} onPress={handlePdfScan}>
            <View style={styles.iconContainer}>
              <IconSymbol name="doc.fill" size={40} color="#FF3B30" />
            </View>
            <Text style={styles.optionTitle}>Upload PDF</Text>
            <Text style={styles.optionDesc}>Analyze complete journal</Text>
          </TouchableOpacity>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>✨ Features</Text>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>⚡</Text>
            <Text style={styles.featureText}>5-10 seconds analysis</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🤖</Text>
            <Text style={styles.featureText}>AI-powered reviewer chat</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📊</Text>
            <Text style={styles.featureText}>Detailed SINTA prediction</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📄</Text>
            <Text style={styles.featureText}>Generate PDF report</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mainContent: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  optionsContainer: {
    marginBottom: 32,
  },
  scanOption: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  iconContainer: {
    marginBottom: 12,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  optionDesc: {
    fontSize: 14,
    color: '#666',
  },
  featuresContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginBottom: 40,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  resultContainer: {
    padding: 20,
    paddingTop: 60,
  },
  scoreCard: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bullet: {
    fontSize: 16,
    color: '#666',
    marginRight: 8,
    width: 20,
  },
  listText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  actionButtons: {
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});