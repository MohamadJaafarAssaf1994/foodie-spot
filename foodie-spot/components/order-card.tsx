import { Order } from "@/types";
import { Colors, Radius, Spacing } from "@/constants/theme";
import { Check, CheckCircle, ChefHat, Clock, Navigation, X } from "lucide-react-native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Props {
    order: Order;
    onPress?: () => void;
}

const statusColor: Record<Order['status'],string> = {
    'pending': Colors.light.textSubtle,
    'preparing': Colors.light.warning,
    'delivered': Colors.light.success,
    'cancelled': Colors.light.error, 
    'confirmed': Colors.light.secondary,
    'on-the-way': Colors.light.primary,
};
const statusIcon: Record<Order['status'], React.ReactNode> = {
    'pending': <Clock size={16} color={Colors.light.textSubtle} />,
    'preparing': <ChefHat size={16} color={Colors.light.warning} />,
    'delivered': <Check size={16} color={Colors.light.success} />,
    'cancelled': <X size={16} color={Colors.light.error} />, 
    'confirmed': <CheckCircle size={16} color={Colors.light.secondary} />,
    'on-the-way': <Navigation size={16} color={Colors.light.primary} />,
};


export const OrderCard: React.FC<Props> = ({ order, onPress }) => {
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

                <Text style={styles.items} numberOfLines={1}>{order.items.map(item => item.dish.name).join(', ')}</Text>
                <View style={styles.footer}>
                    <Text style={styles.total}>Total: {order.total} €</Text>
                    <Text style= {styles.date}>{new Date(order.createdAt).toLocaleDateString()}</Text>
                </View>
        </TouchableOpacity>
    );
}


const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.light.surface,
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
        color: Colors.light.textMuted,
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
        color: Colors.light.primary,
    },
    date: {
        fontSize: 12,
        color: Colors.light.textSubtle,
    }
});
