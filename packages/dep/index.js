// workspace source of the same package name (v2) - linked, so Vite should inline it
export const version = '2.0.0'
// import.meta.env only exists when Vite transforms this file
export const loadedBy = import.meta.env ? 'vite (inlined)' : 'node (externalized)'
