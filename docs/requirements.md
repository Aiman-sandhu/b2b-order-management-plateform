# Requirements

## Stakeholder
A small distributor: customers place orders, admins manage stock and order status.

## Scope
Auth, products, cart, orders with invoices, status workflow, audit logs.
Out of scope: payments, shipping integration, frontend.

## Success Metrics
- Stock never goes negative, even with concurrent orders
- A failed order changes nothing (full rollback)
- Only admins can change products and order status

## Acceptance Criteria
1. Customer can register, login, add to cart, place an order and get an invoice
2. Admin-only routes return 403 for customers
3. Insufficient stock returns 400 and nothing is changed
4. Invalid status transitions return 400
5. Every order and product change is recorded in the audit log