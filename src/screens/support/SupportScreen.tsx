import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  SectionList,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Text,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { Feather } from '@expo/vector-icons';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { supportService } from '../../services/support';
import { SupportTicket, FAQItem, SUPPORT_CATEGORIES } from '../../types/support';
import { RootState } from '../../store/store';
import { useTheme } from '../../contexts/ThemeContext';
import { theme } from '../../constants/theme';

export const SupportScreen: React.FC = () => {
  const navigation = useNavigation();
  const { isDarkMode, theme: currentTheme } = useTheme();
  const isPremium = useSelector((state: RootState) => state.premium.isPremium);
  const family = useSelector((state: RootState) => state.family.currentFamily);
  const [activeTab, setActiveTab] = useState<'faq' | 'tickets' | 'new'>('faq');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [faqs, setFAQs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(false);
  
  // New ticket form
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'bug' | 'feature' | 'billing' | 'other'>('other');

  useEffect(() => {
    loadData();
    // Initialize FAQs if needed
    supportService.initializeFAQs().catch(console.error);
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'faq') {
        const faqData = await supportService.getFAQs();
        setFAQs(faqData);
      } else if (activeTab === 'tickets') {
        const ticketData = await supportService.getMyTickets();
        setTickets(ticketData);
      }
    } catch (error) {
      console.error('Error loading support data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTicket = async () => {
    if (!subject.trim() || !description.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const priority = isPremium ? 'high' : 'medium';
      await supportService.createTicket({
        userId: '', // Will be set by the service
        subject,
        description,
        category,
        priority,
        isPremium,
        familyId: family?.id || '',
        status: 'open',
        responses: [],
      });

      const responseTime = await supportService.getEstimatedResponseTime(isPremium);
      Alert.alert(
        'Success',
        `Your ticket has been submitted. Expected response time: ${responseTime}`
      );
      
      setSubject('');
      setDescription('');
      setCategory('other');
      setActiveTab('tickets');
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to submit ticket');
    } finally {
      setLoading(false);
    }
  };

  const renderFAQ = ({ item }: { item: FAQItem }) => (
    <Card style={[styles.faqCard, { backgroundColor: currentTheme.colors.surface }]}>
      <Text style={[styles.question, { color: currentTheme.colors.textPrimary }]}>{item.question}</Text>
      <Text style={[styles.answer, { color: currentTheme.colors.textSecondary }]}>{item.answer}</Text>
      <View style={styles.helpfulRow}>
        <TouchableOpacity
          onPress={() => supportService.markFAQHelpful(item.id, true)}
          style={styles.helpfulButton}
        >
          <Feather name="thumbs-up" size={16} color={currentTheme.colors.textSecondary} />
          <Text style={[styles.helpfulText, { color: currentTheme.colors.textSecondary }]}>{item.helpful}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => supportService.markFAQHelpful(item.id, false)}
          style={styles.helpfulButton}
        >
          <Feather name="thumbs-down" size={16} color={currentTheme.colors.textSecondary} />
          <Text style={[styles.helpfulText, { color: currentTheme.colors.textSecondary }]}>{item.notHelpful}</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  const renderTicket = ({ item }: { item: SupportTicket }) => (
    <TouchableOpacity
      onPress={() => {
        // For now, just show an alert with ticket details
        // In production, navigate to TicketDetail screen
        Alert.alert(
          item.subject,
          `Status: ${item.status}\nCategory: ${item.category}\n\n${item.description}`,
          [{ text: 'OK' }]
        );
      }}
    >
      <Card style={[styles.ticketCard, { backgroundColor: currentTheme.colors.surface }]}>
        <View style={styles.ticketHeader}>
          <Text style={[styles.ticketSubject, { color: currentTheme.colors.textPrimary }]}>{item.subject}</Text>
          {item.isPremium && (
            <View style={[styles.premiumBadge, { backgroundColor: currentTheme.colors.premium }]}>
              <Text style={styles.premiumBadgeText}>PRIORITY</Text>
            </View>
          )}
        </View>
        <View style={styles.ticketMeta}>
          <View style={[styles.statusBadge, { 
            backgroundColor: item.status === 'open' ? currentTheme.colors.info + '20' :
                          item.status === 'resolved' ? currentTheme.colors.success + '20' :
                          currentTheme.colors.textSecondary + '20'
          }]}>
            <Text style={[styles.statusText, {
              color: item.status === 'open' ? currentTheme.colors.info :
                    item.status === 'resolved' ? currentTheme.colors.success :
                    currentTheme.colors.textSecondary
            }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
          <Text style={[styles.ticketDate, { color: currentTheme.colors.textTertiary }]}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
      {/* Fixed Header */}
      <View style={[styles.fixedHeader, {
        backgroundColor: currentTheme.colors.surface,
        borderBottomColor: currentTheme.colors.separator
      }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={24} color={currentTheme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.screenTitle, { color: currentTheme.colors.textPrimary }]}>Support</Text>
        <View style={{ width: 24 }} />
      </View>

      {isPremium && (
        <View style={[styles.premiumBanner, { backgroundColor: currentTheme.colors.premium + '20' }]}>
          <Feather name="zap" size={20} color={currentTheme.colors.premium} />
          <Text style={[styles.premiumText, { color: currentTheme.colors.premium }]}>Priority Support Active</Text>
        </View>
      )}

      <View style={[styles.tabs, { borderBottomColor: currentTheme.colors.separator }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'faq' && styles.activeTab]}
          onPress={() => setActiveTab('faq')}
        >
          <Text style={[styles.tabText, { color: currentTheme.colors.textSecondary }, 
            activeTab === 'faq' && { color: currentTheme.colors.primary }]}>
            FAQ
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'tickets' && styles.activeTab]}
          onPress={() => setActiveTab('tickets')}
        >
          <Text style={[styles.tabText, { color: currentTheme.colors.textSecondary },
            activeTab === 'tickets' && { color: currentTheme.colors.primary }]}>
            My Tickets
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'new' && styles.activeTab]}
          onPress={() => setActiveTab('new')}
        >
          <Text style={[styles.tabText, { color: currentTheme.colors.textSecondary },
            activeTab === 'new' && { color: currentTheme.colors.primary }]}>
            New Ticket
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'faq' && (
        <SectionList
          sections={[{ title: 'Frequently Asked Questions', data: faqs }]}
          renderItem={renderFAQ}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderSectionHeader={() => null}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: currentTheme.colors.textSecondary }]}>
              No FAQs available yet
            </Text>
          }
        />
      )}

      {activeTab === 'tickets' && (
        <SectionList
          sections={[{ title: 'Support Tickets', data: tickets }]}
          renderItem={renderTicket}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderSectionHeader={() => null}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="inbox" size={48} color={currentTheme.colors.textTertiary} />
              <Text style={[styles.emptyText, { color: currentTheme.colors.textSecondary }]}>
                No tickets yet
              </Text>
              <Text style={[styles.emptySubtext, { color: currentTheme.colors.textTertiary }]}>
                Submit a ticket if you need help
              </Text>
            </View>
          }
        />
      )}

      {activeTab === 'new' && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <ScrollView style={styles.formContainer} contentContainerStyle={styles.formContent}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: currentTheme.colors.textPrimary }]}>Subject</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: currentTheme.colors.surface,
                  color: currentTheme.colors.textPrimary,
                  borderColor: currentTheme.colors.separator
                }]}
                value={subject}
                onChangeText={setSubject}
                placeholder="Brief description of your issue"
                placeholderTextColor={currentTheme.colors.textTertiary}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: currentTheme.colors.textPrimary }]}>Category</Text>
              <View style={styles.categoryButtons}>
                {SUPPORT_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryButton,
                      { 
                        borderColor: currentTheme.colors.separator,
                        backgroundColor: currentTheme.colors.surface
                      },
                      category === cat.id && { 
                        backgroundColor: currentTheme.colors.primary,
                        borderColor: currentTheme.colors.primary
                      },
                    ]}
                    onPress={() => setCategory(cat.id)}
                  >
                    <Feather 
                      name={cat.icon as any} 
                      size={16} 
                      color={category === cat.id ? '#FFFFFF' : currentTheme.colors.textSecondary} 
                    />
                    <Text
                      style={[
                        styles.categoryButtonText,
                        { color: currentTheme.colors.textSecondary },
                        category === cat.id && { color: '#FFFFFF' },
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: currentTheme.colors.textPrimary }]}>Description</Text>
              <TextInput
                style={[styles.textArea, { 
                  backgroundColor: currentTheme.colors.surface,
                  color: currentTheme.colors.textPrimary,
                  borderColor: currentTheme.colors.separator
                }]}
                value={description}
                onChangeText={setDescription}
                placeholder="Detailed description of your issue"
                placeholderTextColor={currentTheme.colors.textTertiary}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            {isPremium && (
              <View style={[styles.responseTimeCard, { backgroundColor: currentTheme.colors.premium + '10' }]}>
                <Feather name="clock" size={16} color={currentTheme.colors.premium} />
                <Text style={[styles.responseTimeText, { color: currentTheme.colors.premium }]}>
                  Expected response time: Within 2 hours
                </Text>
              </View>
            )}

            <Button
              title="Submit Ticket"
              onPress={handleSubmitTicket}
              loading={loading}
              style={styles.submitButton}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fixedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.L,
    paddingVertical: theme.spacing.M,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: theme.spacing.XS,
  },
  screenTitle: {
    fontSize: theme.typography.title2.fontSize,
    fontWeight: theme.typography.title2.fontWeight as any,
  },
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.S,
    gap: theme.spacing.S,
  },
  premiumText: {
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.M,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    padding: theme.spacing.L,
  },
  faqCard: {
    marginBottom: theme.spacing.M,
    padding: theme.spacing.M,
  },
  question: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: theme.spacing.S,
  },
  answer: {
    fontSize: 14,
    lineHeight: 20,
  },
  helpfulRow: {
    flexDirection: 'row',
    marginTop: theme.spacing.M,
    gap: theme.spacing.L,
  },
  helpfulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.XS,
  },
  helpfulText: {
    fontSize: 12,
  },
  ticketCard: {
    marginBottom: theme.spacing.M,
    padding: theme.spacing.M,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.S,
  },
  ticketSubject: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  premiumBadge: {
    paddingHorizontal: theme.spacing.S,
    paddingVertical: theme.spacing.XXS,
    borderRadius: theme.borderRadius.small,
  },
  premiumBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  ticketMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.S,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.S,
    paddingVertical: theme.spacing.XXS,
    borderRadius: theme.borderRadius.small,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  ticketDate: {
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.XXL,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: theme.spacing.L,
    fontSize: 16,
  },
  emptySubtext: {
    textAlign: 'center',
    marginTop: theme.spacing.XS,
    fontSize: 14,
  },
  keyboardAvoid: {
    flex: 1,
  },
  formContainer: {
    flex: 1,
  },
  formContent: {
    padding: theme.spacing.L,
  },
  inputGroup: {
    marginBottom: theme.spacing.L,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: theme.spacing.S,
  },
  input: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.M,
    fontSize: 16,
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.S,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.S,
    paddingHorizontal: theme.spacing.M,
    borderRadius: theme.borderRadius.medium,
    borderWidth: 1,
    gap: theme.spacing.XS,
  },
  categoryButtonText: {
    fontSize: 14,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.M,
    fontSize: 16,
    minHeight: 120,
  },
  submitButton: {
    marginTop: theme.spacing.L,
  },
  responseTimeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.S,
    padding: theme.spacing.M,
    borderRadius: theme.borderRadius.medium,
    marginBottom: theme.spacing.L,
  },
  responseTimeText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default SupportScreen;