# School information

No school-specific handling procedures, contacts, or disposal destinations have been supplied or verified. The app displays an explicit awaiting-approval state.

After the school supplies approval, add entries to `pwa/school-info.js`, then rebuild. Each published entry must have all six fields:

```js
{ title: 'Title supplied by the school',
  detail: 'Exact approved procedure or contact information',
  status: 'approved',
  approvedBy: 'Approving school office',
  reviewedOn: 'YYYY-MM-DD',
  source: 'School document title and reference' }
```

Do not include personal contact details without permission. Entries without complete approval metadata are not displayed. Approval metadata is entered by the app maintainer; it is not independently authenticated by HIPOS. Confirm revisions with the school and remove outdated information. Rebuild and reconnect devices to receive changes; offline copies can be out of date.
