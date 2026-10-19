/**
 * Admin URL space. The admin deliberately does not live at /admin, and no
 * public page, sitemap or robots.txt entry links here. This is not a security
 * control on its own (every admin page and action still checks the session and
 * role); it just keeps the sign-in page out of reach of casual scanners.
 */
export const ADMIN_LOGIN_PATH = "/syscon/login/admin";
export const ADMIN_HOME_PATH = "/syscon/admin";
