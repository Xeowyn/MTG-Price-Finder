import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { fetchCardByName, fetchCardPrintings, getPrices } from '../api/scryfall';

const COLORS = {
  bg: '#0e0e0e',
  surface: '#1a1a1a',
  surfaceAlt: '#141414',
  border: '#2e2e2e',
  gold: '#c9a84c',
  goldLight: '#e8c96b',
  text: '#f0e6d3',
  textMuted: '#7a7060',
  green: '#4caf70',
  red: '#cf6679',
  blue: '#4a90d9',
};

// MTG color identity → border color map
const MANA_COLORS = {
  W: '#f9f6de',
  U: '#7ab4e0',
  B: '#c8b8d8',
  R: '#e87040',
  G: '#72b87a',
};
function getCardColor(card) {
  const colors = card.colors || card.color_identity || [];
  if (colors.length === 0) return '#888'; // colorless
  if (colors.length > 1) return '#c9a84c'; // multicolor (gold)
  return MANA_COLORS[colors[0]] || '#888';
}

function PriceRow({ label, normal, foil, etched, url }) {
  const openStore = () => {
    if (url) Linking.openURL(url).catch(() => Alert.alert('Could not open link'));
  };
  return (
    <TouchableOpacity style={styles.priceRow} onPress={openStore} disabled={!url}>
      <View style={styles.priceLeft}>
        <Text style={styles.priceLabel}>{label}</Text>
        {url && <Text style={styles.priceLink}>tap to buy →</Text>}
      </View>
      <View style={styles.priceRight}>
        <PriceCell label="Normal" value={normal} />
        <PriceCell label="Foil" value={foil} />
        {etched && etched !== 'N/A' && <PriceCell label="Etched" value={etched} />}
      </View>
    </TouchableOpacity>
  );
}

function PriceCell({ label, value }) {
  const isNA = !value || value === 'N/A';
  return (
    <View style={styles.priceCell}>
      <Text style={styles.priceCellLabel}>{label}</Text>
      <Text style={[styles.priceCellValue, isNA && styles.priceCellNA]}>
        {isNA ? '—' : value}
      </Text>
    </View>
  );
}

function ManaCost({ cost }) {
  if (!cost) return null;
  // Strip the {X} notation for display
  const cleaned = cost.replace(/\{/g, '').replace(/\}/g, ' ').trim();
  return <Text style={styles.manaCost}>{cleaned}</Text>;
}

export default function ResultScreen({ route, navigation }) {
  const { cardName } = route.params;
  const [card, setCard] = useState(null);
  const [prices, setPrices] = useState(null);
  const [printings, setPrintings] = useState([]);
  const [selectedPrinting, setSelectedPrinting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCard(cardName);
  }, [cardName]);

  async function loadCard(name) {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCardByName(name);
      setCard(data);
      setPrices(getPrices(data));
      setSelectedPrinting(data);

      // Load all printings in background
      if (data.oracle_id) {
        fetchCardPrintings(data.oracle_id).then(all => {
          setPrintings(all.slice(0, 20));
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function selectPrinting(printing) {
    setSelectedPrinting(printing);
    setPrices(getPrices(printing));
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.gold} />
        <Text style={styles.loadingText}>Looking up "{cardName}"…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const cardColor = getCardColor(selectedPrinting || card);
  const imageUri = selectedPrinting?.image_uris?.normal || card?.image_uris?.normal;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Card image */}
      <View style={[styles.cardImageWrap, { borderColor: cardColor }]}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.cardImage} resizeMode="contain" />
        ) : (
          <View style={styles.cardImagePlaceholder}>
            <Text style={styles.cardImagePlaceholderText}>No Image</Text>
          </View>
        )}
      </View>

      {/* Card header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardNameRow}>
          <Text style={styles.cardName}>{card.name}</Text>
          <ManaCost cost={card.mana_cost} />
        </View>
        <Text style={styles.cardType}>{card.type_line}</Text>
        {card.oracle_text ? (
          <Text style={styles.cardText}>{card.oracle_text}</Text>
        ) : null}
        {(card.power || card.toughness) && (
          <Text style={styles.cardPT}>{card.power}/{card.toughness}</Text>
        )}
        {card.loyalty && (
          <Text style={styles.cardPT}>Loyalty: {card.loyalty}</Text>
        )}
      </View>

      {/* Set info for selected printing */}
      <View style={styles.setInfo}>
        <Text style={styles.setInfoText}>
          {selectedPrinting?.set_name || card.set_name} · #{selectedPrinting?.collector_number || card.collector_number} · {selectedPrinting?.rarity || card.rarity}
        </Text>
        {(selectedPrinting?.artist || card.artist) && (
          <Text style={styles.setInfoText}>
            Art: {selectedPrinting?.artist || card.artist}
          </Text>
        )}
      </View>

      {/* Prices */}
      <Text style={styles.sectionTitle}>Prices</Text>
      {prices && (
        <View style={styles.priceCard}>
          <PriceRow {...prices.tcgplayer} />
          <View style={styles.priceDivider} />
          <PriceRow {...prices.cardmarket} />
          <View style={styles.priceDivider} />
          <PriceRow
            label={prices.cardhoarder.label}
            normal={prices.cardhoarder.normal ? `${prices.cardhoarder.normal} tix` : 'N/A'}
            foil="N/A"
            url={prices.cardhoarder.url}
          />
        </View>
      )}

      {/* Other printings */}
      {printings.length > 1 && (
        <>
          <Text style={styles.sectionTitle}>Other Printings ({printings.length})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.printingsScroll}>
            {printings.map((p) => {
              const isSelected = selectedPrinting?.id === p.id;
              const thumb = p.image_uris?.small;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.printingThumb, isSelected && styles.printingThumbSelected]}
                  onPress={() => selectPrinting(p)}
                >
                  {thumb ? (
                    <Image source={{ uri: thumb }} style={styles.printingImg} />
                  ) : (
                    <View style={styles.printingImgPlaceholder} />
                  )}
                  <Text style={styles.printingSet} numberOfLines={2}>
                    {p.set_name}
                  </Text>
                  <Text style={styles.printingPrice}>
                    {p.prices?.usd ? `$${parseFloat(p.prices.usd).toFixed(2)}` : '—'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </>
      )}

      {/* Legality */}
      {card.legalities && (
        <>
          <Text style={styles.sectionTitle}>Format Legality</Text>
          <View style={styles.legalityGrid}>
            {Object.entries(card.legalities)
              .filter(([, v]) => v !== 'not_legal')
              .map(([format, status]) => (
                <View key={format} style={styles.legalityItem}>
                  <View style={[
                    styles.legalityDot,
                    { backgroundColor: status === 'legal' ? COLORS.green : COLORS.red }
                  ]} />
                  <Text style={styles.legalityText}>
                    {format.charAt(0).toUpperCase() + format.slice(1)}
                  </Text>
                </View>
              ))
            }
          </View>
        </>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { paddingHorizontal: 16, paddingTop: 16 },
  center: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    gap: 16,
  },
  loadingText: { color: COLORS.textMuted, fontSize: 14, marginTop: 12 },
  errorIcon: { fontSize: 40 },
  errorText: { color: COLORS.red, textAlign: 'center', fontSize: 15, lineHeight: 22 },
  backBtn: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  backBtnText: { color: COLORS.gold, fontWeight: '600' },

  // Card image
  cardImageWrap: {
    alignSelf: 'center',
    borderRadius: 16,
    borderWidth: 3,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 8,
    shadowColor: COLORS.gold,
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  cardImage: { width: 260, height: 362 },
  cardImagePlaceholder: {
    width: 260,
    height: 362,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImagePlaceholderText: { color: COLORS.textMuted },

  // Card details
  cardHeader: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  cardNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardName: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    flex: 1,
  },
  manaCost: {
    color: COLORS.gold,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  cardType: { color: COLORS.textMuted, fontSize: 13, fontStyle: 'italic' },
  cardText: { color: COLORS.text, fontSize: 13, lineHeight: 20, marginTop: 4 },
  cardPT: {
    color: COLORS.gold,
    fontWeight: '700',
    fontSize: 15,
    textAlign: 'right',
  },

  setInfo: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 20,
    gap: 2,
  },
  setInfoText: { color: COLORS.textMuted, fontSize: 12 },

  // Sections
  sectionTitle: {
    color: COLORS.gold,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },

  // Price card
  priceCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
    overflow: 'hidden',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: 'space-between',
  },
  priceLeft: { flex: 1 },
  priceLabel: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  priceLink: { color: COLORS.blue, fontSize: 11, marginTop: 2 },
  priceRight: { flexDirection: 'row', gap: 16 },
  priceCell: { alignItems: 'center', minWidth: 56 },
  priceCellLabel: { color: COLORS.textMuted, fontSize: 11, marginBottom: 2 },
  priceCellValue: { color: COLORS.goldLight, fontSize: 15, fontWeight: '700' },
  priceCellNA: { color: COLORS.textMuted, fontWeight: '400' },
  priceDivider: { height: 1, backgroundColor: COLORS.border, marginHorizontal: 16 },

  // Printings
  printingsScroll: { marginBottom: 24 },
  printingThumb: {
    width: 90,
    marginRight: 10,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: 6,
    backgroundColor: COLORS.surface,
  },
  printingThumbSelected: {
    borderColor: COLORS.gold,
    backgroundColor: 'rgba(201,168,76,0.08)',
  },
  printingImg: { width: 70, height: 97, borderRadius: 4 },
  printingImgPlaceholder: {
    width: 70,
    height: 97,
    backgroundColor: COLORS.border,
    borderRadius: 4,
  },
  printingSet: {
    color: COLORS.textMuted,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
  },
  printingPrice: {
    color: COLORS.gold,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },

  // Legality
  legalityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  legalityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.surface,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  legalityDot: { width: 7, height: 7, borderRadius: 4 },
  legalityText: { color: COLORS.text, fontSize: 12 },
});
