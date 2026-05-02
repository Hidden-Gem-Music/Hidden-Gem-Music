# Navigation & Dashboard Changelog

Summary of all changes made to wire up the Dashboard screen and year dropdown.

---

## Files Changed

- `App.tsx`
- `src/screens/DashboardScreen.web.tsx`

`AppHeader.tsx`, `DashboardScreen.tsx`, and `DashboardScreen.native.tsx` required no changes.

---

## Changes

### App.tsx — Wired `onChangeYear` to `DashboardScreen`

The `onChangeYear` prop was never passed to `DashboardScreen` in the dashboard stack screen. Because the dropdown is conditionally rendered only when `onChangeYear` is defined, it never mounted and only the plain year text was shown.

**Before:**
```tsx
<Stack.Screen name="dashboard">
  {() => <DashboardScreen year={selectedYear} metrics={dashboardMetrics} countries={countries} />}
</Stack.Screen>
```

**After:**
```tsx
<Stack.Screen name="dashboard">
  {() => (
    <DashboardScreen
      year={selectedYear}
      metrics={dashboardMetrics}
      countries={countries}
      onChangeYear={(y: number) => handleYearChange(y, "Dashboard")}
    />
  )}
</Stack.Screen>
```

The `y: number` annotation was also required to satisfy TypeScript strict mode (ts(7006) implicit any error).

---

### `DashboardScreen.web.tsx` — Added `onChangeYear` to `Props`

On web, React Native resolves `DashboardScreen.web.tsx` instead of `DashboardScreen.tsx`. The web file's `Props` type was missing `onChangeYear`, which caused a ts(2322) type error in `App.tsx`.

**Before:**
```tsx
export type Props = {
  year: number;
  metrics: Array<{ label: string; value: string; detail: string }>;
  countries: Country[];
};
```

**After:**
```tsx
export type Props = {
  year: number;
  metrics: Array<{ label: string; value: string; detail: string }>;
  countries: Country[];
  onChangeYear?: (year: number) => void;
};
```

The prop is optional and unused in the web version — it is accepted and ignored, which is intentional since the web dashboard does not include a `YearDropdown` component.

---

## Root Cause Summary

The year dropdown in `DashboardScreen` is guarded by:

```tsx
{onChangeYear ? <YearDropdown ... /> : <Text>{year}</Text>}
```

Because `App.tsx` never passed `onChangeYear`, the condition was always false and the dropdown never rendered. The fix was simply passing the prop, consistent with how every other screen in the app handles year changes.