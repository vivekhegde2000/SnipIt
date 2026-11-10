import { z } from 'zod'

/**
 * The Content Security Policy forbids eval. zod probes `new Function` the first time a schema is
 * created unless `jitless` is set, and schemas are created while modules load (packages/shared).
 * This module is therefore the FIRST import of `main.tsx`: ES modules evaluate their imports in
 * order, so the setting is in place before any schema exists. (Setting it in main's body was too
 * late: the probe failed safely, but every start-up logged a CSP violation.)
 */
z.config({ jitless: true })
