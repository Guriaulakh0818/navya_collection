export async function createShiprocketShipment(payload: {
  orderId: string;
  address: { name: string; mobile: string; pincode: string };
  items: { sku: string; quantity: number }[];
}) {
  const response = await fetch('https://apiv2.shiprocket.in/v1/external/shipments/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.SHIPROCKET_TOKEN}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error('Shiprocket shipment creation failed');

  return response.json();
}
