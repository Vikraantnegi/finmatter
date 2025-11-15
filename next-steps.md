End-to-End Plan (Card Entry → Email → Statement Parsing)

1. Card Detection & Entry (FE + BE)

Frontend
Client-side detection utility:
Pattern-based brand detection for visa/mastercard/amex/diners/rupay/discover/maestro.
Luhn validation and network-specific length errors.
Dynamic formatting: default 4x4, switch to 4-6-5 for Amex.
Add-card flow:
Show detected network icon + text.
Remove CVV input & flip UI; collect only number, name, expiry.
Debounced BIN call → /api/cards/bin-lookup.
Store any successful BIN response locally/and in a db so you don’t re-hit the API within the same session.

Backend
/api/cards/bin-lookup:
Validate 6-digit BIN.
Try internal cache (bin_lookup). If miss, call BinList with retry/backoff.
Normalize bank names via slug mapping; if slug matches banks, return bankId, else just return slug.
Always cache BinList results (single BIN rows). Mark source binlist_api.

/api/cards POST:
Use pattern/Luhn server-side as safety.
No CVV handling.
Record whether the bank/network came from user selection or BIN.
Update cards table to drop cvv_encrypted column when you get to migrations.

2. Statement Upload & Parsing

Frontend
New page/flow Upload Statement (already in Card Details):
Select card/bank (or “unknown”).
Upload PDF (drag-drop/file picker).
Show upload progress & parsing status.
Display parse summary (billing period, due date, transaction count) once backend responds.
Statement list page: show past uploads, status (pending/success/failed), link to parsed transactions.

Backend
Migrations:
statements (id, user_id, card_id?, bank_slug, file_path, billing_period_start/end, due_date, total_due, status, error_log).
transactions (id, user_id, card_id?, statement_id, txn_date, merchant, amount, type, currency, raw_text, parsed_via).

Endpoint POST /api/statements/upload:
Accept multipart PDF.
Store raw file in Supabase Storage.
Call parser (sync for now).
Upsert statement + transactions.
Return summary/errors.

Parser service (packages/cc-engine):
BaseParser (pdf → text, helper regex).
Implement HdfcParser, IciciParser, AmexParser first.
Standard output: last4, billing period, due date, totals, transactions array.
Incomplete data should return errors array but still log raw transactions that matched.

Database
migrations to add new statements/transactions tables.
Link statements to cards when possible (by matching last4 + bank).
Add indexes on transactions (user_id, txn_date) etc.

3. Email Integration (after upload flow works)

Frontend
Settings screen for linking Gmail:
Button “Connect Gmail” → OAuth popup.
Show connection status, last sync, manual sync trigger.
Banner on dashboard prompting connection if not linked.

Backend
Tables: email_connections (user_id, provider, refresh_token, last_sync), email_sync_logs.
Endpoints:
POST /api/email/connect (start OAuth, store encrypted tokens).
POST /api/email/sync (fetch last N days, parse transaction alerts, push into transactions with source='email').
Parsing logic:
Start with plain-text HTML parsing for HDFC/ICICI/Amex alert emails (regex similar to statement parser but for email templates).
Deduplicate by message_id + txn_id.
When an email references a statement PDF, store it for later manual download.
Execution Order (to “hit it off the ground”)

Day 1-2: Implement FE client detection + format + manual selectors. Remove CVV from UI + API (including migrations).
Day 3-4: Backend BIN endpoint improvements (slug mapping + caching). Add local cache on FE. Release new add-card flow.
Week 2: Build parser package (HDFC → ICICI → Amex). Add statement tables + upload API + FE upload screen. Start collecting PDFs from yourself.
Week 3: Once parsing stable, auto-link parsed statements to cards and show them in UI.
Week 4: Add Gmail connection flow + backend sync endpoints to automate statement ingestion. Use parsed emails to enrich metadata/BIN ranges.
Following this keeps a clean progression: card entry becomes reliable, you start collecting real statements, and you lay groundwork for email automation—without depending on the old, untrusted metadata. When you’re ready to implement, switch me to agent mode and we’ll execute step-by-step.
