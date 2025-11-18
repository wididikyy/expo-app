/* eslint-disable react-hooks/exhaustive-deps */
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/contexts/AuthContext';
import { chatWithReviewer } from '@/services/sinta-service';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIReviewerChatProps {
  journalContext?: string;
  initialAnalysis?: string;
}

export default function HomeScreen({ 
  journalContext = 'General journal review', 
  initialAnalysis 
}: AIReviewerChatProps = {}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const { user, signOut } = useAuth();
  const router = useRouter();

  // Generate avatar URL from user email
  const getAvatarUrl = () => {
    const name = user?.email?.split('@')[0] || 'User';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=007AFF&color=fff&size=128`;
  };

  useEffect(() => {
    // Initial greeting from AI
    const greeting = initialAnalysis 
      ? `I've analyzed your journal. ${initialAnalysis}\n\nHow can I help you improve it?`
      : "Hello! I'm your AI reviewer assistant. Ask me anything about improving your journal for SINTA publication.";
    
    setMessages([{
      role: 'assistant',
      content: greeting,
      timestamp: new Date(),
    }]);
  }, []);

  useEffect(() => {
    // Auto scroll when new messages
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const quickQuestions = [
    "What are the main weaknesses?",
    "How can I improve the abstract?",
    "Suggest better methodology",
    "Review my references",
  ];

  const handleLogout = () => {
    setShowDropdown(false);
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/(auth)/login' as any);
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || loading) return;

    setInput('');
    setLoading(true);

    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      // Prepare chat history for API
      const chatHistory = messages
        .filter((msg, idx) => {
          // Skip initial assistant greeting if it's the first message
          if (idx === 0 && msg.role === 'assistant') return false;
          return true;
        })
        .map(msg => ({
          role: msg.role,
          content: msg.content,
        }));

      // Get AI response
      const response = await chatWithReviewer(
        journalContext,
        chatHistory,
        messageText
      );

      // Add AI response
      const aiMessage: Message = {
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    sendMessage(question);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <ThemedView style={styles.container}>
        {/* Header with Avatar */}
        <ThemedView style={styles.header}>
          <View>
            <ThemedText style={styles.headerTitle}>🤖 AI Reviewer</ThemedText>
            <ThemedText style={styles.headerSubtitle}>
              Improve your journal quality
            </ThemedText>
          </View>
          
          {/* Avatar with Dropdown */}
          <View>
            <TouchableOpacity
              style={styles.avatarButton}
              onPress={() => setShowDropdown(!showDropdown)}
            >
              <Image
                source={{ uri: getAvatarUrl() }}
                style={styles.avatar}
              />
            </TouchableOpacity>

            {/* Dropdown Menu */}
            {showDropdown && (
              <ThemedView style={styles.dropdown}>
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={handleLogout}
                >
                  <IconSymbol name="arrow.right.square.fill" size={20} color="#FF3B30" />
                  <ThemedText style={[styles.dropdownText, styles.logoutText]}>Logout</ThemedText>
                </TouchableOpacity>
              </ThemedView>
            )}
          </View>
        </ThemedView>

        {/* Quick Questions */}
        {messages.length === 1 && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.quickQuestionsContainer}
            contentContainerStyle={styles.quickQuestionsContent}
          >
            {quickQuestions.map((question, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.quickQuestionChip}
                onPress={() => handleQuickQuestion(question)}
              >
                <ThemedText style={styles.quickQuestionText}>{question}</ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((message, idx) => (
            <ThemedView
              key={idx}
              style={[
                styles.messageBubble,
                message.role === 'user' 
                  ? styles.userBubble 
                  : styles.assistantBubble
              ]}
            >
              <ThemedText
                style={[
                  styles.messageText,
                  message.role === 'user' && styles.userMessageText
                ]}
              >
                {message.content}
              </ThemedText>
              <ThemedText
                style={[
                  styles.timestamp,
                  message.role === 'user' && styles.userTimestamp
                ]}
              >
                {message.timestamp.toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </ThemedText>
            </ThemedView>
          ))}

          {loading && (
            <ThemedView style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <ThemedText style={styles.loadingText}>AI is thinking...</ThemedText>
            </ThemedView>
          )}
        </ScrollView>

        {/* Input */}
        <ThemedView style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask about your journal..."
            placeholderTextColor="#999"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, (loading || !input.trim()) && styles.sendButtonDisabled]}
            onPress={() => sendMessage()}
            disabled={loading || !input.trim()}
          >
            <IconSymbol 
              name="paperplane.fill" 
              size={20} 
              color="#fff" 
            />
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>

      {/* Backdrop for dropdown */}
      {showDropdown && (
        <TouchableWithoutFeedback onPress={() => setShowDropdown(false)}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  avatarButton: {
    position: 'relative',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  dropdown: {
    position: 'absolute',
    top: 50,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 160,
    zIndex: 1000,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    fontWeight: '500',
  },
  logoutText: {
    color: '#FF3B30',
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: '#E5E5EA',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 999,
  },
  quickQuestionsContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    maxHeight: 60,
  },
  quickQuestionsContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  quickQuestionChip: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  quickQuestionText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20,
    flexGrow: 1,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#333',
    marginBottom: 4,
  },
  userMessageText: {
    color: '#fff',
  },
  timestamp: {
    fontSize: 11,
    color: '#999',
  },
  userTimestamp: {
    color: '#fff',
    opacity: 0.8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 10,
    paddingTop: 10,
    marginRight: 8,
    fontSize: 16,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    color: '#333',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});