# Memory Index

## Active / current state
- [Matchday controls milestone: matchmaking rules, bye spread, ring lifecycle, scheduling locks, export overhaul (COMMITTED, push pending)](project_matchday_controls_milestone.md) — 7 commits 8eac468..b588701 on feat/summary-lock-warning, USER pushes (sync, no PR); 0045 applied locally, needed on deploy; ready-at-mint fix ends first-round select deadlock; concurrent session's license-test edits left uncommitted
- [Tasks 1-4: lock warnings, list-confirmation semantics, weigh-in step, weigh-in overhaul (ALL COMMITTED)](project_summary_lock_and_list_confirmation.md) — feat/summary-lock-warning off ce92a32, 6 commits, user pushes; local staging STALE; flow v29; migration 0044 applied locally + JOURNAL lesson; latent use-ring-state freeze fixed in shared hook; test-new-systems approved + weigh-in residue
- [Passkey login consent gate + userId-bound audit](project_passkey_login_consent_gate.md) — post-passkey consent Dialog every login (KVKK); migration 0043 hand-authored; UNCOMMITTED, operator db:migrate + staging test pending
- [Agreement locations + iOS DOB fix](project_agreement_locations_and_ios_dob.md) — admin-configurable agreement placement + login checkboxes; iOS date picker fix; UNCOMMITTED, seed:storage-file-types pending
- [Federation Platform — EXECUTED 2026-07-08, 12 phases merged](project_federation_platform_spec_pack.md) — migrations 0029–0038 applied; OPERATOR TODO: MAIL_TRANSPORT→smtp, referee-role grant, screenshots, worktree cleanup; milestone-end publish+unlink reminder
- [Registrant import admin UI](project_registrant_import_admin.md) — .xlsx → pending registrations in applications board; LEVEL 5/6 + Phase 4 open
- [Invite-link step-up fix + invite card](project_invite_link_step_up_fix.md) — COMMITTED; PENDING cve-user-management 11.1.0 publish + pin bump
- [Create-user dialog broken by dual cve-core](project_create_user_cve_core_split.md) — link: pulls 2nd cve-core → split FlowContext; publish pkg then pin
- [Event-creation wizard rebuild (flow v3)](project_event_creation_wizard_rebuild.md) — 7-step flow, Leaflet map, draft-first; S0 backend done
- [Weigh-in referee portal](project_weigh_in_referee_portal.md) — /weigh-in/:eventId render-engine block; weigh_in table 0028; dark instrument design
- [DB driver abstraction debt](project_db_driver_abstraction_debt.md) — ~23 getDrizzle() call sites bypass CoreDriver; deferred
- [Event permissions hardening (deferred)](project_event_permissions_hardening.md) — route gates via StrictPermissionResolver + server-authoritative registry pending
- [Phase 7 defers registration-day doc handling](project_phase7_registration_day_doc_handling_deferred.md) — on-site doc tools = later event-management work
- [GHA Node 20 deprecation](project_gha_node20_deprecation.md) — bump actions before 2026-09-16 removal
- [Captcha rejections are unaudited](project_captcha_rejections_unaudited.md) — add audit emission for CAPTCHA_REQUIRED/FAILED
- [tmmaf TODO: docker cred helper](tmmaf-todo-docker-cred-helper.md) — encrypt VPS GHCR token via pass; remind later
- [tmmaf prelaunch live db read-only](tmmaf-prelaunch-live-db-readonly.md) — switch live DB GUI to ilbey_ro before real data
- [RBAC admin:access durability gap](project_rbac_admin_access_durability_gap.md) — fix on feat/export-and-admin-durability, pending operator tests + merge
- [cve-auth revokeSessions patch](project_cve_auth_revokesessions_patch.md) — local bun patch; upstream to cve-auth then drop
- [cve-auth version drift](project_cve_auth_version_drift.md) — local 10.1.2 vs published 10.1.3; don't republish from local

## Working rules (feedback)
- [Fix ALL severity levels of review findings](feedback_fix_all_severity_findings.md) — never filter to crit/high
- [Model/effort + ponytail staffing matrix](feedback_model_effort_ponytail_matrix.md) — Opus implements, Fable specs/reviews; ponytail is a plugin; in every executor prompt
- [Ultracode = Workflow tool, GSD plan→execute](feedback_ultracode_gsd_plan_execute.md) — 1 planning + 1 execution workflow, not ad-hoc Agents
- [Architecture before tests (HARD)](feedback_architecture_before_tests.md) — tests are a regression net after
- [Client is a dumb reflection, never authority](feedback_client_is_dumb_reflection.md) — no client-side business gates; server decides
- [Analyze top-down, fix system-wide](feedback_fix_properly_system_wide.md) — no one-off patches
- [Never reset the DB](feedback_never_reset_db.md) — only idempotent version-bumped seeds; row cleanup is user's authority
- [Never `next build` while dev server runs](feedback_no_build_while_dev_running.md) — build with server down, clean-restart
- [Run Playwright via sub-agents](feedback_playwright_via_subagent.md) — delegate the drive, view only decisive shots
- [Spot-check revisions](feedback_revision_verification.md) — targeted greps over fresh full verifier
- [Visual analyzers are weak](feedback_visual_analyzers_weak.md) — don't trust sub-agent screenshot PASS; operator confirms
- [Keep comments short](feedback_concise_comments.md) — one line max; rationale in commit messages
- [Minimal change to native inputs](feedback_minimal_change_native_inputs.md) — don't replace native controls the user likes
- [Bitwarden gates SSH pushes](feedback_bitwarden_ssh_agent.md) — publickey failure = missed approval; hand push to user
- [TMMAF client deck framing](feedback_tmmaf_deck_audience.md) — federation cares brand/blockers/asks, not internals
- [Host custom CSS is allowed](feedback_host_custom_css_allowed.md) — when Tailwind can't express it
- [No hairline outlines](feedback_no_hairline_outlines.md) — separation = elevation only
- [Evolve the design skill as we progress](feedback_evolve_skill_as_we_progress.md) — fold directives into synapse-core-design-system skill
- [Never drop annotations](feedback_never_drop_annotations.md) — distinct content never skipped; per-target fixes
- [Preview HTMLs are element ground truth](feedback_preview_html_is_element_ground_truth.md) — docs/tmmaf-design-system previews define what to build

## Domain models & conventions
- [Registration category model](project_registration_category_model.md) — 1 weight × N branches/discipline; branches=level gates; age at event-start
- [Registration flow IS the primary sign-up](project_registration_flow_is_signup.md) — full profile in-flow, Turkish-only interim
- [Catalog weight scoping model](project_catalog_weight_scoping_model.md) — weights per (discipline→age→gender); branches aren't a weight dim
- [Phase 7.2 catalog re-normalization](project_phase72_catalog_renormalization.md) — normalized catalog + per-line registration; supersedes 7.1 ([Phase 7.1 shape](project_phase71_plan.md))
- [Club affiliation feature](project_club_affiliation_feature.md) — search-or-create combobox + Ferdi sentinel
- [Per-application doc review redesign](project_per_application_doc_review_redesign.md) — docs reviewed ONCE per (athlete,event); per-category status; one finalize mail
- [Deferrable payment + pre-payment approval](project_deferrable_payment_pre_payment_approval.md) — mint rows at summary, not settlement
- [step-confirm Complete button + resume-first re-init](project_payment_confirm_complete_button.md) — Başvuruyu Tamamla never charges; settlement webhook-only
- [Payment redirect closed-tab fix](project_payment_redirect_closed_tab_fix.md) — settlement-hook canceled→fail-park; subscribe checkout.session.expired
- [Email templates clean-replacement](project_email_templates_redesign.md) — shared lib/email/ layout; R1/R2 need real per-category rows
- [Date format lock dd.mm.yyyy](project_date_format_lock.md) — Turkish dates everywhere; format-date.ts + DateField
- [Sign-up agreements + rename-safe seedKey](project_signup_agreements_and_seedkey.md) — welcome gated agreements; host seed_key
- [Catalog clean-slate reseed + purge](project_catalog_clean_slate_reseed.md) — idempotent seedCatalog in Dockerfile seeder; purge-catalog.ts dry-run/--confirm
- [Storage document model redesign](project_storage_document_model_redesign.md) — owner-scoped vault + registration snapshots as versions; LIVE
- [Storage permission redesign](project_storage_permission_redesign.md) — cve-storage 0.2.0 action-level perms + host integration bugs
- [trainingSince is an experience bracket](project_trainingsince_is_experience_bracket.md) — TEXT '3+'|'1-3'|'<1', NOT a year
- [Review app is a gated design tool](project_review_loop_gated_design_tool.md) — approve stages in order; approved designs → seedable trees
- [Light & dark both first-class](project_light_dark_both_first_class.md) — cve packages never assume a mode
- [Accent/status ramp 50/100 tone-down](project_ramp_5010_both_modes.md) — cap at ramp level in BOTH modes
- [graphify scope = code + docs only](project_graphify_scope_code_and_docs.md) — allowlist app/db/docs/lib/scripts; never .planning

## Platform gotchas (cve + Next + flows)
- [Flow-island field wiring checklist](project_flow_island_field_wiring_checklist.md) — new field needs fields[] + version bump + prefill + hydration + terminal
- [Flow validation must use fieldErrors not throw](project_flow_validation_channel.md) — throws redact to neutral banner
- [Flow advance button gates on chrome requireFields](project_flow_advance_button_requirefields.md) — host chrome config, not tree required
- [cve-core flow terminal rendering](project_cve_core_flow_terminal_rendering.md) — done screens must be a parked flow-step
- [cve-core flow: no object step-field](project_cve_core_flow_field_model.md) — serialize JSON-string-in-text or persist out-of-band
- [cve-auth init ordering](project_cve_auth_init_ordering.md) — await lazy auth() before getAuth()
- [cve-auth authz model](reference_cve_auth_authz_model.md) — grant-based union, never reads PermissionRegistry; wildcards deprecated
- [cve-auth 13 org upgrade wiped live roles](project_cve_auth_13_org_role_wipe.md) — NEVER db:push on live; re-grant heals
- [cve-admin shell slots](reference_cve_admin_shell_slots.md) — only 5 coarse zones by exact key
- [cve-design-system z-utilities bug](project_cve_design_system_z_utilities.md) — Tailwind v4 needs @utility for z-*; fixed 10.1.1
- [Client bundle server-import poison](project_client_bundle_server_import_poison.md) — 'use client' importing getDrizzle-adjacent modules → "Can't resolve fs"
- [Auth split-brain → neutral edge guard](project_auth_marker_proxy_split_brain.md) — fixed cve-auth 10.1.6, deployed
- [In-modal file preview](project_file_preview_viewer.md) — self-hosted pdfjs worker (never CDN — PII)
- [cve-core peer dep + bun isolated linker](project_bun_dual_cve_core_store.md) — one store copy invariant
- [cve release path](project_cve_release_path.md) — gate with bun run build; tier-ordered local publish; changeset peer-cascade overrides
- [GHP token sourcing](project_ghp_token_sourcing.md) — project .npmrc shadows ~/.npmrc → 401; export token
- [cve vitest zod inline + concurrency](project_cve_vitest_zod_concurrency.md) — server.deps.inline:['zod'] + --concurrency=1
- [cve next/* vitest red baseline](project_cve_next_vitest_resolution.md) — inline cve UI pkgs + next/* stub host-side
- [CI: PGlite DB tests local-only](project_ci_db_tests_local_only.md) — GITHUB_ACTIONS gate; turbo passThroughEnv
- [GSD roadmap verb miscounts](project_gsd_roadmap_verb_miscount.md) — own STATE/ROADMAP centrally

## Ops (tmmaf)
- [tmmaf Drizzle migration ops](project_tmmaf_drizzle_migration_ops.md) — agents author + operator runs db:migrate; hand-authored SQL needs a _journal.json entry; verify via Drizzle Studio
- [tmmaf test baseline needs docker](tmmaf-test-baseline-needs-docker.md) — tmmaf_pg + tmmaf_mailpit up, else ~25 env failures
- [tmmaf deploy hostnames](tmmaf-deploy-hostnames.md) — live=fighterscore.com, staging=staging.fighterscore.com; WEBAUTHN_RP_ID exact-host
- [Local payments need stripe listen](project_dev_stripe_webhook_forwarder.md) — no forwarder = intents stuck pending
- [Playwright dev-testing recipe](tmmaf-playwright-dev-testing.md) — Firefox playwright-core@1.60.0; magic-link via Mailpit :8026; ?device=mobile
- [Password-auth milestone](project_password_auth_milestone.md) — landed 2026-06-10; 2 open MEDIUMs
- [Identifier-first milestone](project_identifier_first_milestone.md) — landed 2026-06-11; prod reCAPTCHA keys TODO
