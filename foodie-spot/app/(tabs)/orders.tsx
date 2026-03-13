import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { OrderCard } from "@/components/order-card";
import { useOrders } from "@/hooks/use-orders";
import { router } from "expo-router";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OrdersScreen() {
    const { orders, loading, refreshing, error, refreshOrders, retryLoadOrders } = useOrders();


    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.title}>Mes Commandes</Text>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false} refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={refreshOrders} />
            }>
                {loading && !refreshing ? (
                    <LoadingState message="Chargement des commandes..." />
                ) : null}

                {!loading && error ? (
                    <ErrorState message={error} onAction={retryLoadOrders} />
                ) : null}

                {!loading && !error && orders.length === 0 ? (
                    <EmptyState icon="📦" title="Aucune commande trouvée." />
                ) : (
                    !error && orders.map((order) => (
                        <OrderCard
                            key={order.id}
                            order={order}
                            onPress={() => {
                                if ((order.status === 'on-the-way' || order.status === 'preparing') && order.id) {
                                    router.push(`/tracking/${order.id}`);
                                }
                            }}
                        />
                    ))
                )}
            </ScrollView>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f0f0',
    },
    header: {
        padding: 16,
        backgroundColor: '#f0f0f0',
        borderBottomWidth: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        padding: 16,
    },
});
