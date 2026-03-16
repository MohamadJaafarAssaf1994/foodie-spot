import React, { useCallback } from "react";
import { Package } from "lucide-react-native";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { OrderCard } from "@/components/order-card";
import { Colors, Radius } from "@/constants/theme";
import { useAppTheme } from '@/contexts/theme-context';
import { useI18n } from "@/contexts/i18n-context";
import { useOrders } from "@/hooks/use-orders";
import { Order } from "@/types";
import { router } from "expo-router";
import { FlatList, ListRenderItem, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type OrderFilter = 'all' | 'active' | 'delivered' | 'cancelled';

export default function OrdersScreen() {
    const { orders, loading, refreshing, error, refreshOrders, retryLoadOrders } = useOrders();
    const { t } = useI18n();
    const { colors } = useAppTheme();
    const [selectedFilter, setSelectedFilter] = React.useState<OrderFilter>('all');
    const styles = React.useMemo(() => createStyles(colors), [colors]);

    const filteredOrders = React.useMemo(() => {
        switch (selectedFilter) {
            case 'active':
                return orders.filter(order =>
                    ['pending', 'confirmed', 'preparing', 'on-the-way'].includes(order.status)
                );
            case 'delivered':
                return orders.filter(order => order.status === 'delivered');
            case 'cancelled':
                return orders.filter(order => order.status === 'cancelled');
            default:
                return orders;
        }
    }, [orders, selectedFilter]);

    const filterTabs: { key: OrderFilter; label: string }[] = React.useMemo(() => ([
        { key: 'all', label: t('orders_filter_all') },
        { key: 'active', label: t('orders_filter_active') },
        { key: 'delivered', label: t('orders_filter_delivered') },
        { key: 'cancelled', label: t('orders_filter_cancelled') },
    ]), [t]);

    const renderOrder = useCallback<ListRenderItem<Order>>(
        ({ item }) => (
            <OrderCard
                order={item}
                onPress={
                    ['pending', 'confirmed', 'preparing', 'on-the-way'].includes(item.status)
                        ? () => router.push(`/tracking/${item.id}`)
                        : () => router.push(`/order/${item.id}`)
                }
            />
        ),
        []
    );

    const keyExtractor = useCallback((item: Order) => item.id, []);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.title}>{t('orders_title')}</Text>
            </View>

            <View style={styles.filters}>
                {filterTabs.map(tab => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[styles.filterChip, selectedFilter === tab.key && styles.filterChipActive]}
                        onPress={() => setSelectedFilter(tab.key)}
                    >
                        <Text style={[styles.filterChipText, selectedFilter === tab.key && styles.filterChipTextActive]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={!loading && !error ? filteredOrders : []}
                keyExtractor={keyExtractor}
                renderItem={renderOrder}
                style={styles.content}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshOrders} />}
                ListEmptyComponent={
                    loading && !refreshing ? (
                        <LoadingState message={t('orders_loading')} />
                    ) : !loading && error ? (
                        <ErrorState message={error} onAction={retryLoadOrders} />
                    ) : (
                        <EmptyState
                            title={t('orders_empty')}
                            illustration={<Package size={52} color={colors.textSubtle} />}
                        />
                    )
                }
            />

        </SafeAreaView>
    );
}

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        padding: 16,
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    filters: {
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
        backgroundColor: colors.background,
    },
    filterChip: {
        backgroundColor: colors.surface,
        borderRadius: Radius.pill,
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    filterChipActive: {
        backgroundColor: colors.primary,
    },
    filterChipText: {
        color: colors.textMuted,
        fontWeight: '600',
    },
    filterChipTextActive: {
        color: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text,
    },
    content: {
        flex: 1,
    },
    listContent: {
        padding: 16,
        paddingBottom: 24,
        flexGrow: 1,
    },
});
