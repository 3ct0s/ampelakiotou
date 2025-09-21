# Editing Orders

An edit capability has been added to the order management UI.

## How it works

1. Each order card now has an "Επεξ." button and the details modal includes an "Επεξεργασία" button.
2. Clicking either opens a dialog containing the `OrderForm` in edit mode.
3. The form is pre-populated using the existing order's fields (`initialData` prop).
4. Submitting the form calls Supabase `update` for the `orders` table, updating:
   - Basic customer fields (afm, name, phone, order_for)
   - Product category flags (has_cookies, etc.)
   - Product detail arrays (product_details JSON)
   - Remarks, communication method/value, discount
5. After success the list, selected order (if open), and dialog state are updated locally without a full refetch.

## Developer Notes

`OrderForm` now accepts:

- `mode`: `'create' | 'edit'` (defaults to `create`)
- `initialData`: partial pre-fill payload including `id` and product detail arrays
- `onSubmit(orderData, orderId?)`: receives the collected order data plus the id when in edit mode
- `onCancel`: optional cancel handler (shown only in edit mode or when provided)

Quantities for product line items are stored as strings in form state for easier blank input handling; they are preserved as-is and stored in `product_details` JSON.

## Adding New Product Lines During Edit

Users can add/remove product items in any selected category while editing exactly like in create mode. Newly added items are appended to the existing `product_details` arrays.

## Future Improvements

- Validation (required fields, numeric quantities)
- Optimistic UI with rollback on error
- Toast notifications instead of alert()
- Unified type shared between dashboard Order and form OrderData

