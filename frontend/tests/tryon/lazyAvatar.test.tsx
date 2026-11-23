import { expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const loading = vi.hoisted(() => {
  let release!: () => void;
  const pending = new Promise<void>((resolve) => { release = resolve; });
  return { pending, release };
});
vi.mock('../../src/context/AuthContext', () => ({ useAuth: () => ({ user: null }) }));
vi.mock('../../src/components/ProbadorVirtual/Avatar3D', async () => {
  await loading.pending;
  return { default: ({ cameraAction }: { cameraAction?: { type: string } }) => <output>Vista lista: {cameraAction?.type}</output> };
});

import AvatarStage from '../../src/components/ProbadorVirtual/AvatarStage';

it('keeps the stage usable during download and applies the latest camera action on load', async () => {
  const user = userEvent.setup();
  render(<AvatarStage selectedProduct={null} genero="Hombre" activeSize="M" />);
  expect(screen.getByRole('status')).toHaveTextContent('Cargando vista 3D');
  expect(screen.getByText('Medio / Proporcionado')).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Acercar cámara' }));
  await act(async () => { loading.release(); await loading.pending; });
  expect(await screen.findByText('Vista lista: zoom-in')).toBeVisible();
  expect(screen.queryByText('Cargando vista 3D…')).not.toBeInTheDocument();
});
