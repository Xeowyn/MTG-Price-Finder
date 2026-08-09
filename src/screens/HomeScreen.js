import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { fetchAutocompleteSuggestions } from '../api/scryfall';

const COLORS = {
  bg: '#0e0e0e',
  surface: '#1a1a1a',
  border: '#2e2e2e',
  gold: '#c9a84c',
  goldLight: '#e8c96b',
  text: '#f0e6d3',
  textMuted: '#7a7060',
  scan: '#1e3a5f',
  scanBorder: '#4a90d9',
};

export default function HomeScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const onChangeText = useCallback(async (text) => {
    setQuery(text);
    if (text.length < 2) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const results = await fetchAutocompleteSuggestions(text);
      setSuggestions(results.slice(0, 8));
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const onSearch = useCallback((name) => {
    const cardName = (name || query).trim();
    if (!cardName) return;
    setSuggestions([]);
    setQuery(cardName);
    navigation.navigate('Result', { cardName });
  }, [query, navigation]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MTG Price Finder</Text>
        <Text style={styles.headerSub}>Scan or search any Magic card</Text>
      </View>

      {/* Scan button */}
      <TouchableOpacity
        style={styles.scanButton}
        onPress={() => navigation.navigate('Scan')}
        activeOpacity={0.8}
      >
        <Text style={styles.scanIcon}>📷</Text>
        <View>
          <Text style={styles.scanTitle}>Scan a Card</Text>
          <Text style={styles.scanSub}>Point camera at your card</Text>
        </View>
      </TouchableOpacity>

      {/* Divider */}
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or search by name</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Search input */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={onChangeText}
          onSubmitEditing={() => onSearch()}
          placeholder="e.g. Lightning Bolt"
          placeholderTextColor={COLORS.textMuted}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="words"
        />
        <TouchableOpacity style={styles.searchBtn} onPress={() => onSearch()}>
          {loading
            ? <ActivityIndicator color={COLORS.bg} size="small" />
            : <Text style={styles.searchBtnText}>Go</Text>
          }
        </TouchableOpacity>
      </View>

      {/* Autocomplete suggestions */}
      {suggestions.length > 0 && (
        <FlatList
          data={suggestions}
          keyExtractor={(item) => item}
          style={styles.suggestions}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.suggestion}
              onPress={() => onSearch(item)}
            >
              <Text style={styles.suggestionText}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Footer note */}
      <Text style={styles.footer}>Prices from TCGPlayer · CardMarket · Cardhoarder</Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.gold,
    letterSpacing: 1,
  },
  headerSub: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.scan,
    borderWidth: 1.5,
    borderColor: COLORS.scanBorder,
    borderRadius: 12,
    padding: 20,
    gap: 16,
    marginBottom: 28,
  },
  scanIcon: {
    fontSize: 36,
  },
  scanTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  scanSub: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.text,
    fontSize: 16,
  },
  searchBtn: {
    backgroundColor: COLORS.gold,
    borderRadius: 10,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  searchBtnText: {
    color: COLORS.bg,
    fontWeight: '700',
    fontSize: 16,
  },
  suggestions: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    marginTop: 6,
    maxHeight: 280,
  },
  suggestion: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  suggestionText: {
    color: COLORS.text,
    fontSize: 15,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    color: COLORS.textMuted,
    fontSize: 11,
  },
});
