import { openBillingPortal } from './billing';

describe('billing service', () => {
  const openSpy = vi.spyOn(window, 'open');
  const assignSpy = vi.spyOn(window.location, 'href', 'set');

  beforeEach(() => {
    openSpy.mockReset();
    assignSpy.mockReset();
  });

  it('opens new tab when allowed', () => {
    // @ts-expect-error allow partial mock
    openSpy.mockReturnValue({} as any);
    openBillingPortal();
    expect(openSpy).toHaveBeenCalled();
    expect(assignSpy).not.toHaveBeenCalled();
  });

  it('falls back to same-tab navigation when popup blocked', () => {
    // @ts-expect-error allow partial mock
    openSpy.mockReturnValue(null);
    openBillingPortal();
    expect(assignSpy).toHaveBeenCalled();
  });
});


