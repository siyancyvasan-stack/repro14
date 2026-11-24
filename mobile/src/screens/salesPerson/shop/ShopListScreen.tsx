import React from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { api } from '../../../services/api';
import { Card, Screen } from '../../../components/common/Screen';
import { SyncBanner } from '../../../components/offline/SyncBanner';

export function ShopListScreen({ navigation }: any) {
  const [items, setItems] = React.useState<any[]>([]); const [search, setSearch] = React.useState(''); const [loading, setLoading] = React.useState(true); const [error, setError] = React.useState('');
  const load = React.useCallback(async () => { setLoading(true); setError(''); try { const result = await api.get<{ items: any[] }>(`/api/v1/shops?limit=100&search=${encodeURIComponent(search)}`); setItems(result.items ?? []); } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load shops.'); } finally { setLoading(false); } }, [search]);
  React.useEffect(() => { void load(); }, [load]);
  return <><SyncBanner /><Screen title="Shops" subtitle="Assigned retailers and customer visits"><View style={styles.row}><TextInput value={search} onChangeText={setSearch} placeholder="Search shops" style={styles.input} /><Pressable onPress={() => navigation.navigate('ShopNew')} style={styles.primary}><Text style={styles.primaryText}>New</Text></Pressable></View>{error ? <Card><Text style={styles.error}>{error}</Text></Card> : null}{loading ? <ActivityIndicator /> : <FlatList data={items} keyExtractor={(item) => String(item.id)} scrollEnabled={false} ListEmptyComponent={<Card><Text>No shops found.</Text></Card>} renderItem={({ item }) => <Pressable onPress={() => navigation.navigate('ShopView', { shop: item })}><Card><Text style={styles.title}>{item.name}</Text><Text style={styles.muted}>{item.ownerName} · {item.city}</Text><Text style={styles.status}>{item.status ?? 'ACTIVE'} · {item._count?.orders ?? 0} orders</Text></Card></Pressable>} />}</Screen></>;
}
const styles = StyleSheet.create({ row: { flexDirection: 'row', gap: 8 }, input: { flex: 1, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, backgroundColor: '#fff', paddingHorizontal: 12 }, primary: { borderRadius: 12, backgroundColor: '#2563eb', justifyContent: 'center', paddingHorizontal: 16 }, primaryText: { color: '#fff', fontWeight: '900' }, title: { fontSize: 16, fontWeight: '800', color: '#0f172a' }, muted: { color: '#64748b', marginTop: 4 }, status: { color: '#0891b2', marginTop: 6, fontSize: 12, fontWeight: '700' }, error: { color: '#be123c' } });
