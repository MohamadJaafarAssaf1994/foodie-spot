import { Order } from "@/types";
import { Colors, Radius, Spacing } from "@/constants/theme";
import { Check, CheckCircle, ChefHat, Clock, Navigation, X } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAppTheme } from '@/contexts/theme-context';

interface Props {
    order: Order;
    onPress?: () => void;
}


const OrderCardComponent: React.FC<Props> = ({ order, onPress }) => {
    const { colors } = useAppTheme();
    const styles = React.useMemo(() => createStyles(colors), [colors]);
    const itemNames = order.items
        .map(item => item.dish?.name || 'Item')
        .join(', ');
    const statusColor: Record<Order['status'], string> = {
        pending: colors.textSubtle,
        preparing: colors.warning,
        delivered: colors.success,
        cancelled: colors.error,
        confirmed: colors.secondary,
        'on-the-way': colors.primary,
    };
    const statusIcon: Record<Order['status'], React.ReactNode> = {
        pending: <Clock size={16} color={colors.textSubtle} />,
        preparing: <ChefHat size={16} color={colors.warning} />,
        delivered: <Check size={16} color={colors.success} />,
        cancelled: <X size={16} color={colors.error} />,
        confirmed: <CheckCircle size={16} color={colors.secondary} />,
        'on-the-way': <Navigation size={16} color={colors.primary} />,
    };

    return (
        <TouchableOpacity
            style={styles.card}
            accessibilityRole={onPress ? "button" : undefined}
            accessibilityLabel={onPress ? `Ouvrir la commande ${order.id}` : undefined}
            activeOpacity={0.85}
            onPress={onPress}
            disabled={!onPress}
        >
                <View style={styles.header}>
                        <Text style={styles.restaurant}>{order.restaurantName}</Text>
                        <View style={[styles.status, { backgroundColor: statusColor[order.status] }]}>
                            {statusIcon[order.status]}
                            <Text style={styles.statusText}>{order.status.toUpperCase()}</Text>
                        </View>
                </View>

                <Text style={styles.items} numberOfLines={1}>{itemNames}</Text>
                <View style={styles.footer}>
                    <Text style={styles.total}>Total: {order.total} €</Text>
                    <Text style= {styles.date}>{new Date(order.createdAt).toLocaleDateString()}</Text>
                </View>
        </TouchableOpacity>
    );
}

export const OrderCard = React.memo(OrderCardComponent);


const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
    card: {
        backgroundColor: colors.surface,
        borderRadius: Radius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    restaurant: {
        fontSize: 16,
        fontWeight: '700', 
        flex : 1,
    },
    status: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    items: {
        color: colors.textMuted,
        marginBottom: 10,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    total: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.primary,
    },
    date: {
        fontSize: 12,
        color: colors.textSubtle,
    }
});
