import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { localizeCategoryName } from '@/constants/content-translations';
import { Colors } from '@/constants/theme';
import { useI18n } from '@/contexts/i18n-context';
import { useAppTheme } from '@/contexts/theme-context';
import { Category } from '@/types';

interface Props {
    categories: Category[];
    selectedCategory?: string | null;
    onSelectCategory: (categoryName: string | null) => void;
    title: string;
}

const CategoryListComponent: React.FC<Props> = ({ categories, selectedCategory, onSelectCategory, title }) => {
    const { colors } = useAppTheme();
    const { locale } = useI18n();
    const styles = React.useMemo(() => createStyles(colors), [colors]);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{title}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {categories.map((category) => (
                    <TouchableOpacity
                        key={category.id}
                        style={[styles.chip, selectedCategory === category.name && styles.chipActive]}
                        onPress={() => onSelectCategory(selectedCategory === category.name ? null : category.name)}
                    >
                        {category.icon ? <Text style={styles.chipEmoji}>{category.icon}</Text> : null}
                        <Text style={[styles.chipText, selectedCategory === category.name && styles.chipTextActive]}>
                            {localizeCategoryName(category, locale)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

export const CategoryList = React.memo(CategoryListComponent);

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 12,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: colors.surfaceMuted,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 18,
        marginRight: 12,
    },
    chipActive: {
        backgroundColor: colors.primary,
    },
    chipEmoji: {
        fontSize: 16,
    },
    chipText: {
        color: colors.primary,
        fontWeight: '600',
    },
    chipTextActive: {
        color: '#fff',
    },
});
