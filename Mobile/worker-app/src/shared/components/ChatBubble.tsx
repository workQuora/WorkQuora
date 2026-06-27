import React from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../theme/theme';

export interface ChatMessage {
  _id: string;
  sender: string;
  receiver: string;
  job?: string;
  text: string;
  createdAt: string;
  status?: 'sent' | 'delivered' | 'read';
  isRead?: boolean;
}

interface ChatBubbleProps {
  message: ChatMessage;
  isSelf: boolean;
  onPressAttachment?: (type: string) => void;
}

export default function ChatBubble({ message, isSelf, onPressAttachment }: ChatBubbleProps) {
  const { colors } = useTheme();

  // Formatting Date
  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  const bubbleBg = isSelf ? colors.primary : '#f1f3f4';
  const textColor = isSelf ? colors.white : colors.text;
  const timeColor = isSelf ? 'rgba(255,255,255,0.7)' : colors.textMuted;
  
  // Custom borders to match Stitch's sharp tail border for bubbles
  const bubbleStyles = [
    styles.bubble,
    { backgroundColor: bubbleBg },
    isSelf ? styles.bubbleRight : styles.bubbleLeft,
  ];

  // Helper to render special attachment items
  const renderContent = () => {
    const text = message.text;

    if (text.startsWith('[attachment:map]')) {
      return (
        <TouchableOpacity 
          style={styles.attachmentCard} 
          onPress={() => onPressAttachment?.('map')}
          activeOpacity={0.8}
        >
          <Image
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB6Qu1vg5HJ-QFo0EW7PsRNmHDeIvluYIeyJMgKjwX5E7v8F6cPt7oSPR9lFSyUNEMQI2AGdgLaJl-510-6sqbfJlyp1jY3sY94T9wbzNuOYjLqzKeudBt7ANzjpbul5h7TPtmsw3jJPypVFra8S03HVIY5SkZb8PQQaoEXs844yfqtwyMbq8q778gYAiBJnSlcgysr-7k0NGjzOyxIFHC9_xgkqUs9k4BAHZNTSC0jGChs9Q8CK09_u8Kx7EZyBLO2-neV1UOLMPky' }}
            style={styles.attachmentImage}
            resizeMode="cover"
          />
          <View style={styles.attachmentInfo}>
            <Feather name="map-pin" size={16} color={colors.primary} />
            <Text style={[styles.attachmentText, { color: colors.text }]}>Share Live Location</Text>
          </View>
        </TouchableOpacity>
      );
    }

    if (text.startsWith('[attachment:image]')) {
      return (
        <TouchableOpacity 
          style={styles.attachmentCard} 
          onPress={() => onPressAttachment?.('image')}
          activeOpacity={0.8}
        >
          <Image
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBolW1a--kPeq9zeVDTq9VUq4iBwzk4w_pKt2_xGA6Lf3rJNXsF3VMgVIZ8VcxuO3nwEYcUIUqaRmB6n6Ni37g6fQGk-VsQckHdcvmFUPl0ARAyXGQm2GjZPp1E7_dfflIRreSgCoBX3t57fpx1c-iWV6MWM0UDojUf6DILYPIk980N7k5QvSpC1H7b3umte-V7zPpq-H8kPDp7b3-l8q7U0Dw3xVpxIIFKAi9UG4bOBq6Ckr8RmWHRD1dCfJkgXWfU6zyypC8imYZ4' }}
            style={styles.attachmentImage}
            resizeMode="cover"
          />
          <View style={styles.attachmentInfo}>
            <Feather name="image" size={16} color={colors.primary} />
            <Text style={[styles.attachmentText, { color: colors.text }]}>Attached Photo</Text>
          </View>
        </TouchableOpacity>
      );
    }

    if (text.startsWith('[attachment:pdf]')) {
      return (
        <TouchableOpacity 
          style={[styles.docCard, { backgroundColor: isSelf ? 'rgba(255,255,255,0.1)' : '#ffffff' }]} 
          onPress={() => onPressAttachment?.('pdf')}
          activeOpacity={0.8}
        >
          <Feather name="file-text" size={24} color={isSelf ? colors.white : colors.primary} />
          <View style={styles.docInfo}>
            <Text style={[styles.docTitle, { color: textColor }]}>Requirements.pdf</Text>
            <Text style={[styles.docSize, { color: timeColor }]}>1.2 MB</Text>
          </View>
          <Feather name="download" size={16} color={isSelf ? colors.white : colors.textMuted} />
        </TouchableOpacity>
      );
    }

    if (text.startsWith('[attachment:audio]')) {
      return (
        <View style={styles.audioContainer}>
          <TouchableOpacity 
            style={[styles.audioPlayButton, { backgroundColor: isSelf ? colors.white : colors.primary }]}
            activeOpacity={0.8}
          >
            <Feather name="play" size={16} color={isSelf ? colors.primary : colors.white} />
          </TouchableOpacity>
          <View style={styles.audioWaveform}>
            {/* Horizontal waveform mockup bars */}
            {[8, 14, 20, 16, 10, 12, 18, 22, 14, 8].map((h, i) => (
              <View 
                key={i} 
                style={[
                  styles.waveBar, 
                  { 
                    height: h, 
                    backgroundColor: isSelf ? 'rgba(255,255,255,0.6)' : colors.primary + '60' 
                  }
                ]} 
                />
            ))}
          </View>
          <Text style={[styles.audioTime, { color: textColor }]}>0:12</Text>
        </View>
      );
    }

    // Default Text message bubble
    return (
      <Text style={[styles.messageText, { color: textColor }]}>
        {text}
      </Text>
    );
  };

  return (
    <View style={[styles.wrapper, isSelf ? styles.wrapperRight : styles.wrapperLeft]}>
      <View style={bubbleStyles}>
        {renderContent()}
        <View style={{ flexDirection: 'row', alignSelf: 'flex-end', alignItems: 'center', marginTop: 4 }}>
          <Text style={[styles.timeText, { color: timeColor, marginTop: 0 }]}>
            {formatTime(message.createdAt)}
          </Text>
          {isSelf && (
            <View style={{ flexDirection: 'row', marginLeft: 4, alignItems: 'center' }}>
              <Feather name="check" size={11} color={message.status === 'read' || message.isRead ? '#60a5fa' : timeColor} />
              {(message.status === 'read' || message.isRead || message.status === 'delivered') && (
                <Feather name="check" size={11} color={message.status === 'read' || message.isRead ? '#60a5fa' : timeColor} style={{ marginLeft: -6 }} />
              )}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 4,
    flexDirection: 'row',
    width: '100%',
  },
  wrapperLeft: {
    justifyContent: 'flex-start',
  },
  wrapperRight: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  bubbleLeft: {
    borderBottomLeftRadius: 2,
  },
  bubbleRight: {
    borderBottomRightRadius: 2,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  timeText: {
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  
  // Attachments styles
  attachmentCard: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    width: 200,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  attachmentImage: {
    width: '100%',
    height: 110,
  },
  attachmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    gap: 6,
  },
  attachmentText: {
    fontSize: 13,
    fontWeight: '600',
  },
  
  // PDF Document attachment
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    width: 220,
    gap: 12,
  },
  docInfo: {
    flex: 1,
  },
  docTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  docSize: {
    fontSize: 11,
    marginTop: 1,
  },

  // Audio Playback attachment
  audioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 200,
    gap: 8,
  },
  audioPlayButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioWaveform: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 30,
    paddingHorizontal: 4,
  },
  waveBar: {
    width: 3,
    borderRadius: 1.5,
  },
  audioTime: {
    fontSize: 11,
    fontWeight: '600',
  },
});
