import { render, screen, fireEvent } from '@testing-library/react';
import UpsellBanner from './UpsellBanner';

describe('UpsellBanner', () => {
  it('opens Upgrade modal and triggers billing portal on Upgrade', async () => {
    const openSpy = vi.spyOn(window, 'open');
    // @ts-expect-error partial mock
    openSpy.mockReturnValue({});

    render(<UpsellBanner />);

    // Open modal
    fireEvent.click(screen.getByRole('button', { name: /Upgrade/i }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    // Confirm action inside modal
    fireEvent.click(screen.getByRole('button', { name: /Open billing portal to upgrade/i }));

    expect(openSpy).toHaveBeenCalled();
  });
});


