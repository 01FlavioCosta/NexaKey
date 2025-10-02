import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Clipboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface VaultItem {
  id: string;
  item_type: 'password' | 'credit_card' | 'secure_note';
  decrypted_data: any;
  created_at: string;
  updated_at: string;
}

interface VaultItemCardProps {
  item: VaultItem;
  onEdit: () => void;
  onDelete: () => void;
}

export const VaultItemCard: React.FC<VaultItemCardProps> = ({
  item,
  onEdit,
  onDelete,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const getItemIcon = () => {
    switch (item.item_type) {
      case 'password': return 'key';
      case 'credit_card': return 'card';
      case 'secure_note': return 'document-text';
      default: return 'folder';
    }
  };

  const getItemTypeColor = () => {
    switch (item.item_type) {
      case 'password': return '#4CAF50';
      case 'credit_card': return '#FF9800';
      case 'secure_note': return '#2196F3';
      default: return '#666';
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    Clipboard.setString(text);
    Alert.alert('Copiado', `${label} copiado para a área de transferência`);
  };

  const renderPasswordItem = () => {
    const data = item.decrypted_data;
    return (
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{data.name || 'Sem nome'}</Text>
            <Text style={styles.itemSubtitle}>
              {data.username || data.website || 'Nenhum usuário'}
            </Text>
          </View>
          <View style={[styles.typeIndicator, { backgroundColor: getItemTypeColor() }]}>
            <Ionicons name={getItemIcon()} size={16} color="white" />
          </View>
        </View>

        {data.password && (
          <View style={styles.passwordContainer}>
            <Text style={styles.fieldLabel}>Senha:</Text>
            <View style={styles.passwordRow}>
              <Text style={styles.passwordText}>
                {showPassword ? data.password : '••••••••'}
              </Text>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={16}
                  color="#00D4FF"
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => copyToClipboard(data.password, 'Senha')}
              >
                <Ionicons name="copy" size={16} color="#00D4FF" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {data.website && (
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Website:</Text>
            <TouchableOpacity onPress={() => copyToClipboard(data.website, 'Website')}>
              <Text style={styles.fieldValue}>{data.website}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderCreditCardItem = () => {
    const data = item.decrypted_data;
    const maskedCardNumber = data.cardNumber 
      ? `**** **** **** ${data.cardNumber.slice(-4)}`
      : 'Número não informado';

    return (
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{data.name || 'Cartão sem nome'}</Text>
            <Text style={styles.itemSubtitle}>
              {data.cardholderName || 'Portador não informado'}
            </Text>
          </View>
          <View style={[styles.typeIndicator, { backgroundColor: getItemTypeColor() }]}>
            <Ionicons name={getItemIcon()} size={16} color="white" />
          </View>
        </View>

        <View style={styles.cardDetailsContainer}>
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Número:</Text>
            <TouchableOpacity onPress={() => copyToClipboard(data.cardNumber || '', 'Número do cartão')}>
              <Text style={styles.fieldValue}>{maskedCardNumber}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.cardRow}>
            <View style={[styles.fieldContainer, { flex: 1, marginRight: 16 }]}>
              <Text style={styles.fieldLabel}>Validade:</Text>
              <Text style={styles.fieldValue}>{data.expiryDate || 'N/A'}</Text>
            </View>
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>CVV:</Text>
              <View style={styles.passwordRow}>
                <Text style={styles.fieldValue}>
                  {showPassword ? data.cvv || 'N/A' : '•••'}
                </Text>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={16}
                    color="#00D4FF"
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Campo da Senha do Cartão */}
          {data.cardPassword && (
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Senha do Cartão:</Text>
              <View style={styles.passwordRow}>
                <Text style={styles.passwordText}>
                  {showPassword ? data.cardPassword : '••••••'}
                </Text>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={16}
                    color="#00D4FF"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => copyToClipboard(data.cardPassword, 'Senha do cartão')}
                >
                  <Ionicons name="copy" size={16} color="#00D4FF" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderSecureNoteItem = () => {
    const data = item.decrypted_data;
    const notePreview = data.notes 
      ? data.notes.length > 100 
        ? `${data.notes.substring(0, 100)}...`
        : data.notes
      : 'Nota vazia';

    return (
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{data.name || 'Nota sem título'}</Text>
            <Text style={styles.itemSubtitle} numberOfLines={2}>
              {notePreview}
            </Text>
          </View>
          <View style={[styles.typeIndicator, { backgroundColor: getItemTypeColor() }]}>
            <Ionicons name={getItemIcon()} size={16} color="white" />
          </View>
        </View>
      </View>
    );
  };

  const renderItemContent = () => {
    switch (item.item_type) {
      case 'password': return renderPasswordItem();
      case 'credit_card': return renderCreditCardItem();
      case 'secure_note': return renderSecureNoteItem();
      default: return renderPasswordItem();
    }
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.cardTouchable} onPress={onEdit}>
        {renderItemContent()}
      </TouchableOpacity>
      
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.editButton} onPress={onEdit}>
          <Ionicons name="pencil" size={16} color="#00D4FF" />
          <Text style={styles.editButtonText}>Editar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
          <Ionicons name="trash" size={16} color="#FF5722" />
          <Text style={styles.deleteButtonText}>Excluir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1A365D',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardTouchable: {
    padding: 16,
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#B0BEC5',
    lineHeight: 20,
  },
  typeIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  passwordContainer: {
    marginBottom: 12,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  passwordText: {
    flex: 1,
    fontSize: 16,
    color: 'white',
    fontFamily: 'monospace',
  },
  fieldContainer: {
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 12,
    color: '#B0BEC5',
    marginBottom: 4,
    fontWeight: '500',
  },
  fieldValue: {
    fontSize: 14,
    color: 'white',
  },
  cardDetailsContainer: {
    marginTop: 8,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.1)',
  },
  editButtonText: {
    color: '#00D4FF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  deleteButtonText: {
    color: '#FF5722',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
});