import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  FlatList,
  Image,
  Dimensions,
  Platform,
  Keyboard,
  AccessibilityInfo,
  ScrollView,
} from 'react-native';
import { speakers, Speaker } from '../data/speakers';
import { trackCarouselOpen, trackSlideView } from '../utils/analytics';

interface WelcomeCarouselModalProps {
  visible: boolean;
  onClose: () => void;
  userRole: 'admin' | 'parent' | 'teacher';
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isTablet = screenWidth >= 768;
const imageWidth = isTablet ? screenWidth * 0.35 : screenWidth * 0.9;

const WelcomeCarouselModal: React.FC<WelcomeCarouselModalProps> = ({
  visible,
  onClose,
  userRole,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const goToNext = useCallback(() => {
    setCurrentIndex((prevIndex) => {
      if (prevIndex < speakers.length - 1) {
        const newIndex = prevIndex + 1;
        flatListRef.current?.scrollToIndex({ index: newIndex, animated: true });
        trackSlideView(newIndex, speakers[newIndex].id, userRole);
        AccessibilityInfo.announceForAccessibility(
          `Slide ${newIndex + 1} of ${speakers.length}. ${speakers[newIndex].name}`
        );
        return newIndex;
      }
      return prevIndex;
    });
  }, [userRole]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prevIndex) => {
      if (prevIndex > 0) {
        const newIndex = prevIndex - 1;
        flatListRef.current?.scrollToIndex({ index: newIndex, animated: true });
        trackSlideView(newIndex, speakers[newIndex].id, userRole);
        AccessibilityInfo.announceForAccessibility(
          `Slide ${newIndex + 1} of ${speakers.length}. ${speakers[newIndex].name}`
        );
        return newIndex;
      }
      return prevIndex;
    });
  }, [userRole]);

  useEffect(() => {
    if (visible) {
      trackCarouselOpen(userRole);
      // Reset to first slide when modal opens
      setCurrentIndex(0);
      flatListRef.current?.scrollToIndex({ index: 0, animated: false });
      
      // Announce to screen readers
      AccessibilityInfo.announceForAccessibility('Welcome carousel opened. Slide 1 of 3.');
    }
  }, [visible, userRole]);

  // Keyboard navigation
  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (event: any) => {
      if (event.key === 'ArrowLeft') {
        goToPrevious();
      } else if (event.key === 'ArrowRight') {
        goToNext();
      } else if (event.key === 'Escape') {
        onClose();
      }
    };

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [visible, goToNext, goToPrevious, onClose]);

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / screenWidth);
    if (index !== currentIndex && index >= 0 && index < speakers.length) {
      setCurrentIndex(index);
      trackSlideView(index, speakers[index].id, userRole);
      AccessibilityInfo.announceForAccessibility(
        `Slide ${index + 1} of ${speakers.length}. ${speakers[index].name}`
      );
    }
  };

  const renderSlide = ({ item, index }: { item: Speaker; index: number }) => {
    return (
      <ScrollView
        style={styles.slideScrollView}
        contentContainerStyle={styles.slide}
        showsVerticalScrollIndicator={false}
        accessible={true}
        accessibilityRole="none"
        accessibilityLabel={`Slide ${index + 1} of ${speakers.length}. ${item.name}, ${item.role}. ${item.message}`}
        accessibilityLiveRegion="polite"
      >
        <View style={styles.slideContent}>
          <View style={styles.imageContainer}>
            <Image
              source={item.image}
              style={styles.image}
              resizeMode="contain"
              accessibilityLabel={`Photo of ${item.name}`}
            />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.role}>{item.role}</Text>
            <Text style={styles.message}>{item.message}</Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderPaginationDots = () => {
    return (
      <View style={styles.paginationContainer}>
        {speakers.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              index === currentIndex && styles.paginationDotActive,
            ]}
            accessible={true}
            accessibilityLabel={`Page ${index + 1} of ${speakers.length}`}
            accessibilityRole="button"
          />
        ))}
      </View>
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={onClose}
      accessibilityViewIsModal={true}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              {/* Close Button */}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                accessibilityLabel="Close carousel"
                accessibilityRole="button"
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>

              {/* Carousel */}
              <FlatList
                ref={flatListRef}
                data={speakers}
                renderItem={renderSlide}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                getItemLayout={(_, index) => ({
                  length: screenWidth * 0.95,
                  offset: screenWidth * 0.95 * index,
                  index,
                })}
                style={styles.carousel}
                scrollEnabled={true}
              />

              {/* Navigation Controls */}
              <View style={styles.controlsContainer}>
                <TouchableOpacity
                  style={[
                    styles.navButton,
                    currentIndex === 0 && styles.navButtonDisabled,
                  ]}
                  onPress={goToPrevious}
                  disabled={currentIndex === 0}
                  accessibilityLabel="Previous slide"
                  accessibilityRole="button"
                >
                  <Text style={[
                    styles.navButtonText,
                    currentIndex === 0 && styles.navButtonTextDisabled,
                  ]}>
                    ‹
                  </Text>
                </TouchableOpacity>

                {renderPaginationDots()}

                <TouchableOpacity
                  style={[
                    styles.navButton,
                    currentIndex === speakers.length - 1 && styles.navButtonDisabled,
                  ]}
                  onPress={goToNext}
                  disabled={currentIndex === speakers.length - 1}
                  accessibilityLabel="Next slide"
                  accessibilityRole="button"
                >
                  <Text style={[
                    styles.navButtonText,
                    currentIndex === speakers.length - 1 && styles.navButtonTextDisabled,
                  ]}>
                    ›
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Slide Counter */}
              <Text style={styles.slideCounter} accessibilityLiveRegion="polite">
                {currentIndex + 1} / {speakers.length}
              </Text>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: screenWidth * 0.95,
    maxWidth: 800,
    maxHeight: screenHeight * 0.95,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    flexDirection: 'column',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeButtonText: {
    fontSize: 28,
    color: '#333',
    lineHeight: 28,
    fontWeight: '300',
  },
  carousel: {
    flexGrow: 0,
  },
  slideScrollView: {
    width: screenWidth * 0.95,
    maxWidth: 800,
  },
  slide: {
    width: screenWidth * 0.95,
    maxWidth: 800,
    padding: isTablet ? 24 : 20,
    paddingBottom: isTablet ? 24 : 24,
    justifyContent: 'flex-start',
    alignItems: 'center',
    minHeight: screenHeight * 0.75,
  },
  slideContent: {
    width: '100%',
    flexDirection: isTablet ? 'row' : 'column',
    alignItems: 'center',
    gap: isTablet ? 24 : 16,
    justifyContent: 'center',
  },
  imageContainer: {
    width: isTablet ? imageWidth : '100%',
    maxWidth: isTablet ? imageWidth : screenWidth * 0.9,
    maxHeight: screenHeight * 0.45,
    minHeight: 200,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    flex: 0,
    flexShrink: 0,
  },
  textContainer: {
    flex: 1,
    paddingHorizontal: isTablet ? 0 : 20,
    paddingVertical: isTablet ? 0 : 12,
    paddingBottom: isTablet ? 0 : 16,
    alignItems: isTablet ? 'flex-start' : 'center',
    width: '100%',
    marginTop: isTablet ? 0 : 16,
    minHeight: 100,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: isTablet ? 'left' : 'center',
  },
  role: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
    textAlign: isTablet ? 'left' : 'center',
  },
  message: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
    textAlign: isTablet ? 'left' : 'center',
    paddingHorizontal: isTablet ? 0 : 8,
    marginTop: 4,
    marginBottom: 8,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 16,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  navButtonText: {
    fontSize: 28,
    color: '#333',
    fontWeight: '300',
  },
  navButtonTextDisabled: {
    color: '#999',
  },
  paginationContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
  },
  paginationDotActive: {
    width: 24,
    backgroundColor: '#2F6FED',
  },
  slideCounter: {
    textAlign: 'center',
    fontSize: 14,
    color: '#999',
    paddingBottom: 12,
  },
});

export default WelcomeCarouselModal;

