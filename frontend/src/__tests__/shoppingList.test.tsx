import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import ShoppingListPage from '../pages/ShoppingListPage';
import type { ShoppingListItem } from '../types';

function makeItem(overrides: Partial<ShoppingListItem> = {}): ShoppingListItem {
  return {
    id: 'item-1',
    userId: 'user-1',
    name: 'leite',
    checked: false,
    matchedOfferId: null,
    matchedAt: null,
    matchedOffer: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <ShoppingListPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('ShoppingListPage — list rendering', () => {
  it('shows items after load', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [makeItem({ name: 'ovos' })],
    }));
    renderPage();
    await waitFor(() => expect(screen.getByText('ovos')).toBeInTheDocument());
  });

  it('shows empty state when list is empty', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }));
    renderPage();
    await waitFor(() => expect(screen.getByText(/lista vazia/i)).toBeInTheDocument());
  });

  it('renders match badge when offer exists', async () => {
    const item = makeItem({
      matchedOffer: {
        id: 'offer-1',
        externalId: 'ext-1',
        dealerId: '9ba51',
        dealerName: 'Netto',
        name: 'Arla mælk 1L',
        priceOre: 1295,
        prePriceOre: null,
        validFrom: new Date().toISOString(),
        validUntil: new Date().toISOString(),
      },
      matchedOfferId: 'offer-1',
    });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [item] }));
    renderPage();
    await waitFor(() => expect(screen.getByText('Netto')).toBeInTheDocument());
    expect(screen.getByText('12,95 kr')).toBeInTheDocument();
  });

  it('does not render match badge when no offer', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [makeItem()] }));
    renderPage();
    await waitFor(() => expect(screen.getByText('leite')).toBeInTheDocument());
    expect(screen.queryByText(/kr/)).not.toBeInTheDocument();
  });
});

describe('ShoppingListPage — toggle done', () => {
  it('calls PATCH with checked:true when toggling unchecked item', async () => {
    const patchedItem = makeItem({ checked: true });
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [makeItem()] })   // initial load
      .mockResolvedValueOnce({ ok: true, json: async () => patchedItem });   // PATCH

    vi.stubGlobal('fetch', fetchMock);
    renderPage();
    await waitFor(() => expect(screen.getByText('leite')).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText('Marcar como feito'));

    await waitFor(() => {
      const patchCall = fetchMock.mock.calls.find(([url, init]) =>
        String(url).includes('/shopping-list/item-1') && init?.method === 'PATCH'
      );
      expect(patchCall).toBeTruthy();
      const body = JSON.parse(patchCall[1].body);
      expect(body.checked).toBe(true);
    });
  });
});

describe('ShoppingListPage — delete flow', () => {
  it('shows confirm row and calls DELETE on confirm', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [makeItem()] })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) }); // DELETE

    vi.stubGlobal('fetch', fetchMock);
    renderPage();
    await waitFor(() => expect(screen.getByText('leite')).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText('Remover item'));
    expect(await screen.findByText('Remover da lista?')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Remover'));

    await waitFor(() => {
      const deleteCall = fetchMock.mock.calls.find(([url, init]) =>
        String(url).includes('/shopping-list/item-1') && init?.method === 'DELETE'
      );
      expect(deleteCall).toBeTruthy();
    });
    await waitFor(() => expect(screen.queryByText('leite')).not.toBeInTheDocument());
  });

  it('dismisses confirm on Cancelar', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [makeItem()] }));
    renderPage();
    await waitFor(() => expect(screen.getByText('leite')).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText('Remover item'));
    expect(await screen.findByText('Remover da lista?')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Cancelar'));
    expect(screen.queryByText('Remover da lista?')).not.toBeInTheDocument();
  });
});

describe('ShoppingListPage — add item', () => {
  it('opens sheet, submits POST with name, closes on success', async () => {
    const newItem = makeItem({ id: 'item-2', name: 'peito de frango' });
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [] })         // initial load
      .mockResolvedValue({ ok: true, json: async () => newItem });        // POST + any subsequent calls

    vi.stubGlobal('fetch', fetchMock);

    renderPage();
    await waitFor(() => expect(screen.getByLabelText('Adicionar item')).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText('Adicionar item'));
    expect(await screen.findByPlaceholderText(/leite/i)).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/leite/i), { target: { value: 'peito de frango' } });
    fireEvent.click(screen.getByText('Adicionar'));

    await waitFor(() => {
      const postCall = fetchMock.mock.calls.find(([url, init]) =>
        String(url).includes('/shopping-list') && init?.method === 'POST'
      );
      expect(postCall).toBeTruthy();
      const body = JSON.parse(postCall[1].body);
      expect(body.name).toBe('peito de frango');
    });

    // Sheet closes
    await waitFor(() => expect(screen.queryByPlaceholderText(/leite/i)).not.toBeInTheDocument());
    // Item appears (optimistically added from POST response)
    expect(screen.getByText('peito de frango')).toBeInTheDocument();
  });
});
