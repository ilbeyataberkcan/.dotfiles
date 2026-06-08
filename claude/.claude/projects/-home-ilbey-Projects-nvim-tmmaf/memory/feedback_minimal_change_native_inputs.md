---
name: feedback_minimal_change_native_inputs
description: "When asked to tweak a UI element, make the minimal change — don't replace a native control the user is happy with"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 386459f1-fa44-4839-b6b8-f676b278e752
---

The user asked to "swap the order of days and months" on the registration DOB field. Instead of a minimal change I replaced the native `<input type="date">` with a custom masked text input + validation helpers. The user was frustrated: "Why did you change the date input field. It was the way I wanted. All you had to do was swap the order." I reverted to the native input.

**Why:** Replacing a working native control the user already liked is over-engineering — it loses the native date picker UX and adds surface area, for a request that was a small tweak.

**How to apply:** When asked to tweak an existing UI element, make the smallest change that satisfies the ask; preserve native controls unless explicitly told to replace them. Note the real constraint plainly instead of silently swapping: a native `<input type="date">`'s day/month display order is set by the browser/OS locale and cannot be forced via HTML attributes — so "force dd/mm regardless of locale" genuinely requires a custom field, which is a trade-off to surface, not assume. Relates to [[feedback_fix_properly_system_wide]] (right altitude) and the user's anti-overengineering stance.
