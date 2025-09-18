import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { VaultService } from '../services/VaultService';
import { AddItemModal } from './AddItemModal';
import { VaultItemCard } from './VaultItemCard';
import { PremiumUpgradeModal } from './PremiumUpgradeModal';
import { SettingsScreen } from './SettingsScreen';

interface VaultItem {
  id: string;
  item_type: 'password' | 'credit_card' | 'secure_note';
  decrypted_data: any;
  created_at: string;
  updated_at: string;
}

export const VaultScreen = () => {
  const { user, logout, masterKey } = useAuth();
  const [items, setItems] = useState<VaultItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<VaultItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editingItem, setEditingItem] = useState<VaultItem | null>(null);

  const vaultService = new VaultService();

  useEffect(() => {
    loadVaultItems();
  }, []);

  useEffect(() => {
    filterItems();
  }, [items, searchQuery, selectedCategory]);

  const loadVaultItems = async () => {
    try {
      setIsLoading(true);
      const vaultItems = await vaultService.getVaultItems(masterKey!);
      setItems(vaultItems);
    } catch (error: any) {
      console.error('Failed to load vault items:', error);
      Alert.alert('Erro', 'Falha ao carregar itens do cofre');
    } finally {
      setIsLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = items;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.item_type === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => {
        const data = item.decrypted_data;
        return (
          data.name?.toLowerCase().includes(query) ||
          data.username?.toLowerCase().includes(query) ||
          data.website?.toLowerCase().includes(query) ||
          data.notes?.toLowerCase().includes(query)
        );
      });
    }

    setFilteredItems(filtered);
  };

  const handleAddItem = () => {
    if (!user?.is_premium && items.length >= 20) {
      setShowUpgradeModal(true);
      return;
    }
    setEditingItem(null);
    setShowAddModal(true);
  };

  const handleEditItem = (item: VaultItem) => {
    setEditingItem(item);
    setShowAddModal(true);
  };

  const handleItemSaved = () => {
    setShowAddModal(false);
    setEditingItem(null);
    loadVaultItems();
  };

  const handleDeleteItem = async (itemId: string) => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir este item?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await vaultService.deleteVaultItem(itemId);
              loadVaultItems();
            } catch (error: any) {
              Alert.alert('Erro', 'Falha ao excluir item');
            }
          },
        },
      ]
    );
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'password': return 'key';
      case 'credit_card': return 'card';
      case 'secure_note': return 'document-text';
      default: return 'folder';
    }
  };

  const getItemTypeLabel = (type: string) => {
    switch (type) {
      case 'password': return 'Senhas';
      case 'credit_card': return 'Cartões';
      case 'secure_note': return 'Notas';
      default: return 'Todos';
    }
  };

  const categories = [
    { key: 'all', label: 'Todos', icon: 'folder' },
    { key: 'password', label: 'Senhas', icon: 'key' },
    { key: 'credit_card', label: 'Cartões', icon: 'card' },
    { key: 'secure_note', label: 'Notas', icon: 'document-text' },
  ];

  const getItemsCount = (type: string) => {
    if (type === 'all') return items.length;
    return items.filter(item => item.item_type === type).length;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Meu Cofre</Text>
            <Text style={styles.headerSubtitle}>
              {user?.is_premium ? 'NexaKey Plus' : `${items.length} de 20 itens usados`}
            </Text>
          </View>
          <TouchableOpacity style={styles.profileButton} onPress={() => setShowSettingsModal(true)}>
            <Ionicons name="settings" size={28} color="#00D4FF" />
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar no cofre..."
              placeholderTextColor="#666"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>
      </View>

      {/* Category filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.key}
            style={[
              styles.categoryCard,
              selectedCategory === category.key && styles.categoryCardActive,
            ]}
            onPress={() => setSelectedCategory(category.key)}
          >
            <View style={styles.categoryIconContainer}>
              <Ionicons
                name={category.icon as any}
                size={24}
                color={selectedCategory === category.key ? '#0A2540' : '#00D4FF'}
              />
            </View>
            <Text
              style={[
                styles.categoryLabel,
                selectedCategory === category.key && styles.categoryLabelActive,
              ]}
            >
              {category.label}
            </Text>
            <Text
              style={[
                styles.categoryCount,
                selectedCategory === category.key && styles.categoryCountActive,
              ]}
            >
              {getItemsCount(category.key)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Vault items */}
      <ScrollView
        style={styles.itemsList}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadVaultItems}
            tintColor="#00D4FF"
          />
        }
      >
        {filteredItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="folder-open" size={64} color="#666" />
            <Text style={styles.emptyStateTitle}>
              {searchQuery ? 'Nenhum item encontrado' : 'Cofre vazio'}
            </Text>
            <Text style={styles.emptyStateDescription}>
              {searchQuery
                ? 'Tente ajustar sua busca'
                : 'Toque no botão + para adicionar seu primeiro item'}
            </Text>
          </View>
        ) : (
          <View style={styles.itemsContainer}>
            {filteredItems.map((item) => (
              <VaultItemCard
                key={item.id}
                item={item}
                onEdit={() => handleEditItem(item)}
                onDelete={() => handleDeleteItem(item.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating action button */}
      <TouchableOpacity style={styles.fab} onPress={handleAddItem}>
        <Ionicons name="add" size={28} color="#0A2540" />
      </TouchableOpacity>

      {/* Upgrade notification for free users */}
      {!user?.is_premium && items.length >= 15 && (
        <View style={styles.upgradeNotification}>
          <View style={styles.upgradeContent}>
            <Ionicons name="warning" size={20} color="#FF9800" />
            <Text style={styles.upgradeText}>
              Você está próximo do limite gratuito (20 itens)
            </Text>
          </View>
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => setShowUpgradeModal(true)}
          >
            <Text style={styles.upgradeButtonText}>Upgrade</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modals */}
      <AddItemModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleItemSaved}
        editingItem={editingItem}
      />

      <PremiumUpgradeModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A2540',
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#B0BEC5',
  },
  profileButton: {
    padding: 4,
  },
  searchContainer: {
    marginBottom: 8,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A365D',
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: 'white',
  },
  categoriesContainer: {
    maxHeight: 120,
    marginBottom: 16,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    paddingRight: 32,
  },
  categoryCard: {
    backgroundColor: '#1A365D',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  categoryCardActive: {
    backgroundColor: '#00D4FF',
  },
  categoryIconContainer: {
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  categoryLabelActive: {
    color: '#0A2540',
  },
  categoryCount: {
    fontSize: 12,
    color: '#B0BEC5',
  },
  categoryCountActive: {
    color: '#0A2540',
  },
  itemsList: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 16,
    color: '#B0BEC5',
    textAlign: 'center',
    lineHeight: 24,
  },
  itemsContainer: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#00D4FF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  upgradeNotification: {
    position: 'absolute',
    bottom: 100,
    left: 24,
    right: 24,
    backgroundColor: 'rgba(255, 152, 0, 0.9)',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  upgradeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  upgradeText: {
    marginLeft: 8,
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
    flex: 1,
  },
  upgradeButton: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  upgradeButtonText: {
    color: '#FF9800',
    fontSize: 14,
    fontWeight: 'bold',
  },
});