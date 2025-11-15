/* eslint-disable @typescript-eslint/no-unused-vars */
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { analyzeGrammar, chatWithGemini, generateDebateTopic } from '@/constants/gemini';
import { Content } from '@google/generative-ai';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';

export default function DebateScreen() {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<Content[]>([]);
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [grammarFeedback, setGrammarFeedback] = useState('');
  
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadNewTopic();
  }, []);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, grammarFeedback]);

  const loadNewTopic = async () => {
    setLoading(true);
    setChatHistory([]);
    setMessages([]);
    setGrammarFeedback('');

    try {
      const newTopic = await generateDebateTopic();
      const cleanTopic = newTopic.replace('Topic:', '').trim();
      setTopic(cleanTopic);

      // Start conversation with greeting
      const greeting = `Let's discuss: "${cleanTopic}". What's your opinion on this? Feel free to share your thoughts.`;
      setMessages([{ role: 'assistant', text: greeting }]);
      
      // Initialize chat history with a user prompt and model response
      setChatHistory([
        {
          role: 'user',
          parts: [{ text: `Let's discuss the topic: ${cleanTopic}` }]
        },
        {
          role: 'model',
          parts: [{ text: greeting }]
        }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate topic');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);
    setGrammarFeedback('');

    // Add user message
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);

    try {
      // Get grammar analysis
      const grammar = await analyzeGrammar(userMessage, topic);
      setGrammarFeedback(grammar);

      // Get AI response
      const response = await chatWithGemini(chatHistory, userMessage);

      // Update messages
      setMessages(prev => [...prev, { role: 'assistant', text: response }]);

      // Update history
      setChatHistory(prev => [
        ...prev,
        { role: 'user', parts: [{ text: userMessage }] },
        { role: 'model', parts: [{ text: response }] }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText style={styles.screenTitle}>Grammar Debate</ThemedText>

          {topic && (
            <ThemedView style={styles.topicCard}>
              <ThemedText style={styles.label}>Topic:</ThemedText>
              <ThemedText style={styles.topicText}>{topic}</ThemedText>
              <TouchableOpacity
                style={styles.smallButton}
                onPress={loadNewTopic}
                disabled={loading}
              >
                <ThemedText style={styles.smallButtonText}>New Topic</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          )}
        </ThemedView>

        <ScrollView
          ref={scrollViewRef}
          style={styles.chatContainer}
          contentContainerStyle={styles.chatContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {messages.map((msg, idx) => (
            <ThemedView
              key={idx}
              style={[
                styles.messageBubble,
                msg.role === 'user' ? styles.userBubble : styles.aiBubble
              ]}
            >
              <ThemedText 
                style={[
                  styles.messageText,
                  msg.role === 'user' && styles.userMessageText
                ]}
              >
                {msg.text}
              </ThemedText>
            </ThemedView>
          ))}

          {loading && (
            <ThemedView style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
            </ThemedView>
          )}

          {grammarFeedback && (
            <ThemedView style={styles.grammarCard}>
              <ThemedText style={styles.grammarLabel}>📝 Grammar Feedback:</ThemedText>
              <ThemedText style={styles.grammarText}>{grammarFeedback}</ThemedText>
            </ThemedView>
          )}
        </ScrollView>

        <ThemedView style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Type your response..."
            placeholderTextColor="#999"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, loading && styles.buttonDisabled]}
            onPress={sendMessage}
            disabled={loading}
          >
            <IconSymbol name="paperplane.fill" size={20} color="#fff" />
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    backgroundColor: '#f5f5f5',
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  topicCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  topicText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 12,
  },
  smallButton: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  smallButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  chatContainer: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: '#f5f5f5',
  },
  chatContent: {
    paddingBottom: 20,
    flexGrow: 1,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    maxWidth: '80%',
  },
  userBubble: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
  },
  aiBubble: {
    backgroundColor: '#E5E5EA',
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#000',
  },
  userMessageText: {
    color: '#fff',
  },
  loadingContainer: {
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  grammarCard: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  grammarLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E65100',
    marginBottom: 8,
  },
  grammarText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 20,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  sendButton: {
    backgroundColor: '#007AFF',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});