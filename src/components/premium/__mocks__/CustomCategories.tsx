import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';

const CustomCategoriesMock: React.FC<any> = ({ showPremiumBadge }) => {
  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View>
          <Text>Custom Categories</Text>
        </View>
        {showPremiumBadge ? (
          <View testID="premium-badge">
            <Text>Premium</Text>
          </View>
        ) : null}
      </View>
      <TouchableOpacity
        testID="add-category-button"
        onPress={() => Alert.alert('Premium Feature', 'Upgrade to Premium', [{ text: 'OK' }])}
      >
        <Text>Add</Text>
      </TouchableOpacity>
    </View>
  );
};

export { CustomCategoriesMock as CustomCategories };
export default CustomCategoriesMock;

