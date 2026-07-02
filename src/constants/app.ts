export const APP_NAME = 'nurukk'

export function appCopyright(year = new Date().getFullYear()) {
  return `© ${year} ${APP_NAME}`
}
