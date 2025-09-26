import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';

const PremiumGateMock: React.FC<any> = ({ children, isPremium = false, feature, featureName = 'Custom Categories', featureDescription }) => {
  const revenueCat = require('src/services/revenueCat').default;
  const familyPremium = useSelector((state: any) => state?.family?.currentFamily?.isPremium ?? false);
  const [premium, setPremium] = useState<boolean>(!!isPremium || !!familyPremium);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const p = await revenueCat.isPremium();
        if (mounted) setPremium(!!p || !!isPremium || !!familyPremium);
      } catch {
        if (mounted) setPremium(!!isPremium || !!familyPremium);
      }
    })();
    return () => { mounted = false; };
  }, [isPremium, familyPremium]);

  if (premium) return <>{children}</>;

  const effectiveName = feature === 'advanced_analytics' ? 'Advanced Analytics' : featureName;

  return (
    <View>
      <Text>{effectiveName === 'Advanced Analytics' ? `Premium Feature: ${effectiveName}` : 'Premium Feature'}</Text>
      {feature === 'advanced_analytics' ? (
        <>
          <Text>Track detailed progress</Text>
          <Text>Export reports</Text>
        </>
      ) : null}
      {featureDescription ? <Text>{featureDescription}</Text> : null}
      {effectiveName && <Text>{`Unlock ${effectiveName}`}</Text>}
      <TouchableOpacity onPress={() => revenueCat.showPaywall && revenueCat.showPaywall()}>
        <Text>Upgrade to Premium</Text>
      </TouchableOpacity>
    </View>
  );
};

export const PremiumIndicator: React.FC<any> = () => (
  <View testID="premium-badge">
    <Text>Premium</Text>
  </View>
);

export const PremiumGate = PremiumGateMock;
export default PremiumGateMock;

