# Known Issues

- POS sale payload shape mismatch and related fixes — see `plans/14_POS_FIXES.md`.

## Resolved
- ~~Income by event and expense breakdown shown in the All tab~~ — charts now
  only render on the Income/Expenses tabs (`FinanceChart.js`)
- ~~Finance transaction list missing QR/cash indicator~~ — payment method pill
  added to `TransactionCard.js`
- ~~Dashboard pills load slowly and stretch transaction cards~~ — fixed with
  `minHeight` on the card (`DashboardScreen.js`)
