import '@testing-library/jest-dom';
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
  window.scrollTo = jest.fn();
  URL.createObjectURL = jest.fn(() => 'blob:demo');
  URL.revokeObjectURL = jest.fn();
  Object.defineProperty(globalThis.crypto, 'randomUUID', {
    value: () => '12345678-1234-4123-8123-123456789012',
    configurable: true,
  });
}
