# inventory-service API Documentation

Base URL (local): `http://localhost:3001`
Base path: `/api/inventory`

## 1) Get Item by ID

- **Method:** `GET`
- **Path:** `/api/inventory/items/:id`
- **Description:** Returns item details including stock count.

### Path Params

- `id` (string, required)

### Success Responses

- **200 OK**

```json
{
  "id": "item-1",
  "name": "Wireless Mouse",
  "price": 24.99,
  "stock": 25
}
```

### Error Responses

- **404 Not Found**

```json
{ "error": "Item not found" }
```

---

## 2) Reserve Item Stock

- **Method:** `POST`
- **Path:** `/api/inventory/items/:id/reserve`
- **Description:** Decrements stock by `quantity` if available.

### Path Params

- `id` (string, required)

### Request Body

```json
{
  "quantity": 2
}
```

- `quantity` (integer, optional, default `1`, must be `> 0`)

### Success Responses

- **200 OK**

```json
{
  "message": "Stock reserved",
  "itemId": "item-1",
  "reserved": 2,
  "remainingStock": 23
}
```

### Error Responses

- **400 Bad Request**

```json
{ "error": "quantity must be a positive integer" }
```

- **404 Not Found**

```json
{ "error": "Item not found" }
```

- **409 Conflict**

```json
{
  "error": "Insufficient stock",
  "itemId": "item-1",
  "requested": 10,
  "available": 2
}
```

---

## 3) Health Check

- **Method:** `GET`
- **Path:** `/api/inventory/health`
- **Description:** Basic service health and item count.

### Success Responses

- **200 OK**

```json
{
  "service": "inventory-service",
  "status": "ok",
  "totalItems": 5,
  "timestamp": "2026-04-18T12:00:00.000Z"
}
```

### Error Responses

- None defined for normal operation.
