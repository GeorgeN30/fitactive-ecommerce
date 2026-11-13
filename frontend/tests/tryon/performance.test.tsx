import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';

const state = vi.hoisted(() => ({ addToCart: vi.fn() }));
vi.mock('../../src/components/ProbadorVirtual/Avatar3D', () => ({ default: () => <div>Avatar listo</div> }));
vi.mock('../../src/components/AppLayout', () => ({ default: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock('../../src/context/AuthContext', () => ({ useAuth: () => ({ user: null }) }));
vi.mock('../../src/context/CartContext', () => ({ useCart: () => ({ addToCart: state.addToCart }) }));
vi.mock('../../src/context/FavoritesContext', () => ({ useFavorites: () => ({ addFavorite: vi.fn() }) }));
vi.mock('../../src/services/virtualTryOn', () => ({ getVirtualTryOnSessionId: () => 'session', markVirtualTryOnProduct: vi.fn(), trackVirtualTryOnEvent: vi.fn().mockResolvedValue(undefined) }));

const original = 'https://assets.adidas.com/images/w_500,f_auto,q_auto/shirt.jpg?v=123';
const puma = 'https://images.puma.com/shirt.jpg';
const products = [
  { id: 'a', nombre: 'Adidas', genero: 'Hombre', categoria: 'Polos', imagenUrl: original, precio: 100, tallas: [{ id: 'm', talla: 'M', stock: 3 }] },
  { id: 'p', nombre: 'Puma', genero: 'Mujer', categoria: 'Polos', imagenUrl: puma, precio: 100, tallas: [{ id: 'l', talla: 'L', stock: 2 }] },
];
vi.mock('../../src/hooks/useCatalog', () => ({ useCatalog: () => ({ loading: false, error: null, products }) }));

import ProbadorVirtual from '../../src/pages/ProbadorVirtual';

describe('try-on loading and images', () => {
  it('prioritizes the selected image, preserves originals, and handles selection', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><ProbadorVirtual /></MemoryRouter>);
    const panel = screen.getByRole('complementary', { name: 'Opciones de la prenda' });
    const selector = screen.getByRole('group', { name: 'Selector de prendas' });
    const image = await within(panel).findByAltText('Adidas');
    expect(screen.getByText('Avatar listo')).toBeInTheDocument();
    expect(image).toHaveAttribute('fetchpriority', 'high');
    expect(image).toHaveAttribute('width', '400');
    expect(image).toHaveAttribute('height', '300');
    expect(image).toHaveAttribute('src', original.replace('w_500', 'w_480'));
    const thumbnail = within(selector).getByAltText('Adidas');
    expect(thumbnail).toHaveAttribute('src', original.replace('w_500', 'w_192'));
    fireEvent.error(image);
    fireEvent.error(thumbnail);
    expect(image).toHaveAttribute('src', original);
    expect(thumbnail).toHaveAttribute('src', original);
    await user.click(within(panel).getByRole('button', { name: 'Añadir al Carrito' }));
    expect(state.addToCart).toHaveBeenCalledWith(expect.objectContaining({ img: original, size: 'M' }));
    await user.click(screen.getAllByRole('button', { name: 'Mujer' })[0]);
    expect(await within(panel).findByAltText('Puma')).toHaveAttribute('src', puma);
    await user.click(within(panel).getByRole('button', { name: 'Probar talla L' }));
    expect(within(panel).getByRole('button', { name: 'Probar talla L' })).toHaveAttribute('aria-pressed', 'true');
  });
});
