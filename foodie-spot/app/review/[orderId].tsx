import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { Star } from 'lucide-react-native';

import { ErrorState } from '@/components/error-state';
import { LoadingState } from '@/components/loading-state';
import { AppImages } from '@/constants/assets';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useI18n } from '@/contexts/i18n-context';
import { useAppTheme } from '@/contexts/theme-context';
import { useToast } from '@/components/toast-provider';
import { orderAPI, reviewAPI, uploadAPI } from '@/services/api';
import type { Order } from '@/types';

export default function ReviewScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { t } = useI18n();
  const { colors } = useAppTheme();
  const toast = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [rating, setRating] = useState(5);
  const [qualityRating, setQualityRating] = useState(5);
  const [speedRating, setSpeedRating] = useState(5);
  const [presentationRating, setPresentationRating] = useState(5);
  const [comment, setComment] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    const loadOrder = async () => {
      try {
        setError(null);
        const data = await orderAPI.getOrderById(orderId);
        setOrder(data);
        if (!data) {
          setError(t('orders_not_found'));
        }
      } catch {
        setError(t('review_error'));
      } finally {
        setLoading(false);
      }
    };

    void loadOrder();
  }, [orderId, t]);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      toast.error(t('review_photo_error'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!order) {
      return;
    }

    try {
      setSubmitting(true);
      let uploadedImageUrl: string | undefined;
      if (selectedImage) {
        uploadedImageUrl = await uploadAPI.uploadImage(selectedImage, 'review');
      }
      await reviewAPI.createReview({
        restaurantId: order.restaurantId,
        orderId: order.id,
        rating,
        qualityRating,
        speedRating,
        presentationRating,
        comment,
        images: uploadedImageUrl ? [uploadedImageUrl] : undefined,
      });
      toast.success(t('review_success'));
      router.back();
    } catch {
      toast.error(t('review_error'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LoadingState message={t('review_title')} />
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ErrorState message={error || t('review_error')} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <Text style={styles.title}>{t('review_title')}</Text>
        <Text style={styles.subtitle}>{order.restaurantName}</Text>

        <Text style={styles.label}>{t('review_rating')}</Text>
        <View style={styles.ratingRow}>{renderStars(rating, setRating, colors)}</View>

        <View style={styles.criteriaCard}>
          <View style={styles.criteriaRow}>
            <Text style={styles.criteriaLabel}>{t('review_quality')}</Text>
            <View style={styles.ratingRow}>{renderStars(qualityRating, setQualityRating, colors, 22)}</View>
          </View>
          <View style={styles.criteriaRow}>
            <Text style={styles.criteriaLabel}>{t('review_speed')}</Text>
            <View style={styles.ratingRow}>{renderStars(speedRating, setSpeedRating, colors, 22)}</View>
          </View>
          <View style={styles.criteriaRow}>
            <Text style={styles.criteriaLabel}>{t('review_presentation')}</Text>
            <View style={styles.ratingRow}>{renderStars(presentationRating, setPresentationRating, colors, 22)}</View>
          </View>
        </View>

        <Text style={styles.label}>{t('review_comment')}</Text>
        <TextInput
          style={styles.commentInput}
          value={comment}
          onChangeText={setComment}
          placeholder={t('review_comment_placeholder')}
          multiline
        />

        <TouchableOpacity style={styles.photoButton} onPress={handlePickImage}>
          <Text style={styles.photoButtonText}>{t('review_add_photo')}</Text>
        </TouchableOpacity>

        {selectedImage ? (
          <Image source={{ uri: selectedImage }} placeholder={AppImages.imagePlaceholder} style={styles.previewImage} contentFit="cover" />
        ) : null}

        <TouchableOpacity style={[styles.submitButton, submitting && styles.submitButtonDisabled]} onPress={handleSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>{t('review_submit')}</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const renderStars = (
  currentValue: number,
  onChange: (value: number) => void,
  colors: typeof Colors.light,
  size = 30
) => (
  [1, 2, 3, 4, 5].map(value => (
    <TouchableOpacity key={value} onPress={() => onChange(value)}>
      <Star
        size={size}
        color={value <= currentValue ? colors.warning : colors.border}
        fill={value <= currentValue ? colors.warning : 'transparent'}
      />
    </TouchableOpacity>
  ))
);

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  content: { padding: Spacing.lg, gap: Spacing.md },
  title: { fontSize: 24, fontWeight: '700', color: colors.text },
  subtitle: { color: colors.textMuted },
  label: { fontWeight: '600', color: colors.text },
  ratingRow: { flexDirection: 'row', gap: Spacing.sm },
  criteriaCard: {
    backgroundColor: colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  criteriaRow: {
    gap: Spacing.sm,
  },
  criteriaLabel: {
    color: colors.text,
    fontWeight: '600',
  },
  commentInput: {
    minHeight: 120,
    backgroundColor: colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    textAlignVertical: 'top',
  },
  photoButton: { backgroundColor: colors.surfaceMuted, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center' },
  photoButtonText: { color: colors.primary, fontWeight: '700' },
  previewImage: { width: '100%', height: 180, borderRadius: Radius.lg },
  submitButton: { backgroundColor: colors.primary, borderRadius: Radius.md, padding: Spacing.lg, alignItems: 'center' },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
