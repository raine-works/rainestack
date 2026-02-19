# Temporal API

This guide covers the **Temporal API** for modern date/time handling in RaineStack, replacing the legacy `Date` object with a timezone-aware, immutable API.

---

## Table of Contents

- [Overview](#overview)
- [Why Temporal?](#why-temporal)
- [Installation](#installation)
- [Core Concepts](#core-concepts)
- [Usage with Prisma](#usage-with-prisma)
- [Common Operations](#common-operations)
- [Best Practices](#best-practices)

---

## Overview

RaineStack uses the **Temporal API** polyfill throughout the entire stack for all date/time operations. The Temporal API is a modern JavaScript proposal that provides:

- **Timezone awareness** — First-class support for timezones
- **Immutability** — Operations return new instances
- **Type safety** — Clear types for dates, times, and durations
- **Precision** — Nanosecond precision
- **Clarity** — Explicit, easy-to-understand API

### Temporal vs Date

| Feature | Date | Temporal |
|---------|------|----------|
| **Timezone awareness** | ❌ | ✅ |
| **Immutability** | ❌ | ✅ |
| **Type safety** | ❌ | ✅ |
| **API clarity** | ❌ | ✅ |
| **Arithmetic** | Limited | Rich |
| **Parsing** | Inconsistent | Standards-based |

---

## Why Temporal?

### Problems with Date

```javascript
// ❌ Date is mutable
const date = new Date();
date.setHours(5); // Mutates the original!

// ❌ Date has confusing month indexing
new Date(2024, 0, 1); // January 1st (month is 0-indexed)

// ❌ Date arithmetic is cumbersome
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);

// ❌ Timezone handling is painful
const utc = new Date().toISOString(); // Converts to UTC string
```

### Benefits of Temporal

```javascript
// ✅ Temporal is immutable
const instant = Temporal.Now.instant();
const later = instant.add({ hours: 5 }); // Returns new instance

// ✅ Temporal has clear month numbering
Temporal.PlainDate.from({ year: 2024, month: 1, day: 1 }); // January 1st

// ✅ Temporal arithmetic is intuitive
const tomorrow = Temporal.Now.plainDateISO().add({ days: 1 });

// ✅ Temporal handles timezones properly
const instant = Temporal.Now.instant();
const iso = instant.toString(); // ISO-8601 with timezone
```

---

## Installation

### Polyfill Import

Every application entry point must import the polyfill first:

```typescript
// packages/web/src/main.tsx
import '@rainestack/tools/temporal-polyfill';

// Now Temporal is available globally
const instant = Temporal.Now.instant();
```

### Utilities Import

Import conversion utilities from `@rainestack/tools/temporal`:

```typescript
import { toInstant, toDate, toISO, toISOOrNull } from '@rainestack/tools/temporal';
```

---

## Core Concepts

### Temporal.Instant

**Represents:** A fixed point in time (with timezone)

**Use for:** Timestamps, precise moments

```typescript
// Current time
const now = Temporal.Now.instant();

// From ISO string
const instant = Temporal.Instant.from('2024-01-15T10:30:00Z');

// From epoch milliseconds
const instant = Temporal.Instant.fromEpochMilliseconds(Date.now());

// To ISO string
instant.toString(); // "2024-01-15T10:30:00Z"

// To epoch milliseconds
instant.epochMilliseconds; // 1705318200000
```

### Temporal.PlainDate

**Represents:** A calendar date (no time, no timezone)

**Use for:** Birthdays, holidays, deadlines

```typescript
// Today's date
const today = Temporal.Now.plainDateISO();

// Specific date
const date = Temporal.PlainDate.from({ year: 2024, month: 1, day: 15 });
const date = Temporal.PlainDate.from('2024-01-15');

// Date arithmetic
const tomorrow = today.add({ days: 1 });
const lastWeek = today.subtract({ weeks: 1 });

// Comparison
today.equals(tomorrow); // false
today.compare(tomorrow); // -1 (today is before tomorrow)
```

### Temporal.PlainDateTime

**Represents:** A date and time (no timezone)

**Use for:** Local events, wall-clock time

```typescript
// Current local date/time
const now = Temporal.Now.plainDateTimeISO();

// Specific date/time
const dt = Temporal.PlainDateTime.from({
  year: 2024,
  month: 1,
  day: 15,
  hour: 10,
  minute: 30
});

// From string
const dt = Temporal.PlainDateTime.from('2024-01-15T10:30:00');
```

### Temporal.Duration

**Represents:** A length of time

**Use for:** Intervals, expiration times

```typescript
// Create duration
const duration = Temporal.Duration.from({ hours: 2, minutes: 30 });

// Add to instant
const later = instant.add(duration);

// Subtract from instant
const earlier = instant.subtract({ days: 7 });

// Human-readable
duration.toString(); // "PT2H30M"
```

---

## Usage with Prisma

### Conversion Utilities

RaineStack provides utilities to convert between Prisma's `Date` and Temporal's `Instant`:

```typescript
import { toInstant, toDate, toISO, toISOOrNull } from '@rainestack/tools/temporal';
```

### Prisma → Temporal (for reading)

```typescript
// Convert Prisma Date to Temporal.Instant
const user = await db.user.findUnique({ where: { id } });
const createdAt = toInstant(user.createdAt);
//    ^? Temporal.Instant

// Use Temporal operations
const age = Temporal.Now.instant().since(createdAt);
console.log(`Account created ${age.days} days ago`);
```

### Temporal → Prisma (for writing)

```typescript
// Convert Temporal.Instant to Prisma Date
const expiresAt = toDate(
  Temporal.Now.instant().add({ minutes: 10 })
);

await db.otpCode.create({
  data: {
    code: '123456',
    expiresAt // Date object for Prisma
  }
});
```

### Converting for API responses

```typescript
// Convert Prisma Date to ISO-8601 string
const post = await db.post.findUnique({ where: { id } });

return {
  ...post,
  createdAt: toISO(post.createdAt),
  updatedAt: toISO(post.updatedAt),
  publishedAt: toISOOrNull(post.publishedAt) // Handles null
};
```

### Utility Reference

| Function | Input | Output | Use Case |
|----------|-------|--------|----------|
| `toInstant(date)` | `Date` | `Temporal.Instant` | Read from database |
| `toDate(instant)` | `Temporal.Instant` | `Date` | Write to database |
| `toISO(date)` | `Date` | `string` | API response (non-null) |
| `toISOOrNull(date)` | `Date \| null` | `string \| null` | API response (nullable) |

---

## Common Operations

### Current Time

```typescript
// Current instant (with timezone)
const now = Temporal.Now.instant();

// Current date (calendar day)
const today = Temporal.Now.plainDateISO();

// Current date/time (wall-clock)
const nowLocal = Temporal.Now.plainDateTimeISO();
```

### Arithmetic

```typescript
const instant = Temporal.Now.instant();

// Add time
const later = instant.add({ hours: 2, minutes: 30 });
const tomorrow = instant.add({ days: 1 });

// Subtract time
const earlier = instant.subtract({ weeks: 1 });
const yesterday = instant.subtract({ days: 1 });

// Date arithmetic
const date = Temporal.Now.plainDateISO();
const nextWeek = date.add({ weeks: 1 });
const lastMonth = date.subtract({ months: 1 });
```

### Comparison

```typescript
const instant1 = Temporal.Instant.from('2024-01-15T10:00:00Z');
const instant2 = Temporal.Instant.from('2024-01-15T11:00:00Z');

// Equality
instant1.equals(instant2); // false

// Comparison (-1, 0, or 1)
Temporal.Instant.compare(instant1, instant2); // -1 (instant1 is before instant2)

// Duration between
const duration = instant2.since(instant1);
duration.hours; // 1
```

### Formatting

```typescript
const instant = Temporal.Now.instant();

// ISO-8601 string
instant.toString(); // "2024-01-15T10:30:00Z"

// Epoch milliseconds
instant.epochMilliseconds; // 1705318200000

// Epoch seconds
instant.epochSeconds; // 1705318200

// Custom formatting (convert to PlainDateTime first)
const dateTime = instant.toZonedDateTimeISO('America/New_York');
const formatted = dateTime.toPlainDate().toString(); // "2024-01-15"
```

### Parsing

```typescript
// From ISO string
const instant = Temporal.Instant.from('2024-01-15T10:30:00Z');

// From date string
const date = Temporal.PlainDate.from('2024-01-15');

// From object
const instant = Temporal.Instant.fromEpochMilliseconds(1705318200000);
const date = Temporal.PlainDate.from({ year: 2024, month: 1, day: 15 });
```

### Validation

```typescript
// Check if valid
try {
  const date = Temporal.PlainDate.from('2024-02-30'); // Invalid!
} catch (error) {
  console.error('Invalid date');
}

// Check expiration
const expiresAt = toInstant(token.expiresAt);
const isExpired = Temporal.Now.instant().compare(expiresAt) > 0;

if (isExpired) {
  throw new Error('Token expired');
}
```

---

## Best Practices

### 1. Always Use Temporal in Application Logic

```typescript
// ✅ Good — Temporal API
const expiresAt = Temporal.Now.instant().add({ minutes: 10 });

// ❌ Bad — Date object
const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
```

### 2. Convert at Boundaries

Convert between `Date` and `Temporal.Instant` only at boundaries (database, API):

```typescript
// ✅ Good — convert at boundary
const user = await db.user.findUnique({ where: { id } });
const createdAt = toInstant(user.createdAt); // Convert once
const age = Temporal.Now.instant().since(createdAt); // Use Temporal

// ❌ Bad — mixing Date and Temporal
const user = await db.user.findUnique({ where: { id } });
const age = Date.now() - user.createdAt.getTime(); // Using Date
```

### 3. Use Appropriate Types

Choose the right Temporal type for your use case:

```typescript
// ✅ Instant — precise timestamp with timezone
const createdAt = Temporal.Now.instant();

// ✅ PlainDate — calendar date without time
const birthday = Temporal.PlainDate.from('1990-05-15');

// ✅ PlainDateTime — local date/time without timezone
const meetingTime = Temporal.PlainDateTime.from('2024-01-15T14:00:00');

// ❌ Wrong type — using Instant for a calendar date
const birthday = Temporal.Now.instant(); // Should be PlainDate!
```

### 4. Handle Timezones Explicitly

```typescript
// ✅ Good — explicit timezone handling
const instant = Temporal.Now.instant();
const nyTime = instant.toZonedDateTimeISO('America/New_York');

// ❌ Bad — implicit local timezone
const date = new Date(); // What timezone is this?
```

### 5. Use ISO Strings for API Responses

```typescript
// ✅ Good — consistent ISO-8601 strings
return {
  createdAt: toISO(user.createdAt),
  updatedAt: toISO(user.updatedAt)
};

// ❌ Bad — inconsistent formats
return {
  createdAt: user.createdAt.toISOString(),
  updatedAt: user.updatedAt.toLocaleDateString() // Different format!
};
```

### 6. Use Duration for Time Math

```typescript
// ✅ Good — clear duration
const duration = Temporal.Duration.from({ hours: 2, minutes: 30 });
const later = instant.add(duration);

// ❌ Bad — magic numbers
const later = instant.add({ milliseconds: 9000000 }); // What is this?
```

### 7. Compare Times with .compare()

```typescript
// ✅ Good — use compare
const isExpired = Temporal.Instant.compare(
  Temporal.Now.instant(),
  expiresAt
) > 0;

// ❌ Bad — comparing strings
const isExpired = instant.toString() > expiresAt.toString();
```

---

## Summary

The Temporal API in RaineStack provides:

- ✅ **Timezone-aware** date/time handling
- ✅ **Immutable** operations (no surprising mutations)
- ✅ **Type-safe** conversions with Prisma
- ✅ **Clear, intuitive** API for date arithmetic
- ✅ **Standards-based** ISO-8601 formatting

By using Temporal throughout your application, you avoid the pitfalls of the legacy `Date` object and build more maintainable, correct date/time handling.

---

**Next Steps:**
- [Database Guide](./database.md) — Date/time columns in Prisma
- [API Development](./api.md) — Serializing dates for APIs
- [Error Handling](./error-handling.md) — Handling date validation errors