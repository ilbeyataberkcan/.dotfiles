---
name: project_registration_category_model
description: TMMAF registration category step = 1 weight × N branches per discipline; federation rules + age-date + level-gate caveats
metadata: 
  node_type: memory
  type: project
  originSessionId: 9d26bc4a-6034-46bb-a54f-a8f81c399312
---

Registration "Kategori" step model (2026-06-23, grounded in TMMAF rules research of mmafederasyonu.org.tr "Amatör MMA Müsabaka Talimatı"):

**Model:** per discipline an athlete picks ONE weight class (gender × age × weight — hard eligibility) and ONE OR MORE branches/levels. Branches ARE the intensity/level tiers (seed: Grappling=Sv1, Light=2, Full=3, Elit=4, Profesyonel=4), gated by `branch.minLevel`, VERIFIED AT APPROVAL (athlete level isn't in their profile — declared via license). Weight classes are NOT branch-scoped (`weightClass.branchId` null). A registration line = (branchId, weightClassId); multiple branches share the one weight. NO schema migration (registration unique index (athlete,event,branch,weightClass) already supports it).

**The ONE hard rule (verbatim MADDE):** "Sporcular yalnızca bir (1) kilo kategorisinde müsabakalara katılabilecektir" → ONE weight class per discipline. Enforced client (single-select) + server guard (host-flow-actions step-category: one distinct weightClassId per discipline). Multiple branches/levels are NOT prohibited (rules contemplate multiple bouts; 24h cap ≤9 rounds/≤45 min, ≥2h rest) — it's allowed by design.

**Age reference date = EVENT START DAY** (operator-chosen; rules don't codify one but "18 yaşından gün alan" leans actual-date). `ageAtEventStart` (UTC, registration-eligibility.ts) — matches the doc minor-gate. Firm derived rule: 18-irreversibility (a Genç who fights Büyükler at 18 can't return to Genç) — NOT yet implemented.

**CAVEATS / unresolved (confirm with federation before encoding):**
- Level→branch threshold mapping is UNPUBLISHED (the "Sv 1-3 vs 4+" mapping is search-engine folklore, NOT in the official DOM). Only safe facts: levels exist, federation-assigned, declared via license, max equivalency-exam level 3, Commission exam beyond 3. Full/Elit are adults-only (18+); Light/Grappling down to age 7.
- Rules describe 1 MMA discipline + 4 branches; operator's seed runs 3 disciplines (MMA Amatör, MMA Pro, UWW Pankration) — legit (Pankration is UWW-governed, separate ruleset).
- Eligibility gate to add later (MADDE 9): that-year visaed MMA license + level + amatör kimlik + **Kick Boks license**, not banned; under-18 needs aile taahhütnamesi dated weigh-in day; KO-quarantine blocks.

Shared seam `lib/registration-eligibility.ts::resolveCategoryDisciplineGroups` feeds BOTH the RSC injector (registration-step-data) AND the server guard (host-flow-actions) so display/acceptance never diverge. See [[project_flow_validation_channel]], [[project_cve_core_flow_field_model]] (selected_lines_json is the engine-safe JSON-string transport), [[project_catalog_weight_scoping_model]].
