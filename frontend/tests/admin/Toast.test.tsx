import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
import ToastContainer, { useToasts } from "../../src/components/admin/Toast";

describe("ToastContainer", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("muestra la lista de toasts recibidos", () => {
    render(
      <ToastContainer
        toasts={[
          { id: "1", message: "Producto guardado", type: "success" },
          { id: "2", message: "Stock bajo", type: "warning" },
        ]}
        onRemove={vi.fn()}
      />
    );
    expect(screen.getByText("Producto guardado")).toBeInTheDocument();
    expect(screen.getByText("Stock bajo")).toBeInTheDocument();
  });

  it("elimina automaticamente cada toast a los 3 segundos", () => {
    vi.useFakeTimers();
    const onRemove = vi.fn();
    render(
      <ToastContainer
        toasts={[
          { id: "1", message: "Guardado", type: "info" },
          { id: "2", message: "Ops", type: "warning" },
        ]}
        onRemove={onRemove}
      />
    );
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(onRemove).toHaveBeenCalledWith("1");
    expect(onRemove).toHaveBeenCalledWith("2");
  });
});

describe("useToasts", () => {
  it("agrega toasts con id incremental y los elimina", () => {
    const { result } = renderHook(() => useToasts());
    act(() => {
      result.current.addToast("Hola", "success");
    });
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe("Hola");

    const id = result.current.toasts[0].id;
    act(() => {
      result.current.removeToast(id);
    });
    expect(result.current.toasts).toHaveLength(0);
  });
});