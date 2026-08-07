# User flows

## Discover and inspect

Visitors can search localized product names and descriptions, filter by category, sort by featured score, price, or rating, then open a native product-detail dialog. Empty results and image failures remain understandable.

## Build a cart

Adding a product updates the compact header count and the cart drawer. Quantities respect synthetic inventory, persist in local storage, and can be decreased, removed, or reset. Malformed storage is discarded safely. The synthetic subtotal is educational and there is no checkout.

## Compare recommendations

The cart feeds five precomputed strategies. Cart products and unavailable inventory are excluded; sparse or failed artifacts fall back to deterministic popularity. Each result explains why it appeared. The evaluation section reports held-out synthetic metrics and links the behavior to the offline architecture and limitations.

## Change context

English and Spanish routes preserve the same functionality. Light, dark, and system theme choices persist locally. On mobile, filters stack above the catalog and the cart becomes a full-height drawer; native dialogs provide focus containment and restoration.
