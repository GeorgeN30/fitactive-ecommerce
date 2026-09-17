import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AdminNotificationsView from "../../src/components/admin/views/AdminNotificationsView";
import type { AdminNotification } from "../../src/services/notifications";

const notification: AdminNotification = {
  id: "notification-1",
  title: "Solicitud de descuento pendiente",
  message: "Inventario solicita un descuento.",
  type: "discount",
  date: "16/09 12:00",
  read: false,
  priority: "high",
};

describe("AdminNotificationsView", () => {
  it("marks a notification as read and opens its related module", () => {
    const onMarkRead = vi.fn();
    const onNotificationAction = vi.fn();

    render(
      <AdminNotificationsView
        notifications={[notification]}
        setNotifications={vi.fn()}
        onMarkRead={onMarkRead}
        onNotificationAction={onNotificationAction}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Ver descuentos" }));

    expect(onMarkRead).toHaveBeenCalledWith(notification);
    expect(onNotificationAction).toHaveBeenCalledWith(notification);
  });

  it("marks all notifications as read through the persistence callback", () => {
    const onMarkAllRead = vi.fn();

    render(
      <AdminNotificationsView
        notifications={[notification]}
        setNotifications={vi.fn()}
        onMarkAllRead={onMarkAllRead}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Marcar todas como leídas" }));

    expect(onMarkAllRead).toHaveBeenCalledTimes(1);
  });
});
