import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmiCalculator } from '@/components/emi-calculator';
import { FaqAccordion } from '@/components/ui/accordion';
test('calculator updates EMI and rejects values outside product limits', () => {
  render(<EmiCalculator />);
  expect(screen.getAllByText('₹11,536')[0]).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Loan amount'), { target: { value: '100000' } });
  expect(screen.getAllByText('₹4,614')[0]).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Tenure (months)'), { target: { value: '12' } });
  fireEvent.change(screen.getByLabelText('Illustrative annual interest rate (8%–12%)'), {
    target: { value: '8' },
  });
  expect(screen.getByRole('table')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Loan amount'), { target: { value: '' } });
  expect(screen.getByRole('alert')).toHaveTextContent('₹10,000');
});
test('sliders, export, sharing and print work', async () => {
  const user = userEvent.setup();
  const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  window.print = jest.fn();
  render(<EmiCalculator initial={{ amount: 100000, tenure: 12, rate: 8 }} />);
  fireEvent.change(screen.getByRole('slider', { name: 'Loan amount slider' }), {
    target: { value: '200000' },
  });
  fireEvent.change(screen.getByRole('slider', { name: 'Tenure slider' }), {
    target: { value: '36' },
  });
  await user.click(screen.getByRole('button', { name: 'Download CSV' }));
  expect(click).toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Print / PDF' }));
  expect(window.print).toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Share' }));
  expect(screen.getByRole('status')).toHaveTextContent('copied');
  click.mockRestore();
});
test('share offers a copyable link when clipboard access is unavailable', async () => {
  const user = userEvent.setup();
  jest.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('blocked'));
  render(<EmiCalculator />);
  await user.click(screen.getByRole('button', { name: 'Share' }));
  expect(screen.getByRole('status')).toHaveTextContent('Share this link:');
});
test('compact calculator has a clear application link', () => {
  render(<EmiCalculator compact />);
  expect(screen.getByRole('link', { name: 'Find my loan' })).toHaveAttribute('href', '/apply');
});
test('FAQ supports keyboard and exposes its answer', async () => {
  const user = userEvent.setup();
  render(<FaqAccordion />);
  const trigger = screen.getByRole('button', { name: 'What will my loan cost?' });
  trigger.focus();
  await user.keyboard('{Enter}');
  expect(trigger).toHaveAttribute('aria-expanded', 'true');
  expect(within(screen.getByRole('region')).getByText(/processing fee/)).toBeInTheDocument();
});
