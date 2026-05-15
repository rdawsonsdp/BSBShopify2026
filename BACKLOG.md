# BSB Theme Backlog

Active and deferred work. Update as items complete or new ones surface.

## Bugs / investigate

- **Product modal opens with empty body** — screenshot 2026-05-14 21:18 shows the modal overlay + sticky "ADD TO CART" bar but no product detail rendered. Dev log shows no `/products/*.js` fetch in that window, so the click may have triggered the modal without firing the load. Need browser console output to diagnose. Suspect candidates: recent filmstrip code in `populate()`, or `bsb:open-product-modal` listener.
- **Add-to-cart 502 (dev only)** — intermittent `Failed to proxy request to /cart/add.js with status 502` from the Shopify CLI dev proxy. Friendly error message already in place. Re-verify against deployed theme preview before treating as a real bug.
- **Resend notification not firing** — latest `events_inquiries` row has `email_sent_at = null`. Check the row's `email_error`; likely missing/expired `RESEND_API_KEY` env var on the `submit-event-inquiry` edge function.

## Data hygiene

- **Tag same-day products** — "Available same day, in-store" category on `/collections/available-for-pickup` shows zero items because no products in the collection are tagged `same-day` / `sameday` / `same day`. Either (a) tag the products or (b) widen the matcher in `sections/collection-menu.liquid`.

## Deferred features

- **Admin app for event requests** — write path is confirmed (`public.events_inquiries`). Volume is currently 2 rows; revisit when triage in the Supabase dashboard becomes painful. Likely target: standalone web app with Supabase Auth + RLS.
- **Birthdays page push** — `/pages/birthdays` admin record exists; template lives only in dev theme. Run `shopify theme push --unpublished` once content is final.
- **Cake delivery copy** — keep all copy pickup-only until delivery launches; flip the wording when the operational pieces are live.

## Polish

- **Product image filmstrip on small viewports** — verify the new thumb row reads cleanly on a phone; may want a fade-mask on the right edge to hint at scroll.
- **Banner soft-hue tuning** — current grain + sheen feels right on cream; review on darker banner backgrounds (the maroon / brown variants) and dial opacity if needed.
