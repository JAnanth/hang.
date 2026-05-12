import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { FontFamily, FontSize, Spacing, Radius } from '../../constants/typography';

const BERKELEY_LOCATIONS = [
  'David Blackwell Hall',
  'Bowles Hall',
  'Unit 1 Dining',
  'Unit 2 Dining',
  'Unit 3 Dining',
  'Crossroads Dining',
  'Clark Kerr Dining',
  'Foothill Dining',
  'Café 3',
  'Free Speech Movement Café',
  'Caffe Strada',
  'Brewed Awakening',
  'Cheeseboard Pizza',
  'Chez Panisse',
  'La Burrita',
  'Top Dog',
  'Cheese Board Collective',
  'Sliver Pizzeria',
  'Jupiter Bar & Restaurant',
  'Triple Rock Brewery',
  'Gili Thai',
  'Shalimar',
  'Panda Express (Telegraph)',
  'Peet's Coffee (Bancroft)',
  'Blue Bottle Coffee (Shattuck)',
  'Sather Gate',
  'Sproul Plaza',
  'Memorial Glade',
  'Doe Library',
  'Moffitt Library',
  'Main Stacks',
  'Birgeneau Student Services Building',
  'César Chávez Student Center',
  'MLK Student Union',
  'Haas Pavilion',
  'RSF (Recreational Sports Facility)',
  'Strawberry Canyon Rec Area',
  'Tilden Regional Park',
  'Berkeley Marina',
  'Sather Tower (Campanile)',
  'Hearst Memorial Mining Building',
  'Wheeler Hall',
  'Dwinelle Hall',
  'Valley Life Sciences Building',
  'Stanley Hall',
  'Latimer Hall',
  'Evans Hall',
  'Cory Hall',
  'Soda Hall',
  'Haas School of Business',
  'Berkeley Law (Boalt Hall)',
  'Bancroft Library',
  'UC Berkeley Art Museum',
  'Zellerbach Hall',
  'Greek Theatre',
  'Pauley Ballroom',
  'Anna Head Alumnae Hall',
  'Tang Center',
  'Unit 1 (Wada & Deutsch)',
  'Unit 2 (Ehrman & Towle)',
  'Unit 3 (Spens-Black & Norton)',
  'Foothill Residence Hall',
  'Stern Hall',
  'International House (I-House)',
  'Kemper Hall',
  'Clark Kerr Campus',
  'Maximino Martinez Commons',
  'Bechtel Engineering Center',
  'Jacobs Hall',
  'Sutardja Dai Hall',
  'Koshland Hall',
  'Giannini Hall',
  'Morgan Hall',
  'Wellman Hall',
  'Hilgard Hall',
  'Mulford Hall',
  'Barrows Hall',
  'Social Sciences Building',
  'Li Ka Shing Center',
  'Mission Bay (UCSF)',
  'Downtown Berkeley BART',
  'Ashby BART',
  'North Berkeley BART',
  'Telegraph Avenue',
  'Shattuck Avenue',
  'College Avenue',
  'Bancroft Way',
  'Durant Avenue',
  'Piedmont Avenue',
  'Oakland Coliseum',
  'Jack London Square',
  'Lake Merritt',
  'Temescal District',
  'Rockridge District',
  'Piedmont (City)',
];

function fuzzyMatch(query: string, candidate: string): boolean {
  const q = query.toLowerCase();
  const c = candidate.toLowerCase();
  if (c.includes(q)) return true;
  // Allow each word of query to match independently
  return q.split(' ').every((word) => word.length > 1 && c.includes(word));
}

interface LocationInputProps {
  value: string;
  onChange: (val: string) => void;
  colors: {
    surfaceAlt: string;
    border: string;
    textPrimary: string;
    textSecondary: string;
    textTertiary?: string;
    background: string;
    accent: string;
  };
}

export function LocationInput({ value, onChange, colors }: LocationInputProps) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const suggestions =
    focused && value.trim().length >= 2
      ? BERKELEY_LOCATIONS.filter((loc) => fuzzyMatch(value, loc)).slice(0, 5)
      : [];

  const showDropdown = suggestions.length > 0;

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: colors.surfaceAlt,
            borderColor: focused ? colors.accent : colors.border,
          },
        ]}
      >
        <Text style={[styles.pin, { color: colors.textSecondary }]}>📍</Text>
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChange}
          placeholder="Add a location"
          placeholderTextColor={colors.textTertiary ?? colors.textSecondary}
          style={[styles.input, { color: colors.textPrimary }]}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          returnKeyType="done"
        />
        {value.length > 0 && (
          <TouchableOpacity onPress={() => onChange('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={[styles.clearBtn, { color: colors.textSecondary }]}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {showDropdown && (
        <View
          style={[
            styles.dropdown,
            { backgroundColor: colors.background, borderColor: colors.border },
          ]}
        >
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item}
            keyboardShouldPersistTaps="always"
            scrollEnabled={false}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                onPress={() => {
                  onChange(item);
                  setFocused(false);
                  inputRef.current?.blur();
                }}
                style={[
                  styles.suggestionRow,
                  index < suggestions.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <Text style={[styles.suggestionText, { color: colors.textPrimary }]}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    zIndex: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing['3'],
    gap: Spacing['2'],
  },
  pin: {
    fontSize: FontSize.base,
  },
  input: {
    flex: 1,
    fontFamily: FontFamily.sans,
    fontSize: FontSize.base,
    paddingVertical: Spacing['3'],
  },
  clearBtn: {
    fontSize: FontSize.sm,
    paddingHorizontal: Spacing['1'],
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: Radius.md,
    marginTop: 4,
    overflow: 'hidden',
  },
  suggestionRow: {
    paddingHorizontal: Spacing['4'],
    paddingVertical: Spacing['3'],
  },
  suggestionText: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.base,
  },
});
