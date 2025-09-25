// Minimal mock for ValidationFeedbackService used in tests

export const validationFeedbackService = {
  generateCoachingTips: jest.fn(async (_childId: string) => [
    { tip: 'Help your child understand task requirements clearly', priority: 'high', category: 'photo_quality' },
    { tip: 'Review their photos together before submission', priority: 'medium', category: 'incomplete' },
  ]),
  recordPhotoRejection: jest.fn(async () => {}),
  recordPhotoApproval: jest.fn(async (data: any) => {
    if (typeof data?.qualityScore === 'number' && (data.qualityScore < 0 || data.qualityScore > 100)) {
      throw new Error('Invalid quality score');
    }
    return;
  }),
  getChildFeedbackHistory: jest.fn(async () => ({
    totalSubmissions: 0,
    approvalRate: 0,
    commonIssues: [],
    recentFeedback: [],
    improvementTrend: 'stable',
  })),
  getFeedbackSummary: jest.fn(async () => ({
    totalRejections: 0,
    commonIssues: [],
    averageResubmissions: 0,
    improvementTrend: 0,
    childrenNeedingSupport: [],
  })),
};

export default validationFeedbackService;


