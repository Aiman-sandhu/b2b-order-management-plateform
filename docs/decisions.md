# Decision Log

| Decision | Why |
|---|---|
| Guarded `updateMany` for stock | Check and decrement in one query avoids race conditions |
| `$transaction` for orders | All steps succeed or none do |
| Price copied into OrderItem | Old orders keep their price if the product price changes |
| Decimal for money | Floats cause rounding errors |
| Register always creates CUSTOMER | Prevents self-assigned admin |
| Same error for wrong email/password | Prevents email enumeration |
| Audit logs inside transactions | Logs roll back with the order |