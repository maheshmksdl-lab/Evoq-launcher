/*
 * Local-development conveniences. Every flag here is hard-wired to "off" whenever
 * NODE_ENV is "production" (which includes Vercel production AND preview builds),
 * so setting these environment variables on a deployment has no effect.
 */

const isProduction = () => process.env.NODE_ENV === "production"

/** Admins may sign in without two-factor (they can still enrol, and enrolled accounts are still asked). */
export const devAdminMfaOptional = () => !isProduction() && process.env.DEV_ADMIN_MFA_OPTIONAL === "true"

/** Creates/refreshes the local test accounts on server start (password from DEV_TEST_PASSWORD). */
export const devSeedTestAccounts = () => !isProduction() && process.env.DEV_SEED_TEST_ACCOUNTS === "true"
