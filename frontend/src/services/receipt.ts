import jsPDF from "jspdf";
import type { OrderView } from "./orders";
import { formatSoles } from "../utils/money";

const STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmado",
  CONFIRMADO: "Confirmado",
  pending: "Pendiente de pago",
  PENDIENTE: "Pendiente de pago",
  preparing: "Preparando",
  PREPARANDO: "Preparando",
  shipped: "Enviado",
  ENVIADO: "Enviado",
  delivered: "Entregado",
  ENTREGADO: "Entregado",
  cancelled: "Cancelado",
  CANCELADO: "Cancelado",
  return: "Devolución",
  RETURN: "Devolución",
  returned: "Devuelto",
  DEVUELTO: "Devuelto",
};

function orderStatusLabel(status: string): string {
  const normalized = status.trim();

  return (
    STATUS_LABELS[normalized] ||
    STATUS_LABELS[normalized.toLowerCase()] ||
    normalized
  );
}

export function downloadReceipt(order: OrderView) {
  const doc = new jsPDF();

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const dateStr = order.fechaOrden
    ? new Date(order.fechaOrden).toLocaleString("es-PE")
    : "—";

  const status = orderStatusLabel(order.estado);

  doc.setFillColor(17, 17, 17);
  doc.rect(0, 0, pageWidth, 48, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);

  doc.setTextColor(255, 255, 255);
  doc.text("FIT", 20, 27);

  const fitWidth = doc.getTextWidth("FIT");

  doc.setTextColor(0, 255, 0);
  doc.text("LOOK", 20 + fitWidth, 27);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(210, 210, 210);

  doc.text("COMPROBANTE DE COMPRA", 20, 38);
  let y = 65;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);

  doc.text("PEDIDO", 20, y);
  doc.text("FECHA", 82, y);
  doc.text("ESTADO", 150, y);

  y += 8;

  doc.setFontSize(10);
  doc.setTextColor(17, 17, 17);

  doc.text(order.numero, 20, y);
  doc.text(dateStr, 82, y);

  doc.setFillColor(0, 255, 0);

  doc.roundedRect(
    150,
    y - 6,
    40,
    9,
    2,
    2,
    "F"
  );

  doc.setFontSize(8);
  doc.setTextColor(17, 17, 17);

  doc.text(status, 170, y, {
    align: "center",
  });
  y += 15;

  doc.setDrawColor(229, 231, 235);
  doc.line(20, y, pageWidth - 20, y);
  y += 15;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(17, 17, 17);

  doc.text("Productos", 20, y);

  y += 12;

  order.entries.forEach((entry) => {
    const subtotal = formatSoles(entry.subtotal);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(17, 17, 17);

    doc.text(entry.nombre, 20, y);

    doc.text(subtotal, pageWidth - 20, y, {
      align: "right",
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);

    doc.text(
      `Talla ${entry.talla} · ${entry.cantidad} unidad(es)`,
      20,
      y + 7
    );
    y += 18;
    doc.setDrawColor(229, 231, 235);
    doc.line(20, y, pageWidth - 20, y);

    y += 9;
  });

  y += 3;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(17, 17, 17);

  doc.text("TOTAL PAGADO", 20, y);

  doc.setFontSize(16);

  doc.text(
    formatSoles(order.total),
    pageWidth - 20,
    y,
    {
      align: "right",
    }
  );

  if (order.shippingAddress || order.shippingCity) {
    y += 18;

    doc.setDrawColor(229, 231, 235);
    doc.line(20, y, pageWidth - 20, y);

    y += 13;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(17, 17, 17);

    doc.text("ENTREGA", 20, y);

    y += 8;

    const address = [
      order.shippingAddress,
      order.shippingDistrict,
      order.shippingCity,
    ]
      .filter(Boolean)
      .join(", ");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(75, 85, 99);

    const addressLines = doc.splitTextToSize(
      address,
      pageWidth - 40
    );

    doc.text(addressLines, 20, y);

    y += addressLines.length * 5 + 3;

    if (order.shippingReference) {
      const referenceLines = doc.splitTextToSize(
        `Referencia: ${order.shippingReference}`,
        pageWidth - 40
      );

      doc.text(referenceLines, 20, y);

      y += referenceLines.length * 5;
    }
  }

  doc.setFillColor(17, 17, 17);
  doc.rect(
    0,
    pageHeight - 30,
    pageWidth,
    30,
    "F"
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(210, 210, 210);

  doc.text(
    "Gracias por tu compra en",
    pageWidth / 2 - 25,
    pageHeight - 17,
    {
      align: "right",
    }
  );


  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);

  const footerX = pageWidth / 2 - 20;

  doc.text(
    "FIT",
    footerX,
    pageHeight - 17
  );

  const footerFitWidth = doc.getTextWidth("FIT");

  doc.setTextColor(0, 255, 0);

  doc.text(
    "LOOK",
    footerX + footerFitWidth,
    pageHeight - 17
  );

  doc.save(`comprobante-${order.numero}.pdf`);
}